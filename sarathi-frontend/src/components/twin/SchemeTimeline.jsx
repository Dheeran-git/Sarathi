import { useLanguage } from '../../context/LanguageContext';
import { localizeNum } from '../../utils/formatters';

/**
 * SchemeTimeline — vertical timeline of scheme enrollments.
 */
const timelineData = [
    { year: 1, month: 1, scheme: 'PM Ujjwala', schemeHindi: 'पीएम उज्ज्वला', impactHi: '+₹800/माह बचत (गैस सब्सिडी)', impactEn: '+₹800/mo savings (gas subsidy)', category: 'women' },
    { year: 1, month: 3, scheme: 'Widow Pension', schemeHindi: 'विधवा पेंशन', impactHi: '+₹1,000/माह पेंशन', impactEn: '+₹1,000/mo pension', category: 'women' },
    { year: 1, month: 6, scheme: 'Ayushman Bharat', schemeHindi: 'आयुष्मान भारत', impactHi: '₹5L स्वास्थ्य बीमा', impactEn: '₹5L health insurance', category: 'health' },
    { year: 1, month: 12, scheme: 'MGNREGS', schemeHindi: 'मनरेगा', impactHi: '+₹3,000/माह रोजगार', impactEn: '+₹3,000/mo employment', category: 'employment' },
    { year: 2, month: 6, scheme: 'PMAY-G', schemeHindi: 'प्रधानमंत्री आवास', impactHi: '₹1.2L (पक्का मकान)', impactEn: '₹1.2L (pucca house)', category: 'housing' },
    { year: 3, month: 1, scheme: 'Skill Training', schemeHindi: 'कौशल प्रशिक्षण', impactHi: '+₹2,000/माह (आय वृद्धि)', impactEn: '+₹2,000/mo (income boost)', category: 'employment' },
];

const categoryColors = {
    agriculture: '#4CAF50', housing: '#FF9800', health: '#F44336',
    education: '#2196F3', women: '#E91E63', employment: '#9C27B0',
};

function SchemeTimeline() {
    const { language } = useLanguage();
    const isHi = language === 'hi';

    return (
        <div className="bg-white rounded-xl shadow-card p-4 lg:p-6">
            <h3 className="font-body text-lg font-bold text-gray-900 mb-4">
                {isHi ? 'योजना क्रम' : 'Scheme Sequence'}
            </h3>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                {timelineData.map((entry, i) => {
                    const color = categoryColors[entry.category] || '#E8740C';
                    const isPast = entry.year <= 1;
                    const impact = isHi ? entry.impactHi : entry.impactEn;

                    return (
                        <div key={i} className="relative flex items-start gap-4 mb-6 last:mb-0">
                            {/* Timeline dot */}
                            <div className="relative z-10 shrink-0">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-mono font-bold"
                                    style={{ backgroundColor: isPast ? color : '#C8C3B8' }}
                                >
                                    {localizeNum(entry.year, language)}
                                </div>
                            </div>

                            {/* Content card */}
                            <div className="flex-1 pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-body text-sm font-bold text-gray-900">
                                            {isHi ? entry.schemeHindi : entry.scheme}
                                        </p>
                                        <p className="font-body text-xs text-gray-500">
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
                                <p className="font-body text-xs text-gray-600 mt-1">
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
