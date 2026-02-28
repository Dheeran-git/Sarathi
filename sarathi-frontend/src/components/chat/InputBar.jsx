import { useState, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

function InputBar({ onSend, isRecording = false, onToggleRecording, disabled = false }) {
    const [text, setText] = useState('');
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setText('');
    };

    return (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
            {/* Recording indicator */}
            {isRecording && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-body text-xs text-red-500">Recording... (Speak now)</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-2xl mx-auto">
                <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type here or press mic..."
                    disabled={disabled}
                    className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-off-white font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />

                {/* Mic button */}
                <button
                    type="button"
                    onClick={onToggleRecording}
                    disabled={disabled}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isRecording
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Send button */}
                <button
                    type="submit"
                    disabled={disabled || !text.trim()}
                    className="w-11 h-11 rounded-xl bg-saffron text-white flex items-center justify-center hover:bg-saffron-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export default InputBar;
