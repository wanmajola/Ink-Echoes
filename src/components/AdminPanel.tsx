/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Poem, Category, Series, Comment, NewsletterSubscriber, DashboardStats } from '../types';
import { 
  Lock, Key, ShieldCheck, Feather, LogOut, CheckCircle, BarChart3, 
  BookOpen, Compass, Mail, MessageSquare, Plus, Edit, Trash2, Eye, EyeOff, Save, X, Heart, Settings 
} from 'lucide-react';
import { CoverImage } from './CoverImage';

type AdminTab = 'overview' | 'poems' | 'collections' | 'moderation' | 'subscribers';

export const AdminPanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Login form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboards stats & collections
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Forms state
  const [poemForm, setPoemForm] = useState<Partial<Poem> | null>(null); // null means list mode, object means edit/new mode
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [seriesForm, setSeriesForm] = useState<Partial<Series> | null>(null); // null means list mode, object means edit/new mode
  const [submittingAction, setSubmittingAction] = useState(false);
  const [templomeLinkInput, setTemplomeLinkInput] = useState('');
  const [settingsSaveStatus, setSettingsSaveStatus] = useState<string | null>(null);

  // Check initial session
  useEffect(() => {
    const checkSession = async () => {
      const u = await db.auth.getCurrentUser();
      setCurrentUser(u);
    };
    checkSession();
  }, []);

  // Fetch tab data on active login
  useEffect(() => {
    if (!currentUser) return;
    loadDashboardData();

    const handleDBChange = () => {
      loadDashboardData();
    };

    window.addEventListener('ink-echoes-db-change', handleDBChange);
    return () => {
      window.removeEventListener('ink-echoes-db-change', handleDBChange);
    };
  }, [currentUser, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoadingData(true);
      const dashboardStats = await db.getDashboardStats();
      setStats(dashboardStats);

      if (activeTab === 'poems' || activeTab === 'overview') {
        const pList = await db.poems.getAll({ status: 'all' });
        setPoems(pList);
      }
      if (activeTab === 'collections' || activeTab === 'poems') {
        const cList = await db.categories.getAll();
        setCategories(cList);
        const sList = await db.series.getAll();
        setSeriesList(sList);
      }
      if (activeTab === 'moderation' || activeTab === 'overview') {
        const cComms = await db.comments.getAllComments();
        setComments(cComms);
      }
      if (activeTab === 'subscribers') {
        const sSubs = await db.newsletter.getAll();
        setSubscribers(sSubs);
      }
      if (activeTab === 'overview') {
        const link = await db.settings.getTemplomeLink();
        setTemplomeLinkInput(link);
      }
    } catch (err) {
      console.error('Error fetching dashboard listings:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setAuthLoading(true);
    try {
      const res = await db.auth.login(email, password);
      if (res.success) {
        setCurrentUser(res.user);
        setEmail('');
        setPassword('');
      } else {
        setLoginError(res.error || 'Login failed.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected authorization error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutSubmit = async () => {
    await db.auth.logout();
    setCurrentUser(null);
  };

  // ==================== POEMS CRUD ====================
  const handleNewPoemTrigger = () => {
    setPoemForm({
      title: '',
      slug: '',
      content: '',
      authorName: currentUser?.user_metadata?.full_name || 'Curator',
      coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=640&auto=format&fit=crop',
      categoryId: categories[0]?.id || '',
      seriesId: null,
      seriesOrder: null,
      status: 'draft'
    });
  };

  const handleEditPoemTrigger = (p: Poem) => {
    setPoemForm(p);
  };

  const handleSlugAutogeneration = (title: string) => {
    if (!poemForm) return;
    const generated = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-');
    setPoemForm(prev => prev ? { ...prev, title, slug: generated } : null);
  };

  const handleSavePoem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poemForm || !poemForm.title || !poemForm.slug || !poemForm.content) return;
    
    try {
      setSubmittingAction(true);
      if (poemForm.id) {
        // Edit Mode
        await db.poems.update(poemForm as Poem);
      } else {
        // Create Mode
        await db.poems.create({
          title: poemForm.title,
          slug: poemForm.slug,
          content: poemForm.content,
          authorName: poemForm.authorName || 'Lead Curator',
          coverImage: poemForm.coverImage || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=640&auto=format&fit=crop',
          categoryId: poemForm.categoryId || '',
          seriesId: poemForm.seriesId || null,
          seriesOrder: poemForm.seriesOrder !== undefined ? poemForm.seriesOrder : null,
          status: poemForm.status || 'draft'
        });
      }
      setPoemForm(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Poem save failed:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeletePoem = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this poem from the archives? This action is irreversible.')) return;
    try {
      await db.poems.delete(id);
      await loadDashboardData();
    } catch (err) {
      console.error('Poem deletion error:', err);
    }
  };

  // ==================== CATEGORIES CRUD ====================
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    
    try {
      setSubmittingAction(true);
      const generatedSlug = categoryName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
      await db.categories.create({
        name: categoryName.trim(),
        slug: generatedSlug,
        description: categoryDesc.trim() || 'A thematic assembly of modern expressions.'
      });
      setCategoryName('');
      setCategoryDesc('');
      await loadDashboardData();
    } catch (err) {
      console.error('Category insert failed:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this theme category? Any poems associated with it will lose their linkage.')) return;
    try {
      await db.categories.delete(id);
      await loadDashboardData();
    } catch (err) {
      console.error('Category delete error:', err);
    }
  };

  // ==================== SERIES CRUD ====================
  const handleNewSeriesTrigger = () => {
    setSeriesForm({
      name: '',
      slug: '',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=640&auto=format&fit=crop'
    });
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm || !seriesForm.name || !seriesForm.slug) return;

    try {
      setSubmittingAction(true);
      if (seriesForm.id) {
        await db.series.update(seriesForm as Series);
      } else {
        await db.series.create({
          name: seriesForm.name,
          slug: seriesForm.slug,
          description: seriesForm.description || '',
          coverImage: seriesForm.coverImage || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=640&auto=format&fit=crop'
        });
      }
      setSeriesForm(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Series save error:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteSeries = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this poetry series track?')) return;
    try {
      await db.series.delete(id);
      await loadDashboardData();
    } catch (err) {
      console.error('Series delete mistake:', err);
    }
  };

  // ==================== REVIEWS MODERATION ====================
  const handleApproveComment = async (id: string) => {
    try {
      await db.comments.approve(id);
      await loadDashboardData();
    } catch (err) {
      console.error('Comment approve error:', err);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('Permanently discard this reader comment?')) return;
    try {
      await db.comments.delete(id);
      await loadDashboardData();
    } catch (err) {
      console.error('Comment delete mistake:', err);
    }
  };

  // ==================== NEWSLETTER ACTION ====================
  const handleDeleteSubscriber = async (id: string) => {
    if (!window.confirm('Remove this email from the subscriber registry?')) return;
    try {
      await db.newsletter.unsubscribe(id);
      await loadDashboardData();
    } catch (err) {
      console.error('Subscriber dequeue error:', err);
    }
  };

  // ==================== SITE SETTINGS ACTION ====================
  const handleSaveSettings = async () => {
    try {
      setSubmittingAction(true);
      await db.settings.setTemplomeLink(templomeLinkInput);
      setSettingsSaveStatus('Successfully saved developer link!');
      setTimeout(() => setSettingsSaveStatus(null), 3500);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setSettingsSaveStatus('Failed to save developer link.');
      setTimeout(() => setSettingsSaveStatus(null), 3500);
    } finally {
      setSubmittingAction(false);
    }
  };

  // ==================== RENDER FLOWS ====================

  // A. LOGGED-OUT PORTAL
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white/55 dark:bg-[#2B2927]/60 border border-white/60 dark:border-white/10 rounded-2xl p-6 sm:p-10 shadow-lg space-y-8 relative overflow-hidden backdrop-blur-md">
          
          <div className="text-center space-y-3">
            <div className="p-3 bg-sage text-sand dark:bg-[#D9D1C5] dark:text-ink rounded-xl inline-flex shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-sand">
              Curator's Registry
            </h1>
            <p className="text-charcoal/70 dark:text-sand/70 text-xs sm:text-sm font-serif italic">
              Access the anthology printing controls, review queues and subscribers.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold tracking-wide uppercase text-[#5A5A40] dark:text-linen mb-1.5">
                Curator Email
              </label>
              <input
                type="email"
                required
                placeholder="curator@inkandechoes.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/40 dark:bg-stone-950/40 text-ink dark:text-sand border border-charcoal/10 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold tracking-wide uppercase text-[#5A5A40] dark:text-linen mb-1.5">
                Access Token
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/40 dark:bg-stone-950/40 text-ink dark:text-sand border border-charcoal/10 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-sage hover:bg-[#494933] text-sand dark:bg-[#D9D1C5] dark:hover:bg-sand dark:text-ink font-semibold rounded-xl text-sm transition-all focus:outline-none shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Key className="w-4 h-4" />
              <span>{authLoading ? 'Verifying Credentials...' : 'Unlock Panel'}</span>
            </button>
          </form>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg text-center font-medium font-serif">
              {loginError}
            </div>
          )}



        </div>
      </div>
    );
  }

  // B. MAIN AUTHENTICATED AREA
  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Header with metadata session */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-charcoal/10 dark:border-sand/10 pb-6">
        <div>
          <span className="text-xs font-mono font-medium uppercase tracking-widest text-[#5A5A40] dark:text-[#D9D1C5]">Curator Dashboard</span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink dark:text-sand">
            Anthology Printing Portal
          </h1>
          <p className="text-xs text-charcoal/50 dark:text-sand/55 mt-1">
            Logged in as <strong className="font-medium text-[#5A5A40] dark:text-linen">{currentUser.email}</strong>
          </p>
        </div>

        <button
          onClick={handleLogoutSubmit}
          className="px-4 py-2 border border-rose-200 hover:bg-rose-50 hover:text-stone-50 dark:border-white/10 dark:hover:bg-red-950/40 text-rose-500 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 focus:outline-none transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Ledger</span>
        </button>
      </div>

      {/* 2. Sub-tab headers navigation */}
      <div className="flex overflow-x-auto whitespace-nowrap gap-1 border-b border-charcoal/10 dark:border-sand/10 pb-0.5 pointer-events-auto">
        {(['overview', 'poems', 'collections', 'moderation', 'subscribers'] as AdminTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPoemForm(null);
                setSeriesForm(null);
              }}
              className={`px-4 py-3 border-b-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none focus:outline-none capitalize ${
                isActive
                  ? 'border-sage text-sage dark:border-sand dark:text-sand font-bold'
                  : 'border-transparent text-charcoal/40 hover:text-[#5A5A40] dark:text-sand/40 dark:hover:text-linen'
              }`}
            >
              {tab === 'collections' ? 'Themes & Series' : tab === 'moderation' ? 'Review Moderation' : tab}
            </button>
          );
        })}
      </div>

      {/* Tab content area spinner */}
      {loadingData && (
        <div className="text-center py-20 animate-enter">
          <Feather className="w-7 h-7 font-bold animate-spin mx-auto text-sage dark:text-linen" />
          <p className="text-xs text-charcoal/50 mt-2 font-serif italic dark:text-sand/55">Reviewing indices...</p>
        </div>
      )}

      {!loadingData && (
        <div className="space-y-8 animate-enter">
          
          {/* =======================================================
              TAB: OVERVIEW
             ======================================================= */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              
              {/* Counter boxes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Published Poems', count: stats.poemsCount, icon: <Feather className="w-5 h-5 text-purple-500" /> },
                  { label: 'Pending Comments', count: comments.filter(c => !c.isApproved).length, icon: <MessageSquare className="w-5 h-5 text-amber-500" /> },
                  { label: 'Total Appreciations', count: stats.likesCount, icon: <Heart className="w-5 h-5 text-rose-500" /> },
                  { label: 'Subscribers', count: stats.subscribersCount, icon: <Mail className="w-5 h-5 text-teal-400" /> },
                ].map((st, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-stone-50 dark:bg-zinc-950 rounded-lg shrink-0">
                      {st.icon}
                    </div>
                    <div>
                      <span className="block text-xs font-mono font-bold tracking-wide uppercase text-stone-400">{st.label}</span>
                      <span className="block text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50">{st.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Moderation Spotlight (Quick access) */}
              <div className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-4">
                <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50 flex items-center space-x-2">
                  <MessageSquare className="w-4.5 h-4.5 text-amber-500" />
                  <span>Pending Moderation Queue ({comments.filter(c => !c.isApproved).length})</span>
                </h3>

                {comments.filter(c => !c.isApproved).length === 0 ? (
                  <p className="text-xs sm:text-sm text-stone-400 font-serif italic py-2 pl-3 border-l border-stone-200">
                    "All reader queries and echoes have been moderated and balanced."
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments.filter(c => !c.isApproved).slice(0, 3).map(comm => (
                      <div key={comm.id} className="bg-stone-50 dark:bg-zinc-950 p-4 border border-stone-100 dark:border-zinc-850 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="space-y-1 max-w-lg">
                          <p className="text-xs text-stone-400">
                            By <strong className="text-stone-750 dark:text-zinc-300">{comm.authorName}</strong> ({comm.authorEmail}) on Poem ID: <strong>{comm.poemId}</strong>
                          </p>
                          <p className="text-sm font-serif italic text-stone-700 dark:text-zinc-400 leading-relaxed font-serif">
                            "{comm.content}"
                          </p>
                        </div>
                        <div className="flex space-x-2 shrink-0">
                          <button
                            onClick={() => handleApproveComment(comm.id)}
                            className="bg-stone-950 hover:bg-stone-800 text-stone-50 dark:bg-stone-100 dark:text-stone-950 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comm.id)}
                            className="text-xs font-semibold hover:bg-red-500/10 hover:text-red-500 border border-stone-200 dark:border-zinc-855 px-2.5 py-1.5 rounded-lg"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Site Settings Spotlight */}
              <div className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-4">
                <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50 flex items-center space-x-2">
                  <Settings className="w-4.5 h-4.5 text-sage mr-1" />
                  <span>Site Configuration</span>
                </h3>
                <p className="text-xs text-stone-400 font-serif leading-relaxed">
                  Manage external configurations, redirect links, and curator preferences.
                </p>
                <div className="space-y-4 pt-2 max-w-xl">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono">
                      Templome Footer Hyperlink Destination
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="url"
                        placeholder="e.g., https://templome.com"
                        className="flex-1 text-xs bg-stone-50 dark:bg-zinc-950 px-3.5 py-2.5 border border-stone-200/80 dark:border-zinc-800 rounded-xl text-stone-900 dark:text-stone-50 focus:ring-1 focus:ring-sage/40 transition-all select-all font-mono"
                        value={templomeLinkInput}
                        onChange={(e) => setTemplomeLinkInput(e.target.value)}
                      />
                      <button
                        onClick={handleSaveSettings}
                        disabled={submittingAction}
                        className="bg-stone-950 hover:bg-stone-800 text-stone-50 dark:bg-stone-100 dark:text-stone-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Link</span>
                      </button>
                    </div>
                    {settingsSaveStatus && (
                      <p className="text-xs text-sage dark:text-linen font-medium animate-enter">
                        &bull; {settingsSaveStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}


          {/* =======================================================
              TAB: POEMS CRUD
             ======================================================= */}
          {activeTab === 'poems' && (
            <div className="space-y-6">
              
              {poemForm === null ? (
                // 1. Poems List view
                <div className="space-y-6">
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">Poetry Archives catalog</h3>
                      <p className="text-xs text-stone-400">Review status, alter coordinates, or publish new compositions.</p>
                    </div>
                    
                    <button
                      onClick={handleNewPoemTrigger}
                      className="px-4 py-2 bg-stone-950 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-950 text-stone-50 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer shadow-sm focus:outline-none"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Print New Poem</span>
                    </button>
                  </div>

                  {poems.length === 0 ? (
                    <p className="text-sm text-stone-400 text-center py-10">No poems compiled in the archives yet. Go ahead and print one!</p>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs text-stone-600 dark:text-zinc-400">
                        <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-200/50 dark:border-zinc-850 font-mono uppercase text-[10px] tracking-wider text-stone-400 font-bold">
                          <tr>
                            <th className="p-4 pl-6">Title / Poet</th>
                            <th className="p-4">Theme / Track</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-zinc-850">
                          {poems.map((poem) => (
                            <tr key={poem.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-950/20">
                              <td className="p-4 pl-6 space-y-0.5 max-w-[200px] truncate">
                                <strong className="text-sm tracking-tight text-stone-900 dark:text-stone-200 block truncate">{poem.title}</strong>
                                <span className="text-[10px] text-stone-400 block">By {poem.authorName}</span>
                              </td>
                              <td className="p-4">
                                <span className="block font-medium text-stone-700 dark:text-zinc-300">
                                  {categories.find(c => c.id === poem.categoryId)?.name || 'General theme'}
                                </span>
                                {poem.seriesId && (
                                  <span className="text-[10px] text-[#d97706] font-mono tracking-wide uppercase">
                                    Track: {seriesList.find(s => s.id === poem.seriesId)?.name} (Ch. {poem.seriesOrder})
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                                  poem.status === 'published' 
                                    ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20' 
                                    : 'bg-stone-300/10 text-stone-450 border border-stone-300/20'
                                }`}>
                                  {poem.status}
                                </span>
                              </td>
                              <td className="p-4 pr-6 text-right space-x-2">
                                <button
                                  onClick={() => handleEditPoemTrigger(poem)}
                                  className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 rounded"
                                  title="Edit properties"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePoem(poem.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-500 rounded"
                                  title="Delete Permanent"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              ) : (
                
                // 2. Poem Create/Edit Form View
                <div className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl p-6 sm:p-10 shadow-md space-y-6">
                  
                  <div className="flex justify-between items-center pb-4 border-b border-stone-100 dark:border-zinc-850">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
                        {poemForm.id ? 'Revise Composition' : 'Print New Composition'}
                      </h3>
                      <p className="text-xs text-stone-400">Complete draft components to publish onto the visual ledger.</p>
                    </div>
                    <button
                      onClick={() => setPoemForm(null)}
                      className="p-1.5 bg-stone-50 dark:bg-zinc-950 rounded-full hover:bg-stone-100 text-stone-400 focus:outline-none"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <form onSubmit={handleSavePoem} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                          Poem Title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="The Autumn Requiem"
                          value={poemForm.title || ''}
                          onChange={(e) => handleSlugAutogeneration(e.target.value)}
                          className="w-full px-4 py-3 bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-stone-50 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-450"
                        />
                      </div>

                      {/* Slug */}
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                          Reference Slug (URL key)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="autumn-requiem"
                          value={poemForm.slug || ''}
                          onChange={(e) => setPoemForm(prev => prev ? { ...prev, slug: e.target.value } : null)}
                          className="w-full px-4 py-3 bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-stone-50 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-450"
                        />
                      </div>

                      {/* Poet Name */}
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                          Author / Poet
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Evelyn Sterling"
                          value={poemForm.authorName || ''}
                          onChange={(e) => setPoemForm(prev => prev ? { ...prev, authorName: e.target.value } : null)}
                          className="w-full px-4 py-3 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-410"
                        />
                      </div>

                      {/* Cover Image */}
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                          Cover Image URL
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="https://images.unsplash.com/... or bucket/path.jpg"
                          value={poemForm.coverImage || ''}
                          onChange={(e) => setPoemForm(prev => prev ? { ...prev, coverImage: e.target.value } : null)}
                          className="w-full px-4 py-3 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none"
                        />
                        {poemForm.coverImage && (
                          <div className="mt-3 h-36 rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-800">
                            <CoverImage
                              src={poemForm.coverImage}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Theme Category Link */}
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                          Thematic Category link (Optional)
                        </label>
                        <select
                          value={poemForm.categoryId || ''}
                          onChange={(e) => setPoemForm(prev => prev ? { ...prev, categoryId: e.target.value } : null)}
                          className="w-full px-4 py-3 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="">No Theme (General)</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Series Link */}
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                          Series Track linkage (Optional)
                        </label>
                        <select
                          value={poemForm.seriesId || ''}
                          onChange={(e) => setPoemForm(prev => prev ? { ...prev, seriesId: e.target.value || null } : null)}
                          className="w-full px-4 py-3 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="">No Series Linkage (Independent Verse)</option>
                          {seriesList.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Series Order (Sequential chapter number) */}
                      {poemForm.seriesId && (
                        <div>
                          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                            Series chapter/Sequence Order (Number)
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="1"
                            value={poemForm.seriesOrder || ''}
                            onChange={(e) => setPoemForm(prev => prev ? { ...prev, seriesOrder: parseInt(e.target.value, 10) || null } : null)}
                            className="w-full px-4 py-3 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Status */}
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                          Publish Status
                        </label>
                        <div className="flex space-x-4 pt-2">
                          <label className="flex items-center space-x-2 text-sm text-stone-600 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="pub-status"
                              checked={poemForm.status === 'draft'}
                              onChange={() => setPoemForm(prev => prev ? { ...prev, status: 'draft' } : null)}
                              className="form-radio text-stone-900 focus:ring-stone-400"
                            />
                            <span>Draft (Invisible to readers)</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-stone-600 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="pub-status"
                              checked={poemForm.status === 'published'}
                              onChange={() => setPoemForm(prev => prev ? { ...prev, status: 'published' } : null)}
                              className="form-radio text-stone-900 focus:ring-stone-400"
                            />
                            <span>Published (Instantly Viewable)</span>
                          </label>
                        </div>
                      </div>

                    </div>

                    {/* Content Markdown text */}
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                        Poetic Verses Content
                      </label>
                      <textarea
                        required
                        rows={10}
                        placeholder="Type or paste the poem stanzas here... Use single spaces for lines, double spaces for stanzas."
                        value={poemForm.content || ''}
                        onChange={(e) => setPoemForm(prev => prev ? { ...prev, content: e.target.value } : null)}
                        className="w-full px-4 py-3 bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-450 resize-y font-serif italic text-base leading-relaxed tracking-wider"
                      />
                    </div>

                    {/* Submit Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-stone-50 dark:border-zinc-850">
                      <button
                        type="button"
                        onClick={() => setPoemForm(null)}
                        className="px-5 py-2.5 border border-stone-200 dark:border-zinc-800 text-stone-600 hover:bg-stone-50 dark:hover:bg-zinc-950 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        disabled={submittingAction}
                        className="px-6 py-2.5 bg-stone-950 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-950 text-stone-50 text-sm font-semibold rounded-lg flex items-center space-x-1 shadow-sm transition-all focus:outline-none disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{submittingAction ? 'Drafting Ledger...' : 'Commit Manuscript'}</span>
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </div>
          )}


          {/* =======================================================
              TAB: THEMES & SERIES
             ======================================================= */}
          {activeTab === 'collections' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column: Manage Categories */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">Thematic Categories</h3>
                  <p className="text-xs text-stone-400">Classify poems under psychological or stylistic parameters.</p>
                </div>

                <form onSubmit={handleCreateCategory} className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-bold text-stone-400 mb-1">Theme Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Gothic Elegies"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-850 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-bold text-stone-400 mb-1">Brief Description</label>
                    <textarea
                      rows={2}
                      placeholder="Verses addressing Victorian decay, shadow-casting and unretrieved letters."
                      value={categoryDesc}
                      onChange={(e) => setCategoryDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-850 rounded-lg text-xs focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="w-full py-2 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-950 hover:opacity-90 font-semibold rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Theme Category</span>
                  </button>
                </form>

                {/* List categories */}
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="bg-white dark:bg-zinc-900 p-4 border border-stone-100 dark:border-zinc-850 rounded-xl flex justify-between items-center">
                      <div>
                        <strong className="block text-sm text-stone-850 dark:text-zinc-200">{cat.name}</strong>
                        <span className="text-[10px] text-stone-400 italic font-serif line-clamp-1">{cat.description}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded transition-colors shrink-0 ml-4 pointer-events-auto"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

              </div>

              {/* Right Column: Manage Series */}
              <div className="lg:col-span-7 space-y-6">
                
                {seriesForm === null ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">Narrative Verse Series</h3>
                        <p className="text-xs text-stone-400">Chapters designed for sequential chronological reading.</p>
                      </div>
                      
                      <button
                        onClick={handleNewSeriesTrigger}
                        className="px-3 py-1.5 bg-stone-950 text-stone-50 dark:bg-stone-100 dark:text-stone-950 font-semibold rounded-lg text-xs flex items-center space-x-1 cursor-pointer focus:outline-none shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Series</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {seriesList.map(s => (
                        <div key={s.id} className="bg-white dark:bg-zinc-900 p-5 border border-stone-200/50 dark:border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex items-center space-x-4 min-w-0">
                            <div className="w-12 h-12 rounded overflow-hidden shadow-sm shrink-0">
                              <img src={s.coverImage} alt={s.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <strong className="block text-sm text-stone-900 dark:text-stone-200 truncate">{s.name}</strong>
                              <p className="text-[10.5px] text-stone-450 dark:text-zinc-500 line-clamp-2 italic font-serif leading-normal mt-0.5">{s.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 shrink-0">
                            <button
                              onClick={() => setSeriesForm(s)}
                              className="p-1.5 text-stone-400 hover:text-stone-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSeries(s.id)}
                              className="p-1.5 text-stone-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  
                  // Series form editor
                  <form onSubmit={handleSaveSeries} className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-4 animate-enter">
                    <h3 className="font-display font-semibold text-base text-stone-950 dark:text-zinc-50 pb-2 border-b border-stone-50">
                      {seriesForm.id ? 'Refise Series Track' : 'Establish Series Track'}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase font-bold text-stone-400 mb-1">Series Title</label>
                        <input
                          type="text"
                          required
                          placeholder="Chamber of Echoes"
                          value={seriesForm.name || ''}
                          onChange={(e) => {
                            const genSlug = e.target.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
                            setSeriesForm(prev => prev ? { ...prev, name: e.target.value, slug: genSlug } : null);
                          }}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase font-bold text-stone-400 mb-1">Reference Slug URL</label>
                        <input
                          type="text"
                          required
                          placeholder="chamber-of-echoes"
                          value={seriesForm.slug || ''}
                          onChange={(e) => setSeriesForm(prev => prev ? { ...prev, slug: e.target.value } : null)}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-805 rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold text-stone-400 mb-1">Cover Image Illustration URL</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={seriesForm.coverImage || ''}
                        onChange={(e) => setSeriesForm(prev => prev ? { ...prev, coverImage: e.target.value } : null)}
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-805 rounded-lg text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold text-stone-400 mb-1">Lyrical Prospectus (Description)</label>
                      <textarea
                        rows={3}
                        placeholder="A study on memories left on water..."
                        value={seriesForm.description || ''}
                        onChange={(e) => setSeriesForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 text-stone-950 dark:text-stone-50 border border-stone-200 dark:border-zinc-805 rounded-lg text-xs focus:outline-none resize-none font-serif italic text-stone-800"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-stone-50">
                      <button
                        type="button"
                        onClick={() => setSeriesForm(null)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-605 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingAction}
                        className="px-5 py-2 bg-stone-950 hover:bg-stone-850 dark:bg-stone-100 dark:text-stone-950 font-semibold rounded-lg text-xs disabled:opacity-50"
                      >
                        Save Series Track
                      </button>
                    </div>
                  </form>
                )}

              </div>

            </div>
          )}


          {/* =======================================================
              TAB: COMMENT MODERATION CONTROL
             ======================================================= */}
          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">Reviews &amp; Contemplations Ledger</h3>
                <p className="text-xs text-stone-400">Moderate entries checking to avoid advertisement or vulgar logs in readers corridors.</p>
              </div>

              {comments.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-10">No thoughts submitted by readers yet.</p>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs text-stone-600 dark:text-zinc-450">
                    <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-100 dark:border-zinc-850 font-mono uppercase text-[10px] tracking-wider text-stone-400 font-bold">
                      <tr>
                        <th className="p-4 pl-6">Reader &amp; Info</th>
                        <th className="p-4">Submission Text Message</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-zinc-850">
                      {comments.map((comm) => (
                        <tr key={comm.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-950/20">
                          <td className="p-4 pl-6 space-y-0.5">
                            <strong className="block text-sm text-stone-900 dark:text-stone-200">{comm.authorName}</strong>
                            <span className="block text-[10px] text-stone-400">{comm.authorEmail}</span>
                            <span className="block text-[9px] text-[#2d3748] dark:text-[#a0aec0] font-mono font-medium">Poem Ref: {comm.poemId}</span>
                          </td>
                          <td className="p-4 max-w-sm">
                            <p className="text-sm font-serif italic text-stone-700 dark:text-zinc-350 pr-4 line-clamp-3">
                              "{comm.content}"
                            </p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              comm.isApproved 
                                ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20' 
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse'
                            }`}>
                              {comm.isApproved ? 'Approved' : 'Pending Review'}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right space-x-2 shrink-0">
                            {!comm.isApproved && (
                              <button
                                onClick={() => handleApproveComment(comm.id)}
                                className="px-2 py-1 bg-stone-950 hover:bg-stone-850 text-stone-50 dark:bg-stone-100 dark:text-stone-950 text-[10px] font-mono rounded"
                                title="Approve"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(comm.id)}
                              className="p-1.5 text-stone-400 hover:text-red-500 rounded inline-flex"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}


          {/* =======================================================
              TAB: SUBSCRIBERS
             ======================================================= */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">Newsletter subscriber directory</h3>
                <p className="text-xs text-stone-400 font-serif">A complete roster of accounts registered to receive the Friday verse ledger.</p>
              </div>

              {subscribers.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-10">No literary subscribers registered in the directory yet.</p>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm max-w-2xl">
                  <table className="w-full text-left text-xs text-stone-600 dark:text-zinc-450">
                    <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-100 dark:border-zinc-850 font-mono uppercase text-[10px] tracking-wider text-stone-400 font-bold">
                      <tr>
                        <th className="p-4 pl-6">Subscriber Email</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-zinc-850">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-950/20">
                          <td className="p-4 pl-6">
                            <strong className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-55">{sub.email}</strong>
                          </td>
                          <td className="p-4">
                            <span>{new Date(sub.createdAt).toLocaleString()}</span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="p-1.5 text-stone-450 hover:text-red-500 rounded"
                              title="Remove subscriber account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
