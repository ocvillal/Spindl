import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './store/auth';
import { ProfileProvider, useProfile } from './store/profile';
import { RatingsProvider } from './store/ratings';
import { ThemeProvider, useTheme } from './store/theme';
import { AppTheme } from './constants/themes';

import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import CollectionScreen from './screens/CollectionScreen';
import ProfileScreen from './screens/ProfileScreen';
import AlbumDetailScreen from './screens/AlbumDetailScreen';
import LogScreen from './screens/LogScreen';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/onboarding/OnboardingScreen';
import SettingsScreen from './screens/SettingsScreen';

import { Album, Track } from './constants/mockData';

export type RootStackParamList = {
  MainTabs: undefined;
  AlbumDetail: { id: string; query?: string };
  Log: { album?: Album; track?: Track } | undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: React.ComponentProps<typeof Ionicons>['name']; focused: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeTabStyles(colors), [colors]);
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={focused ? colors.primary : colors.muted} />
    </View>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeTabStyles(colors), [colors]);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} /> }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.discoverBtn, focused && styles.discoverBtnActive]}>
              <Ionicons name="play-circle" size={28} color={focused ? colors.background : colors.primary} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'disc' : 'disc-outline'} focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen
        name="Log"
        component={LogScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { colors, isDark } = useTheme();

  if (authLoading || profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!session ? <AuthScreen /> : (!profile || !profile.onboarded) ? <OnboardingScreen /> : <MainStack />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <RatingsProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </RatingsProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function makeTabStyles(colors: AppTheme) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.surface,
      borderTopWidth: 0,
      elevation: 0,
      height: 68,
      paddingBottom: 10,
      paddingTop: 8,
    },
    iconWrap: {
      width: 44, height: 36,
      justifyContent: 'center', alignItems: 'center',
      borderRadius: 12,
    },
    iconWrapActive: { backgroundColor: colors.primaryDim },
    discoverBtn: {
      width: 52, height: 52, borderRadius: 26,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: colors.primaryDim,
      borderWidth: 2, borderColor: colors.primary,
      marginBottom: 8,
    },
    discoverBtnActive: {
      backgroundColor: colors.primary,
    },
  });
}
