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
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';
import { RootStackParamList } from '../App';
import { useRatings, AlbumEntry, SongEntry } from '../store/ratings';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RankTab = 'albums' | 'songs';

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function topArtist(entries: (AlbumEntry | SongEntry)[]): string | null {
  if (!entries.length) return null;
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const artist = e.type === 'album' ? e.album.artist : e.track.artist;
    counts[artist] = (counts[artist] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export default function DiaryScreen() {
  const navigation = useNavigation<Nav>();
  const { entries } = useRatings();
  const [tab, setTab] = useState<RankTab>('albums');

  const albumEntries = entries.filter((e): e is AlbumEntry => e.type === 'album');
  const songEntries = entries.filter((e): e is SongEntry => e.type === 'song');

  const rankedAlbums = [...albumEntries].sort((a, b) => b.rating - a.rating);
  const rankedSongs = [...songEntries].sort((a, b) => b.rating - a.rating);

  const totalLogged = entries.length;
  const avgRating = avg(entries.map((e) => e.rating));
  const likedCount = entries.filter((e) => e.liked).length;
  const topArtistName = topArtist(entries);
  const fiveStarCount = entries.filter((e) => e.rating === 5).length;

  const isEmpty = tab === 'albums' ? rankedAlbums.length === 0 : rankedSongs.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Diary</Text>
            <Text style={styles.subtitle}>{totalLogged} {totalLogged === 1 ? 'entry' : 'entries'} logged</Text>
          </View>
          <TouchableOpacity style={styles.logBtn} onPress={() => navigation.navigate('Log')}>
            <Ionicons name="add" size={18} color={Colors.background} />
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats Cards ── */}
        {totalLogged > 0 && (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardWide]}>
              <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
              <View style={styles.statRow}>
                <Ionicons name="star" size={12} color={Colors.primary} />
                <Text style={styles.statLabel}>avg rating</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{fiveStarCount}</Text>
              <View style={styles.statRow}>
                <Ionicons name="trophy" size={12} color={Colors.accent} />
                <Text style={styles.statLabel}>5-star</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{likedCount}</Text>
              <View style={styles.statRow}>
                <Ionicons name="heart" size={12} color={Colors.primary} />
                <Text style={styles.statLabel}>loved</Text>
              </View>
            </View>
            {topArtistName && (
              <View style={[styles.statCard, styles.statCardFull]}>
                <Text style={styles.statArtistValue} numberOfLines={1}>{topArtistName}</Text>
                <View style={styles.statRow}>
                  <Ionicons name="musical-notes" size={12} color={Colors.accent} />
                  <Text style={styles.statLabel}>most listened</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Tab Toggle ── */}
        <View style={styles.toggle}>
          {(['albums', 'songs'] as RankTab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleBtn, tab === t && styles.toggleBtnActive]}
              onPress={() => setTab(t)}
            >
              <Ionicons
                name={t === 'albums' ? 'disc-outline' : 'musical-note-outline'}
                size={15}
                color={tab === t ? Colors.primary : Colors.muted}
              />
              <Text style={[styles.toggleText, tab === t && styles.toggleTextActive]}>
                {t === 'albums' ? `Albums (${albumEntries.length})` : `Songs (${songEntries.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Rankings ── */}
        {isEmpty ? (
          <View style={styles.empty}>
            <Ionicons name={tab === 'albums' ? 'disc-outline' : 'musical-note-outline'} size={44} color={Colors.muted} />
            <Text style={styles.emptyTitle}>No {tab} logged yet</Text>
            <Text style={styles.emptyHint}>Tap Log to add your first {tab === 'albums' ? 'album' : 'song'}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Log')}>
              <Text style={styles.emptyBtnText}>+ Log {tab === 'albums' ? 'Album' : 'Song'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.rankingLabel}>
              {tab === 'albums' ? 'Album' : 'Song'} Rankings
            </Text>
            {(tab === 'albums' ? rankedAlbums : rankedSongs).map((entry, idx) => {
              const isAlbum = entry.type === 'album';
              const albumData = isAlbum ? (entry as AlbumEntry).album : (entry as SongEntry).track.album;
              const title = isAlbum ? (entry as AlbumEntry).album.title : (entry as SongEntry).track.title;
              const artist = isAlbum ? (entry as AlbumEntry).album.artist : (entry as SongEntry).track.artist;
              const medalColor = idx === 0 ? '#C9A84C' : idx === 1 ? '#9E9E9E' : idx === 2 ? '#A0633A' : null;

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.rankRow}
                  onPress={() => navigation.navigate('AlbumDetail', { id: albumData.id })}
                  activeOpacity={0.8}
                >
                  {/* Rank badge */}
                  <View style={[styles.rankBadge, medalColor ? { backgroundColor: medalColor + '22' } : null]}>
                    {medalColor ? (
                      <Ionicons name="trophy" size={14} color={medalColor} />
                    ) : (
                      <Text style={styles.rankNum}>{idx + 1}</Text>
                    )}
                  </View>

                  <AlbumCover album={albumData} size={54} borderRadius={10} />

                  <View style={styles.rankInfo}>
                    <View style={styles.rankTitleRow}>
                      <Text style={styles.rankTitle} numberOfLines={1}>{title}</Text>
                      {entry.liked && <Ionicons name="heart" size={13} color={Colors.primary} />}
                    </View>
                    <Text style={styles.rankArtist} numberOfLines={1}>{artist}</Text>
                    <StarRating rating={entry.rating} size={12} />
                  </View>

                  <View style={styles.rankMeta}>
                    <Text style={[styles.rankScore, medalColor ? { color: medalColor } : null]}>
                      {entry.rating}.0
                    </Text>
                    <Text style={styles.rankDate}>{entry.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 4,
  },
  logBtnText: { color: Colors.background, fontWeight: '700', fontSize: 13 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: 80,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  statCardWide: { minWidth: 90 },
  statCardFull: { width: '100%', flex: 0 },
  statValue: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  statArtistValue: { color: Colors.text, fontSize: 16, fontWeight: '800' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { color: Colors.muted, fontSize: 11, fontWeight: '600' },

  // Toggle
  toggle: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: 14, padding: 4, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: Colors.primaryDim },
  toggleText: { color: Colors.muted, fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: Colors.primary },

  rankingLabel: {
    color: Colors.text, fontSize: 15, fontWeight: '800',
    letterSpacing: -0.2, marginBottom: 10,
  },

  // Rank rows
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  rankBadge: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  rankNum: { color: Colors.muted, fontSize: 13, fontWeight: '800' },
  rankInfo: { flex: 1, gap: 3 },
  rankTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rankTitle: { color: Colors.text, fontWeight: '700', fontSize: 14, flex: 1 },
  rankArtist: { color: Colors.textSecondary, fontSize: 12 },
  rankMeta: { alignItems: 'flex-end', gap: 4 },
  rankScore: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  rankDate: { color: Colors.muted, fontSize: 10 },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: Colors.muted, fontSize: 13 },
  emptyBtn: {
    marginTop: 8, backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
  },
  emptyBtnText: { color: Colors.background, fontWeight: '700', fontSize: 14 },
});
