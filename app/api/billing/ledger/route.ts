import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateUserBalances, syncLedgerForUser } from '@/lib/financial-ledger';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Ensure ledger is in sync with verified transactions
    await syncLedgerForUser(user.id);

    // Compute server-authoritative balances
    const balances = await calculateUserBalances(user.id);

    // Fetch financial ledger history
    const { data: ledgerEntries } = await admin
      .from('financial_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch transaction history
    const { data: transactionsList } = await admin
      .from('transactions')
      .select('*')
      .eq('creator_id', user.id)
      .order('date', { ascending: false });

    return NextResponse.json({
      success: true,
      balances,
      ledger: ledgerEntries || [],
      transactions: transactionsList || [],
    });
  } catch (err: any) {
    console.error('Error fetching billing ledger data:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
