import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import { Album, Track, MOCK_USERS } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import Avatar from '../components/Avatar';
import StarRating from '../components/StarRating';
import { getAlbumWithTracks, findAndLoadAlbum, cleanTitle } from '../services/deezer';
import { useRatings } from '../store/ratings';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AlbumDetail'>;

export default function AlbumDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id, query } = route.params;

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<{ track: Track; index: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    const isDeezerNumericId = /^\d+$/.test(id);
    const resolve = isDeezerNumericId
      ? getAlbumWithTracks(id)
      : findAndLoadAlbum(query ?? id);
    resolve
      .then(({ album, tracks }) => { setAlbum(album); setTracks(tracks); })
      .catch((e) => console.error('[Album detail error]', e?.message ?? e))
      .finally(() => setLoading(false));
  }, [id]);

  const { getAlbumEntry } = useRatings();
  const myEntry = getAlbumEntry(id);
  const friendsListened = MOCK_USERS.slice(1, 4);
  const avgRating = 4.2;

  if (loading || !album) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <LinearGradient colors={[album.coverGradient[0], colors.background]} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          <AlbumCover album={album} size={180} borderRadius={20} />
        </View>

        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{album.title}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ArtistDetail', { name: album.artist })}>
            <Text style={styles.albumArtist}>{album.artist}</Text>
          </TouchableOpacity>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>{album.year}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>{album.trackCount} tracks</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>{album.duration}</Text>
          </View>
          <View style={styles.genreTags}>
            {album.genre.map((g) => (
              <View key={g} style={styles.genreTag}>
                <Text style={styles.genreTagText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ratingSection}>
          <View style={styles.communityRating}>
            <Text style={styles.avgRatingNum}>{avgRating}</Text>
            <View style={styles.ratingRight}>
              <StarRating rating={avgRating} size={16} />
              <Text style={styles.ratingCount}>2.4k ratings</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.logBtn} onPress={() => navigation.navigate('Log', { album })}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.logBtnText}>{myEntry ? 'Update Log' : 'Log Album'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconAction, liked && styles.iconActionActive]} onPress={() => setLiked(!liked)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.primary : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction}>
            <Ionicons name="bookmark-outline" size={22} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction}>
            <Ionicons name="paper-plane-outline" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {myEntry && (
          <View style={styles.myEntrySection}>
            <Text style={styles.sectionTitle}>Your Log</Text>
            <View style={styles.myEntryCard}>
              <View style={styles.myEntryHeader}>
                <StarRating rating={myEntry.rating} size={16} />
                <Text style={styles.myEntryDate}>{myEntry.date}</Text>
              </View>
              {myEntry.review && <Text style={styles.myEntryReview}>"{myEntry.review}"</Text>}
              <TouchableOpacity style={styles.editEntryBtn}>
                <Text style={styles.editEntryText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends Listened</Text>
          <View style={styles.friendsListened}>
            {friendsListened.map((user) => (
              <View key={user.id} style={styles.friendListenRow}>
                <Avatar user={user} size={40} showOnline />
                <View style={styles.friendListenInfo}>
                  <Text style={styles.friendListenName}>{user.name}</Text>
                  <StarRating rating={3.5} size={12} />
                </View>
                <TouchableOpacity style={styles.recommendBtn}>
                  <Ionicons name="paper-plane-outline" size={16} color={colors.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {tracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracks</Text>
            {tracks.map((track, idx) => (
              <TouchableOpacity key={track.id} style={styles.trackRow} onPress={() => setSelectedTrack({ track, index: idx })}>
                <Text style={styles.trackNum}>{idx + 1}</Text>
                <Text style={styles.trackName} numberOfLines={1}>{cleanTitle(track.title)}</Text>
                <Text style={styles.trackDuration}>{track.duration}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Song detail sheet */}
      <Modal
        visible={!!selectedTrack}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTrack(null)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setSelectedTrack(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />

            {selectedTrack && (
              <>
                <View style={styles.sheetHero}>
                  <AlbumCover album={selectedTrack.track.album} size={100} borderRadius={8} />
                  <View style={styles.sheetHeroInfo}>
                    <Text style={styles.sheetTrackNum}>Track {selectedTrack.index + 1}</Text>
                    <Text style={styles.sheetTitle} numberOfLines={2}>{cleanTitle(selectedTrack.track.title)}</Text>
                    <TouchableOpacity onPress={() => { setSelectedTrack(null); navigation.navigate('ArtistDetail', { name: selectedTrack.track.artist }); }}>
                      <Text style={styles.sheetArtist}>{selectedTrack.track.artist}</Text>
                    </TouchableOpacity>
                    <Text style={styles.sheetAlbum} numberOfLines={1}>{album?.title}</Text>
                  </View>
                </View>

                <View style={styles.sheetMeta}>
                  {selectedTrack.track.duration ? (
                    <View style={styles.sheetMetaItem}>
                      <Ionicons name="time-outline" size={16} color={colors.muted} />
                      <Text style={styles.sheetMetaText}>{selectedTrack.track.duration}</Text>
                    </View>
                  ) : null}
                  {album?.year ? (
                    <View style={styles.sheetMetaItem}>
                      <Ionicons name="calendar-outline" size={16} color={colors.muted} />
                      <Text style={styles.sheetMetaText}>{album.year}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.sheetLogBtn}
                    onPress={() => { setSelectedTrack(null); navigation.navigate('Log', { track: selectedTrack.track }); }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.sheetLogBtnText}>Log Song</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: 40 },
    backBtn: { position: 'absolute', top: 12, left: 16, zIndex: 10, width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, position: 'relative' },
    heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
    albumInfo: { paddingHorizontal: 20, alignItems: 'center', gap: 6, marginBottom: 16 },
    albumTitle: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
    albumArtist: { color: colors.primary, fontSize: 16, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    metaItem: { color: colors.muted, fontSize: 13 },
    metaDot: { color: colors.border, fontSize: 13 },
    genreTags: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' },
    genreTag: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    genreTagText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
    ratingSection: { paddingHorizontal: 20, marginBottom: 16 },
    communityRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 14 },
    avgRatingNum: { color: colors.text, fontSize: 36, fontWeight: '800' },
    ratingRight: { gap: 4 },
    ratingCount: { color: colors.muted, fontSize: 12 },
    ctaRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
    logBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 13 },
    logBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    iconAction: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    iconActionActive: { backgroundColor: colors.primaryDim },
    myEntrySection: { paddingHorizontal: 20, marginBottom: 24 },
    myEntryCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 8, borderLeftWidth: 3, borderLeftColor: colors.primary },
    myEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    myEntryDate: { color: colors.muted, fontSize: 12 },
    myEntryReview: { color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
    editEntryBtn: { alignSelf: 'flex-start' },
    editEntryText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
    friendsListened: { gap: 8 },
    friendListenRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 10 },
    friendListenInfo: { flex: 1, gap: 4 },
    friendListenName: { color: colors.text, fontWeight: '600', fontSize: 14 },
    recommendBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center' },
    trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 14 },
    trackNum: { color: colors.muted, fontSize: 13, width: 18, textAlign: 'right' },
    trackName: { color: colors.text, fontSize: 14, flex: 1 },
    trackDuration: { color: colors.muted, fontSize: 13 },
    showMoreBtn: { paddingTop: 12, alignItems: 'center' },
    showMoreText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

    // Song sheet
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
    sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
    sheetHero: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    sheetHeroInfo: { flex: 1, justifyContent: 'center', gap: 4 },
    sheetTrackNum: { color: colors.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
    sheetTitle: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    sheetArtist: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    sheetAlbum: { color: colors.muted, fontSize: 13 },
    sheetMeta: { flexDirection: 'row', gap: 20, marginBottom: 24 },
    sheetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sheetMetaText: { color: colors.muted, fontSize: 13 },
    sheetActions: { gap: 10 },
    sheetLogBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14 },
    sheetLogBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
