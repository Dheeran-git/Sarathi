import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';

function ResultsPanel({ schemes = [], visible = false }) {
    if (!visible) return null;

    const totalBenefit = schemes.reduce((sum, s) => sum + (s.annualBenefit || 0), 0);

    return (
        <div className="h-full bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-body text-base font-bold text-gray-900">Matched Schemes</h3>
                <p className="font-body text-xs text-gray-500 mt-0.5">
                    {schemes.length} schemes found • Total: ₹{totalBenefit.toLocaleString('en-IN')}/year
                </p>
            </div>

            <div className="p-3 space-y-2">
                {schemes.map((scheme) => (
                    <Link
                        key={scheme.schemeId || scheme.id}
                        to={`/schemes/${scheme.schemeId || scheme.id}`}
                        className="block p-3 bg-off-white rounded-lg hover:bg-saffron-pale transition-colors border border-gray-100"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="font-body text-sm font-medium text-gray-900 truncate">
                                    {scheme.nameEnglish || scheme.name}
                                </p>
                                <p className="font-body text-xs text-gray-500 mt-0.5">{scheme.ministry}</p>
                            </div>
                            <span className="font-mono text-sm font-bold text-saffron shrink-0">
                                ₹{(scheme.annualBenefit || 0) >= 100000
                                    ? `${((scheme.annualBenefit || 0) / 100000).toFixed((scheme.annualBenefit || 0) % 100000 === 0 ? 0 : 1)}L`
                                    : (scheme.annualBenefit || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {(scheme.eligibilityTagsEn || scheme.eligibilityTags || []).slice(0, 2).map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-success-light text-success text-[10px] font-body rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Action buttons */}
            <div className="p-3 border-t border-gray-200 space-y-2">
                <Link
                    to="/twin"
                    className="flex items-center justify-center gap-2 h-10 w-full rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors"
                >
                    View Digital Twin <ArrowRight size={14} />
                </Link>
                <button className="flex items-center justify-center gap-2 h-9 w-full rounded-lg border border-gray-200 text-gray-600 font-body text-xs hover:bg-gray-50 transition-colors">
                    <Download size={14} /> Download Report
                </button>
            </div>
        </div>
    );
}

export default ResultsPanel;
