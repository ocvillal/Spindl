import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Animated,
  PanResponder, TouchableOpacity, ActivityIndicator, Dimensions, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { AppTheme } from '../constants/themes';
import { Track } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';
import { searchAll } from '../services/spotify';
import { getTopTracksForPeriod } from '../services/charts';
import { supabase } from '../services/supabase';
import { useAuth } from '../store/auth';
import { useProfile } from '../store/profile';
import { useRatings } from '../store/ratings';
import {
  buildTasteProfile, scoreTrack,
  deduplicateTracks, sortedEntries,
  blendWithSimilarUsers, communityScore, hybridFinalScore, epsilonGreedyRank,
  applySwipeSignal,
  SignalEntry, SignalAction, TasteProfile,
} from '../services/recommendations';
import {
  upsertTasteVector, fetchAllTasteVectors, fetchItemSignals,
  UserTasteVector, ItemSignal,
} from '../services/cf';
import { RootStackParamList } from '../App';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const EXIT_DURATION = 220;
const SHEET_HEIGHT = 340;
const POOL_REFETCH_THRESHOLD = 5; // fetch more when pool drops below this

function openInSpotify(track: Track) {
  const isSpotifyId = /^[A-Za-z0-9]{22}$/.test(track.id);
  // Deep link opens Spotify app directly (works in production builds).
  // Falls back to web player if Spotify isn't installed or on Expo Go.
  const deepLink = isSpotifyId
    ? `spotify:track:${track.id}`
    : `spotify:search:${encodeURIComponent(`${track.title} ${track.artist}`)}`;
  const webLink = isSpotifyId
    ? `https://open.spotify.com/track/${track.id}`
    : `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist}`)}`;

  Linking.canOpenURL(deepLink)
    .then((supported) => Linking.openURL(supported ? deepLink : webLink))
    .catch(() => Linking.openURL(webLink));
}

type Action = 'listened' | 'not_heard' | 'saved';
type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── DiscoverItem ─────────────────────────────────────────────────────────────
type DiscoverItem = { kind: 'track'; item: Track };
type ScoredItem = { discoverItem: DiscoverItem; score: number };

function getItemSignalData(di: DiscoverItem): { genres: string[]; artist: string; year: number } {
  return { genres: di.item.album?.genre ?? [], artist: di.item.artist, year: di.item.album?.year ?? 0 };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const { profile } = useProfile();
  const { logSong } = useRatings();

  // Display state — only 2 cards ever rendered
  const [currentItem, setCurrentItem] = useState<DiscoverItem | null>(null);
  const [nextItem, setNextItem]       = useState<DiscoverItem | null>(null);
  const [queueSize, setQueueSize]     = useState(0);
  const [loading, setLoading]         = useState(true);

  // Rating sheet state
  const [showRating, setShowRating]   = useState(false);
  const [ratingMode, setRatingMode]   = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [actionLabel, setActionLabel] = useState<Action | null>(null);
  const [exitingItem, setExitingItem] = useState<DiscoverItem | null>(null);

  // Mutable refs — don't need re-renders
  const poolRef         = useRef<ScoredItem[]>([]);
  const profileRef      = useRef<TasteProfile | null>(null);
  const allVectorsRef   = useRef<UserTasteVector[]>([]);
  const itemSignalMapRef= useRef<Map<string, ItemSignal>>(new Map());
  const seenIdsRef      = useRef<Set<string>>(new Set());
  const isFetchingRef   = useRef(false);
  const currentItemRef  = useRef<DiscoverItem | null>(null); // stable ref for closures

  // Keep ref in sync with state
  useEffect(() => { currentItemRef.current = currentItem; }, [currentItem]);

  // ── Animations ────────────────────────────────────────────────────────────

  const exitPosition = useRef(new Animated.ValueXY()).current;
  const exitRotate = exitPosition.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], outputRange: ['-12deg', '0deg', '12deg'],
  });
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], outputRange: ['-12deg', '0deg', '12deg'],
  });
  const heardOpacity = position.x.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity  = position.x.interpolate({ inputRange: [-60, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const ratingSheetAnim = useRef(new Animated.Value(0)).current;
  const ratingSheetTranslateY = ratingSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_HEIGHT, 0] });
  const dimOpacity = ratingSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  useEffect(() => { loadItems(); }, []);

  // ── Data loading ──────────────────────────────────────────────────────────

  async function loadItems() {
    setLoading(true);
    try {
      const [
        chartTracksRes,
        { data: entriesData },
        { data: actionsData },
      ] = await Promise.all([
        getTopTracksForPeriod('week', 20),
        supabase.from('entries').select('*'),
        supabase.from('discover_actions').select('*'),
      ]);

      const seenIds = new Set<string>((actionsData ?? []).map((r: any) => String(r.track_id)));
      seenIdsRef.current = seenIds;

      const entries: SignalEntry[] = (entriesData ?? []).map((row: any) => ({
        type: row.type, rating: row.rating, liked: row.liked,
        albumData: row.type === 'album' ? row.album_data : row.track_data?.album,
      }));
      const actions: SignalAction[] = (actionsData ?? []).map((row: any) => ({
        action: row.action, rating: row.rating ?? null,
        trackData: { album: row.track_data?.album ?? {}, artist: row.track_data?.artist ?? '' },
      }));

      const tasteProfile = buildTasteProfile(profile?.genres ?? [], profile?.favArtists ?? [], entries, actions);
      profileRef.current = tasteProfile;

      if (session?.user.id) upsertTasteVector(session.user.id, tasteProfile).catch(() => {});

      const topArtists = sortedEntries(tasteProfile.artists).slice(0, 2).map(([a]) => a);
      const allCandidateIds = chartTracksRes.map((t) => t.id);

      const [artistResults, allVectors, itemSignalMap] = await Promise.all([
        Promise.allSettled(topArtists.map((a) => searchAll(a).then((r) => r.tracks))),
        fetchAllTasteVectors(),
        fetchItemSignals(allCandidateIds),
      ]);

      allVectorsRef.current    = allVectors;
      itemSignalMapRef.current = itemSignalMap;

      const artistTracks = artistResults.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
      const blendedProfile = session?.user.id
        ? blendWithSimilarUsers(tasteProfile, allVectors, session.user.id)
        : tasteProfile;

      let allTracks = deduplicateTracks([...chartTracksRes, ...artistTracks]).filter((t) => !seenIds.has(t.id));

      // If everything has been seen, reset and show full pool again
      if (allTracks.length === 0) {
        seenIdsRef.current = new Set();
        allTracks = deduplicateTracks([...chartTracksRes, ...artistTracks]);
      }

      const scored = buildScoredPool(allTracks, blendedProfile, itemSignalMap, tasteProfile.signalCount);
      poolRef.current = scored;

      showTopTwo(scored);
    } catch (e) {
      console.error('[Discover] load error:', e);
    }
    setLoading(false);
  }

  /** Score + rank all candidates into a ScoredItem pool. */
  function buildScoredPool(
    tracks: Track[],
    blended: TasteProfile,
    signalMap: Map<string, ItemSignal>,
    signalCount: number,
  ): ScoredItem[] {
    const scored: ScoredItem[] = tracks.map((t) => ({
      discoverItem: { kind: 'track', item: t },
      score: hybridFinalScore(scoreTrack(t, blended), communityScore(signalMap.get(t.id)), signalCount),
    }));
    return epsilonGreedyRank(scored.sort((a, b) => b.score - a.score));
  }

  function showTopTwo(pool: ScoredItem[]) {
    setCurrentItem(pool[0]?.discoverItem ?? null);
    setNextItem(pool[1]?.discoverItem ?? null);
    setQueueSize(pool.length);
  }

  /** Re-rank the remaining pool after a swipe updates the profile. */
  function reRankPool(pool: ScoredItem[]): ScoredItem[] {
    const p = profileRef.current;
    if (!p) return pool;
    const blended = session?.user.id
      ? blendWithSimilarUsers(p, allVectorsRef.current, session.user.id)
      : p;
    const signalMap = itemSignalMapRef.current;

    for (const entry of pool) {
      entry.score = hybridFinalScore(
        scoreTrack(entry.discoverItem.item, blended),
        communityScore(signalMap.get(entry.discoverItem.item.id)),
        p.signalCount,
      );
    }
    return pool.sort((a, b) => b.score - a.score);
  }

  /**
   * Core adaptive step — called after every swipe action.
   * Updates the taste profile with the swipe signal, re-ranks the remaining pool,
   * and immediately promotes the best next card.
   */
  function advanceQueue(swipedItem: DiscoverItem, action: Action, rating: number | null) {
    seenIdsRef.current.add(swipedItem.item.id);

    // 1. Update live taste profile with this swipe
    if (profileRef.current) {
      const { genres, artist, year } = getItemSignalData(swipedItem);
      profileRef.current = applySwipeSignal(profileRef.current, genres, artist, year, action, rating);
    }

    // 2. Remove swiped item, re-rank with updated profile
    const remaining = poolRef.current.filter((s) => s.discoverItem.item.id !== swipedItem.item.id);
    const reRanked = reRankPool(remaining);
    poolRef.current = reRanked;

    // 3. Promote new top items to display
    showTopTwo(reRanked);

    // 4. Background-fetch more candidates if pool is running low
    if (reRanked.length < POOL_REFETCH_THRESHOLD && !isFetchingRef.current) {
      fetchMoreCandidates();
    }
  }

  async function fetchMoreCandidates() {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const moreTracks = await getTopTracksForPeriod('week', 20);
      const p = profileRef.current;
      if (!p) return;

      const blended = session?.user.id
        ? blendWithSimilarUsers(p, allVectorsRef.current, session.user.id)
        : p;

      const existingIds = new Set(poolRef.current.map((s) => s.discoverItem.item.id));
      const freshTracks = deduplicateTracks(moreTracks).filter(
        (t) => !seenIdsRef.current.has(t.id) && !existingIds.has(t.id)
      );

      if (freshTracks.length === 0) return;

      const newSignals = await fetchItemSignals(freshTracks.map((t) => t.id));
      for (const [k, v] of newSignals) itemSignalMapRef.current.set(k, v);

      const newScored = buildScoredPool(freshTracks, blended, itemSignalMapRef.current, p.signalCount);
      const merged = reRankPool([...poolRef.current, ...newScored]);
      poolRef.current = merged;

      if (!currentItem) showTopTwo(merged);
      else setQueueSize(merged.length);
    } catch (e) {
      console.error('[Discover] fetchMore error:', e);
    }
    isFetchingRef.current = false;
  }

  // ── Swipe / button handlers ────────────────────────────────────────────────

  const commitSwipeRef = useRef<(action: Action, direction: 'left' | 'right' | 'up') => void>(() => {});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        {
          useNativeDriver: false,
          listener: ((_: any, gesture: any) => {
            if (gesture.dx > 60) setActionLabel('listened');
            else if (gesture.dx < -60) setActionLabel('not_heard');
            else if (gesture.dy < -60) setActionLabel('saved');
            else setActionLabel(null);
          }) as any,
        }
      ) as any,
      onPanResponderRelease: (_, gesture) => {
        setActionLabel(null);
        if (gesture.dx > SWIPE_THRESHOLD)       commitSwipeRef.current('listened', 'right');
        else if (gesture.dx < -SWIPE_THRESHOLD) commitSwipeRef.current('not_heard', 'left');
        else if (gesture.dy < -SWIPE_THRESHOLD) commitSwipeRef.current('saved', 'up');
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false, tension: 80, friction: 8 }).start();
      },
    })
  ).current;

  function commitSwipe(action: Action, direction: 'left' | 'right' | 'up') {
    const current = currentItemRef.current;
    if (!current) return;

    const toX = direction === 'right' ? SCREEN_WIDTH * 1.5 : direction === 'left' ? -SCREEN_WIDTH * 1.5 : 0;
    const toY = direction === 'up' ? -SCREEN_WIDTH * 1.5 : 0;

    exitPosition.setValue({ x: (position.x as any)._value, y: (position.y as any)._value });
    setExitingItem(current);
    Animated.timing(exitPosition, { toValue: { x: toX, y: toY }, duration: EXIT_DURATION, useNativeDriver: false })
      .start(() => setExitingItem(null));

    if (action === 'listened') {
      position.setValue({ x: toX, y: toY });
      setRatingMode(true);
      Animated.spring(ratingSheetAnim, { toValue: 1, useNativeDriver: false, tension: 80, friction: 8 })
        .start(({ finished }) => { if (finished) setShowRating(true); });
    } else {
      ratingSheetAnim.setValue(0);
      if (action === 'saved') openInSpotify(current.item);
      saveAction(action, null, current);
      advanceQueue(current, action, null);
      requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
    }
  }
  commitSwipeRef.current = commitSwipe;

  function handleButton(action: Action) {
    const current = currentItemRef.current;
    if (!current) return;

    const toX = action === 'listened' ? SCREEN_WIDTH * 1.5 : action === 'not_heard' ? -SCREEN_WIDTH * 1.5 : 0;
    const toY = action === 'saved' ? -SCREEN_WIDTH * 1.5 : 0;

    exitPosition.setValue({ x: 0, y: 0 });
    setExitingItem(current);
    Animated.timing(exitPosition, { toValue: { x: toX, y: toY }, duration: EXIT_DURATION, useNativeDriver: false })
      .start(() => setExitingItem(null));

    if (action === 'listened') {
      position.setValue({ x: toX, y: toY });
      setRatingMode(true);
      Animated.spring(ratingSheetAnim, { toValue: 1, useNativeDriver: false, tension: 80, friction: 8 })
        .start(({ finished }) => { if (finished) setShowRating(true); });
    } else {
      ratingSheetAnim.setValue(0);
      if (action === 'saved') openInSpotify(current.item);
      saveAction(action, null, current);
      advanceQueue(current, action, null);
      requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
    }
  }

  async function saveAction(action: Action, rating: number | null, item: DiscoverItem) {
    if (!session) return;
    await supabase.from('discover_actions').upsert(
      { user_id: session.user.id, track_id: item.item.id, track_data: item.item, action, rating },
      { onConflict: 'user_id,track_id' }
    );
  }

  function nextCard(rating: number) {
    const current = currentItemRef.current;
    Animated.timing(ratingSheetAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
      setShowRating(false);
      setRatingMode(false);
      setPendingRating(0);
      if (current) {
        saveAction('listened', rating || null, current);
        advanceQueue(current, 'listened', rating || null);
        // Add to collection — rating > 0 means the user rated; 0 means they skipped
        logSong(current.item, rating || 3, '', false).catch(() => {});
      }
      requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!currentItem) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptySubtitle}>Check back later for more discoveries</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>What's your vibe today?</Text>
      </View>

      <View style={styles.cardStack}>
        {nextItem && (
          <View style={[styles.card, styles.cardBehind]}>
            {renderCardContent(nextItem, colors, styles, null)}
          </View>
        )}

        {!ratingMode && (
          <Animated.View
            style={[styles.card, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}
            {...panResponder.panHandlers}
          >
            <Animated.View style={[styles.swipeIndicator, styles.heardIndicator, { opacity: heardOpacity }]}>
              <Text style={styles.swipeIndicatorText}>HEARD IT ♥</Text>
            </Animated.View>
            <Animated.View style={[styles.swipeIndicator, styles.nopeIndicator, { opacity: nopeOpacity }]}>
              <Text style={styles.swipeIndicatorText}>NOPE ✕</Text>
            </Animated.View>
            {renderCardContent(currentItem, colors, styles, navigation)}
          </Animated.View>
        )}

        {exitingItem && (
          <Animated.View
            style={[styles.card, styles.exitCard, {
              transform: [{ translateX: exitPosition.x }, { translateY: exitPosition.y }, { rotate: exitRotate }],
            }]}
            pointerEvents="none"
          >
            {renderCardContent(exitingItem, colors, styles, null)}
          </Animated.View>
        )}
      </View>

      <Animated.View style={[StyleSheet.absoluteFill, styles.dimOverlay, { opacity: dimOpacity }]} pointerEvents="none" />

      <Animated.View
        style={[styles.ratingSheet, { transform: [{ translateY: ratingSheetTranslateY }] }]}
        pointerEvents={showRating ? 'auto' : 'none'}
      >
        <Text style={styles.ratingTitle}>How was it?</Text>
        <Text style={styles.ratingSubtitle}>
          {currentItem.kind === 'track' ? currentItem.item.title : currentItem.item.title}
        </Text>
        <StarRating rating={pendingRating} size={42} interactive onRate={setPendingRating} />
        <View style={styles.ratingActions}>
          <TouchableOpacity style={styles.skipRatingBtn} onPress={() => nextCard(0)}>
            <Text style={styles.skipRatingText}>Skip rating</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveRatingBtn, pendingRating === 0 && styles.saveRatingBtnDisabled]}
            disabled={pendingRating === 0}
            onPress={() => nextCard(pendingRating)}
          >
            <Text style={styles.saveRatingText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {!ratingMode && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionNope]} onPress={() => handleButton('not_heard')}>
            <Ionicons name="close" size={28} color="#E57373" />
            <Text style={[styles.actionLabel, { color: '#E57373' }]}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionSave]} onPress={() => handleButton('saved')}>
            <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
            <Text style={[styles.actionLabel, { color: colors.accent }]}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionHeart]} onPress={() => handleButton('listened')}>
            <Ionicons name="heart" size={28} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>Heard it</Text>
          </TouchableOpacity>
        </View>
      )}

      {!ratingMode && (
        <Text style={styles.counter}>
          {queueSize > 0 ? `${queueSize} in queue` : 'Loading more…'}
        </Text>
      )}
    </SafeAreaView>
  );
}

// ─── Card content renderer ────────────────────────────────────────────────────

function renderCardContent(
  discoverItem: DiscoverItem,
  colors: AppTheme,
  styles: ReturnType<typeof makeStyles>,
  _navigation: NativeStackNavigationProp<RootStackParamList> | null,
) {
  const track = discoverItem.item;
  return (
    <>
      <AlbumCover album={track.album} size={SCREEN_WIDTH - 80} borderRadius={20} />
      <View style={styles.cardInfo}>
        <View style={styles.cardTypeBadge}>
          <Ionicons name="musical-note" size={11} color={colors.muted} />
          <Text style={styles.cardTypeLabel}>Song</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.cardArtist} numberOfLines={1}>{track.artist}</Text>
        <Text style={styles.cardAlbum} numberOfLines={1}>{track.album.title}</Text>
        <Text style={styles.cardDuration}>{track.duration}</Text>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_SIZE = SCREEN_WIDTH - 40;

function makeStyles(colors: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    emptySubtitle: { color: colors.muted, fontSize: 14, textAlign: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 12 },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
    cardStack: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, overflow: 'hidden' },
    card: {
      position: 'absolute', width: CARD_SIZE,
      backgroundColor: colors.surface, borderRadius: 24, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
      borderWidth: 1, borderColor: colors.border, gap: 10,
    },
    cardBehind: { transform: [{ scale: 0.95 }], opacity: 0.7 },
    exitCard: { zIndex: 10 },
    cardInfo: { gap: 4 },
    cardTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    cardTypeLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    cardTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    cardArtist: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
    cardAlbum: { color: colors.muted, fontSize: 13 },
    cardDuration: { color: colors.muted, fontSize: 12 },
    swipeIndicator: {
      position: 'absolute', top: 24, zIndex: 10,
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 3,
    },
    heardIndicator: { right: 16, borderColor: colors.primary, backgroundColor: colors.primaryDim },
    nopeIndicator: { left: 16, borderColor: '#E57373', backgroundColor: '#FDECEA' },
    swipeIndicatorText: { fontWeight: '800', fontSize: 16, letterSpacing: 1, color: colors.text },
    actions: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 20, paddingBottom: 8 },
    actionBtn: {
      alignItems: 'center', gap: 4, backgroundColor: colors.surface,
      borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14,
      borderWidth: 1, borderColor: colors.border, flex: 1,
    },
    actionNope: { borderColor: '#FFCDD2' },
    actionSave: { borderColor: colors.border },
    actionHeart: { borderColor: '#FFD9CC' },
    actionLabel: { fontSize: 11, fontWeight: '700' },
    counter: { color: colors.muted, fontSize: 12, textAlign: 'center', paddingBottom: 8 },
    dimOverlay: { backgroundColor: 'rgba(0,0,0,0.45)' },
    ratingSheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 28, paddingBottom: 40, gap: 16, alignItems: 'center',
    },
    ratingTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    ratingSubtitle: { color: colors.muted, fontSize: 14 },
    ratingActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
    skipRatingBtn: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 12,
      paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    skipRatingText: { color: colors.muted, fontWeight: '600' },
    saveRatingBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    saveRatingBtnDisabled: { opacity: 0.4 },
    saveRatingText: { color: colors.background, fontWeight: '800' },
  });
}
