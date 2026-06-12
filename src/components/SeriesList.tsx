/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from './RouterContext';
import { db } from '../lib/db';
import { Series, Poem } from '../types';
import { BookOpen, ChevronLeft, ChevronRight, CornerDownRight, AlignLeft, Feather, Sparkles, Clock, ArrowLeft } from 'lucide-react';

export const SeriesList: React.FC = () => {
  const { current, navigate } = useRouter();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-navigation states
  const [activeSeries, setActiveSeries] = useState<Series | null>(null);
  const [seriesPoems, setSeriesPoems] = useState<Poem[]>([]);
  const [activePoemIndex, setActivePoemIndex] = useState<number | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchSeries = async (showSpinner = true) => {
      try {
        if (showSpinner) {
          setLoading(true);
        }
        const [allSeries, allPoems] = await Promise.all([
          db.series.getAll(),
          db.poems.getAll({ status: 'published' })
        ]);

        // Get unique, non-null series IDs associated with published poems in the database
        const activeSeriesIds = new Set(
          allPoems
            .map(p => p.seriesId)
            .filter((id): id is string => id !== null && id !== undefined && id !== '')
        );

        // Filter series to only those that have published poems under them in the database
        const publishedSeries = allSeries.filter(s => activeSeriesIds.has(s.id));
        setSeriesList(publishedSeries);

        // If a seriesSlug is present in Router context, activate it!
        if (current.seriesSlug) {
          const match = publishedSeries.find(s => s.slug === current.seriesSlug);
          if (match) {
            handleSelectSeries(match, showSpinner);
          }
        } else if (activeSeries) {
          // Refresh active series items in case data changed
          const updatedActive = publishedSeries.find(s => s.id === activeSeries.id);
          if (updatedActive) {
            handleSelectSeries(updatedActive, false);
          } else {
            setActiveSeries(null);
            setSeriesPoems([]);
            setActivePoemIndex(null);
          }
        }
      } catch (err) {
        console.error('Error fetching series list:', err);
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    };
    fetchSeries(refreshTrigger === 0);
  }, [current.seriesSlug, refreshTrigger]);

  useEffect(() => {
    const handleDBChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('ink-echoes-db-change', handleDBChange);
    return () => {
      window.removeEventListener('ink-echoes-db-change', handleDBChange);
    };
  }, []);

  const handleSelectSeries = async (series: Series, showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      setActiveSeries(series);
      
      // Fetch poems for this series
      const poems = await db.poems.getAll({ status: 'published', seriesId: series.id });
      
      // Sort them sequentially by seriesOrder
      const sorted = poems.sort((a, b) => {
        const orderA = a.seriesOrder ?? 99;
        const orderB = b.seriesOrder ?? 99;
        return orderA - orderB;
      });

      setSeriesPoems(sorted);
      if (sorted.length > 0) {
        setActivePoemIndex(prev => {
          if (prev !== null && prev < sorted.length) return prev;
          return 0;
        }); // Preserve index or set to first verse
      } else {
        setActivePoemIndex(null);
      }
    } catch (err) {
      console.error('Error getting series poems:', err);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  const handleCloseSeries = () => {
    setActiveSeries(null);
    setSeriesPoems([]);
    setActivePoemIndex(null);
    navigate('series');
  };

  const currentPoem = activePoemIndex !== null && seriesPoems[activePoemIndex] 
    ? seriesPoems[activePoemIndex] 
    : null;

  return (
    <div className="space-y-12">
      
      {/* 1. Header display for Series index */}
      {!activeSeries && (
        <div className="space-y-4 text-center max-w-2xl mx-auto animate-enter">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink dark:text-sand">
            Anthology Series
          </h1>
          <p className="text-base text-charcoal/80 dark:text-sand/80 font-serif leading-relaxed">
            Explorations grouped around deep-set concepts, sequential plotlines, or philosophical tracks. 
            Select a series to unroll its narrative path.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-24">
          <Feather className="w-8 h-8 animate-spin mx-auto text-sage dark:text-linen" />
          <p className="mt-4 text-sm text-charcoal/60 dark:text-sand/60">Consulting catalogs...</p>
        </div>
      ) : (
        <>
          {/* 2. List Grid of all Poetry Series */}
          {!activeSeries ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-enter">
              {seriesList.map((series) => (
                <div
                  key={series.id}
                  onClick={() => navigate('series', { seriesSlug: series.slug })}
                  className="bg-white/45 dark:bg-earth-card/45 border border-white/65 dark:border-white/5 rounded-2xl overflow-hidden hover:scale-[1.01] hover:shadow-md transition-all duration-300 cursor-pointer grid grid-cols-1 sm:grid-cols-12 backdrop-blur-sm"
                >
                  {/* Left part: Image */}
                  <div className="sm:col-span-5 relative h-48 sm:h-auto min-h-[160px] border-r border-charcoal/5 dark:border-white/5">
                    <img
                      src={series.coverImage || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=640&auto=format&fit=crop'}
                      alt={series.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover select-none absolute inset-0"
                    />
                  </div>

                  {/* Right part: Description */}
                  <div className="sm:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-sage dark:text-linen font-extrabold uppercase">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Poetry Track</span>
                      </div>
                      <h3 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-sand flex items-center justify-between">
                        <span>{series.name}</span>
                      </h3>
                      <p className="text-charcoal/70 dark:text-sand/75 text-xs sm:text-sm font-serif italic leading-relaxed line-clamp-3">
                        {series.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-charcoal/5 dark:border-white/5 text-xs text-sage dark:text-linen font-bold tracking-wide flex items-center space-x-1 hover:underline">
                      <span>Begin Sequential Lecture</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            
            // 3. active Series sequential reading Screen
            <div className="space-y-10 animate-enter">
              
              {/* Active Head */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-charcoal/10 dark:border-sand/10 pb-6">
                <div>
                  <button
                    onClick={handleCloseSeries}
                    className="text-xs font-mono font-medium text-charcoal/60 hover:text-sage dark:text-sand/60 dark:hover:text-linen uppercase tracking-widest flex items-center space-x-1 mr-4 focus:outline-none mb-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to all series</span>
                  </button>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-sand">
                    {activeSeries.name}
                  </h2>
                </div>
                <div className="text-xs font-mono font-bold tracking-widest text-sage bg-sage/10 px-3.5 py-1.5 rounded-full border border-sage/25 flex items-center space-x-1.5 uppercase select-none dark:text-linen">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Sequential Track Mode</span>
                </div>
              </div>

              {/* Two Column Section: Sequential Menu navigation & Current Poem */}
              {seriesPoems.length === 0 ? (
                <div className="p-12 text-center bg-white/30 dark:bg-earth-card/30 border border-charcoal/5 dark:border-white/5 rounded-2xl max-w-md mx-auto">
                  <h3 className="font-display text-lg font-medium text-ink mb-2">Blank Series</h3>
                  <p className="text-sm text-[#2C2C2C]/70 dark:text-sand/70 font-serif italic">This series doesn't contain any published poems yet. Check the curator panel.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  
                  {/* Left side: Sequential Menu Checklist */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/45 dark:bg-earth-card/45 p-5 rounded-2xl border border-white/60 dark:border-white/5 space-y-4 backdrop-blur-sm">
                      <h4 className="font-mono text-xs font-bold tracking-widest text-[#5A5A40] dark:text-linen uppercase flex items-center space-x-2 border-b border-charcoal/5 dark:border-white/5 pb-2">
                        <AlignLeft className="w-4 h-4" />
                        <span>Sequence of Chapters ({seriesPoems.length})</span>
                      </h4>
                      
                      <div className="space-y-1 max-h-[350px] overflow-y-auto">
                        {seriesPoems.map((p, idx) => {
                          const isActive = idx === activePoemIndex;
                          return (
                            <button
                              key={p.id}
                              onClick={() => setActivePoemIndex(idx)}
                              className={`w-full text-left px-3.5 py-3 rounded-xl text-sm transition-all flex items-center space-x-3 pointer-events-auto cursor-pointer focus:outline-none ${
                                isActive
                                  ? 'bg-[#5A5A40]/10 text-sage dark:bg-linen/15 dark:text-[#D9D1C5] border border-sage/20 dark:border-white/10 font-semibold shadow-sm'
                                  : 'hover:bg-white/50 dark:hover:bg-[#1E1D1B]/40 text-charcoal/70 dark:text-[#D9D1C5]/85 text-sm'
                              }`}
                            >
                              <span className="font-mono text-xs text-charcoal/40 dark:text-sand/50 w-5">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <div className="truncate flex-grow">
                                <span className="block truncate font-display">{p.title}</span>
                                <span className="block text-[10px] text-charcoal/50 dark:text-sand/50">By {p.authorName}</span>
                              </div>
                              {isActive && <CornerDownRight className="w-3.5 h-3.5 text-sage dark:text-linen" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Immersion Panel reader */}
                  <div className="lg:col-span-8 space-y-10 bg-white/55 dark:bg-[#2B2927]/60 border border-white/60 dark:border-white/10 rounded-2xl p-6 sm:p-10 shadow-sm relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 right-0 p-3 text-[140px] text-sage/10 dark:text-white/5 select-none pointer-events-none font-display font-medium leading-none">
                      {activePoemIndex !== null ? String(activePoemIndex + 1).padStart(2, '0') : ''}
                    </div>

                    {currentPoem ? (
                      <div className="space-y-8 relative z-10 animate-enter" key={currentPoem.id}>
                        
                        {/* Poem Metadata information */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-mono tracking-widest text-[#5A5A40] dark:text-[#D9D1C5] uppercase font-extrabold">
                            Chapter {activePoemIndex !== null ? activePoemIndex + 1 : ''} in Sequence
                          </span>
                          <h3 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink dark:text-sand">
                            {currentPoem.title}
                          </h3>
                          <div className="flex items-center space-x-3 text-xs text-charcoal/50 dark:text-sand/50">
                            <span>By <strong className="font-semibold text-charcoal/80 dark:text-sand/85">{currentPoem.authorName}</strong></span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{new Date(currentPoem.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                          <hr className="w-10 border-t-2 border-sage/20 dark:border-sand/20 pt-1" />
                        </div>

                        {/* Poem Body text block */}
                        <div 
                          className="font-serif italic text-lg sm:text-xl text-charcoal/90 dark:text-sand/95 leading-relaxed tracking-wider whitespace-pre-line pl-6 border-l-2 border-sage/30 py-1"
                        >
                          {currentPoem.content}
                        </div>

                        {/* Sequential control keys */}
                        <div className="flex items-center justify-between pt-8 border-t border-charcoal/5 dark:border-white/5">
                          <button
                            disabled={activePoemIndex === 0}
                            onClick={() => setActivePoemIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}
                            className="px-4 py-2 bg-white/60 hover:bg-[#5A5A40]/10 text-charcoal/70 border border-white dark:bg-earth-card/45 dark:hover:bg-earth-card dark:text-sand/70 dark:border-white/5 text-xs sm:text-sm rounded-lg flex items-center space-x-1.5 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous Verse</span>
                          </button>

                          <button
                            onClick={() => navigate('poem', { poemSlug: currentPoem.slug })}
                            className="text-xs text-charcoal/50 dark:text-sand/55 underline hover:text-sage dark:hover:text-linen transition-colors cursor-pointer"
                          >
                            Comment or Like
                          </button>

                          <button
                            disabled={activePoemIndex === seriesPoems.length - 1}
                            onClick={() => setActivePoemIndex(prev => prev !== null && prev < seriesPoems.length - 1 ? prev + 1 : prev)}
                            className="px-4 py-2 bg-sage hover:bg-[#494933] text-sand dark:bg-[#D9D1C5] dark:hover:bg-sand dark:text-ink border border-transparent text-xs sm:text-sm rounded-lg font-semibold flex items-center space-x-1.5 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm active:scale-98"
                          >
                            <span>Next Verse</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ) : (
                      <p className="text-sm font-serif italic text-charcoal/50 dark:text-sand/50">Loading current poem details...</p>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}
        </>
      )}

    </div>
  );
};
