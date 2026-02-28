/**
 * SchemeTimeline — vertical timeline of scheme enrollments.
 */
const timelineData = [
    { year: 1, month: 1, scheme: 'PM Ujjwala', impact: '+₹800/mo savings (gas subsidy)', category: 'women' },
    { year: 1, month: 3, scheme: 'Widow Pension', impact: '+₹1,000/mo pension', category: 'women' },
    { year: 1, month: 6, scheme: 'Ayushman Bharat', impact: '₹5L health insurance', category: 'health' },
    { year: 1, month: 12, scheme: 'MGNREGS', impact: '+₹3,000/mo employment', category: 'employment' },
    { year: 2, month: 6, scheme: 'PMAY-G', impact: '₹1.2L (pucca house)', category: 'housing' },
    { year: 3, month: 1, scheme: 'Skill Training', impact: '+₹2,000/mo (income boost)', category: 'employment' },
];

const categoryColors = {
    agriculture: '#4CAF50', housing: '#FF9800', health: '#F44336',
    education: '#2196F3', women: '#E91E63', employment: '#9C27B0',
};

function SchemeTimeline() {
    return (
        <div className="bg-white rounded-xl shadow-card p-4 lg:p-6">
            <h3 className="font-body text-lg font-bold text-gray-900 mb-4">
                Scheme Sequence
            </h3>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                {timelineData.map((entry, i) => {
                    const color = categoryColors[entry.category] || '#E8740C';
                    const isPast = entry.year <= 1;

                    return (
                        <div key={i} className="relative flex items-start gap-4 mb-6 last:mb-0">
                            {/* Timeline dot */}
                            <div className="relative z-10 shrink-0">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-mono font-bold"
                                    style={{ backgroundColor: isPast ? color : '#C8C3B8' }}
                                >
                                    {entry.year}
                                </div>
                            </div>

                            {/* Content card */}
                            <div className="flex-1 pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-body text-sm font-bold text-gray-900">
                                            {entry.scheme}
                                        </p>
                                        <p className="font-body text-xs text-gray-500">
                                            Year {entry.year}, Month {entry.month}
                                        </p>
                                    </div>
                                    <span
                                        className="shrink-0 px-2 py-0.5 rounded-full text-xs font-mono font-medium text-white"
                                        style={{ backgroundColor: color }}
                                    >
                                        {entry.impact.split(' ')[0]}
                                    </span>
                                </div>
                                <p className="font-body text-xs text-gray-600 mt-1">
                                    {entry.impact}
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
