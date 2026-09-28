// ==============================================================================
// DELT — Immutable Financial Ledger & Wallet Engine
// Server-Authoritative Earnings, Balances, & Auditable Transaction Ledger
// ==============================================================================

import { createAdminClient } from '@/lib/supabase/admin';

export type LedgerType = 'earning' | 'fee' | 'withdrawal' | 'refund' | 'adjustment';
export type LedgerStatus = 'available' | 'pending' | 'completed' | 'reversed';

export interface LedgerEntryParams {
  userId: string;
  dealId?: string;
  transactionId?: string;
  type: LedgerType;
  amount: number;
  currency?: string;
  status?: LedgerStatus;
  description: string;
  metadata?: Record<string, any>;
}

export interface ComputedBalances {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalFees: number;
  totalWithdrawn: number;
  totalRefunded: number;
  currency: string;
}

/**
 * Records an immutable entry in the DELT Financial Ledger.
 */
export async function recordLedgerEntry(params: LedgerEntryParams) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('financial_ledger')
    .insert({
      user_id: params.userId,
      deal_id: params.dealId || null,
      transaction_id: params.transactionId || null,
      type: params.type,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: params.status || 'available',
      description: params.description,
      metadata: params.metadata || {},
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting financial ledger entry:', error);
    throw new Error(`Failed to record financial ledger entry: ${error.message}`);
  }

  return data;
}

/**
 * Dynamically computes server-authoritative balances directly from immutable ledger records.
 * Balances are NEVER stored as simple mutable counter fields in DB tables.
 */
export async function calculateUserBalances(userId: string): Promise<ComputedBalances> {
  const supabase = createAdminClient();

  // First sync any un-ledgered verified transactions
  await syncLedgerForUser(userId);

  const { data: entries, error } = await supabase
    .from('financial_ledger')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching financial ledger entries:', error);
    return {
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalFees: 0,
      totalWithdrawn: 0,
      totalRefunded: 0,
      currency: 'INR',
    };
  }

  let totalEarned = 0;
  let totalFees = 0;
  let totalWithdrawn = 0;
  let totalRefunded = 0;
  let pendingBalance = 0;
  let availableBalance = 0;

  for (const entry of entries || []) {
    const amt = Number(entry.amount || 0);
    const status = entry.status;
    const type = entry.type;

    if (type === 'earning') {
      if (status === 'available' || status === 'completed') {
        totalEarned += amt;
        availableBalance += amt;
      } else if (status === 'pending') {
        pendingBalance += amt;
      }
    } else if (type === 'fee') {
      totalFees += Math.abs(amt);
    } else if (type === 'withdrawal') {
      if (status === 'completed' || status === 'available' || status === 'pending') {
        totalWithdrawn += Math.abs(amt);
        availableBalance -= Math.abs(amt);
      }
    } else if (type === 'refund') {
      totalRefunded += Math.abs(amt);
      availableBalance -= Math.abs(amt);
    } else if (type === 'adjustment') {
      availableBalance += amt;
    }
  }

  return {
    availableBalance: Math.max(0, Math.round(availableBalance * 100) / 100),
    pendingBalance: Math.round(pendingBalance * 100) / 100,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
    totalRefunded: Math.round(totalRefunded * 100) / 100,
    currency: 'INR',
  };
}

/**
 * Idempotently synchronizes verified deal transactions into the financial ledger.
 */
export async function syncLedgerForUser(userId: string) {
  const supabase = createAdminClient();

  // Fetch verified transactions for creator
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('creator_id', userId)
    .eq('state', 'paid');

  if (!txs || txs.length === 0) return;

  // Fetch existing ledger transaction IDs
  const { data: existingLedger } = await supabase
    .from('financial_ledger')
    .select('transaction_id')
    .eq('user_id', userId)
    .not('transaction_id', 'is', null);

  const existingTxIds = new Set((existingLedger || []).map((e) => e.transaction_id));

  for (const tx of txs) {
    if (!existingTxIds.has(tx.id)) {
      const netAmount = Number(tx.net_amount || tx.amount);
      const totalFees = Number(tx.platform_fee || 0) + Number(tx.processing_fee || 0);

      // Record Net Creator Earning
      await recordLedgerEntry({
        userId: tx.creator_id,
        dealId: tx.deal_id,
        transactionId: tx.id,
        type: 'earning',
        amount: netAmount,
        currency: tx.currency || 'INR',
        status: 'available',
        description: `Net earnings from deal: "${tx.deal_title}"`,
        metadata: { clientName: tx.client_name, grossAmount: Number(tx.amount) },
      });

      // Record Fee deduction if applicable
      if (totalFees > 0) {
        await recordLedgerEntry({
          userId: tx.creator_id,
          dealId: tx.deal_id,
          transactionId: tx.id,
          type: 'fee',
          amount: totalFees,
          currency: tx.currency || 'INR',
          status: 'completed',
          description: `Platform & processing fee for deal: "${tx.deal_title}"`,
          metadata: { platformFee: Number(tx.platform_fee), processingFee: Number(tx.processing_fee) },
        });
      }
    }
  }
}

/**
 * Requests a payout/withdrawal against available creator balance.
 * Validates available balance server-side and creates an auditable ledger record.
 */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  payoutMethodId?: string,
  destinationLabel?: string
) {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be greater than 0');
  }

  const balances = await calculateUserBalances(userId);
  if (amount > balances.availableBalance) {
    throw new Error(`Insufficient available balance. Requested: ${amount} INR, Available: ${balances.availableBalance} INR`);
  }

  const entry = await recordLedgerEntry({
    userId,
    type: 'withdrawal',
    amount: amount,
    currency: 'INR',
    status: 'pending',
    description: `Payout request to ${destinationLabel || 'Bank Account'}`,
    metadata: {
      payoutMethodId: payoutMethodId || null,
      destinationLabel: destinationLabel || 'Bank Payout',
      requestedAt: new Date().toISOString(),
    },
  });

  return entry;
}

/**
 * Processes a deal refund in the financial ledger and updates transaction state.
 */
export async function processRefundLedger(
  userId: string,
  dealId: string,
  transactionId: string,
  amount: number,
  reason: string
) {
  const supabase = createAdminClient();

  // Mark transaction state as refunded
  await supabase
    .from('transactions')
    .update({ state: 'refunded' })
    .eq('id', transactionId);

  const entry = await recordLedgerEntry({
    userId,
    dealId,
    transactionId,
    type: 'refund',
    amount: amount,
    currency: 'INR',
    status: 'completed',
    description: `Refund processed: ${reason}`,
    metadata: { reason, refundedAt: new Date().toISOString() },
  });

  return entry;
}
