import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import {
  MOCK_ALBUMS,
  MOCK_USERS,
  MOCK_SONGS,
  MOCK_ALBUM_REVIEWS,
  MOCK_SONG_REVIEWS,
  TRENDING_ALBUMS,
  AlbumReview,
  SongReview,
} from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import Avatar from '../components/Avatar';
import StarRating from '../components/StarRating';
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
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<HomeTab>(null);
  const me = MOCK_USERS[0];

  const toggleTab = (tab: Exclude<HomeTab, null>) =>
    setActiveTab((prev) => (prev === tab ? null : tab));

  const showAlbums = activeTab === null || activeTab === 'albums';
  const showSongs = activeTab === null || activeTab === 'songs';
  const showAlbumReviews = activeTab === null || activeTab === 'albumReviews';
  const showSongReviews = activeTab === null || activeTab === 'songReviews';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>spindl</Text>
            <Text style={styles.subtitle}>what's spinning</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color={Colors.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <Avatar user={me} size={34} />
          </View>
        </View>

        {/* ── Quick Log CTA ── */}
        <TouchableOpacity
          style={styles.logCta}
          onPress={() => navigation.navigate('Log')}
          activeOpacity={0.85}
        >
          <AlbumCover album={MOCK_ALBUMS[0]} size={40} borderRadius={10} />
          <Text style={styles.logCtaText}>What did you listen to?</Text>
          <View style={styles.logCtaBtn}>
            <Ionicons name="add" size={20} color={Colors.background} />
          </View>
        </TouchableOpacity>

        {/* ── Tab Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabChip, activeTab === t.key && styles.tabChipActive]}
              onPress={() => toggleTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Trending Albums ── */}
        {showAlbums && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Trending Albums</Text>
              {activeTab === null && (
                <TouchableOpacity onPress={() => toggleTab('albums')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {activeTab === null ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
              >
                {TRENDING_ALBUMS.map((album) => (
                  <TouchableOpacity
                    key={album.id}
                    style={styles.albumCard}
                    onPress={() => navigation.navigate('AlbumDetail', { id: album.id })}
                    activeOpacity={0.8}
                  >
                    <AlbumCover album={album} size={130} borderRadius={14} />
                    <Text style={styles.albumCardTitle} numberOfLines={1}>{album.title}</Text>
                    <Text style={styles.albumCardArtist} numberOfLines={1}>{album.artist}</Text>
                    <StarRating rating={4.2} size={11} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.albumsGrid}>
                {MOCK_ALBUMS.map((album) => (
                  <TouchableOpacity
                    key={album.id}
                    style={styles.albumGridItem}
                    onPress={() => navigation.navigate('AlbumDetail', { id: album.id })}
                    activeOpacity={0.8}
                  >
                    <AlbumCover album={album} size={160} borderRadius={14} />
                    <Text style={styles.albumCardTitle} numberOfLines={1}>{album.title}</Text>
                    <Text style={styles.albumCardArtist} numberOfLines={1}>{album.artist}</Text>
                    <StarRating rating={4.2} size={11} />
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
              <Text style={styles.sectionTitle}>Top Songs This Week</Text>
              {activeTab === null && (
                <TouchableOpacity onPress={() => toggleTab('songs')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.songsCard}>
              {(activeTab === null ? MOCK_SONGS.slice(0, 5) : MOCK_SONGS).map((track, idx) => (
                <View
                  key={track.id}
                  style={[styles.songRow, idx > 0 && styles.songRowBorder]}
                >
                  <Text style={[styles.songRank, idx < 3 && styles.songRankTop]}>
                    {idx + 1}
                  </Text>
                  <AlbumCover album={track.album} size={44} borderRadius={8} />
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.songArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <View style={styles.songMeta}>
                    <Text style={styles.songPlays}>{track.playsCount}</Text>
                    <Text style={styles.songDuration}>{track.duration}</Text>
                  </View>
                </View>
              ))}
            </View>
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
            {(activeTab === null ? MOCK_ALBUM_REVIEWS.slice(0, 2) : MOCK_ALBUM_REVIEWS).map(
              (review: AlbumReview) => (
                <TouchableOpacity
                  key={review.id}
                  style={styles.reviewCard}
                  onPress={() => navigation.navigate('AlbumDetail', { id: review.album.id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.reviewTop}>
                    <View style={styles.reviewUser}>
                      <Avatar user={review.user} size={28} />
                      <View>
                        <Text style={styles.reviewUserName}>{review.user.name}</Text>
                        <Text style={styles.reviewDate}>{review.date}</Text>
                      </View>
                    </View>
                    <View style={styles.reviewLikesRow}>
                      <Ionicons name="heart" size={13} color={Colors.primary} />
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
                  <Text style={styles.reviewText} numberOfLines={activeTab === null ? 2 : 5}>
                    "{review.text}"
                  </Text>
                </TouchableOpacity>
              )
            )}
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
            {(activeTab === null ? MOCK_SONG_REVIEWS.slice(0, 2) : MOCK_SONG_REVIEWS).map(
              (review: SongReview) => (
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
                      <Ionicons name="heart" size={13} color={Colors.primary} />
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
                  <Text style={styles.reviewText} numberOfLines={activeTab === null ? 2 : 5}>
                    "{review.text}"
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 32, paddingTop: 8 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  appName: { color: Colors.primary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.muted, fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { position: 'relative' },
  notifDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  // Log CTA
  logCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 10,
    gap: 12,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  logCtaText: { flex: 1, color: Colors.muted, fontSize: 14 },
  logCtaBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab bar
  tabBar: { gap: 8, paddingHorizontal: 16, paddingRight: 24, marginBottom: 20 },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tabText: { color: Colors.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },

  // Sections
  section: { marginBottom: 28, paddingHorizontal: 16 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  seeAll: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  // Horizontal album scroll
  hScroll: { gap: 12, paddingRight: 4 },
  albumCard: { width: 134, gap: 6 },
  albumCardTitle: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  albumCardArtist: { color: Colors.muted, fontSize: 12, marginBottom: 2 },

  // Albums grid (full tab)
  albumsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  albumGridItem: { width: '47%', gap: 6 },

  // Songs
  songsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  songRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  songRowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  songRank: { color: Colors.muted, fontSize: 14, fontWeight: '700', width: 20, textAlign: 'center' },
  songRankTop: { color: Colors.primary },
  songInfo: { flex: 1 },
  songTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  songArtist: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  songMeta: { alignItems: 'flex-end', gap: 3 },
  songPlays: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  songDuration: { color: Colors.muted, fontSize: 11 },

  // Reviews
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewUserName: { color: Colors.text, fontWeight: '700', fontSize: 13 },
  reviewDate: { color: Colors.muted, fontSize: 11, marginTop: 1 },
  reviewLikesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewLikesCount: { color: Colors.muted, fontSize: 12 },
  reviewSubject: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceAlt, borderRadius: 10, padding: 10 },
  reviewSubjectInfo: { flex: 1, gap: 3 },
  reviewSubjectTitle: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  reviewSubjectSub: { color: Colors.textSecondary, fontSize: 12 },
  reviewText: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
});
