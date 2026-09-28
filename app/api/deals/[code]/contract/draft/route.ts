import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCreatorDealAccess } from '@/lib/deal-auth';
import { getDealContractWithVersions, serializeContractVersion } from '@/lib/contracts/state';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required.' }, { status: 400 });
    }

    const resolution = await requireCreatorDealAccess(code);
    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: resolution.error || 'Unauthorized' }, { status: 403 });
    }

    const deal = resolution.deal;
    const body = await request.json();
    const { title, termsContent } = body;

    const result = await getDealContractWithVersions(deal.id);
    if (!result || !result.contract || !result.currentVersion) {
      return NextResponse.json({ error: 'Contract draft not found. Please initialize contract.' }, { status: 404 });
    }

    if (result.contract.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft agreements can be edited. Create a new version to modify terms.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const updates: any = {};
    if (title !== undefined && title.trim()) updates.title = title.trim();
    if (termsContent !== undefined && termsContent.trim()) updates.terms_content = termsContent.trim();

    const { data: updatedVersion, error: vErr } = await admin
      .from('contract_versions')
      .update(updates)
      .eq('id', result.currentVersion.id)
      .select()
      .single();

    if (vErr || !updatedVersion) {
      return NextResponse.json({ error: vErr?.message || 'Failed to update draft.' }, { status: 500 });
    }

    await admin
      .from('deal_contracts')
      .update({ updated_at: now })
      .eq('id', result.contract.id);

    return NextResponse.json({
      success: true,
      currentVersion: serializeContractVersion(updatedVersion),
    });
  } catch (error: any) {
    console.error('Error updating contract draft:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update draft.' }, { status: 500 });
  }
}
