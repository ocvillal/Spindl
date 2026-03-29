import { Album, Track } from '../constants/mockData';

const API_BASE = 'https://api.deezer.com';

export interface DeezerArtist {
  id: string;
  name: string;
  image: string;
  genres: string[];
  followersCount: number;
}

export interface DeezerSearchResults {
  albums: Album[];
  tracks: Track[];
  artists: DeezerArtist[];
}

function mapDeezerAlbum(item: any): Album {
  return {
    id: item.id.toString(),
    title: item.title,
    artist: item.artist?.name ?? '',
    year: 0,
    genre: [],
    cover: item.cover_xl ?? item.cover_big ?? item.cover_medium ?? item.cover ?? '',
    coverGradient: ['#1a1a2e', '#16213e'],
    trackCount: item.nb_tracks ?? 0,
    duration: '',
  };
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function mapDeezerTrack(item: any): Track {
  const albumStub: Album = {
    id: item.album?.id?.toString() ?? '',
    title: item.album?.title ?? '',
    artist: item.artist?.name ?? '',
    year: 0,
    genre: [],
    cover: item.album?.cover_xl ?? item.album?.cover_big ?? item.album?.cover_medium ?? '',
    coverGradient: ['#1a1a2e', '#16213e'],
    trackCount: 0,
    duration: '',
  };
  return {
    id: item.id?.toString() ?? '',
    title: item.title ?? '',
    artist: item.artist?.name ?? '',
    album: albumStub,
    duration: formatDuration(item.duration ?? 0),
    playsCount: '',
  };
}

function mapDeezerArtist(item: any): DeezerArtist {
  return {
    id: item.id?.toString() ?? '',
    name: item.name ?? '',
    image: item.picture_xl ?? item.picture_big ?? item.picture_medium ?? '',
    genres: [],
    followersCount: item.nb_fan ?? 0,
  };
}

function mapSearchAlbum(item: any): Album {
  return {
    id: item.id?.toString() ?? '',
    title: item.title ?? '',
    artist: item.artist?.name ?? '',
    year: 0,
    genre: [],
    cover: item.cover_xl ?? item.cover_big ?? item.cover_medium ?? '',
    coverGradient: ['#1a1a2e', '#16213e'],
    trackCount: item.nb_tracks ?? 0,
    duration: '',
  };
}

/** Top albums from Deezer's global chart (current, real ranked data). */
export async function getTopAlbums(limit = 10): Promise<Album[]> {
  const response = await fetch(`${API_BASE}/chart/0/albums?limit=${limit}`);
  if (!response.ok) throw new Error(`Deezer API error: ${response.status}`);
  const data = await response.json();
  return (data.data ?? []).map(mapDeezerAlbum);
}

/** Search albums, tracks, and artists via Deezer — no auth, no rate limits. */
export async function searchAll(query: string): Promise<DeezerSearchResults> {
  if (!query.trim()) return { albums: [], tracks: [], artists: [] };
  const q = encodeURIComponent(query);
  const [tracksRes, albumsRes, artistsRes] = await Promise.all([
    fetch(`${API_BASE}/search?q=${q}&limit=10`),
    fetch(`${API_BASE}/search/album?q=${q}&limit=10`),
    fetch(`${API_BASE}/search/artist?q=${q}&limit=10`),
  ]);
  const [tracksData, albumsData, artistsData] = await Promise.all([
    tracksRes.json(),
    albumsRes.json(),
    artistsRes.json(),
  ]);
  return {
    tracks: (tracksData.data ?? []).map(mapDeezerTrack),
    albums: (albumsData.data ?? []).map(mapSearchAlbum),
    artists: (artistsData.data ?? []).map(mapDeezerArtist),
  };
}
