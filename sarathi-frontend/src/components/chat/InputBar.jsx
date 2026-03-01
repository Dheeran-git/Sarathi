import { useState, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

function InputBar({ onSend, isRecording = false, onToggleRecording, disabled = false, liveTranscript = "" }) {
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
        <div className="border-t border-slate-800 bg-[#0f172a] px-4 py-3">
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
                    value={isRecording && liveTranscript ? liveTranscript : text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type here or press mic to speak..."
                    disabled={disabled}
                    className="flex-1 h-11 px-4 rounded-xl border border-slate-700 bg-[#020617] text-[#f8fafc] placeholder-slate-500 font-body text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />

                {/* Mic button */}
                <button
                    type="button"
                    onClick={onToggleRecording}
                    disabled={disabled}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isRecording
                        ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 md:border-none`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Send button */}
                <button
                    type="submit"
                    disabled={disabled || !text.trim()}
                    className="w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export default InputBar;
