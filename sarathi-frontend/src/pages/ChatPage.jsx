import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProgressSteps from '../components/chat/ProgressSteps';
import ChatPanel from '../components/chat/ChatPanel';
import InputBar from '../components/chat/InputBar';
import ResultsPanel from '../components/chat/ResultsPanel';
import { checkEligibility, notifyPanchayat, sendToLex } from '../utils/api';
import { useCitizen } from '../context/CitizenContext';
import { useLanguage } from '../context/LanguageContext';
import useVoiceInput from '../hooks/useVoiceInput';
import {
  CORE_QUESTIONS,
  PERSONA_QUESTION,
  BRANCH_QUESTIONS,
  FEMALE_BRANCH_QUESTIONS,
  DISABILITY_BRANCH_QUESTIONS,
  HOUSING_BRANCH_QUESTIONS,
  getNextQuestion,
  parseAnswer,
  profileToEligibilityPayload,
} from '../data/questionFlow';

// We load real schemes from /schemes.json for fallback instead of mock schemesDB
let realOfflineSchemesCache = [];

async function getFallbackSchemes() {
  if (realOfflineSchemesCache.length > 0) return realOfflineSchemesCache;
  try {
    const res = await fetch('/schemes.json');
    realOfflineSchemesCache = await res.json();
  } catch {
    // Fallback gracefully empty if file gets deleted
  }
  return realOfflineSchemesCache;
}

function getProfileTags(profile) {
  const tags = new Set();
  const p = profile;
  const persona = String(p.persona || '').toLowerCase();

  const cat = String(p.category || '').toUpperCase();
  if (['SC', 'ST', 'OBC'].includes(cat)) tags.add(cat);
  if (p.minority) tags.add('minority');

  const bpl = String(p.bplCard || '').toUpperCase();
  if (['BPL', 'AAY'].includes(bpl)) {
    tags.add('bpl');
    tags.add('poor');
  }

  const gender = String(p.gender || '').toLowerCase();
  if (gender === 'female') {
    tags.add('women');
    tags.add('girl');
    tags.add('female');
  }

  if (p.isWidow) {
    tags.add('widow');
    tags.add('destitute');
  }
  if (p.pregnant || p.lactating) {
    tags.add('pregnant');
    tags.add('maternity');
    tags.add('mother');
    tags.add('lactating');
  }

  if (p.disability) {
    tags.add('disabled');
    tags.add('disability');
    tags.add('handicapped');
    tags.add('divyang');
  }

  const age = Number(p.age || 0);
  if (age >= 60) {
    tags.add('senior citizen');
    tags.add('old age');
    tags.add('pension');
  }
  if (age > 0 && age < 18) {
    tags.add('child');
    tags.add('children');
  }

  if (persona === 'farmer' || p.landOwned) {
    tags.add('farmer');
    tags.add('agriculture');
    tags.add('kisan');
    tags.add('irrigation');
    tags.add('crop');
  }
  if (persona === 'student' || p.classLevel) {
    tags.add('student');
    tags.add('education');
    tags.add('scholarship');
    tags.add('school');
    tags.add('college');
  }
  if (persona === 'business' || p.msmeRegistered) {
    tags.add('business');
    tags.add('msme');
    tags.add('entrepreneur');
    tags.add('enterprise');
    tags.add('industry');
  }
  if (persona === 'labourer' || p.mgnregaCard || p.streetVendor) {
    tags.add('labourer');
    tags.add('worker');
    tags.add('vendor');
    tags.add('employment');
    tags.add('shramik');
  }

  if (p.shgMember) {
    tags.add('shg');
    tags.add('self help group');
  }
  if (p.kutchaHouse) {
    tags.add('housing');
    tags.add('shelter');
    tags.add('awaas');
  }

  return tags;
}

