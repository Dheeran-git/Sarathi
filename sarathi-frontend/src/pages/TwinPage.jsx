import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import PathwayChart from '../components/twin/PathwayChart';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { localizeNum } from '../utils/formatters';
import SchemeTimeline from '../components/twin/SchemeTimeline';
import ConflictResolver from '../components/twin/ConflictResolver';
import { pathwayData, defaultCitizen } from '../data/mockCitizens';

/**
 * TwinPage — Digital Twin Dashboard for a citizen's welfare pathway.
 * Spec §8 — includes breadcrumb, citizen summary pill, "change profile" link,
 * 4 stat cards, pathway chart, scheme timeline, conflict resolver.
 */
function TwinPage() {
  const citizen = defaultCitizen;
  const { language } = useLanguage();
  const T = (key) => t(key, language);
  const isHi = language === 'hi';

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header — spec lines 791-802 */}
      <div className="bg-navy py-8 lg:py-10" style={{ background: 'radial-gradient(ellipse at bottom center, rgba(232,116,12,0.08), #0F2240 70%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb — spec line 796 */}
          <nav className="flex items-center gap-1 font-body text-xs text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white transition-colors">{isHi ? 'होम' : 'Home'}</Link>
            <ChevronRight size={12} />
            <Link to="/chat" className="hover:text-white transition-colors">{isHi ? 'चैट' : 'Chat'}</Link>
            <ChevronRight size={12} />
            <span className="text-gray-300">{isHi ? 'आपका रोडमैप' : 'Your Roadmap'}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8"
          >
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-saffron/20 flex items-center justify-center shrink-0">
              <span className="font-display text-2xl text-saffron">{isHi ? citizen.name[0] : citizen.nameEnglish[0]}</span>
            </div>

            <div className="flex-1">
              {/* Title — spec line 797 */}
              <h1 className="font-display text-[28px] lg:text-[36px] text-white">
                {T('twinTitle')}
              </h1>
              <p className="font-body text-sm text-gray-300 mt-1">
                {isHi ? `अगले ${localizeNum(3, language)} वर्षों में आप गरीबी रेखा से ऊपर आ सकते हैं।` : 'In the next 3 years, you can rise above the poverty line.'}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Citizen summary pill — spec line 801 */}
              <span className="px-4 py-1.5 rounded-full bg-navy-light text-white font-body text-xs font-medium">
                {isHi ? citizen.name : citizen.nameEnglish} | {localizeNum(citizen.age, language)} {isHi ? 'वर्ष' : 'years'} | {isHi ? citizen.state : citizen.stateEnglish} | {isHi ? (citizen.category === 'SC' ? 'एससी' : citizen.category === 'ST' ? 'एसटी' : citizen.category === 'OBC' ? 'ओबीसी' : citizen.category === 'General' ? 'सामान्य' : citizen.category) : citizen.category}
              </span>
              {/* Change profile link — spec line 802 */}
              <Link to="/chat" className="font-body text-xs text-saffron hover:underline" aria-label="Change profile">
                {T('twinChangeProfile')}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stat Cards — spec lines 806-813 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
          <StatCard
            icon="💰"
            value={`₹${localizeNum((2000).toLocaleString('en-IN'), language)}/${isHi ? 'माह' : 'mo'}`}
            label={T('twinCurrentIncome')}
            variant="warning"
          />
          <StatCard
            icon="📈"
            value={`₹${localizeNum((7400).toLocaleString('en-IN'), language)}/${isHi ? 'माह' : 'mo'}`}
            label={T('twinAfter3Years')}
            variant="success"
          />
          <StatCard
            icon="💵"
            value={`₹${localizeNum((64800).toLocaleString('en-IN'), language)}`}
            label={T('twinTotalBenefit')}
            variant="primary"
            trend={230}
          />
          <StatCard
            icon="📋"
            value={localizeNum(8, language)}
            label={T('twinActiveSchemes')}
            variant="dark"
          />
        </div>

        {/* Pathway Chart — spec lines 817-852 */}
        <div className="mb-8">
          <h2 className="font-body text-xl font-bold text-gray-900 mb-4">{T('twinIncomeChart')}</h2>
          <PathwayChart pathways={pathwayData} />
        </div>

        {/* Two column: timeline + conflict — spec lines 856-892 */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
          <div>
            <h2 className="font-body text-xl font-bold text-gray-900 mb-4">{T('twinSchemeSequence')}</h2>
            <SchemeTimeline />
          </div>
          <div>
            <h2 className="font-body text-xl font-bold text-gray-900 mb-4">{T('twinConflict')}</h2>
            <ConflictResolver />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TwinPage;
