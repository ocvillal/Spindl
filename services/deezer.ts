import { Album } from '../constants/mockData';

const API_BASE = 'https://api.deezer.com';

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

/** Top albums from Deezer's global chart (current, real ranked data). */
export async function getTopAlbums(limit = 10): Promise<Album[]> {
  const response = await fetch(`${API_BASE}/chart/0/albums?limit=${limit}`);
  if (!response.ok) throw new Error(`Deezer API error: ${response.status}`);
  const data = await response.json();
  return (data.data ?? []).map(mapDeezerAlbum);
}
