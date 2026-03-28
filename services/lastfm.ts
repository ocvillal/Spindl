import { Track, Album } from '../constants/mockData';

const API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const API_KEY = process.env.EXPO_PUBLIC_LASTFM_API_KEY ?? '';

// Internal type — rawPlaycount is used for Supabase storage only, not part of Track
export type LastFmTrack = Track & { rawPlaycount: number };

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return secs > 0 ? `${minutes}:${String(secs).padStart(2, '0')}` : `${minutes} min`;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mapLastFmTrack(item: any): LastFmTrack {
  const artistName: string = item.artist?.name ?? item.artist ?? '';
  const cover: string = item.image?.[item.image.length - 1]?.['#text'] ?? '';
  const rawPlaycount = parseInt(item.playcount ?? '0', 10);

  const albumStub: Album = {
    id: '',
    title: '',
    artist: artistName,
    year: 0,
    genre: [],
    cover,
    coverGradient: ['#1a1a2e', '#16213e'],
    trackCount: 0,
    duration: '',
  };

  return {
    id: item.mbid || `lf-${slugify(item.name)}-${slugify(artistName)}`,
    title: item.name,
    artist: artistName,
    duration: formatDuration(parseInt(item.duration ?? '0', 10)),
    playsCount: rawPlaycount > 0 ? rawPlaycount.toLocaleString() : '',
    album: albumStub,
    rawPlaycount,
  };
}

async function lastFmFetch(params: Record<string, string>): Promise<any> {
  if (!API_KEY) throw new Error('Last.fm API key missing. Add EXPO_PUBLIC_LASTFM_API_KEY to your .env file.');
  const query = new URLSearchParams({ ...params, format: 'json', api_key: API_KEY }).toString();
  const response = await fetch(`${API_BASE}?${query}`);
  if (!response.ok) throw new Error(`Last.fm API error: ${response.status}`);
  return response.json();
}

/** Fetches Last.fm's global weekly top tracks (scrobble-based, updates every Monday). */
export async function fetchTopTracks(limit = 50): Promise<LastFmTrack[]> {
  const data = await lastFmFetch({ method: 'chart.getTopTracks', limit: String(limit) });
  return (data.tracks?.track ?? []).map(mapLastFmTrack);
}
