# Spindl

A music diary app — log albums, rate songs, and share with friends. Built with React Native + Expo.

## Demo


https://github.com/user-attachments/assets/5156a560-c8a5-4e7b-91e4-7105e5bc94f4


<!-- Drag your video file into this README on github.com to upload it, then paste the generated
     https://github.com/ocvillal/Spindl/assets/... link on the line below. -->

## Features

- **Diary & logging** — log albums and rate individual songs, kept in a personal diary/collection
- **Discover** — browse charts and personalized recommendations
- **Search** — look up albums and artists via Deezer/Spotify
- **Social** — follow friends, view their activity feed
- **Profile & auth** — Supabase-backed accounts with a themeable profile

## Stack

- **Expo SDK 54** / **React Native 0.81.5** / **React 19**
- **Supabase** — auth and database
- **Deezer API** — music search and artist discovery
- **Spotify API** — album/track metadata and playback queuing
- **Last.fm API** — charts and recommendations

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- Xcode (for iOS simulator) or Android Studio (for Android emulator)
- A Spotify Developer account
- A Supabase project

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Fill in your credentials:

```
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret_here
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_LASTFM_API_KEY=your_lastfm_api_key_here
```

### 3. Get credentials

**Spotify**
1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in → **Create App**
3. Set redirect URI to `http://localhost`
4. Copy the **Client ID** and **Client Secret**

**Supabase**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Find your **URL** and **anon key** under Project Settings → API

**Last.fm**
1. Go to [last.fm/api](https://www.last.fm/api/account/create) and create an API account
2. Copy your **API key**

### 4. Run the app

```bash
npx expo run:ios
```

Or start Metro only and open in a running simulator:

```bash
npx expo start --clear
```

## Notes

- Never commit your `.env` — it's already gitignored
- Use `--legacy-peer-deps` with npm install due to React 19 peer dependency requirements
- A `metro.config.js` is required (already included) — it enables hermes-parser for Flow files in React Native 0.81
- The app uses Supabase auth — users must sign up before accessing the main app
