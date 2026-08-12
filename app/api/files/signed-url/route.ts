import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, filePath, isCreator } = body;

    if (!dealId || !filePath) {
      return NextResponse.json({ error: 'Deal ID and file path are required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch deal
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Check payment authorization: if client and deal not paid, block download!
    if (!isCreator && deal.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Files are locked. Complete payment to download deliverables.' },
        { status: 403 }
      );
    }

    // Generate short-lived signed URL (60 seconds) from private Supabase Storage
    const { data: signedUrlData, error: signError } = await admin.storage
      .from('deal-files')
      .createSignedUrl(filePath, 60);

    if (signError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate signed download link' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
