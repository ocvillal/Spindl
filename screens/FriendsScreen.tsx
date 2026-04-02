import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { MOCK_USERS, MOCK_ACTIVITY, MOCK_ALBUMS } from '../constants/mockData';
import Avatar from '../components/Avatar';
import AlbumCover from '../components/AlbumCover';
import ActivityCard from '../components/ActivityCard';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'activity' | 'friends' | 'recs';

export default function FriendsScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('activity');
  const [searchQuery, setSearchQuery] = useState('');

  const friends = MOCK_USERS.slice(1).filter((u) => u.isFollowing);
  const suggestions = MOCK_USERS.slice(1).filter((u) => !u.isFollowing);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Friends</Text>

        <View style={styles.tabBar}>
          {(['activity', 'friends', 'recs'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.tabItem, tab === t && styles.tabItemActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'activity' ? 'Activity' : t === 'friends' ? 'Friends' : 'For You'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'activity' && (
          <View>
            {MOCK_ACTIVITY.slice(0, 4).map((item) => (
              <ActivityCard key={item.id} item={item} onAlbumPress={(id) => navigation.navigate('AlbumDetail', { id })} />
            ))}
          </View>
        )}

        {tab === 'friends' && (
          <View>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={Colors.muted} />
              <TextInput style={styles.searchInput} placeholder="Find friends..." placeholderTextColor={Colors.muted} value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            <Text style={styles.sectionLabel}>Following · {friends.length}</Text>
            {friends.map((user) => (
              <View key={user.id} style={styles.friendRow}>
                <Avatar user={user} size={46} showOnline />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{user.name}</Text>
                  <Text style={styles.friendUsername}>@{user.username}</Text>
                  <Text style={styles.friendStats}>{user.albumsLogged} albums · {user.followersCount} followers</Text>
                </View>
                <TouchableOpacity style={styles.followingBtn}>
                  <Text style={styles.followingBtnText}>Following</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Suggested</Text>
            {suggestions.map((user) => (
              <View key={user.id} style={styles.friendRow}>
                <Avatar user={user} size={46} showOnline />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{user.name}</Text>
                  <Text style={styles.friendUsername}>@{user.username}</Text>
                  <Text style={styles.friendBio} numberOfLines={1}>{user.bio}</Text>
                </View>
                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followBtnText}>Follow</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 'recs' && (
          <View style={styles.recsSection}>
            <Text style={styles.recsSubtitle}>Albums your friends think you'd love</Text>
            {[
              { from: MOCK_USERS[1], album: MOCK_ALBUMS[3], note: 'This felt like you. Specifically the bridge in "Writer in the Dark".' },
              { from: MOCK_USERS[2], album: MOCK_ALBUMS[7], note: "Required listening if you haven't already." },
              { from: MOCK_USERS[3], album: MOCK_ALBUMS[1], note: 'blonde is everything.' },
            ].map((rec, idx) => (
              <View key={idx} style={styles.recCard}>
                <View style={styles.recHeader}>
                  <Avatar user={rec.from} size={32} />
                  <Text style={styles.recFrom}>
                    <Text style={styles.recFromName}>{rec.from.name}</Text>{' '}recommended this for you
                  </Text>
                </View>
                <TouchableOpacity style={styles.recAlbumRow} onPress={() => navigation.navigate('AlbumDetail', { id: rec.album.id })} activeOpacity={0.8}>
                  <AlbumCover album={rec.album} size={56} />
                  <View style={styles.recAlbumInfo}>
                    <Text style={styles.recAlbumTitle}>{rec.album.title}</Text>
                    <Text style={styles.recAlbumArtist}>{rec.album.artist}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
                </TouchableOpacity>
                <Text style={styles.recNote}>"{rec.note}"</Text>
                <View style={styles.recActions}>
                  <TouchableOpacity style={styles.recActionBtn}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={Colors.accent} />
                    <Text style={[styles.recActionText, { color: Colors.accent }]}>Add to diary</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recActionBtn}>
                    <Ionicons name="bookmark-outline" size={18} color={Colors.muted} />
                    <Text style={styles.recActionText}>Save for later</Text>
                  </TouchableOpacity>
                </View>
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
  content: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14, padding: 4, marginBottom: 20, gap: 4 },
  tabItem: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabItemActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  sectionLabel: { color: Colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 8 },
  friendInfo: { flex: 1, gap: 2 },
  friendName: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  friendUsername: { color: Colors.muted, fontSize: 12 },
  friendStats: { color: Colors.textSecondary, fontSize: 11, marginTop: 1 },
  friendBio: { color: Colors.textSecondary, fontSize: 12 },
  followingBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  followingBtnText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.primary },
  followBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  recsSection: { gap: 12 },
  recsSubtitle: { color: Colors.muted, fontSize: 14, marginBottom: 4 },
  recCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 14, gap: 12 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recFrom: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  recFromName: { color: Colors.text, fontWeight: '700' },
  recAlbumRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceAlt, borderRadius: 12, padding: 10 },
  recAlbumInfo: { flex: 1 },
  recAlbumTitle: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  recAlbumArtist: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  recNote: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 19, borderLeftWidth: 2, borderLeftColor: Colors.accent, paddingLeft: 10 },
  recActions: { flexDirection: 'row', gap: 20, paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  recActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recActionText: { color: Colors.muted, fontSize: 13 },
});
