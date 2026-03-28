import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import { Album } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import { Artist, SearchResults, searchAll } from '../services/spotify';
import { getTopAlbums } from '../services/deezer';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterType = 'all' | 'albums' | 'songs' | 'artists';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'albums', label: 'Albums' },
  { key: 'songs', label: 'Songs' },
  { key: 'artists', label: 'Artists' },
];

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<SearchResults>({ albums: [], tracks: [], artists: [] });
  const [trending, setTrending] = useState<Album[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getTopAlbums(10).then(setTrending).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults({ albums: [], tracks: [], artists: [] });
      setSearching(false);
      setSearchError(null);
      return;
    }
    setSearching(true);
    setSearchError(null);
    debounceRef.current = setTimeout(() => {
      searchAll(query)
        .then((r) => { setResults(r); setSearchError(null); })
        .catch((e) => {
          console.error('[Spotify search error]', e?.message ?? e);
          setSearchError(e?.message ?? 'Search failed');
          setResults({ albums: [], tracks: [], artists: [] });
        })
        .finally(() => setSearching(false));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const showAlbums = filter === 'all' || filter === 'albums';
  const showSongs = filter === 'all' || filter === 'songs';
  const showArtists = filter === 'all' || filter === 'artists';
  const totalResults =
    (showAlbums ? results.albums.length : 0) +
    (showSongs ? results.tracks.length : 0) +
    (showArtists ? results.artists.length : 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Search</Text>

        {/* ── Search bar ── */}
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Albums, artists, songs..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={(t) => { setQuery(t); setFilter('all'); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {query.length > 1 ? (
          <>
            {/* ── Filter chips ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {searching ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : searchError ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>{searchError}</Text>
              </View>
            ) : totalResults === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>Nothing found for "{query}"</Text>
              </View>
            ) : (
              <>
                {/* ── Albums ── */}
                {showAlbums && results.albums.length > 0 && (
                  <View style={styles.section}>
                    {filter === 'all' && <Text style={styles.sectionTitle}>Albums</Text>}
                    {results.albums.map((album) => (
                      <View key={album.id} style={styles.resultRow}>
                        <TouchableOpacity
                          style={styles.resultRowMain}
                          onPress={() => navigation.navigate('AlbumDetail', { id: album.id })}
                          activeOpacity={0.75}
                        >
                          <AlbumCover album={album} size={50} borderRadius={8} />
                          <View style={styles.resultInfo}>
                            <Text style={styles.resultTitle} numberOfLines={1}>{album.title}</Text>
                            <Text style={styles.resultSub} numberOfLines={1}>{album.artist} · {album.year}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.logBtn}
                          onPress={() => navigation.navigate('Log', { album })}
                        >
                          <Ionicons name="add" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── Songs ── */}
                {showSongs && results.tracks.length > 0 && (
                  <View style={styles.section}>
                    {filter === 'all' && <Text style={styles.sectionTitle}>Songs</Text>}
                    {results.tracks.map((track) => (
                      <View key={track.id} style={styles.resultRow}>
                        <TouchableOpacity
                          style={styles.resultRowMain}
                          onPress={() => navigation.navigate('AlbumDetail', { id: track.album.id })}
                          activeOpacity={0.75}
                        >
                          <AlbumCover album={track.album} size={50} borderRadius={8} />
                          <View style={styles.resultInfo}>
                            <Text style={styles.resultTitle} numberOfLines={1}>{track.title}</Text>
                            <Text style={styles.resultSub} numberOfLines={1}>{track.artist}</Text>
                          </View>
                          <Text style={styles.duration}>{track.duration}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.logBtn}
                          onPress={() => navigation.navigate('Log', { track })}
                        >
                          <Ionicons name="add" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── Artists ── */}
                {showArtists && results.artists.length > 0 && (
                  <View style={styles.section}>
                    {filter === 'all' && <Text style={styles.sectionTitle}>Artists</Text>}
                    {results.artists.map((artist) => (
                      <View key={artist.id} style={styles.resultRow}>
                        {artist.image ? (
                          <Image source={{ uri: artist.image }} style={styles.artistImage} />
                        ) : (
                          <View style={styles.artistImagePlaceholder}>
                            <Text style={styles.artistInitial}>{artist.name.charAt(0)}</Text>
                          </View>
                        )}
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultTitle} numberOfLines={1}>{artist.name}</Text>
                          <Text style={styles.resultSub} numberOfLines={1}>
                            {artist.genres.slice(0, 2).join(', ') || 'Artist'}
                            {artist.followersCount > 0 ? ` · ${formatFollowers(artist.followersCount)}` : ''}
                          </Text>
                        </View>
                        <Ionicons name="person" size={16} color={colors.muted} />
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* ── New Releases ── */}
            {trending.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>New Releases</Text>
                  <Ionicons name="flame" size={16} color={colors.accent} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
                  {trending.map((album, idx) => (
                    <TouchableOpacity
                      key={album.id}
                      style={styles.trendingCard}
                      onPress={() => navigation.navigate('AlbumDetail', { id: album.id })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.trendingRank}>
                        <Text style={styles.trendingRankText}>{idx + 1}</Text>
                      </View>
                      <AlbumCover album={album} size={120} borderRadius={14} />
                      <Text style={styles.trendingTitle} numberOfLines={1}>{album.title}</Text>
                      <Text style={styles.trendingArtist} numberOfLines={1}>{album.artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
    title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
      marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    searchBarFocused: { borderColor: colors.primary },
    searchInput: { flex: 1, color: colors.text, fontSize: 15 },
    filterScroll: { gap: 8, paddingRight: 8, marginBottom: 16 },
    filterChip: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    filterChipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
    filterText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
    filterTextActive: { color: colors.primary, fontWeight: '700' },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 10 },
    resultRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 14, marginBottom: 8, overflow: 'hidden',
    },
    resultRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    logBtn: {
      paddingHorizontal: 14, paddingVertical: 12,
      borderLeftWidth: 1, borderLeftColor: colors.border,
      justifyContent: 'center', alignItems: 'center',
    },
    resultInfo: { flex: 1, gap: 3 },
    resultTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
    resultSub: { color: colors.textSecondary, fontSize: 12 },
    duration: { color: colors.muted, fontSize: 12 },
    artistImage: { width: 50, height: 50, borderRadius: 25 },
    artistImagePlaceholder: {
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
    },
    artistInitial: { color: colors.text, fontSize: 20, fontWeight: '700' },
    trendingScroll: { gap: 14, paddingRight: 8 },
    trendingCard: { width: 130, gap: 6, position: 'relative' },
    trendingRank: {
      position: 'absolute', top: 8, left: 8, zIndex: 1,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center',
    },
    trendingRankText: { color: colors.text, fontSize: 11, fontWeight: '700' },
    trendingTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
    trendingArtist: { color: colors.muted, fontSize: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  });
}
