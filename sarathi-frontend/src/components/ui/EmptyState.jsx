/**
 * EmptyState — shown when a list/search has no results.
 */
function EmptyState({ title, subtitle, ctaLabel, onCtaClick }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Terracotta Pot SVG Illustration */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-60">
                {/* Pot body */}
                <ellipse cx="60" cy="90" rx="35" ry="8" fill="#E8740C" opacity="0.1" />
                <path d="M35 55 Q30 80 38 95 Q45 102 60 102 Q75 102 82 95 Q90 80 85 55" fill="#D4A574" opacity="0.3" />
                <path d="M35 55 Q30 80 38 95 Q45 102 60 102 Q75 102 82 95 Q90 80 85 55" stroke="#C8956E" strokeWidth="1.5" fill="none" opacity="0.5" />
                {/* Pot rim */}
                <ellipse cx="60" cy="55" rx="26" ry="6" fill="#C8956E" opacity="0.35" />
                <ellipse cx="60" cy="55" rx="26" ry="6" stroke="#B8845E" strokeWidth="1.5" fill="none" opacity="0.5" />
                {/* Small plant sprout */}
                <path d="M56 48 Q58 35 60 28 Q62 35 64 48" stroke="#4CAF50" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
                <circle cx="55" cy="30" r="4" fill="#4CAF50" opacity="0.15" />
                <circle cx="65" cy="33" r="3.5" fill="#4CAF50" opacity="0.15" />
                {/* Decorative pattern on pot */}
                <path d="M42 70 Q51 66 60 70 Q69 74 78 70" stroke="#B8845E" strokeWidth="1" fill="none" opacity="0.3" />
                <path d="M44 80 Q52 76 60 80 Q68 84 76 80" stroke="#B8845E" strokeWidth="1" fill="none" opacity="0.3" />
            </svg>

            <h3 className="font-body text-xl font-medium text-gray-700 mb-2">
                {title || 'No results found'}
            </h3>
            <p className="font-body text-[15px] text-gray-500 max-w-sm">
                {subtitle || 'Please try modifying your search and try again.'}
            </p>

            {ctaLabel && (
                <button
                    onClick={onCtaClick}
                    className="mt-6 h-10 px-6 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors duration-200"
                >
                    {ctaLabel}
                </button>
            )}
        </div>
    );
}

export default EmptyState;
