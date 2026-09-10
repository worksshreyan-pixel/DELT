import { NextResponse } from 'next/server';
import { requireClientDealAccess } from '@/lib/deal-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required.' }, { status: 400 });
    }

    const resolution = await requireClientDealAccess(request, code);

    // Unauthenticated or unauthorized user
    if (!resolution.authorized) {
      return NextResponse.json(
        {
          authorized: false,
          error: resolution.error,
          dealTitle: resolution.dealTitle,
          clientEmail: resolution.clientEmail,
          creatorName: resolution.creatorName,
        },
        // We return 200 even for unauthorized so the frontend can display the OTP prompt
        { status: resolution.error === 'Deal not found.' || resolution.error === 'Deal has expired.' ? 404 : 200 }
      );
    }

    const { deal, creator, clientEmail, isCreator } = resolution;

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Log verification event if it's a client
    if (!isCreator) {
      const admin = createAdminClient();
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'client_verified',
        actor_id: clientEmail,
        actor_name: deal.clientName || 'Client',
        actor_role: 'client',
        description: `${deal.clientName || 'Client'} accessed the private Deal workspace.`,
      });
    }

    return NextResponse.json({
      authorized: true,
      deal,
      clientName: deal.clientName,
      clientEmail: deal.clientEmail,
      creatorName: creator?.display_name || 'Creator',
      role: isCreator ? 'creator' : 'client',
    });
  } catch (error: any) {
    console.error('Error verifying deal access:', error);
    return NextResponse.json({ error: error?.message || 'Verification failed.' }, { status: 500 });
  }
}
