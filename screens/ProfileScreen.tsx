import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { MOCK_USERS, MOCK_DIARY, MOCK_ALBUMS } from '../constants/mockData';
import Avatar from '../components/Avatar';
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ProfileTab = 'diary' | 'reviews' | 'lists' | 'favorites';

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('diary');
  const me = MOCK_USERS[0];
  const favAlbums = MOCK_DIARY.filter((e) => e.liked).slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <LinearGradient colors={['#3B2A5C', Colors.background]} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          <View style={styles.topRow}>
            <View />
            <TouchableOpacity style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <Avatar user={me} size={80} />
              <TouchableOpacity style={styles.editAvatarBtn}>
                <Ionicons name="camera" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.displayName}>{me.name}</Text>
            <Text style={styles.username}>@{me.username}</Text>
            <Text style={styles.bio}>{me.bio}</Text>
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Albums', value: me.albumsLogged },
              { label: 'Followers', value: me.followersCount },
              { label: 'Following', value: me.followingCount },
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
              <Ionicons name="add" size={24} color={Colors.muted} />
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
          <View style={styles.diaryGrid}>
            {MOCK_DIARY.map((entry) => (
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
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsList}>
            {MOCK_DIARY.filter((e) => e.review).map((entry) => (
              <TouchableOpacity key={entry.id} style={styles.reviewRow} onPress={() => navigation.navigate('AlbumDetail', { id: entry.album.id })} activeOpacity={0.8}>
                <AlbumCover album={entry.album} size={50} />
                <View style={styles.reviewContent}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewTitle}>{entry.album.title}</Text>
                    <StarRating rating={entry.rating} size={12} />
                  </View>
                  <Text style={styles.reviewText} numberOfLines={2}>{entry.review}</Text>
                  <Text style={styles.reviewDate}>{entry.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
                <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.newListBtn}>
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.newListText}>New List</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'favorites' && (
          <View style={styles.diaryGrid}>
            {MOCK_DIARY.filter((e) => e.liked).map((entry) => (
              <TouchableOpacity key={entry.id} style={styles.diaryGridItem} onPress={() => navigation.navigate('AlbumDetail', { id: entry.album.id })} activeOpacity={0.8}>
                <AlbumCover album={entry.album} size={100} borderRadius={10} />
                <Text style={styles.diaryItemTitle} numberOfLines={1}>{entry.album.title}</Text>
              </TouchableOpacity>
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
  content: { paddingBottom: 32 },
  profileHeader: { paddingHorizontal: 16, paddingBottom: 20, position: 'relative' },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginBottom: 16 },
  settingsBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', gap: 6, marginBottom: 20 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.background },
  displayName: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  username: { color: Colors.muted, fontSize: 14 },
  bio: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  statValue: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: Colors.muted, fontSize: 11, marginTop: 2 },
  statDivider: { position: 'absolute', right: 0, top: '20%', height: '60%', width: 1, backgroundColor: Colors.border },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  favsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addFavBtn: { width: 72, height: 72, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  tabScroll: { gap: 8, paddingHorizontal: 16, paddingRight: 24, marginBottom: 16 },
  tabChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tabChipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tabChipText: { color: Colors.muted, fontSize: 13, fontWeight: '600' },
  tabChipTextActive: { color: Colors.primary },
  diaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  diaryGridItem: { gap: 5 },
  gridCoverWrap: { position: 'relative' },
  ratingBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingBadgeText: { color: Colors.star, fontSize: 11, fontWeight: '700' },
  diaryItemTitle: { color: Colors.textSecondary, fontSize: 11, width: 100 },
  reviewsList: { paddingHorizontal: 16, gap: 8 },
  reviewRow: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 12 },
  reviewContent: { flex: 1, gap: 4 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewTitle: { color: Colors.text, fontWeight: '600', fontSize: 13, flex: 1 },
  reviewText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  reviewDate: { color: Colors.muted, fontSize: 11 },
  listsSection: { paddingHorizontal: 16, gap: 8 },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, gap: 12 },
  listCoverStrip: { width: 80, height: 44, position: 'relative' },
  listCoverThumb: { position: 'absolute', top: 0 },
  listInfo: { flex: 1, gap: 3 },
  listTitle: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  listCount: { color: Colors.muted, fontSize: 12 },
  newListBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginTop: 4 },
  newListText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
