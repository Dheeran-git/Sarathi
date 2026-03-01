import { useState, useCallback, useEffect, useRef } from 'react';
import ProgressSteps from '../components/chat/ProgressSteps';
import ChatPanel from '../components/chat/ChatPanel';
import InputBar from '../components/chat/InputBar';
import ResultsPanel from '../components/chat/ResultsPanel';
import { allSchemes } from '../data/schemesDB';
import { checkEligibility, notifyPanchayat } from '../utils/api';
import { useCitizen } from '../context/CitizenContext';
import { useLanguage } from '../context/LanguageContext';
import useVoiceInput from '../hooks/useVoiceInput';
import {
  CORE_QUESTIONS,
  PERSONA_QUESTION,
  BRANCH_QUESTIONS,
  FEMALE_BRANCH_QUESTIONS,
  URBAN_BRANCH_QUESTIONS,
  RURAL_BRANCH_QUESTIONS,
  getNextQuestion,
  parseAnswer,
  profileToEligibilityPayload,
} from '../data/questionFlow';

/* ── Frontend Fallback Eligibility Engine ────────────────────────────── */
function localFallbackMatch(profile) {
  return allSchemes.filter(scheme => {
    const conds = scheme.conditions || {};

    // 1. State check
    const schemeStates = Array.isArray(scheme.state) ? scheme.state : [scheme.state || 'All'];
    if (profile.state && !schemeStates.includes('All')) {
      if (!schemeStates.includes(profile.state)) return false;
    }

    // 2. Age check
    if (conds.ageMin && profile.age < conds.ageMin) return false;
    if (conds.ageMax && profile.age > conds.ageMax) return false;

    // 3. Income check
    if (conds.incomeMax && profile.income > conds.incomeMax) return false;

    // 4. Gender check
    if (conds.gender && profile.gender && profile.gender !== 'any') {
      if (!conds.gender.includes(profile.gender)) return false;
    }

    // 5. Category check
    if (conds.category && profile.category && profile.category !== 'General') {
      if (!conds.category.includes(profile.category)) return false;
    }

    // 6. Boolean flags
    const flags = ['isWidow', 'disability', 'pregnant', 'landOwned', 'shgMember'];
    for (const flag of flags) {
      if (conds[flag] === true && profile[flag] !== true) return false;
    }

    // 7. Urban / Rural check
    if (conds.urban !== undefined) {
      const isUrban = profile.urban === 'urban' || profile.urban === true;
      if (conds.urban !== isUrban) return false;
    }

    // 8. Persona / Occupation checks
    if (conds.persona && profile.persona) {
      if (!conds.persona.includes(profile.persona)) return false;
    }
    if (conds.occupation && profile.occupation && profile.occupation !== 'any') {
      if (!conds.occupation.includes(profile.occupation)) return false;
    }

    return true;
  });
}

/* ── Phase labels for progress bar ──────────────────────────────────── */
const PHASE_LABELS_EN = ['Core Profile', 'Persona', 'Details', 'Results'];
const PHASE_LABELS_HI = ['मूल प्रोफ़ाइल', 'व्यक्तित्व', 'विवरण', 'परिणाम'];

