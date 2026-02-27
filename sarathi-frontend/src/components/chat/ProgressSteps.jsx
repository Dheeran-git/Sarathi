import { profileSteps } from '../../data/citizenConfig';
import { useLanguage } from '../../context/LanguageContext';
import { localizeNum } from '../../utils/formatters';

/**
 * ProgressSteps — horizontal stepper showing chat profile collection progress.
 */
function ProgressSteps({ currentStep = 0, completedSteps = [] }) {
    const { language } = useLanguage();
    const isHi = language === 'hi';

    return (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
            {/* Desktop: full stepper */}
            <div className="hidden md:flex items-center justify-center gap-1 max-w-xl mx-auto">
                {profileSteps.map((step, i) => {
                    const isCompleted = completedSteps.includes(step.key) || i < currentStep;
                    const isActive = i === currentStep;

                    return (
                        <div key={step.key} className="flex items-center">
                            {/* Circle */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-medium transition-colors duration-300 ${isCompleted
                                    ? 'bg-navy text-white'
                                    : isActive
                                        ? 'bg-saffron text-white'
                                        : 'border-2 border-gray-300 text-gray-500'
                                    }`}
                            >
                                {isCompleted ? '✓' : localizeNum(i + 1, language)}
                            </div>

                            {/* Label below circle */}
                            <span
                                className={`ml-1.5 text-xs font-body whitespace-nowrap ${isActive ? 'text-saffron font-medium' : isCompleted ? 'text-navy' : 'text-gray-400'
                                    }`}
                            >
                                {isHi ? step.labelHindi : (step.labelEnglish)}
                            </span>

                            {/* Connecting line */}
                            {i < profileSteps.length - 1 && (
                                <div
                                    className={`w-8 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-saffron' : 'bg-gray-200'
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
                    {isHi ? 'चरण' : 'Step'} {localizeNum(currentStep + 1, language)} / {localizeNum(profileSteps.length, language)}:{' '}
                    <span className="font-medium text-saffron">
                        {isHi ? profileSteps[currentStep]?.labelHindi : (profileSteps[currentStep]?.labelEn || profileSteps[currentStep]?.key)}
                    </span>
                </span>
                <div className="flex gap-1">
                    {profileSteps.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < currentStep ? 'bg-navy' : i === currentStep ? 'bg-saffron' : 'bg-gray-300'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ProgressSteps;
