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
import { invokeAgent, getCitizenProfile } from '../utils/api';

const AgentChatPage = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Namaste! I am Sarathi, your intelligent welfare assistant. I can help you find schemes, check your eligibility, and even apply for them on your behalf. How can I assist you today?",
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
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
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
            const response = await invokeAgent(input, sessionId);

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: response.message || "I'm sorry, I encountered an issue processing that. Could you try again?",
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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-10 px-4 py-3 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/citizen/home" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-800 leading-tight">Sarathi AI Assistant</h1>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">Active Agent</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                        <Info className="w-3.5 h-3.5" />
                        Empowered by Bedrock
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm
                    ${msg.type === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                                        {msg.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed
                    ${msg.type === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : msg.isError
                                                ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                                                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                        {msg.text.split('\n').map((line, i) => (
                                            <p key={i} className={i > 0 ? 'mt-3' : ''}>
                                                {line}
                                            </p>
                                        ))}
                                        <div className={`text-[10px] mt-2 opacity-60 font-medium ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="flex gap-3 items-center text-slate-400 font-medium text-sm bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                Sarathi is thinking...
                            </div>
                        </motion.div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 pb-8 sm:pb-4">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question in Hindi or English..."
                        disabled={isLoading}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-14 
              focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
              transition-all duration-200 placeholder:text-slate-400 text-slate-700"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-2 bottom-2 w-11 h-11 bg-indigo-600 text-white rounded-xl
              flex items-center justify-center transition-all duration-200
              hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400
              hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 group-focus-within:bg-indigo-600"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
                <p className="max-w-4xl mx-auto text-center text-[10px] text-slate-400 mt-3 font-medium tracking-wide uppercase">
                    AI assistant may provide details about scheme eligibility. Always verify documents before applying.
                </p>
            </div>
        </div>
    );
};

export default AgentChatPage;
