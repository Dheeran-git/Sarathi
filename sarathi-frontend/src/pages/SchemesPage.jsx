import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import SchemeCard from '../components/ui/SchemeCard';
import EmptyState from '../components/ui/EmptyState';
import { fetchAllSchemes } from '../utils/api';
import { useCitizen } from '../context/CitizenContext';


const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'benefit_desc', label: 'Benefit (High → Low)' },
  { value: 'name_asc',     label: 'Name (A → Z)' },
  { value: 'category',     label: 'Category' },
];

function SchemesPage() {
  const { eligibleSchemes } = useCitizen();
  const [allSchemes, setAllSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('benefit_desc');
  const [currentPage, setCurrentPage] = useState(1);

  const eligibleIds = useMemo(() => new Set(eligibleSchemes.map((s) => s.id || s.schemeId)), [eligibleSchemes]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAllSchemes()
      .then((data) => {
        if (!cancelled) setAllSchemes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("fetchAllSchemes failed:", err);
        if (!cancelled) setError('Failed to load schemes. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // D3: Reset page on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, search, sortBy]);

  const [level, setLevel] = useState('all'); // 'all', 'state', 'central'

  // Dynamic tags/categories extraction
  const dynamicCategories = useMemo(() => {
    const cats = new Set();
    for (const s of allSchemes) {
       let source = s.categories || s.tags || [];
       if (typeof source === 'string') source = source.split(',');
       for (const c of source) {
           const cleanly = String(c).trim();
           if (cleanly && cleanly.length > 2) cats.add(cleanly);
       }
    }
    const arr = Array.from(cats).sort();
    return arr;
  }, [allSchemes]);

  // Category counts mapping
  const categoryCounts = useMemo(() => {
    const counts = { all: allSchemes.length };
    for (const s of allSchemes) {
      let source = s.categories || s.tags || [];
      if (typeof source === 'string') source = source.split(',');
      for (const c of source) {
          const cleanly = String(c).trim();
          if (cleanly) counts[cleanly] = (counts[cleanly] || 0) + 1;
      }
    }
    return counts;
  }, [allSchemes]);

  const filtered = useMemo(() => {
    let results = allSchemes;
    if (level !== 'all') {
        const tgt = level.toLowerCase();
        results = results.filter(s => (s.level || '').toLowerCase().includes(tgt));
    }
    if (category !== 'all') {
        results = results.filter(s => {
            let source = s.categories || s.tags || [];
            if (typeof source === 'string') source = source.split(',');
            return source.some(c => String(c).trim() === category);
        });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          (s.nameEnglish || s.name || '').toLowerCase().includes(q) ||
          (s.ministry || '').toLowerCase().includes(q) || 
          (s.state || '').toLowerCase().includes(q)
      );
    }
    return results;
  }, [allSchemes, category, search, level]);

  // D3: Sort
  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'benefit_desc') {
      arr.sort((a, b) => (b.annualBenefit || 0) - (a.annualBenefit || 0));
    } else if (sortBy === 'name_asc') {
      arr.sort((a, b) => (a.nameEnglish || a.name || '').localeCompare(b.nameEnglish || b.name || ''));
    } else if (sortBy === 'category') {
      arr.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    }
    return arr;
  }, [filtered, sortBy]);

  // D3: Pagination
  const totalPages = Math.ceil(sortedFiltered.length / PAGE_SIZE);
  const paginated = sortedFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-navy py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl lg:text-4xl text-white"
          >
            Government Schemes
          </motion.h1>
          <p className="font-body text-sm text-gray-300 mt-1">
            {loading ? 'Loading schemes...' : `${allSchemes.length} schemes available • ${eligibleSchemes.length} matched to your profile`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Sort */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheme name or ministry..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-300 bg-white font-body text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors"
            />
          </div>
          {/* D3: Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-11 px-3 rounded-xl border border-gray-300 bg-white font-body text-sm text-gray-700 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Filters Row: Level + Categories */}
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest shrink-0 mr-2">Level</span>
              {['all', 'central', 'state'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`capitalize shrink-0 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 ${
                    level === lvl
                      ? 'bg-saffron text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest shrink-0 mr-2">Category</span>
              <button
                key="all"
                onClick={() => setCategory('all')}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 ${
                  category === 'all'
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                }`}
              >
                All
                {!loading && categoryCounts['all'] > 0 && (
                  <span className={`text-[10px] font-mono ${category === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'} px-1.5 py-0.5 rounded-full`}>
                    {categoryCounts['all']}
                  </span>
                )}
              </button>
              {dynamicCategories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 ${
                      category === cat
                        ? 'bg-navy text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                    {!loading && count > 0 && (
                      <span className={`text-[10px] font-mono ${category === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'} px-1.5 py-0.5 rounded-full`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-saffron" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger font-body text-sm mb-6">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!loading && !error && paginated.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((scheme, i) => (
                <motion.div
                  key={scheme.schemeId || scheme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <SchemeCard
                    scheme={{ ...scheme, id: scheme.schemeId || scheme.id }}
                    isEligible={eligibleIds.has(scheme.schemeId || scheme.id)}
                  />
                </motion.div>
              ))}
            </div>

            {/* D3: Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 h-9 px-4 rounded-lg border border-gray-200 bg-white font-body text-sm text-gray-600 hover:border-saffron/50 hover:text-saffron disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span className="font-body text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                  <span className="text-gray-400 ml-1">({sortedFiltered.length} schemes)</span>
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 h-9 px-4 rounded-lg border border-gray-200 bg-white font-body text-sm text-gray-600 hover:border-saffron/50 hover:text-saffron disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !error && sortedFiltered.length === 0 && (
          <EmptyState
            title="No Schemes Found"
            subtitle="Try a different category or search term."
            ctaLabel="Show All"
            onCtaClick={() => { setCategory('all'); setSearch(''); }}
          />
        )}
      </div>
    </div>
  );
}

export default SchemesPage;
