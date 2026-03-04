import { Mic, Square, Loader2 } from 'lucide-react';

/**
 * VoiceButton — Big microphone button for voice input.
 * States: idle | listening | processing
 */
function VoiceButton({ state = 'idle', onClick, size = 'large' }) {
    const sizeClass = size === 'large' ? 'w-24 h-24' : 'w-14 h-14';
    const iconSize = size === 'large' ? 32 : 22;

    const stateConfig = {
        idle: {
            bg: 'bg-saffron',
            shadow: 'shadow-saffron',
            Icon: Mic,
            label: 'Speak',
        },
        listening: {
            bg: 'bg-danger',
            shadow: 'shadow-lg',
            Icon: Square,
            label: 'Listening...',
        },
        processing: {
            bg: 'bg-gray-200',
            shadow: 'shadow-md',
            Icon: Loader2,
            label: 'Processing...',
        },
    };

    const config = stateConfig[state];
    const Icon = config.Icon;

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={onClick}
                className={`relative ${sizeClass} rounded-full ${config.bg} ${config.shadow} flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2`}
                aria-label="Voice input button"
                aria-pressed={state === 'listening'}
                role="button"
            >
                {/* Pulsing rings for listening state */}
                {state === 'listening' && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-saffron/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <span className="absolute inset-[-8px] rounded-full border-2 border-saffron/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                        <span className="absolute inset-[-16px] rounded-full border border-saffron/10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.6s' }} />
                    </>
                )}

                <Icon
                    size={iconSize}
                    className={`relative z-10 text-white ${state === 'processing' ? 'animate-spin' : ''}`}
                />
            </button>

            <span className="font-body text-xs text-gray-500">
                {config.label}
            </span>
        </div>
    );
}

export default VoiceButton;
