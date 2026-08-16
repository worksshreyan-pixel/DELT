import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDealPublicUrl } from '@/lib/deal-url';
import { sendDealInvitationEmail } from '@/lib/email';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch deal by token
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // 2. Fetch creator profile
    const { data: creatorProfile } = await admin
      .from('profiles')
      .select('display_name, email')
      .eq('id', deal.creator_id)
      .maybeSingle();

    const creatorName = creatorProfile?.display_name || 'Creator';
    const canonicalDealUrl = getDealPublicUrl(deal.token);

    // 3. Send email
    console.log(`[INVITATION_EMAIL_START]`, JSON.stringify({
      dealId: deal.id,
      clientEmailMasked: maskEmail(deal.client_email),
      timestamp: new Date().toISOString()
    }));

    const emailResult = await sendDealInvitationEmail({
      clientName: deal.client_name,
      clientEmail: deal.client_email,
      creatorName,
      dealTitle: deal.title,
      dealPrice: Number(deal.price),
      dealCurrency: deal.currency || 'INR',
      dealUrl: canonicalDealUrl,
    });

    console.log(`[INVITATION_EMAIL_RESULT]`, JSON.stringify({
      dealId: deal.id,
      success: emailResult.success,
      delivered: emailResult.delivered,
      simulated: emailResult.simulated,
      messageId: emailResult.messageId || null,
      error: emailResult.error || null,
      timestamp: new Date().toISOString()
    }));

    // 4. Log event
    if (emailResult.delivered) {
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'deal_shared',
        actor_name: creatorName,
        actor_role: 'creator',
        description: `Invitation email resent to ${deal.client_email}`,
      });
    }

    return NextResponse.json({
      success: true,
      emailResult,
    });
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({ error: error?.message || 'Failed to resend invitation' }, { status: 500 });
  }
}
