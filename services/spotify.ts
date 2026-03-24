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

/** Fetch Spotify's new releases (useful for a "trending" section). */
export async function getNewReleases(limit = 10): Promise<Album[]> {
  const data = await spotifyFetch(`/browse/new-releases?limit=${limit}`);
  return data.albums.items.map(mapSpotifyAlbum);
}
