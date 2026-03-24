import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { MOCK_ALBUMS, TRENDING_ALBUMS, GENRES } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [focused, setFocused] = useState(false);

  const results = query.length > 1
    ? MOCK_ALBUMS.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.artist.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Search</Text>

        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Ionicons name="search" size={18} color={Colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Albums, artists, songs..."
            placeholderTextColor={Colors.muted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {query.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
            {results.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={40} color={Colors.muted} />
                <Text style={styles.emptyText}>Nothing found for "{query}"</Text>
              </View>
            ) : (
              results.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.resultRow}
                  onPress={() => navigation.navigate('AlbumDetail', { id: album.id })}
                  activeOpacity={0.75}
                >
                  <AlbumCover album={album} size={50} />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{album.title}</Text>
                    <Text style={styles.resultSub}>{album.artist} · {album.year}</Text>
                    <View style={styles.genreRow}>
                      {album.genre.slice(0, 2).map((g) => (
                        <View key={g} style={styles.genreTag}>
                          <Text style={styles.genreText}>{g}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.genreScroll}
            >
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genreChip, activeGenre === g && styles.genreChipActive]}
                  onPress={() => setActiveGenre(g)}
                >
                  <Text style={[styles.genreChipText, activeGenre === g && styles.genreChipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending This Week</Text>
                <Ionicons name="flame" size={16} color={Colors.accent} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
                {TRENDING_ALBUMS.map((album, idx) => (
                  <TouchableOpacity
                    key={album.id}
                    style={styles.trendingCard}
                    onPress={() => navigation.navigate('AlbumDetail', { id: album.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.trendingRank}>
                      <Text style={styles.trendingRankText}>{idx + 1}</Text>
                    </View>
                    <AlbumCover album={album} size={120} borderRadius={14} />
                    <Text style={styles.trendingTitle} numberOfLines={1}>{album.title}</Text>
                    <Text style={styles.trendingArtist} numberOfLines={1}>{album.artist}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse All</Text>
              <View style={styles.grid}>
                {MOCK_ALBUMS.map((album) => (
                  <TouchableOpacity
                    key={album.id}
                    style={styles.gridItem}
                    onPress={() => navigation.navigate('AlbumDetail', { id: album.id })}
                    activeOpacity={0.8}
                  >
                    <AlbumCover album={album} size={160} borderRadius={12} />
                    <Text style={styles.gridTitle} numberOfLines={1}>{album.title}</Text>
                    <Text style={styles.gridArtist} numberOfLines={1}>{album.artist}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarFocused: { borderColor: Colors.primary },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  section: { marginBottom: 24 },
  sectionLabel: { color: Colors.muted, fontSize: 13, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  genreScroll: { gap: 8, paddingRight: 8, marginBottom: 20 },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genreChipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  genreChipText: { color: Colors.muted, fontSize: 13, fontWeight: '500' },
  genreChipTextActive: { color: Colors.primary, fontWeight: '700' },
  trendingScroll: { gap: 14, paddingRight: 8 },
  trendingCard: { width: 130, gap: 6, position: 'relative' },
  trendingRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingRankText: { color: Colors.text, fontSize: 11, fontWeight: '700' },
  trendingTitle: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  trendingArtist: { color: Colors.muted, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%', gap: 6 },
  gridTitle: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  gridArtist: { color: Colors.muted, fontSize: 12 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  resultInfo: { flex: 1, gap: 4 },
  resultTitle: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  resultSub: { color: Colors.textSecondary, fontSize: 12 },
  genreRow: { flexDirection: 'row', gap: 5, marginTop: 2 },
  genreTag: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  genreText: { color: Colors.muted, fontSize: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: Colors.muted, fontSize: 14 },
});
