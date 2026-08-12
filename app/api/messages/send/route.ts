import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, senderId, senderName, senderRole, type = 'text', content, attachments = [] } = body;

    if (!dealId || !content?.trim()) {
      return NextResponse.json({ error: 'Deal ID and content are required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

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
