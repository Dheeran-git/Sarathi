/**
 * EmptyState — shown when a list/search has no results.
 */
function EmptyState({ title, subtitle, ctaLabel, onCtaClick }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-60">
                <circle cx="60" cy="60" r="40" fill="transparent" stroke="#E5E2DA" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="60" cy="60" r="25" fill="#F2F0EC" />
                <path d="M75 75 L95 95" stroke="#E8740C" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                <circle cx="55" cy="55" r="28" stroke="#E8740C" strokeWidth="4" fill="none" />
                <path d="M30 40 L35 45 M80 30 L75 35 M45 80 L50 75" stroke="#F9A54A" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <h3 className="font-body text-xl font-medium text-gray-900 mb-2">
                {title || 'No results found'}
            </h3>
            <p className="font-body text-[15px] text-gray-500 max-w-sm">
                {subtitle || 'Please try modifying your search and try again.'}
            </p>

            {ctaLabel && (
                <button
                    onClick={onCtaClick}
                    className="mt-6 h-10 px-6 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors shadow-saffron"
                >
                    {ctaLabel}
                </button>
            )}
        </div>
    );
}

export default EmptyState;
