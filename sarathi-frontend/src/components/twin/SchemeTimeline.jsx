import { useLanguage } from '../../context/LanguageContext';
import { localizeNum } from '../../utils/formatters';

/**
 * SchemeTimeline — vertical timeline of scheme enrollments.
 */
const categoryColors = {
    agriculture: '#10b981', housing: '#f59e0b', health: '#e11d48',
    education: '#3b82f6', women: '#ec4899', employment: '#a855f7', general: '#4f46e5',
};

function SchemeTimeline({ bestPathway = [] }) {
    const { language } = useLanguage();
    const isHi = language === 'hi';

    // Derive timeline data dynamically from the pathway points where schemes are added
    const timelineData = bestPathway
        .filter((point) => point.scheme)
        .map((point) => {
            const y = Math.max(1, Math.ceil(point.month / 12));
            const m = ((point.month - 1) % 12) + 1;
            return {
                year: y,
                month: m,
                scheme: point.scheme,
                schemeHindi: point.schemeHindi || point.scheme,
                impactHi: 'अनुमानित आय वृद्धि',
                impactEn: 'Est. income boost',
                category: 'general'
            };
        });

    if (timelineData.length === 0) {
        return (
            <div className="bg-[#0f172a] rounded-xl shadow-xl border border-slate-800 p-4 lg:p-6 text-center">
                <p className="font-body text-sm text-slate-500">{isHi ? 'कोई योजना अनुक्रम उपलब्ध नहीं है।' : 'No scheme sequence available.'}</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0f172a] rounded-xl shadow-xl border border-slate-800 p-4 lg:p-6">
            <h3 className="font-body text-lg font-bold text-[#f8fafc] mb-4">
                {isHi ? 'योजना क्रम' : 'Scheme Sequence'}
            </h3>

            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

                {timelineData.map((entry, i) => {
                    const color = categoryColors[entry.category] || '#4f46e5';
                    const isPast = entry.year <= 1;
                    const impact = isHi ? entry.impactHi : entry.impactEn;

                    return (
                        <div key={i} className="relative flex items-start gap-4 mb-6 last:mb-0">
                            {/* Timeline dot */}
                            <div className="relative z-10 shrink-0">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-mono font-bold"
                                    style={{ backgroundColor: isPast ? color : '#334155' }}
                                >
                                    {localizeNum(entry.year, language)}
                                </div>
                            </div>

                            {/* Content card */}
                            <div className="flex-1 pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-body text-sm font-bold text-[#f8fafc]">
                                            {isHi ? entry.schemeHindi : entry.scheme}
                                        </p>
                                        <p className="font-body text-xs text-slate-500">
                                            {isHi ? `वर्ष ${localizeNum(entry.year, language)}, माह ${localizeNum(entry.month, language)}` : `Year ${entry.year}, Month ${entry.month}`}
                                        </p>
                                    </div>
                                    <span
                                        className="shrink-0 px-2 py-0.5 rounded-full text-xs font-mono font-medium text-white"
                                        style={{ backgroundColor: color }}
                                    >
                                        {localizeNum(impact.split(' ')[0], language)}
                                    </span>
                                </div>
                                <p className="font-body text-xs text-slate-400 mt-1">
                                    {localizeNum(impact, language)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SchemeTimeline;
