import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import { Album, Track } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import { DeezerArtistDetail, findArtistByName, getArtistById, getArtistAlbums, getArtistTopTracks, cleanTitle } from '../services/deezer';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ArtistDetail'>;

function formatFanCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function normalizeTitle(title: string): string {
  return cleanTitle(title).toLowerCase();
}

function deduplicateAlbums(albums: Album[]): Album[] {
  const seen = new Map<string, Album>();
  for (const album of albums) {
    const key = normalizeTitle(album.title);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, album);
    } else {
      const yr = album.year ?? 0;
      const exYr = existing.year ?? 0;
      // Prefer earliest year (original release)
      if (yr > 0 && (exYr === 0 || yr < exYr)) {
        seen.set(key, album);
      } else if (yr === exYr && album.title.length < existing.title.length) {
        seen.set(key, album);
      }
    }
  }
  return [...seen.values()];
}

function deduplicateTracks(tracks: Track[]): Track[] {
  const seen = new Map<string, Track>();
  for (const track of tracks) {
    const key = normalizeTitle(track.title);
    const existing = seen.get(key);
    if (!existing || track.title.length < existing.title.length) {
      seen.set(key, track);
    }
  }
  return [...seen.values()];
}

export default function ArtistScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const { id, name } = useRoute<Route>().params;

  const [artist, setArtist] = useState<DeezerArtistDetail | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const resolveArtist = id ? getArtistById(id) : findArtistByName(name);
    resolveArtist
      .then((a) => {
        setArtist(a);
        return Promise.all([getArtistAlbums(a.id, 50), getArtistTopTracks(a.id, 10)]);
      })
      .then(([fetchedAlbums, fetchedTracks]) => {
        setAlbums(deduplicateAlbums(fetchedAlbums));
        setTopTracks(deduplicateTracks(fetchedTracks));
      })
      .catch((e) => console.error('[ArtistScreen]', e?.message ?? e))
      .finally(() => setLoading(false));
  }, [id, name]);

  if (loading || !artist) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Artist hero */}
        <View style={styles.hero}>
          {artist.image ? (
            <Image source={{ uri: artist.image }} style={styles.artistImage} />
          ) : (
            <View style={[styles.artistImage, styles.artistImagePlaceholder]}>
              <Text style={styles.artistInitial}>{artist.name[0]}</Text>
            </View>
          )}
          <Text style={styles.artistName}>{artist.name}</Text>
          <View style={styles.statsRow}>
            {artist.fanCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={14} color={colors.muted} />
                <Text style={styles.statText}>{formatFanCount(artist.fanCount)} fans</Text>
              </View>
            )}
            {artist.albumCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="disc-outline" size={14} color={colors.muted} />
                <Text style={styles.statText}>{artist.albumCount} albums</Text>
              </View>
            )}
          </View>
        </View>

        {/* Top Tracks */}
        {topTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Tracks</Text>
            {topTracks.map((track, idx) => (
              <TouchableOpacity
                key={track.id}
                style={styles.trackRow}
                onPress={() => navigation.navigate('AlbumDetail', { id: track.album.id, query: `${track.title} ${track.artist}` })}
              >
                <Text style={styles.trackNum}>{idx + 1}</Text>
                <AlbumCover album={track.album} size={44} borderRadius={4} />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{cleanTitle(track.title)}</Text>
                  <Text style={styles.trackMeta} numberOfLines={1}>{cleanTitle(track.album.title)}</Text>
                </View>
                <Text style={styles.trackDuration}>{track.duration}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Discography */}
        {albums.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discography</Text>
            <View style={styles.albumGrid}>
              {albums.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.albumItem}
                  onPress={() => navigation.navigate('AlbumDetail', { id: album.id })}
                >
                  <AlbumCover album={album} size={150} borderRadius={4} />
                  <Text style={styles.albumTitle} numberOfLines={1}>{cleanTitle(album.title)}</Text>
                  {album.year > 0 && <Text style={styles.albumYear}>{album.year}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 40 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },

    // Hero
    hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 12 },
    artistImage: { width: 160, height: 160, borderRadius: 6, borderWidth: 2, borderColor: colors.border },
    artistImagePlaceholder: { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
    artistInitial: { color: colors.text, fontSize: 60, fontWeight: '900' },
    artistName: { color: colors.text, fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 20 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statText: { color: colors.muted, fontSize: 13 },

    // Sections
    section: { paddingHorizontal: 20, marginBottom: 28 },
    sectionTitle: { color: colors.text, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },

    // Top Tracks
    trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
    trackNum: { color: colors.muted, fontSize: 12, width: 18, textAlign: 'right' },
    trackInfo: { flex: 1, gap: 2 },
    trackTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
    trackMeta: { color: colors.muted, fontSize: 12 },
    trackDuration: { color: colors.muted, fontSize: 12 },

    // Discography
    albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    albumItem: { width: '47%', gap: 5 },
    albumTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
    albumYear: { color: colors.muted, fontSize: 11 },
  });
}
