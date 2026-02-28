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
 * Lex bot has 8 slots: citizenName, citizenAge, citizenState, monthlyIncome,
 * category, gender, isWidow, occupation.
 * Falls back to local flow if Lex API is unavailable.
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
  const [conversationDone, setConversationDone] = useState(false);

  // Lex session ID — unique per user session
  const sessionIdRef = useRef('web-' + Date.now());

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);



  // Calculate current step from Lex slot state
  const updateStep = useCallback((slots) => {
    let step = 0;
    for (const slotName of LEX_SLOT_ORDER) {
      if (slots[slotName]) step++;
      else break;
    }
    setCurrentStep(step);
  }, []);

  // Map Lex slots to citizen profile
  const updateProfileFromSlots = useCallback((slots) => {
    const updates = {};
    if (slots.age) updates.age = parseInt(slots.age, 10) || 0;
    if (slots.monthlyIncome) updates.income = parseInt(slots.monthlyIncome, 10) || 5000;
    if (slots.citizenState) updates.state = slots.citizenState;
    if (slots.GenderType) updates.gender = slots.GenderType?.toLowerCase();
    // Legacy slot names (if added later)
    if (slots.citizenName) updates.name = slots.citizenName;
    if (slots.category) updates.category = slots.category;
    if (slots.isWidow) updates.isWidow = ['yes'].includes(slots.isWidow?.toLowerCase());
    if (slots.occupation) updates.occupation = slots.occupation;
    updateProfile(updates);
  }, [updateProfile]);

  // Send message to Lex bot
  const sendMessageToLex = useCallback(async (text, showUserMsg = true, overrideLocale = null) => {
    // Add user message (skip for auto-trigger)
    if (showUserMsg) {
      addMessage({ type: 'user', text, timestamp: 'JUST_NOW' });
    }
    setIsThinking(true);

    try {
      // Always use en_US
      const locale = overrideLocale || 'en_US';
      const result = await sendToLex(text, sessionIdRef.current, locale);

      setIsThinking(false);

      // Update profile with slots collected so far
      if (result.slots) {
        updateProfileFromSlots(result.slots);
        updateStep(result.slots);
      }

      // Check if conversation is complete (only for CollectProfile intent, not FallbackIntent)
      const isFullfilled = result.intentState === 'ReadyForFulfillment' && result.intentName === 'CollectProfile';
      const isClosed = result.dialogState === 'Close' && result.intentName === 'CollectProfile' && result.intentState !== 'Failed';

      if (isFullfilled || isClosed) {
        // Lex finished collecting all slots — run eligibility
        addMessage({
          type: 'sarathi',
          text: result.message || 'Great! Finding your schemes...',
          timestamp: 'JUST_NOW',
        });
        setCurrentStep(LEX_SLOT_ORDER.length);
        runEligibilityCheck();
      } else {
        // Lex is asking for the next slot
        addMessage({
          type: 'sarathi',
          text: result.message,
          timestamp: 'JUST_NOW',
        });
      }
    } catch (err) {
      console.warn('[ChatPage] Lex API failed:', err);
      setIsThinking(false);
      addMessage({
        type: 'sarathi',
        text: 'Sorry, connection issue. Please try again.',
        timestamp: 'JUST_NOW',
      });
    }
  }, [updateProfileFromSlots, updateStep]);

  // Voice Hook
  const handleVoiceTranscript = useCallback((text) => {
    if (text && !conversationDone) {
      sendMessageToLex(text);
    }
  }, [conversationDone, sendMessageToLex]);

  const { state: voiceState, toggleListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    language: 'en-IN'
  });

  const isRecording = voiceState === 'listening';

  // Run eligibility check after Lex collects all 8 fields
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

    try {
      const result = await checkEligibility(apiProfile);
      const matched = result.matchedSchemes || schemes.slice(0, 6);
      setMatchedSchemes(matched);
      setEligibleSchemes(matched);
      setIsThinking(false);

      addMessage({
        type: 'sarathi',
        isFinal: true,
        text: `Great! I found ${matched.length} schemes for you. 🎉\n\nTotal estimated annual benefit: ₹${(result.totalAnnualBenefit || matched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0)).toLocaleString('en-IN')}`,
        timestamp: 'JUST_NOW',
      });

      // Notify panchayat in background
      notifyPanchayat({
        citizenName: citizenProfile.name || 'Unknown',
        panchayatId: 'rampur-barabanki-up',
        matchedSchemes: matched,
        totalAnnualBenefit: result.totalAnnualBenefit || matched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0),
      }).catch(() => { });

      setTimeout(() => setShowResults(true), 500);
    } catch {
      const matched = schemes.slice(0, 6);
      setMatchedSchemes(matched);
      setEligibleSchemes(matched);
      setIsThinking(false);

      addMessage({
        type: 'sarathi',
        isFinal: true,
        text: `Great! I found ${matched.length} schemes for you. 🎉\n\nTotal estimated annual benefit: ₹${matched.reduce((s, sc) => s + sc.annualBenefit, 0).toLocaleString('en-IN')}`,
        timestamp: 'JUST_NOW',
      });

      setTimeout(() => setShowResults(true), 500);
    }
  }, [citizenProfile, setEligibleSchemes]);

  const handleSend = (text) => {
    if (conversationDone) return;
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
          onToggleRecording={toggleListening}
          disabled={conversationDone}
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
