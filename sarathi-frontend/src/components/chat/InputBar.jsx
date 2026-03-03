import { useState, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

function InputBar({
    onSend,
    isRecording = false,
    onToggleRecording,
    disabled = false,
    liveTranscript = '',
    quickReplies = null,
    language = 'en',
}) {
    const [text, setText] = useState('');
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setText('');
    };

    const handleChipClick = (value) => {
        onSend(value);
    };

    const isHi = language === 'hi';

    return (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
            {/* Recording indicator */}
            {isRecording && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                    <span className="font-body text-xs text-danger">Recording... (Speak now)</span>
                </div>
            )}

            {/* Quick-reply chips */}
            {quickReplies && quickReplies.length > 0 && !disabled && (
                <div className="flex flex-wrap gap-2 mb-3 max-w-2xl mx-auto">
                    {quickReplies.map((chip) => {
                        const displayLabel = isHi && chip.labelHi ? chip.labelHi : chip.label;
                        return (
                            <button
                                key={chip.value}
                                type="button"
                                onClick={() => handleChipClick(displayLabel)}
                                className="px-3 py-1.5 rounded-full border border-saffron/40 bg-saffron-pale text-saffron font-body text-xs font-medium hover:bg-saffron hover:text-white hover:border-saffron transition-all duration-200 whitespace-nowrap"
                            >
                                {displayLabel}
                            </button>
                        );
                    })}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-2xl mx-auto">
                <input
                    ref={inputRef}
                    value={isRecording && liveTranscript ? liveTranscript : text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={isHi ? 'यहाँ टाइप करें या माइक दबाएं...' : 'Type here or press mic to speak...'}
                    disabled={disabled}
                    className="flex-1 h-11 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 font-body text-sm focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />

                {/* Mic button */}
                <button
                    type="button"
                    onClick={onToggleRecording}
                    disabled={disabled}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border ${
                        isRecording
                            ? 'bg-danger text-white border-danger shadow-[0_0_15px_rgba(192,57,43,0.3)]'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 hover:text-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Send button */}
                <button
                    type="submit"
                    disabled={disabled || !text.trim()}
                    className="w-11 h-11 rounded-xl bg-saffron text-white flex items-center justify-center hover:bg-saffron-light shadow-saffron transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export default InputBar;
