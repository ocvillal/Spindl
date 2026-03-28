/**
 * Spindl Recommendation Engine — Phase 1: Content-Based Filtering
 *
 * Pure TypeScript — no React, no Supabase. Fully testable in isolation.
 * Takes user signals → builds a taste profile → scores/ranks Spotify candidates.
 */

import { Album, Track } from '../constants/mockData';
import { UserTasteVector, ItemSignal } from './cf';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TasteProfile {
  genres:  Record<string, number>;  // genre id → normalized weight [0..1]
  artists: Record<string, number>;  // artist name → normalized weight [0..1]
  eras:    Record<string, number>;  // e.g. "2010s" → normalized weight [0..1]
  signalCount: number;
}

export interface SignalEntry {
  type: 'album' | 'song';
  rating: number;
  liked: boolean;
  albumData: Album;
}

export interface SignalAction {
  action: 'listened' | 'not_heard' | 'saved';
  rating: number | null;
  trackData: { album: Album; artist: string };
}

export interface ScoredTrack {
  track: Track;
  score: number;
}

// ─── Signal Weights ───────────────────────────────────────────────────────────

function ratingWeight(rating: number): number {
  const map: Record<number, number> = { 5: 1.0, 4: 0.7, 3: 0.2, 2: -0.4, 1: -0.8 };
  return map[rating] ?? 0;
}

function discoverWeight(action: SignalAction): number {
  if (action.action === 'not_heard') return 0;
  if (action.action === 'saved') return 0.6;
  if (action.action === 'listened') {
    return action.rating != null ? ratingWeight(action.rating) : 0.3;
  }
  return 0;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeArtist(name: string): string {
  return name.toLowerCase().trim();
}

function eraKey(year: number): string {
  if (!year || year < 1900) return '';
  return `${Math.floor(year / 10) * 10}s`; // e.g. 2013 → "2010s"
}

function applyWeight(map: Record<string, number>, keys: string[], w: number) {
  if (w === 0) return;
  for (const k of keys) {
    if (!k) continue;
    map[k] = (map[k] ?? 0) + w;
  }
}

function normalize(map: Record<string, number>): Record<string, number> {
  const max = Math.max(...Object.values(map), 0.001);
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v / max]));
}

function topN(map: Record<string, number>, n: number): string[] {
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([k]) => k);
}

// ─── Core: Build Taste Profile ────────────────────────────────────────────────

/**
 * Builds a weighted taste profile from all user signals.
 * Onboarding selections seed the profile; actual ratings/swipes refine it.
 */
export function buildTasteProfile(
  onboardingGenres: string[],
  onboardingArtists: string[],
  entries: SignalEntry[],
  discoverActions: SignalAction[]
): TasteProfile {
  const genres:  Record<string, number> = {};
  const artists: Record<string, number> = {};
  const eras:    Record<string, number> = {};

  // Seed with onboarding selections (cold-start prior)
  for (const g of onboardingGenres)  applyWeight(genres,  [g.toLowerCase()], 0.4);
  for (const a of onboardingArtists) applyWeight(artists, [normalizeArtist(a)], 0.5);

  let signalCount = onboardingGenres.length + onboardingArtists.length;

  // Accumulate from logged entries (albums & songs)
  // Album entries get 0.6× weight — rating a whole album is a broader signal than rating a specific song
  for (const entry of entries) {
    const baseWeight = ratingWeight(entry.rating) + (entry.liked ? 0.3 : 0);
    const w = entry.type === 'album' ? baseWeight * 0.6 : baseWeight;
    const album = entry.albumData;
    applyWeight(genres,  (album.genre ?? []).map((g) => g.toLowerCase()), w);
    applyWeight(artists, album.artist.split(',').map(normalizeArtist), w);
    const era = eraKey(album.year);
    if (era) applyWeight(eras, [era], w);
    signalCount++;
  }

  // Accumulate from discover swipes
  for (const action of discoverActions) {
    const w = discoverWeight(action);
    if (w === 0) continue;
    const album = action.trackData.album;
    applyWeight(genres,  (album.genre ?? []).map((g) => g.toLowerCase()), w);
    applyWeight(artists, [normalizeArtist(action.trackData.artist)], w);
    const era = eraKey(album.year);
    if (era) applyWeight(eras, [era], w);
    signalCount++;
  }

  return {
    genres:  normalize(genres),
    artists: normalize(artists),
    eras:    normalize(eras),
    signalCount,
  };
}

