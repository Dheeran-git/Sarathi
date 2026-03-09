import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import SchemeCard from '../components/ui/SchemeCard';
import EmptyState from '../components/ui/EmptyState';
import { searchSchemesAI, fetchPaginatedSchemes } from '../utils/api';
import { useCitizen } from '../context/CitizenContext';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'benefit_desc', label: 'Benefit (High \u2192 Low)' },
  { value: 'name_asc', label: 'Name (A \u2192 Z)' }
];

const CATEGORIES = [
  'Agriculture', 'Education', 'Health', 'Housing', 'Women', 'Startup',
  'Pension', 'Disability', 'Minority', 'Youth', 'Skill Development'
].sort();

function SchemesPage() {
  const { eligibleSchemes, citizenProfile } = useCitizen();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('benefit_desc');

  // Infinite Scroll State
  const [displaySchemes, setDisplaySchemes] = useState([]);
  const [nextKey, setNextKey] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // AI search state
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const aiDebounceRef = useRef(null);

  // Intersection Observer Ref
  const observerRef = useRef();

  const eligibleIds = useMemo(() => new Set(eligibleSchemes.map((s) => s.id || s.schemeId)), [eligibleSchemes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Server-Side Initial Fetch Hook
  useEffect(() => {
    if (aiSearchEnabled && search.trim()) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    // Reset list when filters change
    fetchPaginatedSchemes(PAGE_SIZE, sortBy, category, level, debouncedSearch, null)
      .then((data) => {
        if (!cancelled) {
          setDisplaySchemes(data.schemes || []);
          setNextKey(data.nextKey || null);
          setHasMore(!!data.nextKey);
        }
      })
      .catch((err) => {
        console.error("fetchPaginatedSchemes failed:", err);
        if (!cancelled) setError('Failed to load schemes. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [sortBy, category, level, debouncedSearch, aiSearchEnabled]);

  // Load More Function for Infinite Scroll
  const loadMoreSchemes = useCallback(() => {
    if (loadingMore || !hasMore || (aiSearchEnabled && search.trim())) return;

    setLoadingMore(true);
    fetchPaginatedSchemes(PAGE_SIZE, sortBy, category, level, debouncedSearch, nextKey)
      .then((data) => {
        setDisplaySchemes(prev => [...prev, ...(data.schemes || [])]);
        setNextKey(data.nextKey || null);
        setHasMore(!!data.nextKey);
      })
      .catch((err) => {
        console.error("Failed to load more schemes:", err);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [loadingMore, hasMore, aiSearchEnabled, search, sortBy, category, level, debouncedSearch, nextKey]);

  // Infinite Scroll Observer Setup
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) { // isShowingAIResults is handled implicitly by loadMoreSchemes condition
        loadMoreSchemes();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMoreSchemes]);


  // AI Search Hook
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

  useEffect(() => {
    if (!aiSearchEnabled) return;

    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);

    if (!search.trim()) {
      setAiResults(null);
      setAiLoading(false);
      setAiError('');
      return;
    }

    setAiLoading(true);
    aiDebounceRef.current = setTimeout(() => {
      performAISearch(search);
    }, 500);

    return () => {
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    };
  }, [search, aiSearchEnabled, performAISearch]);

  const handleToggleAI = () => {
    setAiSearchEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setAiResults(null);
        setAiLoading(false);
        setAiError('');
        // Restore non-AI state clean slate
        setDisplaySchemes([]);
        setNextKey(null);
        setHasMore(true);
        setLoading(true);
      } else if (search.trim()) {
        setAiLoading(true);
        if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
        aiDebounceRef.current = setTimeout(() => {
          performAISearch(search);
        }, 500);
      }
      return next;
    });
  };

  const isShowingAIResults = aiSearchEnabled && search.trim() && aiResults && aiResults.results && !aiLoading;
  const currentViewData = isShowingAIResults ? aiResults.results : displaySchemes;

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
            {loading && !loadingMore ? 'Fetching schemes...' : `Thousands of schemes available \u2022 ${eligibleSchemes.length} precisely matched to your profile`}
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
              {(loading || (aiSearchEnabled && aiLoading)) && (
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

        {/* Filters Row: Level + Categories */}
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
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-body text-sm font-medium transition-all duration-200 ${category === cat
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
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
                setDebouncedSearch('');
                setAiResults(null);
              }}
              className="font-body text-xs text-saffron hover:text-saffron-light transition-colors"
            >
              Clear AI results
            </button>
          </div>
        )}

        {/* Loading Spinner for full page replacement */}
        {loading && currentViewData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="animate-spin text-saffron" />
            <p className="font-body text-sm text-gray-500">Loading catalog...</p>
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

        {currentViewData.length > 0 && (
          <>
            <div className="w-full h-[80vh] mb-6">
              <VirtuosoGrid
                style={{ height: '100%', width: '100%' }}
                totalCount={currentViewData.length}
                data={currentViewData}
                listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4"
                itemClassName="flex flex-col h-full"
                itemContent={(i, scheme) => {
                  const schemeId = scheme.schemeId || scheme.id;
                  const isLastElement = i === currentViewData.length - 1;

                  return (
                    <motion.div
                      ref={isLastElement ? lastElementRef : null}
                      key={schemeId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min((i % PAGE_SIZE) * 0.03, 0.4), duration: 0.3 }}
                      className="h-full flex-1"
                    >
                      <div className="relative h-full flex flex-col">
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
                        <div className={`flex-1 ${isShowingAIResults && scheme.aiReason ? 'pt-3' : ''}`}>
                          <SchemeCard
                            scheme={{ ...scheme, id: schemeId }}
                            isEligible={eligibleIds.has(schemeId)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                }}
              />
            </div>

            {/* Infinite Scroll Loader */}
            {!isShowingAIResults && loadingMore && hasMore && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-saffron" />
              </div>
            )}

            {/* End of results message */}
            {!isShowingAIResults && !hasMore && currentViewData.length > 0 && (
              <div className="text-center py-10 font-body text-sm text-gray-400">
                You've reached the end of the catalog.
              </div>
            )}
          </>
        )}

        {!loading && currentViewData.length === 0 && !error && (
          <EmptyState
            title={isShowingAIResults ? 'No AI Matches Found' : 'No Schemes Found'}
            subtitle={isShowingAIResults ? 'Try rephrasing your query or switch to regular search.' : 'Try a different category or search term.'}
            ctaLabel={isShowingAIResults ? 'Clear Search' : 'Clear Filters'}
            onCtaClick={() => {
              setCategory('all'); setLevel('all'); setSearch(''); setDebouncedSearch(''); setAiResults(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default SchemesPage;
