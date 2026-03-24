export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string[];
  cover: string; // placeholder color for mock
  coverGradient: [string, string];
  trackCount: number;
  duration: string;
}

export interface Review {
  id: string;
  userId: string;
  albumId: string;
  rating: number; // 0.5 - 5
  text: string;
  date: string;
  liked: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  avatarInitials: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  albumsLogged: number;
  isFollowing?: boolean;
  isOnline?: boolean;
}

export interface ActivityItem {
  id: string;
  user: User;
  type: 'review' | 'log' | 'like' | 'list' | 'recommend';
  album: Album;
  review?: Review;
  recommendedTo?: User;
  timestamp: string;
}

export interface DiaryEntry {
  id: string;
  album: Album;
  date: string;
  rating: number;
  review?: string;
  liked: boolean;
}

// ─── Mock Albums ────────────────────────────────────────────────
export const MOCK_ALBUMS: Album[] = [
  {
    id: 'a1',
    title: 'Currents',
    artist: 'Tame Impala',
    year: 2015,
    genre: ['Psychedelic Pop', 'Indie'],
    cover: '#2563EB',
    coverGradient: ['#1E40AF', '#7C3AED'],
    trackCount: 13,
    duration: '51 min',
  },
  {
    id: 'a2',
    title: 'blonde',
    artist: 'Frank Ocean',
    year: 2016,
    genre: ['R&B', 'Neo Soul'],
    cover: '#D97706',
    coverGradient: ['#B45309', '#F59E0B'],
    trackCount: 17,
    duration: '60 min',
  },
  {
    id: 'a3',
    title: 'good kid, m.A.A.d city',
    artist: 'Kendrick Lamar',
    year: 2012,
    genre: ['Hip-Hop', 'West Coast'],
    cover: '#DC2626',
    coverGradient: ['#991B1B', '#EF4444'],
    trackCount: 12,
    duration: '68 min',
  },
  {
    id: 'a4',
    title: 'Melodrama',
    artist: 'Lorde',
    year: 2017,
    genre: ['Art Pop', 'Electropop'],
    cover: '#7C3AED',
    coverGradient: ['#5B21B6', '#A78BFA'],
    trackCount: 11,
    duration: '40 min',
  },
  {
    id: 'a5',
    title: 'IGOR',
    artist: 'Tyler, the Creator',
    year: 2019,
    genre: ['Neo Soul', 'Hip-Hop'],
    cover: '#059669',
    coverGradient: ['#047857', '#34D399'],
    trackCount: 12,
    duration: '39 min',
  },
  {
    id: 'a6',
    title: 'Tranquility Base Hotel',
    artist: 'Arctic Monkeys',
    year: 2018,
    genre: ['Art Rock', 'Space Rock'],
    cover: '#0E7490',
    coverGradient: ['#0C4A6E', '#0EA5E9'],
    trackCount: 11,
    duration: '41 min',
  },
  {
    id: 'a7',
    title: 'Norman Fucking Rockwell!',
    artist: 'Lana Del Rey',
    year: 2019,
    genre: ['Dream Pop', 'Baroque Pop'],
    cover: '#BE185D',
    coverGradient: ['#9D174D', '#F472B6'],
    trackCount: 14,
    duration: '67 min',
  },
  {
    id: 'a8',
    title: 'To Pimp a Butterfly',
    artist: 'Kendrick Lamar',
    year: 2015,
    genre: ['Jazz Rap', 'Funk'],
    cover: '#92400E',
    coverGradient: ['#78350F', '#FBBF24'],
    trackCount: 16,
    duration: '79 min',
  },
];

// ─── Mock Users ─────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Octavio',
    username: 'octavio',
    avatarColor: '#E8547A',
    avatarInitials: 'OV',
    bio: 'chasing the perfect album',
    followersCount: 142,
    followingCount: 89,
    albumsLogged: 312,
    isOnline: true,
  },
  {
    id: 'u2',
    name: 'Sofia M.',
    username: 'sofialistens',
    avatarColor: '#A78BFA',
    avatarInitials: 'SM',
    bio: 'jazz & late nights ☁️',
    followersCount: 88,
    followingCount: 102,
    albumsLogged: 204,
    isFollowing: true,
    isOnline: true,
  },
  {
    id: 'u3',
    name: 'Marcus T.',
    username: 'marcust',
    avatarColor: '#34D399',
    avatarInitials: 'MT',
    bio: 'vinyl collector | hip-hop head',
    followersCount: 321,
    followingCount: 180,
    albumsLogged: 540,
    isFollowing: true,
    isOnline: false,
  },
  {
    id: 'u4',
    name: 'Priya K.',
    username: 'priyak',
    avatarColor: '#F5A623',
    avatarInitials: 'PK',
    bio: 'indie pop, art rock, everything in between',
    followersCount: 67,
    followingCount: 73,
    albumsLogged: 188,
    isFollowing: true,
    isOnline: false,
  },
  {
    id: 'u5',
    name: 'Jordan Lee',
    username: 'jlee',
    avatarColor: '#60A5FA',
    avatarInitials: 'JL',
    bio: 'post-punk revival era enjoyer',
    followersCount: 210,
    followingCount: 134,
    albumsLogged: 430,
    isFollowing: false,
    isOnline: true,
  },
];

