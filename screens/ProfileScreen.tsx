import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import { MOCK_ALBUMS } from '../constants/mockData';
import { useRatings, AlbumEntry, SongEntry } from '../store/ratings';
import { useProfile } from '../store/profile';
import { useAuth } from '../store/auth';
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ProfileTab = 'diary' | 'reviews' | 'lists' | 'favorites';

function ProfileAvatar({ name, size }: { name: string; size: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>('diary');
  const { entries } = useRatings();
  const albumEntries = entries.filter((e): e is AlbumEntry => e.type === 'album');
  const songEntries = entries.filter((e): e is SongEntry => e.type === 'song');
  const favAlbums = albumEntries.filter((e) => e.liked).slice(0, 4);

  const displayName = profile?.name ?? 'Music Lover';
  const username = profile?.username ?? '';
  const genres = profile?.genres ?? [];
  const tasteLine = genres.slice(0, 3).join(' · ');

  function confirmSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <LinearGradient colors={[colors.background, colors.background]} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          <View style={styles.topRow}>
            <View />
            <TouchableOpacity style={styles.settingsBtn} onPress={confirmSignOut}>
              <Ionicons name="log-out-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <ProfileAvatar name={displayName} size={80} />
            </View>
            <Text style={styles.displayName}>{displayName}</Text>
            {username ? <Text style={styles.username}>@{username}</Text> : null}
            {tasteLine ? <Text style={styles.bio}>{tasteLine}</Text> : null}
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Albums', value: albumEntries.length },
              { label: 'Songs', value: songEntries.length },
              { label: 'Genres', value: genres.length },
            ].map((stat, idx) => (
              <TouchableOpacity key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                {idx < 2 && <View style={styles.statDivider} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          <View style={styles.favsRow}>
            {favAlbums.map((entry) => (
              <TouchableOpacity key={entry.id} onPress={() => navigation.navigate('AlbumDetail', { id: entry.album.id })} activeOpacity={0.8}>
                <AlbumCover album={entry.album} size={72} borderRadius={10} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addFavBtn}>
              <Ionicons name="add" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {(['diary', 'reviews', 'lists', 'favorites'] as ProfileTab[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.tabChip, activeTab === t && styles.tabChipActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabChipText, activeTab === t && styles.tabChipTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === 'diary' && (
          entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={40} color={colors.muted} />
              <Text style={styles.emptyText}>Nothing logged yet</Text>
              <Text style={styles.emptyHint}>Tap + on the home screen to log an album or song</Text>
            </View>
          ) : (
            <>
              {albumEntries.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Albums</Text>
                  <View style={styles.diaryGrid}>
                    {albumEntries.map((entry) => (
                      <TouchableOpacity key={entry.id} style={styles.diaryGridItem} onPress={() => navigation.navigate('AlbumDetail', { id: entry.album.id })} activeOpacity={0.8}>
                        <View style={styles.gridCoverWrap}>
                          <AlbumCover album={entry.album} size={100} borderRadius={10} />
                          <View style={styles.ratingBadge}>
                            <Text style={styles.ratingBadgeText}>{entry.rating}</Text>
                          </View>
                        </View>
                        <Text style={styles.diaryItemTitle} numberOfLines={1}>{entry.album.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {songEntries.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Songs</Text>
                  <View style={styles.diaryGrid}>
                    {songEntries.map((entry) => (
                      <TouchableOpacity key={entry.id} style={styles.diaryGridItem} activeOpacity={0.8}>
                        <View style={styles.gridCoverWrap}>
                          <AlbumCover album={entry.track.album} size={100} borderRadius={10} />
                          <View style={styles.ratingBadge}>
                            <Text style={styles.ratingBadgeText}>{entry.rating}</Text>
                          </View>
                        </View>
                        <Text style={styles.diaryItemTitle} numberOfLines={1}>{entry.track.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )
        )}

        {activeTab === 'reviews' && (
          entries.filter((e) => e.review).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="create-outline" size={40} color={colors.muted} />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {entries.filter((e) => e.review).map((entry) => {
                const isAlbum = entry.type === 'album';
                const album = isAlbum ? (entry as AlbumEntry).album : (entry as SongEntry).track.album;
                const title = isAlbum ? (entry as AlbumEntry).album.title : (entry as SongEntry).track.title;
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.reviewRow}
                    onPress={() => isAlbum ? navigation.navigate('AlbumDetail', { id: album.id }) : undefined}
                    activeOpacity={0.8}
                  >
                    <AlbumCover album={album} size={50} borderRadius={8} />
                    <View style={styles.reviewContent}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewTitleRow}>
                          <Text style={styles.reviewTitle} numberOfLines={1}>{title}</Text>
                          {!isAlbum && <View style={styles.songBadge}><Text style={styles.songBadgeText}>song</Text></View>}
                        </View>
                        <StarRating rating={entry.rating} size={12} />
                      </View>
                      <Text style={styles.reviewText} numberOfLines={2}>{entry.review}</Text>
                      <Text style={styles.reviewDate}>{entry.date}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        )}

        {activeTab === 'lists' && (
          <View style={styles.listsSection}>
            {[
              { title: 'Albums That Changed Me', count: 12 },
              { title: '2024 Listens', count: 34 },
              { title: 'Late Night Drives', count: 8 },
              { title: 'Rainy Day Rotation', count: 17 },
            ].map((list, idx) => (
              <TouchableOpacity key={idx} style={styles.listRow}>
                <View style={styles.listCoverStrip}>
                  {MOCK_ALBUMS.slice(idx, idx + 3).map((album, i) => (
                    <View key={album.id} style={[styles.listCoverThumb, { left: i * 18, zIndex: 3 - i }]}>
                      <AlbumCover album={album} size={44} borderRadius={8} />
                    </View>
                  ))}
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{list.title}</Text>
                  <Text style={styles.listCount}>{list.count} albums</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.newListBtn}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.newListText}>New List</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'favorites' && (
          entries.filter((e) => e.liked).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={40} color={colors.muted} />
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptyHint}>Heart an album or song when logging it</Text>
            </View>
          ) : (
            <View style={styles.diaryGrid}>
              {entries.filter((e) => e.liked).map((entry) => {
                const isAlbum = entry.type === 'album';
                const album = isAlbum ? (entry as AlbumEntry).album : (entry as SongEntry).track.album;
                const title = isAlbum ? (entry as AlbumEntry).album.title : (entry as SongEntry).track.title;
                return (
                  <TouchableOpacity key={entry.id} style={styles.diaryGridItem} onPress={() => isAlbum ? navigation.navigate('AlbumDetail', { id: album.id }) : undefined} activeOpacity={0.8}>
                    <AlbumCover album={album} size={100} borderRadius={10} />
                    <Text style={styles.diaryItemTitle} numberOfLines={1}>{title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: 32 },
    profileHeader: { paddingHorizontal: 16, paddingBottom: 20, position: 'relative' },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginBottom: 16 },
    settingsBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    avatarSection: { alignItems: 'center', gap: 6, marginBottom: 20 },
    avatarWrap: { position: 'relative', marginBottom: 4 },
    editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
    displayName: { color: colors.text, fontSize: 22, fontWeight: '800' },
    username: { color: colors.muted, fontSize: 14 },
    bio: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 2 },
    statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
    statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
    statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
    statDivider: { position: 'absolute', right: 0, top: '20%', height: '60%', width: 1, backgroundColor: colors.border },
    section: { paddingHorizontal: 16, marginBottom: 20 },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    favsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    addFavBtn: { width: 72, height: 72, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    tabScroll: { gap: 8, paddingHorizontal: 16, paddingRight: 24, marginBottom: 16 },
    tabChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    tabChipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
    tabChipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    tabChipTextActive: { color: colors.primary },
    diaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
    diaryGridItem: { gap: 5 },
    gridCoverWrap: { position: 'relative' },
    ratingBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    ratingBadgeText: { color: colors.star, fontSize: 11, fontWeight: '700' },
    diaryItemTitle: { color: colors.textSecondary, fontSize: 11, width: 100 },
    reviewsList: { paddingHorizontal: 16, gap: 8 },
    reviewRow: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 12 },
    reviewContent: { flex: 1, gap: 4 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    reviewTitle: { color: colors.text, fontWeight: '600', fontSize: 13, flexShrink: 1 },
    songBadge: { backgroundColor: colors.primaryDim, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    songBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
    reviewText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
    reviewDate: { color: colors.muted, fontSize: 11 },
    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8, paddingHorizontal: 32 },
    emptyText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
    emptyHint: { color: colors.muted, fontSize: 13, textAlign: 'center', opacity: 0.7 },
    listsSection: { paddingHorizontal: 16, gap: 8 },
    listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 12, gap: 12 },
    listCoverStrip: { width: 80, height: 44, position: 'relative' },
    listCoverThumb: { position: 'absolute', top: 0 },
    listInfo: { flex: 1, gap: 3 },
    listTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
    listCount: { color: colors.muted, fontSize: 12 },
    newListBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginTop: 4 },
    newListText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  });
}
