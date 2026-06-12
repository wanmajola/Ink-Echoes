/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Category, Series, Poem, Comment, Like, NewsletterSubscriber, DashboardStats, ContactMessage } from '../types';
import { resolveCoverImageUrl } from './coverImage';
import { mapPoemFromRow } from './mapPoem';
import { isSupabaseConfigured as checkSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './supabaseEnv';

export const isSupabaseConfigured = checkSupabaseConfigured();

export const supabase = (() => {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl!, supabaseAnonKey!);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
})();

// ==========================================
// SEED DATA FOR LOCAL FALLBACK
// ==========================================

const SEED_CATEGORIES: Category[] = [
  { id: '1', name: 'Life', slug: 'life', description: 'Reflections on human existence and lived experiences.' },
  { id: '2', name: 'Love', slug: 'love', description: 'Expressions of deep affection, connection, and relationship.' },
  { id: '3', name: 'Philosophy', slug: 'philosophy', description: 'Contemplating truth, mind, wisdom, and purpose.' }
];

const SEED_SERIES: Series[] = [];

const SEED_POEMS: Poem[] = [
  {
    id: 'measure-of-men',
    title: 'The Measure of Men',
    slug: 'the-measure-of-men',
    content: `Not, how did he die, but how did he live?
Not, what did he gain, but what did he give?
These are the units to measure the worth
Of a man as a man, regardless of birth.

Not, what was his station, but had he a heart?
And how did he play his God-given part?
Was he ever ready with word of good cheer,
To bring back a smile, to banish a tear?

Not, what was his church, nor what was his creed?
But had he befriended those really in need?
Not, what did the sketch in the newspaper say?
But how many were sorry when he passed away?`,
    authorName: 'Spencer Michael Free',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5043?q=80&w=640&auto=format&fit=crop',
    categoryId: '1',
    seriesId: null,
    seriesOrder: null,
    status: 'published',
    likesCount: 15,
    createdAt: new Date().toISOString()
  }
];

const SEED_COMMENTS: Comment[] = [];

const SEED_NEWSLETTER: NewsletterSubscriber[] = [];

