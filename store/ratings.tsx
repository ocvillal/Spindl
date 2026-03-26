import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Album, Track } from '../constants/mockData';
import { supabase } from '../services/supabase';
import { useAuth } from './auth';

export interface AlbumEntry {
  id: string;
  type: 'album';
  album: Album;
  rating: number;
  review: string;
  liked: boolean;
  date: string;
}

export interface SongEntry {
  id: string;
  type: 'song';
  track: Track;
  rating: number;
  review: string;
  liked: boolean;
  date: string;
}

export type Entry = AlbumEntry | SongEntry;

interface RatingsStore {
  entries: Entry[];
  loading: boolean;
  logAlbum: (album: Album, rating: number, review: string, liked: boolean) => Promise<void>;
  logSong: (track: Track, rating: number, review: string, liked: boolean) => Promise<void>;
  getAlbumEntry: (albumId: string) => AlbumEntry | undefined;
  getSongEntry: (trackId: string) => SongEntry | undefined;
}

const RatingsContext = createContext<RatingsStore | null>(null);

function today(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function rowToEntry(row: any): Entry {
  if (row.type === 'album') {
    return {
      id: row.item_id,
      type: 'album',
      album: row.album_data as Album,
      rating: row.rating,
      review: row.review,
      liked: row.liked,
      date: row.date,
    };
  }
  return {
    id: row.item_id,
    type: 'song',
    track: row.track_data as Track,
    rating: row.rating,
    review: row.review,
    liked: row.liked,
    date: row.date,
  };
}

export function RatingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      setEntries([]);
      return;
    }
    fetchEntries();
  }, [session]);

  async function fetchEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Ratings] Failed to load entries:', error.message);
    } else {
      setEntries((data ?? []).map(rowToEntry));
    }
    setLoading(false);
  }

  async function logAlbum(album: Album, rating: number, review: string, liked: boolean) {
    const entry: AlbumEntry = { id: album.id, type: 'album', album, rating, review, liked, date: today() };

    // Optimistic update — UI feels instant
    setEntries((prev) => [entry, ...prev.filter((e) => !(e.type === 'album' && e.id === album.id))]);

    const { error } = await supabase.from('entries').upsert(
      {
        user_id: session!.user.id,
        item_id: album.id,
        type: 'album',
        rating,
        review,
        liked,
        date: today(),
        album_data: album,
        track_data: null,
      },
      { onConflict: 'user_id,type,item_id' }
    );

    if (error) console.error('[Ratings] Failed to save album entry:', error.message);
  }

  async function logSong(track: Track, rating: number, review: string, liked: boolean) {
    const entry: SongEntry = { id: track.id, type: 'song', track, rating, review, liked, date: today() };

    setEntries((prev) => [entry, ...prev.filter((e) => !(e.type === 'song' && e.id === track.id))]);

    const { error } = await supabase.from('entries').upsert(
      {
        user_id: session!.user.id,
        item_id: track.id,
        type: 'song',
        rating,
        review,
        liked,
        date: today(),
        album_data: track.album,
        track_data: track,
      },
      { onConflict: 'user_id,type,item_id' }
    );

    if (error) console.error('[Ratings] Failed to save song entry:', error.message);
  }

  function getAlbumEntry(albumId: string) {
    return entries.find((e): e is AlbumEntry => e.type === 'album' && e.id === albumId);
  }

  function getSongEntry(trackId: string) {
    return entries.find((e): e is SongEntry => e.type === 'song' && e.id === trackId);
  }

  return (
    <RatingsContext.Provider value={{ entries, loading, logAlbum, logSong, getAlbumEntry, getSongEntry }}>
      {children}
    </RatingsContext.Provider>
  );
}

export function useRatings() {
  const ctx = useContext(RatingsContext);
  if (!ctx) throw new Error('useRatings must be used within RatingsProvider');
  return ctx;
}
