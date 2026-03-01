/**
 * EmptyState — shown when a list/search has no results.
 */
function EmptyState({ title, subtitle, ctaLabel, onCtaClick }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Dark Theme Analytics/Search SVG Illustration */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-80">
                <circle cx="60" cy="60" r="40" fill="transparent" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="60" cy="60" r="25" fill="#1e293b" opacity="0.5" />
                {/* Search glass handle */}
                <path d="M75 75 L95 95" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                <circle cx="55" cy="55" r="28" stroke="#4f46e5" strokeWidth="4" fill="none" />
                {/* Sparkles / Data nodes */}
                <path d="M30 40 L35 45 M80 30 L75 35 M45 80 L50 75" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <h3 className="font-body text-xl font-medium text-[#f8fafc] mb-2">
                {title || 'No results found'}
            </h3>
            <p className="font-body text-[15px] text-slate-400 max-w-sm">
                {subtitle || 'Please try modifying your search and try again.'}
            </p>

            {ctaLabel && (
                <button
                    onClick={onCtaClick}
                    className="mt-6 h-10 px-6 rounded-lg bg-indigo-600 text-white font-body text-sm font-medium hover:bg-indigo-500 transition-colors duration-200 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                    {ctaLabel}
                </button>
            )}
        </div>
    );
}

export default EmptyState;
