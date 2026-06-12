/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Poem } from '../types';
import { resolveCoverImageUrl } from './coverImage';

type PoemRow = Record<string, unknown>;

export function mapPoemFromRow(row: PoemRow): Poem {
  const coverRaw =
    (row.cover_image as string | null | undefined) ??
    (row.coverImage as string | null | undefined);

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    content: String(row.content ?? ''),
    authorName: String(row.author_name ?? row.authorName ?? 'Spencer Michael Free'),
    coverImage: resolveCoverImageUrl(coverRaw),
    categoryId: row.category_id != null ? String(row.category_id) : '',
    seriesId: row.series_id != null ? String(row.series_id) : null,
    seriesOrder: (row.series_order as number | null) ?? null,
    status: (row.status as Poem['status']) || (row.published === true ? 'published' : 'draft'),
    likesCount: Number(row.likes_count ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}
