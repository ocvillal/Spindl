import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityItem } from '@/constants/mockData';
import { Colors } from '@/constants/colors';
import Avatar from './Avatar';
import AlbumCover from './AlbumCover';
import StarRating from './StarRating';

interface Props {
  item: ActivityItem;
  onAlbumPress?: (albumId: string) => void;
}

function activityLabel(item: ActivityItem): string {
  switch (item.type) {
    case 'review':   return 'reviewed';
    case 'log':      return 'listened to';
    case 'like':     return 'hearted';
    case 'list':     return 'added to a list';
    case 'recommend': return `recommended to ${item.recommendedTo?.name}`;
  }
}

export default function ActivityCard({ item, onAlbumPress }: Props) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar user={item.user} size={38} showOnline />
        <View style={styles.headerText}>
          <View style={styles.headerRow}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.action}> {activityLabel(item)}</Text>
          </View>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
      </View>

      {/* Album row */}
      <TouchableOpacity
        style={styles.albumRow}
        onPress={() => onAlbumPress?.(item.album.id)}
        activeOpacity={0.75}
      >
        <AlbumCover album={item.album} size={52} />
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle} numberOfLines={1}>{item.album.title}</Text>
          <Text style={styles.albumArtist}>{item.album.artist} · {item.album.year}</Text>
          {item.review && <StarRating rating={item.review.rating} size={12} />}
        </View>
        {item.type === 'like' && (
          <Ionicons name="heart" size={20} color={Colors.primary} />
        )}
        {item.type === 'recommend' && (
          <Ionicons name="paper-plane" size={18} color={Colors.accent} />
        )}
      </TouchableOpacity>

      {/* Review text */}
      {item.review?.text && (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewText} numberOfLines={3}>
            "{item.review.text}"
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart-outline" size={16} color={Colors.muted} />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.muted} />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="paper-plane-outline" size={16} color={Colors.muted} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userName: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  action: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  timestamp: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
  },
  albumInfo: {
    flex: 1,
    gap: 3,
  },
  albumTitle: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  albumArtist: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  reviewBox: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    paddingLeft: 10,
  },
  reviewText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    color: Colors.muted,
    fontSize: 13,
  },
});
