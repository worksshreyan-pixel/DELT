import { NextResponse } from 'next/server';
import { ensureInvoiceForDeal } from '@/lib/deals/invoice-utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId } = body;

    if (!dealId) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
    }

    // 1. Fetch deal for authorization purposes
    const admin = createAdminClient();
    const { data: dbDeal } = await admin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (!dbDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // 2. Perform Authorization
    const expectedClientEmail = (dbDeal.client_email || '').trim().toLowerCase();
    const creatorId = dbDeal.creator_id;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const clientSessionHeader = request.headers.get('x-client-session-token');
    const { verifyClientSessionToken } = await import('@/lib/otp');
    const hasValidClientToken = clientSessionHeader
      ? verifyClientSessionToken(clientSessionHeader, dbDeal.token, expectedClientEmail)
      : false;

    let isAuthorized = false;

    if (user) {
      const userEmail = (user.email || '').trim().toLowerCase();
      if (user.id === creatorId) {
        isAuthorized = true; // Authorized Creator
      } else if (userEmail && userEmail === expectedClientEmail) {
        isAuthorized = true; // Authorized registered Client
      }
    }

    if (hasValidClientToken) {
      isAuthorized = true; // Authorized un-registered/OTP Client
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to access this deal invoice' }, { status: 403 });
    }

    // 3. Delegate to idempotent, business-logic-only utility
    const invoice = await ensureInvoiceForDeal(dealId);

    if (!invoice) {
      return NextResponse.json({ error: 'Failed to ensure invoice or conditions not met' }, { status: 400 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Error in /api/invoices/ensure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
