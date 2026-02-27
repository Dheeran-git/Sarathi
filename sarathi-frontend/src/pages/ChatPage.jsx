import React, { useState, useCallback, useEffect } from 'react';
import ProgressSteps from '../components/chat/ProgressSteps';
import ChatPanel from '../components/chat/ChatPanel';
import InputBar from '../components/chat/InputBar';
import ResultsPanel from '../components/chat/ResultsPanel';
import { checkEligibility, saveCitizen } from '../utils/api';
import { stateChips, categoryChips } from '../data/citizenConfig';
import { useCitizen } from '../context/CitizenContext';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { useVoiceInput } from '../hooks/useVoiceInput';

/**
 * ChatPage — full citizen chat interface with simulated conversation.
 */
const FLOW_QUESTIONS = {
  hi: [
    { key: 'name', question: 'नमस्ते! मैं सारथी हूँ। आपकी सहायता करूंगा।\n\nसबसे पहले, आपका शुभ नाम क्या है?', options: null },
    { key: 'age', question: 'धन्यवाद! अब बताइए — आपकी उम्र कितनी है?', options: null },
    { key: 'state', question: 'अच्छा! आप किस राज्य में रहते हैं?', options: stateChips },
    { key: 'income', question: 'आपकी मासिक आय लगभग कितनी है? (₹ में)', options: ['₹0-₹3,000', '₹3,000-₹8,000', '₹8,000-₹15,000', '₹15,000+'] },
    { key: 'category', question: 'आपका सामाजिक वर्ग क्या है?', options: categoryChips },
    { key: 'family', question: 'परिवार में कौन-कौन है? (उदाहरण: पत्नी, 2 बच्चे)', options: ['अकेला/अकेली', 'पति-पत्नी', 'पति-पत्नी + बच्चे', 'विधवा + बच्चे'] },
  ],
  en: [
    { key: 'name', question: 'Hello! I am Sarathi. I will help you.\n\nFirst, what is your name?', options: null },
    { key: 'age', question: 'Thank you! Now tell me — how old are you?', options: null },
    { key: 'state', question: 'Great! Which state do you live in?', options: stateChips },
    { key: 'income', question: 'What is your approximate monthly income? (in ₹)', options: ['₹0-₹3,000', '₹3,000-₹8,000', '₹8,000-₹15,000', '₹15,000+'] },
    { key: 'category', question: 'What is your social category?', options: categoryChips },
    { key: 'family', question: 'Who is in your family? (e.g., spouse, 2 children)', options: ['Single', 'Married', 'Married + Children', 'Widow + Children'] },
  ],
};

