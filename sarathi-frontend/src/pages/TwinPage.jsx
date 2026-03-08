import { useState, useEffect, Component } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, AlertTriangle, Clock, TrendingUp, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import PathwayChart from '../components/twin/PathwayChart';
import { useLanguage } from '../context/LanguageContext';
import { useCitizen } from '../context/CitizenContext';
import { t } from '../utils/translations';
import { localizeNum } from '../utils/formatters';
import SchemeTimeline from '../components/twin/SchemeTimeline';
import ConflictResolver from '../components/twin/ConflictResolver';
import { getDigitalTwin, detectConflicts } from '../utils/api';

function generateLocalTwin(monthlyIncome, schemes) {
    const annualBenefit = schemes.reduce((s, sc) => s + (sc.annualBenefit || 0), 0);
    const monthlyBoost = annualBenefit / 12;
    const pts = Array.from({ length: 13 }, (_, i) => {
        const mo = i * 3;
        return {
            month: mo,
            income: Math.round(monthlyIncome + monthlyBoost * (mo / 36) + monthlyIncome * 0.02 * (mo / 12)),
        };
    });
    return {
        currentMonthlyIncome: monthlyIncome,
        pathways: {
            best: pts,
            medium: pts.map(p => ({ ...p, income: Math.round(p.income * 0.85) })),
            minimum: pts.map(p => ({ ...p, income: Math.round(p.income * 0.70) })),
        },
        predictedEvents: [],
        aiNarrative: '',
    };
}

// G3: Error boundary for charts
class ChartErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 text-center">
                    <AlertTriangle size={24} className="text-amber-500 mx-auto mb-2" />
                    <p className="font-body text-sm text-gray-500">Chart failed to render.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

/* ── Event impact colors and icons ─────────────────────────────────── */
const EVENT_IMPACT = {
    positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    urgent: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    action_needed: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
};

const EVENT_TYPE_ICONS = {
    eligibility_window: '🎯',
    milestone: '🎓',
    seasonal: '🌾',
    age_out_warning: '⏳',
    income_change: '💰',
};

