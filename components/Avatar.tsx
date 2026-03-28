import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '@/constants/mockData';
import { useTheme } from '@/store/theme';
import { AppTheme } from '@/constants/themes';

interface Props {
  user: User;
  size?: number;
  showOnline?: boolean;
}

export default function Avatar({ user, size = 36, showOnline = false }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fontSize = size * 0.38;
  const dotSize = size * 0.3;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: user.avatarColor,
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{user.avatarInitials}</Text>
      </View>
      {showOnline && user.isOnline && (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    avatar: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    initials: {
      color: '#fff',
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    onlineDot: {
      position: 'absolute',
      backgroundColor: colors.online,
      borderWidth: 2,
      borderColor: colors.background,
    },
  });
}
