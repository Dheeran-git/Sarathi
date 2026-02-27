/**
 * LoadingSkeleton — shimmer placeholder while content loads.
 * type: 'card' | 'text' | 'avatar' | 'chart'
 */
function LoadingSkeleton({ type = 'text', count = 1, className = '' }) {
    const shimmer = 'relative overflow-hidden bg-gray-200 rounded-md before:absolute before:inset-0 before:translate-x-[-100%] before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

    const skeletons = {
        text: (
            <div className="space-y-2">
                <div className={`h-4 w-full ${shimmer}`} />
                <div className={`h-4 w-3/4 ${shimmer}`} />
                <div className={`h-4 w-1/2 ${shimmer}`} />
            </div>
        ),
        card: (
            <div className="bg-white rounded-xl p-4 shadow-card space-y-3">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${shimmer}`} />
                    <div className="flex-1 space-y-2">
                        <div className={`h-4 w-2/3 ${shimmer}`} />
                        <div className={`h-3 w-1/2 ${shimmer}`} />
                    </div>
                    <div className={`w-16 h-8 ${shimmer}`} />
                </div>
                <div className="flex gap-2">
                    <div className={`h-5 w-16 rounded-full ${shimmer}`} />
                    <div className={`h-5 w-20 rounded-full ${shimmer}`} />
                </div>
            </div>
        ),
        avatar: (
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${shimmer}`} />
                <div className="space-y-1">
                    <div className={`h-3 w-24 ${shimmer}`} />
                    <div className={`h-3 w-16 ${shimmer}`} />
                </div>
            </div>
        ),
        chart: (
            <div className={`w-full h-[300px] rounded-xl ${shimmer}`} />
        ),
    };

    return (
        <div className={`${className}`}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className={count > 1 ? 'mb-4' : ''}>
                    {skeletons[type]}
                </div>
            ))}

            <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    );
}

export default LoadingSkeleton;
