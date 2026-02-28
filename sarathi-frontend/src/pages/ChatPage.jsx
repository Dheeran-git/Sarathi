import { useState, useCallback, useEffect, useRef } from 'react';
import ProgressSteps from '../components/chat/ProgressSteps';
import ChatPanel from '../components/chat/ChatPanel';
import InputBar from '../components/chat/InputBar';
import ResultsPanel from '../components/chat/ResultsPanel';
import { schemes } from '../data/mockSchemes';
import { checkEligibility, notifyPanchayat, sendToLex } from '../utils/api';
import { useCitizen } from '../context/CitizenContext';
import useVoiceInput from '../hooks/useVoiceInput';

/**
 * ChatPage — Uses the REAL Amazon Lex SarathiBot for conversation.
 * Lex bot has 8 slots. 
 */

// Slots matching the en_US Lex bot configuration
const LEX_SLOT_ORDER = ['age', 'monthlyIncome', 'citizenState', 'GenderType'];
const STEP_LABELS_EN = ['Age', 'Income', 'State', 'Gender'];

function ChatPage() {
  const { citizenProfile, updateProfile, setEligibleSchemes } = useCitizen();

  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [matchedSchemes, setMatchedSchemes] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Sync state and ref so callbacks don't go stale
  const [conversationDone, setConversationDoneState] = useState(false);
  const conversationDoneRef = useRef(false);
  const setConversationDone = (val) => {
    conversationDoneRef.current = val;
    setConversationDoneState(val);
  };

  const sessionIdRef = useRef('web-' + Date.now());
  const isLiveModeRef = useRef(false);
  const sendMessageRef = useRef(null);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const updateStep = useCallback((slots) => {
    let step = 0;
    for (const slotName of LEX_SLOT_ORDER) {
      if (slots[slotName]) step++;
      else break;
    }
    setCurrentStep(step);
  }, []);

  const updateProfileFromSlots = useCallback((slots) => {
    const updates = {};
    if (slots.age) updates.age = parseInt(slots.age, 10) || 0;
    if (slots.monthlyIncome) updates.income = parseInt(slots.monthlyIncome, 10) || 5000;
    if (slots.citizenState) updates.state = slots.citizenState;
    if (slots.GenderType) updates.gender = slots.GenderType?.toLowerCase();

    // Legacy names
    if (slots.citizenName) updates.name = slots.citizenName;
    if (slots.category) updates.category = slots.category;
    if (slots.isWidow) updates.isWidow = ['yes'].includes(slots.isWidow?.toLowerCase());
    if (slots.occupation) updates.occupation = slots.occupation;

    updateProfile(updates);
  }, [updateProfile]);

  // Handle transcript from the voice hook
  const handleVoiceTranscript = useCallback((text) => {
    if (text && !conversationDoneRef.current && sendMessageRef.current) {
      sendMessageRef.current(text);
    }
  }, []);

  const { state: voiceState, transcript: liveTranscript, startListening, toggleListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    language: 'en-IN'
  });

  const isRecording = voiceState === 'listening';

  // Explicit tracking for starting/stopping Live Mode
  const handleToggleRecording = () => {
    if (voiceState === 'idle') {
      isLiveModeRef.current = true;
    } else {
      isLiveModeRef.current = false;
    }
    toggleListening();
  };

  // Speaks the bot message out loud and resumes the microphone
  const speakAndResume = useCallback((text, shouldResume = true) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    // Strip emojis out of text to prevent weird TTS reading
    const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}\u2728]/gu, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';

    // Anti-Garbage-Collection hack for Chrome
    window.__utterances = window.__utterances || [];
    window.__utterances.push(utterance);

    const onComplete = () => {
      // Remove from global array
      const index = window.__utterances.indexOf(utterance);
      if (index !== -1) window.__utterances.splice(index, 1);

      // If we are in live mode, automatically turn mic back on!
      if (shouldResume && isLiveModeRef.current && !conversationDoneRef.current) {
        startListening();
      }
    };

    utterance.onend = onComplete;
    utterance.onerror = onComplete;

    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  // Run eligibility check after Lex collects all fields
  const runEligibilityCheck = useCallback(async () => {
    setIsThinking(true);
    setConversationDone(true);

    const apiProfile = {
      age: citizenProfile.age || 30,
      gender: citizenProfile.gender || 'any',
      monthlyIncome: citizenProfile.income || 5000,
      isWidow: citizenProfile.isWidow || false,
      occupation: citizenProfile.occupation || 'any',
      category: citizenProfile.category || 'General',
    };

    const flushResults = (matchedSchemesParam, totalBenefit) => {
      setMatchedSchemes(matchedSchemesParam);
      setEligibleSchemes(matchedSchemesParam);
      setIsThinking(false);

      const msg = `Great! I found ${matchedSchemesParam.length} schemes for you. 🎉\n\nTotal estimated annual benefit: ₹${totalBenefit.toLocaleString('en-IN')}`;
      addMessage({
        type: 'sarathi',
        isFinal: true,
        text: msg,
        timestamp: 'JUST_NOW',
      });

      if (isLiveModeRef.current) {
        speakAndResume(msg, false); // Audio loop completes here, no resume
      }
      setTimeout(() => setShowResults(true), 500);
    };

    try {
      const result = await checkEligibility(apiProfile);
      const matched = result.matchedSchemes || schemes.slice(0, 6);
      const totalBenefit = result.totalAnnualBenefit || matched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0);

      flushResults(matched, totalBenefit);

      notifyPanchayat({
        citizenName: citizenProfile.name || 'Unknown',
        panchayatId: 'rampur-barabanki-up',
        matchedSchemes: matched,
        totalAnnualBenefit: totalBenefit,
      }).catch(() => { });

    } catch {
      const matched = schemes.slice(0, 6);
      const totalBenefit = matched.reduce((s, sc) => s + sc.annualBenefit, 0);
      flushResults(matched, totalBenefit);
    }
  }, [citizenProfile, setEligibleSchemes, speakAndResume]);

  const sendMessageToLex = useCallback(async (text, showUserMsg = true, overrideLocale = null) => {
    if (showUserMsg) {
      addMessage({ type: 'user', text, timestamp: 'JUST_NOW' });
    }
    setIsThinking(true);

    try {
      const locale = overrideLocale || 'en_US';
      const result = await sendToLex(text, sessionIdRef.current, locale);

      setIsThinking(false);

      if (result.slots) {
        updateProfileFromSlots(result.slots);
        updateStep(result.slots);
      }

      const isFullfilled = result.intentState === 'ReadyForFulfillment' && result.intentName === 'CollectProfile';
      const isClosed = result.dialogState === 'Close' && result.intentName === 'CollectProfile' && result.intentState !== 'Failed';

      if (isFullfilled || isClosed) {
        const msg = result.message || 'Great! Finding your schemes...';
        addMessage({
          type: 'sarathi',
          text: msg,
          timestamp: 'JUST_NOW',
        });
        setCurrentStep(LEX_SLOT_ORDER.length);

        if (isLiveModeRef.current) {
          speakAndResume(msg, false); // Let it read before running eligibility checks
        }

        runEligibilityCheck();
      } else {
        addMessage({
          type: 'sarathi',
          text: result.message,
          timestamp: 'JUST_NOW',
        });

        if (isLiveModeRef.current) {
          speakAndResume(result.message, true); // True: Resume Mic!
        }
      }
    } catch (err) {
      console.warn('[ChatPage] Lex API failed:', err);
      setIsThinking(false);
      const msg = 'Sorry, connection issue. Please try again.';
      addMessage({
        type: 'sarathi',
        text: msg,
        timestamp: 'JUST_NOW',
      });
      if (isLiveModeRef.current) speakAndResume(msg, false);
    }
  }, [updateProfileFromSlots, updateStep, runEligibilityCheck, speakAndResume]);

  // Update ref so handleVoiceTranscript always has latest function
  useEffect(() => {
    sendMessageRef.current = sendMessageToLex;
  }, [sendMessageToLex]);

  // Override live mode if user manually types
  const handleSend = (text) => {
    if (conversationDoneRef.current) return;
    isLiveModeRef.current = false;
    sendMessageToLex(text);
  };

  const stepLabels = STEP_LABELS_EN;
  const totalSteps = LEX_SLOT_ORDER.length;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Results panel — desktop only */}
      <div className={`hidden lg:block transition-all duration-500 overflow-hidden ${showResults ? 'w-[380px]' : 'w-0'}`}>
        <ResultsPanel schemes={matchedSchemes} visible={showResults} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-off-white">
        <ProgressSteps currentStep={currentStep} labels={stepLabels} totalSteps={totalSteps} />
        <ChatPanel
          messages={messages}
          isThinking={isThinking}
        />
        <InputBar
          onSend={handleSend}
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          disabled={conversationDone}
          liveTranscript={liveTranscript}
        />
      </div>

      {/* Results panel — mobile bottom sheet */}
      {showResults && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 mx-auto mt-2 mb-1" />
          <ResultsPanel schemes={matchedSchemes} visible={showResults} />
        </div>
      )}
    </div>
  );
}

export default ChatPage;
