/**
 * ProgressSteps — horizontal stepper showing chat profile collection progress.
 */

const DEFAULT_LABELS = ['Age', 'Income', 'State', 'Gender'];

function ProgressSteps({ currentStep = 0, labels = DEFAULT_LABELS, totalSteps }) {
    const steps = labels || DEFAULT_LABELS;
    const total = totalSteps || steps.length;

    return (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
            {/* Desktop: full stepper */}
            <div className="hidden md:flex items-center justify-center gap-0.5 max-w-3xl mx-auto overflow-x-auto">
                {steps.map((label, i) => {
                    const isCompleted = i < currentStep;
                    const isActive = i === currentStep;

                    return (
                        <div key={i} className="flex items-center">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-body font-medium transition-colors duration-300 shrink-0 ${
                                    isCompleted
                                        ? 'bg-saffron text-white shadow-saffron'
                                        : isActive
                                            ? 'bg-saffron text-white shadow-saffron animate-pulse'
                                            : 'border-2 border-gray-300 text-gray-400 bg-white'
                                }`}
                            >
                                {isCompleted ? '✓' : i + 1}
                            </div>

                            <span
                                className={`ml-2 text-xs font-body whitespace-nowrap tracking-wide ${
                                    isActive ? 'text-saffron font-bold' : isCompleted ? 'text-navy font-medium' : 'text-gray-400'
                                }`}
                            >
                                {label}
                            </span>

                            {i < total - 1 && (
                                <div
                                    className={`w-6 h-[2px] mx-2 transition-colors duration-300 rounded-full ${
                                        isCompleted ? 'bg-saffron' : 'bg-gray-200'
                                    }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile: compact view */}
            <div className="md:hidden flex items-center justify-between">
                <span className="font-body text-sm text-gray-700">
                    Step {Math.min(currentStep + 1, total)} / {total}:{' '}
                    <span className="font-bold text-saffron">
                        {steps[Math.min(currentStep, total - 1)] || ''}
                    </span>
                </span>
                <div className="flex gap-1">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i < currentStep
                                    ? 'bg-saffron'
                                    : i === currentStep
                                        ? 'bg-saffron scale-125 animate-pulse'
                                        : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ProgressSteps;
