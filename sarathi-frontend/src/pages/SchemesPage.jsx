import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react';
import SchemeCard from '../components/ui/SchemeCard';
import EmptyState from '../components/ui/EmptyState';
import { fetchAllSchemes, searchSchemesAI } from '../utils/api';
import { useCitizen } from '../context/CitizenContext';


const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'benefit_desc', label: 'Benefit (High \u2192 Low)' },
  { value: 'name_asc', label: 'Name (A \u2192 Z)' },
  { value: 'category', label: 'Category' },
];

function SchemesPage() {
  const { eligibleSchemes, citizenProfile } = useCitizen();
  const [allSchemes, setAllSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('benefit_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // AI search state
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const aiDebounceRef = useRef(null);

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

  // Debounced AI search
  const performAISearch = useCallback((query) => {
    if (!query.trim()) {
      setAiResults(null);
      setAiLoading(false);
      setAiError('');
      return;
    }

    setAiLoading(true);
    setAiError('');

    searchSchemesAI(query, citizenProfile)
      .then((data) => {
        setAiResults(data);
        setAiLoading(false);
      })
      .catch((err) => {
        console.error('AI search failed:', err);
        setAiError('AI search failed. Try again or switch to regular search.');
        setAiLoading(false);
      });
  }, [citizenProfile]);

  // Effect to debounce AI search calls
  useEffect(() => {
    if (!aiSearchEnabled) return;

    if (aiDebounceRef.current) {
      clearTimeout(aiDebounceRef.current);
    }

    if (!search.trim()) {
      setAiResults(null);
      setAiLoading(false);
      setAiError('');
      return;
    }

    // Show loading indicator immediately for responsiveness
    setAiLoading(true);

    aiDebounceRef.current = setTimeout(() => {
      performAISearch(search);
    }, 500);

    return () => {
      if (aiDebounceRef.current) {
        clearTimeout(aiDebounceRef.current);
      }
    };
  }, [search, aiSearchEnabled, performAISearch]);

  // Clear AI state when toggling off
  const handleToggleAI = () => {
    setAiSearchEnabled((prev) => {
      const next = !prev;
      if (!next) {
        // Turning off AI search — clear AI state
        setAiResults(null);
        setAiLoading(false);
        setAiError('');
      } else if (search.trim()) {
        // Turning on AI search with existing query — trigger search
        setAiLoading(true);
        if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
        aiDebounceRef.current = setTimeout(() => {
          performAISearch(search);
        }, 500);
      }
      return next;
    });
  };

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
      results = results.filter(s => String(s.level || '').toLowerCase().includes(tgt));
    }
    if (category !== 'all') {
      results = results.filter(s => {
        let source = s.categories || s.tags || [];
        if (typeof source === 'string') source = source.split(',');
        return source.some(c => String(c).trim() === category);
      });
    }
    if (search.trim() && !aiSearchEnabled) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          String(s.nameEnglish || s.name || '').toLowerCase().includes(q) ||
          String(s.ministry || '').toLowerCase().includes(q) ||
          String(s.state || '').toLowerCase().includes(q)
      );
    }
    return results;
  }, [allSchemes, category, search, level, aiSearchEnabled]);

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

  // Determine which list to display: AI results or traditional filtered results
  const isShowingAIResults = aiSearchEnabled && search.trim() && aiResults && aiResults.results && !aiLoading;

  const displaySchemes = isShowingAIResults ? aiResults.results : sortedFiltered;

  // D3: Pagination
  const totalPages = Math.ceil(displaySchemes.length / PAGE_SIZE);
  const paginated = displaySchemes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
            {loading ? 'Loading schemes...' : `${allSchemes.length} schemes available \u2022 ${eligibleSchemes.length} matched to your profile`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + AI Toggle + Sort */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[260px] flex items-center gap-2">
            <div className={`relative flex-1 transition-all duration-300 rounded-xl ${aiSearchEnabled ? 'ring-2 ring-saffron/40 shadow-[0_0_12px_rgba(255,153,51,0.15)]' : ''}`}>
              {aiSearchEnabled ? (
                <Sparkles size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-saffron" />
              ) : (
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              )}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={aiSearchEnabled ? 'Ask naturally... e.g. "schemes for elderly widows"' : 'Search scheme name or ministry...'}
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-white font-body text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${aiSearchEnabled
                    ? 'border-saffron/50 focus:border-saffron focus:ring-2 focus:ring-saffron/20'
                    : 'border-gray-300 focus:border-saffron focus:ring-2 focus:ring-saffron/20'
                  }`}
              />
              {aiSearchEnabled && aiLoading && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-saffron" />
              )}
            </div>
            {/* AI Toggle Button */}
            <button
              onClick={handleToggleAI}
              title={aiSearchEnabled ? 'Switch to regular search' : 'Switch to AI-powered search'}
              className={`shrink-0 flex items-center gap-1.5 h-11 px-3.5 rounded-xl font-body text-sm font-medium transition-all duration-300 ${aiSearchEnabled
                  ? 'bg-saffron text-white shadow-saffron hover:bg-saffron-light'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-saffron hover:text-saffron'
                }`}
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>
          {/* D3: Sort dropdown — hidden during AI search mode (AI determines relevance) */}
          {!isShowingAIResults && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 px-3 rounded-xl border border-gray-300 bg-white font-body text-sm text-gray-700 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* AI Search active banner */}
        {aiSearchEnabled && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-saffron/5 border border-saffron/20">
            <Zap size={14} className="text-saffron shrink-0" />
            <span className="font-body text-xs text-gray-600">
              AI search is active — type a natural language query to find relevant schemes. Filters and sorting are applied by AI relevance.
            </span>
          </div>
        )}

        {/* Filters Row: Level + Categories — shown only in non-AI mode */}
        {!isShowingAIResults && (
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest shrink-0 mr-2">Level</span>
              {['all', 'central', 'state'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`capitalize shrink-0 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 ${level === lvl
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
                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 ${category === 'all'
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
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 ${category === cat
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
        )}

        {/* AI results header */}
        {isShowingAIResults && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-saffron" />
              <span className="font-body text-sm font-medium text-gray-700">
                {aiResults.totalMatches} AI-matched scheme{aiResults.totalMatches !== 1 ? 's' : ''} for &ldquo;{aiResults.query}&rdquo;
              </span>
            </div>
            <button
              onClick={() => {
                setSearch('');
                setAiResults(null);
              }}
              className="font-body text-xs text-saffron hover:text-saffron-light transition-colors"
            >
              Clear AI results
            </button>
          </div>
        )}

        {/* States */}
        {(loading || (aiSearchEnabled && aiLoading && search.trim())) && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="animate-spin text-saffron" />
            {aiSearchEnabled && aiLoading && search.trim() && !loading && (
              <p className="font-body text-sm text-gray-500">AI is finding the best schemes for you...</p>
            )}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger font-body text-sm mb-6">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!loading && aiError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger font-body text-sm mb-6">
            <AlertCircle size={18} />
            {aiError}
          </div>
        )}

        {!loading && !(aiSearchEnabled && aiLoading && search.trim()) && !error && paginated.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((scheme, i) => {
                const schemeId = scheme.schemeId || scheme.id;
                return (
                  <motion.div
                    key={schemeId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <div className="relative h-full">
                      {/* AI reason badge */}
                      {isShowingAIResults && scheme.aiReason && (
                        <div className="absolute -top-2 left-3 right-3 z-10">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-saffron/10 border border-saffron/25 backdrop-blur-sm">
                            <Sparkles size={11} className="text-saffron shrink-0" />
                            <span className="font-body text-[11px] text-saffron-dark leading-tight line-clamp-1">
                              {scheme.aiReason}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className={isShowingAIResults && scheme.aiReason ? 'pt-3' : ''}>
                        <SchemeCard
                          scheme={{ ...scheme, id: schemeId }}
                          isEligible={eligibleIds.has(schemeId)}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
                  <span className="text-gray-400 ml-1">({displaySchemes.length} schemes)</span>
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

        {!loading && !(aiSearchEnabled && aiLoading && search.trim()) && !error && displaySchemes.length === 0 && (
          <EmptyState
            title={isShowingAIResults ? 'No AI Matches Found' : 'No Schemes Found'}
            subtitle={isShowingAIResults ? 'Try rephrasing your query or switch to regular search.' : 'Try a different category or search term.'}
            ctaLabel={isShowingAIResults ? 'Clear Search' : 'Show All'}
            onCtaClick={() => { setCategory('all'); setSearch(''); setAiResults(null); }}
          />
        )}
      </div>
    </div>
  );
}

export default SchemesPage;
