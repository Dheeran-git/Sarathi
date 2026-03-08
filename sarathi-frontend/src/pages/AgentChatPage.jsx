import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bot, User, ArrowLeft, Sparkles, MessageSquare, Mic, Volume2, VolumeX, Brain } from 'lucide-react';
import { invokeAgent } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useVoiceInput } from '../hooks/useVoiceInput';

const SUGGESTED_PROMPTS_EN = [
  'What schemes am I eligible for?',
  'How do I apply for PM-KISAN?',
  'How much can I earn from 3 schemes combined?',
  'What documents do I need for PMAY housing scheme?',
  'I am a widow, age 65, what pension schemes apply?',
];

const SUGGESTED_PROMPTS_HI = [
  'मैं किन योजनाओं के लिए पात्र हूँ?',
  'PM-KISAN के लिए आवेदन कैसे करें?',
  '3 योजनाओं से मुझे कितना लाभ मिल सकता है?',
  'PMAY आवास योजना के लिए कौन से दस्तावेज़ चाहिए?',
  'मैं 65 वर्ष की विधवा हूँ, कौन सी पेंशन योजनाएं मिलेंगी?',
];

// ---------------------------------------------------------------------------
// Animated dots loading component
// ---------------------------------------------------------------------------
function AnimatedDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-saffron"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Typing animation hook — reveals text character-by-character
// ---------------------------------------------------------------------------
function useTypingAnimation(fullText, speed = 12) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayed('');
      setIsDone(true);
      return;
    }

    setDisplayed('');
    setIsDone(false);
    let idx = 0;

    const interval = setInterval(() => {
      idx += 1;
      // Reveal in small bursts (2-3 chars) for a natural feel
      const step = Math.min(idx, fullText.length);
      setDisplayed(fullText.slice(0, step));
      if (step >= fullText.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [fullText, speed]);

  return { displayed, isDone };
}

// ---------------------------------------------------------------------------
// Chat message bubble with optional streaming animation
// ---------------------------------------------------------------------------
function ChatMessage({ message, isLatestAgent, onFollowupClick, onSpeakToggle, ttsEnabled }) {
  const isUser = message.role === 'user';

  // Only animate the latest agent message; show others instantly
  const shouldAnimate = !isUser && isLatestAgent && message._animate;
  const { displayed, isDone } = useTypingAnimation(
    shouldAnimate ? message.text : null,
    14
  );
  const textToShow = shouldAnimate ? displayed : message.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      {/* Profile context badge */}
      {!isUser && message.hasProfileContext && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5 mb-1.5 ml-11"
        >
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-body text-[11px]">
            <Brain size={11} />
            I remember your profile
          </span>
        </motion.div>
      )}

      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-saffron' : 'bg-navy'}`}>
          {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
        </div>
        <div className="max-w-[80%] flex flex-col">
          <div
            className={`px-4 py-3 rounded-2xl font-body text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-saffron text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
            }`}
            style={!isUser ? { fontFamily: "'Noto Sans Devanagari', sans-serif" } : {}}
          >
            {textToShow}
            {shouldAnimate && !isDone && (
              <span className="inline-block w-[2px] h-[14px] bg-saffron ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>

          {/* TTS speaker icon for agent messages */}
          {!isUser && (isDone || !shouldAnimate) && (
            <button
              onClick={() => onSpeakToggle?.(message.text)}
              className="self-start mt-1 ml-1 p-1 rounded-md text-gray-400 hover:text-saffron hover:bg-saffron/5 transition-colors"
              title={ttsEnabled ? 'Read aloud' : 'TTS disabled'}
            >
              {ttsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          )}

          {/* Follow-up suggestion pills */}
          {!isUser && message.followupSuggestions?.length > 0 && (isDone || !shouldAnimate) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap gap-1.5 mt-2"
            >
              {message.followupSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onFollowupClick?.(suggestion)}
                  className="px-3 py-1.5 rounded-full bg-saffron/10 border border-saffron/20 text-saffron font-body text-xs hover:bg-saffron/20 hover:border-saffron/40 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
function AgentChatPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const citizenId = user?.email || localStorage.getItem('userEmail') || '';
  const suggestedPrompts = isHi ? SUGGESTED_PROMPTS_HI : SUGGESTED_PROMPTS_EN;

  // --- Voice input via existing hook ---
  const voiceLang = isHi ? 'hi-IN' : 'en-IN';
  const { state: voiceState, transcript: voiceTranscript, toggleListening, isSupported: voiceSupported } = useVoiceInput({
    language: voiceLang,
    onTranscript: useCallback((text) => {
      if (text?.trim()) {
        setInput(text.trim());
      }
    }, []),
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show live transcript in input while listening
  useEffect(() => {
    if (voiceState === 'listening' && voiceTranscript) {
      setInput(voiceTranscript);
    }
  }, [voiceState, voiceTranscript]);

  // --- TTS via browser SpeechSynthesis ---
  const speak = useCallback((text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled, isHi]);

  const handleSpeakToggle = useCallback((text) => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    } else {
      speak(text);
    }
  }, [speak]);

  // --- Send message ---
  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setShowSuggestions(false);
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    // Prepend Hindi instruction if language is Hindi
    const agentMessage = isHi
      ? `Please respond in Hindi. ${userMsg}`
      : userMsg;

    try {
      const result = await invokeAgent(agentMessage, sessionId, citizenId, language);
      const agentResponse = result?.response || (isHi
        ? 'क्षमा करें, कोई उत्तर नहीं मिला। कृपया पुनः प्रयास करें।'
        : 'Sorry, no response received. Please try again.');
      setMessages((prev) => [...prev, {
        role: 'agent',
        text: agentResponse,
        followupSuggestions: result?.followupSuggestions || [],
        hasProfileContext: result?.hasProfileContext || false,
        _animate: true,
      }]);
    } catch (err) {
      const errMsg = isHi
        ? 'एजेंट से संपर्क नहीं हो पा रहा। कृपया बाद में प्रयास करें।'
        : 'Could not reach the AI agent. Please try again later.';
      setMessages((prev) => [...prev, { role: 'agent', text: errMsg, _animate: true }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleFollowupClick = (suggestion) => {
    sendMessage(suggestion);
  };

  // Determine the index of the latest agent message for typing animation
  const latestAgentIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'agent') return i;
    }
    return -1;
  })();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-off-white">
      {/* Header */}
      <div className="bg-navy px-4 py-3 flex items-center gap-3 shrink-0">
        <Link to="/chat" className="text-gray-300 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center">
          <Sparkles size={15} className="text-saffron" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-white leading-none">
            {isHi ? 'सारथी AI एजेंट' : 'Sarathi AI Agent'}
          </p>
          <p className="font-body text-xs text-gray-400 leading-tight">
            {isHi ? 'बहु-विशेषज्ञ AI सहायक' : 'Multi-specialist AI • Beta'}
          </p>
        </div>

        {/* TTS global toggle */}
        <button
          onClick={() => {
            if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
            setTtsEnabled((v) => !v);
          }}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border font-body text-xs transition-colors ${
            ttsEnabled
              ? 'border-saffron/40 text-saffron hover:bg-saffron/10'
              : 'border-white/20 text-gray-400 hover:bg-white/10'
          }`}
          title={ttsEnabled ? 'Voice output on' : 'Voice output off'}
        >
          {ttsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          {isHi ? (ttsEnabled ? 'आवाज़' : 'म्यूट') : (ttsEnabled ? 'Voice' : 'Muted')}
        </button>

        <Link
          to="/chat"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/20 text-gray-300 font-body text-xs hover:bg-white/10 transition-colors"
        >
          <MessageSquare size={13} />
          {isHi ? 'प्रश्नोत्तरी' : 'Questionnaire'}
        </Link>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Welcome state with suggestions */}
        {messages.length === 0 && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto pt-8"
          >
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-saffron to-orange-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Sparkles size={24} className="text-white" />
              </div>
              <h2 className="font-display text-2xl text-gray-900 mb-1">
                {isHi ? 'सारथी AI एजेंट' : 'Sarathi AI Agent'}
              </h2>
              <p className="font-body text-sm text-gray-500">
                {isHi
                  ? 'पात्रता, आवेदन या वित्तीय योजना के बारे में कुछ भी पूछें'
                  : 'Ask anything about eligibility, applications, or financial planning'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-body text-xs text-gray-400 uppercase tracking-wider mb-3">
                {isHi ? 'सुझाए गए प्रश्न' : 'Suggested questions'}
              </p>
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 font-body text-sm text-gray-700 hover:border-saffron/40 hover:bg-saffron-pale transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message list */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isLatestAgent={i === latestAgentIdx}
                onFollowupClick={handleFollowupClick}
                onSpeakToggle={handleSpeakToggle}
                ttsEnabled={ttsEnabled}
              />
            ))}
          </AnimatePresence>

          {/* Loading indicator — animated dots */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-4"
            >
              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <AnimatedDots />
                  <span className="font-body text-sm text-gray-500">
                    {isHi ? 'सोच रहे हैं' : 'Thinking'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice listening overlay */}
      <AnimatePresence>
        {voiceState === 'listening' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-white border border-saffron/30 shadow-xl rounded-2xl px-5 py-3 flex items-center gap-3"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="font-body text-sm text-gray-700">
              {isHi ? 'सुन रहे हैं...' : 'Listening...'}
            </span>
            {voiceTranscript && (
              <span className="font-body text-sm text-saffron italic max-w-[200px] truncate">
                {voiceTranscript}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isHi ? 'अपना प्रश्न लिखें...' : 'Ask anything about welfare schemes...'}
            disabled={isLoading}
            className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-off-white font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-saffron/50 focus:ring-2 focus:ring-saffron/10 disabled:opacity-60 transition-all"
            style={{ fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif" }}
          />

          {/* Microphone button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
              voiceState === 'listening'
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-navy/10 text-navy hover:bg-navy/20'
            }`}
            title={voiceSupported
              ? (voiceState === 'listening' ? (isHi ? 'रोकें' : 'Stop') : (isHi ? 'बोलें' : 'Speak'))
              : (isHi ? 'आवाज़ उपलब्ध नहीं' : 'Voice not available')
            }
          >
            <Mic size={16} />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-xl bg-saffron text-white flex items-center justify-center hover:bg-saffron-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="font-body text-center text-xs text-gray-400 mt-2 max-w-2xl mx-auto">
          {isHi
            ? 'AI एजेंट गलतियाँ कर सकता है। महत्वपूर्ण जानकारी के लिए आधिकारिक पोर्टल देखें।'
            : 'AI Agent can make mistakes. Verify important details at official government portals.'}
        </p>
      </div>
    </div>
  );
}

export default AgentChatPage;
