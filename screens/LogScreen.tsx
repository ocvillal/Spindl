import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import { Album, Track } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';
import { searchAll } from '../services/deezer';
import { useRatings } from '../store/ratings';

type Mode = 'album' | 'song';

export default function LogScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Log'>>();
  const { logAlbum, logSong } = useRatings();

  const preAlbum = route.params?.album;
  const preTrack = route.params?.track;

  const [mode, setMode] = useState<Mode>(preTrack ? 'song' : 'album');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ albums: Album[]; tracks: Track[] }>({ albums: [], tracks: [] });
  const [searching, setSearching] = useState(false);

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(preAlbum ?? null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(preTrack ?? null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [liked, setLiked] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isInitialMount = useRef(true);

  // Reset selection when mode changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setSearchQuery('');
    setSearchResults({ albums: [], tracks: [] });
    setSelectedAlbum(null);
    setSelectedTrack(null);
    setRating(0);
    setReview('');
    setLiked(false);
  }, [mode]);

  // Debounced Spotify search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) { setSearchResults({ albums: [], tracks: [] }); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchAll(searchQuery)
        .then((r) => setSearchResults({ albums: r.albums, tracks: r.tracks }))
        .catch(() => setSearchResults({ albums: [], tracks: [] }))
        .finally(() => setSearching(false));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const hasSelection = mode === 'album' ? !!selectedAlbum : !!selectedTrack;
  const canSave = hasSelection && rating > 0;

  function handleSave() {
    if (mode === 'album' && selectedAlbum) {
      logAlbum(selectedAlbum, rating, review, liked);
    } else if (mode === 'song' && selectedTrack) {
      logSong(selectedTrack, rating, review, liked);
    }
    navigation.goBack();
  }

  const results = mode === 'album' ? searchResults.albums : searchResults.tracks;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Nav bar ── */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navClose}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Log {mode === 'album' ? 'Album' : 'Song'}</Text>
        <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} disabled={!canSave} onPress={handleSave}>
          <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Mode toggle ── */}
        <View style={styles.modeToggle}>
          {(['album', 'song'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Ionicons
                name={m === 'album' ? 'disc-outline' : 'musical-note-outline'}
                size={16}
                color={mode === m ? colors.primary : colors.muted}
              />
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === 'album' ? 'Album' : 'Song'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Search ── */}
        <View style={styles.section}>
          <Text style={styles.label}>{mode === 'album' ? 'Album' : 'Song'}</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={mode === 'album' ? 'Search albums...' : 'Search songs...'}
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searching && <ActivityIndicator size="small" color={colors.muted} />}
          </View>

          {results.length > 0 && (
            <View style={styles.searchResults}>
              {results.slice(0, 5).map((item) => {
                const isAlbum = mode === 'album';
                const album = isAlbum ? (item as Album) : (item as Track).album;
                const title = isAlbum ? (item as Album).title : (item as Track).title;
                const sub = isAlbum ? (item as Album).artist : (item as Track).artist;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultRow}
                    onPress={() => {
                      if (isAlbum) { setSelectedAlbum(item as Album); }
                      else { setSelectedTrack(item as Track); }
                      setSearchQuery('');
                      setSearchResults({ albums: [], tracks: [] });
                    }}
                  >
                    <AlbumCover album={album} size={40} borderRadius={6} />
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle} numberOfLines={1}>{title}</Text>
                      <Text style={styles.resultArtist} numberOfLines={1}>{sub}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Selected item ── */}
        {hasSelection && (
          <View style={styles.selectedCard}>
            <AlbumCover
              album={mode === 'album' ? selectedAlbum! : selectedTrack!.album}
              size={72}
              borderRadius={12}
            />
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedTitle} numberOfLines={1}>
                {mode === 'album' ? selectedAlbum!.title : selectedTrack!.title}
              </Text>
              <Text style={styles.selectedArtist} numberOfLines={1}>
                {mode === 'album' ? selectedAlbum!.artist : selectedTrack!.artist}
              </Text>
              {mode === 'song' && selectedTrack && (
                <Text style={styles.selectedMeta} numberOfLines={1}>{selectedTrack.album.title}</Text>
              )}
              {mode === 'album' && selectedAlbum && (
                <Text style={styles.selectedMeta}>{selectedAlbum.year}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => { mode === 'album' ? setSelectedAlbum(null) : setSelectedTrack(null); setRating(0); }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Rating ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={rating} size={36} interactive onRate={setRating} />
            {rating > 0 && <Text style={styles.ratingLabel}>{rating} / 5</Text>}
          </View>
          {rating === 0 && <Text style={styles.ratingHint}>Tap a star to rate</Text>}
        </View>

        {/* ── Liked ── */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.likeToggle, liked && styles.likeToggleActive]} onPress={() => setLiked(!liked)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.primary : colors.muted} />
            <Text style={[styles.likeText, liked && styles.likeTextActive]}>{liked ? 'Loved it' : 'Add to favorites'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Review ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Review <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="What did you think? Share your thoughts..."
            placeholderTextColor={colors.muted}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{review.length} / 500</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    navClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    navTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
    saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
    saveBtnDisabled: { backgroundColor: colors.surface },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    saveBtnTextDisabled: { color: colors.muted },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },

    modeToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    modeBtnActive: { backgroundColor: colors.primaryDim },
    modeBtnText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
    modeBtnTextActive: { color: colors.primary },

    section: { marginBottom: 24 },
    label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
    optional: { color: colors.muted, fontWeight: '400' },

    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: colors.border },
    searchInput: { flex: 1, color: colors.text, fontSize: 14 },
    searchResults: { backgroundColor: colors.surface, borderRadius: 12, marginTop: 4, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    searchResultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    resultText: { flex: 1 },
    resultTitle: { color: colors.text, fontWeight: '600', fontSize: 13 },
    resultArtist: { color: colors.muted, fontSize: 12, marginTop: 1 },

    selectedCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: colors.primary + '40' },
    selectedInfo: { flex: 1 },
    selectedTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
    selectedArtist: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    selectedMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },

    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    ratingLabel: { color: colors.accent, fontSize: 16, fontWeight: '700' },
    ratingHint: { color: colors.muted, fontSize: 12, marginTop: 6 },
    likeToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
    likeToggleActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
    likeText: { color: colors.muted, fontSize: 14, fontWeight: '500' },
    likeTextActive: { color: colors.primary, fontWeight: '700' },
    reviewInput: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, color: colors.text, fontSize: 14, lineHeight: 21, minHeight: 120, borderWidth: 1, borderColor: colors.border },
    charCount: { color: colors.muted, fontSize: 12, textAlign: 'right', marginTop: 6 },
  });
}
