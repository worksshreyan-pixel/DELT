import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { parseDescription } from '@/lib/utils';
import { verifyClientSessionToken } from '@/lib/otp'; // We'll keep this for legacy tokens

export async function resolveDealByCode(dealCode: string) {
  const admin = createAdminClient();
  const { data: deal, error } = await admin
    .from('deals')
    .select('*')
    .eq('deal_code', dealCode)
    .maybeSingle();

  if (error || !deal) {
    return null;
  }

  // Fetch creator profile for display
  const { data: creator } = await admin
    .from('profiles')
    .select('display_name, email, profession, company')
    .eq('id', deal.creator_id)
    .maybeSingle();

  const parsed = parseDescription(deal.description);
  const resolvedDeal = {
    id: deal.id,
    token: deal.token,
    dealCode: deal.deal_code,
    creatorId: deal.creator_id,
    clientId: deal.client_id,
    clientName: deal.client_name,
    clientEmail: deal.client_email,
    title: deal.title,
    description: parsed.description,
    scope: Array.isArray(deal.scope) ? deal.scope : [],
    price: Number(deal.price),
    currency: deal.currency || 'INR',
    status: deal.status || 'in_progress',
    deadline: deal.deadline,
    progress: Number(deal.progress || 0),
    paymentStatus: deal.payment_status || 'pending',
    lastActivityAt: deal.last_activity_at || deal.created_at,
    createdAt: deal.created_at,
    completedAt: deal.completed_at,
    previewEnabled: parsed.previewEnabled,
  };

  return { deal: resolvedDeal, creator };
}

export async function requireCreatorDealAccess(dealCode: string) {
  const resolution = await resolveDealByCode(dealCode);
  if (!resolution) {
    return { authorized: false, error: 'Deal not found.' };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: 'Not authenticated.' };
  }

  const { deal, creator } = resolution;
  const isCreator = Boolean(
    user.id === deal.creatorId ||
    (user.email && creator?.email && user.email.toLowerCase() === creator.email.toLowerCase())
  );

  if (!isCreator) {
    return { authorized: false, error: 'Unauthorized.' };
  }

  return { authorized: true, deal, creator };
}

function isDealExpired(deal: any) {
  if (deal.status !== 'completed' && deal.status !== 'cancelled') {
    return false;
  }
  if (!deal.completedAt) return false;
  
  const completedAt = new Date(deal.completedAt).getTime();
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  return (now - completedAt) > TWENTY_FOUR_HOURS;
}

export async function requireClientDealAccess(request: Request, dealCode: string) {
  const resolution = await resolveDealByCode(dealCode);
  if (!resolution) {
    return { authorized: false, error: 'Deal not found.' };
  }

  const { deal, creator } = resolution;
  const expectedClientEmail = (deal.clientEmail || '').trim().toLowerCase();

  // Deal Expiration Check
  if (isDealExpired(deal)) {
    return { authorized: false, error: 'Deal has expired.' };
  }

  // 1. Check HttpOnly Cookie (Primary)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`delt_client_session`);
  const admin = createAdminClient();

  if (sessionCookie && sessionCookie.value) {
    const rawToken = sessionCookie.value;
    const sessionTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { data: session } = await admin
      .from('client_access_sessions')
      .select('*')
      .eq('deal_id', deal.id)
      .eq('session_token_hash', sessionTokenHash)
      .eq('status', 'active')
      .maybeSingle();

    if (session) {
      const expiresAt = new Date(session.expires_at).getTime();
      if (expiresAt > Date.now()) {
        // Update last seen
        await admin.from('client_access_sessions')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', session.id);
        
        return { authorized: true, deal, creator, clientEmail: expectedClientEmail };
      }
    }
  }

  // 2. Check Legacy x-client-session-token Header (Fallback)
  const clientSessionHeader = request.headers.get('x-client-session-token');
  if (clientSessionHeader) {
    const hasValidClientToken = verifyClientSessionToken(clientSessionHeader, deal.token, expectedClientEmail);
    if (hasValidClientToken) {
      return { authorized: true, deal, creator, clientEmail: expectedClientEmail };
    }
  }

  // 3. Fallback to Supabase Auth user (if creator is viewing client portal or testing)
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const userEmail = (user.email || '').trim().toLowerCase();
    const isAuthorizedClient = Boolean(userEmail && userEmail === expectedClientEmail);
    const isCreator = Boolean(
      user.id === deal.creatorId ||
      (user.email && creator?.email && user.email.toLowerCase() === creator.email.toLowerCase())
    );

    if (isAuthorizedClient || isCreator) {
      return { authorized: true, deal, creator, clientEmail: expectedClientEmail, isCreator };
    }
  }

  return { 
    authorized: false, 
    error: 'Unauthorized.',
    dealTitle: deal.title,
    clientEmail: deal.clientEmail,
    creatorName: creator?.display_name || 'Creator',
  };
}
