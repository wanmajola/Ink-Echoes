/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Series {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
}

export interface Poem {
  id: string;
  title: string;
  slug: string;
  content: string; // Poem lines separated by \n or HTML
  authorName: string;
  coverImage: string;
  categoryId: string;
  seriesId: string | null;
  seriesOrder: number | null;
  status: 'draft' | 'published';
  likesCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  poemId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Like {
  id: string;
  poemId: string;
  userId: string; // Or session ID / IP
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface DashboardStats {
  poemsCount: number;
  commentsCount: number;
  subscribersCount: number;
  likesCount: number;
  seriesCount: number;
  categoriesCount: number;
}
