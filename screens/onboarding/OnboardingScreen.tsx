import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useProfile } from '../../store/profile';
import { searchAll } from '../../services/spotify';
import AlbumCover from '../../components/AlbumCover';
import { Artist } from '../../services/spotify';
import { Album, Track } from '../../constants/mockData';

const GENRES = [
  { id: 'pop', label: 'Pop', emoji: '🎵' },
  { id: 'rock', label: 'Rock', emoji: '🎸' },
  { id: 'hip-hop', label: 'Hip-Hop', emoji: '🎤' },
  { id: 'rnb', label: 'R&B', emoji: '🎷' },
  { id: 'jazz', label: 'Jazz', emoji: '🎺' },
  { id: 'classical', label: 'Classical', emoji: '🎻' },
  { id: 'electronic', label: 'Electronic', emoji: '🎧' },
  { id: 'country', label: 'Country', emoji: '🤠' },
  { id: 'latin', label: 'Latin', emoji: '💃' },
  { id: 'indie', label: 'Indie', emoji: '🌿' },
  { id: 'metal', label: 'Metal', emoji: '🤘' },
  { id: 'folk', label: 'Folk', emoji: '🪕' },
  { id: 'reggae', label: 'Reggae', emoji: '🌴' },
  { id: 'blues', label: 'Blues', emoji: '🎶' },
  { id: 'k-pop', label: 'K-Pop', emoji: '✨' },
  { id: 'afrobeats', label: 'Afrobeats', emoji: '🥁' },
];

