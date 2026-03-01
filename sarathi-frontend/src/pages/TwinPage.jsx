import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import PathwayChart from '../components/twin/PathwayChart';
import { useLanguage } from '../context/LanguageContext';
import { useCitizen } from '../context/CitizenContext';
import { t } from '../utils/translations';
import { localizeNum } from '../utils/formatters';
import SchemeTimeline from '../components/twin/SchemeTimeline';
import ConflictResolver from '../components/twin/ConflictResolver';
import { getDigitalTwin, detectConflicts } from '../utils/api';

/**
 * TwinPage — Digital Twin Dashboard for a citizen's welfare pathway.
 * All data fetched from live AWS API.
 */
function TwinPage() {
  const { citizenProfile, eligibleSchemes } = useCitizen();
  const { language } = useLanguage();
  const T = (key) => t(key, language);
  const isHi = language === 'hi';

  // Use context profile if available
  const hasCitizenData = citizenProfile && citizenProfile.name;
  const citizenName = hasCitizenData ? citizenProfile.name : (isHi ? 'नागरिक' : 'Citizen');
  const citizenAge = hasCitizenData ? (citizenProfile.age || 30) : 30;
  const citizenState = hasCitizenData ? (citizenProfile.state || 'UP') : 'UP';
  const citizenCategory = hasCitizenData ? (citizenProfile.category || 'General') : 'General';

  const monthlyIncome = hasCitizenData ? (citizenProfile.income || 2000) : 2000;
  // Bug fix: use eligibleSchemes directly (stable useState reference from context)
  // instead of deriving a new array every render, which causes stale dep in useEffect
  const matchedSchemes = eligibleSchemes;

  // Live API data
  const [twinData, setTwinData] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const twinPromise = getDigitalTwin({
      monthlyIncome,
      matchedSchemes,
    }).catch(() => null);

    const conflictPromise = matchedSchemes.length > 0
      ? detectConflicts({ matchedSchemes }).catch(() => null)
      : Promise.resolve(null);

    Promise.all([twinPromise, conflictPromise])
      .then(([twin, conflicts]) => {
        if (twin) {
          setTwinData(twin);
        } else {
          setError(isHi ? 'सर्वर से कनेक्ट नहीं हो पा रहा' : 'Could not connect to server');
        }
        if (conflicts) setConflictData(conflicts);
      })
      .finally(() => setLoading(false));
    // Bug fix: depend on eligibleSchemes (stable useState ref) not matchedSchemes.length
    // matchedSchemes.length misses changes where scheme content changes but count stays same
  }, [monthlyIncome, eligibleSchemes]);

  // Compute display values from live data
  const currentIncome = twinData?.currentMonthlyIncome || monthlyIncome;
  const povertyLine = twinData?.povertyLine || 8000;
  const pathways = twinData?.pathways || { best: [], medium: [], minimum: [] };
  const monthsToExit = twinData?.monthsToPovertyExit?.best || null;

  const bestPathway = pathways?.best || [];
  const after3YearsIncome = bestPathway.length > 0 ? bestPathway[bestPathway.length - 1]?.income : currentIncome;

  const totalBenefit = matchedSchemes.reduce((s, sc) => s + (sc.annualBenefit || 0), 0);
  const activeSchemes = matchedSchemes.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mr-3" size={24} />
        <span className="font-body text-sm text-gray-500">{isHi ? 'प्रोजेक्शन लोड हो रहा है...' : 'Loading projections...'}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-slate-800 py-8 lg:py-10" style={{ background: 'radial-gradient(ellipse at bottom center, rgba(99,102,241,0.08), #0f172a 70%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 font-body text-xs text-slate-400 mb-3" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[#f8fafc] transition-colors">{isHi ? 'होम' : 'Home'}</Link>
            <ChevronRight size={12} />
            <Link to="/chat" className="hover:text-[#f8fafc] transition-colors">{isHi ? 'चैट' : 'Chat'}</Link>
            <ChevronRight size={12} />
            <span className="text-slate-300">{isHi ? 'आपका रोडमैप' : 'Your Roadmap'}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <span className="font-display text-2xl text-indigo-400">{citizenName[0]}</span>
            </div>

            <div className="flex-1">
              <h1 className="font-display text-[28px] lg:text-[36px] text-[#f8fafc]">{T('twinTitle')}</h1>
              <p className="font-body text-sm text-slate-400 mt-1">
                {isHi ? `अगले ${localizeNum(3, language)} वर्षों में आप गरीबी रेखा से ऊपर आ सकते हैं।` : 'In the next 3 years, you can rise above the poverty line.'}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="px-4 py-1.5 rounded-full bg-[#020617] border border-slate-700 text-[#f8fafc] font-body text-xs font-medium">
                {citizenName} | {localizeNum(citizenAge, language)} {isHi ? 'वर्ष' : 'years'} | {citizenState} | {citizenCategory}
              </span>
              <Link to="/chat" className="font-body text-xs text-indigo-400 hover:underline" aria-label="Change profile">
                {T('twinChangeProfile')}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="text-center py-4 mb-4">
            <span className="text-sm text-red-500 font-body">🔴 {error}</span>
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

        {/* Pathway Chart */}
        {bestPathway.length > 0 && (
          <div className="mb-8">
            <h2 className="font-body text-xl font-bold text-[#f8fafc] mb-4">{T('twinIncomeChart')}</h2>
            <PathwayChart pathways={pathways} />
          </div>
        )}

        {/* Two column: timeline + conflict */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
          <div>
            <h2 className="font-body text-xl font-bold text-[#f8fafc] mb-4">{T('twinSchemeSequence')}</h2>
            <SchemeTimeline bestPathway={bestPathway} />
          </div>
          <div>
            <h2 className="font-body text-xl font-bold text-[#f8fafc] mb-4">{T('twinConflict')}</h2>
            <ConflictResolver conflictData={conflictData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TwinPage;
