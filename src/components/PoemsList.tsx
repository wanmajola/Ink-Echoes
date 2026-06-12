/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from './RouterContext';
import { db } from '../lib/db';
import { Category, Poem } from '../types';
import { Search, Compass, Clock, Heart, ArrowLeft, ArrowRight, BookOpen, Feather, X } from 'lucide-react';
import { CoverImage } from './CoverImage';

const ITEMS_PER_PAGE = 6;

export const PoemsList: React.FC = () => {
  const { current, navigate } = useRouter();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Search parameters from state/URL or local
  const [search, setSearch] = useState(current.searchQuery || '');
  const [activeCategory, setActiveCategory] = useState<string>(current.categoryId || 'all');
  const [page, setPage] = useState<number>(current.page || 1);
  const [loading, setLoading] = useState(true);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync route parameters with state when route changes
  useEffect(() => {
    if (current.searchQuery !== undefined) {
      setSearch(current.searchQuery);
    }
    if (current.categoryId !== undefined) {
      setActiveCategory(current.categoryId);
    } else {
      setActiveCategory('all');
    }
    if (current.page !== undefined) {
      setPage(current.page);
    } else {
      setPage(1);
    }
  }, [current]);

  useEffect(() => {
    const fetchData = async (showSpinner = true) => {
      try {
        if (showSpinner) {
          setLoading(true);
        }
        const fetchedCats = await db.categories.getAll();
        setCategories(fetchedCats);

        // Fetch poems matching filters
        const filters: any = { status: 'published' };
        if (activeCategory !== 'all') {
          filters.categoryId = activeCategory;
        }
        if (search.trim()) {
          filters.search = search;
        }

        const fetchedPoems = await db.poems.getAll(filters);
        setPoems(fetchedPoems);
      } catch (err) {
        console.error('Error fetching poems list:', err);
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    };
    fetchData(refreshTrigger === 0);
  }, [activeCategory, search, refreshTrigger]);

  useEffect(() => {
    const handleDBChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('ink-echoes-db-change', handleDBChange);
    return () => {
      window.removeEventListener('ink-echoes-db-change', handleDBChange);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    navigate('poems', { 
      searchQuery: search || undefined, 
      categoryId: activeCategory === 'all' ? undefined : activeCategory, 
      page: 1 
    });
  };

  const handleCategorySelect = (catId: string) => {
    setPage(1);
    setActiveCategory(catId);
    navigate('poems', { 
      searchQuery: search || undefined, 
      categoryId: catId === 'all' ? undefined : catId, 
      page: 1 
    });
  };

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setPage(1);
    navigate('poems', { searchQuery: undefined, categoryId: undefined, page: 1 });
  };

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(poems.length / ITEMS_PER_PAGE));
  const paginatedPoems = poems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      navigate('poems', { 
        searchQuery: search || undefined, 
        categoryId: activeCategory === 'all' ? undefined : activeCategory, 
        page: newPage 
      });
      // Scroll to top of list smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Title */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink dark:text-sand animate-enter">
          The Poetry Archive
        </h1>
        <p className="text-base text-charcoal/80 dark:text-sand/80 font-serif leading-relaxed">
          Traverse our curated vaults. Filter by thematic categories or use terms to hunt down specific authors, lines, or verses.
        </p>
      </div>

      {/* Filters & Search Header */}
      <div className="bg-white/45 dark:bg-earth-card/40 border border-white/65 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6 backdrop-blur-md">
        
        {/* Search Input bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sage/60 dark:text-linen/50">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by title, body content, dynamic words, or poet name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-[#1E1D1B]/55 text-[#2C2C2C] dark:text-sand border border-white dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-sage hover:bg-[#494933] dark:bg-linen dark:hover:bg-sand text-sand dark:text-ink text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
          >
            Find Verses
          </button>
        </form>

        {/* Categories filters */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-sage dark:text-[#D9D1C5]/60">
            Thematic Collections
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all pointer-events-auto cursor-pointer select-none ${
                activeCategory === 'all'
                  ? 'bg-sage text-sand border-sage dark:bg-linen dark:text-ink dark:border-linen'
                  : 'bg-white/60 text-[#2C2C2C]/80 border-white/70 dark:bg-earth-card/50 dark:text-sand/75 dark:border-white/5 hover:bg-white dark:hover:bg-earth-card'
              }`}
            >
              All Verses
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all pointer-events-auto cursor-pointer select-none ${
                  activeCategory === cat.id
                    ? 'bg-sage text-sand border-sage dark:bg-linen dark:text-ink dark:border-linen'
                    : 'bg-white/60 text-[#2C2C2C]/80 border-white/70 dark:bg-earth-card/50 dark:text-sand/75 dark:border-white/5 hover:bg-white dark:hover:bg-earth-card'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters badge */}
        {(search || activeCategory !== 'all') && (
          <div className="flex items-center justify-between text-xs text-charcoal/60 pt-3 border-t border-charcoal/5 dark:border-white/5">
            <span>Found <strong className="font-semibold text-ink dark:text-sand">{poems.length}</strong> matching works</span>
            <button
              onClick={clearFilters}
              className="text-sage hover:text-[#494933] dark:text-linen dark:hover:text-sand flex items-center space-x-1 underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5 mr-0.5" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="text-center py-24">
          <Feather className="w-8 h-8 animate-spin mx-auto text-sage dark:text-linen" />
          <p className="mt-4 text-sm text-charcoal/60 dark:text-sand/70">Loading collection archives...</p>
        </div>
      ) : paginatedPoems.length === 0 ? (
        <div className="text-center py-20 bg-white/30 dark:bg-earth-card/30 rounded-2xl border border-dashed border-charcoal/10 dark:border-white/5 animate-enter">
          <Compass className="w-12 h-12 mx-auto text-sage mb-4 opacity-50" />
          <h3 className="font-display text-lg font-semibold text-ink dark:text-sand">No verses found</h3>
          <p className="text-sm text-charcoal/70 max-w-sm mx-auto mt-2 font-serif italic">
            "The sheets remain blank, awaiting the ink of ideas." Try another term or look under a different collection.
          </p>
          <button
            onClick={clearFilters}
            className="mt-6 px-4 py-2 bg-sage hover:bg-[#494933] text-sand rounded-lg text-xs transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-12 animate-enter">
          
          {/* Loop over page poems */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPoems.map((poem) => (
              <article
                key={poem.id}
                onClick={() => navigate('poem', { poemSlug: poem.slug })}
                className="bg-white/45 dark:bg-earth-card/45 border border-white/60 dark:border-white/5 rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between backdrop-blur-sm shadow-sm"
              >
                <div>
                  <div className="h-48 overflow-hidden relative border-b border-charcoal/5 dark:border-white/5">
                    <CoverImage
                      src={poem.coverImage}
                      alt={poem.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="text-[10px] font-mono tracking-widest text-sage dark:text-[#D9D1C5] uppercase flex items-center space-x-2 font-bold">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(poem.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <h2 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-sand line-clamp-1">
                      {poem.title}
                    </h2>
                    <p className="text-xs text-charcoal/60 dark:text-sand/65">
                      By <span className="font-semibold text-charcoal/80 dark:text-sand/90">{poem.authorName}</span>
                    </p>
                    <p className="text-sm font-serif italic text-charcoal/70 dark:text-sand/80 line-clamp-4 pl-3.5 border-l-2 border-sage/20 dark:border-sand/20 whitespace-pre-line pt-1">
                      {poem.content.split('\n').slice(0, 4).join('\n')}
                      {poem.content.split('\n').length > 4 && '\n...'}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 mt-4 border-t border-charcoal/5 dark:border-white/5 flex justify-between items-center text-xs font-semibold text-charcoal/60 dark:text-sand/60">
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await db.likes.toggleLike(poem.id);
                        setPoems(prev => prev.map(p => p.id === poem.id ? { ...p, likesCount: res.newCount } : p));
                      } catch (err) {
                        console.error('Like error:', err);
                      }
                    }}
                    className="flex items-center space-x-1 text-sage hover:text-sage/80 cursor-pointer focus:outline-none"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>{poem.likesCount}</span>
                  </button>
                  
                  <span className="text-sage dark:text-linen font-bold hover:underline">Read Verse →</span>
                </div>
              </article>
            ))}
          </div>

          {/* Interactive Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-8 border-t border-charcoal/10 dark:border-sand/10">
              <button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-4 py-2 border border-white/60 dark:border-white/5 bg-white/45 dark:bg-earth-card/45 text-charcoal/80 dark:text-sand/80 rounded-lg text-sm hover:bg-[#5A5A40]/10 dark:hover:bg-earth-card disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="hidden sm:flex space-x-2 text-sm font-medium">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => handlePageChange(pNum)}
                    className={`w-10 h-10 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                      pNum === page
                        ? 'bg-sage text-sand font-bold shadow-sm'
                        : 'border border-white/60 dark:border-white/5 hover:bg-[#5A5A40]/10 bg-white/40 dark:bg-earth-card/40 text-charcoal/70 dark:text-sand/70'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
              </div>

              <div className="sm:hidden text-sm text-charcoal/70 dark:text-sand/70">
                Page {page} of {totalPages}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-4 py-2 border border-white/60 dark:border-white/5 bg-white/45 dark:bg-earth-card/45 text-charcoal/80 dark:text-sand/80 rounded-lg text-sm hover:bg-[#5A5A40]/10 dark:hover:bg-earth-card disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
