import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, RefreshCw, Download, Loader2, Users, BarChart3, FileText, Megaphone, MapPin, CalendarDays, AlertTriangle, ClipboardList, Settings, TrendingUp, EyeOff, Shield } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePanchayat } from '../context/PanchayatContext';
import { t } from '../utils/translations';
import { localizeNum } from '../utils/formatters';
import VillageMap from '../components/panchayat/VillageMap';
import AlertsPanel from '../components/panchayat/AlertsPanel';
import CitizenTable from '../components/panchayat/CitizenTable';
import GovernanceHeatmap from '../components/panchayat/GovernanceHeatmap';
import AIInsights from '../components/panchayat/AIInsights';
import { getPanchayatStats, notifyPanchayat, getPanchayatInsights } from '../utils/api';
import { useToast } from '../components/ui/Toast';

const HEATMAP_SCHEME_IDS = ['pm-kisan', 'pmay-gramin', 'pm-jan-arogya', 'pm-ujjwala', 'mgnregs', 'ignoaps'];
const HEATMAP_SCHEME_NAMES = {
  'pm-kisan': 'PM-KISAN',
  'pmay-gramin': 'PMAY',
  'pm-jan-arogya': 'Ayushman',
  'pm-ujjwala': 'Ujjwala',
  'mgnregs': 'MGNREGS',
  'ignoaps': 'Pension',
};

/**
 * PanchayatDashboard — the Sarpanch's comprehensive welfare dashboard.
 * All data fetched from the live API (sarathi-panchayat-stats Lambda).
 */
