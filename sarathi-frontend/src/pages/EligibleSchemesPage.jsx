import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, MessageSquare } from 'lucide-react';
import { useCitizen } from '../context/CitizenContext';
import { CATEGORY_STYLE, FALLBACK_STYLE } from '../constants/categories';

function EligibleSchemesPage() {
    const navigate = useNavigate();
    const { eligibleSchemes } = useCitizen();

    // D5: Sort by annualBenefit descending
    const sortedSchemes = useMemo(() =>
        [...eligibleSchemes].sort((a, b) => (b.annualBenefit || 0) - (a.annualBenefit || 0)),
        [eligibleSchemes]
    );

    // D5: Total potential
    const totalPotential = useMemo(() =>
        eligibleSchemes.reduce((s, sc) => s + (sc.annualBenefit || 0), 0),
        [eligibleSchemes]
    );

    const totalStr = totalPotential >= 100000
        ? `₹${(totalPotential / 100000).toFixed(totalPotential % 100000 === 0 ? 0 : 1)}L`
        : `₹${totalPotential.toLocaleString('en-IN')}`;

    return (
        <div className="min-h-screen bg-off-white pb-12">
            {/* Header */}
            <div className="bg-navy py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-1 font-body text-sm text-gray-300 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <h1 className="font-display text-3xl text-white">
                        Your Eligible Schemes
                    </h1>
                    {/* D5: Show count + total potential */}
                    <p className="font-body text-gray-300 mt-1 text-sm">
                        {eligibleSchemes.length} scheme{eligibleSchemes.length !== 1 ? 's' : ''} matched
                        {totalPotential > 0 && ` • Total potential: ${totalStr}/year`}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {sortedSchemes.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-10 text-center max-w-lg mx-auto">
                        <div className="w-16 h-16 rounded-full bg-saffron-pale flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={28} className="text-saffron" />
                        </div>
                        <h2 className="font-display text-2xl text-gray-900 mb-2">No Schemes Yet</h2>
                        <p className="font-body text-gray-600 mb-6">
                            Complete the AI chat to discover government schemes you qualify for.
                        </p>
                        <button
                            onClick={() => navigate('/chat')}
                            className="inline-flex items-center gap-2 h-11 px-8 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors shadow-saffron"
                        >
                            <MessageSquare size={16} /> Start Chat
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {sortedSchemes.map((scheme) => {
                            const id = scheme.schemeId || scheme.id;
                            const benefit = Number(scheme.annualBenefit) || 0;
                            const benefitStr = benefit >= 100000
                                ? `₹${(benefit / 100000).toFixed(benefit % 100000 === 0 ? 0 : 1)}L`
                                : `₹${benefit.toLocaleString('en-IN')}`;
                            const catStyle = CATEGORY_STYLE[scheme.category] || FALLBACK_STYLE;

                            return (
                                <div key={id} className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span className={`text-[10px] font-body px-2 py-0.5 rounded-full font-medium ${catStyle.pill}`}>
                                            {(scheme.category || '').toUpperCase()}
                                        </span>
                                        {scheme.ministry && (
                                            <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium truncate max-w-[160px]">
                                                {scheme.ministry}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-body text-base font-bold text-gray-900 mb-1 leading-snug flex-1">
                                        {scheme.nameEnglish || scheme.name}
                                    </h3>

                                    <div className="mt-3 mb-4">
                                        <p className="font-body text-xs text-gray-500">Annual Benefit</p>
                                        <p className="font-mono text-xl font-bold text-navy">{benefitStr}</p>
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => navigate(`/schemes/${id}`)}
                                            className="flex-1 h-9 rounded-lg border border-gray-200 text-gray-700 font-body text-xs font-medium hover:border-saffron/50 hover:text-saffron transition-colors"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => navigate(`/apply/${id}`)}
                                            className="flex-1 h-9 rounded-lg bg-saffron text-white font-body text-xs font-semibold hover:bg-saffron-light transition-colors"
                                        >
                                            Apply Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EligibleSchemesPage;
