import SchemeCard from './SchemeCard';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ChatBubble — User and Sarathi chat message bubbles.
 * type: 'user' | 'sarathi' | 'sarathi-schemes' | 'sarathi-question'
 */
function ChatBubble({ type = 'sarathi', text, schemes, question, options, onOptionSelect, timestamp, isFirst = false }) {
    const { language } = useLanguage();
    const isHi = language === 'hi';
    const displayTime = timestamp === 'अभी' || timestamp === 'JUST_NOW' ? (isHi ? 'अभी' : 'Just now') : timestamp;
    if (type === 'user') {
        return (
            <div className="flex justify-end mb-3">
                <div className="max-w-[70%] lg:max-w-[60%] flex flex-col items-end">
                    <div className="bg-saffron text-white px-4 py-3 rounded-[18px_18px_4px_18px] font-body text-[15px] leading-relaxed shadow-sm">
                        {text}
                    </div>
                    {displayTime && (
                        <p className="text-[11px] text-gray-500 mt-1 mr-1 font-body">{displayTime}</p>
                    )}
                </div>
            </div>
        );
    }

    // Sarathi bubbles
    return (
        <div className="flex justify-start mb-3">
            <div className="max-w-[75%] lg:max-w-[65%]">
                {isFirst && (
                    <p className="text-[11px] font-body text-gray-500 mb-1 ml-1">{isHi ? '🤖 सारथी' : '🤖 Sarathi'}</p>
                )}

                <div className="bg-white border-l-[3px] border-saffron px-4 py-3 rounded-[4px_18px_18px_18px] shadow-card font-body text-[15px] text-gray-900 leading-relaxed">
                    {/* Regular text */}
                    {text && <p>{text}</p>}

                    {/* Scheme results */}
                    {type === 'sarathi-schemes' && schemes && (
                        <div className="mt-3 space-y-3">
                            <p className="font-medium text-sm text-gray-700">{isHi ? 'मुझे ये योजनाएं मिलीं:' : 'I found these schemes for you:'}</p>
                            {schemes.map((scheme) => (
                                <SchemeCard key={scheme.id} scheme={scheme} isEligible />
                            ))}
                        </div>
                    )}

                    {/* Question with options */}
                    {type === 'sarathi-question' && question && (
                        <div className="mt-2">
                            <p className="font-medium">{question}</p>
                            {options && options.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {options.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => onOptionSelect?.(option)}
                                            className="px-3 py-2 h-9 rounded-full border border-saffron text-saffron font-body text-sm font-medium hover:bg-saffron hover:text-white transition-colors duration-200 active:scale-95"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {displayTime && (
                    <p className="text-[11px] text-gray-500 mt-1 ml-1 font-body">{displayTime}</p>
                )}
            </div>
        </div>
    );
}

/** Typing indicator — three bouncing dots */
export function TypingIndicator() {
    return (
        <div className="flex justify-start mb-3">
            <div className="bg-white border-l-[3px] border-saffron px-4 py-3 rounded-[4px_18px_18px_18px] shadow-card">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <TypingText />
            </div>
        </div>
    );
}

function TypingText() {
    const { language } = useLanguage();
    return <p className="text-[11px] text-gray-400 mt-1 font-body">{language === 'hi' ? 'सारथी सोच रहा है...' : 'Sarathi is typing...'}</p>;
}

export default ChatBubble;
