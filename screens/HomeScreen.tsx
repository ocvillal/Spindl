import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import {
  MOCK_USERS, MOCK_ALBUM_REVIEWS, MOCK_SONG_REVIEWS,
  Album, Track, AlbumReview, SongReview,
} from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import Avatar from '../components/Avatar';
import StarRating from '../components/StarRating';
import { seedWeeklyChart, getTopTracksForPeriod, getTopAlbumsForPeriod } from '../services/charts';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type HomeTab = 'albums' | 'songs' | 'albumReviews' | 'songReviews' | null;

const TABS: { key: Exclude<HomeTab, null>; label: string }[] = [
  { key: 'albums', label: 'Albums' },
  { key: 'songs', label: 'Songs' },
  { key: 'albumReviews', label: 'Album Reviews' },
  { key: 'songReviews', label: 'Song Reviews' },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<HomeTab>(null);
  const [trendingAlbums, setTrendingAlbums] = useState<Album[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const me = MOCK_USERS[0];

  useEffect(() => {
    seedWeeklyChart().catch(() => {});
    loadCharts();
  }, []);

  async function loadCharts() {
    setLoadingCharts(true);
    try {
      const [albums, tracks] = await Promise.all([
        getTopAlbumsForPeriod('week', 10),
        getTopTracksForPeriod('week', 10),
      ]);
      setTrendingAlbums(albums);
      setTopTracks(tracks);
    } catch (e: any) {
      console.error('[HomeScreen] chart load error:', e?.message ?? e);
    }
    setLoadingCharts(false);
  }

  const toggleTab = (tab: Exclude<HomeTab, null>) =>
    setActiveTab((prev) => (prev === tab ? null : tab));

  const showAlbums = activeTab === null || activeTab === 'albums';
  const showSongs = activeTab === null || activeTab === 'songs';
  const showAlbumReviews = activeTab === null || activeTab === 'albumReviews';
  const showSongReviews = activeTab === null || activeTab === 'songReviews';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>spindl</Text>
            <Text style={styles.subtitle}>what's spinning</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <Avatar user={me} size={34} />
          </View>
        </View>

        {/* ── Quick Log CTA ── */}
        <TouchableOpacity style={styles.logCta} onPress={() => navigation.navigate('Log')} activeOpacity={0.85}>
          {trendingAlbums[0] && <AlbumCover album={trendingAlbums[0]} size={40} borderRadius={10} />}
          <Text style={styles.logCtaText}>What did you listen to?</Text>
          <View style={styles.logCtaBtn}>
            <Ionicons name="add" size={20} color={colors.background} />
          </View>
        </TouchableOpacity>


        {/* ── Tab Chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabChip, activeTab === t.key && styles.tabChipActive]}
              onPress={() => toggleTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Top Albums ── */}
        {showAlbums && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Top Albums</Text>
              {activeTab === null && trendingAlbums.length > 0 && (
                <TouchableOpacity onPress={() => toggleTab('albums')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingCharts ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : activeTab === null ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {trendingAlbums.map((album) => (
                  <TouchableOpacity key={album.id} style={styles.albumCard} onPress={() => navigation.navigate('AlbumDetail', { id: album.id, query: `${album.title} ${album.artist}` })} activeOpacity={0.8}>
                    <AlbumCover album={album} size={130} borderRadius={14} />
                    <Text style={styles.albumCardTitle} numberOfLines={1}>{album.title}</Text>
                    <Text style={styles.albumCardArtist} numberOfLines={1}>{album.artist}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.albumsGrid}>
                {trendingAlbums.map((album) => (
                  <TouchableOpacity key={album.id} style={styles.albumGridItem} onPress={() => navigation.navigate('AlbumDetail', { id: album.id, query: `${album.title} ${album.artist}` })} activeOpacity={0.8}>
                    <AlbumCover album={album} size={160} borderRadius={14} />
                    <Text style={styles.albumCardTitle} numberOfLines={1}>{album.title}</Text>
                    <Text style={styles.albumCardArtist} numberOfLines={1}>{album.artist}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Top Songs ── */}
        {showSongs && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Top Singles</Text>
              {activeTab === null && topTracks.length > 0 && (
                <TouchableOpacity onPress={() => toggleTab('songs')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingCharts ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.songsCard}>
                {(activeTab === null ? topTracks.slice(0, 5) : topTracks).map((track, idx) => (
                  <TouchableOpacity
                    key={track.id}
                    style={[styles.songRow, idx > 0 && styles.songRowBorder]}
                    onPress={() => navigation.navigate('Log', { track })}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.songRank, idx < 3 && styles.songRankTop]}>{idx + 1}</Text>
                    <AlbumCover album={track.album} size={44} borderRadius={8} />
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle} numberOfLines={1}>{track.title}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}>{track.artist}</Text>
                    </View>
                    <Text style={styles.songDuration}>{track.duration}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Album Reviews ── */}
        {showAlbumReviews && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Popular Album Reviews</Text>
              {activeTab === null && (
                <TouchableOpacity onPress={() => toggleTab('albumReviews')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>
            {(activeTab === null ? MOCK_ALBUM_REVIEWS.slice(0, 2) : MOCK_ALBUM_REVIEWS).map((review: AlbumReview) => (
              <TouchableOpacity key={review.id} style={styles.reviewCard} onPress={() => navigation.navigate('AlbumDetail', { id: review.album.id })} activeOpacity={0.85}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewUser}>
                    <Avatar user={review.user} size={28} />
                    <View>
                      <Text style={styles.reviewUserName}>{review.user.name}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewLikesRow}>
                    <Ionicons name="heart" size={13} color={colors.primary} />
                    <Text style={styles.reviewLikesCount}>{review.likes}</Text>
                  </View>
                </View>
                <View style={styles.reviewSubject}>
                  <AlbumCover album={review.album} size={50} borderRadius={8} />
                  <View style={styles.reviewSubjectInfo}>
                    <Text style={styles.reviewSubjectTitle}>{review.album.title}</Text>
                    <Text style={styles.reviewSubjectSub}>{review.album.artist}</Text>
                    <StarRating rating={review.rating} size={13} />
                  </View>
                </View>
                <Text style={styles.reviewText} numberOfLines={activeTab === null ? 2 : 5}>"{review.text}"</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Song Reviews ── */}
        {showSongReviews && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Song Reviews</Text>
              {activeTab === null && (
                <TouchableOpacity onPress={() => toggleTab('songReviews')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>
            {(activeTab === null ? MOCK_SONG_REVIEWS.slice(0, 2) : MOCK_SONG_REVIEWS).map((review: SongReview) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewUser}>
                    <Avatar user={review.user} size={28} />
                    <View>
                      <Text style={styles.reviewUserName}>{review.user.name}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewLikesRow}>
                    <Ionicons name="heart" size={13} color={colors.primary} />
                    <Text style={styles.reviewLikesCount}>{review.likes}</Text>
                  </View>
                </View>
                <View style={styles.reviewSubject}>
                  <AlbumCover album={review.track.album} size={50} borderRadius={8} />
                  <View style={styles.reviewSubjectInfo}>
                    <Text style={styles.reviewSubjectTitle}>{review.track.title}</Text>
                    <Text style={styles.reviewSubjectSub}>{review.track.artist}</Text>
                    <StarRating rating={review.rating} size={13} />
                  </View>
                </View>
                <Text style={styles.reviewText} numberOfLines={activeTab === null ? 2 : 5}>"{review.text}"</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: 32, paddingTop: 8 },

    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 16, paddingHorizontal: 16, paddingTop: 4,
    },
    appName: { color: colors.primary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: colors.muted, fontSize: 12, marginTop: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtn: { position: 'relative' },
    notifDot: {
      position: 'absolute', top: -1, right: -1,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: colors.primary, borderWidth: 1.5, borderColor: colors.background,
    },

    logCta: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: 14, padding: 10, gap: 12, marginBottom: 16, marginHorizontal: 16,
    },
    logCtaText: { flex: 1, color: colors.muted, fontSize: 14 },
    logCtaBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    },

    // Period picker
    periodRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, marginBottom: 14,
    },
    periodLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    segment: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRightWidth: 1, borderRightColor: colors.border,
    },
    segmentFirst: { borderLeftWidth: 0 },
    segmentLast: { borderRightWidth: 0 },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    segmentTextActive: { color: colors.background, fontWeight: '700' },

    tabBar: { gap: 8, paddingHorizontal: 16, paddingRight: 24, marginBottom: 20 },
    tabChip: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    tabChipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
    tabText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: colors.primary },

    section: { marginBottom: 28, paddingHorizontal: 16 },
    sectionRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
    },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
    seeAll: { color: colors.primary, fontSize: 13, fontWeight: '600' },

    hScroll: { gap: 12, paddingRight: 4 },
    albumCard: { width: 134, gap: 6 },
    albumCardTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
    albumCardArtist: { color: colors.muted, fontSize: 12, marginBottom: 2 },
    albumsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    albumGridItem: { width: '47%', gap: 6 },

    songsCard: {
      backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border,
    },
    songRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    songRowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
    songRank: { color: colors.muted, fontSize: 14, fontWeight: '700', width: 20, textAlign: 'center' },
    songRankTop: { color: colors.primary },
    songInfo: { flex: 1 },
    songTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
    songArtist: { color: colors.muted, fontSize: 12, marginTop: 2 },
    songDuration: { color: colors.muted, fontSize: 11 },

    reviewCard: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 14,
      marginBottom: 10, gap: 12, borderWidth: 1, borderColor: colors.border,
    },
    reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    reviewUserName: { color: colors.text, fontWeight: '700', fontSize: 13 },
    reviewDate: { color: colors.muted, fontSize: 11, marginTop: 1 },
    reviewLikesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewLikesCount: { color: colors.muted, fontSize: 12 },
    reviewSubject: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 10,
    },
    reviewSubjectInfo: { flex: 1, gap: 3 },
    reviewSubjectTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
    reviewSubjectSub: { color: colors.textSecondary, fontSize: 12 },
    reviewText: { color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  });
}
