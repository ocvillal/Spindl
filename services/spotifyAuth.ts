/**
 * Spotify user-level OAuth (Authorization Code + PKCE).
 * Separate from the Client Credentials flow in spotify.ts.
 *
 * SETUP — register these redirect URIs in your Spotify Developer Dashboard
 * (https://developer.spotify.com/dashboard):
 *   • exp://localhost:8081          (Expo Go on simulator)
 *   • exp://192.168.x.x:8081       (Expo Go on physical device — varies by machine)
 *   • spindl://                     (production / EAS builds)
 */

import { makeRedirectUri, useAuthRequest, exchangeCodeAsync, refreshAsync } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { SPOTIFY_CLIENT_ID as CLIENT_ID } from './spotify';

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const SCOPES = ['user-modify-playback-state', 'user-read-playback-state'];

const KEY_ACCESS  = 'spotify_user_access_token';
const KEY_REFRESH = 'spotify_user_refresh_token';
const KEY_EXPIRY  = 'spotify_user_token_expiry';

export function getRedirectUri(): string {
  return makeRedirectUri({ scheme: 'spindl' });
}

// ─── Token Storage ────────────────────────────────────────────────────────────

async function saveTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  const expiry = (Date.now() + expiresIn * 1000 - 60_000).toString();
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, accessToken),
    SecureStore.setItemAsync(KEY_REFRESH, refreshToken),
    SecureStore.setItemAsync(KEY_EXPIRY, expiry),
  ]);
}

async function loadTokens(): Promise<{ access: string; refresh: string; expiry: number } | null> {
  const [access, refresh, expiryStr] = await Promise.all([
    SecureStore.getItemAsync(KEY_ACCESS),
    SecureStore.getItemAsync(KEY_REFRESH),
    SecureStore.getItemAsync(KEY_EXPIRY),
  ]);
  if (!access || !refresh || !expiryStr) return null;
  return { access, refresh, expiry: parseInt(expiryStr, 10) };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a valid Spotify user access token, refreshing if expired.
 * Returns null if the user has not connected their Spotify account.
 */
export async function getSpotifyUserToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;

  // Token still valid
  if (Date.now() < tokens.expiry) return tokens.access;

  // Refresh expired token
  try {
    const result = await refreshAsync(
      { clientId: CLIENT_ID, refreshToken: tokens.refresh },
      DISCOVERY,
    );
    await saveTokens(
      result.accessToken,
      result.refreshToken ?? tokens.refresh,
      result.expiresIn ?? 3600,
    );
    return result.accessToken;
  } catch {
    // Refresh failed — clear tokens so user is prompted to reconnect
    await disconnectSpotify();
    return null;
  }
}

/**
 * Completes the Spotify OAuth flow given the authorization code returned
 * from the auth request. Call this after `useAuthRequest` resolves.
 * Returns the access token on success, null on failure.
 */
export async function handleSpotifyCallback(
  code: string,
  codeVerifier: string,
): Promise<string | null> {
  try {
    const redirectUri = getRedirectUri();
    const result = await exchangeCodeAsync(
      { clientId: CLIENT_ID, code, redirectUri, extraParams: { code_verifier: codeVerifier } },
      DISCOVERY,
    );
    await saveTokens(result.accessToken, result.refreshToken ?? '', result.expiresIn ?? 3600);
    return result.accessToken;
  } catch (e) {
    console.error('[SpotifyAuth] token exchange failed:', e);
    return null;
  }
}

/**
 * Adds a track to the user's Spotify queue.
 * Requires an active Spotify playback session on any device.
 * Returns true on success, false if no active device or other error.
 */
export async function addToSpotifyQueue(spotifyTrackUri: string): Promise<boolean> {
  const token = await getSpotifyUserToken();
  if (!token) return false;

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(spotifyTrackUri)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    );
    // 204 No Content = success; 404 = no active device
    return response.status === 204;
  } catch {
    return false;
  }
}

/** Clears all stored Spotify tokens (disconnect). */
export async function disconnectSpotify(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS),
    SecureStore.deleteItemAsync(KEY_REFRESH),
    SecureStore.deleteItemAsync(KEY_EXPIRY),
  ]);
}

// ─── OAuth hook config (exported so DiscoverScreen can call useAuthRequest) ──

export const SPOTIFY_AUTH_CONFIG = {
  clientId: CLIENT_ID,
  scopes: SCOPES,
  usePKCE: true,
  redirectUri: makeRedirectUri({ scheme: 'spindl' }),
};

export { DISCOVERY };
