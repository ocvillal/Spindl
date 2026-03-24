import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { MOCK_ALBUMS } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';

export default function LogScreen() {
  const navigation = useNavigation();
  const [selectedAlbum, setSelectedAlbum] = useState(MOCK_ALBUMS[0]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [liked, setLiked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.length > 1
    ? MOCK_ALBUMS.filter((a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navClose}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Log Album</Text>
        <TouchableOpacity
          style={[styles.saveBtn, rating === 0 && styles.saveBtnDisabled]}
          disabled={rating === 0}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.saveBtnText, rating === 0 && styles.saveBtnTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.label}>Album</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={Colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search albums..."
              placeholderTextColor={Colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {filtered.length > 0 && (
            <View style={styles.searchResults}>
              {filtered.slice(0, 3).map((album) => (
                <TouchableOpacity key={album.id} style={styles.searchResultRow} onPress={() => { setSelectedAlbum(album); setSearchQuery(''); }}>
                  <AlbumCover album={album} size={40} />
                  <View>
                    <Text style={styles.resultTitle}>{album.title}</Text>
                    <Text style={styles.resultArtist}>{album.artist}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.selectedAlbum}>
          <AlbumCover album={selectedAlbum} size={72} borderRadius={12} />
          <View>
            <Text style={styles.selectedTitle}>{selectedAlbum.title}</Text>
            <Text style={styles.selectedArtist}>{selectedAlbum.artist}</Text>
            <Text style={styles.selectedMeta}>{selectedAlbum.year}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={rating} size={36} interactive onRate={setRating} />
            {rating > 0 && <Text style={styles.ratingLabel}>{rating} / 5</Text>}
          </View>
          {rating === 0 && <Text style={styles.ratingHint}>Tap a star to rate</Text>}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.likeToggle, liked && styles.likeToggleActive]} onPress={() => setLiked(!liked)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? Colors.primary : Colors.muted} />
            <Text style={[styles.likeText, liked && styles.likeTextActive]}>{liked ? 'Loved it' : 'Add to favorites'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Review <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="What did you think? Share your thoughts..."
            placeholderTextColor={Colors.muted}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{review.length} / 500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date Listened</Text>
          <TouchableOpacity style={styles.datePicker}>
            <Ionicons name="calendar-outline" size={18} color={Colors.muted} />
            <Text style={styles.dateText}>Today, March 24</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Recommend to a friend</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendChips}>
            {['Sofia M.', 'Marcus T.', 'Priya K.', 'Jordan L.'].map((name) => (
              <TouchableOpacity key={name} style={styles.friendChip}>
                <Text style={styles.friendChipText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  navClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  navTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  saveBtnDisabled: { backgroundColor: Colors.surface },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  saveBtnTextDisabled: { color: Colors.muted },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  section: { marginBottom: 24 },
  label: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  optional: { color: Colors.muted, fontWeight: '400' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  searchResults: { backgroundColor: Colors.surface, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  resultTitle: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  resultArtist: { color: Colors.muted, fontSize: 12 },
  selectedAlbum: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: Colors.primary + '40' },
  selectedTitle: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  selectedArtist: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  selectedMeta: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ratingLabel: { color: Colors.accent, fontSize: 16, fontWeight: '700' },
  ratingHint: { color: Colors.muted, fontSize: 12, marginTop: 6 },
  likeToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  likeToggleActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  likeText: { color: Colors.muted, fontSize: 14, fontWeight: '500' },
  likeTextActive: { color: Colors.primary, fontWeight: '700' },
  reviewInput: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, color: Colors.text, fontSize: 14, lineHeight: 21, minHeight: 120, borderWidth: 1, borderColor: Colors.border },
  charCount: { color: Colors.muted, fontSize: 12, textAlign: 'right', marginTop: 6 },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  dateText: { flex: 1, color: Colors.text, fontSize: 14 },
  friendChips: { gap: 8 },
  friendChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  friendChipText: { color: Colors.textSecondary, fontSize: 13 },
});
