import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { hasSupabasePublicConfig } from '@/lib/env';
import { parseDescription } from '@/lib/utils';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: 'Deal token is required.' }, { status: 400 });
    }

    if (!hasSupabasePublicConfig()) {
      return NextResponse.json({ error: 'Database is not configured.' }, { status: 500 });
    }

    const admin = createAdminClient();

    // 1. Fetch deal by token
    const { data: dbDeal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (dealError || !dbDeal) {
      return NextResponse.json({ error: 'Deal not found or invalid link.' }, { status: 404 });
    }

    // Fetch creator profile for display
    const { data: creator } = await admin
      .from('profiles')
      .select('display_name, email, profession, company')
      .eq('id', dbDeal.creator_id)
      .maybeSingle();

    const expectedClientEmail = (dbDeal.client_email || '').trim().toLowerCase();
    const creatorId = dbDeal.creator_id;

    // 2. Check Supabase Auth user session from cookies
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Check custom signed client session token from header
    const clientSessionHeader = request.headers.get('x-client-session-token');
    const { verifyClientSessionToken } = await import('@/lib/otp');
    const hasValidClientToken = clientSessionHeader
      ? verifyClientSessionToken(clientSessionHeader, token, expectedClientEmail)
      : false;

    let isAuthorizedClient = false;
    let isCreator = false;
    let userEmail = '';

    if (user) {
      userEmail = (user.email || '').trim().toLowerCase();
      isAuthorizedClient = Boolean(userEmail && userEmail === expectedClientEmail);
      isCreator = Boolean(
        user.id === creatorId ||
        (user.email && creator?.email && user.email.toLowerCase() === creator.email.toLowerCase())
      );
    } else if (hasValidClientToken) {
      isAuthorizedClient = true;
      userEmail = expectedClientEmail;
    }

    // Unauthenticated user
    if (!user && !hasValidClientToken) {
      return NextResponse.json({
        authorized: false,
        dealExists: true,
        dealTitle: dbDeal.title,
        clientEmail: dbDeal.client_email,
        creatorName: creator?.display_name || 'Creator',
      });
    }

    // Unauthorized authenticated user
    if (!isAuthorizedClient && !isCreator) {
      return NextResponse.json(
        {
          authorized: false,
          error: `You are signed in as ${user?.email || 'an unauthorized account'}, but this Deal workspace is private to ${dbDeal.client_email}.`,
          dealTitle: dbDeal.title,
          clientEmail: dbDeal.client_email,
          userEmail: user?.email,
        },
        { status: 403 }
      );
    }

    // If client is accessing, log verification event if not already logged recently
    if (isAuthorizedClient) {
      await admin.from('deal_events').insert({
        deal_id: dbDeal.id,
        type: 'client_verified',
        actor_id: userEmail,
        actor_name: dbDeal.client_name || 'Client',
        actor_role: 'client',
        description: `${dbDeal.client_name || 'Client'} accessed the private Deal workspace.`,
      });
    }

    // Authorized! Return complete deal workspace payload
    return NextResponse.json({
      authorized: true,
      deal: {
        id: dbDeal.id,
        token: dbDeal.token,
        creatorId: dbDeal.creator_id,
        clientId: dbDeal.client_id,
        clientName: dbDeal.client_name,
        clientEmail: dbDeal.client_email,
        title: dbDeal.title,
        description: parseDescription(dbDeal.description).description,
        scope: Array.isArray(dbDeal.scope) ? dbDeal.scope : [],
        price: Number(dbDeal.price),
        currency: dbDeal.currency || 'INR',
        status: dbDeal.status || 'in_progress',
        deadline: dbDeal.deadline,
        progress: Number(dbDeal.progress || 0),
        paymentStatus: dbDeal.payment_status || 'pending',
        lastActivityAt: dbDeal.last_activity_at || dbDeal.created_at,
        createdAt: dbDeal.created_at,
        previewEnabled: parseDescription(dbDeal.description).previewEnabled,
      },
      clientName: dbDeal.client_name,
      clientEmail: dbDeal.client_email,
      creatorName: creator?.display_name || 'Creator',
      role: isCreator ? 'creator' : 'client',
    });
  } catch (error: any) {
    console.error('Error verifying deal access:', error);
    return NextResponse.json({ error: error?.message || 'Verification failed.' }, { status: 500 });
  }
}