function scoreScheme(profileTags, scheme, profile) {
  let score = 0;
  const cats = scheme.categories || [];
  const schemeTags = scheme.tags || [];
  const schemeStr = [...cats, ...schemeTags].join(' ').toLowerCase();

  // Exact tag / category intersections
  profileTags.forEach(pt => {
    if (schemeStr.includes(pt.toLowerCase())) {
      score += 10;
    }
  });

  // Strict disqualifiers
  const schemeGender = String(scheme.gender || 'any').toLowerCase();
  const userGender = String(profile.gender || 'any').toLowerCase();
  if (['male', 'female'].includes(schemeGender) && ['male', 'female'].includes(userGender) && schemeGender !== userGender) {
    return -1; // hard disqualify
  }

  const minAge = Number(scheme.minAge || 0);
  const maxAge = Number(scheme.maxAge || 99);
  const userAge = Number(profile.age || 0);
  if (userAge > 0 && (userAge < minAge || userAge > maxAge)) {
    return -1;
  }

  return score;
}

async function localFallbackMatch(profile) {
  const profileTags = getProfileTags(profile);
  const scored = [];

  const allSchemes = await getFallbackSchemes();

  allSchemes.forEach(scheme => {
    if (scheme.status !== 'Published') return;
    const s = scoreScheme(profileTags, scheme, profile);
    if (s >= 10) {
      scored.push({ score: s, scheme });
    }
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.scheme.annualBenefit || 0) - (a.scheme.annualBenefit || 0);
  });

  return scored.slice(0, 15).map(x => x.scheme);
}