function PredictiveTimeline({ events, language }) {
    const isHi = language === 'hi';
    if (!events || events.length === 0) return null;

    return (
        <div className="space-y-3">
            {events.map((event, idx) => {
                const impact = EVENT_IMPACT[event.impact] || EVENT_IMPACT.positive;
                const icon = EVENT_TYPE_ICONS[event.type] || '📌';

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`relative flex gap-4 ${impact.bg} ${impact.border} border rounded-xl p-4`}
                    >
                        {/* Timeline connector */}
                        {idx < events.length - 1 && (
                            <div className="absolute left-[27px] top-14 bottom-[-12px] w-0.5 bg-gray-200" />
                        )}

                        {/* Year badge */}
                        <div className="flex flex-col items-center shrink-0">
                            <div className={`w-10 h-10 rounded-full ${impact.dot} flex items-center justify-center text-white text-lg`}>
                                {icon}
                            </div>
                            <span className="font-mono text-xs font-bold text-gray-600 mt-1">{event.year}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-body text-sm font-bold ${impact.text}`}>
                                {isHi ? event.eventHi : event.event}
                            </h4>
                            <p className="font-body text-xs text-gray-600 mt-1 leading-relaxed">
                                {isHi ? event.descriptionHi : event.description}
                            </p>

                            {/* Related schemes */}
                            {event.schemes && event.schemes.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {event.schemes.map((s, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-full bg-white/70 border border-gray-200 font-body text-[10px] text-gray-600">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Impact badge */}
                        <div className="shrink-0">
                            {event.impact === 'urgent' && (
                                <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-body text-[10px] font-bold uppercase">
                                    {isHi ? 'तत्काल' : 'Urgent'}
                                </span>
                            )}
                            {event.impact === 'action_needed' && (
                                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-body text-[10px] font-bold uppercase">
                                    {isHi ? 'कार्रवाई' : 'Action'}
                                </span>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

function TwinPage() {
    const { citizenProfile, eligibleSchemes } = useCitizen();
    const { language } = useLanguage();
    const T = (key) => t(key, language);
    const isHi = language === 'hi';

    const hasCitizenData = citizenProfile && citizenProfile.name;
    const citizenName = hasCitizenData ? citizenProfile.name : (isHi ? 'नागरिक' : 'Citizen');
    const citizenAge = hasCitizenData ? (citizenProfile.age || 30) : 30;
    const citizenState = hasCitizenData ? (citizenProfile.state || 'UP') : 'UP';
    const citizenCategory = hasCitizenData ? (citizenProfile.category || 'General') : 'General';

    const monthlyIncome = hasCitizenData ? (citizenProfile.income || 2000) : 2000;
    const matchedSchemes = eligibleSchemes;

    const [twinData, setTwinData] = useState(null);
    const [conflictData, setConflictData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('projection'); // 'projection' | 'predictions' | 'conflicts'

    useEffect(() => {
        setLoading(true);
        setError(null);

        const twinPromise = getDigitalTwin({
            monthlyIncome,
            matchedSchemes,
            citizenProfile: citizenProfile || {},
            includePredictions: true,
        }).catch(() => null);

        const conflictPromise = matchedSchemes.length > 0
            ? detectConflicts({ matchedSchemes, optimize: true }).catch(() => null)
            : Promise.resolve(null);

        Promise.all([twinPromise, conflictPromise])
            .then(([twin, conflicts]) => {
                setTwinData(twin || generateLocalTwin(monthlyIncome, matchedSchemes));
                if (conflicts) setConflictData(conflicts);
            })
            .finally(() => setLoading(false));
    }, [monthlyIncome, eligibleSchemes]);

    // G3: Null guards
    const currentIncome = twinData?.currentMonthlyIncome || monthlyIncome;
    const pathways = twinData?.pathways || { best: [], medium: [], minimum: [] };
    const bestPathway = pathways?.best || [];
    const after3YearsIncome = bestPathway.length > 0
        ? (bestPathway[bestPathway.length - 1]?.income ?? currentIncome)
        : currentIncome;

    const totalBenefit = matchedSchemes.reduce((s, sc) => s + (sc.annualBenefit || 0), 0);
    const activeSchemes = matchedSchemes.length;

    // Predictive data
    const predictedEvents = twinData?.predictedEvents || [];
    const aiNarrative = twinData?.aiNarrative || '';
    const urgentEvents = predictedEvents.filter(e => e.impact === 'urgent');
    const opportunityEvents = predictedEvents.filter(e => e.impact === 'positive');

    // Conflict optimizer data
    const opportunityCosts = conflictData?.opportunityCosts || [];
    const optimizationMethod = conflictData?.optimizationMethod || 'rule_based';
    const aiExplanation = conflictData?.aiExplanation || '';

    if (loading) {
        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-saffron/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Sparkles className="text-saffron" size={28} />
                    </div>
                    <Loader2 className="animate-spin text-saffron mx-auto mb-3" size={24} />
                    <span className="font-body text-sm text-gray-500">{isHi ? 'AI प्रोजेक्शन तैयार हो रही है...' : 'AI is building your projection...'}</span>
                </div>
            </div>
        );
    }

    if (!hasCitizenData || matchedSchemes.length === 0) {
        return (
            <div className="min-h-screen bg-off-white flex flex-col items-center justify-center gap-4">
                <p className="font-body text-gray-500 text-center max-w-xs">
                    Complete the Sarathi chat first to generate your Digital Twin projection.
                </p>
                <Link to="/chat" className="px-5 py-2.5 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors">
                    Start Chat &rarr;
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-off-white">
            {/* Header */}
            <div className="bg-navy py-8 lg:py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-1 font-body text-xs text-gray-300 mb-3" aria-label="Breadcrumb">
                        <Link to="/" className="hover:text-white transition-colors">{isHi ? 'होम' : 'Home'}</Link>
                        <ChevronRight size={12} />
                        <Link to="/chat" className="hover:text-white transition-colors">{isHi ? 'चैट' : 'Chat'}</Link>
                        <ChevronRight size={12} />
                        <span className="text-white">{isHi ? 'आपका रोडमैप' : 'Your Roadmap'}</span>
                    </nav>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8"
                    >
                        <div className="w-16 h-16 rounded-full bg-saffron/20 border-2 border-saffron/40 flex items-center justify-center shrink-0">
                            <span className="font-display text-2xl text-saffron">{citizenName[0]}</span>
                        </div>

                        <div className="flex-1">
                            <h1 className="font-display text-[28px] lg:text-[36px] text-white">{T('twinTitle')}</h1>
                            <p className="font-body text-sm text-gray-300 mt-1">
                                {isHi ? `AI-संचालित ${localizeNum(3, language)}-${localizeNum(5, language)} वर्ष का भविष्य रोडमैप` : 'AI-powered 3-5 year future roadmap with predictions'}
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className="px-4 py-1.5 rounded-full bg-navy-mid border border-navy-light text-white font-body text-xs font-medium">
                                {citizenName} | {localizeNum(citizenAge, language)} {isHi ? 'वर्ष' : 'years'} | {citizenState} | {citizenCategory}
                            </span>
                            <Link to="/chat" className="font-body text-xs text-saffron hover:underline" aria-label="Change profile">
                                {T('twinChangeProfile')}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="text-center py-4 mb-4">
                        <span className="text-sm text-danger font-body">&#9679; {error}</span>
                    </div>
                )}

                {/* AI Narrative Banner */}
                {aiNarrative && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-gradient-to-r from-saffron/5 to-orange-50 rounded-xl border border-saffron/20 p-4 flex items-start gap-3"
                    >
                        <Sparkles size={20} className="text-saffron shrink-0 mt-0.5" />
                        <div>
                            <p className="font-body text-xs text-saffron font-bold uppercase tracking-wider mb-1">
                                {isHi ? 'AI अंतर्दृष्टि' : 'AI Insight'}
                            </p>
                            <p className="font-body text-sm text-gray-700 leading-relaxed">{aiNarrative}</p>
                        </div>
                    </motion.div>
                )}

                {/* Urgent Alerts */}
                {urgentEvents.length > 0 && (
                    <div className="mb-6 bg-red-50 rounded-xl border border-red-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} className="text-red-500" />
                            <span className="font-body text-sm font-bold text-red-700">
                                {isHi ? `${urgentEvents.length} तत्काल चेतावनी` : `${urgentEvents.length} Urgent Alert(s)`}
                            </span>
                        </div>
                        {urgentEvents.map((e, i) => (
                            <p key={i} className="font-body text-xs text-red-600 ml-6">
                                {isHi ? e.descriptionHi : e.description}
                            </p>
                        ))}
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
                    <StatCard
                        icon="💰"
                        value={`₹${localizeNum(currentIncome.toLocaleString('en-IN'), language)}/${isHi ? 'माह' : 'mo'}`}
                        label={T('twinCurrentIncome')}
                        variant="warning"
                    />
                    <StatCard
                        icon="📈"
                        value={`₹${localizeNum(after3YearsIncome.toLocaleString('en-IN'), language)}/${isHi ? 'माह' : 'mo'}`}
                        label={T('twinAfter3Years')}
                        variant="success"
                    />
                    <StatCard
                        icon="💵"
                        value={`₹${localizeNum(totalBenefit.toLocaleString('en-IN'), language)}`}
                        label={T('twinTotalBenefit')}
                        variant="primary"
                    />
                    <StatCard
                        icon="📋"
                        value={localizeNum(activeSchemes, language)}
                        label={T('twinActiveSchemes')}
                        variant="dark"
                    />
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
                    {[
                        { id: 'projection', label: isHi ? 'आय प्रोजेक्शन' : 'Income Projection', icon: TrendingUp },
                        { id: 'predictions', label: isHi ? 'भविष्य टाइमलाइन' : 'Future Timeline', icon: Calendar, count: predictedEvents.length },
                        { id: 'conflicts', label: isHi ? 'अनुकूलन' : 'Optimization', icon: Sparkles },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-body text-sm font-medium transition-all
                                ${activeTab === tab.id ? 'bg-white text-saffron shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-saffron/10 text-saffron text-[10px] font-bold">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'projection' && (
                    <>
                        {/* PathwayChart */}
                        {bestPathway.length > 0 && (
                            <div className="mb-8">
                                <h2 className="font-body text-xl font-bold text-gray-900 mb-4">{T('twinIncomeChart')}</h2>
                                <ChartErrorBoundary>
                                    <PathwayChart pathways={pathways} />
                                </ChartErrorBoundary>
                            </div>
                        )}

                        {/* Scheme Timeline */}
                        <div className="mb-8">
                            <h2 className="font-body text-xl font-bold text-gray-900 mb-4">{T('twinSchemeSequence')}</h2>
                            <ChartErrorBoundary>
                                <SchemeTimeline bestPathway={bestPathway} />
                            </ChartErrorBoundary>
                        </div>
                    </>
                )}

                {activeTab === 'predictions' && (
                    <div className="mb-8">
                        <h2 className="font-body text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-saffron" />
                            {isHi ? 'आपकी 3-5 वर्ष भविष्य टाइमलाइन' : 'Your 3-5 Year Future Timeline'}
                        </h2>
                        <p className="font-body text-sm text-gray-500 mb-6">
                            {isHi ? 'AI ने आपकी प्रोफ़ाइल के आधार पर ये जीवन घटनाएं और अवसर भविष्यवाणी की हैं।' : 'AI has predicted these life events and opportunities based on your profile.'}
                        </p>
                        {predictedEvents.length > 0 ? (
                            <PredictiveTimeline events={predictedEvents} language={language} />
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                                <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
                                <p className="font-body text-sm text-gray-500">
                                    {isHi ? 'पूर्ण प्रोफ़ाइल के साथ भविष्यवाणियां उपलब्ध होंगी।' : 'Predictions available with a complete profile.'}
                                </p>
                            </div>
                        )}

                        {/* Opportunity window summary */}
                        {opportunityEvents.length > 0 && (
                            <div className="mt-6 bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                                <h3 className="font-body text-sm font-bold text-emerald-800 mb-2">
                                    {isHi ? `${opportunityEvents.length} आगामी अवसर` : `${opportunityEvents.length} Upcoming Opportunities`}
                                </h3>
                                <div className="space-y-1">
                                    {opportunityEvents.slice(0, 3).map((e, i) => (
                                        <p key={i} className="font-body text-xs text-emerald-700 flex items-center gap-2">
                                            <ArrowRight size={10} />
                                            {e.year}: {isHi ? e.eventHi : e.event}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'conflicts' && (
                    <div className="mb-8">
                        <h2 className="font-body text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Sparkles size={20} className="text-saffron" />
                            {isHi ? 'गेम थ्योरी अनुकूलन' : 'Game Theory Optimization'}
                        </h2>

                        {/* Optimization method badge */}
                        {optimizationMethod === 'game_theory' && (
                            <div className="mb-4 flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 font-body text-xs text-purple-700 font-medium">
                                    {isHi ? 'गणितीय अनुकूलन' : 'Mathematical Optimization'}
                                </span>
                                <span className="font-body text-xs text-gray-500">
                                    {isHi ? 'अधिकतम लाभ के लिए AI-गणना' : 'AI-computed for maximum benefit'}
                                </span>
                            </div>
                        )}

                        {/* AI explanation */}
                        {aiExplanation && (
                            <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-4">
                                <p className="font-body text-xs text-purple-700 font-bold mb-1">
                                    {isHi ? 'AI विश्लेषण' : 'AI Analysis'}
                                </p>
                                <p className="font-body text-sm text-gray-700 leading-relaxed">{aiExplanation}</p>
                            </div>
                        )}

                        <ConflictResolver conflictData={conflictData} />

                        {/* Opportunity costs */}
                        {opportunityCosts.length > 0 && (
                            <div className="mt-6 bg-amber-50 rounded-xl border border-amber-200 p-4">
                                <h3 className="font-body text-sm font-bold text-amber-800 mb-3">
                                    {isHi ? 'अवसर लागत (छोड़ी गई योजनाएं)' : 'Opportunity Costs (Excluded Schemes)'}
                                </h3>
                                <div className="space-y-2">
                                    {opportunityCosts.map((oc, i) => (
                                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-amber-100 last:border-0">
                                            <div>
                                                <p className="font-body text-sm text-gray-700">{oc.schemeName}</p>
                                                <p className="font-body text-[10px] text-amber-600">{oc.reason}</p>
                                            </div>
                                            <span className="font-mono text-sm text-amber-700 font-medium">
                                                -₹{(oc.lostBenefit || 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TwinPage;