// ─── Core: Build Spotify Search Queries ──────────────────────────────────────

/**
 * Returns 5-6 Spotify search query strings derived from the taste profile.
 * Each should be used as the `q` param of a /search call.
 * Falls back to genre queries from onboarding when signal is sparse.
 */
export function buildSpotifyQueries(
  profile: TasteProfile,
  onboardingGenres: string[]
): string[] {
  const queries: string[] = [];

  if (profile.signalCount < 2) {
    // Cold start: use onboarding genres directly
    const fallback = onboardingGenres.slice(0, 3);
    return fallback.length > 0 ? fallback : ['pop'];
  }

  // Top 3 genres
  const topGenres = topN(profile.genres, 3);
  for (const g of topGenres) queries.push(g);

  // Top 2 artists
  const topArtists = topN(profile.artists, 2);
  for (const a of topArtists) queries.push(a);

  // Top era (as year range)
  const topEra = topN(profile.eras, 1)[0];
  if (topEra) {
    const decade = parseInt(topEra, 10); // "2010s" → 2010
    if (!isNaN(decade)) queries.push(`year:${decade}-${decade + 9}`);
  }

  return queries.length > 0 ? queries : ['pop'];
}

// ─── Core: Score a Track ─────────────────────────────────────────────────────

/**
 * Scores a candidate track against the user's taste profile.
 * Higher = better match. Range is approximately [0..1] for positive-taste tracks.
 */
export function scoreTrack(track: Track, profile: TasteProfile): number {
  let score = 0;

  // Genre match — 50% of score
  const trackGenres = (track.album?.genre ?? []).map((g) => g.toLowerCase());
  for (const g of trackGenres) {
    score += 0.5 * (profile.genres[g] ?? 0);
  }

  // Artist match — 35% of score
  const trackArtists = track.artist.split(',').map(normalizeArtist);
  for (const a of trackArtists) {
    score += 0.35 * (profile.artists[a] ?? 0);
  }

  // Era match — 15% of score
  const era = eraKey(track.album?.year ?? 0);
  if (era) score += 0.15 * (profile.eras[era] ?? 0);

  return score;
}

// ─── Core: Rank with Diversity ───────────────────────────────────────────────

/**
 * Sorts candidates by score (descending) and adds a small jitter to the
 * top 70% to prevent the queue from feeling identical every session.
 * The bottom 30% is shuffled randomly (serendipity / discovery).
 */
export function rankWithDiversity(candidates: ScoredTrack[]): Track[] {
  candidates.sort((a, b) => b.score - a.score);

  const splitAt = Math.floor(candidates.length * 0.7);
  const topTier = candidates.slice(0, splitAt).map((c) => ({
    ...c,
    score: c.score + (Math.random() * 0.1 - 0.05), // ±5% jitter
  }));
  topTier.sort((a, b) => b.score - a.score);

  const bottomTier = candidates.slice(splitAt).sort(() => Math.random() - 0.5);

  return [...topTier, ...bottomTier].map((c) => c.track);
}

// ─── Core: Score an Album ────────────────────────────────────────────────────

/**
 * Scores a candidate album against the user's taste profile.
 * Albums from Deezer have real genre arrays, making genre scoring reliable.
 */
export function scoreAlbum(album: Album, profile: TasteProfile): number {
  let score = 0;

  // Genre match — 50% of score (Deezer albums have real genre data)
  const genres = (album.genre ?? []).map((g) => g.toLowerCase());
  const genreScore = genres.reduce((sum, g) => sum + (profile.genres[g] ?? 0), 0);
  score += 0.5 * Math.min(genreScore, 1);

  // Artist match — 35% of score
  const artists = album.artist.split(',').map(normalizeArtist);
  for (const a of artists) {
    score += 0.35 * (profile.artists[a] ?? 0);
  }

  // Era match — 15% of score
  const era = eraKey(album.year ?? 0);
  if (era) score += 0.15 * (profile.eras[era] ?? 0);

  return score;
}