// LocalStorage helpers to simulate database operations
const getLocalData = <T>(key: string, defaultVal: T[]): T[] => {
  const data = localStorage.getItem(`ink_echoes_${key}`);
  if (!data) {
    localStorage.setItem(`ink_echoes_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  
  // Clean up any old static poems cached in client's localStorage
  if (key === 'poems') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((p: any) => 
          p && 
          p.title !== 'Siren of the Harbour' &&
          p.title !== 'Fragments of the Echo' &&
          p.title !== 'Clockwork of the Mind' &&
          p.title !== 'Solitude of the Pine' &&
          p.title !== 'The Starlight Sonata'
        );
        if (cleaned.length === 0) {
          localStorage.setItem(`ink_echoes_${key}`, JSON.stringify(defaultVal));
          return defaultVal;
        }
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(`ink_echoes_${key}`, JSON.stringify(cleaned));
          return cleaned as unknown as T[];
        }
      }
    } catch (_) {
      // fallback
    }
  }

  return JSON.parse(data);
};

const triggerDBChange = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ink-echoes-db-change'));
  }
};

const setLocalData = <T>(key: string, value: T[]): void => {
  localStorage.setItem(`ink_echoes_${key}`, JSON.stringify(value));
  triggerDBChange();
};

// State wrappers
const categoriesStore = () => getLocalData<Category>('categories', SEED_CATEGORIES);
const seriesStore = () => getLocalData<Series>('series', SEED_SERIES);
const poemsStore = () => getLocalData<Poem>('poems', SEED_POEMS);
const commentsStore = () => getLocalData<Comment>('comments', SEED_COMMENTS);
const newsletterStore = () => getLocalData<NewsletterSubscriber>('newsletter', SEED_NEWSLETTER);
const likesStore = () => getLocalData<Like>('likes', []);

// Mock Admin user login credentials for Local storage preview
// Standard authentication uses Supabase when configured, or bypass auth locally for developer testing
const LOCAL_ADMIN_EMAIL = 'admin@inkandechoes.com';
const LOCAL_ADMIN_PASS = 'admin123';

const getLocalSession = () => {
  const session = localStorage.getItem('ink_echoes_admin_session');
  return session ? JSON.parse(session) : null;
};

// ==========================================
// CENTRAL DATABASE SERVICE UNIFIER
// ==========================================

export const db = {
  // ==================== AUTH SERVICE ====================
  auth: {
    async login(email: string, password: string): Promise<{ success: boolean; user: any; error?: string }> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, user: null, error: error.message };
        return { success: true, user: data.user };
      } else {
        if (email.trim().toLowerCase() === LOCAL_ADMIN_EMAIL && password === LOCAL_ADMIN_PASS) {
          const userObj = { email: LOCAL_ADMIN_EMAIL, id: 'admin-local', user_metadata: { full_name: 'Lead Curator' } };
          localStorage.setItem('ink_echoes_admin_session', JSON.stringify(userObj));
          return { success: true, user: userObj };
        }
        return { success: false, user: null, error: 'Invalid admin credentials. Use admin@inkandechoes.com and admin123' };
      }
    },

    async getCurrentUser(): Promise<any> {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
      } else {
        return getLocalSession();
      }
    },

    async logout(): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem('ink_echoes_admin_session');
      }
    }
  },

  // ==================== CATEGORIES SERVICE ====================
  categories: {
    async getAll(): Promise<Category[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        return (data || []).map(c => ({
          id: String(c.id),
          name: c.name,
          slug: c.slug,
          description: c.description || ''
        }));
      } else {
        return categoriesStore();
      }
    },

    async create(category: Omit<Category, 'id'>): Promise<Category> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('categories').insert([category]).select().single();
        if (error) throw error;
        return {
          id: String(data.id),
          name: data.name,
          slug: data.slug,
          description: data.description || ''
        };
      } else {
        const categories = categoriesStore();
        const newCat: Category = { ...category, id: `cat-${Date.now()}` };
        categories.push(newCat);
        setLocalData('categories', categories);
        return newCat;
      }
    },

    async update(category: Category): Promise<Category> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('categories').update({
          name: category.name,
          slug: category.slug,
          description: category.description
        }).eq('id', category.id).select().single();
        if (error) throw error;
        return {
          id: String(data.id),
          name: data.name,
          slug: data.slug,
          description: data.description || ''
        };
      } else {
        const categories = categoriesStore();
        const index = categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
          categories[index] = category;
          setLocalData('categories', categories);
        }
        return category;
      }
    },

    async delete(id: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
      } else {
        const categories = categoriesStore();
        const updated = categories.filter(c => c.id !== id);
        setLocalData('categories', updated);
      }
    }
  },

  // ==================== SERIES SERVICE ====================
  series: {
    async getAll(): Promise<Series[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('series').select('*').order('name');
        if (error) throw error;
        return data.map(s => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          coverImage: s.cover_image
        })) as Series[];
      } else {
        return seriesStore();
      }
    },

    async create(series: Omit<Series, 'id'>): Promise<Series> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('series').insert([{
          name: series.name,
          slug: series.slug,
          description: series.description,
          cover_image: series.coverImage
        }]).select().single();
        if (error) throw error;
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          coverImage: data.cover_image
        } as Series;
      } else {
        const seriesList = seriesStore();
        const newS: Series = { ...series, id: `series-${Date.now()}` };
        seriesList.push(newS);
        setLocalData('series', seriesList);
        return newS;
      }
    },

    async update(series: Series): Promise<Series> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('series').update({
          name: series.name,
          slug: series.slug,
          description: series.description,
          cover_image: series.coverImage
        }).eq('id', series.id).select().single();
        if (error) throw error;
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          coverImage: data.cover_image
        } as Series;
      } else {
        const seriesList = seriesStore();
        const index = seriesList.findIndex(s => s.id === series.id);
        if (index !== -1) {
          seriesList[index] = series;
          setLocalData('series', seriesList);
        }
        return series;
      }
    },

    async delete(id: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('series').delete().eq('id', id);
        if (error) throw error;
      } else {
        const seriesList = seriesStore();
        const updated = seriesList.filter(s => s.id !== id);
        setLocalData('series', updated);
      }
    }
  },

  // ==================== POEMS SERVICE ====================
  poems: {
    async getAll(filters?: { status?: 'draft' | 'published' | 'all'; categoryId?: string; seriesId?: string | null; search?: string }): Promise<Poem[]> {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('poems').select('*').order('created_at', { ascending: false });
        
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        } else if (!filters?.status) {
          query = query.eq('status', 'published');
        }
        
        if (filters?.categoryId) {
          query = query.eq('category_id', filters.categoryId);
        }
        
        if (filters?.seriesId !== undefined) {
          if (filters.seriesId === null) {
            query = query.is('series_id', null);
          } else {
            query = query.eq('series_id', filters.seriesId);
          }
        }
        
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,author_name.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        const mapped = data.map((p) => mapPoemFromRow(p));

        if (mapped.length === 0) {
          // If the remote DB is empty, default to our high-quality seed poems
          return SEED_POEMS;
        }
        return mapped;
      } else {
        let poems = poemsStore();
        
        // Filter by status
        if (filters?.status && filters.status !== 'all') {
          poems = poems.filter(p => p.status === filters.status);
        } else if (!filters?.status) {
          poems = poems.filter(p => p.status === 'published');
        }
        
        // Filter by category
        if (filters?.categoryId) {
          poems = poems.filter(p => p.categoryId === filters.categoryId);
        }
        
        // Filter by series
        if (filters?.seriesId !== undefined) {
          poems = poems.filter(p => p.seriesId === filters.seriesId);
        }
        
        // Filter by search
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          poems = poems.filter(p => 
            p.title.toLowerCase().includes(s) || 
            p.content.toLowerCase().includes(s) || 
            p.authorName.toLowerCase().includes(s)
          );
        }

        // Sort descending
        return poems.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },

    async getBySlug(slug: string): Promise<Poem | null> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('poems').select('*').eq('slug', slug).single();
        if (error) {
          // Fallback to local high-quality seed poems
          const localMatch = SEED_POEMS.find(p => p.slug === slug);
          return localMatch || null;
        }
        return mapPoemFromRow(data);
      } else {
        const poems = poemsStore();
        return poems.find(p => p.slug === slug) || null;
      }
    },

    async getById(id: string): Promise<Poem | null> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('poems').select('*').eq('id', id).single();
        if (error) {
          // Fallback to local high-quality seed poems
          const localMatch = SEED_POEMS.find(p => p.id === id);
          return localMatch || null;
        }
        return mapPoemFromRow(data);
      } else {
        const poems = poemsStore();
        return poems.find(p => p.id === id) || null;
      }
    },

    async create(poem: Omit<Poem, 'id' | 'likesCount' | 'createdAt'>): Promise<Poem> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('poems').insert([{
          title: poem.title,
          slug: poem.slug,
          content: poem.content,
          author_name: poem.authorName,
          cover_image: resolveCoverImageUrl(poem.coverImage) || poem.coverImage || null,
          category_id: poem.categoryId || null,
          series_id: poem.seriesId || null,
          series_order: poem.seriesOrder,
          status: poem.status,
          published: poem.status === 'published',
          likes_count: 0
        }]).select().single();
        if (error) throw error;
        if (!data) throw new Error('Poem could not be created. Check admin permissions.');
        return mapPoemFromRow(data);
      } else {
        const poems = poemsStore();
        const newPoem: Poem = {
          ...poem,
          id: `poem-${Date.now()}`,
          likesCount: 0,
          createdAt: new Date().toISOString()
        };
        poems.push(newPoem);
        setLocalData('poems', poems);
        return newPoem;
      }
    },

    async update(poem: Poem): Promise<Poem> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('poems').update({
          title: poem.title,
          slug: poem.slug,
          content: poem.content,
          author_name: poem.authorName,
          cover_image: resolveCoverImageUrl(poem.coverImage) || poem.coverImage || null,
          category_id: poem.categoryId || null,
          series_id: poem.seriesId || null,
          series_order: poem.seriesOrder,
          status: poem.status,
          published: poem.status === 'published'
        }).eq('id', poem.id).select().single();
        if (error) throw error;
        if (!data) throw new Error('Poem could not be updated. Sign in as admin to save changes.');
        return mapPoemFromRow(data);
      } else {
        const poems = poemsStore();
        const index = poems.findIndex(p => p.id === poem.id);
        if (index !== -1) {
          poems[index] = poem;
          setLocalData('poems', poems);
        }
        return poem;
      }
    },

    async delete(id: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('poems').delete().eq('id', id);
        if (error) throw error;
      } else {
        const poems = poemsStore();
        const updated = poems.filter(p => p.id !== id);
        setLocalData('poems', updated);
      }
    }
  },

  // ==================== COMMENTS SERVICE ====================
  comments: {
    async getByPoemId(poemId: string, onlyApproved: boolean = true): Promise<Comment[]> {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('comments').select('*').eq('poem_id', poemId).order('created_at', { ascending: false });
        if (onlyApproved) {
          query = query.eq('is_approved', true);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(c => ({
          id: c.id,
          poemId: c.poem_id,
          authorName: c.author_name,
          authorEmail: c.author_email,
          content: c.content,
          isApproved: c.is_approved,
          createdAt: c.created_at
        })) as Comment[];
      } else {
        let comments = commentsStore().filter(c => c.poemId === poemId);
        if (onlyApproved) {
          comments = comments.filter(c => c.isApproved);
        }
        return comments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },

    async getAllComments(): Promise<Comment[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(c => ({
          id: c.id,
          poemId: c.poem_id,
          authorName: c.author_name,
          authorEmail: c.author_email,
          content: c.content,
          isApproved: c.is_approved,
          createdAt: c.created_at
        })) as Comment[];
      } else {
        return commentsStore().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },

    async add(comment: Omit<Comment, 'id' | 'isApproved' | 'createdAt'>): Promise<Comment> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('comments').insert([{
          poem_id: comment.poemId,
          author_name: comment.authorName,
          author_email: comment.authorEmail,
          content: comment.content,
          is_approved: false // Default to unapproved for moderation
        }]).select().single();
        if (error) throw error;
        return {
          id: data.id,
          poemId: data.poem_id,
          authorName: data.author_name,
          authorEmail: data.author_email,
          content: data.content,
          isApproved: data.is_approved,
          createdAt: data.created_at
        } as Comment;
      } else {
        const comments = commentsStore();
        const newComm: Comment = {
          ...comment,
          id: `comm-${Date.now()}`,
          isApproved: false, // Default moderation required
          createdAt: new Date().toISOString()
        };
        comments.push(newComm);
        setLocalData('comments', comments);
        return newComm;
      }
    },

    async approve(id: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('comments').update({ is_approved: true }).eq('id', id);
        if (error) throw error;
      } else {
        const comments = commentsStore();
        const index = comments.findIndex(c => c.id === id);
        if (index !== -1) {
          comments[index].isApproved = true;
          setLocalData('comments', comments);
        }
      }
    },

    async delete(id: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('comments').delete().eq('id', id);
        if (error) throw error;
      } else {
        const comments = commentsStore();
        const updated = comments.filter(c => c.id !== id);
        setLocalData('comments', updated);
      }
    }
  },

  // ==================== LIKES SERVICE ====================
  likes: {
    async hasLiked(poemId: string, userId: string = 'guest-user'): Promise<boolean> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('likes').select('*').eq('poem_id', poemId).eq('user_id', userId);
        if (error) return false;
        return data.length > 0;
      } else {
        const likes = likesStore();
        return likes.some(l => l.poemId === poemId && l.userId === userId);
      }
    },

    async toggleLike(poemId: string, userId: string = 'guest-user'): Promise<{ liked: boolean; newCount: number }> {
      if (isSupabaseConfigured && supabase) {
        // Toggle in Supabase via RPC or client check
        const { data: existing } = await supabase.from('likes').select('id').eq('poem_id', poemId).eq('user_id', userId);
        const alreadyLiked = existing && existing.length > 0;
        
        let liked = false;
        if (alreadyLiked) {
          await supabase.from('likes').delete().eq('poem_id', poemId).eq('user_id', userId);
        } else {
          await supabase.from('likes').insert([{ poem_id: poemId, user_id: userId }]);
          liked = true;
        }

        // Fetch new likes count (now updated automatically by Supabase trigger)
        const { data: poem } = await supabase.from('poems').select('likes_count').eq('id', poemId).single();
        const newCount = poem?.likes_count || 0;
        
        return { liked, newCount };
      } else {
        const likes = likesStore();
        const index = likes.findIndex(l => l.poemId === poemId && l.userId === userId);
        const poems = poemsStore();
        const pIndex = poems.findIndex(p => p.id === poemId);
        
        let liked = false;
        if (index !== -1) {
          // Unlike
          likes.splice(index, 1);
          if (pIndex !== -1) {
            poems[pIndex].likesCount = Math.max(0, poems[pIndex].likesCount - 1);
          }
        } else {
          // Like
          likes.push({ id: `like-${Date.now()}`, poemId, userId, createdAt: new Date().toISOString() });
          liked = true;
          if (pIndex !== -1) {
            poems[pIndex].likesCount += 1;
          }
        }

        setLocalData('likes', likes);
        setLocalData('poems', poems);

        const newCount = pIndex !== -1 ? poems[pIndex].likesCount : 0;
        return { liked, newCount };
      }
    }
  },

  // ==================== NEWSLETTER SERVICE ====================
  newsletter: {
    async subscribe(email: string): Promise<{ success: boolean; message: string }> {
      const emailTrim = email.trim().toLowerCase();
      if (!emailTrim || !emailTrim.includes('@')) {
        return { success: false, message: 'Please enter a valid email address.' };
      }

      if (isSupabaseConfigured && supabase) {
        const { data: existing } = await supabase.from('newsletter').select('id').eq('email', emailTrim);
        if (existing && existing.length > 0) {
          return { success: true, message: 'You are already subscribed to our newsletter!' };
        }

        const { error } = await supabase.from('newsletter').insert([{ email: emailTrim }]);
        if (error) throw error;
        return { success: true, message: 'Thank you for subscribing to Ink & Echoes newsletters.' };
      } else {
        const subs = newsletterStore();
        if (subs.some(s => s.email === emailTrim)) {
          return { success: true, message: 'You are already subscribed to our newsletter!' };
        }

        subs.push({
          id: `sub-${Date.now()}`,
          email: emailTrim,
          createdAt: new Date().toISOString()
        });
        setLocalData('newsletter', subs);
        return { success: true, message: 'Thank you for subscribing to Ink & Echoes newsletters.' };
      }
    },

    async getAll(): Promise<NewsletterSubscriber[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('newsletter').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data as NewsletterSubscriber[];
      } else {
        return newsletterStore();
      }
    },

    async unsubscribe(id: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('newsletter').delete().eq('id', id);
        if (error) throw error;
      } else {
        const subs = newsletterStore();
        const updated = subs.filter(s => s.id !== id);
        setLocalData('newsletter', updated);
      }
    }
  },

  // ==================== STATS SERVICE ====================
  async getDashboardStats(): Promise<DashboardStats> {
    if (isSupabaseConfigured && supabase) {
      const [poems, comments, subs, likes, series, cats] = await Promise.all([
        supabase.from('poems').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('newsletter').select('id', { count: 'exact', head: true }),
        supabase.from('likes').select('id', { count: 'exact', head: true }),
        supabase.from('series').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true })
      ]);

      return {
        poemsCount: poems.count || 0,
        commentsCount: comments.count || 0,
        subscribersCount: subs.count || 0,
        likesCount: likes.count || 0,
        seriesCount: series.count || 0,
        categoriesCount: cats.count || 0
      };
    } else {
      const poems = poemsStore();
      const comments = commentsStore();
      const subscribers = newsletterStore();
      const likes = likesStore();
      const series = seriesStore();
      const categories = categoriesStore();

      return {
        poemsCount: poems.length,
        commentsCount: comments.length,
        subscribersCount: subscribers.length,
        likesCount: likes.length + poems.reduce((sum, p) => sum + (p.likesCount || 0), 0),
        seriesCount: series.length,
        categoriesCount: categories.length
      };
    }
  },

  // ==================== SETTINGS SERVICE ====================
  settings: {
    async getTemplomeLink(): Promise<string> {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.from('settings').select('value').eq('key', 'templome_link').single();
          if (!error && data) return data.value;
        } catch (_) {}
      }
      return localStorage.getItem('ink_echoes_setting_templome_link') || '';
    },

    async setTemplomeLink(link: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('settings').upsert({ key: 'templome_link', value: link, updated_at: new Date().toISOString() });
        } catch (_) {}
      }
      localStorage.setItem('ink_echoes_setting_templome_link', link);
      triggerDBChange();
    }
  },

  // ==================== CONTACT MESSAGES SERVICE ====================
  contact: {
    async submit(msg: Omit<ContactMessage, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> {
      // Create message in local storage or dynamic console logging to demonstrate fully functional submission
      const messages = getLocalData<ContactMessage>('contact_messages', []);
      const newMsg: ContactMessage = {
        ...msg,
        id: `msg-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      messages.push(newMsg);
      setLocalData('contact_messages', messages);
      return { success: true, message: 'Thank you! Your message has been sent successfully. We will get back to you shortly.' };
    },

    async getAll(): Promise<ContactMessage[]> {
      return getLocalData<ContactMessage>('contact_messages', []);
    },

    async delete(id: string): Promise<void> {
      const messages = getLocalData<ContactMessage>('contact_messages', []);
      const updated = messages.filter(m => m.id !== id);
      setLocalData('contact_messages', updated);
    }
  }
};
