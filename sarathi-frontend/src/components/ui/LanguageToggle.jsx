import { useLanguage } from '../../context/LanguageContext';

/**
 * Standalone Language Toggle — pill-shaped हिं/EN toggle.
 */
function LanguageToggle({ className = '' }) {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className={`relative w-[100px] h-[34px] rounded-full border border-gray-200 flex items-center overflow-hidden shrink-0 ${className}`}
            aria-label="Toggle language"
        >
            <span
                className={`absolute top-0 h-full w-1/2 rounded-full bg-saffron transition-transform duration-200 ease-in-out ${language === 'hi' ? 'translate-x-0' : 'translate-x-full'
                    }`}
            />
            <span
                className={`relative z-10 flex-1 text-center text-xs font-body font-medium transition-colors duration-200 ${language === 'hi' ? 'text-white' : 'text-gray-500'
                    }`}
            >
                हिं
            </span>
            <span
                className={`relative z-10 flex-1 text-center text-xs font-body font-medium transition-colors duration-200 ${language === 'en' ? 'text-white' : 'text-gray-500'
                    }`}
            >
                EN
            </span>
        </button>
    );
}

export default LanguageToggle;
