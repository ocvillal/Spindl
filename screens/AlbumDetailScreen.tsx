import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Album, Track, MOCK_USERS } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import Avatar from '../components/Avatar';
import StarRating from '../components/StarRating';
import { getAlbumWithTracks } from '../services/spotify';
import { useRatings } from '../store/ratings';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AlbumDetail'>;

export default function AlbumDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAlbumWithTracks(id)
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
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <LinearGradient colors={[album.coverGradient[0], Colors.background]} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          <AlbumCover album={album} size={180} borderRadius={20} />
        </View>

        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{album.title}</Text>
          <Text style={styles.albumArtist}>{album.artist}</Text>
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
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? Colors.primary : Colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction}>
            <Ionicons name="bookmark-outline" size={22} color={Colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction}>
            <Ionicons name="paper-plane-outline" size={22} color={Colors.muted} />
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
                  <Ionicons name="paper-plane-outline" size={16} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {tracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracks</Text>
            {tracks.map((track, idx) => (
              <View key={track.id} style={styles.trackRow}>
                <Text style={styles.trackNum}>{idx + 1}</Text>
                <Text style={styles.trackName} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.trackDuration}>{track.duration}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  backBtn: { position: 'absolute', top: 12, left: 16, zIndex: 10, width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, position: 'relative' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  albumInfo: { paddingHorizontal: 20, alignItems: 'center', gap: 6, marginBottom: 16 },
  albumTitle: { color: Colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  albumArtist: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaItem: { color: Colors.muted, fontSize: 13 },
  metaDot: { color: Colors.border, fontSize: 13 },
  genreTags: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' },
  genreTag: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  genreTagText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  ratingSection: { paddingHorizontal: 20, marginBottom: 16 },
  communityRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 14 },
  avgRatingNum: { color: Colors.text, fontSize: 36, fontWeight: '800' },
  ratingRight: { gap: 4 },
  ratingCount: { color: Colors.muted, fontSize: 12 },
  ctaRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  logBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 13 },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  iconAction: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  iconActionActive: { backgroundColor: Colors.primaryDim },
  myEntrySection: { paddingHorizontal: 20, marginBottom: 24 },
  myEntryCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 8, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  myEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  myEntryDate: { color: Colors.muted, fontSize: 12 },
  myEntryReview: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  editEntryBtn: { alignSelf: 'flex-start' },
  editEntryText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  friendsListened: { gap: 8 },
  friendListenRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 12, padding: 10 },
  friendListenInfo: { flex: 1, gap: 4 },
  friendListenName: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  recommendBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.accentDim, justifyContent: 'center', alignItems: 'center' },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: 14 },
  trackNum: { color: Colors.muted, fontSize: 13, width: 18, textAlign: 'right' },
  trackName: { color: Colors.text, fontSize: 14, flex: 1 },
  trackDuration: { color: Colors.muted, fontSize: 13 },
  showMoreBtn: { paddingTop: 12, alignItems: 'center' },
  showMoreText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
});
