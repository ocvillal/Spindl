import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './auth';

export interface Profile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  genres: string[];
  favArtists: string[];
  onboarded: boolean;
}

interface ProfileStore {
  profile: Profile | null;
  loading: boolean;
  createProfile: (data: { name: string; username: string; avatarUrl: string }) => Promise<string | null>;
  updateGenres: (genres: string[], favArtists: string[]) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  checkUsername: (username: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileStore | null>(null);

function rowToProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatarUrl: row.avatar_url,
    genres: row.genres ?? [],
    favArtists: row.fav_artists ?? [],
    onboarded: row.onboarded,
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setProfile(null); setLoading(false); return; }
    fetchProfile();
  }, [session]);

  async function fetchProfile() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session!.user.id)
      .single();
    setProfile(data ? rowToProfile(data) : null);
    setLoading(false);
  }

  async function createProfile(data: { name: string; username: string; avatarUrl: string }): Promise<string | null> {
    const { error } = await supabase.from('profiles').upsert({
      id: session!.user.id,
      name: data.name,
      username: data.username.toLowerCase(),
      avatar_url: data.avatarUrl,
      genres: [],
      fav_artists: [],
      onboarded: false,
    }, { onConflict: 'id' });
    if (error) return error.message;
    await fetchProfile();
    return null;
  }

  async function updateGenres(genres: string[], favArtists: string[]) {
    await supabase.from('profiles').update({ genres, fav_artists: favArtists }).eq('id', session!.user.id);
    setProfile((p) => p ? { ...p, genres, favArtists } : p);
  }

  async function completeOnboarding() {
    await supabase.from('profiles').update({ onboarded: true }).eq('id', session!.user.id);
    setProfile((p) => p ? { ...p, onboarded: true } : p);
  }

  async function checkUsername(username: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    return !data; // true = available
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, createProfile, updateGenres, completeOnboarding, checkUsername, refresh: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
