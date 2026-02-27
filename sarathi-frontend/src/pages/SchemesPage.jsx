import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import SchemeCard from '../components/ui/SchemeCard';
import EmptyState from '../components/ui/EmptyState';
import { schemes as mockSchemes } from '../data/mockSchemes';
import { checkEligibility } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { localizeNum } from '../utils/formatters';

const categories = [
  { key: 'all', label: 'सभी', labelEn: 'All', emoji: '📋', color: '#0F2240' },
  { key: 'agriculture', label: 'कृषि', labelEn: 'Agriculture', emoji: '🌾', color: '#4CAF50' },
  { key: 'housing', label: 'आवास', labelEn: 'Housing', emoji: '🏠', color: '#FF9800' },
  { key: 'health', label: 'स्वास्थ्य', labelEn: 'Health', emoji: '❤️', color: '#F44336' },
  { key: 'education', label: 'शिक्षा', labelEn: 'Education', emoji: '📚', color: '#2196F3' },
  { key: 'women', label: 'महिला एवं बाल', labelEn: 'Women & Child', emoji: '👩', color: '#E91E63' },
  { key: 'employment', label: 'रोजगार', labelEn: 'Employment', emoji: '💼', color: '#9C27B0' },
];

function SchemesPage() {
  const { language } = useLanguage();
  const T = (key) => t(key, language);
  const isHi = language === 'hi';
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [schemes, setSchemes] = useState(mockSchemes);
  const [loading, setLoading] = useState(true);

  // Fetch live schemes on mount
  useEffect(() => {
    checkEligibility({ age: 1, gender: 'any', monthlyIncome: 999999, category: 'General' })
      .then((data) => {
        if (data.matchedSchemes && data.matchedSchemes.length > 0) {
          // Merge live scheme data with mock data for rich display fields
          const liveSchemes = data.matchedSchemes.map((live) => {
            const mock = mockSchemes.find(
              (m) => m.id === live.schemeId || m.nameEnglish === live.nameEnglish
            );
            return mock
              ? { ...mock, annualBenefit: live.annualBenefit || mock.annualBenefit }
              : {
                id: live.schemeId,
                nameHindi: live.nameHindi || live.nameEnglish,
                nameEnglish: live.nameEnglish || live.schemeId,
                category: live.category || 'employment',
                annualBenefit: live.annualBenefit || 0,
                ministry: live.ministry || '',
                applyUrl: live.applyUrl || '#',
                eligibilityTags: [],
                eligibilityTagsEn: [],
                benefits: [],
                benefitsEn: [],
                benefitDescription: '',
                howToApply: [],
                howToApplyEn: [],
                documentsRequired: [],
                documentsRequiredEn: [],
                eligibility: { category: ['SC', 'ST', 'OBC', 'General'] },
              };
          });
          setSchemes(liveSchemes);
        }
      })
      .catch(() => { /* keep mock data */ })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let results = schemes;
    if (category !== 'all') {
      results = results.filter((s) => s.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          s.nameHindi.toLowerCase().includes(q) ||
          s.nameEnglish.toLowerCase().includes(q) ||
          s.ministry.toLowerCase().includes(q)
      );
    }
    return results;
  }, [category, search]);

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-navy py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-[28px] lg:text-[36px] text-white"
          >
            {T('schemesTitle')}
          </motion.h1>
          <p className="font-body text-sm text-gray-300 mt-1">
            {isHi
              ? `सरकारी कल्याणकारी योजनाएं • कुल ${localizeNum(schemes.length, language)} योजनाएं`
              : `Government Welfare Schemes • ${schemes.length} Total`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isHi ? 'योजना का नाम या मंत्रालय खोजें...' : 'Search scheme name or ministry...'}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white font-body text-sm focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/30 transition-colors"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 ${category === cat.key
                ? 'text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              style={category === cat.key ? { backgroundColor: cat.color } : {}}
            >
              <span className="text-sm">{cat.emoji}</span>
              {isHi ? cat.label : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((scheme, i) => (
              <motion.div
                key={scheme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <SchemeCard scheme={scheme} isEligible={false} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={isHi ? "कोई योजना नहीं मिली" : "No Schemes Found"}
            subtitle={isHi ? "कृपया अन्य श्रेणी या खोज शब्द प्रयोग करें।" : "Please try a different category or search term."}
            ctaLabel={isHi ? "सभी योजनाएं" : "All Schemes"}
            onCtaClick={() => { setCategory('all'); setSearch(''); }}
          />
        )}
      </div>
    </div>
  );
}

export default SchemesPage;
