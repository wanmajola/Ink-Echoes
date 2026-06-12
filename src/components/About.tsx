/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from './RouterContext';
import { Feather, Landmark, Quote, Heart, ArrowRight } from 'lucide-react';
import authorAvatar from '../../assets/mm.png';

export const About: React.FC = () => {
  const { navigate } = useRouter();

  const author = {
    name: 'Mzwandile Majola',
    role: 'Poet & Curator',
    bio: 'I study 19th-century Victorian lyrics and oversee the thematic collections here. I believe in the restorative math of strict metered syllables and the power of slow, deliberate reading.',
    avatar: authorAvatar
  };

  return (
    <div className="space-y-16 py-6 font-sans">
      
      {/* 1. Header Title */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/60 border border-white dark:bg-earth-card/40 dark:border-white/5 text-sage dark:text-linen text-xs font-mono tracking-widest uppercase rounded-full">
          <Landmark className="w-3.5 h-3.5" />
          <span>The Sovereign Sanctuary</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink dark:text-sand animate-enter">
          Our Literary Manifesto
        </h1>
        <p className="text-sm sm:text-base text-charcoal/75 dark:text-sand/75 font-serif leading-relaxed max-w-xl mx-auto italic">
          "Ink is a promise of memory; Echoes are the confirmation of its receipt."
        </p>
      </div>

      {/* 2. Visual Banner */}
      <div className="rounded-2xl overflow-hidden shadow-sm aspect-[21/9] relative min-h-[180px] border border-white/60 dark:border-white/5">
        <img
          src="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop"
          alt="Vintage writing desk"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none"
        />
        <div className="absolute inset-0 bg-[#2C2C2C]/30 dark:bg-stone-950/45 flex items-center justify-center p-6 text-center" />
      </div>

      {/* 3. Core Mission and Details */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-sand">
            A Sanctuary from the Digital Storm
          </h2>
          <p className="text-sm sm:text-base text-[#2C2C2C]/85 dark:text-[#F1EFEA]/85 font-serif leading-relaxed">
            Ink &amp; Echoes was drafted in 2026 out of a shared concern for contemporary literary consumption. 
            In an era driven by high-velocity algorithms and temporary social media posts, we noticed that 
            thoughtful verse was losing its anchor.
          </p>
          <p className="text-sm sm:text-base text-[#2C2C2C]/85 dark:text-[#F1EFEA]/85 font-serif leading-relaxed">
            This workspace serves as an offline-first, dual-backed digital monastery. Every collection series 
            printed here is designed for slow absorption. Our fonts are selected for optical balance, and our 
            database uses state-enforced Row Level Security profiles to let readers engage, like, and write reviews 
            sincerely without tracking, telemetry, or notifications.
          </p>
        </div>

        <div className="bg-white/45 dark:bg-[#2C2927]/40 border border-white/60 dark:border-white/5 rounded-2xl p-8 space-y-6 relative shadow-sm backdrop-blur-md">
          <div className="text-[#5A5A40]/10 dark:text-white/5 absolute -top-4 -left-4 pointer-events-none select-none">
            <Quote className="w-32 h-32 fill-current" />
          </div>
          <p className="text-base sm:text-lg text-[#2C2C2C]/90 dark:text-sand/90 font-serif italic relative z-10 leading-relaxed pl-4 border-l-2 border-[#5A5A40]/30 dark:border-white/10">
            "To write a poem is to measure the heart rate of an era. To assemble a series is to trace how that pulse moves when the storm approaches."
          </p>
          <span className="block text-right font-mono text-xs tracking-widest text-sage dark:text-linen uppercase font-bold">
            — The Author
          </span>
        </div>
      </section>

      {/* 4. About the Author */}
      <section className="space-y-10 border-t border-charcoal/10 dark:border-sand/10 pt-16">
        <div className="text-center max-w-lg mx-auto space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink dark:text-sand">
            About the Author
          </h2>
          <p className="text-sm text-charcoal/50 dark:text-sand/55 font-serif">
            The solitary mind behind the ink and echoes found within these pages.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white/45 dark:bg-earth-card/45 border border-white/65 dark:border-white/5 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-6 sm:space-y-0 sm:space-x-8 shadow-sm hover:shadow-md transition-shadow duration-300 backdrop-blur-sm">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/80 dark:border-white/10 shadow-sm shrink-0">
              <img
                src={author.avatar}
                alt={author.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />
            </div>
            <div className="space-y-4 flex-grow">
              <div className="space-y-1.5 border-b border-charcoal/5 dark:border-white/5 pb-4">
                <h3 className="font-display text-2xl font-semibold text-ink dark:text-sand">
                  {author.name}
                </h3>
                <p className="text-xs font-mono tracking-wider text-sage bg-sage/10 px-3 py-1.5 rounded-full uppercase font-bold border border-sage/15 dark:text-linen dark:bg-linen/10 dark:border-linen/15 inline-block">
                  {author.role}
                </p>
              </div>
              <p className="text-sm sm:text-base text-[#2C2C2C]/80 dark:text-sand/85 leading-relaxed font-serif italic">
                "{author.bio}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Return to browsing */}
      <section className="text-center bg-[#5A5A40]/10 dark:bg-[#D9D1C5]/5 border border-[#5A5A40]/15 dark:border-white/5 rounded-2xl p-8 sm:p-12 space-y-6">
        <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink dark:text-sand">
          Would you like to explore our collections?
        </h3>
        <p className="text-xs sm:text-sm text-charcoal/70 dark:text-sand/70 font-serif max-w-md mx-auto">
          We release dynamic verse sequentially, allowing you to trace stories from the initial blueprint 
          up to full publication. Corrected drafts are stamped with real-time UTC logs.
        </p>
        <button
          onClick={() => navigate('poems')}
          className="px-6 py-2.5 bg-sage hover:bg-[#494933] text-sand dark:bg-[#D9D1C5] dark:hover:bg-sand dark:text-ink font-semibold rounded-lg text-sm transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-98"
        >
          <span>Begin Reading</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

    </div>
  );
};
