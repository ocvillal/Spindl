import { Album, Track } from '../constants/mockData';

export interface Artist {
  id: string;
  name: string;
  image: string;
  genres: string[];
  followersCount: number;
}

export interface SearchResults {
  albums: Album[];
  tracks: Track[];
  artists: Artist[];
}

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET ?? '';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

// ─── Token Management ────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Spotify credentials missing. Check EXPO_PUBLIC_SPOTIFY_CLIENT_ID and EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET in your .env file, then restart Metro.');
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify auth failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;
  return cachedToken!;
}

async function spotifyFetch(endpoint: string): Promise<any> {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify API error: ${response.status} — ${body}`);
  }
  return response.json();
}

// ─── Mappers ─────────────────────────────────────────────────────

function mapSpotifyAlbum(item: any): Album {
  return {
    id: item.id,
    title: item.name,
    artist: item.artists.map((a: any) => a.name).join(', '),
    year: parseInt(item.release_date?.split('-')[0] ?? '0', 10),
    genre: item.genres ?? [],
    cover: item.images?.[0]?.url ?? '',
    coverGradient: ['#1a1a2e', '#16213e'], // fallback gradient; swap for dynamic color later
    trackCount: item.total_tracks ?? 0,
    duration: item.tracks
      ? formatDuration(
          item.tracks.items.reduce((sum: number, t: any) => sum + (t.duration_ms ?? 0), 0)
        )
      : '',
  };
}

function mapSpotifyArtist(item: any): Artist {
  return {
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url ?? '',
    genres: item.genres ?? [],
    followersCount: item.followers?.total ?? 0,
  };
}

function mapSpotifyTrack(item: any, album: Album): Track {
  return {
    id: item.id,
    title: item.name,
    artist: item.artists.map((a: any) => a.name).join(', '),
    album,
    duration: formatDuration(item.duration_ms),
    playsCount: '',
  };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
  return seconds > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${minutes} min`;
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Batch-fetches Spotify album cover URLs for a list of tracks.
 * Returns one cover string per input (empty string on miss).
 * All searches run in parallel.
 */
export async function getSpotifyTrackCovers(
  queries: Array<{ title: string; artist: string }>
): Promise<string[]> {
  const results = await Promise.allSettled(
    queries.map(({ title, artist }) =>
      spotifyFetch(
        `/search?q=${encodeURIComponent(`${title} ${artist}`)}&type=track&limit=1&market=US`
      )
    )
  );
  return results.map((r) =>
    r.status === 'fulfilled'
      ? (r.value.tracks?.items?.[0]?.album?.images?.[0]?.url ?? '')
      : ''
  );
}

/** Search albums, tracks, and artists in one call. */
export async function searchAll(query: string): Promise<SearchResults> {
  if (!query.trim()) return { albums: [], tracks: [], artists: [] };
  const encoded = encodeURIComponent(query);
  const data = await spotifyFetch(
    `/search?q=${encoded}&type=album,track,artist&limit=10&market=US`
  );

  const albums: Album[] = (data.albums?.items ?? []).map(mapSpotifyAlbum);

  // Tracks from search don't include full album data, so we build a minimal album stub
  const tracks: Track[] = (data.tracks?.items ?? []).map((t: any) => {
    const albumStub: Album = {
      id: t.album?.id ?? '',
      title: t.album?.name ?? '',
      artist: (t.album?.artists ?? []).map((a: any) => a.name).join(', '),
      year: parseInt(t.album?.release_date?.split('-')[0] ?? '0', 10),
      genre: [],
      cover: t.album?.images?.[0]?.url ?? '',
      coverGradient: ['#1a1a2e', '#16213e'],
      trackCount: t.album?.total_tracks ?? 0,
      duration: '',
    };
    return {
      id: t.id,
      title: t.name,
      artist: (t.artists ?? []).map((a: any) => a.name).join(', '),
      album: albumStub,
      duration: formatDuration(t.duration_ms),
      playsCount: '',
    };
  });

  const artists: Artist[] = (data.artists?.items ?? []).map(mapSpotifyArtist);

  return { albums, tracks, artists };
}

/** Fetch full album details including tracklist (2 parallel calls). */
export async function getAlbumWithTracks(albumId: string): Promise<{ album: Album; tracks: Track[] }> {
  const [albumData, tracksData] = await Promise.all([
    spotifyFetch(`/albums/${albumId}`),
    spotifyFetch(`/albums/${albumId}/tracks?limit=50`),
  ]);

  // Compute total duration from the full tracks list (not paginated album.tracks)
  const totalMs: number = tracksData.items.reduce(
    (sum: number, t: any) => sum + (t.duration_ms ?? 0),
    0
  );

  const album: Album = {
    ...mapSpotifyAlbum(albumData),
    duration: formatDuration(totalMs),
  };

  const tracks: Track[] = tracksData.items.map((t: any) => mapSpotifyTrack(t, album));
  return { album, tracks };
}

// Spotify's `popularity` score (0-100) is calculated from total & recent streams,
// with recent plays weighted more heavily — so sorting by it naturally surfaces
// what's being listened to most right now. We use different query pools per period
// to shift the candidate pool toward newer vs. all-time content.
const ALBUM_QUERIES: Record<string, string[]> = {
  week:  ['pop', 'hip hop', 'r&b', 'latin'],
  month: ['pop hits', 'rap', 'indie pop', 'dance'],
  year:  ['best albums', 'top albums', 'greatest hits', 'classic rap'],
};
const TRACK_QUERIES: Record<string, string[]> = {
  week:  ['pop', 'hip hop', 'r&b', 'latin'],
  month: ['pop hits', 'chart hits', 'rap songs', 'trending'],
  year:  ['top songs', 'greatest hits', 'best songs', 'classic pop'],
};

/**
 * Trending albums sorted by Spotify's popularity score (0–100),
 * which reflects recent global play counts.
 */
export async function getTrendingAlbums(limit = 10, period: 'week' | 'month' | 'year' = 'week'): Promise<Album[]> {
  const queries = ALBUM_QUERIES[period];
  const results = await Promise.allSettled(
    queries.map((q) => spotifyFetch(`/search?q=${encodeURIComponent(q)}&type=album&limit=10&market=US`))
  );
  const seen = new Set<string>();
  const scored: { album: Album; pop: number }[] = [];
  for (const r of results) {
    if (r.status === 'rejected') { console.warn('[Spotify] album query failed:', r.reason); continue; }
    for (const item of r.value.albums?.items ?? []) {
      // Skip null items and invalid IDs (Spotify base62 IDs are always 22 chars)
      if (!item?.id || item.id.length !== 22 || seen.has(item.id)) continue;
      seen.add(item.id);
      scored.push({ album: mapSpotifyAlbum(item), pop: item.popularity ?? 0 });
    }
  }
  console.log(`[Spotify] getTrendingAlbums pool: ${scored.length}, returning top ${limit}`);
  return scored.sort((a, b) => b.pop - a.pop).slice(0, limit).map((s) => s.album);
}

/**
 * Popular tracks sorted by Spotify's popularity score (0–100).
 */
export async function getPopularTracks(limit = 10, period: 'week' | 'month' | 'year' = 'week'): Promise<Track[]> {
  const queries = TRACK_QUERIES[period];
  const results = await Promise.allSettled(
    queries.map((q) => spotifyFetch(`/search?q=${encodeURIComponent(q)}&type=track&limit=10&market=US`))
  );
  const seen = new Set<string>();
  const scored: { track: Track; pop: number }[] = [];
  for (const r of results) {
    if (r.status === 'rejected') { console.warn('[Spotify] track query failed:', r.reason); continue; }
    for (const t of r.value.tracks?.items ?? []) {
      // Skip invalid track or album IDs
      if (!t?.id || t.id.length !== 22 || !t.album?.id || t.album.id.length !== 22 || seen.has(t.id)) continue;
      seen.add(t.id);
      const albumStub: Album = {
        id: t.album?.id ?? '',
        title: t.album?.name ?? '',
        artist: (t.album?.artists ?? []).map((a: any) => a.name).join(', '),
        year: parseInt(t.album?.release_date?.split('-')[0] ?? '0', 10),
        genre: [],
        cover: t.album?.images?.[0]?.url ?? '',
        coverGradient: ['#1a1a2e', '#16213e'],
        trackCount: t.album?.total_tracks ?? 0,
        duration: '',
      };
      scored.push({
        track: {
          id: t.id,
          title: t.name,
          artist: (t.artists ?? []).map((a: any) => a.name).join(', '),
          album: albumStub,
          duration: formatDuration(t.duration_ms),
          playsCount: '',
        },
        pop: t.popularity ?? 0,
      });
    }
  }
  console.log(`[Spotify] getPopularTracks pool: ${scored.length}, returning top ${limit}`);
  return scored.sort((a, b) => b.pop - a.pop).slice(0, limit).map((s) => s.track);
}
