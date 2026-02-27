import { useState, useCallback, useEffect } from 'react';
import ProgressSteps from '../components/chat/ProgressSteps';
import ChatPanel from '../components/chat/ChatPanel';
import InputBar from '../components/chat/InputBar';
import ResultsPanel from '../components/chat/ResultsPanel';
import { schemes } from '../data/mockSchemes';
import { checkEligibility } from '../utils/api';
import { stateChips, categoryChips, occupationChips, profileSteps } from '../data/mockCitizens';
import { useCitizen } from '../context/CitizenContext';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

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
  const { citizenProfile, updateProfile, setEligibleSchemes } = useCitizen();
  const { language } = useLanguage();
  const T = (key) => t(key, language);
  const questions = FLOW_QUESTIONS[language] || FLOW_QUESTIONS.hi;
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [matchedSchemes, setMatchedSchemes] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

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
              ? `बहुत बढ़िया! मैंने आपके लिए ${matchedSchemes.length} योजनाएं ढूंढी हैं। 🎉\n\nकुल अनुमानित वार्षिक लाभ: ₹${matchedSchemes.reduce((s, sc) => s + sc.annualBenefit, 0).toLocaleString('en-IN')}`
              : `Great! I found ${matchedSchemes.length} schemes for you. 🎉\n\nTotal estimated annual benefit: ₹${matchedSchemes.reduce((s, sc) => s + sc.annualBenefit, 0).toLocaleString('en-IN')}`,
          };
        }
        return msg;
      })
    );
  }, [language, questions, matchedSchemes]);

  const processAnswer = useCallback(
    (answer) => {
      const currentQuestion = questions[step];
      if (!currentQuestion) return;

      // Map user response to profile
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
          updates.familySize = answer.includes('अकेला') ? 1 : answer.includes('बच्चे') ? 4 : 2;
          if (answer.includes('विधवा')) { updates.isWidow = true; updates.gender = 'female'; }
          break;
        }
      }
      updateProfile(updates);

      // Add user response
      addMessage({ type: 'user', text: answer, timestamp: 'JUST_NOW' });

      // Simulate thinking
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        const nextStep = step + 1;
        if (nextStep < questions.length) {
          // Ask next question
          const next = questions[nextStep];
          const msgType = next.options ? 'sarathi-question' : 'sarathi';
          addMessage({
            type: msgType,
            text: next.options ? undefined : next.question,
            question: next.options ? next.question : undefined,
            options: next.options,
            onOptionSelect: (opt) => {
              // remove chips from the question
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, options: null } : m
                )
              );
              processAnswer(opt);
            },
            stepKey: next.key,
            timestamp: 'JUST_NOW',
          });
          setStep(nextStep);
        } else {
          // Done! Call live eligibility API
          setIsThinking(true);
          const apiProfile = {
            age: citizenProfile.age || 30,
            gender: citizenProfile.gender || 'any',
            monthlyIncome: citizenProfile.income || 5000,
            isWidow: citizenProfile.isWidow || false,
            occupation: citizenProfile.occupation || 'any',
            category: citizenProfile.category || 'General',
          };
          checkEligibility(apiProfile)
            .then((result) => {
              const matched = result.matchedSchemes || schemes.slice(0, 6);
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
            })
            .catch(() => {
              // Fallback to mock data if API call fails
              const matched = schemes.slice(0, 6);
              setMatchedSchemes(matched);
              setEligibleSchemes(matched);
              setIsThinking(false);

              addMessage({
                type: 'sarathi',
                isFinal: true,
                text: language === 'hi'
                  ? `बहुत बढ़िया! मैंने आपके लिए ${matched.length} योजनाएं ढूंढी हैं। 🎉\n\nकुल अनुमानित वार्षिक लाभ: ₹${matched.reduce((s, sc) => s + sc.annualBenefit, 0).toLocaleString('en-IN')}`
                  : `Great! I found ${matched.length} schemes for you. 🎉\n\nTotal estimated annual benefit: ₹${matched.reduce((s, sc) => s + sc.annualBenefit, 0).toLocaleString('en-IN')}`,
                timestamp: 'JUST_NOW',
              });

              setTimeout(() => setShowResults(true), 500);
            });
          return; // exit early — the API callback handles the rest
        }
      }, 1200);
    },
    [step, updateProfile, setEligibleSchemes]
  );

  const handleSend = (text) => processAnswer(text);
  const handleQuickStart = (chip) => {
    if (messages.length === 0) {
      // First injection
      const first = questions[0];
      addMessage({ type: 'sarathi', text: first.question, stepKey: first.key, timestamp: 'JUST_NOW' });
    }
  };

  // Start conversation automatically
  useEffect(() => {
    if (messages.length === 0) {
      const first = questions[0];
      addMessage({ type: 'sarathi', text: first.question, stepKey: first.key, timestamp: 'JUST_NOW' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <InputBar
          onSend={handleSend}
          isRecording={isRecording}
          onToggleRecording={() => setIsRecording(!isRecording)}
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
