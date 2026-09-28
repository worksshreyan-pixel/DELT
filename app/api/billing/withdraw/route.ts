import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requestWithdrawal, calculateUserBalances } from '@/lib/financial-ledger';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, payoutMethodId, destinationLabel } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid payout amount greater than 0' }, { status: 400 });
    }

    // Process withdrawal through immutable ledger engine (validates available balance server-side)
    const withdrawalEntry = await requestWithdrawal(
      user.id,
      numAmount,
      payoutMethodId,
      destinationLabel
    );

    const updatedBalances = await calculateUserBalances(user.id);

    return NextResponse.json({
      success: true,
      withdrawal: withdrawalEntry,
      balances: updatedBalances,
    });
  } catch (err: any) {
    console.error('Error processing withdrawal request:', err);
    return NextResponse.json({ error: err.message || 'Withdrawal request failed' }, { status: 400 });
  }
}
