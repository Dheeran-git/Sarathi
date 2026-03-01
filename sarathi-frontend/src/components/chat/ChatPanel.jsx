import { useRef, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

/**
 * ChatPanel — renders the chat message list + auto-scroll.
 */
function ChatPanel({ messages = [], isThinking = false, language = 'en' }) {
    const bottomRef = useRef(null);

    // Text to Speech
    const speakMessage = (text) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel(); // Stop current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        window.speechSynthesis.speak(utterance);
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6">
            {/* Welcome Screen (shown when no messages) */}
            {messages.length === 0 && !isThinking && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.15)] border border-indigo-500/20">
                        <span className="font-display text-2xl text-indigo-400">S</span>
                    </div>
                    <h2 className="font-display text-xl text-[#f8fafc]">Hello! I am Sarathi.</h2>
                    <p className="font-body text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
                        I'll tell you which government schemes you can get.
                    </p>
                </div>
            )}

            {/* Messages */}
            <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.type === 'sarathi' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mr-3 shrink-0 mt-1 border border-indigo-500/20 shadow-sm">
                                <span className="font-display text-sm text-indigo-400">S</span>
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] px-4 py-3 whitespace-pre-wrap leading-relaxed font-body text-sm shadow-sm ${msg.type === 'user'
                                ? 'bg-indigo-600 text-white rounded-[16px_16px_4px_16px] shadow-indigo-500/10'
                                : msg.isFinal
                                    ? 'bg-[#0f172a] text-[#f8fafc] rounded-[16px_16px_16px_4px] border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                                    : 'bg-[#0f172a] text-[#f8fafc] rounded-[16px_16px_16px_4px] border border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                                }`}
                        >
                            {msg.text}
                        </div>
                        {msg.type === 'sarathi' && (
                            <button
                                onClick={() => speakMessage(msg.text)}
                                className="ml-2 mt-auto mb-1 p-1.5 rounded-full text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                aria-label="Listen to message"
                                title="Listen to message"
                            >
                                <Volume2 size={16} />
                            </button>
                        )}
                    </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mr-3 shrink-0 border border-indigo-500/20 shadow-sm">
                            <span className="font-display text-sm text-indigo-400">S</span>
                        </div>
                        <div className="bg-[#0f172a] text-[#f8fafc] rounded-[16px_16px_16px_4px] px-5 py-3.5 border border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                            <div className="flex items-center gap-1.5 h-full py-1">
                                <div className="w-2 h-2 bg-indigo-500/60 rounded-full animate-[bounce_1s_infinite_0ms]" />
                                <div className="w-2 h-2 bg-indigo-500/60 rounded-full animate-[bounce_1s_infinite_150ms]" />
                                <div className="w-2 h-2 bg-indigo-500/60 rounded-full animate-[bounce_1s_infinite_300ms]" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    );
}

export default ChatPanel;
