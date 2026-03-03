import { useState, useEffect, Component } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
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

    useEffect(() => {
        setLoading(true);
        setError(null);

        const twinPromise = getDigitalTwin({ monthlyIncome, matchedSchemes }).catch(() => null);
        const conflictPromise = matchedSchemes.length > 0
            ? detectConflicts({ matchedSchemes }).catch(() => null)
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

    if (loading) {
        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <Loader2 className="animate-spin text-saffron mr-3" size={24} />
                <span className="font-body text-sm text-gray-500">{isHi ? 'प्रोजेक्शन लोड हो रहा है...' : 'Loading projections...'}</span>
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
                    Start Chat →
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
                                {isHi ? `अगले ${localizeNum(3, language)} वर्षों में आप गरीबी रेखा से ऊपर आ सकते हैं।` : 'In the next 3 years, you can rise above the poverty line.'}
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

                {/* G3: PathwayChart in error boundary */}
                {bestPathway.length > 0 && (
                    <div className="mb-8">
                        <h2 className="font-body text-xl font-bold text-gray-900 mb-4">{T('twinIncomeChart')}</h2>
                        <ChartErrorBoundary>
                            <PathwayChart pathways={pathways} />
                        </ChartErrorBoundary>
                    </div>
                )}

                {/* Two column: timeline + conflict */}
                <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
                    <div>
                        <h2 className="font-body text-xl font-bold text-gray-900 mb-4">{T('twinSchemeSequence')}</h2>
                        <ChartErrorBoundary>
                            <SchemeTimeline bestPathway={bestPathway} />
                        </ChartErrorBoundary>
                    </div>
                    <div>
                        <h2 className="font-body text-xl font-bold text-gray-900 mb-4">{T('twinConflict')}</h2>
                        <ConflictResolver conflictData={conflictData} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TwinPage;
