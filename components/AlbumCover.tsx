import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Album } from '@/constants/mockData';
import { Colors } from '@/constants/colors';

interface Props {
  album: Album;
  size?: number;
  borderRadius?: number;
}

export default function AlbumCover({ album, size = 56, borderRadius = 8 }: Props) {
  return (
    <LinearGradient
      colors={album.coverGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.cover, { width: size, height: size, borderRadius }]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.35 }]}>
        {album.artist.charAt(0)}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
  },
});