export default function OnboardingScreen() {
  const { profile, createProfile, updateGenres, completeOnboarding, checkUsername } = useProfile();
  // If profile already exists, skip the profile creation step
  const [step, setStep] = useState(profile ? 1 : 0);

  // Step 0: profile
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1: genres
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Step 2: artists
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);

  // Step 3: albums
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  // Step 4: songs
  const [songs, setSongs] = useState<Track[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced username check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (username.length < 3) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    debounceRef.current = setTimeout(async () => {
      const available = await checkUsername(username);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    }, 500);
  }, [username]);

  // Load artists when entering step 2
  useEffect(() => {
    if (step !== 2) return;
    setLoadingArtists(true);
    const query = selectedGenres[0] ?? 'pop';
    searchAll(query)
      .then((r) => setArtists(r.artists.slice(0, 12)))
      .catch(() => {})
      .finally(() => setLoadingArtists(false));
  }, [step]);

  // Load albums when entering step 3
  useEffect(() => {
    if (step !== 3) return;
    setLoadingAlbums(true);
    const query = selectedArtists[0] ?? selectedGenres[0] ?? 'pop';
    searchAll(query)
      .then((r) => setAlbums(r.albums.slice(0, 12)))
      .catch(() => {})
      .finally(() => setLoadingAlbums(false));
  }, [step]);

  // Load songs when entering step 4
  useEffect(() => {
    if (step !== 4) return;
    setLoadingSongs(true);
    const query = selectedGenres[0] ?? 'pop';
    searchAll(query)
      .then((r) => setSongs(r.tracks.slice(0, 12)))
      .catch(() => {})
      .finally(() => setLoadingSongs(false));
  }, [step]);

  async function handleProfileNext() {
    if (!name.trim()) { setProfileError('Please enter your name'); return; }
    if (username.length < 3) { setProfileError('Username must be at least 3 characters'); return; }
    if (!usernameAvailable) { setProfileError('Username is taken'); return; }
    setSaving(true);
    const err = await createProfile({ name: name.trim(), username, avatarUrl: '' });
    setSaving(false);
    if (err) { setProfileError(err); return; }
    setStep(1);
  }

  async function handleFinish() {
    await updateGenres(selectedGenres, selectedArtists);
    await completeOnboarding();
  }

  const totalSteps = 5;
  const progress = (step / (totalSteps - 1)) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Step 0: Profile */}
      {step === 0 && (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.stepTitle}>Create your profile</Text>
            <Text style={styles.stepSub}>How should we call you?</Text>

            {/* Avatar placeholder */}
            <TouchableOpacity style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{name ? name[0].toUpperCase() : '?'}</Text>
              </View>
              <View style={styles.avatarEdit}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>

            {profileError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{profileError}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Display Name</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={Colors.muted}
                  value={name}
                  onChangeText={(t) => { setName(t); setProfileError(null); }}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputWrap, usernameAvailable === false && styles.inputError, usernameAvailable === true && styles.inputSuccess]}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="yourhandle"
                  placeholderTextColor={Colors.muted}
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
                    setProfileError(null);
                  }}
                  autoCapitalize="none"
                />
                {checkingUsername && <ActivityIndicator size="small" color={Colors.muted} />}
                {!checkingUsername && usernameAvailable === true && <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />}
                {!checkingUsername && usernameAvailable === false && <Ionicons name="close-circle" size={18} color="#F44336" />}
              </View>
              {usernameAvailable === false && <Text style={styles.usernameHint}>Username is taken</Text>}
              {usernameAvailable === true && <Text style={[styles.usernameHint, { color: '#4CAF50' }]}>Available!</Text>}
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, (saving || !name || !usernameAvailable) && styles.nextBtnDisabled]}
              onPress={handleProfileNext}
              disabled={saving || !name.trim() || !usernameAvailable}
            >
              {saving ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.nextBtnText}>Continue →</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Step 1: Genres */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.stepTitle}>What do you listen to?</Text>
          <Text style={styles.stepSub}>Pick your genres — this shapes your experience</Text>

          <View style={styles.genreGrid}>
            {GENRES.map((g) => {
              const active = selectedGenres.includes(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => setSelectedGenres((prev) =>
                    active ? prev.filter((x) => x !== g.id) : [...prev, g.id]
                  )}
                >
                  <Text style={styles.genreEmoji}>{g.emoji}</Text>
                  <Text style={[styles.genreLabel, active && styles.genreLabelActive]}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
            <Text style={styles.nextBtnText}>{selectedGenres.length > 0 ? 'Continue →' : 'Skip'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 2: Artists */}
      {step === 2 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.stepTitle}>Follow some artists</Text>
          <Text style={styles.stepSub}>Based on your genres — tap any you love</Text>

          {loadingArtists ? (
            <View style={styles.loadingWrap}><ActivityIndicator color={Colors.primary} size="large" /></View>
          ) : (
            <View style={styles.artistGrid}>
              {artists.map((a) => {
                const active = selectedArtists.includes(a.name);
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.artistCard, active && styles.artistCardActive]}
                    onPress={() => setSelectedArtists((prev) =>
                      active ? prev.filter((x) => x !== a.name) : [...prev, a.name]
                    )}
                  >
                    {a.image ? (
                      <Image source={{ uri: a.image }} style={styles.artistImg} />
                    ) : (
                      <View style={[styles.artistImg, styles.artistImgPlaceholder]}>
                        <Text style={styles.artistInitial}>{a.name[0]}</Text>
                      </View>
                    )}
                    <Text style={styles.artistName} numberOfLines={1}>{a.name}</Text>
                    {active && (
                      <View style={styles.artistCheck}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
            <Text style={styles.nextBtnText}>{selectedArtists.length > 0 ? 'Continue →' : 'Skip'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 3: Albums */}
      {step === 3 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.stepTitle}>Any albums you love?</Text>
          <Text style={styles.stepSub}>Tap to add them to your collection</Text>

          {loadingAlbums ? (
            <View style={styles.loadingWrap}><ActivityIndicator color={Colors.primary} size="large" /></View>
          ) : (
            <View style={styles.albumGrid}>
              {albums.map((a) => {
                const active = selectedAlbums.includes(a.id);
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.albumItem, active && styles.albumItemActive]}
                    onPress={() => setSelectedAlbums((prev) =>
                      active ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                    )}
                  >
                    <AlbumCover album={a} size={150} borderRadius={12} />
                    <Text style={styles.albumTitle} numberOfLines={1}>{a.title}</Text>
                    <Text style={styles.albumArtist} numberOfLines={1}>{a.artist}</Text>
                    {active && (
                      <View style={styles.albumCheck}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(4)}>
            <Text style={styles.nextBtnText}>{selectedAlbums.length > 0 ? 'Continue →' : 'Skip'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 4: Songs */}
      {step === 4 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.stepTitle}>Favorite songs?</Text>
          <Text style={styles.stepSub}>We'll use these to personalize your feed</Text>

          {loadingSongs ? (
            <View style={styles.loadingWrap}><ActivityIndicator color={Colors.primary} size="large" /></View>
          ) : (
            <View style={styles.songList}>
              {songs.map((t) => {
                const active = selectedSongs.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.songRow, active && styles.songRowActive]}
                    onPress={() => setSelectedSongs((prev) =>
                      active ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                    )}
                  >
                    <AlbumCover album={t.album} size={46} borderRadius={8} />
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle} numberOfLines={1}>{t.title}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}>{t.artist}</Text>
                    </View>
                    <View style={[styles.songCheck, active && styles.songCheckActive]}>
                      {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleFinish}>
            <Text style={styles.nextBtnText}>Let's go 🎵</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  progressBar: { height: 3, backgroundColor: Colors.border, marginHorizontal: 0 },
  progressFill: { height: 3, backgroundColor: Colors.primary },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 },
  stepTitle: { color: Colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  stepSub: { color: Colors.muted, fontSize: 14, marginBottom: 28, lineHeight: 20 },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },

  // Avatar
  avatarWrap: { alignSelf: 'center', marginBottom: 28, position: 'relative' },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  avatarInitial: { color: Colors.text, fontSize: 34, fontWeight: '800' },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },

  // Form
  field: { marginBottom: 16 },
  label: { color: Colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  inputError: { borderColor: '#F44336' },
  inputSuccess: { borderColor: '#4CAF50' },
  input: { flex: 1, color: Colors.text, fontSize: 14 },
  atSign: { color: Colors.muted, fontSize: 14, fontWeight: '600' },
  usernameHint: { color: Colors.muted, fontSize: 11, marginTop: 4, marginLeft: 4 },
  errorBanner: {
    backgroundColor: '#FDE8E8', borderRadius: 10, padding: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#F5C6C6',
  },
  errorText: { color: '#B33A3A', fontSize: 13 },

  // Buttons
  nextBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: Colors.background, fontWeight: '800', fontSize: 16 },

  // Genres
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  genreChipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  genreEmoji: { fontSize: 16 },
  genreLabel: { color: Colors.muted, fontSize: 14, fontWeight: '600' },
  genreLabelActive: { color: Colors.primary },

  // Artists
  artistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  artistCard: {
    width: '30%', alignItems: 'center', gap: 6,
    padding: 8, borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    position: 'relative',
  },
  artistCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  artistImg: { width: 70, height: 70, borderRadius: 35 },
  artistImgPlaceholder: { backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  artistInitial: { color: Colors.text, fontSize: 24, fontWeight: '800' },
  artistName: { color: Colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  artistCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },

  // Albums
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  albumItem: {
    width: '47%', gap: 4, position: 'relative',
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 8, borderWidth: 1, borderColor: Colors.border,
  },
  albumItemActive: { borderColor: Colors.primary },
  albumTitle: { color: Colors.text, fontSize: 12, fontWeight: '700' },
  albumArtist: { color: Colors.muted, fontSize: 11 },
  albumCheck: {
    position: 'absolute', top: 14, right: 14,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },

  // Songs
  songList: { gap: 8 },
  songRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  songRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  songInfo: { flex: 1 },
  songTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  songArtist: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  songCheck: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  songCheckActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
});
