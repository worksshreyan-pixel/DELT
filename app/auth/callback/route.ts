import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { FREE_PLAN_STORAGE_BYTES } from '@/lib/plans';

/**
 * Validates the `next` parameter to prevent open redirect vulnerabilities.
 * Strictly permits relative paths starting with a single '/' and rejects
 * protocol-relative URLs ('//'), backslash tricks ('/\'), or absolute URIs.
 */
function getSafeNextPath(nextParam: string | null): string {
  if (!nextParam) return '/dashboard';
  try {
    const decoded = decodeURIComponent(nextParam).trim();
    if (
      decoded.startsWith('/') &&
      !decoded.startsWith('//') &&
      !decoded.startsWith('/\\') &&
      !decoded.includes('://')
    ) {
      return decoded;
    }
  } catch (err) {
    // If URI decoding fails, default safely to dashboard
  }
  return '/dashboard';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const rawNext = searchParams.get('next');

  const safeNext = getSafeNextPath(rawNext);
  const supabase = await createServerSupabaseClient();

  // Helper function to guarantee user profile/storage/credits initialization
  async function initializeUserProfile(userId: string, email?: string, userMetadata?: any) {
    if (!userId || !email) return;
    const normalizedEmail = email.toLowerCase().trim();
    const displayName =
      userMetadata?.full_name ||
      userMetadata?.name ||
      userMetadata?.displayName ||
      normalizedEmail.split('@')[0] ||
      'Creator';

    try {
      await supabase.from('profiles').upsert(
        {
          id: userId,
          email: normalizedEmail,
          display_name: displayName,
          avatar_url: userMetadata?.avatar_url || userMetadata?.picture || null,
        },
        { onConflict: 'id' }
      );

      await supabase.from('storage_usage').upsert(
        {
          user_id: userId,
          total_bytes: 0,
          limit_bytes: FREE_PLAN_STORAGE_BYTES,
        },
        { onConflict: 'user_id' }
      );

      await supabase.from('deal_credits').upsert(
        {
          user_id: userId,
          plan_id: 'free',
          total: 50,
          used: 0,
          remaining: 50,
        },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      console.error('[OAuth Callback Profile Init Error]', err);
    }
  }

  // 1. PKCE Code Exchange (Google OAuth & Passwordless Magic Links)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session?.user) {
      await initializeUserProfile(
        data.session.user.id,
        data.session.user.email,
        data.session.user.user_metadata
      );
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // 2. Token Hash OTP Verification
  if (tokenHash) {
    const otpType = (type as any) || 'signup';
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (!error && data?.session?.user) {
      await initializeUserProfile(
        data.session.user.id,
        data.session.user.email,
        data.session.user.user_metadata
      );
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Gracefully return user to login with error parameter
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
