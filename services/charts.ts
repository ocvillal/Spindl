import { Track, Album } from '../constants/mockData';
import { supabase } from './supabase';
import { fetchTopTracks } from './lastfm';
import { getTopAlbums as deezerTopAlbums } from './deezer';

type Period = 'week' | 'month' | 'year';

// ─── Helpers ─────────────────────────────────────────────────────

/** Returns the ISO date string (YYYY-MM-DD) for the most recent Monday. */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

function cutoffDate(period: Period): string {
  const d = new Date();
  if (period === 'week')  d.setDate(d.getDate() - 7);
  if (period === 'month') d.setDate(d.getDate() - 30);
  if (period === 'year')  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split('T')[0];
}

// ─── Seeding ─────────────────────────────────────────────────────

/**
 * Fire-and-forget: checks if this week's Last.fm chart has been stored in Supabase.
 * If not, fetches and stores it. Safe to call on every app open.
 */
export async function seedWeeklyChart(): Promise<void> {
  const weekStart = getMonday(new Date());

  const { data: existing } = await supabase
    .from('chart_snapshots')
    .select('id')
    .eq('week_start', weekStart)
    .limit(1);

  if (existing && existing.length > 0) return; // already seeded this week

  const tracks = await fetchTopTracks(50);
  if (tracks.length === 0) return;

  await supabase.from('chart_snapshots').upsert(
    tracks.map((t) => ({
      week_start: weekStart,
      track_id: `${t.artist}-${t.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      track_name: t.title,
      artist_name: t.artist,
      track_data: {
        id: t.id,
        title: t.title,
        artist: t.artist,
        duration: t.duration,
        playsCount: t.playsCount,
        album: t.album,
      } as Track,
      playcount: t.rawPlaycount,
    })),
    { onConflict: 'week_start,track_id' }
  );
}

// ─── Reading ─────────────────────────────────────────────────────

/**
 * Returns the top tracks for the given period by aggregating stored weekly snapshots.
 * Falls back to a direct Last.fm call if no snapshots exist yet (cold start).
 */
export async function getTopTracksForPeriod(period: Period, limit = 10): Promise<Track[]> {
  const { data } = await supabase
    .from('chart_snapshots')
    .select('track_id, track_data, playcount')
    .gte('week_start', cutoffDate(period));

  // Cold start fallback
  if (!data || data.length === 0) {
    const tracks = await fetchTopTracks(limit);
    return tracks.slice(0, limit);
  }

  // Aggregate playcount across weeks, then rank
  const map = new Map<string, { track: Track; total: number }>();
  for (const row of data) {
    const existing = map.get(row.track_id);
    if (existing) {
      existing.total += Number(row.playcount);
    } else {
      map.set(row.track_id, { track: row.track_data as Track, total: Number(row.playcount) });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((v) => v.track);
}

/**
 * Returns the top albums for the given period.
 * Uses Deezer's current global chart (Last.fm has no global album chart endpoint).
 */
export async function getTopAlbumsForPeriod(period: Period, limit = 10): Promise<Album[]> {
  return deezerTopAlbums(limit);
}