// ─── Mock Activity Feed ─────────────────────────────────────────
export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'act1',
    user: MOCK_USERS[1],
    type: 'review',
    album: MOCK_ALBUMS[0],
    review: {
      id: 'r1',
      userId: 'u2',
      albumId: 'a1',
      rating: 4.5,
      text: 'Kevin Parker somehow bottled the feeling of dissociation and turned it into a bop. "Eventually" hits different at 2am.',
      date: '2h ago',
      liked: true,
    },
    timestamp: '2h ago',
  },
  {
    id: 'act2',
    user: MOCK_USERS[2],
    type: 'log',
    album: MOCK_ALBUMS[7],
    timestamp: '4h ago',
  },
  {
    id: 'act3',
    user: MOCK_USERS[3],
    type: 'recommend',
    album: MOCK_ALBUMS[3],
    recommendedTo: MOCK_USERS[0],
    timestamp: '6h ago',
  },
  {
    id: 'act4',
    user: MOCK_USERS[1],
    type: 'like',
    album: MOCK_ALBUMS[1],
    timestamp: '8h ago',
  },
  {
    id: 'act5',
    user: MOCK_USERS[4],
    type: 'review',
    album: MOCK_ALBUMS[5],
    review: {
      id: 'r2',
      userId: 'u5',
      albumId: 'a6',
      rating: 5,
      text: 'Alex Turner said "I\'ve been trying to write the perfect novel" and then he just did it but as an album.',
      date: '1d ago',
      liked: false,
    },
    timestamp: '1d ago',
  },
  {
    id: 'act6',
    user: MOCK_USERS[2],
    type: 'review',
    album: MOCK_ALBUMS[4],
    review: {
      id: 'r3',
      userId: 'u3',
      albumId: 'a5',
      rating: 4,
      text: 'IGOR is Tyler growing up in real time. Messy, heartbroken, beautiful.',
      date: '2d ago',
      liked: true,
    },
    timestamp: '2d ago',
  },
];

// ─── Mock Diary ─────────────────────────────────────────────────
export const MOCK_DIARY: DiaryEntry[] = [
  { id: 'd1', album: MOCK_ALBUMS[0], date: 'Today', rating: 4.5, review: 'Still one of the best.', liked: true },
  { id: 'd2', album: MOCK_ALBUMS[3], date: 'Yesterday', rating: 5, review: 'Perfect pop album.', liked: true },
  { id: 'd3', album: MOCK_ALBUMS[6], date: 'Mar 22', rating: 4, liked: false },
  { id: 'd4', album: MOCK_ALBUMS[2], date: 'Mar 20', rating: 5, review: 'A masterpiece. Section.80 might be better but this one hits harder live.', liked: true },
  { id: 'd5', album: MOCK_ALBUMS[4], date: 'Mar 18', rating: 4, liked: true },
  { id: 'd6', album: MOCK_ALBUMS[7], date: 'Mar 15', rating: 5, review: 'Untouchable.', liked: true },
  { id: 'd7', album: MOCK_ALBUMS[1], date: 'Mar 12', rating: 5, liked: true },
  { id: 'd8', album: MOCK_ALBUMS[5], date: 'Mar 10', rating: 4.5, liked: false },
];

export const TRENDING_ALBUMS = [MOCK_ALBUMS[1], MOCK_ALBUMS[3], MOCK_ALBUMS[6], MOCK_ALBUMS[4], MOCK_ALBUMS[0], MOCK_ALBUMS[7]];

export const GENRES = ['All', 'Hip-Hop', 'Indie', 'R&B', 'Pop', 'Jazz', 'Rock', 'Electronic', 'Metal', 'Classical'];

// ─── Tracks ─────────────────────────────────────────────────────
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: Album;
  duration: string;
  playsCount: string;
}

