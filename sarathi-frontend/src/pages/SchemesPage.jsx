import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import SchemeCard from '../components/ui/SchemeCard';
import EmptyState from '../components/ui/EmptyState';
import { fetchPaginatedSchemes, searchSchemesAI } from '../utils/api';
import { useCitizen } from '../context/CitizenContext';
import { VirtuosoGrid } from 'react-virtuoso';


const SORT_OPTIONS = [
  { value: 'benefit_desc', label: 'Benefit (High → Low)' },
  { value: 'name_asc', label: 'Name (A → Z)' }
];

function SchemesPage() {
  const { eligibleSchemes } = useCitizen();

  // Data State
  const [displaySchemes, setDisplaySchemes] = useState([]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [nextKey, setNextKey] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // UI State
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [isAiSearch, setIsAiSearch] = useState(false);

  // Filter State
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('benefit_desc');
  const [level, setLevel] = useState('all');

  const eligibleIds = useMemo(() => new Set(eligibleSchemes.map((s) => s.id || s.schemeId)), [eligibleSchemes]);

  // Load Categories (Mocked until dynamically pulled or derived if needed)
  const categoryCounts = { 'all': 0 }; // Temporarily ignoring dynamic category counts for speed

  const loadSchemes = async (isLoadMore = false) => {
    if (isLoadMore) {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
      setDisplaySchemes([]);
      setNextKey(null);
      setHasMore(true);
      setAiAnalysisResult('');
      setIsAiSearch(false);
    }
    setError('');

    try {
      if (search.trim().length > 3 && search.toLowerCase().includes('help')) {
        // Fake an AI Search trigger if the word "help" is there
        setIsAiSearch(true);
        const aiData = await searchSchemesAI(search);
        setDisplaySchemes(aiData.schemes || []);
        setAiAnalysisResult(aiData.analysis || 'Based on your query, here are the most relevant schemes selected by our AI.');
        setHasMore(false);
      } else {
        const data = await fetchPaginatedSchemes(
          20,
          sortBy,
          category,
          level,
          search,
          isLoadMore ? nextKey : null
        );

        setDisplaySchemes(prev => isLoadMore ? [...prev, ...(data.schemes || [])] : (data.schemes || []));

        if (data.nextKey) {
          setNextKey(data.nextKey);
          setHasMore(true);
        } else {
          setHasMore(false);
          setNextKey(null);
        }
      }
    } catch (err) {
      console.error("fetch schemes failed:", err);
      setError('Failed to load schemes from database. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounce regular search inputs and filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      loadSchemes(false);
    }, 400);
    return () => clearTimeout(handler);
  }, [category, search, sortBy, level]);


  const ItemContainer = ({ children, ...props }) => (
    <div {...props} className="h-full w-full">
      {children}
    </div>
  );

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
            {loading && !loadingMore ? 'Crunching catalog...' : `Millions of rupees in benefits • AI matched to your profile`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Sort */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheme name, ministry, or ask AI (e.g., 'help me with farming')"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-300 bg-white font-body text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            disabled={isAiSearch}
            className="h-11 px-3 rounded-xl border border-gray-300 bg-white font-body text-sm text-gray-700 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Filters Row: Level + Categories */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-widest shrink-0 mr-2">Jurisdiction</span>
            {['all', 'central', 'state'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                disabled={isAiSearch}
                className={`capitalize shrink-0 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 disabled:opacity-50 ${level === lvl
                    ? 'bg-saffron text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                  }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-widest shrink-0 mr-2">Sectors</span>
            {['all', 'Agriculture', 'Education', 'Health', 'Business', 'Housing'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                disabled={isAiSearch}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 disabled:opacity-50 ${category === cat
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Logic Results Block */}
        {loading && !loadingMore && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={36} className="animate-spin text-saffron" />
            <p className="font-body text-gray-500 text-sm animate-pulse">Querying Sarathi Knowledge Base...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 font-body text-sm mb-6">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!loading && isAiSearch && aiAnalysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-saffron/10 border border-saffron/30 rounded-2xl p-6"
          >
            <h3 className="flex items-center gap-2 font-display font-bold text-navy mb-2"><CheckCircle2 className="text-saffron" size={20} /> AI Semantic Match Complete</h3>
            <p className="font-body text-gray-800 leading-relaxed">{aiAnalysisResult}</p>
          </motion.div>
        )}

        {!loading && !error && displaySchemes.length > 0 && (
          <div className="w-full">
            <VirtuosoGrid
              style={{ width: '100%', height: 'calc(100vh - 350px)' }}
              data={displaySchemes}
              endReached={() => loadSchemes(true)}
              overscan={400}
              listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12"
              itemClassName="h-full"
              itemContent={(index, scheme) => (
                <ItemContainer>
                  <SchemeCard
                    scheme={{ ...scheme, id: scheme.schemeId || scheme.id }}
                    isEligible={eligibleIds.has(scheme.schemeId || scheme.id)}
                  />
                </ItemContainer>
              )}
              components={{
                Footer: () => (
                  <div className="py-8 flex justify-center w-full col-span-full">
                    {loadingMore ? (
                      <div className="flex items-center gap-2 text-saffron font-body text-sm font-medium">
                        <Loader2 size={16} className="animate-spin" /> Loading more schemes...
                      </div>
                    ) : !hasMore ? (
                      <div className="flex items-center gap-2 text-gray-400 font-body text-sm">
                        <FileText size={16} /> End of catalog
                      </div>
                    ) : null}
                  </div>
                )
              }}
            />
          </div>
        )}

        {!loading && !error && displaySchemes.length === 0 && (
          <EmptyState
            title="No Schemes Found"
            subtitle="Try adjusting your filters or expanding your search."
            ctaLabel="Clear All Filters"
            onCtaClick={() => { setCategory('all'); setSearch(''); setLevel('all'); }}
          />
        )}
      </div>
    </div>
  );
}

export default SchemesPage;
