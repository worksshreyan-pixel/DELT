import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireClientDealAccess } from '@/lib/deal-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required.' }, { status: 400 });
    }

    // Verify they actually have access to this deal before we let them log out
    // This also gives us the `deal` object we need for the cookie name.
    const resolution = await requireClientDealAccess(request, code);
    
    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { deal } = resolution;

    const cookieStore = await cookies();
    const cookieName = `delt_client_session_${deal.id}`;
    const sessionCookie = cookieStore.get(cookieName);

    if (sessionCookie && sessionCookie.value) {
      const rawToken = sessionCookie.value;
      const sessionTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const admin = createAdminClient();
      
      // Revoke the session in the database
      await admin
        .from('client_access_sessions')
        .update({ status: 'revoked' })
        .eq('deal_id', deal.id)
        .eq('session_token_hash', sessionTokenHash);

      // Clear the cookie by setting it to empty with maxAge 0
      cookieStore.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 });
  }
}
