import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, senderId, senderName, senderRole, type = 'text', content, attachments = [] } = body;

    if (!dealId || !content?.trim()) {
      return NextResponse.json({ error: 'Deal ID and content are required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Fetch deal
    const { data: deal } = await admin
      .from('deals')
      .select('creator_id, client_email, token')
      .eq('id', dealId)
      .maybeSingle();

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check client session token from header
    const clientSessionHeader = request.headers.get('x-client-session-token');
    const { verifyClientSessionToken } = await import('@/lib/otp');
    const hasValidClientToken = clientSessionHeader && deal.token
      ? verifyClientSessionToken(clientSessionHeader, deal.token, deal.client_email)
      : false;

    const isCreator = user && user.id === deal.creator_id;
    const isClient = (user && user.email?.toLowerCase() === deal.client_email?.toLowerCase()) || hasValidClientToken;

    if (senderRole === 'client') {
      if (isCreator) {
        return NextResponse.json({ error: 'Creators cannot send messages as client.' }, { status: 403 });
      }
      if (!isClient) {
        return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
      }
    } else if (senderRole === 'creator') {
      if (!isCreator) {
        return NextResponse.json({ error: 'Unauthorized creator access.' }, { status: 403 });
      }
    }

    const { data: message, error: msgError } = await admin
      .from('deal_messages')
      .insert({
        deal_id: dealId,
        sender_id: senderId || 'user',
        sender_name: senderName || 'User',
        sender_role: senderRole || 'creator',
        type,
        content: content.trim(),
        attachments,
      })
      .select()
      .single();

    if (msgError || !message) {
      return NextResponse.json({ error: msgError?.message || 'Failed to send message' }, { status: 500 });
    }

    // Update deal activity
    await admin
      .from('deals')
      .update({
        last_activity_at: now,
        updated_at: now,
      })
      .eq('id', dealId);

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