// ─── Utility: Deduplicate tracks by ID ───────────────────────────────────────

export function deduplicateTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

/** Returns entries of a weight map sorted by value descending. */
export function sortedEntries(map: Record<string, number>): [string, number][] {
  return Object.entries(map).sort(([, a], [, b]) => b - a);
}

// ─── Live Profile Update: apply a single swipe signal ────────────────────────

const SWIPE_LEARNING_RATE = 0.12; // how much each swipe shifts the profile

function swipeWeight(action: 'listened' | 'not_heard' | 'saved', rating: number | null): number {
  if (action === 'not_heard') return 0;
  if (action === 'saved')     return 0.6;
  return rating != null ? ratingWeight(rating) : 0.3;
}

function renorm(map: Record<string, number>): Record<string, number> {
  const max = Math.max(...Object.values(map), 0.001);
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v / max]));
}

/**
 * Incrementally updates a taste profile with a single swipe signal.
 * Called after each card swipe so the very next card reflects the new signal.
 * Uses a small learning rate so a single swipe doesn't dominate the profile.
 */
export function applySwipeSignal(
  profile: TasteProfile,
  itemGenres: string[],
  itemArtist: string,
  itemYear: number,
  action: 'listened' | 'not_heard' | 'saved',
  rating: number | null,
): TasteProfile {
  const w = swipeWeight(action, rating);
  if (w === 0) return { ...profile, signalCount: profile.signalCount + 1 };

  const delta = w * SWIPE_LEARNING_RATE;

  const newGenres  = { ...profile.genres };
  const newArtists = { ...profile.artists };
  const newEras    = { ...profile.eras };

  for (const g of itemGenres.map((g) => g.toLowerCase())) {
    newGenres[g] = Math.max(0, Math.min(2, (newGenres[g] ?? 0) + delta));
  }
  for (const a of itemArtist.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    newArtists[a] = Math.max(0, Math.min(2, (newArtists[a] ?? 0) + delta));
  }
  const era = itemYear > 0 ? `${Math.floor(itemYear / 10) * 10}s` : null;
  if (era) newEras[era] = Math.max(0, Math.min(2, (newEras[era] ?? 0) + delta));

  return {
    genres:      renorm(newGenres),
    artists:     renorm(newArtists),
    eras:        renorm(newEras),
    signalCount: profile.signalCount + 1,
  };
}

// ─── User-User CF: Cosine Similarity + Profile Blending ──────────────────────

/** Cosine similarity between two sparse weight maps. Range [0..1]. */
export function cosineSimilarity(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  let dot = 0, magA = 0, magB = 0;
  for (const [k, v] of Object.entries(a)) {
    dot += v * (b[k] ?? 0);
    magA += v * v;
  }
  for (const v of Object.values(b)) magB += v * v;
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom < 0.0001 ? 0 : dot / denom;
}

/**
 * Blends the current user's taste profile with an average of the top-5 most
 * similar users' profiles (user-user CF).
 * - Requires at least 3 other users with vectors, otherwise returns myProfile unchanged.
 * - Blend ratio: 75% mine, 25% social average.
 */
