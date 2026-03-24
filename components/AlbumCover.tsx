import React from 'react';
import { Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Album } from '@/constants/mockData';

interface Props {
  album: Album;
  size?: number;
  borderRadius?: number;
}

export default function AlbumCover({ album, size = 56, borderRadius = 8 }: Props) {
  if (album.cover && album.cover.startsWith('http')) {
    return (
      <Image
        source={{ uri: album.cover }}
        style={{ width: size, height: size, borderRadius }}
        resizeMode="cover"
      />
    );
  }

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
