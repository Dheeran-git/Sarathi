import { useState } from 'react';
import { Mic, Send, Square } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * InputBar — fixed bottom bar with voice button, text input, and send.
 */
function InputBar({ onSend, isRecording = false, onToggleRecording }) {
    const [text, setText] = useState('');
    const { language } = useLanguage();
    const isHi = language === 'hi';

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend?.(trimmed);
        setText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-white border-t border-gray-200">
            {/* Voice feedback bar */}
            {isRecording && (
                <div className="flex items-center gap-3 px-4 py-2 bg-danger-light">
                    {/* Waveform bars */}
                    <div className="flex items-center gap-0.5 h-6">
                        {Array.from({ length: 20 }, (_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-danger rounded-full animate-pulse"
                                style={{
                                    height: `${Math.random() * 20 + 6}px`,
                                    animationDelay: `${i * 50}ms`,
                                    animationDuration: '0.6s',
                                }}
                            />
                        ))}
                    </div>
                    <span className="font-body text-xs text-danger">
                        {isHi ? 'बोल रहे हैं... | रुकने के लिए टैप करें' : 'Listening... | Tap to stop'}
                    </span>
                </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-3">
                {/* Voice button */}
                <button
                    onClick={onToggleRecording}
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isRecording
                        ? 'bg-danger text-white shadow-lg'
                        : 'bg-saffron text-white shadow-saffron hover:bg-saffron-light'
                        }`}
                    aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                    {isRecording ? <Square size={18} /> : <Mic size={20} />}
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isHi ? 'यहाँ लिखें या माइक दबाएं...' : 'Type here or press mic...'}
                        rows={1}
                        className="w-full h-12 max-h-24 px-4 py-3 rounded-full border border-gray-200 font-body text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 transition-colors duration-200"
                        style={{ lineHeight: '1.4' }}
                    />
                </div>

                {/* Send button */}
                <button
                    onClick={handleSend}
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${text.trim()
                        ? 'bg-saffron text-white shadow-saffron hover:bg-saffron-light'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    aria-label="Send message"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}

export default InputBar;
