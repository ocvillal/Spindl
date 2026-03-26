import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Animated,
  PanResponder, TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Track } from '../constants/mockData';
import AlbumCover from '../components/AlbumCover';
import StarRating from '../components/StarRating';
import { searchAll } from '../services/spotify';
import { supabase } from '../services/supabase';
import { useAuth } from '../store/auth';
import { useProfile } from '../store/profile';
import {
  buildTasteProfile, buildSpotifyQueries, scoreTrack,
  rankWithDiversity, deduplicateTracks, SignalEntry, SignalAction,
} from '../services/recommendations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const EXIT_DURATION = 220;
const SHEET_HEIGHT = 340;

type Action = 'listened' | 'not_heard' | 'saved';

export default function DiscoverScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);   // sheet fully open, interactions enabled
  const [ratingMode, setRatingMode] = useState(false);   // sheet animating or open — hides buttons immediately
  const [pendingRating, setPendingRating] = useState(0);
  const [actionLabel, setActionLabel] = useState<Action | null>(null);

  const [exitingTrack, setExitingTrack] = useState<Track | null>(null);
  const exitPosition = useRef(new Animated.ValueXY()).current;
  const exitRotate = exitPosition.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const heardOpacity = position.x.interpolate({
    inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-60, 0], outputRange: [1, 0], extrapolate: 'clamp',
  });

  // Rating sheet — driven by this value: 0 = hidden, 1 = fully visible.
  // Updated live during gesture so the sheet peeks as the user swipes right.
  const ratingSheetAnim = useRef(new Animated.Value(0)).current;
  const ratingSheetTranslateY = ratingSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });
  // Dim overlay is a SEPARATE layer — never applied to the sheet itself so
  // the sheet stays fully opaque.
  const dimOpacity = ratingSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => { loadTracks(); }, []);

  async function loadTracks() {
    setLoading(true);
    try {
      const [{ data: entriesData }, { data: actionsData }] = await Promise.all([
        supabase.from('entries').select('*'),
        supabase.from('discover_actions').select('*'),
      ]);
      const entries: SignalEntry[] = (entriesData ?? []).map((row: any) => ({
        type: row.type, rating: row.rating, liked: row.liked,
        albumData: row.type === 'album' ? row.album_data : row.track_data?.album,
      }));
      const actions: SignalAction[] = (actionsData ?? []).map((row: any) => ({
        action: row.action, rating: row.rating ?? null,
        trackData: { album: row.track_data?.album, artist: row.track_data?.artist ?? '' },
      }));
      const tasteProfile = buildTasteProfile(profile?.genres ?? [], profile?.favArtists ?? [], entries, actions);
      const queries = buildSpotifyQueries(tasteProfile, profile?.genres ?? []);
      const results = await Promise.allSettled(queries.map((q) => searchAll(q).then((r) => r.tracks)));
      const allTracks = results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
      const deduped = deduplicateTracks(allTracks);
      const scored = deduped.map((t) => ({ track: t, score: scoreTrack(t, tasteProfile) }));
      const ranked = rankWithDiversity(scored);
      setTracks(ranked.length > 0 ? ranked : deduped);
    } catch (e) {
      console.error('[Discover] load error:', e);
    }
    setLoading(false);
  }

  // Always points to the latest commitSwipe so the pan responder is never stale.
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
        if (gesture.dx > SWIPE_THRESHOLD) {
          commitSwipeRef.current('listened', 'right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          commitSwipeRef.current('not_heard', 'left');
        } else if (gesture.dy < -SWIPE_THRESHOLD) {
          commitSwipeRef.current('saved', 'up');
        } else {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false, tension: 80, friction: 8 }).start();
        }
      },
    })
  ).current;

  function commitSwipe(action: Action, direction: 'left' | 'right' | 'up') {
    const track = tracks[currentIndex];
    if (!track) return;

    const toX = direction === 'right' ? SCREEN_WIDTH * 1.5 : direction === 'left' ? -SCREEN_WIDTH * 1.5 : 0;
    const toY = direction === 'up' ? -SCREEN_WIDTH * 1.5 : 0;

    exitPosition.setValue({ x: (position.x as any)._value, y: (position.y as any)._value });
    setExitingTrack(track);
    Animated.timing(exitPosition, { toValue: { x: toX, y: toY }, duration: EXIT_DURATION, useNativeDriver: false })
      .start(() => setExitingTrack(null));

    if (action === 'listened') {
      position.setValue({ x: toX, y: toY });
      setRatingMode(true); // immediately hides buttons/counter before animation starts
      Animated.spring(ratingSheetAnim, { toValue: 1, useNativeDriver: false, tension: 80, friction: 8 })
        .start(({ finished }) => { if (finished) setShowRating(true); });
    } else {
      ratingSheetAnim.setValue(0);
      saveAction(action, null);
      setCurrentIndex((i) => i + 1);
      setPendingRating(0);
      requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
    }
  }
  commitSwipeRef.current = commitSwipe;

  function handleButton(action: Action) {
    const track = tracks[currentIndex];
    if (!track) return;

    const toX = action === 'listened' ? SCREEN_WIDTH * 1.5 : action === 'not_heard' ? -SCREEN_WIDTH * 1.5 : 0;
    const toY = action === 'saved' ? -SCREEN_WIDTH * 1.5 : 0;

    exitPosition.setValue({ x: 0, y: 0 });
    setExitingTrack(track);
    Animated.timing(exitPosition, { toValue: { x: toX, y: toY }, duration: EXIT_DURATION, useNativeDriver: false })
      .start(() => setExitingTrack(null));

    if (action === 'listened') {
      position.setValue({ x: toX, y: toY });
      setRatingMode(true);
      Animated.spring(ratingSheetAnim, { toValue: 1, useNativeDriver: false, tension: 80, friction: 8 })
        .start(({ finished }) => { if (finished) setShowRating(true); });
    } else {
      ratingSheetAnim.setValue(0);
      saveAction(action, null);
      setCurrentIndex((i) => i + 1);
      setPendingRating(0);
      requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
    }
  }

  async function saveAction(action: Action, rating: number | null) {
    const track = tracks[currentIndex];
    if (!track || !session) return;
    await supabase.from('discover_actions').upsert(
      { user_id: session.user.id, track_id: track.id, track_data: track, action, rating },
      { onConflict: 'user_id,track_id' }
    );
  }

  function nextCard() {
    Animated.timing(ratingSheetAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
      setShowRating(false);
      setRatingMode(false);
      setCurrentIndex((i) => i + 1);
      setPendingRating(0);
      requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  const currentTrack = tracks[currentIndex];
  const nextTrack = tracks[currentIndex + 1];

  // Queue exhausted — loop back silently with a fresh ranked order
  if (!currentTrack && tracks.length > 0) {
    setCurrentIndex(0);
  }
  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
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
        {nextTrack && (
          <View style={[styles.card, styles.cardBehind]}>
            <AlbumCover album={nextTrack.album} size={SCREEN_WIDTH - 80} borderRadius={20} />
            <Text style={styles.cardTitle} numberOfLines={1}>{nextTrack.title}</Text>
            <Text style={styles.cardArtist} numberOfLines={1}>{nextTrack.artist}</Text>
          </View>
        )}

        {/* Main card */}
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
            <AlbumCover album={currentTrack.album} size={SCREEN_WIDTH - 80} borderRadius={20} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.cardArtist} numberOfLines={1}>{currentTrack.artist}</Text>
              <Text style={styles.cardAlbum} numberOfLines={1}>{currentTrack.album.title}</Text>
              <Text style={styles.cardDuration}>{currentTrack.duration}</Text>
            </View>
          </Animated.View>
        )}

        {/* Exit card — no interaction, animates away independently */}
        {exitingTrack && (
          <Animated.View
            style={[styles.card, styles.exitCard, { transform: [{ translateX: exitPosition.x }, { translateY: exitPosition.y }, { rotate: exitRotate }] }]}
            pointerEvents="none"
          >
            <AlbumCover album={exitingTrack.album} size={SCREEN_WIDTH - 80} borderRadius={20} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{exitingTrack.title}</Text>
              <Text style={styles.cardArtist} numberOfLines={1}>{exitingTrack.artist}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Dim overlay — fades in independently, never applied to the sheet so sheet stays opaque */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.dimOverlay, { opacity: dimOpacity }]} pointerEvents="none" />

      {/* Sheet — slides up from bottom, always fully opaque */}
      <Animated.View
        style={[styles.ratingSheet, { transform: [{ translateY: ratingSheetTranslateY }] }]}
        pointerEvents={showRating ? 'auto' : 'none'}
      >
        <Text style={styles.ratingTitle}>How was it?</Text>
        <Text style={styles.ratingSubtitle}>{currentTrack.title}</Text>
        <StarRating rating={pendingRating} size={42} interactive onRate={setPendingRating} />
        <View style={styles.ratingActions}>
          <TouchableOpacity style={styles.skipRatingBtn} onPress={() => { saveAction('listened', null); nextCard(); }}>
            <Text style={styles.skipRatingText}>Skip rating</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveRatingBtn, pendingRating === 0 && styles.saveRatingBtnDisabled]}
            disabled={pendingRating === 0}
            onPress={() => { saveAction('listened', pendingRating); nextCard(); }}
          >
            <Text style={styles.saveRatingText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Action buttons */}
      {!ratingMode && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionNope]} onPress={() => handleButton('not_heard')}>
            <Ionicons name="close" size={28} color="#E57373" />
            <Text style={[styles.actionLabel, { color: '#E57373' }]}>Never heard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionSave]} onPress={() => handleButton('saved')}>
            <Ionicons name="bookmark" size={24} color={Colors.accent} />
            <Text style={[styles.actionLabel, { color: Colors.accent }]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionHeart]} onPress={() => handleButton('listened')}>
            <Ionicons name="heart" size={28} color={Colors.primary} />
            <Text style={[styles.actionLabel, { color: Colors.primary }]}>Heard it</Text>
          </TouchableOpacity>
        </View>
      )}

      {!ratingMode && <Text style={styles.counter}>{currentIndex + 1} / {tracks.length}</Text>}
    </SafeAreaView>
  );
}

