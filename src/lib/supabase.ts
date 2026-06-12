/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Category, Poem, Comment } from '../types';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './supabaseEnv';

export const supabase = (() => {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
})();

// Helper to assert client presence
const getClient = () => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized or credentials are missing.');
  }
  return supabase;
};

// ==========================================================
// SUPABASE CRUD SERVICE LAYER
// ==========================================================

export const supabaseService = {
  // ==================== CATEGORIES CRUD ====================
  categories: {
    async getAll(): Promise<Category[]> {
      const client = getClient();
      const { data, error } = await client
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description || ''
      }));
    },

    async getById(id: string): Promise<Category | null> {
      const client = getClient();
      const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || ''
      };
    },

    async create(category: Omit<Category, 'id'>): Promise<Category> {
      const client = getClient();
      const { data, error } = await client
        .from('categories')
        .insert([{
          name: category.name,
          slug: category.slug,
          description: category.description
        }])
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || ''
      };
    },

    async update(id: string, category: Partial<Omit<Category, 'id'>>): Promise<Category> {
      const client = getClient();
      const { data, error } = await client
        .from('categories')
        .update({
          name: category.name,
          slug: category.slug,
          description: category.description
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || ''
      };
    },

    async delete(id: string): Promise<void> {
      const client = getClient();
      const { error } = await client
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // ==================== POEMS CRUD ====================
  poems: {
    async getAll(filters?: { status?: 'draft' | 'published'; categoryId?: string; seriesId?: string | null }): Promise<Poem[]> {
      const client = getClient();
      let query = client.from('poems').select('*').order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
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

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        content: p.content,
        authorName: p.author_name,
        coverImage: p.cover_image || '',
        categoryId: p.category_id || '',
        seriesId: p.series_id || null,
        seriesOrder: p.series_order || null,
        status: p.status,
        likesCount: p.likes_count || 0,
        createdAt: p.created_at
      }));
    },

    async getById(id: string): Promise<Poem | null> {
      const client = getClient();
      const { data, error } = await client
        .from('poems')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        authorName: data.author_name,
        coverImage: data.cover_image || '',
        categoryId: data.category_id || '',
        seriesId: data.series_id || null,
        seriesOrder: data.series_order || null,
        status: data.status,
        likesCount: data.likes_count || 0,
        createdAt: data.created_at
      };
    },

    async getBySlug(slug: string): Promise<Poem | null> {
      const client = getClient();
      const { data, error } = await client
        .from('poems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        authorName: data.author_name,
        coverImage: data.cover_image || '',
        categoryId: data.category_id || '',
        seriesId: data.series_id || null,
        seriesOrder: data.series_order || null,
        status: data.status,
        likesCount: data.likes_count || 0,
        createdAt: data.created_at
      };
    },

    async create(poem: Omit<Poem, 'id' | 'likesCount' | 'createdAt'>): Promise<Poem> {
      const client = getClient();
      const { data, error } = await client
        .from('poems')
        .insert([{
          title: poem.title,
          slug: poem.slug,
          content: poem.content,
          author_name: poem.authorName,
          cover_image: poem.coverImage,
          category_id: poem.categoryId || null,
          series_id: poem.seriesId || null,
          series_order: poem.seriesOrder || null,
          status: poem.status || 'draft',
          likes_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        authorName: data.author_name,
        coverImage: data.cover_image || '',
        categoryId: data.category_id || '',
        seriesId: data.series_id || null,
        seriesOrder: data.series_order || null,
        status: data.status,
        likesCount: data.likes_count || 0,
        createdAt: data.created_at
      };
    },

    async update(id: string, poem: Partial<Omit<Poem, 'id' | 'likesCount' | 'createdAt'>>): Promise<Poem> {
      const client = getClient();
      const updatePayload: any = {};
      if (poem.title !== undefined) updatePayload.title = poem.title;
      if (poem.slug !== undefined) updatePayload.slug = poem.slug;
      if (poem.content !== undefined) updatePayload.content = poem.content;
      if (poem.authorName !== undefined) updatePayload.author_name = poem.authorName;
      if (poem.coverImage !== undefined) updatePayload.cover_image = poem.coverImage;
      if (poem.categoryId !== undefined) updatePayload.category_id = poem.categoryId || null;
      if (poem.seriesId !== undefined) updatePayload.series_id = poem.seriesId || null;
      if (poem.seriesOrder !== undefined) updatePayload.series_order = poem.seriesOrder || null;
      if (poem.status !== undefined) updatePayload.status = poem.status;

      const { data, error } = await client
        .from('poems')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        authorName: data.author_name,
        coverImage: data.cover_image || '',
        categoryId: data.category_id || '',
        seriesId: data.series_id || null,
        seriesOrder: data.series_order || null,
        status: data.status,
        likesCount: data.likes_count || 0,
        createdAt: data.created_at
      };
    },

    async delete(id: string): Promise<void> {
      const client = getClient();
      const { error } = await client
        .from('poems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },

  // ==================== COMMENTS CRUD ====================
  comments: {
    async getByPoemId(poemId: string, onlyApproved: boolean = true): Promise<Comment[]> {
      const client = getClient();
      let query = client
        .from('comments')
        .select('*')
        .eq('poem_id', poemId)
        .order('created_at', { ascending: false });

      if (onlyApproved) {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        poemId: c.poem_id,
        authorName: c.author_name,
        authorEmail: c.author_email,
        content: c.content,
        isApproved: c.is_approved,
        createdAt: c.created_at
      }));
    },

    async getAll(): Promise<Comment[]> {
      const client = getClient();
      const { data, error } = await client
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        poemId: c.poem_id,
        authorName: c.author_name,
        authorEmail: c.author_email,
        content: c.content,
        isApproved: c.is_approved,
        createdAt: c.created_at
      }));
    },

    async create(comment: Omit<Comment, 'id' | 'isApproved' | 'createdAt'>): Promise<Comment> {
      const client = getClient();
      const { data, error } = await client
        .from('comments')
        .insert([{
          poem_id: comment.poemId,
          author_name: comment.authorName,
          author_email: comment.authorEmail,
          content: comment.content,
          is_approved: false // default unapproved
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        poemId: data.poem_id,
        authorName: data.author_name,
        authorEmail: data.author_email,
        content: data.content,
        isApproved: data.is_approved,
        createdAt: data.created_at
      };
    },

    async approve(id: string): Promise<Comment> {
      const client = getClient();
      const { data, error } = await client
        .from('comments')
        .update({ is_approved: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        poemId: data.poem_id,
        authorName: data.author_name,
        authorEmail: data.author_email,
        content: data.content,
        isApproved: data.is_approved,
        createdAt: data.created_at
      };
    },

    async delete(id: string): Promise<void> {
      const client = getClient();
      const { error } = await client
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  }
};