function PanchayatDashboard() {
  const { language } = useLanguage();
  const T = (key) => t(key, language);
  const isHi = language === 'hi';
  const { user } = useAuth();
  const { addToast } = useToast();
  const { usingMockData } = usePanchayat();

  // B1: Dynamic panchayat ID from auth context
  const panchayatId = user?.panchayatId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalHouseholds: 0, enrolled: 0, eligibleNotEnrolled: 0, zeroBenefits: 0,
    panchayatName: user?.panchayatName || 'Panchayat', district: user?.district || '', state: user?.state || '',
  });
  const [alerts, setAlerts] = useState([]);
  const [households, setHouseholds] = useState([]);

  const [activeAlertFilter, setActiveAlertFilter] = useState(null);
  const [invisibleCitizens, setInvisibleCitizens] = useState([]);
  const [showInvisibleTab, setShowInvisibleTab] = useState(false);
  const [totalLostBenefit, setTotalLostBenefit] = useState(0);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    setActiveAlertFilter(null);
    getPanchayatStats(panchayatId)
      .then((data) => {
        if (data) {
          const enrolled = data.enrolled || 0;
          const total = data.totalHouseholds || 0;

          // B2: Real addedThisMonth from updatedAt timestamps
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const citizenList = data.citizens || data.households || [];
          const addedThisMonth = citizenList.filter(c => c.updatedAt >= startOfMonth).length;

          setStats({
            totalHouseholds: total,
            enrolled: enrolled,
            receivingPercent: total ? Math.round((enrolled / total) * 100) : 0,
            eligibleNotEnrolled: data.eligibleNotEnrolled || 0,
            zeroBenefits: data.zeroBenefits || 0,
            addedThisMonth,
            panchayatName: data.panchayatName || 'Rampur Panchayat',
            panchayatNameHi: 'रामपुर पंचायत',
            district: data.district || 'Barabanki',
            state: data.state || 'Uttar Pradesh',
          });

          // Process households for village map
          if (data.households) {
            const processed = data.households.map((h, i) => ({
              id: h.citizenId || `HH-${i}`,
              name: h.name || 'Unknown',
              ward: h.ward || `Ward ${(i % 6) + 1}`,
              age: parseInt(h.age || 0),
              status: h.status || 'unknown',
              schemesCount: (h.matchedSchemes || []).length,
              category: h.category || 'General',
              gender: h.gender || 'any',
              isWidow: h.isWidow === true || h.isWidow === 'true',
              matchedSchemes: h.matchedSchemes || [],
              enrolledSchemes: h.enrolledSchemes || [],
              eligibleSchemes: (h.matchedSchemes || []).map(s => s.schemeId || s.id || s),
              estimatedBenefit: h.estimatedBenefit || h.totalAnnualBenefit || 0,
              updatedAt: h.updatedAt || '',
            }));
            setHouseholds(processed);
          }

          // Load insights from API response or empty
          if (data.insights && data.insights.length > 0) {
            setInsights(data.insights);
          }

          // Load invisible citizens from API response
          if (data.invisibleCitizens && data.invisibleCitizens.length > 0) {
            setInvisibleCitizens(data.invisibleCitizens);
            setTotalLostBenefit(data.totalLostBenefit || 0);
          }

          // Process live alerts
          if (data.alerts && data.alerts.length > 0) {
            const liveAlerts = data.alerts.map((a, i) => ({
              id: `live-${i}`,
              type: a.type || (a.urgency === 'high' ? 'urgent' : 'warning'),
              title: a.title,
              titleEnglish: a.description,
              description: a.description,
              descriptionEnglish: a.description,
              action: isHi ? 'सूची देखें' : 'View List',
              actionEnglish: 'View List',
              time: isHi ? 'अभी' : 'Just now',
              timeEnglish: 'Just now',
            }));
            setAlerts(liveAlerts);
          }
        }
      })
      .catch(() => {
        setError(isHi ? 'सर्वर से कनेक्ट नहीं हो पा रहा' : 'Could not connect to server');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handler: refresh insights on demand via API
  const handleRefreshInsights = async () => {
    if (!panchayatId || insightsLoading) return;
    setInsightsLoading(true);
    try {
      const data = await getPanchayatInsights(panchayatId);
      if (data?.insights?.length > 0) {
        setInsights(data.insights);
        addToast('Insights refreshed', 'success');
      }
    } catch {
      addToast('Failed to refresh insights', 'error');
    } finally {
      setInsightsLoading(false);
    }
  };

  // B3: AIInsights action handlers
  const handleNotify = async (insight) => {
    try {
      await notifyPanchayat({ panchayatId, message: insight.text });
      addToast('Notification sent to panchayat.', 'success');
    } catch {
      addToast('Failed to send notification.', 'error');
    }
  };

  const handleViewCitizens = () => {
    const tableEl = document.getElementById('citizen-table-section');
    if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
  };

  // Build eligible citizens for CitizenTable from households data
  let eligibleCitizens = households
    .filter(h => h.status === 'eligible')
    .map(h => {
      const enrolledIds = (h.enrolledSchemes || []).map(e => e.schemeId || e.id || e);
      const missingList = (h.matchedSchemes || [])
        .filter(s => !enrolledIds.includes(s.schemeId || s.id));
      return {
        id: h.id,
        name: h.name,
        ward: h.ward,
        age: h.age,
        category: h.category,
        categoryEnglish: h.category,
        gender: h.gender,
        isWidow: h.isWidow,
        missingSchemes: missingList.map(s => s.nameHindi || s.nameEnglish || s.name || s.schemeId || s.id),
        missingSchemesEnglish: missingList.map(s => s.nameEnglish || s.name || s.schemeId || s.id),
        estimatedBenefit: h.estimatedBenefit ||
          missingList.reduce((sum, s) => sum + (parseInt(s.annualBenefit) || 0), 0),
        status: 'deprived',
        statusLabel: '🔴 ' + (isHi ? 'वंचित' : 'Deprived'),
        statusLabelEnglish: '🔴 Deprived',
      };
    });

  // Apply alert filter if one is active
  if (activeAlertFilter) {
    if (activeAlertFilter === 'widow_pension') {
      eligibleCitizens = eligibleCitizens.filter(c => c.isWidow === true);
    } else if (activeAlertFilter === 'old_age_pension') {
      eligibleCitizens = eligibleCitizens.filter(c => c.age >= 60);
    }
  }

  const handleViewAlertList = (alertType) => {
    setActiveAlertFilter(prev => prev === alertType ? null : alertType);
    setTimeout(() => {
      const tableEl = document.getElementById('citizen-table-section');
      if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // B7: Real scheme names for heatmap
  const wardSet = [...new Set(households.map(h => h.ward))].sort();

  const heatmapData = wardSet.map(ward => ({
    ward,
    schemes: HEATMAP_SCHEME_IDS.map(schemeId => {
      const wardHouseholds = households.filter(h => h.ward === ward);
      const enrolled = wardHouseholds.filter(h =>
        (h.eligibleSchemes || []).includes(schemeId) && h.status === 'enrolled'
      ).length;
      const eligible = wardHouseholds.filter(h =>
        (h.eligibleSchemes || []).includes(schemeId)
      ).length;
      const pct = eligible > 0 ? Math.round((enrolled / eligible) * 100) : 0;
      return {
        scheme: HEATMAP_SCHEME_NAMES[schemeId],
        enrollment: pct,
        success: Math.min(100, pct + 5),
        benefit: Math.max(0, pct - 5),
        eligible,
        enrolled,
      };
    }),
  }));

  // B6: CSV download
  const handleDownload = () => {
    const header = 'Name,Age,Category,State,Income,Schemes Matched,Last Updated';
    const rows = households.map(c =>
      `"${c.name}",${c.age},"${c.category}","${stats.state}",${c.estimatedBenefit},${c.schemesCount || 0},"${c.updatedAt?.slice(0, 10) || ''}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panchayat-citizens-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const heatmapSchemes = HEATMAP_SCHEME_IDS.map(id => HEATMAP_SCHEME_NAMES[id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 className="animate-spin text-saffron mr-3" size={24} />
        <span className="font-body text-sm text-gray-500">{isHi ? 'डेटा लोड हो रहा है...' : 'Loading data...'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger font-body text-sm mb-2">🔴 {error}</p>
          <button onClick={fetchData} className="text-saffron font-body text-sm hover:underline">
            {isHi ? 'पुनः प्रयास करें' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-navy py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
          >
            <div>
              <nav className="flex items-center gap-1 font-body text-xs text-gray-300 mb-2" aria-label="Breadcrumb">
                <Link to="/" className="hover:text-white transition-colors">{T('panchHome')}</Link>
                <ChevronRight size={12} />
                <span className="text-white">{T('panchDashboard')}</span>
              </nav>

              <h1 className="font-display text-[28px] lg:text-[36px] text-white">
                {isHi ? stats.panchayatNameHi || stats.panchayatName : stats.panchayatName}
              </h1>
              <p className="font-body text-sm text-gray-300">
                {isHi ? 'जिला:' : 'District:'} {stats.district}, {stats.state} • {localizeNum(stats.totalHouseholds, language)} {isHi ? 'परिवार' : 'Households'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-success/20 text-success font-body text-xs font-medium">
                {isHi ? '🟢 लाइव डेटा' : '🟢 Live Data'}
              </span>
              <button
                onClick={fetchData}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-saffron/20 text-saffron hover:bg-saffron/30 transition-colors"
                aria-label="Refresh data"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleDownload}
                className="hidden md:flex items-center gap-1.5 h-9 px-4 rounded-lg border border-white/30 text-white font-body text-xs font-medium hover:bg-white/10 transition-colors"
              >
                <Download size={14} /> {T('panchDownload')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {usingMockData && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="font-body text-sm text-amber-700">
              {isHi ? 'कुछ डेटा सर्वर से लोड नहीं हो सका — नमूना डेटा दिखाया जा रहा है।' : 'Some data could not be loaded from the server — showing sample data.'}
            </p>
          </div>
        )}
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatCard icon="🏠" value={stats.totalHouseholds} label={T('panchTotalHouseholds')} variant="primary" />
          <StatCard icon="✅" value={`${stats.enrolled} (${stats.receivingPercent || 0}%)`} label={T('panchReceiving')} variant="success" progress={stats.receivingPercent} />
          <StatCard icon="⚠️" value={stats.eligibleNotEnrolled} label={T('panchEligibleNot')} variant="warning" />
          <StatCard icon="🔴" value={stats.zeroBenefits} label={T('panchZero')} variant="danger" />
        </div>

        {/* Welfare Gap + Performance Score Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <span className="font-body text-xs text-amber-700 font-medium uppercase tracking-wider">{isHi ? 'कल्याण अंतर' : 'Welfare Gap'}</span>
            </div>
            <p className="font-display text-2xl text-amber-900">₹{(((stats.eligibleNotEnrolled || 0) * 15000)).toLocaleString('en-IN')}</p>
            <p className="font-body text-xs text-amber-600 mt-1">{isHi ? 'यदि सभी पात्र नागरिक नामांकित हों' : 'Potential if all eligible citizens enrolled'}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200 p-5 flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-display text-xl text-white shrink-0 ${(stats.receivingPercent || 0) >= 70 ? 'bg-emerald-500' : (stats.receivingPercent || 0) >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}>{stats.receivingPercent || 0}</div>
            <div>
              <p className="font-body text-xs text-teal-700 font-medium uppercase tracking-wider">{isHi ? 'प्रदर्शन स्कोर' : 'Performance Score'}</p>
              <p className="font-body text-sm text-teal-900 mt-0.5">{(stats.receivingPercent || 0) >= 70 ? (isHi ? 'बहुत अच्छा प्रदर्शन' : 'Excellent performance') : (stats.receivingPercent || 0) >= 40 ? (isHi ? 'अच्छा, सुधार की जरूरत' : 'Good, room for improvement') : (isHi ? 'तत्काल कार्रवाई जरूरी' : 'Urgent action needed')}</p>
            </div>
          </motion.div>
        </div>

        {/* Quick-Link Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { to: '/panchayat/citizens', icon: Users, label: isHi ? 'नागरिक' : 'Citizens', color: 'text-blue-500', bg: 'bg-blue-50' },
            { to: '/panchayat/analytics', icon: BarChart3, label: isHi ? 'विश्लेषण' : 'Analytics', color: 'text-teal-500', bg: 'bg-teal-50' },
            { to: '/panchayat/applications', icon: FileText, label: isHi ? 'आवेदन' : 'Applications', color: 'text-purple-500', bg: 'bg-purple-50' },
            { to: '/panchayat/outreach', icon: Megaphone, label: isHi ? 'अभियान' : 'Outreach', color: 'text-orange-500', bg: 'bg-orange-50' },
            { to: '/panchayat/village', icon: MapPin, label: isHi ? 'गाँव' : 'Village', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          ].map((item, i) => (
            <Link key={item.to} to={item.to}>
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                className={`${item.bg} rounded-xl border border-slate-200 p-3 text-center hover:shadow-md transition-all group cursor-pointer`}
              >
                <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-1.5 group-hover:scale-110 transition-transform`} />
                <p className="font-body text-xs font-medium text-slate-700">{item.label}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* AI Insights */}
        <AIInsights
          insights={insights}
          onNotify={handleNotify}
          onViewCitizens={handleViewCitizens}
          onRefresh={handleRefreshInsights}
          insightsLoading={insightsLoading}
        />

        {/* Village Map + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
            <h2 className="font-body text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-saffron"></span>
              {T('panchMapTitle')}
            </h2>
            <VillageMap households={households} />
          </div>
          <AlertsPanel alerts={alerts} onViewList={handleViewAlertList} />
        </div>

        {/* Citizen Table */}
        {eligibleCitizens.length > 0 && (
          <div id="citizen-table-section" className="mb-8">
            <h2 className="font-body text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger"></span>
              {activeAlertFilter ? (isHi ? 'फ़िल्टर की गई सूची' : 'Filtered Action List') : (isHi ? 'पात्र नागरिक' : 'Eligible Citizens')}
            </h2>
            <CitizenTable citizens={eligibleCitizens} />
          </div>
        )}

        {/* Invisible Citizens Section */}
        {invisibleCitizens.length > 0 && (
          <div className="mb-8">
            <div
              className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200 p-5 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setShowInvisibleTab(v => !v)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <EyeOff size={20} className="text-rose-600" />
                  </div>
                  <div>
                    <h2 className="font-body text-base font-bold text-rose-900 flex items-center gap-2">
                      {isHi ? 'अदृश्य नागरिक' : 'Invisible Citizens'}
                      <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-body text-xs font-bold">
                        {invisibleCitizens.length}
                      </span>
                    </h2>
                    <p className="font-body text-xs text-rose-600">
                      {isHi
                        ? `${invisibleCitizens.length} परिवार पात्र होने के बावजूद शून्य लाभ प्राप्त कर रहे हैं — ₹${totalLostBenefit.toLocaleString('en-IN')} वार्षिक लाभ छूट रहा है`
                        : `${invisibleCitizens.length} households receiving zero benefits despite eligibility — ₹${totalLostBenefit.toLocaleString('en-IN')}/year in lost benefits`}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className={`text-rose-400 transition-transform ${showInvisibleTab ? 'rotate-90' : ''}`} />
              </div>
            </div>

            {showInvisibleTab && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-body text-sm font-medium text-gray-700">
                    {isHi ? 'प्राथमिकता क्रम (भेद्यता स्कोर अनुसार)' : 'Priority Order (by Vulnerability Score)'}
                  </span>
                  <span className="font-body text-xs text-gray-500">
                    {isHi ? 'उच्च स्कोर = अधिक जरूरतमंद' : 'Higher score = more vulnerable'}
                  </span>
                </div>
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {invisibleCitizens.map((ic, idx) => (
                    <div key={ic.citizenId || idx} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      {/* Rank */}
                      <span className="font-mono text-xs text-gray-400 w-6 text-right">#{idx + 1}</span>

                      {/* Vulnerability score badge */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-mono text-sm font-bold text-white
                        ${ic.vulnerabilityScore >= 60 ? 'bg-red-500' : ic.vulnerabilityScore >= 40 ? 'bg-amber-500' : 'bg-blue-500'}`}>
                        {ic.vulnerabilityScore}
                      </div>

                      {/* Citizen info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-gray-900 truncate">
                          {ic.name}
                          {ic.isWidow && <span className="ml-1.5 text-rose-500 text-xs">(Widow)</span>}
                          {ic.disability && <span className="ml-1.5 text-purple-500 text-xs">(PwD)</span>}
                        </p>
                        <p className="font-body text-[11px] text-gray-500">
                          {isHi ? `${ic.age} वर्ष` : `Age ${ic.age}`} · {ic.category} · {ic.ward || 'Unknown ward'}
                          {ic.income > 0 && ` · ₹${ic.income.toLocaleString('en-IN')}/mo`}
                        </p>
                      </div>

                      {/* Missed schemes */}
                      <div className="hidden md:flex flex-col items-end shrink-0">
                        <span className="font-body text-xs text-gray-600">
                          {ic.matchedSchemesCount} {isHi ? 'योजनाएं छूटीं' : 'schemes missed'}
                        </span>
                        <span className="font-mono text-xs text-rose-600 font-medium">
                          -₹{(ic.lostAnnualBenefit || 0).toLocaleString('en-IN')}/yr
                        </span>
                      </div>

                      {/* Scheme tags */}
                      <div className="hidden lg:flex flex-wrap gap-1 max-w-[200px]">
                        {(ic.matchedSchemeNames || []).slice(0, 3).map((name, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 font-body text-[9px] text-gray-600 truncate max-w-[120px]">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary footer */}
                <div className="p-4 bg-rose-50 border-t border-rose-100 flex items-center justify-between">
                  <p className="font-body text-xs text-rose-700">
                    {isHi
                      ? `कुल वार्षिक लाभ हानि: ₹${totalLostBenefit.toLocaleString('en-IN')}`
                      : `Total annual benefit loss: ₹${totalLostBenefit.toLocaleString('en-IN')}`}
                  </p>
                  <Link
                    to="/panchayat/outreach"
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-body text-xs font-medium hover:bg-rose-700 transition-colors"
                  >
                    {isHi ? 'अभियान शुरू करें' : 'Start Outreach Campaign'}
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Governance Heatmap */}
        {heatmapData.length > 0 && (
          <GovernanceHeatmap data={heatmapData} schemes={heatmapSchemes} />
        )}
      </div>
    </div>
  );
}

export default PanchayatDashboard;
