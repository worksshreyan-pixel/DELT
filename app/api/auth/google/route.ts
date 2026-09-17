import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { encryptCredential } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const encryptionKey = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY;

  if (!clientId || !redirectUri || !encryptionKey) {
    console.error('Google OAuth configuration is missing.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const promptParam = searchParams.get('prompt');

  // Generate OAuth state with CSRF nonce and expiration (5 minutes)
  const nonce = crypto.randomBytes(16).toString('hex');
  const stateObj = {
    userId: user.id,
    nonce,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  const stateString = JSON.stringify(stateObj);
  const encryptedState = encryptCredential(stateString, encryptionKey);

  // Build the Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.file email');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('state', encryptedState);
  
  if (promptParam === 'consent') {
    authUrl.searchParams.set('prompt', 'consent');
  }

  const response = NextResponse.redirect(authUrl.toString());

  // Set the nonce in a secure HttpOnly cookie to prevent replay attacks
  response.cookies.set('delt_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/google',
    maxAge: 5 * 60, // 5 minutes
  });

  return response;
}