function ChatPage() {
  // Bug fix: use real context hooks instead of stub variables
  const { citizenProfile, updateProfile, setEligibleSchemes } = useCitizen();
  const { language } = useLanguage();
  const T = (key) => t(key, language);
  // Bug fix: derive questions from actual language, not hardcoded 'hi'
  const questions = FLOW_QUESTIONS[language] || FLOW_QUESTIONS.en;

  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [matchedSchemes, setMatchedSchemes] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  // Bug fix: wire voice input hook so mic button actually works
  const { state: voiceState, toggleListening } = useVoiceInput({
    onTranscript: (text) => {
      if (text && text.trim()) {
        handleSend(text.trim());
      }
    },
    language: language === 'hi' ? 'hi-IN' : 'en-IN',
  });
  const isRecording = voiceState === 'listening' || voiceState === 'processing';

  // Re-translate messages when language changes
  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.stepKey) {
          const q = questions.find((q) => q.key === msg.stepKey);
          if (q) {
            return {
              ...msg,
              text: msg.options ? undefined : q.question,
              question: msg.options ? q.question : undefined,
              options: msg.options ? q.options : undefined,
            };
          }
        }
        if (msg.isFinal) {
          return {
            ...msg,
            text: language === 'hi'
              ? `बहुत बढ़िया! मैंने आपके लिए ${matchedSchemes.length} योजनाएं ढूंढी हैं। 🎉\n\nकुल अनुमानित वार्षिक लाभ: ₹${matchedSchemes.reduce((s, sc) => s + (sc.annualBenefit || 0), 0).toLocaleString('en-IN')}`
              : `Great! I found ${matchedSchemes.length} schemes for you. 🎉\n\nTotal estimated annual benefit: ₹${matchedSchemes.reduce((s, sc) => s + (sc.annualBenefit || 0), 0).toLocaleString('en-IN')}`,
          };
        }
        return msg;
      })
    );
  }, [language, questions, matchedSchemes]);

  const processAnswer = useCallback(
    (answer) => {
      // 1. Capture current flow state directly
      const currentStep = step;
      const currentQuestion = questions[currentStep];
      if (!currentQuestion) return;

      // 2. Compute Context Updates
      const updates = {};
      switch (currentQuestion.key) {
        case 'name': updates.name = answer; break;
        case 'age': updates.age = parseInt(answer, 10) || 0; break;
        case 'state': updates.state = answer; break;
        case 'income': {
          const incomeMap = { '₹0-₹3,000': 2000, '₹3,000-₹8,000': 5000, '₹8,000-₹15,000': 12000, '₹15,000+': 20000 };
          updates.income = incomeMap[answer] || parseInt(answer.replace(/[^\d]/g, ''), 10) || 5000;
          break;
        }
        case 'category': updates.category = answer; break;
        case 'family': {
          // Bug fix: check both Hindi and English family option strings
          const isAlone = answer.includes('अकेला') || answer === 'Single';
          const hasChildren = answer.includes('बच्चे') || answer.includes('Children');
          const isWidow = answer.includes('विधवा') || answer.includes('Widow');
          updates.familySize = isAlone ? 1 : hasChildren ? 4 : 2;
          if (isWidow) { updates.isWidow = true; updates.gender = 'female'; }
          break;
        }
        default: break;
      }

      // 3. Fire all side-effects *outside* of any React state updater callback
      updateProfile(updates);
      addMessage({ type: 'user', text: answer, timestamp: 'JUST_NOW' });
      setIsThinking(true);

      // 4. Update core progression state
      const nextStep = currentStep + 1;
      setStep(nextStep);

      // 5. Defer the Sarathi response
      setTimeout(() => {
        setIsThinking(false);
        if (nextStep < questions.length) {
          // Ask next question
          const next = questions[nextStep];
          const msgType = next.options ? 'sarathi-question' : 'sarathi';
          addMessage({
            type: msgType,
            text: next.options ? undefined : next.question,
            question: next.options ? next.question : undefined,
            options: next.options,
            onOptionSelect: () => {
              // remove chips from the current question so it can't be clicked again
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, options: null } : m
                )
              );
            },
            stepKey: next.key,
            timestamp: 'JUST_NOW',
          });
        } else {
          // Done! Call live eligibility API
          setIsThinking(true);
          const apiProfile = {
            age: updates.age ?? citizenProfile.age ?? 30,
            gender: updates.gender ?? citizenProfile.gender ?? 'any',
            monthlyIncome: updates.income ?? citizenProfile.income ?? 5000,
            isWidow: updates.isWidow ?? citizenProfile.isWidow ?? false,
            occupation: updates.occupation ?? citizenProfile.occupation ?? 'any',
            category: updates.category ?? citizenProfile.category ?? 'General',
          };

          checkEligibility(apiProfile)
            .then((result) => {
              // Bug fix: 'schemes' was undefined — use empty array as fallback
              const matched = result.matchedSchemes || [];
              setMatchedSchemes(matched);
              setEligibleSchemes(matched);
              setIsThinking(false);

              addMessage({
                type: 'sarathi',
                isFinal: true,
                text: language === 'hi'
                  ? `बहुत बढ़िया! मैंने आपके लिए ${matched.length} योजनाएं ढूंढी हैं। 🎉\n\nकुल अनुमानित वार्षिक लाभ: ₹${(result.totalAnnualBenefit || matched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0)).toLocaleString('en-IN')}`
                  : `Great! I found ${matched.length} schemes for you. 🎉\n\nTotal estimated annual benefit: ₹${(result.totalAnnualBenefit || matched.reduce((s, sc) => s + (sc.annualBenefit || 0), 0)).toLocaleString('en-IN')}`,
                timestamp: 'JUST_NOW',
              });

              setTimeout(() => setShowResults(true), 500);

              // Save citizen profile to DynamoDB (fire and forget)
              saveCitizen({
                name: updates.name ?? citizenProfile.name,
                age: updates.age ?? citizenProfile.age,
                gender: updates.gender ?? citizenProfile.gender ?? 'any',
                state: updates.state ?? citizenProfile.state ?? '',
                monthlyIncome: updates.income ?? citizenProfile.income ?? 0,
                category: updates.category ?? citizenProfile.category ?? 'General',
                isWidow: updates.isWidow ?? citizenProfile.isWidow ?? false,
                occupation: updates.occupation ?? citizenProfile.occupation ?? 'any',
                matchedSchemes: matched,
              }).catch(() => { /* background save — non-critical */ });
            })
            .catch(() => {
              setIsThinking(false);
              addMessage({
                type: 'sarathi',
                isFinal: false,
                text: language === 'hi'
                  ? '🔴 सर्वर से कनेक्ट नहीं हो पा रहा। कृपया कुछ देर बाद पुनः प्रयास करें।'
                  : '🔴 Could not connect to server. Please try again later.',
                timestamp: 'JUST_NOW',
              });
            });
        }
      }, 1200);
    },
    [questions, language, updateProfile, setEligibleSchemes, citizenProfile, step]
  );

  const handleSend = (text) => processAnswer(text);

  // Show the first question on mount — guard against StrictMode double-invoke
  useEffect(() => {
    if (messages.length === 0 && questions.length > 0) {
      const first = questions[0];
      setMessages([{ type: 'sarathi', text: first.question, stepKey: first.key, timestamp: 'JUST_NOW' }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickStart = () => {
    if (messages.length === 0 && questions.length > 0) {
      const first = questions[0];
      setMessages([{ type: 'sarathi', text: first.question, stepKey: first.key, timestamp: 'JUST_NOW' }]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Results panel — desktop only */}
      <div className={`hidden lg:block transition-all duration-500 overflow-hidden ${showResults ? 'w-[380px]' : 'w-0'}`}>
        <ResultsPanel schemes={matchedSchemes} visible={showResults} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-off-white">
        <ProgressSteps currentStep={step} />
        <ChatPanel
          messages={messages}
          isThinking={isThinking}
          onQuickStart={handleQuickStart}
        />
        {/* Bug fix: voice is now wired through useVoiceInput hook */}
        <InputBar
          onSend={handleSend}
          isRecording={isRecording}
          onToggleRecording={toggleListening}
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
