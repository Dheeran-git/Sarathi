import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import SchemeCard from '../components/ui/SchemeCard';
import EmptyState from '../components/ui/EmptyState';
import { schemes } from '../data/mockSchemes';
import { t } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';

const categories = [
  { key: 'all', label: 'All', emoji: '📋', color: '#0F2240' },
  { key: 'agriculture', label: 'Agriculture', emoji: '🌾', color: '#4CAF50' },
  { key: 'housing', label: 'Housing', emoji: '🏠', color: '#FF9800' },
  { key: 'health', label: 'Health', emoji: '❤️', color: '#F44336' },
  { key: 'education', label: 'Education', emoji: '📚', color: '#2196F3' },
  { key: 'women', label: 'Women & Child', emoji: '👩', color: '#E91E63' },
  { key: 'employment', label: 'Employment', emoji: '💼', color: '#9C27B0' },
];

function SchemesPage() {
  const { language } = useLanguage();
  const T = (key) => t(key, language);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let results = schemes;
    if (category !== 'all') {
      results = results.filter((s) => s.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          s.nameEnglish.toLowerCase().includes(q) ||
          s.ministry.toLowerCase().includes(q)
      );
    }
    return results;
  }, [category, search]);

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-slate-800 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-[28px] lg:text-[36px] text-white"
          >
            {T('schemesTitle')}
          </motion.h1>
          <p className="font-body text-sm text-slate-400 mt-1">
            Government Welfare Schemes • {schemes.length} Total
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheme name or ministry..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-700 bg-[#020617] font-body text-sm text-[#f8fafc] placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
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
                ? 'text-[#f8fafc] shadow-sm'
                : 'bg-[#0f172a] text-slate-300 border border-slate-700 hover:border-slate-500'
                }`}
              style={category === cat.key ? { backgroundColor: cat.color } : {}}
            >
              <span className="text-sm">{cat.emoji}</span>
              {cat.label}
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
            title="No Schemes Found"
            subtitle="Please try a different category or search term."
            ctaLabel="All Schemes"
            onCtaClick={() => { setCategory('all'); setSearch(''); }}
          />
        )}
      </div>
    </div>
  );
}

export default SchemesPage;
