import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CLIENT_ID     = Deno.env.get('SPOTIFY_CLIENT_ID') ?? '';
const CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') ?? '';
const TOKEN_URL     = 'https://accounts.spotify.com/api/token';
const API_BASE      = 'https://api.spotify.com/v1';

// In-memory token cache (lives for the lifetime of this function instance)
let cachedToken    = '';
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);

  const data = await res.json();
  cachedToken    = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;
  return cachedToken;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { endpoint } = await req.json();
    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing endpoint' }), { status: 400, headers: CORS });
    }

    const token    = await getToken();
    const spotifyRes = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = await spotifyRes.text();
    return new Response(body, {
      status: spotifyRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
});
