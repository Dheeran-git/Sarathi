import { useState, useRef, useEffect } from 'react';
import ChatBubble, { TypingIndicator } from '../ui/ChatBubble';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ChatPanel — the main chat message thread with welcome screen.
 */
function ChatPanel({ messages = [], isThinking = false, onQuickStart }) {
    const bottomRef = useRef(null);
    const { language } = useLanguage();
    const isHi = language === 'hi';

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    // Welcome screen when no messages
    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                {/* Animated logo */}
                <div className="w-20 h-20 rounded-full bg-saffron/10 flex items-center justify-center mb-6 animate-pulse">
                    <span className="font-display text-3xl text-saffron">स</span>
                </div>

                <h2 className="font-display text-[28px] text-navy text-center">
                    {isHi ? 'नमस्ते! मैं सारथी हूँ।' : 'Hello! I am Sarathi.'}
                </h2>
                <p className="font-body text-base text-gray-600 text-center max-w-md mt-3 leading-relaxed">
                    {isHi
                        ? 'आपको कौन सी सरकारी योजनाएं मिल सकती हैं — यह मैं आपको बताऊंगा।'
                        : "I'll help you find which government schemes you are eligible for."}
                </p>

                {/* Quick-start chips */}
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                    {(isHi
                        ? ['योजनाएं ढूंढें', 'किसान हूँ', 'विधवा पेंशन']
                        : ['Find Schemes', "I'm a Farmer", 'Widow Pension']
                    ).map((chip) => (
                        <button
                            key={chip}
                            onClick={() => onQuickStart?.(chip)}
                            className="px-4 py-2 rounded-full bg-saffron/10 text-saffron font-body text-sm font-medium border border-saffron/20 hover:bg-saffron hover:text-white transition-colors duration-200"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-4">
            <div className="max-w-2xl mx-auto">
                {messages.map((msg, i) => (
                    <ChatBubble
                        key={i}
                        type={msg.type}
                        text={msg.text}
                        schemes={msg.schemes}
                        question={msg.question}
                        options={msg.options}
                        onOptionSelect={msg.onOptionSelect}
                        timestamp={msg.timestamp}
                        isFirst={i === 0 || messages[i - 1]?.type !== msg.type}
                    />
                ))}

                {isThinking && <TypingIndicator />}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

export default ChatPanel;
