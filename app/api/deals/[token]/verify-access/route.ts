import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { hasSupabasePublicConfig } from '@/lib/env';

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

    // 2. Check Supabase Auth user session from cookies
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const expectedClientEmail = (dbDeal.client_email || '').trim().toLowerCase();
    const creatorId = dbDeal.creator_id;

    // Unauthenticated user
    if (!user) {
      return NextResponse.json({
        authorized: false,
        dealExists: true,
        dealTitle: dbDeal.title,
        clientEmail: dbDeal.client_email,
        creatorName: creator?.display_name || 'Creator',
      });
    }

    const userEmail = (user.email || '').trim().toLowerCase();
    const isAuthorizedClient = Boolean(userEmail && userEmail === expectedClientEmail);
    const isCreator = user.id === creatorId || (user.email && user.email.toLowerCase() === creator?.email?.toLowerCase());

    // Unauthorized authenticated user
    if (!isAuthorizedClient && !isCreator) {
      return NextResponse.json(
        {
          authorized: false,
          error: `You are signed in as ${user.email}, but this Deal workspace is private to ${dbDeal.client_email}.`,
          dealTitle: dbDeal.title,
          clientEmail: dbDeal.client_email,
          userEmail: user.email,
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
        description: dbDeal.description || '',
        scope: Array.isArray(dbDeal.scope) ? dbDeal.scope : [],
        price: Number(dbDeal.price),
        currency: dbDeal.currency || 'INR',
        status: dbDeal.status || 'in_progress',
        deadline: dbDeal.deadline,
        progress: Number(dbDeal.progress || 0),
        paymentStatus: dbDeal.payment_status || 'pending',
        lastActivityAt: dbDeal.last_activity_at || dbDeal.created_at,
        createdAt: dbDeal.created_at,
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
