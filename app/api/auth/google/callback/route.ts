import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptCredential, encryptCredential } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const errorParam = searchParams.get('error');
  if (errorParam) {
    console.error('Google OAuth Error:', errorParam);
    return NextResponse.redirect(new URL(`/storage?error=${encodeURIComponent(errorParam)}`, request.url));
  }

  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');

  if (!code || !stateStr) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const encryptionKey = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY;

  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) {
    console.error('Google OAuth configuration is missing.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // 1. Validate State
  let stateObj;
  try {
    const decryptedState = decryptCredential(stateStr, encryptionKey);
    stateObj = JSON.parse(decryptedState);
  } catch (e) {
    console.error('Failed to decrypt or parse state', e);
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  if (stateObj.userId !== user.id) {
    return NextResponse.json({ error: 'State user mismatch' }, { status: 403 });
  }

  if (Date.now() > stateObj.expiresAt) {
    return NextResponse.json({ error: 'State expired' }, { status: 400 });
  }

  // Verify nonce against cookie
  const cookieNonce = request.cookies.get('delt_oauth_nonce')?.value;
  if (!cookieNonce || cookieNonce !== stateObj.nonce) {
    return NextResponse.json({ error: 'Invalid or missing nonce' }, { status: 403 });
  }

  // 2. Exchange Authorization Code for Tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    console.error('Failed to exchange code for tokens:', errText);
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 502 });
  }

  const tokens = await tokenResponse.json();

  // 3. Get User Identity
  const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userinfoResponse.ok) {
    console.error('Failed to fetch google user info:', await userinfoResponse.text());
    return NextResponse.json({ error: 'Failed to retrieve Google identity' }, { status: 502 });
  }

  const userInfo = await userinfoResponse.json();

  // 4. Encrypt Tokens
  const access_token_encrypted = encryptCredential(tokens.access_token, encryptionKey);
  const refresh_token_encrypted = tokens.refresh_token ? encryptCredential(tokens.refresh_token, encryptionKey) : undefined;

  // Find existing connection first to handle reconnect safely without duplicates
  const { data: existingConnection } = await supabase
    .from('storage_connections')
    .select('id, metadata')
    .eq('user_id', user.id)
    .eq('provider', 'google_drive')
    .single();

  const metadata = {
    google_account: {
      email: userInfo.email,
      id: userInfo.id,
      name: userInfo.name,
      picture: userInfo.picture,
    },
    oauth_credentials: {
      access_token_encrypted,
      // If we didn't get a new refresh token (e.g. prompt=consent not used), reuse existing if available
      refresh_token_encrypted: refresh_token_encrypted || (existingConnection?.metadata as any)?.oauth_credentials?.refresh_token_encrypted,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      token_type: tokens.token_type,
    },
  };

  if (existingConnection) {
    // Update
    const { error: updateError } = await supabase
      .from('storage_connections')
      .update({
        status: 'connected',
        disconnected_at: null,
        external_account_id: userInfo.id,
        display_name: userInfo.email,
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingConnection.id);

    if (updateError) {
      console.error('Failed to update storage connection:', updateError);
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from('storage_connections')
      .insert({
        user_id: user.id,
        provider: 'google_drive',
        provider_type: 'CUSTOMER_MANAGED',
        status: 'connected',
        external_account_id: userInfo.id,
        display_name: userInfo.email,
        metadata,
      });

    if (insertError) {
      console.error('Failed to insert storage connection:', insertError);
      return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }
  }

  // Create redirect response and clear the nonce cookie
  const response = NextResponse.redirect(new URL('/storage', request.url));
  response.cookies.delete('delt_oauth_nonce');

  return response;
}
