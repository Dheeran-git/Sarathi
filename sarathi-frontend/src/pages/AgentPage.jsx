import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Loader2,
  ArrowLeft,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { invokeAgent } from '../utils/api';

const AgentPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Namaste! 🙏 I am Sarathi, your intelligent welfare assistant. I can help you find schemes, check your eligibility, and even apply for them on your behalf. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Math.random().toString(36).substring(7)}`);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const citizenId = localStorage.getItem('userEmail') || localStorage.getItem('citizenId') || '';
      const response = await invokeAgent(input, sessionId, citizenId);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.response || response.message || response.error || "I'm sorry, I encountered an issue processing that. Could you try again?",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Agent invocation failed:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "What schemes are for farmers?",
    "Apply for PM Kisan",
    "Check my application status"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-[#1e1b4b] px-6 py-4 flex items-center justify-between shadow-lg border-b border-indigo-500/30">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight tracking-wide">Sarathi Smart Assistant</h1>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest">Powered by Bedrock</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="bg-indigo-900/50 border border-indigo-400/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-[11px] text-indigo-100 font-medium">Safe & Secure Citizen Help</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-[85%] sm:max-w-[75%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md
                    ${msg.type === 'user' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-indigo-600 text-white shadow-indigo-200'}`}>
                    {msg.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`px-5 py-4 rounded-2xl shadow-sm text-sm sm:text-[15px] leading-relaxed relative
                    ${msg.type === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : msg.isError
                        ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]'}`}>

                    {msg.text.split('\n').map((line, i) => {
                      if (line.startsWith('•') || line.startsWith('-')) {
                        return <li key={i} className="list-none pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-indigo-500 font-medium mt-1">{line.substring(1).trim()}</li>;
                      }
                      return <p key={i} className={i > 0 ? 'mt-3' : ''}>{line}</p>;
                    })}

                    <div className={`text-[9px] mt-3 font-bold uppercase tracking-wider opacity-60 ${msg.type === 'user' ? 'text-indigo-100/80 text-right' : 'text-slate-400 text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex gap-4 items-center bg-white/50 backdrop-blur-sm px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                </div>
                <span className="text-slate-500 font-bold text-[11px] uppercase tracking-widest italic">Sarathi is looking up details...</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-6 pb-10">
        <div className="max-w-3xl mx-auto">
          {messages.length === 1 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 justify-center mb-6"
            >
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(p); }}
                  className="px-4 py-2 rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  {p}
                </button>
              ))}
            </motion.div>
          )}

          <form onSubmit={handleSend} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type in English or Hindi (e.g., 'Kisan schemes help')..."
              disabled={isLoading}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 pl-7 pr-16 
                focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500
                transition-all duration-300 placeholder:text-slate-400 text-slate-800 text-[15px] font-medium shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2.5 top-2.5 bottom-2.5 w-12 rounded-2xl bg-indigo-600 text-white
                flex items-center justify-center transition-all duration-300
                hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400
                hover:shadow-[0_4px_15px_rgba(79,70,229,0.4)] active:scale-90"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5 fill-current" />}
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-bold tracking-widest uppercase">
            Live Assisted Submission • Real-time Status Check • Multilingual Support
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default AgentPage;
