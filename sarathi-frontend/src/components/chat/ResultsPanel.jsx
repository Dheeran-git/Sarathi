import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';

function ResultsPanel({ schemes = [], visible = false }) {
    if (!visible) return null;

    const totalBenefit = schemes.reduce((sum, s) => sum + (s.annualBenefit || 0), 0);

    return (
        <div className="h-full bg-[#0f172a] border-r border-slate-800 overflow-y-auto">
            <div className="p-4 border-b border-slate-800">
                <h3 className="font-body text-base font-bold text-[#f8fafc]">Matched Schemes</h3>
                <p className="font-body text-xs text-slate-400 mt-0.5">
                    {schemes.length} schemes found • Total: ₹{totalBenefit.toLocaleString('en-IN')}/year
                </p>
            </div>

            <div className="p-3 space-y-2">
                {schemes.map((scheme) => (
                    <Link
                        key={scheme.schemeId || scheme.id}
                        to={`/schemes/${scheme.schemeId || scheme.id}`}
                        className="block p-3 bg-[#020617] rounded-lg hover:bg-slate-800/50 transition-colors border border-slate-800 hover:border-indigo-500/30"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="font-body text-sm font-medium text-[#f8fafc] truncate">
                                    {scheme.nameEnglish || scheme.name}
                                </p>
                                <p className="font-body text-xs text-slate-500 mt-0.5">{scheme.ministry}</p>
                            </div>
                            <span className="font-mono text-sm font-bold text-indigo-400 shrink-0">
                                ₹{(scheme.annualBenefit || 0) >= 100000
                                    ? `${((scheme.annualBenefit || 0) / 100000).toFixed((scheme.annualBenefit || 0) % 100000 === 0 ? 0 : 1)}L`
                                    : (scheme.annualBenefit || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {(scheme.eligibilityTagsEn || scheme.eligibilityTags || []).slice(0, 2).map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-body rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Action buttons */}
            <div className="p-3 border-t border-slate-800 space-y-2">
                <Link
                    to="/twin"
                    className="flex items-center justify-center gap-2 h-10 w-full rounded-lg bg-indigo-600 text-white font-body text-sm font-medium hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                >
                    View Digital Twin <ArrowRight size={14} />
                </Link>
                <button className="flex items-center justify-center gap-2 h-9 w-full rounded-lg border border-slate-700 bg-[#020617] text-slate-300 font-body text-xs hover:bg-slate-800 hover:text-[#f8fafc] transition-colors">
                    <Download size={14} /> Download Report
                </button>
            </div>
        </div>
    );
}

export default ResultsPanel;
