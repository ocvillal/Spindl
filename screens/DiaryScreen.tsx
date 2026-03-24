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
import { MOCK_DIARY } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ViewMode = 'list' | 'grid';

export default function DiaryScreen() {
  const navigation = useNavigation<Nav>();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Diary</Text>
            <Text style={styles.subtitle}>{MOCK_DIARY.length} entries this month</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={20} color={Colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logBtn} onPress={() => navigation.navigate('Log')}>
              <Ionicons name="add" size={18} color={Colors.background} />
              <Text style={styles.logBtnText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'list' ? (
          <View>
            {MOCK_DIARY.map((entry, idx) => {
              const showDateHeader = idx === 0 || entry.date !== MOCK_DIARY[idx - 1].date;
              return (
                <View key={entry.id}>
                  {showDateHeader && <Text style={styles.dateHeader}>{entry.date}</Text>}
                  <TouchableOpacity
                    style={styles.listEntry}
                    onPress={() => navigation.navigate('AlbumDetail', { id: entry.album.id })}
                    activeOpacity={0.8}
                  >
                    <AlbumCover album={entry.album} size={58} />
                    <View style={styles.entryInfo}>
                      <View style={styles.entryTitleRow}>
                        <Text style={styles.entryTitle} numberOfLines={1}>{entry.album.title}</Text>
                        {entry.liked && <Ionicons name="heart" size={14} color={Colors.primary} />}
                      </View>
                      <Text style={styles.entryArtist}>{entry.album.artist}</Text>
                      <StarRating rating={entry.rating} size={13} />
                      {entry.review && (
                        <Text style={styles.entryReview} numberOfLines={2}>{entry.review}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.grid}>
            {MOCK_DIARY.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.gridItem}
                onPress={() => navigation.navigate('AlbumDetail', { id: entry.album.id })}
                activeOpacity={0.8}
              >
                <View style={styles.gridCoverWrap}>
                  <AlbumCover album={entry.album} size={155} borderRadius={12} />
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  viewToggle: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  logBtnText: { color: Colors.background, fontWeight: '700', fontSize: 13 },
  dateHeader: {
    color: Colors.muted, fontSize: 12, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 8,
  },
  listEntry: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 8,
  },
  entryInfo: { flex: 1, gap: 4 },
  entryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryTitle: { color: Colors.text, fontWeight: '700', fontSize: 14, flex: 1 },
  entryArtist: { color: Colors.textSecondary, fontSize: 12 },
  entryReview: { color: Colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2, fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.5%', gap: 6 },
  gridCoverWrap: { position: 'relative' },
  heartBadge: {
    position: 'absolute', bottom: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  gridTitle: { color: Colors.text, fontSize: 13, fontWeight: '600' },
});