/* ── Lex V2 slot → profile key mapping ────────────────────────────── */
const LEX_SLOT_MAP = {
  Age: 'age',
  Income: 'income',
  Gender: 'gender',
  State: 'state',
  Category: 'category',
  Occupation: 'persona',
  IsWidow: 'isWidow',
  Disability: 'disability',
  Name: 'name',
};

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

  // Lex V2 integration state
  const [useLex, setUseLex] = useState(false); // Lex bot is not deployed properly, default to robust manual flow
  const [lexSessionId, setLexSessionId] = useState(() => `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [lexFailed, setLexFailed] = useState(false);

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

  // E1: Memory leak cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      window.__utterances = [];
    };
  }, []);

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
    const disabilityQs = profile.disability === true
      ? DISABILITY_BRANCH_QUESTIONS.filter((q) => !q.condition || q.condition(profile))
      : [];
    const housingQs = HOUSING_BRANCH_QUESTIONS.filter((q) => !q.condition || q.condition(profile));
    const total = CORE_QUESTIONS.length + 1 + branchQs.length + femaleQs.length + disabilityQs.length + housingQs.length;
    setTotalQuestions(total);

    return nextQ;
  }, [isHi, speakAndResume, computePhase]);

  /* ── Run eligibility check ─────────────────────────────────────────── */
  const runEligibilityCheck = useCallback(async (profile) => {
    setIsThinking(true);
    setConversationDone(true);
    setCurrentPhase(3);

    const apiPayload = profileToEligibilityPayload(profile);

    // All citizens go to the single panchayat in the system
    const panchayatId = localProfile.panchayatId
      || citizenProfile?.panchayatId
      || 'unassigned';

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
      saveCurrentProfile(matchedSchemesParam, { panchayatId })
        .then(() => {
          setProfileSaved(true);
          setTimeout(() => setProfileSaved(false), 4000);
        })
        .catch((err) => console.warn('[ChatPage] Profile save failed:', err));
    };

    // LOCAL-FIRST APPROACH: Always run local matching first (guaranteed)
    let localMatched = [];
    try {
      localMatched = await localFallbackMatch(profile);
    } catch (e) {
      console.warn('[ChatPage] Local fallback failed:', e);
    }

    // Now try the API as an enhancement
    try {
      const withTimeout = (promise, ms) => Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
      ]);

      const result = await withTimeout(checkEligibility(apiPayload), 15000);
      const apiMatched = result?.matchedSchemes || [];

      // Use API results if they returned more schemes, else use local
      const matched = apiMatched.length > 0 ? apiMatched : localMatched;
      const totalBenefit = (apiMatched.length > 0 && result.totalAnnualBenefit)
        ? result.totalAnnualBenefit
        : matched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0);

      flushResults(matched, totalBenefit);

      notifyPanchayat({
        type: 'unenrolled_alert',
        panchayatId,
        citizenCount: matched.length,
        schemeName: matched[0]?.nameEnglish || matched[0]?.name || 'multiple schemes',
        subject: `New citizen registered — ${profile.name || 'Unknown'} (${matched.length} schemes)`,
      }).catch(() => { });

    } catch (err) {
      console.warn('[ChatPage] API failed, using local results:', err?.message);
      const totalBenefit = localMatched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0);
      flushResults(localMatched, totalBenefit);
    }
  }, [setEligibleSchemes, speakAndResume, isHi, saveCurrentProfile]);

  /* ── Lex V2 handler: sends message to Lex bot for guided slot-filling ── */
  const handleLexMessage = useCallback(async (rawText) => {
    if (conversationDoneRef.current) return;

    addMessage({ type: 'user', text: rawText, timestamp: 'JUST_NOW' });
    setIsThinking(true);

    try {
      const locale = isHi ? 'hi_IN' : 'en_US';
      const lexResp = await sendToLex(rawText, lexSessionId, locale);

      const botMessage = lexResp.message || lexResp.allMessages?.[0] || '';
      const dialogState = lexResp.dialogState || '';
      const slots = lexResp.slots || {};
      const intentState = lexResp.intentState || '';

      // Map filled slots to citizen profile
      const profileUpdates = {};
      for (const [lexSlot, value] of Object.entries(slots)) {
        const profileKey = LEX_SLOT_MAP[lexSlot];
        if (profileKey && value) {
          // Type conversions
          if (profileKey === 'age' || profileKey === 'income') {
            profileUpdates[profileKey] = parseInt(value) || value;
          } else if (profileKey === 'isWidow' || profileKey === 'disability') {
            profileUpdates[profileKey] = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
          } else {
            profileUpdates[profileKey] = value;
          }
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        const newProfile = { ...localProfile, ...profileUpdates };
        setLocalProfile(newProfile);
        updateProfile(profileUpdates);
        setAnsweredCount(prev => prev + Object.keys(profileUpdates).length);

        // Update phase based on what we know
        const phase = computePhase(newProfile);
        setCurrentPhase(phase);
      }

      setIsThinking(false);

      // Show bot response
      if (botMessage) {
        addMessage({ type: 'sarathi', text: botMessage, timestamp: 'JUST_NOW' });
        if (isLiveModeRef.current) speakAndResume(botMessage, true);
      }

      // Check if Lex has completed intent fulfillment
      if (dialogState === 'Close' || intentState === 'Fulfilled' || intentState === 'ReadyForFulfillment') {
        // Lex completed slot-filling — trigger eligibility check with collected profile
        const mergedProfile = { ...localProfile, ...profileUpdates };
        const findingMsg = isHi
          ? 'बढ़िया! सभी जानकारी मिल गई। अब आपकी योजनाएं खोज रहे हैं... 🔍'
          : 'Great! All information collected via AI assistant. Finding your schemes now... 🔍';
        addMessage({ type: 'sarathi', text: findingMsg, timestamp: 'JUST_NOW' });
        if (isLiveModeRef.current) speakAndResume(findingMsg, false);
        runEligibilityCheck(mergedProfile);
      }

    } catch (err) {
      console.warn('[ChatPage] Lex failed, falling back to local flow:', err?.message);
      setIsThinking(false);
      setLexFailed(true);
      setUseLex(false);

      // Fallback: start local question flow
      const fallbackMsg = isHi
        ? 'AI सहायक से कनेक्ट नहीं हो पाया। मैं सीधे पूछूंगा।'
        : "Couldn't connect to AI assistant. I'll ask you directly.";
      addMessage({ type: 'sarathi', text: fallbackMsg, timestamp: 'JUST_NOW' });
      setTimeout(() => askNextQuestion(localProfile), 600);
    }
  }, [lexSessionId, isHi, localProfile, updateProfile, computePhase, speakAndResume, askNextQuestion, runEligibilityCheck]);

  /* ── Handle user answer (local question flow fallback) ──────────── */
  const handleLocalAnswer = useCallback((rawText) => {
    if (conversationDoneRef.current || !currentQuestion) return;

    // Show user message
    addMessage({ type: 'user', text: rawText, timestamp: 'JUST_NOW' });
    isLiveModeRef.current = false;

    // Parse answer
    let value = parseAnswer(currentQuestion, rawText);

    // Validate answer
    const isInvalidChoice = currentQuestion.type === 'choice' && currentQuestion.options &&
      !currentQuestion.options.some(o => o.value === value) &&
      !(currentQuestion.key === 'urban' && typeof value === 'boolean');

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

  /* ── Unified message handler ──────────────────────────────────────── */
  const handleAnswer = useCallback((rawText) => {
    if (useLex && !lexFailed) {
      handleLexMessage(rawText);
    } else {
      handleLocalAnswer(rawText);
    }
  }, [useLex, lexFailed, handleLexMessage, handleLocalAnswer]);

  // Keep ref in sync
  useEffect(() => {
    sendMessageRef.current = handleAnswer;
  }, [handleAnswer]);

  /* ── Boot: greet and start flow ─────────────────────────────────── */
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const greeting = isHi
        ? 'नमस्ते! 🙏 मैं सारथी हूँ, आपका AI सहायक। मैं आपको सरकारी योजनाओं से जोड़ने में मदद करूँगा। चलिए शुरू करते हैं!'
        : "Namaste! 🙏 I'm Sarathi, your AI welfare assistant. I'll help connect you with government schemes you're eligible for. Let's get started!";
      addMessage({ type: 'sarathi', text: greeting, timestamp: 'JUST_NOW' });

      if (useLex) {
        // Send initial "hi" to Lex to trigger the guided flow
        setTimeout(() => {
          handleLexMessage(isHi ? 'नमस्ते' : 'Hi, I want to check my eligibility');
        }, 600);
      } else {
        setTimeout(() => askNextQuestion({}), 600);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Compute quick-reply chips for current question ────────────────── */
  const quickReplies = (() => {
    if (conversationDone) return null;

    // When using Lex, no local question-based chips — let Lex guide
    if (useLex && !lexFailed) return null;

    if (!currentQuestion) return null;
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
      <div className="flex-1 flex flex-col bg-off-white">
        {/* Agent Banner */}
        <Link
          to="/agent"
          className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-saffron/10 to-orange-50 border-b border-saffron/20 hover:from-saffron/15 transition-colors group"
        >
          <span className="font-body text-xs text-saffron font-medium">
            {isHi ? '✨ सारथी AI एजेंट (Beta) — मुफ़्त-प्रश्न AI' : '✨ Try Sarathi AI Agent (Beta) — Free-text AI'}
          </span>
          <span className="font-body text-xs text-saffron/70 group-hover:text-saffron transition-colors">&rarr;</span>
        </Link>

        {/* Lex indicator */}
        {useLex && !lexFailed && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-blue-50 border-b border-blue-100">
            <span className="font-body text-[11px] text-blue-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {isHi ? 'AI-गाइडेड फ़्लो (Lex V2)' : 'AI-Guided Flow (Lex V2)'}
            </span>
            <button
              onClick={() => { setUseLex(false); setLexFailed(true); askNextQuestion(localProfile); }}
              className="font-body text-[10px] text-blue-400 hover:text-blue-600 underline"
            >
              {isHi ? 'मैनुअल मोड' : 'Switch to manual'}
            </button>
          </div>
        )}

        <ProgressSteps currentStep={progressStep} labels={stepLabels} totalSteps={totalSteps} />

        {/* Profile Saved toast */}
        {profileSaved && (
          <div className="mx-auto mt-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-success text-sm font-body flex items-center gap-2 animate-pulse">
            &#10003; Profile Saved
          </div>
        )}

        {/* Question counter */}
        {!conversationDone && answeredCount > 0 && (
          <div className="text-center py-1">
            <span className="text-xs font-body text-gray-500">
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
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white border border-gray-200 rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 mx-auto mt-2 mb-1" />
          <ResultsPanel schemes={matchedSchemes} visible={showResults} />
        </div>
      )}
    </div>
  );
}

export default ChatPage;