const CARD_SIZE = SCREEN_WIDTH - 40;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 12 },
  title: { color: Colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  cardStack: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, overflow: 'hidden' },
  card: {
    position: 'absolute', width: CARD_SIZE,
    backgroundColor: Colors.surface, borderRadius: 24, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  cardBehind: { transform: [{ scale: 0.95 }], opacity: 0.7 },
  exitCard: { zIndex: 10 },
  cardInfo: { gap: 4 },
  cardTitle: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  cardArtist: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  cardAlbum: { color: Colors.muted, fontSize: 13 },
  cardDuration: { color: Colors.muted, fontSize: 12 },
  swipeIndicator: {
    position: 'absolute', top: 24, zIndex: 10,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 3,
  },
  heardIndicator: { right: 16, borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  nopeIndicator: { left: 16, borderColor: '#E57373', backgroundColor: '#FDECEA' },
  swipeIndicatorText: { fontWeight: '800', fontSize: 16, letterSpacing: 1, color: Colors.text },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 20, paddingBottom: 8 },
  actionBtn: {
    alignItems: 'center', gap: 4, backgroundColor: Colors.surface,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border, flex: 1,
  },
  actionNope: { borderColor: '#FFCDD2' },
  actionSave: { borderColor: Colors.border },
  actionHeart: { borderColor: '#FFD9CC' },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  counter: { color: Colors.muted, fontSize: 12, textAlign: 'center', paddingBottom: 8 },
  dimOverlay: { backgroundColor: 'rgba(0,0,0,0.45)' },
  ratingSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 40, gap: 16, alignItems: 'center',
  },
  ratingTitle: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  ratingSubtitle: { color: Colors.muted, fontSize: 14 },
  ratingActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  skipRatingBtn: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  skipRatingText: { color: Colors.muted, fontWeight: '600' },
  saveRatingBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveRatingBtnDisabled: { opacity: 0.4 },
  saveRatingText: { color: Colors.background, fontWeight: '800' },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  reloadBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  reloadBtnText: { color: Colors.background, fontWeight: '700' },
});
