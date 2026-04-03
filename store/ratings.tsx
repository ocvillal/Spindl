import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Album, Track } from '../constants/mockData';
import { supabase } from '../services/supabase';
import { useAuth } from './auth';
import { cleanTitle } from '../services/deezer';

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

/** Stable key used as item_id for song entries — normalises all mixes/remasters to one slot. */
export function canonicalSongKey(track: Track): string {
  return `${cleanTitle(track.title).toLowerCase()}::${track.artist.toLowerCase()}`;
}

interface RatingsStore {
  entries: Entry[];
  loading: boolean;
  logAlbum: (album: Album, rating: number, review: string, liked: boolean) => Promise<void>;
  logSong: (track: Track, rating: number, review: string, liked: boolean) => Promise<void>;
  getAlbumEntry: (albumId: string) => AlbumEntry | undefined;
  getSongEntry: (trackId: string) => SongEntry | undefined;
  getSongEntryForTrack: (track: Track) => SongEntry | undefined;
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
    const key = canonicalSongKey(track);
    // Always store with the clean title so the entry isn't tied to a specific mix variant
    const canonicalTrack: Track = { ...track, title: cleanTitle(track.title) };
    const entry: SongEntry = { id: key, type: 'song', track: canonicalTrack, rating, review, liked, date: today() };

    setEntries((prev) => [entry, ...prev.filter((e) => !(e.type === 'song' && e.id === key))]);

    const { error } = await supabase.from('entries').upsert(
      {
        user_id: session!.user.id,
        item_id: key,
        type: 'song',
        rating,
        review,
        liked,
        date: today(),
        album_data: canonicalTrack.album,
        track_data: canonicalTrack,
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

  function getSongEntryForTrack(track: Track) {
    const key = canonicalSongKey(track);
    return entries.find((e): e is SongEntry => e.type === 'song' && e.id === key);
  }

  return (
    <RatingsContext.Provider value={{ entries, loading, logAlbum, logSong, getAlbumEntry, getSongEntry, getSongEntryForTrack }}>
      {children}
    </RatingsContext.Provider>
  );
}

export function useRatings() {
  const ctx = useContext(RatingsContext);
  if (!ctx) throw new Error('useRatings must be used within RatingsProvider');
  return ctx;
}
