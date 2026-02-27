import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, RefreshCw, Download } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { localizeNum } from '../utils/formatters';
import VillageMap from '../components/panchayat/VillageMap';
import AlertsPanel from '../components/panchayat/AlertsPanel';
import CitizenTable from '../components/panchayat/CitizenTable';
import GovernanceHeatmap from '../components/panchayat/GovernanceHeatmap';
import { panchayatStats, alerts, eligibleCitizens, households, heatmapData, heatmapSchemes } from '../data/mockPanchayat';

/**
 * PanchayatDashboard — the Sarpanch's comprehensive welfare dashboard.
 * Spec §9 — includes breadcrumb, refresh/download buttons, 5 stat cards,
 * village map + alerts, citizen table, governance heatmap.
 */
function PanchayatDashboard() {
  const { language } = useLanguage();
  const T = (key) => t(key, language);
  const isHi = language === 'hi';
  return (
    <div className="min-h-screen bg-off-white">
      {/* Header — spec lines 930-943 */}
      <div className="bg-gradient-to-r from-navy to-navy-mid py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
          >
            <div>
              {/* Breadcrumb — spec line 935 */}
              <nav className="flex items-center gap-1 font-body text-xs text-gray-400 mb-2" aria-label="Breadcrumb">
                <Link to="/" className="hover:text-white transition-colors">{T('panchHome')}</Link>
                <ChevronRight size={12} />
                <span className="text-gray-300">{T('panchDashboard')}</span>
              </nav>

              <h1 className="font-display text-[28px] lg:text-[36px] text-white">
                {isHi ? panchayatStats.panchayatName : panchayatStats.panchayatNameEnglish}
              </h1>
              <p className="font-body text-sm text-gray-300">
                {isHi ? 'जिला:' : 'District:'} {isHi ? panchayatStats.district : 'Barabanki'}, {isHi ? panchayatStats.state : 'Uttar Pradesh'} • {localizeNum(panchayatStats.totalHouseholds, language)} {isHi ? 'परिवार' : 'Households'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-success/20 text-success font-body text-xs font-medium">
                {isHi ? '🟢 लाइव डेटा' : '🟢 Live Data'}
              </span>
              <span className="font-body text-xs text-gray-400">
                {T('panchLastUpdated')}: {isHi ? '२ घंटे पहले' : '2 hours ago'}
              </span>
              {/* Refresh button — spec line 941 */}
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-saffron/20 text-saffron hover:bg-saffron/30 transition-colors"
                aria-label="Refresh data"
              >
                <RefreshCw size={16} />
              </button>
              {/* Download report — spec line 942 */}
              <button className="hidden md:flex items-center gap-1.5 h-9 px-4 rounded-lg border border-saffron/40 text-saffron font-body text-xs font-medium hover:bg-saffron/10 transition-colors">
                <Download size={14} /> {T('panchDownload')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Row — spec lines 946-952 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatCard icon="🏠" value={panchayatStats.totalHouseholds} label={T('panchTotalHouseholds')} variant="primary" />
          <StatCard icon="✅" value={`${panchayatStats.receiving} (${panchayatStats.receivingPercent}%)`} label={T('panchReceiving')} variant="success" trend={12} progress={panchayatStats.receivingPercent} />
          <StatCard icon="⚠️" value={panchayatStats.eligibleNotEnrolled} label={T('panchEligibleNot')} variant="warning" trend={-8} />
          <StatCard icon="🔴" value={panchayatStats.zeroBenefits} label={T('panchZero')} variant="primary" />
          <StatCard icon="📈" value={`+${panchayatStats.addedThisMonth}`} label={T('panchThisMonth')} variant="dark" trend={23} />
        </div>

        {/* Village Map + Alerts — spec lines 956-1013 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-6">
          <div>
            <h2 className="font-body text-lg font-bold text-gray-900 mb-3">{T('panchMapTitle')}</h2>
            <VillageMap households={households} />
          </div>
          <AlertsPanel alerts={alerts} />
        </div>

        {/* Citizen Table — spec lines 1016-1041 */}
        <div className="mb-6">
          <CitizenTable citizens={eligibleCitizens} />
        </div>

        {/* Governance Heatmap — spec lines 1044-1063 */}
        <GovernanceHeatmap data={heatmapData} schemes={heatmapSchemes} />
      </div>
    </div>
  );
}

export default PanchayatDashboard;
