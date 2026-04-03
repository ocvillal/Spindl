import { Album, Track } from '../constants/mockData';

const API_BASE = 'https://api.deezer.com';

/** Strip remaster/packaging/mix-version markers from titles for clean display. */
export function cleanTitle(title: string): string {
  return title
    // Strip bracketed remaster markers: (Remastered 2009), (2009 Digital Remaster), etc.
    .replace(/\s*[\(\[]\s*(\d{4}\s+)?(digital\s+)?remaster(ed)?\s*(\d{4})?\s*[\)\]]/gi, '')
    // Strip bracketed stereo/mono remaster
    .replace(/\s*[\(\[]\s*(stereo|mono)\s+remaster(ed)?\s*[\)\]]/gi, '')
    // Strip album packaging suffixes: (Deluxe Edition), (Anniversary Edition), etc.
    .replace(/\s*[\(\[]\s*(deluxe|anniversary|expanded|super deluxe|special|bonus tracks?)(\s+edition)?\s*[\)\]]/gi, '')
    // Strip year+Mix variants: (2015 Mix), (2023 Mix)
    .replace(/\s*[\(\[]\s*\d{4}\s+[Mm]ix\s*[\)\]]/g, '')
    // Strip featured artist markers: (feat. X), (ft. X), (featuring X), (with X)
    .replace(/\s*[\(\[]\s*(feat\.?|ft\.?|featuring|with)\s+[^\)\]]+\s*[\)\]]/gi, '')
    // Strip live/acoustic/demo/mono/stereo variants: (Live), (Live at Budokan), (Acoustic Version), (Demo), (Mono), (Stereo)
    .replace(/\s*[\(\[]\s*(live\b[^\)\]]*|acoustic(\s+version)?|demo(\s+version)?|mono|stereo)\s*[\)\]]/gi, '')
    // Strip bare trailing variants preceded by dash: "Song Title - Live", "Song Title - Acoustic"
    .replace(/\s*[-–]\s*(live|acoustic|demo)\b.*/gi, '')
    // Strip bare trailing remaster: "Abbey Road - Remastered"
    .replace(/\s*[-–]?\s*remaster(ed)?\b.*/gi, '')
    // Strip bare trailing packaging: "- Deluxe Edition"
    .replace(/\s*[-–]?\s*(deluxe|anniversary|expanded|super deluxe|special)\s+edition\b.*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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
    year: parseInt(item.release_date?.split('-')[0] ?? '0', 10) || 0,
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

/** Fetch a full album with its track list by Deezer album ID. */
export async function getAlbumWithTracks(deezerId: string): Promise<{ album: Album; tracks: Track[] }> {
  const response = await fetch(`${API_BASE}/album/${deezerId}`);
  if (!response.ok) throw new Error(`Deezer API error: ${response.status}`);
  const d = await response.json();

  const totalSeconds: number = d.tracks?.data?.reduce((sum: number, t: any) => sum + (t.duration ?? 0), 0) ?? 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const durationStr = h > 0 ? `${h}h ${m}m` : `${m} min`;

  const cover = d.cover_xl ?? d.cover_big ?? d.cover_medium ?? d.cover ?? '';
  const album: Album = {
    id: String(d.id),
    title: d.title ?? '',
    artist: d.artist?.name ?? '',
    year: parseInt(d.release_date?.split('-')[0] ?? '0', 10),
    genre: (d.genres?.data ?? []).map((g: any) => g.name as string),
    cover,
    coverGradient: ['#1a1a2e', '#16213e'],
    trackCount: d.nb_tracks ?? 0,
    duration: durationStr,
  };

  const tracks: Track[] = (d.tracks?.data ?? []).map((t: any): Track => ({
    id: String(t.id),
    title: t.title ?? '',
    artist: t.artist?.name ?? d.artist?.name ?? '',
    duration: formatDuration(t.duration ?? 0),
    playsCount: '',
    album: { ...album, trackCount: 0, duration: '' },
  }));

  return { album, tracks };
}

/** Search Deezer for an album by query, return the best match with tracks. */
export async function findAndLoadAlbum(query: string): Promise<{ album: Album; tracks: Track[] }> {
  const res = await fetch(`${API_BASE}/search/album?q=${encodeURIComponent(query)}&limit=1`);
  if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);
  const data = await res.json();
  const first = data.data?.[0];
  if (!first) throw new Error('No Deezer album match found');
  return getAlbumWithTracks(String(first.id));
}

export interface DeezerArtistDetail {
  id: string;
  name: string;
  image: string;
  fanCount: number;
  albumCount: number;
}

/** Fetch artist info by Deezer numeric ID. */
export async function getArtistById(id: string): Promise<DeezerArtistDetail> {
  const res = await fetch(`${API_BASE}/artist/${id}`);
  if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);
  const d = await res.json();
  return {
    id: String(d.id),
    name: d.name ?? '',
    image: d.picture_xl ?? d.picture_big ?? d.picture_medium ?? '',
    fanCount: d.nb_fan ?? 0,
    albumCount: d.nb_album ?? 0,
  };
}

/** Search for an artist by name and return their detail. */
export async function findArtistByName(name: string): Promise<DeezerArtistDetail> {
  const res = await fetch(`${API_BASE}/search/artist?q=${encodeURIComponent(name)}&limit=1`);
  if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);
  const data = await res.json();
  const a = data.data?.[0];
  if (!a) throw new Error('Artist not found');
  return {
    id: String(a.id),
    name: a.name ?? '',
    image: a.picture_xl ?? a.picture_big ?? a.picture_medium ?? '',
    fanCount: a.nb_fan ?? 0,
    albumCount: 0,
  };
}

/** Fetch an artist's albums. */
export async function getArtistAlbums(artistId: string, limit = 20): Promise<Album[]> {
  const res = await fetch(`${API_BASE}/artist/${artistId}/albums?limit=${limit}`);
  if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);
  const data = await res.json();
  return (data.data ?? []).map(mapDeezerAlbum);
}

/** Fetch an artist's top tracks. */
export async function getArtistTopTracks(artistId: string, limit = 10): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/artist/${artistId}/top?limit=${limit}`);
  if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);
  const data = await res.json();
  return (data.data ?? []).map(mapDeezerTrack);
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
    fetch(`${API_BASE}/search?q=${q}&limit=25`),
    fetch(`${API_BASE}/search/album?q=${q}&limit=25`),
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

/**
 * Given any version of a track, returns the canonical (original) version —
 * the one with the lowest Deezer ID among all results that share the same
 * clean title and artist. Falls back to the input track on any error.
 */
export async function resolveCanonicalTrack(track: Track): Promise<Track> {
  try {
    const query = `${cleanTitle(track.title)} ${track.artist}`;
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=20`);
    if (!res.ok) return track;
    const data = await res.json();
    const cleanedTitle = cleanTitle(track.title).toLowerCase();
    const artistLower = track.artist.toLowerCase();
    const matches: Track[] = (data.data ?? [])
      .map(mapDeezerTrack)
      .filter((c: Track) =>
        cleanTitle(c.title).toLowerCase() === cleanedTitle &&
        c.artist.toLowerCase() === artistLower
      );
    if (matches.length === 0) return track;
    return matches.reduce((best, c) => parseInt(c.id) < parseInt(best.id) ? c : best);
  } catch {
    return track;
  }
}
