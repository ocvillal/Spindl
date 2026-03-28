/**
 * Collaborative Filtering — Supabase data layer
 *
 * All reads/writes for the two CF tables:
 *   user_taste_vectors  — public-read taste profiles (no PII)
 *   item_signals        — public-read aggregate rating stats per item
 *
 * Keep this file free of React / UI imports.
 */

import { supabase } from './supabase';
import { TasteProfile } from './recommendations';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserTasteVector {
  user_id:       string;
  genre_vector:  Record<string, number>;
  artist_vector: Record<string, number>;
  era_vector:    Record<string, number>;
  signal_count:  number;
}

export interface ItemSignal {
  item_id:       string;
  avg_rating:    number;
  total_ratings: number;
  total_likes:   number;
}

// ─── Taste Vectors ───────────────────────────────────────────────────────────

/**
 * Upserts the current user's taste profile as a public taste vector.
 * Called fire-and-forget each time Discover loads.
 */
export async function upsertTasteVector(userId: string, profile: TasteProfile): Promise<void> {
  await supabase.from('user_taste_vectors').upsert(
    {
      user_id:       userId,
      genre_vector:  profile.genres,
      artist_vector: profile.artists,
      era_vector:    profile.eras,
      signal_count:  profile.signalCount,
      updated_at:    new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

/**
 * Fetches all users' taste vectors for user-user similarity computation.
 * Returns empty array on error — caller degrades gracefully.
 */
export async function fetchAllTasteVectors(): Promise<UserTasteVector[]> {
  const { data, error } = await supabase
    .from('user_taste_vectors')
    .select('user_id, genre_vector, artist_vector, era_vector, signal_count');
  if (error) {
    console.warn('[CF] fetchAllTasteVectors error:', error.message);
    return [];
  }
  return (data ?? []) as UserTasteVector[];
}

// ─── Item Signals ─────────────────────────────────────────────────────────────

/**
 * Fetches aggregate rating signals for a list of item IDs.
 * Returns a Map<item_id, ItemSignal> for O(1) lookups during scoring.
 */
export async function fetchItemSignals(itemIds: string[]): Promise<Map<string, ItemSignal>> {
  if (itemIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('item_signals')
    .select('item_id, avg_rating, total_ratings, total_likes')
    .in('item_id', itemIds);
  if (error) {
    console.warn('[CF] fetchItemSignals error:', error.message);
    return new Map();
  }
  const map = new Map<string, ItemSignal>();
  for (const row of data ?? []) {
    map.set(row.item_id, row as ItemSignal);
  }
  return map;
}

/**
 * Atomically upserts an item's aggregate rating stats via the DB RPC.
 * Called fire-and-forget after each album/song log in ratings.tsx.
 */
export async function upsertItemSignal(
  itemId: string,
  type: 'album' | 'song',
  itemData: object,
  rating: number,
  liked: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('upsert_item_signal', {
    p_item_id:   itemId,
    p_type:      type,
    p_item_data: itemData,
    p_rating:    rating,
    p_liked:     liked,
  });
  if (error) console.warn('[CF] upsertItemSignal error:', error.message);
}
