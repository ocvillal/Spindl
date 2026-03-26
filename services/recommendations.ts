/**
 * Spindl Recommendation Engine — Phase 1: Content-Based Filtering
 *
 * Pure TypeScript — no React, no Supabase. Fully testable in isolation.
 * Takes user signals → builds a taste profile → scores/ranks Spotify candidates.
 */

import { Album, Track } from '../constants/mockData';

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
  for (const entry of entries) {
    const w = ratingWeight(entry.rating) + (entry.liked ? 0.3 : 0);
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

  if (profile.signalCount < 5) {
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

// ─── Utility: Deduplicate tracks by ID ───────────────────────────────────────

export function deduplicateTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}