export function blendWithSimilarUsers(
  myProfile: TasteProfile,
  allVectors: UserTasteVector[],
  myUserId: string,
): TasteProfile {
  const others = allVectors.filter((v) => v.user_id !== myUserId && v.signal_count >= 2);
  if (others.length < 3) return myProfile;

  // Find top-5 most similar users by genre cosine similarity
  const similarities = others.map((v) => ({
    vector: v,
    sim: cosineSimilarity(myProfile.genres, v.genre_vector),
  }));
  similarities.sort((a, b) => b.sim - a.sim);
  const top5 = similarities.slice(0, 5).filter((s) => s.sim > 0.1);
  if (top5.length === 0) return myProfile;

  // Weighted average of similar users' vectors
  const totalSim = top5.reduce((s, x) => s + x.sim, 0);
  const socialGenres: Record<string, number> = {};
  const socialArtists: Record<string, number> = {};
  const socialEras: Record<string, number> = {};

  for (const { vector, sim } of top5) {
    const w = sim / totalSim;
    for (const [k, v] of Object.entries(vector.genre_vector))  socialGenres[k]  = (socialGenres[k]  ?? 0) + v * w;
    for (const [k, v] of Object.entries(vector.artist_vector)) socialArtists[k] = (socialArtists[k] ?? 0) + v * w;
    for (const [k, v] of Object.entries(vector.era_vector))    socialEras[k]    = (socialEras[k]    ?? 0) + v * w;
  }

  // Blend: 75% my profile, 25% social average
  function blend(mine: Record<string, number>, social: Record<string, number>): Record<string, number> {
    const keys = new Set([...Object.keys(mine), ...Object.keys(social)]);
    const merged: Record<string, number> = {};
    for (const k of keys) merged[k] = 0.75 * (mine[k] ?? 0) + 0.25 * (social[k] ?? 0);
    return merged;
  }

  return {
    genres:      blend(myProfile.genres,  socialGenres),
    artists:     blend(myProfile.artists, socialArtists),
    eras:        blend(myProfile.eras,    socialEras),
    signalCount: myProfile.signalCount,
  };
}

// ─── Item-Item CF: Community Score ───────────────────────────────────────────

/**
 * Community score [0..1] derived from aggregate item ratings.
 * Formula: (avg_rating/5) × log-scaled popularity weight.
 * Items with no signal return 0 — content score carries full weight.
 */
export function communityScore(signal: ItemSignal | undefined): number {
  if (!signal || signal.total_ratings === 0) return 0;
  const ratingScore = signal.avg_rating / 5;                             // [0..1]
  const popularity  = Math.log2(signal.total_ratings + 1) / Math.log2(101); // [0..1] saturates at ~100 ratings
  return ratingScore * popularity;
}

// ─── Hybrid Final Score ───────────────────────────────────────────────────────

/**
 * Combines blended content score (user-user CF baked in) with community score.
 * Weights adapt to available data:
 *   - signalCount < 2:  100% content (cold start)
 *   - community === 0:  100% content (no item signals yet)
 *   - otherwise:        75% content + 25% community
 */
export function hybridFinalScore(
  contentScore: number,
  community: number,
  signalCount: number,
): number {
  if (signalCount < 2 || community === 0) return contentScore;
  return 0.75 * contentScore + 0.25 * community;
}

// ─── Explore/Exploit: Epsilon-Greedy ─────────────────────────────────────────

/**
 * Epsilon-greedy ranking: injects exploration wildcards into the ranked list.
 * ~15% of positions are filled with random items from the lower-scoring pool,
 * spread throughout the queue (not just appended at the end).
 */
export function epsilonGreedyRank<T extends { score: number }>(
  items: T[],
  epsilon = 0.15,
): T[] {
  if (items.length <= 2) return items;

  const sorted = [...items].sort((a, b) => b.score - a.score);
  const splitAt = Math.floor(sorted.length * (1 - epsilon));
  const exploitPool = sorted.slice(0, splitAt);
  const explorePool = sorted.slice(splitAt).sort(() => Math.random() - 0.5);

  // Weave explore items into the exploit list at regular intervals
  const result: T[] = [];
  const exploreEvery = Math.floor(1 / epsilon); // ~every 7th slot
  let ei = 0;
  for (let i = 0; i < exploitPool.length; i++) {
    result.push(exploitPool[i]);
    if ((i + 1) % exploreEvery === 0 && ei < explorePool.length) {
      result.push(explorePool[ei++]);
    }
  }
  // Append any remaining explore items
  while (ei < explorePool.length) result.push(explorePool[ei++]);

  return result;
}
