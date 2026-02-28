import { useRef, useEffect } from 'react';

/**
 * ChatPanel — renders the chat message list + auto-scroll.
 */
function ChatPanel({ messages = [], isThinking = false }) {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6">
            {/* Welcome Screen (shown when no messages) */}
            {messages.length === 0 && !isThinking && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-saffron/10 flex items-center justify-center mb-4">
                        <span className="font-display text-2xl text-saffron">S</span>
                    </div>
                    <h2 className="font-display text-xl text-navy">Hello! I am Sarathi.</h2>
                    <p className="font-body text-sm text-gray-500 mt-2 max-w-xs">
                        I'll tell you which government schemes you can get.
                    </p>
                </div>
            )}

            {/* Messages */}
            <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.type === 'sarathi' && (
                            <div className="w-8 h-8 rounded-full bg-saffron/10 flex items-center justify-center mr-2 shrink-0 mt-1">
                                <span className="font-display text-sm text-saffron">S</span>
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] px-4 py-3 whitespace-pre-wrap leading-relaxed font-body text-sm ${msg.type === 'user'
                                    ? 'bg-saffron text-white rounded-[14px_14px_4px_14px]'
                                    : msg.isFinal
                                        ? 'bg-success-light text-gray-900 rounded-[14px_14px_14px_4px] border border-success/20'
                                        : 'bg-white text-gray-900 rounded-[14px_14px_14px_4px] border border-gray-100 shadow-sm'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-saffron/10 flex items-center justify-center mr-2 shrink-0">
                            <span className="font-display text-sm text-saffron">S</span>
                        </div>
                        <div className="bg-white rounded-[14px_14px_14px_4px] px-4 py-3 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
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
