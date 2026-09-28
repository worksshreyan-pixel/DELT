'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UsageMeter } from '@/components/usage-meter';
import { formatCurrency, PLANS } from '@/lib/plans';
import { useAppStore } from '@/lib/app-store';
import { cn } from '@/lib/utils';

export interface PaymentMethodItem {
  id: string;
  type: 'bank_account' | 'upi' | 'card_token';
  provider: string;
  label: string;
  details: Record<string, any>;
  is_default: boolean;
  created_at: string;
}

export interface LedgerItem {
  id: string;
  type: 'earning' | 'fee' | 'withdrawal' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  status: 'available' | 'pending' | 'completed' | 'reversed';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export function BillingFinancialCenter() {
  const store = useAppStore();

  const [balances, setBalances] = useState<{
    availableBalance: number;
    pendingBalance: number;
    totalEarned: number;
    totalFees: number;
    totalWithdrawn: number;
    totalRefunded: number;
    currency: any;
  }>({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    totalFees: 0,
    totalWithdrawn: 0,
    totalRefunded: 0,
    currency: 'INR',
  });

  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Payout Modal State
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  // Add Payment Method Modal State
  const [addMethodOpen, setAddMethodOpen] = useState(false);
  const [methodType, setMethodType] = useState<'bank_account' | 'upi'>('upi');
  const [methodLabel, setMethodLabel] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [addingMethod, setAddingMethod] = useState(false);
  const [methodError, setMethodError] = useState('');

  async function fetchBillingData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [ledgerRes, methodsRes] = await Promise.all([
        fetch('/api/billing/ledger'),
        fetch('/api/billing/payment-methods'),
      ]);

      const ledgerData = await ledgerRes.json();
      const methodsData = await methodsRes.json();

      if (ledgerRes.ok && ledgerData.success) {
        setBalances(ledgerData.balances);
        setLedgerEntries(ledgerData.ledger);
        setTransactions(ledgerData.transactions);
      } else {
        setErrorMsg(ledgerData.error || 'Failed to load ledger');
      }

      if (methodsRes.ok && methodsData.success) {
        setPaymentMethods(methodsData.methods);
        if (methodsData.methods.length > 0 && !selectedMethodId) {
          setSelectedMethodId(methodsData.methods[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching billing data:', err);
      setErrorMsg('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault();
    setPayoutError('');
    setPayoutSuccess(false);

    const amt = Number(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayoutError('Please enter a valid payout amount.');
      return;
    }

    if (amt > balances.availableBalance) {
      setPayoutError(`Amount exceeds available balance (${formatCurrency(balances.availableBalance, balances.currency)}).`);
      return;
    }

    setRequestingPayout(true);
    try {
      const methodObj = paymentMethods.find((m) => m.id === selectedMethodId);
      const res = await fetch('/api/billing/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          payoutMethodId: selectedMethodId,
          destinationLabel: methodObj ? methodObj.label : 'Bank Transfer',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPayoutError(data.error || 'Payout request failed.');
        setRequestingPayout(false);
        return;
      }

      setPayoutSuccess(true);
      setPayoutAmount('');
      await fetchBillingData();
      setTimeout(() => {
        setPayoutSuccess(false);
        setPayoutOpen(false);
      }, 2000);
    } catch (err: any) {
      setPayoutError('Unexpected error requesting payout.');
    } finally {
      setRequestingPayout(false);
    }
  }

  async function handleAddPaymentMethod(e: React.FormEvent) {
    e.preventDefault();
    setMethodError('');
    setAddingMethod(true);

    try {
      const res = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: methodType,
          label: methodLabel || (methodType === 'upi' ? `UPI (${upiId})` : `${bankName} Account`),
          upiId,
          bankName,
          accountNumber,
          ifscCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMethodError(data.error || 'Failed to add payment method.');
        setAddingMethod(false);
        return;
      }

      setAddMethodOpen(false);
      setMethodLabel('');
      setUpiId('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      await fetchBillingData();
    } catch (err: any) {
      setMethodError('Failed to save payment method.');
    } finally {
      setAddingMethod(false);
    }
  }

  async function handleDeletePaymentMethod(id: string) {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    try {
      const res = await fetch(`/api/billing/payment-methods?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchBillingData();
      }
    } catch (err) {
      console.error('Error removing method:', err);
    }
  }

  const plan = PLANS[store.credits.planId] || PLANS.free;

  return (
    <div className="space-y-6">
      {/* Wallet / Financial Summary Header Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Balance */}
        <Card className="bg-card border-border/60 relative overflow-hidden shadow-xs">
          <div className="absolute right-3 top-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2.5">
            <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Available Balance</CardDescription>
            <CardTitle className="text-2xl font-display font-bold text-foreground">
              {formatCurrency(balances.availableBalance, balances.currency as any)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              size="sm"
              variant="default"
              className="w-full mt-2 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={balances.availableBalance <= 0}
              onClick={() => setPayoutOpen(true)}
            >
              <ArrowUpRight className="h-4 w-4" />
              Request Payout
            </Button>
          </CardContent>
        </Card>

        {/* Pending Balance */}
        <Card className="bg-card border-border/60 relative overflow-hidden shadow-xs">
          <div className="absolute right-3 top-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 p-2.5">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Pending Settlement</CardDescription>
            <CardTitle className="text-2xl font-display font-bold text-foreground">
              {formatCurrency(balances.pendingBalance, balances.currency as any)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-muted-foreground mt-2">
              Unsettled funds from ongoing deal milestones.
            </p>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="bg-card border-border/60 relative overflow-hidden shadow-xs">
          <div className="absolute right-3 top-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 p-2.5">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Total Lifetime Earnings</CardDescription>
            <CardTitle className="text-2xl font-display font-bold text-foreground">
              {formatCurrency(balances.totalEarned, balances.currency as any)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-muted-foreground mt-2">
              Audited net earnings from completed deals.
            </p>
          </CardContent>
        </Card>

        {/* Fees Paid */}
        <Card className="bg-card border-border/60 relative overflow-hidden shadow-xs">
          <div className="absolute right-3 top-3 rounded-xl bg-muted p-2.5">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Platform & Processing Fees</CardDescription>
            <CardTitle className="text-2xl font-display font-bold text-foreground">
              {formatCurrency(balances.totalFees, balances.currency as any)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-muted-foreground mt-2">
              Total transaction & platform fee deductions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Billing Tabs */}
      <Tabs defaultValue="ledger" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ledger" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            <span>Financial Ledger</span>
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Payment & Payout Methods</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Subscription & Plan</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Financial Ledger */}
        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Immutable Financial Ledger</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Double-entry server-authoritative audit log of all deal earnings, fees, payouts, and refunds.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBillingData} disabled={loading} className="gap-1.5">
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Loading financial records...</div>
              ) : ledgerEntries.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border/60">
                  No financial ledger entries recorded yet. Complete a deal payment to view verified earnings.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground font-medium">
                        <th className="pb-3 pt-1 px-3">Date</th>
                        <th className="pb-3 pt-1 px-3">Type</th>
                        <th className="pb-3 pt-1 px-3">Description</th>
                        <th className="pb-3 pt-1 px-3">Status</th>
                        <th className="pb-3 pt-1 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {ledgerEntries.map((item) => {
                        const isCredit = item.type === 'earning' || (item.type === 'adjustment' && item.amount > 0);
                        return (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-3 whitespace-nowrap text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'capitalize text-[10px] font-semibold',
                                  item.type === 'earning' && 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40',
                                  item.type === 'withdrawal' && 'border-blue-500/30 text-blue-600 bg-blue-50/50 dark:bg-blue-950/40',
                                  item.type === 'fee' && 'border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/40',
                                  item.type === 'refund' && 'border-rose-500/30 text-rose-600 bg-rose-50/50 dark:bg-rose-950/40'
                                )}
                              >
                                {item.type}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 max-w-xs font-medium text-foreground">
                              <p className="truncate">{item.description}</p>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                {item.status === 'available' || item.status === 'completed' ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                                )}
                                <span className="capitalize">{item.status}</span>
                              </span>
                            </td>
                            <td className={cn('py-3 px-3 text-right font-mono font-semibold whitespace-nowrap', isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
                              {isCredit ? '+' : '-'}{formatCurrency(Math.abs(item.amount), item.currency as any)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Payment & Payout Methods */}
        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Saved Payment & Payout Methods</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Secure provider tokens, bank accounts, and UPI addresses used for deal payouts. Raw card credentials are never stored by DELT.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setAddMethodOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Payout Account
              </Button>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border/60">
                  <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium">No saved payment or payout methods</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Add a bank account or UPI ID to receive creator earnings payouts.</p>
                  <Button variant="outline" size="sm" onClick={() => setAddMethodOpen(true)} className="mt-3 gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Payout Account
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {m.type === 'bank_account' ? <Building2 className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            {m.label}
                            {m.is_default && <Badge variant="secondary" className="text-[9px] py-0 px-1.5">Default</Badge>}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            {m.details?.maskedAccount || m.details?.maskedUpi || m.type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePaymentMethod(m.id)}
                        title="Remove method"
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Subscription & Plan */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Current Plan & Limits</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-display font-bold">{plan.name} Plan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{plan.price ? `${formatCurrency(plan.price)}/mo` : 'Free'}</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count" />
                <UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Modal */}
      {payoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" />
                Request Creator Payout
              </h3>
              <button onClick={() => setPayoutOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payoutAmt" className="text-xs">Available Balance: <span className="font-bold">{formatCurrency(balances.availableBalance, balances.currency as any)}</span></Label>
                <Input
                  id="payoutAmt"
                  type="number"
                  step="0.01"
                  placeholder="Enter payout amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  required
                />
              </div>

              {paymentMethods.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Destination Account</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    value={selectedMethodId}
                    onChange={(e) => setSelectedMethodId(e.target.value)}
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>{m.label} ({m.details?.maskedAccount || m.details?.maskedUpi || m.type})</option>
                    ))}
                  </select>
                </div>
              )}

              {payoutError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{payoutError}</span>
                </div>
              )}

              {payoutSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Payout request submitted successfully!</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayoutOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={requestingPayout || !payoutAmount}>
                  {requestingPayout ? 'Submitting...' : 'Submit Payout Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {addMethodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-base font-semibold text-foreground">Add Payout Account</h3>
              <button onClick={() => setAddMethodOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={methodType === 'upi' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setMethodType('upi')}
                >
                  UPI ID
                </Button>
                <Button
                  type="button"
                  variant={methodType === 'bank_account' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setMethodType('bank_account')}
                >
                  Bank Account
                </Button>
              </div>

              {methodType === 'upi' ? (
                <div className="space-y-2">
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input
                    id="upi"
                    placeholder="e.g. shreyan@okaxis"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="bank">Bank Name</Label>
                    <Input id="bank" placeholder="e.g. HDFC Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc">Account Number</Label>
                    <Input id="acc" placeholder="Enter bank account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input id="ifsc" placeholder="e.g. HDFC0001234" value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} required />
                  </div>
                </div>
              )}

              {methodError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{methodError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddMethodOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={addingMethod}>
                  {addingMethod ? 'Saving...' : 'Save Payout Method'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
