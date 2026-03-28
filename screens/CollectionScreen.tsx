import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import { RootStackParamList } from '../App';
import { useRatings, AlbumEntry, SongEntry } from '../store/ratings';
import { MOCK_USERS } from '../constants/mockData';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type CollectionTab = 'albums' | 'songs' | 'friends';

export default function CollectionScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const { entries } = useRatings();
  const [tab, setTab] = useState<CollectionTab>('albums');

  const albumEntries = entries.filter((e): e is AlbumEntry => e.type === 'album');
  const songEntries = entries.filter((e): e is SongEntry => e.type === 'song');

  // Mock friends activity
  const friendActivity = MOCK_USERS.slice(1).map((user, i) => ({
    user,
    action: i % 2 === 0 ? 'logged an album' : 'logged a song',
    item: i % 2 === 0 ? 'Midnights' : 'Blinding Lights',
    time: `${i + 1}h ago`,
    rating: Math.floor(Math.random() * 2) + 4,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Collection</Text>
            <Text style={styles.subtitle}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</Text>
          </View>
          <TouchableOpacity style={styles.logBtn} onPress={() => navigation.navigate('Log')}>
            <Ionicons name="add" size={18} color={colors.background} />
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([
            { key: 'albums', label: 'Albums', icon: 'disc-outline', count: albumEntries.length },
            { key: 'songs', label: 'Songs', icon: 'musical-note-outline', count: songEntries.length },
            { key: 'friends', label: 'Friends', icon: 'people-outline', count: null },
          ] as { key: CollectionTab; label: string; icon: any; count: number | null }[]).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={15} color={tab === t.key ? colors.primary : colors.muted} />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}{t.count !== null ? ` (${t.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Albums */}
        {tab === 'albums' && (
          albumEntries.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="disc-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>No albums logged yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Log')}>
                <Text style={styles.emptyBtnText}>+ Log Album</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.grid}>
              {albumEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.gridItem}
                  onPress={() => navigation.navigate('AlbumDetail', { id: entry.album.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.gridCoverWrap}>
                    <AlbumCover album={entry.album} size={160} borderRadius={12} />
                    {entry.liked && (
                      <View style={styles.heartBadge}>
                        <Ionicons name="heart" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.gridTitle} numberOfLines={1}>{entry.album.title}</Text>
                  <StarRating rating={entry.rating} size={11} />
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {/* Songs */}
        {tab === 'songs' && (
          songEntries.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="musical-note-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>No songs logged yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Log')}>
                <Text style={styles.emptyBtnText}>+ Log Song</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.songList}>
              {songEntries.map((entry, idx) => (
                <View key={entry.id} style={[styles.songRow, idx > 0 && styles.songRowBorder]}>
                  <AlbumCover album={entry.track.album} size={52} borderRadius={10} />
                  <View style={styles.songInfo}>
                    <View style={styles.songTitleRow}>
                      <Text style={styles.songTitle} numberOfLines={1}>{entry.track.title}</Text>
                      {entry.liked && <Ionicons name="heart" size={13} color={colors.primary} />}
                    </View>
                    <Text style={styles.songArtist} numberOfLines={1}>{entry.track.artist}</Text>
                    <StarRating rating={entry.rating} size={11} />
                  </View>
                  <View style={styles.songMeta}>
                    <Text style={styles.songScore}>{entry.rating}.0</Text>
                    <Text style={styles.songDate}>{entry.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )
        )}

        {/* Friends */}
        {tab === 'friends' && (
          <View style={styles.friendList}>
            {friendActivity.map((item, idx) => (
              <View key={idx} style={styles.friendRow}>
                <Avatar user={item.user} size={40} />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{item.user.name}</Text>
                  <Text style={styles.friendAction}>
                    {item.action} · <Text style={styles.friendItem}>{item.item}</Text>
                  </Text>
                </View>
                <View style={styles.friendRight}>
                  <StarRating rating={item.rating} size={11} />
                  <Text style={styles.friendTime}>{item.time}</Text>
                </View>
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
    content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
    logBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 4,
    },
    logBtnText: { color: colors.background, fontWeight: '700', fontSize: 13 },

    tabs: {
      flexDirection: 'row', backgroundColor: colors.surface,
      borderRadius: 14, padding: 4, marginBottom: 20,
      borderWidth: 1, borderColor: colors.border,
    },
    tabBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 5, paddingVertical: 9, borderRadius: 10,
    },
    tabBtnActive: { backgroundColor: colors.primaryDim },
    tabText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: colors.primary },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '47.5%', gap: 6 },
    gridCoverWrap: { position: 'relative' },
    heartBadge: {
      position: 'absolute', bottom: 8, right: 8,
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    },
    gridTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },

    songList: {
      backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    songRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    songRowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
    songTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    songInfo: { flex: 1, gap: 3 },
    songTitle: { color: colors.text, fontWeight: '600', fontSize: 14, flex: 1 },
    songArtist: { color: colors.muted, fontSize: 12 },
    songMeta: { alignItems: 'flex-end', gap: 3 },
    songScore: { color: colors.text, fontSize: 16, fontWeight: '800' },
    songDate: { color: colors.muted, fontSize: 10 },

    friendList: { gap: 10 },
    friendRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface, borderRadius: 14, padding: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    friendInfo: { flex: 1 },
    friendName: { color: colors.text, fontWeight: '700', fontSize: 14 },
    friendAction: { color: colors.muted, fontSize: 12, marginTop: 2 },
    friendItem: { color: colors.textSecondary, fontWeight: '600' },
    friendRight: { alignItems: 'flex-end', gap: 4 },
    friendTime: { color: colors.muted, fontSize: 11 },

    empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
    emptyBtnText: { color: colors.background, fontWeight: '700', fontSize: 14 },
  });
}