export const MOCK_SONGS: Track[] = [
  { id: 't1', title: 'The Less I Know The Better', artist: 'Tame Impala', album: MOCK_ALBUMS[0], duration: '3:35', playsCount: '1.8B' },
  { id: 't2', title: 'Nights', artist: 'Frank Ocean', album: MOCK_ALBUMS[1], duration: '5:07', playsCount: '312M' },
  { id: 't3', title: 'Money Trees', artist: 'Kendrick Lamar', album: MOCK_ALBUMS[2], duration: '6:26', playsCount: '187M' },
  { id: 't4', title: 'Green Light', artist: 'Lorde', album: MOCK_ALBUMS[3], duration: '3:54', playsCount: '205M' },
  { id: 't5', title: 'EARFQUAKE', artist: 'Tyler, the Creator', album: MOCK_ALBUMS[4], duration: '3:33', playsCount: '94M' },
  { id: 't6', title: 'Star Treatment', artist: 'Arctic Monkeys', album: MOCK_ALBUMS[5], duration: '5:50', playsCount: '57M' },
  { id: 't7', title: 'Venice Bitch', artist: 'Lana Del Rey', album: MOCK_ALBUMS[6], duration: '9:37', playsCount: '72M' },
  { id: 't8', title: 'King Kunta', artist: 'Kendrick Lamar', album: MOCK_ALBUMS[7], duration: '3:54', playsCount: '143M' },
];

// ─── Structured Reviews ──────────────────────────────────────────
export interface AlbumReview {
  id: string;
  user: User;
  album: Album;
  rating: number;
  text: string;
  date: string;
  likes: number;
}

export interface SongReview {
  id: string;
  user: User;
  track: Track;
  rating: number;
  text: string;
  date: string;
  likes: number;
}

export const MOCK_ALBUM_REVIEWS: AlbumReview[] = [
  {
    id: 'ar1',
    user: MOCK_USERS[1],
    album: MOCK_ALBUMS[0],
    rating: 4.5,
    text: 'Kevin Parker somehow bottled the feeling of dissociation and turned it into a bop. "Eventually" hits different at 2am.',
    date: '2h ago',
    likes: 47,
  },
  {
    id: 'ar2',
    user: MOCK_USERS[3],
    album: MOCK_ALBUMS[3],
    rating: 5,
    text: 'Melodrama is what it sounds like to be 20 and heartbroken and alive. There is nothing else like it.',
    date: '5h ago',
    likes: 201,
  },
  {
    id: 'ar3',
    user: MOCK_USERS[4],
    album: MOCK_ALBUMS[5],
    rating: 5,
    text: "Alex Turner said \"I've been trying to write the perfect novel\" and then he just did it but as an album.",
    date: '1d ago',
    likes: 89,
  },
  {
    id: 'ar4',
    user: MOCK_USERS[2],
    album: MOCK_ALBUMS[4],
    rating: 4,
    text: 'IGOR is Tyler growing up in real time. Messy, heartbroken, beautiful.',
    date: '2d ago',
    likes: 63,
  },
  {
    id: 'ar5',
    user: MOCK_USERS[0],
    album: MOCK_ALBUMS[7],
    rating: 5,
    text: 'A perfect album front to back. "Mortal Man" alone would be a career highlight for most artists.',
    date: '3d ago',
    likes: 112,
  },
];

export const MOCK_SONG_REVIEWS: SongReview[] = [
  {
    id: 'sr1',
    user: MOCK_USERS[1],
    track: MOCK_SONGS[1],
    rating: 5,
    text: '"Nights" is two songs in one and both halves are perfect. The beat switch will never get old.',
    date: '3h ago',
    likes: 88,
  },
  {
    id: 'sr2',
    user: MOCK_USERS[3],
    track: MOCK_SONGS[3],
    rating: 5,
    text: 'The production drop at 1:20 is one of the greatest moments in modern pop. Full stop.',
    date: '6h ago',
    likes: 112,
  },
  {
    id: 'sr3',
    user: MOCK_USERS[2],
    track: MOCK_SONGS[4],
    rating: 4.5,
    text: 'Tyler made a love song that sounds like a panic attack and somehow it works perfectly.',
    date: '1d ago',
    likes: 74,
  },
  {
    id: 'sr4',
    user: MOCK_USERS[4],
    track: MOCK_SONGS[6],
    rating: 5,
    text: 'Nine and a half minutes and I could listen for nine more. The outro is a whole other universe.',
    date: '2d ago',
    likes: 93,
  },
  {
    id: 'sr5',
    user: MOCK_USERS[0],
    track: MOCK_SONGS[0],
    rating: 4.5,
    text: "The bassline is permanently living in my head. Kevin Parker is a genius and I won't debate it.",
    date: '3d ago',
    likes: 67,
  },
];
