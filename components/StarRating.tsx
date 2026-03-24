import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, size = 14, interactive = false, onRate }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        const iconName = filled ? 'star' : half ? 'star-half' : 'star-outline';

        if (interactive) {
          return (
            <TouchableOpacity key={star} onPress={() => onRate?.(star)} hitSlop={6}>
              <Ionicons name={iconName} size={size} color={filled || half ? Colors.star : Colors.starEmpty} />
            </TouchableOpacity>
          );
        }

        return (
          <Ionicons
            key={star}
            name={iconName}
            size={size}
            color={filled || half ? Colors.star : Colors.starEmpty}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
