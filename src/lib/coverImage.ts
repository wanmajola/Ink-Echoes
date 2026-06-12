/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabaseUrl } from './supabaseEnv';

export const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=640&auto=format&fit=crop';

/** Normalize DB cover_image / coverImage values into a browser-loadable URL. */
export function resolveCoverImageUrl(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';

  const value = raw.trim();

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    // Automatically convert Google Drive viewer links to direct image links
    if (value.includes('drive.google.com/')) {
      const match = value.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    return value;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  if (value.startsWith('/') && supabaseUrl) {
    return `${supabaseUrl}${value}`;
  }

  if (supabaseUrl && value.includes('/storage/v1/object/public/')) {
    return value.startsWith('http') ? value : `https://${value.replace(/^\/+/, '')}`;
  }

  if (supabaseUrl) {
    const path = value.replace(/^\/+/, '');
    return `${supabaseUrl}/storage/v1/object/public/${path}`;
  }

  return value;
}

export function getCoverImageSrc(raw: string | null | undefined): string {
  return resolveCoverImageUrl(raw) || DEFAULT_COVER_IMAGE;
}
