/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from './RouterContext';
import { db } from '../lib/db';
import { Poem, Comment } from '../types';
import { Heart, MessageSquare, ArrowLeft, Send, Clock, Feather, Bookmark, Compass, RefreshCw } from 'lucide-react';
import { CoverImage } from './CoverImage';

export const PoemDetail: React.FC = () => {
  const { current, navigate } = useRouter();
  const [poem, setPoem] = useState<Poem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPoems, setRelatedPoems] = useState<Poem[]>([]);
  
  // Like states
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  // Comment states
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentMessage, setCommentMessage] = useState<{ success: boolean; text: string } | null>(null);
  
  const [loading, setLoading] = useState(true);

  const slug = current.poemSlug;

  useEffect(() => {
    const loadPoemData = async (showSpinner = true) => {
      if (!slug) return;
      try {
        if (showSpinner) {
          setLoading(true);
        }
        const p = await db.poems.getBySlug(slug);
        if (p) {
          setPoem(p);
          setLikesCount(p.likesCount);

          // Loads approval comments
          const comms = await db.comments.getByPoemId(p.id, true);
          setComments(comms);

          // Check if current user liked it
          const liked = await db.likes.hasLiked(p.id);
          setHasLiked(liked);

          // Load related poems (same category, excluding current)
          const related = await db.poems.getAll({ categoryId: p.categoryId });
          setRelatedPoems(related.filter(item => item.id !== p.id).slice(0, 3));
        } else {
          setPoem(null);
        }
      } catch (err) {
        console.error('Error loading poem:', err);
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    };
    loadPoemData(true);

    const handleDBChange = () => {
      loadPoemData(false);
    };

    window.addEventListener('ink-echoes-db-change', handleDBChange);
    return () => {
      window.removeEventListener('ink-echoes-db-change', handleDBChange);
    };
  }, [slug]);

  const handleLikeToggle = async () => {
    if (!poem) return;
    try {
      const res = await db.likes.toggleLike(poem.id);
      setHasLiked(res.liked);
      setLikesCount(res.newCount);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poem || !commentName.trim() || !commentEmail.trim() || !commentContent.trim()) return;

    try {
      await db.comments.add({
        poemId: poem.id,
        authorName: commentName.trim(),
        authorEmail: commentEmail.trim(),
        content: commentContent.trim()
      });

      setCommentMessage({
        success: true,
        text: 'Your contribution has been logged! To protect this digital sanctuary, comments enter a queue to prevent spam and await curator approval.'
      });
      
      // Reset forms
      setCommentName('');
      setCommentEmail('');
      setCommentContent('');
    } catch (err) {
      setCommentMessage({
        success: false,
        text: 'An error occurred. Check input values and send again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <Feather className="w-8 h-8 animate-spin mx-auto text-sage dark:text-linen" />
        <p className="mt-4 text-sm text-charcoal/60 dark:text-sand/70 font-serif italic">Unrolling the manuscript...</p>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-6 animate-enter">
        <Compass className="w-16 h-16 mx-auto text-sage/40 dark:text-linen/30" />
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-sand">Manuscript Not Found</h2>
        <p className="text-charcoal/70 dark:text-sand/70 text-sm font-serif italic">
          "The words your compass pointed to have dissolved back into empty parchment."
        </p>
        <button
          onClick={() => navigate('poems')}
          className="px-6 py-2.5 bg-sage hover:bg-[#494933] text-sand text-sm font-medium rounded-lg cursor-pointer transition-all focus:ring-2 focus:ring-sage"
        >
          Return to Anthology
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      
      {/* Back to archive Nav */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('poems')}
          className="text-charcoal/70 hover:text-sage dark:text-sand/70 dark:hover:text-linen text-sm font-medium flex items-center space-x-1.5 focus:outline-none cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Anthology Archive</span>
        </button>

        {poem.seriesId && (
          <button
            onClick={() => navigate('series')}
            className="text-xs font-mono font-medium text-sage dark:text-linen/60 uppercase tracking-widest hover:underline flex items-center space-x-1.5 focus:outline-none cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Belongs to a Series</span>
          </button>
        )}
      </div>

      {/* Main Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Cover Image & Actions */}
        <div className="lg:col-span-5 space-y-8">
          <div className="rounded-2xl overflow-hidden border border-white/60 dark:border-white/5 shadow-md aspect-[3/4] relative">
            <CoverImage
              src={poem.coverImage}
              alt={poem.title}
              className="w-full h-full object-cover select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Core Interactive elements */}
          <div className="bg-white/45 dark:bg-[#2C2927]/40 backdrop-blur-md border border-white/60 dark:border-white/5 rounded-xl p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs text-charcoal/50 dark:text-sand/50 font-mono tracking-widest uppercase">Liked by Readers</span>
              <p className="text-base font-semibold text-ink dark:text-sand">{likesCount} appreciations</p>
            </div>
            
            <button
              onClick={handleLikeToggle}
              className={`p-3.5 rounded-full shadow-sm transition-all flex items-center justify-center cursor-pointer ${
                hasLiked
                  ? 'bg-sage text-sand hover:bg-[#494933] scale-105'
                  : 'bg-white/50 text-charcoal/80 hover:text-sage dark:bg-earth-card/50 dark:text-[#D9D1C5] dark:hover:text-linen border border-white/60 dark:border-white/5 hover:scale-105'
              }`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : 'fill-none'}`} />
            </button>
          </div>
        </div>

        {/* Right Column: Actual Full Poem Content */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Headline Metadata */}
          <div className="space-y-4">
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-ink dark:text-sand">
              {poem.title}
            </h1>
            
            <div className="flex items-center space-x-3.5 text-xs text-charcoal/50 dark:text-sand/50">
              <span>By <strong className="font-semibold text-charcoal/85 dark:text-sand/95 text-base">{poem.authorName}</strong></span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>{new Date(poem.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </span>
            </div>
            <hr className="border-t border-sage/20 dark:border-sand/20 w-12" />
          </div>

          {/* LITERARY STYLED POEM CONTENT */}
          <div className="relative">
            {/* Elegant Background Quotes symbol behind lines */}
            <div className="absolute -top-10 -left-6 text-9xl text-linen/30 dark:text-white/5 font-serif select-none pointer-events-none opacity-40">
              “
            </div>
            <div 
              className="font-serif italic text-lg sm:text-xl text-charcoal/90 dark:text-sand/95 leading-relaxed tracking-wider whitespace-pre-line pl-6 border-l-2 border-sage/20 dark:border-sand/20 py-2 relative z-10"
              style={{ textIndent: '0' }}
            >
              {poem.content}
            </div>
          </div>

        </div>

      </div>

      {/* Related Poems */}
      {relatedPoems.length > 0 && (
        <section className="border-t border-charcoal/10 dark:border-sand/10 pt-16 space-y-8">
          <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-ink dark:text-sand">
            Resonances (Related Verses)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPoems.map(p => (
              <div
                key={p.id}
                onClick={() => navigate('poem', { poemSlug: p.slug })}
                className="bg-white/45 dark:bg-[#2B2927]/50 border border-white/60 dark:border-white/5 rounded-xl overflow-hidden hover:scale-[1.01] hover:shadow-md transition-all duration-300 cursor-pointer p-6 flex flex-col justify-between backdrop-blur-sm shadow-sm"
              >
                <div className="space-y-3.5">
                  <h4 className="font-display font-medium text-ink dark:text-sand group-hover:underline line-clamp-1">
                    {p.title}
                  </h4>
                  <p className="text-xs text-charcoal/60 dark:text-sand/65">By <span className="font-semibold text-charcoal/80 dark:text-sand/90">{p.authorName}</span></p>
                  <p className="text-sm font-serif italic text-charcoal/70 dark:text-sand/80 line-clamp-3 pl-3 border-l border-sage/20 dark:border-sand/20">
                    {p.content}
                  </p>
                </div>
                <div className="flex justify-between items-center text-xs text-charcoal/50 mt-5 pt-3 border-t border-charcoal/5 dark:border-white/5">
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await db.likes.toggleLike(p.id);
                        setRelatedPoems(prev => prev.map(rp => rp.id === p.id ? { ...rp, likesCount: res.newCount } : rp));
                      } catch (err) {
                        console.error('Like error:', err);
                      }
                    }}
                    className="flex items-center space-x-1 hover:text-sage cursor-pointer focus:outline-none"
                  >
                    <Heart className="w-3 h-3 text-sage" fill="currentColor" />
                    <span>{p.likesCount}</span>
                  </button>
                  <span className="text-sage dark:text-linen font-medium">Read Poem →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments section */}
      <section className="border-t border-charcoal/10 dark:border-sand/10 pt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: Comments Display list */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-2">
            <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-ink dark:text-sand flex items-center space-x-1.5">
              <MessageSquare className="w-5 h-5 text-sage" />
              <span>Reader Echoes ({comments.length})</span>
            </h3>
            <p className="text-xs text-charcoal/60 dark:text-sand/65">
              Contemplative reflections and messages shared on this verse.
            </p>
          </div>

          {comments.length === 0 ? (
            <div className="p-8 text-center bg-white/30 dark:bg-earth-card/30 rounded-xl border border-dashed border-charcoal/10 dark:border-sand/10">
              <p className="text-sm text-charcoal/50 dark:text-sand/55 font-serif italic">
                "No whispers echo in this empty chamber yet. Be the first to cast a thought."
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comm) => (
                <div
                  key={comm.id}
                  className="bg-white/55 dark:bg-[#2B2927]/60 p-5 rounded-xl border border-white/70 dark:border-white/5 space-y-2 shadow-sm"
                >
                  <div className="flex justify-between items-center text-xs text-charcoal/50 dark:text-sand/50">
                    <strong className="font-semibold text-ink dark:text-sand">{comm.authorName}</strong>
                    <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-charcoal/80 dark:text-sand/85 leading-relaxed font-serif italic">
                    {comm.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Submit comment Form */}
        <div className="lg:col-span-6 bg-white/30 dark:bg-earth-card/30 backdrop-blur-md border border-white/60 dark:border-white/5 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-sand">
              Leave your contemplation
            </h3>
            <p className="text-xs text-charcoal/60 dark:text-sand/65 font-serif whitespace-pre-line">
              We welcome objective reviews, structural critique, or sincere responses.
            </p>
          </div>

          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-charcoal/50 dark:text-sand/50 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Jenkins"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/70 dark:bg-[#1E1D1B]/55 text-charcoal dark:text-sand border border-white dark:border-white/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sage"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-medium text-charcoal/50 dark:text-sand/50 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@example.com"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-white/70 dark:bg-[#1E1D1B]/55 text-charcoal dark:text-sand border border-white dark:border-white/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sage"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-charcoal/50 dark:text-sand/50 mb-1">Observation</label>
              <textarea
                required
                rows={4}
                placeholder="Cast your thoughts or structural feedback regarding Evelyn's sonata..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full px-4 py-2 bg-white/70 dark:bg-[#1E1D1B]/55 text-charcoal dark:text-sand border border-white dark:border-white/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-sage resize-none font-serif"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sage hover:bg-[#494933] text-sand dark:bg-[#D9D1C5] dark:hover:bg-sand dark:text-ink font-semibold rounded-lg text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Contemplation</span>
            </button>
          </form>

          {commentMessage && (
            <div className="p-4 bg-white/60 dark:bg-zinc-950 border border-charcoal/10 dark:border-white/5 rounded-xl animate-enter">
              <p className={`text-xs ${commentMessage.success ? 'text-charcoal/80 dark:text-sand/80' : 'text-rose-500'}`}>
                {commentMessage.text}
              </p>
            </div>
          )}
        </div>

      </section>

    </div>
  );
};
