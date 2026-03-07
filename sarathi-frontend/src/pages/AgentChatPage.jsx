import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bot, User, ArrowLeft, Sparkles, MessageSquare } from 'lucide-react';
import { invokeAgent } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-saffron' : 'bg-navy'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl font-body text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-saffron text-white rounded-tr-sm'
          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
      }`}
        style={!isUser ? { fontFamily: "'Noto Sans Devanagari', sans-serif" } : {}}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

function AgentChatPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const citizenId = user?.email || localStorage.getItem('userEmail') || '';
  const suggestedPrompts = isHi ? SUGGESTED_PROMPTS_HI : SUGGESTED_PROMPTS_EN;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      setMessages((prev) => [...prev, { role: 'agent', text: agentResponse }]);
    } catch (err) {
      const errMsg = isHi
        ? 'एजेंट से संपर्क नहीं हो पा रहा। कृपया बाद में प्रयास करें।'
        : 'Could not reach the AI agent. Please try again later.';
      setMessages((prev) => [...prev, { role: 'agent', text: errMsg }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

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
              <ChatMessage key={i} message={msg} />
            ))}
          </AnimatePresence>

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
                  <Loader2 size={14} className="animate-spin text-saffron" />
                  <span className="font-body text-sm text-gray-500">
                    {isHi ? 'सोच रहे हैं...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

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