function ChatPage() {
  const { citizenProfile, updateProfile, setEligibleSchemes, saveCurrentProfile } = useCitizen();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [matchedSchemes, setMatchedSchemes] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Dynamic question flow state
  const [localProfile, setLocalProfile] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(CORE_QUESTIONS.length + 1); // core + persona
  const [currentPhase, setCurrentPhase] = useState(0); // 0=core, 1=persona, 2=branches, 3=results

  // Sync state and ref so callbacks don't go stale
  const [conversationDone, setConversationDoneState] = useState(false);
  const conversationDoneRef = useRef(false);
  const setConversationDone = (val) => {
    conversationDoneRef.current = val;
    setConversationDoneState(val);
  };

  const isLiveModeRef = useRef(false);
  const sendMessageRef = useRef(null);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  /* ── Voice input ───────────────────────────────────────────────────── */
  const handleVoiceTranscript = useCallback((text) => {
    if (text && !conversationDoneRef.current && sendMessageRef.current) {
      sendMessageRef.current(text);
    }
  }, []);

  const { state: voiceState, transcript: liveTranscript, startListening, toggleListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    language: isHi ? 'hi-IN' : 'en-IN',
  });

  const isRecording = voiceState === 'listening';

  const handleToggleRecording = () => {
    if (voiceState === 'idle') {
      isLiveModeRef.current = true;
    } else {
      isLiveModeRef.current = false;
    }
    toggleListening();
  };

  const speakAndResume = useCallback((text, shouldResume = true) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}\u2728]/gu, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isHi ? 'hi-IN' : 'en-IN';
    window.__utterances = window.__utterances || [];
    window.__utterances.push(utterance);
    const onComplete = () => {
      const index = window.__utterances.indexOf(utterance);
      if (index !== -1) window.__utterances.splice(index, 1);
      if (shouldResume && isLiveModeRef.current && !conversationDoneRef.current) {
        startListening();
      }
    };
    utterance.onend = onComplete;
    utterance.onerror = onComplete;
    window.speechSynthesis.speak(utterance);
  }, [startListening, isHi]);

  /* ── Compute current phase from answered keys ──────────────────────── */
  const computePhase = useCallback((profile) => {
    const coreKeys = CORE_QUESTIONS.map((q) => q.key);
    const allCoreAnswered = coreKeys.every(
      (k) => profile[k] !== undefined && profile[k] !== null && profile[k] !== ''
    );
    if (!allCoreAnswered) return 0;
    if (!profile.persona) return 1;
    return 2;
  }, []);

  /* ── Ask the next question ─────────────────────────────────────────── */
  const askNextQuestion = useCallback((profile) => {
    const nextQ = getNextQuestion(profile);
    if (!nextQ) {
      // All questions answered → run eligibility
      return null;
    }
    setCurrentQuestion(nextQ);
    const prompt = isHi ? nextQ.promptHi : nextQ.prompt;
    addMessage({ type: 'sarathi', text: prompt, timestamp: 'JUST_NOW' });
    if (isLiveModeRef.current) speakAndResume(prompt, true);

    // Update phase
    const phase = computePhase(profile);
    setCurrentPhase(phase);

    // Recalculate total question count
    const branchQs = profile.persona && BRANCH_QUESTIONS[profile.persona]
      ? BRANCH_QUESTIONS[profile.persona].filter((q) => !q.condition || q.condition(profile))
      : [];
    const femaleQs = profile.gender === 'female'
      ? FEMALE_BRANCH_QUESTIONS.filter((q) => !q.condition || q.condition(profile))
      : [];
    const locationQs = profile.urban === true
      ? URBAN_BRANCH_QUESTIONS
      : profile.urban === false
        ? RURAL_BRANCH_QUESTIONS
        : [];
    const total = CORE_QUESTIONS.length + 1 + branchQs.length + femaleQs.length + locationQs.length;
    setTotalQuestions(total);

    return nextQ;
  }, [isHi, speakAndResume, computePhase]);

  /* ── Run eligibility check ─────────────────────────────────────────── */
  const runEligibilityCheck = useCallback(async (profile) => {
    setIsThinking(true);
    setConversationDone(true);
    setCurrentPhase(3);

    const apiPayload = profileToEligibilityPayload(profile);

    const flushResults = (matchedSchemesParam, totalBenefit) => {
      setMatchedSchemes(matchedSchemesParam);
      setEligibleSchemes(matchedSchemesParam);
      setIsThinking(false);

      const msg = isHi
        ? `बढ़िया! मुझे आपके लिए ${matchedSchemesParam.length} योजनाएं मिलीं। 🎉\n\nकुल अनुमानित वार्षिक लाभ: ₹${totalBenefit.toLocaleString('en-IN')}`
        : `Great! I found ${matchedSchemesParam.length} schemes for you. 🎉\n\nTotal estimated annual benefit: ₹${totalBenefit.toLocaleString('en-IN')}`;

      addMessage({ type: 'sarathi', isFinal: true, text: msg, timestamp: 'JUST_NOW' });
      if (isLiveModeRef.current) speakAndResume(msg, false);
      setTimeout(() => setShowResults(true), 500);

      // Persist profile + matched schemes to DynamoDB
      saveCurrentProfile(matchedSchemesParam)
        .then(() => {
          setProfileSaved(true);
          setTimeout(() => setProfileSaved(false), 4000);
        })
        .catch((err) => console.warn('[ChatPage] Profile save failed:', err));
    };

    try {
      const result = await checkEligibility(apiPayload);
      const matched = result.matchedSchemes && result.matchedSchemes.length > 0
        ? result.matchedSchemes
        : localFallbackMatch(profile);
      const totalBenefit = result.totalAnnualBenefit ||
        matched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0);

      flushResults(matched, totalBenefit);

      notifyPanchayat({
        citizenName: profile.name || 'Unknown',
        panchayatId: 'rampur-barabanki-up',
        matchedSchemes: matched,
        totalAnnualBenefit: totalBenefit,
      }).catch(() => { });

    } catch {
      console.warn('[ChatPage] API failed, using local fallback schemes match');
      const matched = localFallbackMatch(profile);
      const totalBenefit = matched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0);
      flushResults(matched, totalBenefit);
    }
  }, [setEligibleSchemes, speakAndResume, isHi, saveCurrentProfile]);

  /* ── Handle user answer ────────────────────────────────────────────── */
  const handleAnswer = useCallback((rawText) => {
    if (conversationDoneRef.current || !currentQuestion) return;

    // Show user message
    addMessage({ type: 'user', text: rawText, timestamp: 'JUST_NOW' });
    isLiveModeRef.current = false;

    // Parse answer
    let value = parseAnswer(currentQuestion, rawText);

    // Validate answer
    const isInvalidChoice = currentQuestion.type === 'choice' && currentQuestion.options &&
      !currentQuestion.options.some(o => o.value === value) &&
      !(currentQuestion.key === 'urban' && typeof value === 'boolean'); // urban maps to boolean below

    if (isInvalidChoice) {
      setTimeout(() => {
        const errorMsg = isHi ? 'कृपया दिए गए विकल्पों में से चुनें।' : 'Please select from the valid options.';
        addMessage({ type: 'sarathi', text: errorMsg, timestamp: 'JUST_NOW' });
        if (isLiveModeRef.current) speakAndResume(errorMsg, true);
      }, 400);
      return;
    }

    if (currentQuestion.type === 'boolean' && typeof value !== 'boolean') {
      setTimeout(() => {
        const errorMsg = isHi ? 'कृपया हाँ या ना में उत्तर दें।' : 'Please answer Yes or No.';
        addMessage({ type: 'sarathi', text: errorMsg, timestamp: 'JUST_NOW' });
        if (isLiveModeRef.current) speakAndResume(errorMsg, true);
      }, 400);
      return;
    }

    // Special handling: urban question stores as boolean
    if (currentQuestion.key === 'urban') {
      value = value === 'urban' || value === true;
    }

    // Update profiles
    const newProfile = { ...localProfile, [currentQuestion.key]: value };
    setLocalProfile(newProfile);
    updateProfile({ [currentQuestion.key]: value });
    setAnsweredCount((prev) => prev + 1);

    // Ask next question (with a slight delay for UX)
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      const nextQ = askNextQuestion(newProfile);
      if (!nextQ) {
        // All questions done — run eligibility
        const findingMsg = isHi
          ? 'बढ़िया! आपकी सभी जानकारी मिल गई। अब आपकी योजनाएं खोज रहे हैं... 🔍'
          : 'Great! All information collected. Finding your schemes now... 🔍';
        addMessage({ type: 'sarathi', text: findingMsg, timestamp: 'JUST_NOW' });
        if (isLiveModeRef.current) speakAndResume(findingMsg, false);
        runEligibilityCheck(newProfile);
      }
    }, 400);
  }, [currentQuestion, localProfile, updateProfile, askNextQuestion, runEligibilityCheck, isHi, speakAndResume]);

  // Keep ref in sync
  useEffect(() => {
    sendMessageRef.current = handleAnswer;
  }, [handleAnswer]);

  /* ── Boot: ask the first question ──────────────────────────────────── */
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = isHi
        ? 'नमस्ते! 🙏 मैं सारथी हूँ, आपका AI सहायक। मैं आपको सरकारी योजनाओं से जोड़ने में मदद करूँगा। चलिए शुरू करते हैं!'
        : 'Namaste! 🙏 I\'m Sarathi, your AI welfare assistant. I\'ll help connect you with government schemes you\'re eligible for. Let\'s get started!';
      addMessage({ type: 'sarathi', text: greeting, timestamp: 'JUST_NOW' });

      // Ask first question after greeting
      setTimeout(() => {
        askNextQuestion({});
      }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Compute quick-reply chips for current question ────────────────── */
  const quickReplies = (() => {
    if (!currentQuestion || conversationDone) return null;
    if (currentQuestion.type === 'boolean') {
      return [
        { value: 'Yes', label: 'Yes', labelHi: 'हाँ' },
        { value: 'No', label: 'No', labelHi: 'नहीं' },
      ];
    }
    if (currentQuestion.type === 'choice' && currentQuestion.options) {
      return currentQuestion.options;
    }
    return null;
  })();

  /* ── Progress ──────────────────────────────────────────────────────── */
  const stepLabels = isHi ? PHASE_LABELS_HI : PHASE_LABELS_EN;
  const totalSteps = stepLabels.length;
  const progressStep = currentPhase;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Results panel — desktop only */}
      <div className={`hidden lg:block transition-all duration-500 overflow-hidden ${showResults ? 'w-[380px]' : 'w-0'}`}>
        <ResultsPanel schemes={matchedSchemes} visible={showResults} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-[#020617]">
        <ProgressSteps currentStep={progressStep} labels={stepLabels} totalSteps={totalSteps} />

        {/* Profile Saved toast */}
        {profileSaved && (
          <div className="mx-auto mt-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-body flex items-center gap-2 animate-pulse">
            ✅ Profile Saved
          </div>
        )}

        {/* Question counter */}
        {!conversationDone && answeredCount > 0 && (
          <div className="text-center py-1">
            <span className="text-xs font-body text-slate-500">
              {isHi ? `प्रश्न ${answeredCount} / ~${totalQuestions}` : `Question ${answeredCount} / ~${totalQuestions}`}
            </span>
          </div>
        )}

        <ChatPanel messages={messages} isThinking={isThinking} language={language} />
        <InputBar
          onSend={handleAnswer}
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          disabled={conversationDone}
          liveTranscript={liveTranscript}
          quickReplies={quickReplies}
          language={language}
        />
      </div>

      {/* Results panel — mobile bottom sheet */}
      {showResults && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-[#0f172a] border border-slate-800 rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 mx-auto mt-2 mb-1" />
          <ResultsPanel schemes={matchedSchemes} visible={showResults} />
        </div>
      )}
    </div>
  );
}

export default ChatPage;
