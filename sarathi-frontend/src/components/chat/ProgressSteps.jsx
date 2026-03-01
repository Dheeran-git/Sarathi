/**
 * ProgressSteps — horizontal stepper showing chat profile collection progress.
 * Supports dynamic labels and 4+ steps (matching Lex bot slots).
 */

const DEFAULT_LABELS = ['Age', 'Income', 'State', 'Gender'];

function ProgressSteps({ currentStep = 0, labels = DEFAULT_LABELS, totalSteps }) {
    const steps = labels || DEFAULT_LABELS;
    const total = totalSteps || steps.length;

    return (
        <div className="bg-[#0f172a] border-b border-slate-800 px-4 py-3">
            {/* Desktop: full stepper */}
            <div className="hidden md:flex items-center justify-center gap-0.5 max-w-3xl mx-auto overflow-x-auto">
                {steps.map((label, i) => {
                    const isCompleted = i < currentStep;
                    const isActive = i === currentStep;

                    return (
                        <div key={i} className="flex items-center">
                            {/* Circle */}
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-body font-medium transition-colors duration-300 shrink-0 ${isCompleted
                                    ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                                    : isActive
                                        ? 'bg-indigo-400 text-white shadow-[0_0_15px_rgba(129,140,248,0.6)] animate-pulse'
                                        : 'border-2 border-slate-700 text-slate-500 bg-[#020617]'
                                    }`}
                            >
                                {isCompleted ? '✓' : i + 1}
                            </div>

                            {/* Label */}
                            <span
                                className={`ml-2 text-xs font-body whitespace-nowrap tracking-wide ${isActive ? 'text-indigo-400 font-bold' : isCompleted ? 'text-indigo-300 font-medium' : 'text-slate-500'
                                    }`}
                            >
                                {label}
                            </span>

                            {/* Connecting line */}
                            {i < total - 1 && (
                                <div
                                    className={`w-6 h-[2px] mx-2 transition-colors duration-300 rounded-full ${isCompleted ? 'bg-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-slate-700'
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile: compact view */}
            <div className="md:hidden flex items-center justify-between">
                <span className="font-body text-sm text-slate-300">
                    Step {Math.min(currentStep + 1, total)} / {total}:{' '}
                    <span className="font-bold text-indigo-400">
                        {steps[Math.min(currentStep, total - 1)] || ''}
                    </span>
                </span>
                <div className="flex gap-1">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i < currentStep ? 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]' : i === currentStep ? 'bg-indigo-400 scale-125 shadow-[0_0_8px_rgba(129,140,248,0.7)] animate-pulse' : 'bg-slate-700'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ProgressSteps;
