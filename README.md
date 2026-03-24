# Spindl

A music diary app — log albums, rate songs, and share with friends. Built with React Native + Expo.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo Go](https://expo.dev/go) on your phone, or an iOS/Android simulator
- A Spotify Developer account

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Then open `.env` and fill in your Spotify credentials:

```
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 3. Get Spotify credentials

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in → **Create App**
3. Fill in any name/description, set redirect URI to `http://localhost`
4. Copy the **Client ID** and **Client Secret** into your `.env`

### 4. Run the app

```bash
npx expo start --clear
```

- Scan the QR code with **Expo Go** (iOS: Camera app, Android: Expo Go app)
- Or press `i` for iOS simulator, `a` for Android emulator

## Notes

- Never commit your `.env` — it's already gitignored
- Always use `--clear` the first time or after changing `.env`
- The app uses Spotify's **Client Credentials** flow — no user login needed
