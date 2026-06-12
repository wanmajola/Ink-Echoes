/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from './RouterContext';
import { db } from '../lib/db';
import { Category, Poem } from '../types';
import { Feather, ArrowRight, MessageSquare, Heart, Clock, Mail, BookOpen, Compass, ShieldCheck } from 'lucide-react';
import { CoverImage } from './CoverImage';

export const Home: React.FC = () => {
  const { navigate } = useRouter();
  const [featuredPoem, setFeaturedPoem] = useState<Poem | null>(null);
  const [latestPoems, setLatestPoems] = useState<Poem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async (showSpinner = true) => {
      try {
        if (showSpinner) {
          setLoading(true);
        }
        // Get all items
        const rawPoems = await db.poems.getAll({ status: 'published' });
        const cats = await db.categories.getAll();
        
        setCategories(cats);
        
        if (rawPoems.length > 0) {
          // Select first poem as Featured, and the next few as Latest
          setFeaturedPoem(rawPoems[0]);
          setLatestPoems(rawPoems.slice(1, 4)); // Next 3 poems
        } else {
          setFeaturedPoem(null);
          setLatestPoems([]);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    };

    loadHomeData(true);

    const handleDBChange = () => {
      loadHomeData(false);
    };

    window.addEventListener('ink-echoes-db-change', handleDBChange);
    return () => {
      window.removeEventListener('ink-echoes-db-change', handleDBChange);
    };
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    try {
      const res = await db.newsletter.subscribe(newsletterEmail);
      setNewsletterStatus(res);
      if (res.success) {
        setNewsletterEmail('');
      }
    } catch (err) {
      setNewsletterStatus({ success: false, message: 'Subscription failed. Please check internet connection.' });
    }
  };

  const truncatePrg = (text: string, count: number = 30) => {
    const lines = text.split('\n');
    const intro = lines.slice(0, 3).join('\n');
    return intro.length > 150 ? intro.slice(0, 150) + '...' : intro + '\n...';
  };

  return (
    <div className="space-y-20">
      
      {/* 1. Hero Section */}
      <section className="text-center max-w-3xl mx-auto py-8 sm:py-16 space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-sage/15 dark:bg-sage/25 text-sage dark:text-linen text-xs font-mono tracking-widest uppercase rounded-full mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Lyrical Anthology &amp; Poetry series</span>
        </div>
        
        <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-tight text-ink dark:text-sand select-none">
          Where Lyrical Ink Meets its <span className="font-serif italic text-sage dark:text-[#D9D1C5]">Eternal</span> Echo
        </h1>
        
        <p className="text-base sm:text-lg text-charcoal/80 dark:text-sand/85 font-serif max-w-2xl mx-auto leading-relaxed">
          Step into a quiet conservatory of modern verses, structured series, and classical translations. 
          Read, contemplate, and subscribe to a legacy of words that refuse to fade.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate('poems')}
            className="w-full sm:w-auto px-6 py-3.5 bg-sage hover:bg-[#494933] dark:bg-linen dark:hover:bg-sand text-sand dark:text-ink font-medium rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 focus:ring-2 focus:ring-sage group cursor-pointer"
          >
            <span>Explore Anthology</span>
            <Compass className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          
          <button
            onClick={() => navigate('series')}
            className="w-full sm:w-auto px-6 py-3.5 border border-sage/30 dark:border-sand/30 hover:bg-sage/5 dark:hover:bg-[#D9D1C5]/5 font-medium rounded-lg text-charcoal/85 dark:text-sand/90 transition-all flex items-center justify-center space-x-2 focus:ring-2 focus:ring-sage"
          >
            <span>Read Verse Series</span>
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-10">
          <Feather className="w-8 h-8 animate-spin mx-auto text-stone-400 dark:text-zinc-650" />
          <p className="mt-4 text-sm text-stone-400">Gathering collection files...</p>
        </div>
      ) : (
        <>
          {/* 2. Featured Poem Spotlight */}
          {featuredPoem && (
            <section className="bg-white/45 dark:bg-earth-card/45 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Image */}
                <div className="lg:col-span-5 h-64 lg:h-auto min-h-[300px] relative">
                  <CoverImage
                    src={featuredPoem.coverImage}
                    alt={featuredPoem.title}
                    className="w-full h-full object-cover select-none absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-stone-900/40 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 bg-sage text-sand text-[10px] font-mono tracking-widest uppercase px-3.5 py-1.5 rounded-full border border-sage/20 shadow-sm font-medium">
                    Featured Work
                  </div>
                </div>

                {/* Info Text */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8">
                  <div className="space-y-4">
                    <span className="text-[11px] font-mono text-charcoal/50 dark:text-sand/50 uppercase tracking-widest block font-semibold">
                      Featured Poem
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-sand">
                      {featuredPoem.title}
                    </h2>
                    <p className="text-sm text-charcoal/60 dark:text-sand/65 flex items-center space-x-2">
                      <span>By <strong className="font-semibold text-charcoal/80 dark:text-sand/90">{featuredPoem.authorName}</strong></span>
                      <span>•</span>
                      <span>{new Date(featuredPoem.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </p>

                    <hr className="w-8 border-t-2 border-sage/25 dark:border-sand/25" />

                    {/* Shortened Content preview */}
                    <div 
                      className="text-charcoal/80 dark:text-sand/85 font-serif italic whitespace-pre-line text-base leading-relaxed pl-4 border-l-2 border-sage/20 dark:border-sand/20 py-1"
                    >
                      {truncatePrg(featuredPoem.content)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-charcoal/5 dark:border-white/5">
                    <div className="flex space-x-4 text-xs text-charcoal/50 dark:text-sand/50">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await db.likes.toggleLike(featuredPoem.id);
                            setFeaturedPoem(prev => prev ? { ...prev, likesCount: res.newCount } : prev);
                          } catch (err) {
                            console.error('Like error:', err);
                          }
                        }}
                        className="flex items-center space-x-1 cursor-pointer hover:text-sage transition-colors focus:outline-none"
                      >
                        <Heart className="w-4 h-4 text-sage" fill="currentColor" />
                        <span>{featuredPoem.likesCount} likes</span>
                      </button>
                    </div>

                    <button
                      onClick={() => navigate('poem', { poemSlug: featuredPoem.slug })}
                      className="text-sage dark:text-linen text-sm font-semibold tracking-wide flex items-center space-x-1 hover:text-[#494933] dark:hover:text-sand focus:outline-none focus:underline"
                    >
                      <span>Read Full Work</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            </section>
          )}

          {/* 3. Latest Poems Grid */}
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2">
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-sand">
                  Latest Publications
                </h3>
                <p className="text-sm text-charcoal/65 dark:text-sand/70">
                  Fresh verses added to the Ink &amp; Echoes archive.
                </p>
              </div>
              <button
                onClick={() => navigate('poems')}
                className="text-charcoal dark:text-sand/80 hover:underline hover:text-sage dark:hover:text-linen text-sm font-medium flex items-center space-x-1.5 focus:outline-none"
              >
                <span>View All Poems</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPoems.map((poem) => (
                <article
                  key={poem.id}
                  onClick={() => navigate('poem', { poemSlug: poem.slug })}
                  className="bg-white/45 dark:bg-earth-card/45 border border-white/60 dark:border-white/5 rounded-xl overflow-hidden hover:scale-[1.01] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between backdrop-blur-sm shadow-sm"
                >
                  <div>
                    <div className="h-44 overflow-hidden relative border-b border-charcoal/5 dark:border-white/5">
                      <CoverImage
                        src={poem.coverImage}
                        alt={poem.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-[#5A5A40] dark:text-[#D9D1C5] uppercase font-bold">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(poem.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <h4 className="font-display text-lg font-semibold tracking-tight text-ink dark:text-sand">
                        {poem.title}
                      </h4>
                      <p className="text-xs text-charcoal/60 dark:text-sand/65">
                        By <strong className="font-semibold text-charcoal/85 dark:text-sand/90">{poem.authorName}</strong>
                      </p>
                      <p className="text-sm font-serif italic text-charcoal/75 dark:text-sand/80 line-clamp-3 pl-3 border-l border-sage/20 dark:border-sand/20 whitespace-pre-line mt-2">
                        {truncatePrg(poem.content, 2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-4 border-t border-charcoal/5 dark:border-white/5 flex justify-between items-center text-xs text-charcoal/60 dark:text-sand/60 font-medium">
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await db.likes.toggleLike(poem.id);
                          setLatestPoems(prev => prev.map(p => p.id === poem.id ? { ...p, likesCount: res.newCount } : p));
                        } catch (err) {
                          console.error('Like error:', err);
                        }
                      }}
                      className="flex items-center space-x-1.5 hover:text-sage cursor-pointer focus:outline-none"
                    >
                      <Heart className="w-3.5 h-3.5 text-sage" fill="currentColor" />
                      <span>{poem.likesCount}</span>
                    </button>
                    <span className="text-sage dark:text-linen hover:underline">Read →</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 4. Filter Categories Browse */}
          <section className="bg-white/30 dark:bg-earth-card/30 backdrop-blur-md border border-white/40 dark:border-white/5 rounded-2xl p-8 sm:p-12 space-y-8">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-sand">
                Browse by Category
              </h3>
              <p className="text-sm text-charcoal/70 dark:text-sand/75 font-serif">
                Select a stylistic direction or emotional theme to discover relevant poetry.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate('poems', { categoryId: cat.id })}
                  className="bg-white/55 dark:bg-[#2B2927]/60 border border-white/70 dark:border-white/5 rounded-xl p-6 text-left hover:-translate-y-1 hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage group cursor-pointer"
                >
                  <p className="font-display text-base font-semibold group-hover:text-sage dark:group-hover:text-linen text-ink dark:text-sand mb-1.5 flex items-center justify-between">
                    <span>{cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-charcoal/40 dark:text-sand/40 transition-transform group-hover:translate-x-0.5" />
                  </p>
                  <p className="text-xs text-charcoal/60 dark:text-sand/65 leading-relaxed font-sans line-clamp-2">
                    {cat.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* 5. Newsletter Signup Component */}
          <section className="bg-sage text-sand dark:bg-[#3E3E2B] dark:text-sand border border-sage/20 rounded-2xl p-8 sm:p-12 overflow-hidden relative shadow-md">
            <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 text-[#494933] dark:text-[#2B2B1E] pointer-events-none">
              <Feather className="w-64 h-64 rotate-12 opacity-10" />
            </div>

            <div className="max-w-xl space-y-6 relative z-10">
              <span className="text-[10px] font-mono text-sand/65 dark:text-sand/65 uppercase tracking-widest block font-bold">
                The Literary Sentinel
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-semibold leading-tight tracking-tight">
                Receive the weekly verse ledger.
              </h3>
              <p className="text-sm text-sand/85 dark:text-sand/80 font-serif leading-relaxed">
                Every Friday, we dispatch a curated anthology of newly compiled poetry, behind-the-scenes 
                analyses of featured authors, and upcoming anthology calls. Unsubscribe at any time.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-grow">
                  <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sand/50">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="newsletter-email"
                      required
                      placeholder="Enter your email address"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-sand/10 dark:bg-[#1E1D1B]/40 text-sand border border-sand/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sand placeholder-sand/50 font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-sand hover:bg-linen text-sage font-semibold rounded-lg text-sm transition-all flex items-center justify-center space-x-2 shrink-0 active:scale-95 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Subscribe</span>
                </button>
              </form>

              {newsletterStatus && (
                <div className="mt-4 animate-enter flex items-center space-x-2 text-xs">
                  {newsletterStatus.success ? (
                    <span className="text-linen flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1.5 shrink-0" />
                      {newsletterStatus.message}
                    </span>
                  ) : (
                    <span className="text-red-200">
                      {newsletterStatus.message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}

    </div>
  );
};
