import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientDealUrl } from '@/lib/deal-url';
import { sendDealInvitationEmail } from '@/lib/email';
import { requireCreatorDealAccess } from '@/lib/deal-auth';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required' }, { status: 400 });
    }

    const resolution = await requireCreatorDealAccess(code);
    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: resolution.error || 'Unauthorized' }, { status: 403 });
    }

    const deal = resolution.deal;
    const creatorName = resolution.creator?.display_name || 'Creator';
    const canonicalDealUrl = getClientDealUrl(deal.dealCode);
    const admin = createAdminClient();

    // 3. Send email
    console.log(`[INVITATION_EMAIL_START]`, JSON.stringify({
      dealId: deal.id,
      clientEmailMasked: maskEmail(deal.clientEmail),
      timestamp: new Date().toISOString()
    }));

    const emailResult = await sendDealInvitationEmail({
      clientName: deal.clientName,
      clientEmail: deal.clientEmail,
      creatorName,
      dealTitle: deal.title,
      dealPrice: Number(deal.price),
      dealCurrency: deal.currency || 'INR',
      dealUrl: canonicalDealUrl,
      dealCode: deal.dealCode || deal.id,
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
        description: `Invitation email resent to ${deal.clientEmail}`,
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
