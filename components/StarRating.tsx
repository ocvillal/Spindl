import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/theme';
import { AppTheme } from '@/constants/themes';

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, size = 14, interactive = false, onRate }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
              <Ionicons name={iconName} size={size} color={filled || half ? colors.star : colors.starEmpty} />
            </TouchableOpacity>
          );
        }

        return (
          <Ionicons
            key={star}
            name={iconName}
            size={size}
            color={filled || half ? colors.star : colors.starEmpty}
          />
        );
      })}
    </View>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 2,
    },
  });
}
