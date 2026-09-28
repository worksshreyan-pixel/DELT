'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Lock,
  Send,
  Check,
  FileCheck,
  Clock,
  Download,
  MessageSquare,
  ArrowLeftRight,
  CreditCard,
  Activity,
  Flag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  ExternalLink,
  X,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OtpCodeSlots } from '@/components/ui/otp-code-slots';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealStatusBadge, PaymentStatusBadge, DeliverableStatusBadge } from '@/components/deal-status-badge';
import { PriceProposalCard } from '@/components/price-proposal-card';
import { ChatMessageItem } from '@/components/chat-message';
import { FileCard } from '@/components/file-card';
import { InvoicePreview } from '@/components/invoices/invoice-preview';
import { EmptyState } from '@/components/empty-state';
import { ScopeMilestones } from '@/components/scope-milestones';
import { formatCurrency } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { printWithFilename } from '@/lib/print-utils';
import { getCanonicalDeliverables } from '@/lib/deals/canonical-deliverables';
import { isUsablePreviewAvailable } from '@/lib/preview-utils';
import { hasSupabasePublicConfig } from '@/lib/env';
import { addMessageToStore, addProposalToStore, respondToProposalInStore, simulatePaymentInStore } from '@/lib/app-store';
import { cn } from '@/lib/utils';
import { ClientContractPanel } from '@/components/contract/client-contract-panel';
import type { Deal, DealMessage, PriceProposal, DealEvent, Deliverable, FileVersion, Payment, Milestone } from '@/lib/types';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getInitials(name?: string) {
  if (!name) return 'CL';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ClientDealPage() {
  const params = useParams();
  const token = params.identifier as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealMeta, setDealMeta] = useState<{ title?: string; clientEmail?: string; creatorName?: string } | null>(null);
  const [dealNotFound, setDealNotFound] = useState(false);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [creatorName, setCreatorName] = useState('Creator');
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const isSendingRef = useRef(false);
  const isVerifyingRef = useRef(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Initial Deal Metadata & Session Verification
  useEffect(() => {
    let isMounted = true;

    async function loadDeal() {
      setLoadingDeal(true);
      setError('');
      try {
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${token}`) : null;
        const res = await fetch(`/api/deals/${encodeURIComponent(token)}/verify-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
          },
        });

        if (!isMounted) return;

        if (res.status === 404) {
          setDealNotFound(true);
          setLoadingDeal(false);
          return;
        }

        const json = await res.json();

        if (json.authorized && json.deal) {
          setDeal(json.deal);
          setCreatorName(json.creatorName || json.deal.creatorName || 'Creator');
          setEmail(json.clientEmail || json.deal.clientEmail || '');
          setVerified(true);
        } else {
          setDealMeta({
            title: json.dealTitle || 'Deal Workspace',
            clientEmail: json.clientEmail || '',
            creatorName: json.creatorName || 'Creator',
          });
          if (json.clientEmail) {
            setEmail(json.clientEmail);
          }
          if (json.error && json.error !== 'Unauthorized.') {
            setError(json.error);
          }
        }
      } catch (e: any) {
        if (isMounted) {
          console.error('Error verifying deal session:', e);
          setError('Failed to connect to Deal workspace.');
        }
      } finally {
        if (isMounted) {
          setLoadingDeal(false);
        }
      }
    }

    if (token) {
      loadDeal();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Request 6-Digit OTP via Resend
  async function handleSendOtp() {
    if (isSendingRef.current || isSending || cooldown > 0) return;
    isSendingRef.current = true;

    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your email address.');
      isSendingRef.current = false;
      return;
    }

    // Client email match check against private workspace meta
    if (dealMeta?.clientEmail && targetEmail !== dealMeta.clientEmail.toLowerCase()) {
      setError('This email address is not authorized for this private Deal workspace.');
      isSendingRef.current = false;
      return;
    }

    setIsSending(true);
    setError('');
    setStatusMessage('');

    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(token)}/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to send verification code.');
        if (json.cooldownSeconds) {
          setCooldown(json.cooldownSeconds);
        }
        return;
      }

      setOtpSent(true);
      setOtp(['', '', '', '', '', '']);
      setCooldown(30);
      setStatusMessage(`Code sent to ${targetEmail}`);
    } catch (e: any) {
      console.error('OTP request error:', e);
      setError('Unable to send the verification email. Please try again.');
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  // Verify 6-Digit OTP submitted by client
  async function handleVerifyOtp(codeToVerify?: string) {
    if (isVerifyingRef.current || verifying) return;
    isVerifyingRef.current = true;

    const code = (codeToVerify || otp.join('')).trim();
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      isVerifyingRef.current = false;
      return;
    }

    const targetEmail = (email || dealMeta?.clientEmail || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Email address is required.');
      isVerifyingRef.current = false;
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const serverVerifyRes = await fetch(`/api/deals/${encodeURIComponent(token)}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, otp: code }),
      });
      const serverVerifyJson = await serverVerifyRes.json();

      if (!serverVerifyRes.ok || !serverVerifyJson.authorized) {
        setError(serverVerifyJson.error || 'Incorrect code. Please try again.');
        setVerifying(false);
        isVerifyingRef.current = false;
        return;
      }

      if (serverVerifyJson.clientSessionToken) {
        localStorage.setItem(`delt_client_session_${token}`, serverVerifyJson.clientSessionToken);
      }
      if (serverVerifyJson.deal) {
        setDeal(serverVerifyJson.deal);
      }
      if (serverVerifyJson.creatorName || serverVerifyJson.deal?.creatorName) {
        setCreatorName(serverVerifyJson.creatorName || serverVerifyJson.deal.creatorName);
      }
      setVerified(true);
    } catch (e: any) {
      console.error('OTP verification error:', e);
      setError('Verification failed. Please try again.');
    } finally {
      isVerifyingRef.current = false;
      setVerifying(false);
    }
  }

  async function handleSignOutAndSwitch() {
    try {
      const savedToken = localStorage.getItem(`delt_client_session_${token}`);
      
      // Hit the logout endpoint to clear the HttpOnly cookie and revoke DB session
      await fetch(`/api/deals/${encodeURIComponent(token)}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
      });

      localStorage.removeItem(`delt_client_session_${token}`);
      const supabase = createClient();
      await supabase.auth.signOut();
      setVerified(false);
      setOtpSent(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
      setStatusMessage('');
      if (dealMeta?.clientEmail) {
        setEmail(dealMeta.clientEmail);
      }
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }


  if (loadingDeal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Opening Deal Workspace...</p>
        </div>
      </div>
    );
  }

  if (dealNotFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <Lock className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-display font-semibold tracking-tight mb-1">Deal no longer exists</h2>
            <p className="text-sm text-muted-foreground">
              This Deal has been closed or is no longer available. Please verify with your creator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verified || !deal) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex justify-center">
              <Logo size="lg" />
            </div>
            <Card>
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {!otpSent ? (
                    <motion.div key="email" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
                          <Lock className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-lg font-display font-semibold tracking-tight mb-1">Private Client Workspace</h1>
                        <p className="text-sm text-muted-foreground">{dealMeta?.title || 'Deal Workspace'}</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Your Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="e.g. rahul@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the email address where your creator sent this Deal.
                          </p>
                        </div>

                        {error && (
                          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                          </div>
                        )}

                        <Button
                          onClick={handleSendOtp}
                          className="w-full gap-2"
                          disabled={!email || isSending || cooldown > 0}
                        >
                          {isSending
                            ? 'Sending Code...'
                            : cooldown > 0
                              ? `Resend available in ${cooldown}s`
                              : 'Send OTP'}
                          {!isSending && cooldown <= 0 && <ArrowRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="otp" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-lg font-display font-semibold tracking-tight mb-1">Enter Verification Code</h1>
                        <p className="text-sm text-muted-foreground">
                          Code sent to <span className="font-medium text-foreground">{email}</span>
                        </p>
                      </div>

                      <div className="space-y-4">
                        {statusMessage && (
                          <div className="rounded-lg bg-primary/5 p-2.5 text-xs text-muted-foreground text-center border border-primary/10">
                            {statusMessage}
                          </div>
                        )}

                        <OtpCodeSlots
                          length={6}
                          value={otp}
                          onChange={setOtp}
                          onComplete={(code) => handleVerifyOtp(code)}
                          disabled={verifying}
                          isLoading={verifying}
                          status={verified ? 'success' : error ? 'error' : 'idle'}
                        />

                        {error && (
                          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                          </div>
                        )}

                        <Button onClick={() => handleVerifyOtp()} className="w-full gap-2" disabled={verifying || otp.join('').length !== 6}>
                          {verifying ? 'Verifying...' : 'Verify & Open Workspace'}
                          {!verifying && <ArrowRight className="h-4 w-4" />}
                        </Button>

                        <div className="flex items-center justify-between pt-2 text-xs">
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setError(''); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Change email
                          </button>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={cooldown > 0 || isSending}
                            className="text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                          >
                            <RefreshCw className={`h-3 w-3 ${isSending ? 'animate-spin' : ''}`} />
                            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientPortal
      deal={deal}
      clientEmail={email}
      clientName={(deal as any).clientName || (deal as any).client_name || 'Client'}
      creatorName={creatorName}
      urlToken={token}
    />
  );
}

// ---------------------------------------------------------------------------
// Client Needs Attention Banner
// ---------------------------------------------------------------------------

function ClientNeedsAttentionBanner({
  deal,
  fileVersions,
  deliverables,
  invoices,
  onNavigateTab,
}: {
  deal: Deal;
  fileVersions: FileVersion[];
  deliverables: Deliverable[];
  invoices: any[];
  onNavigateTab: (tab: string) => void;
}) {
  const pendingReviews = fileVersions.filter((fv) => fv.status === 'pending_review');
  const changesRequested = deliverables.filter((d) => d.status === 'changes_requested');
  const isPaymentPending = deal.status === 'payment_pending' || (deal.paymentStatus !== 'paid' && deal.paymentStatus !== 'none');
  const unpaidInvoice = invoices.find((i) => i.status === 'sent' || i.status === 'overdue' || i.status === 'issued' || i.status === 'viewed');

  if (pendingReviews.length > 0) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 text-xs">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">Your files are ready for review</p>
            <p className="text-muted-foreground">{pendingReviews.length} {pendingReviews.length === 1 ? 'file is' : 'files are'} awaiting your review and approval.</p>
          </div>
        </div>
        <Button size="sm" className="shrink-0 h-8 gap-1.5" onClick={() => onNavigateTab('files')}>
          Review Files →
        </Button>
      </div>
    );
  }

  if (changesRequested.length > 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 text-xs">
        <Clock className="h-5 w-5 text-blue-500 shrink-0" />
        <div>
          <p className="font-semibold text-foreground text-sm">Changes requested</p>
          <p className="text-muted-foreground">Your creator is working on updating the requested revisions.</p>
        </div>
      </div>
    );
  }

  if (unpaidInvoice || (isPaymentPending && deliverables.some((d) => d.status === 'approved'))) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 text-xs">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">Payment is due</p>
            <p className="text-muted-foreground">Complete payment to unlock high-resolution deliverable downloads.</p>
          </div>
        </div>
        <Button size="sm" className="shrink-0 h-8 gap-1.5" onClick={() => onNavigateTab('overview')}>
          Pay Now →
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      <div>
        <p className="font-semibold text-foreground text-sm">Everything is up to date</p>
        <p className="text-muted-foreground">No action is required from you right now.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client Portal Active Component
// ---------------------------------------------------------------------------

function ClientPortal({
  deal,
  clientEmail,
  clientName,
  creatorName,
  urlToken,
}: {
  deal: Deal;
  clientEmail: string;
  clientName: string;
  creatorName: string;
  urlToken: string;
}) {
  const [currentDeal, setCurrentDeal] = useState<Deal>(deal);
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [proposals, setProposals] = useState<PriceProposal[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [fileVersions, setFileVersions] = useState<FileVersion[]>([]);
  const [events, setEvents] = useState<DealEvent[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contractRecord, setContractRecord] = useState<any>(null);
  const [clientSessionChecked, setClientSessionChecked] = useState(false);

  const [input, setInput] = useState('');
  const [proposalOpen, setProposalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [activeDeliverableId, setActiveDeliverableId] = useState<string | null>(null);
  const [changeFeedback, setChangeFeedback] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalReason, setProposalReason] = useState('');
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeProposal, setActiveProposal] = useState<PriceProposal | null>(null);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMimeType, setPreviewMimeType] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewLoadingFileId, setPreviewLoadingFileId] = useState<string | null>(null);

  // Review & Approval state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [activeApproveDeliverable, setActiveApproveDeliverable] = useState<Deliverable | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  const [requestingChanges, setRequestingChanges] = useState(false);
  const [changeRequestError, setChangeRequestError] = useState('');
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const [paymentError, setPaymentError] = useState('');

  const isClosed = currentDeal.status === 'closed';
  const isPaid = currentDeal.paymentStatus === 'paid' || currentDeal.status === 'completed';
  const activeInvoice = invoices.find(i => i.status !== 'draft');

  // Authoritative feature-conditional flags
  const hasAgreement = Boolean(
    contractRecord ||
    (currentDeal as any).createAgreement ||
    events.some((e) => (e.type as string) === 'contract_created' || (e.type as string) === 'contract_sent' || (e.type as string) === 'contract_accepted')
  );
  const hasMilestones = Boolean(milestones && milestones.length > 0);
  const hasInvoice = Boolean(invoices && invoices.length > 0);

  // Auto-fallback activeTab if on a removed or disabled tab
  useEffect(() => {
    if (activeTab === 'payment' || activeTab === 'payments') {
      setActiveTab('overview');
    } else if (activeTab === 'agreement' && !hasAgreement) {
      setActiveTab('overview');
    }
  }, [activeTab, hasAgreement]);

  // Single canonical source of truth for deliverables (deal.scope + deliverables DB table)
  const effectiveDeliverables: Deliverable[] = getCanonicalDeliverables(currentDeal, deliverables, fileVersions);

  // Load deliverable files & messages from Supabase (Single, stable effect on mount)
  useEffect(() => {
    if (!hasSupabasePublicConfig()) return;

    const supabase = createClient();

    async function loadData() {
      // Deliverables
      const { data: dbDelivs } = await supabase.from('deliverables').select('*').eq('deal_id', deal.id);
      if (dbDelivs && dbDelivs.length > 0) {
        setDeliverables(dbDelivs.map((d: any) => ({
          id: d.id,
          dealId: d.deal_id,
          name: d.name,
          description: d.description,
          status: d.status,
          createdAt: d.created_at,
        })));
      }

      // File versions
      const { data: dbVersions } = await supabase.from('file_versions').select('*').eq('deal_id', deal.id).order('version', { ascending: true });
      if (dbVersions && dbVersions.length > 0) {
        setFileVersions(dbVersions.map((v: any) => ({
          id: v.id,
          deliverableId: v.deliverable_id,
          dealId: v.deal_id,
          version: v.version,
          description: v.description,
          uploaderId: v.uploader_id,
          uploaderName: v.uploader_name,
          files: Array.isArray(v.files) ? v.files : [],
          status: v.status,
          locked: Boolean(v.locked),
          createdAt: v.created_at,
        })));
      }

      // Proposals
      const { data: dbProps } = await supabase.from('price_proposals').select('*').eq('deal_id', deal.id).order('created_at', { ascending: true });
      if (dbProps && dbProps.length > 0) {
        setProposals(dbProps.map((p: any) => ({
          id: p.id,
          dealId: p.deal_id,
          direction: p.direction,
          previousPrice: Number(p.previous_price),
          proposedPrice: Number(p.proposed_price),
          reason: p.reason,
          state: p.state,
          proposedBy: p.proposed_by,
          proposedByName: p.proposed_by_name,
          proposedByRole: p.proposed_by_role,
          counterProposalId: p.counter_proposal_id || p.parent_proposal_id || p.parentProposalId,
          createdAt: p.created_at,
        })));
      }

      // Messages
      const { data: dbMsgs } = await supabase.from('deal_messages').select('*').eq('deal_id', deal.id).order('created_at', { ascending: true });
      if (dbMsgs && dbMsgs.length > 0) {
        setMessages(dbMsgs.map((m: any) => ({
          id: m.id,
          dealId: m.deal_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          type: m.type,
          content: m.content,
          proposalId: m.proposal_id,
          createdAt: m.created_at,
        })));
      }

      // Events
      const { data: dbEvents } = await supabase.from('deal_events').select('*').eq('deal_id', deal.id).order('created_at', { ascending: false });
      if (dbEvents && dbEvents.length > 0) {
        setEvents(dbEvents.map((e: any) => ({
          id: e.id,
          dealId: e.deal_id,
          type: e.type,
          actorName: e.actor_name || 'System',
          actorRole: e.actor_role || 'system',
          description: e.description,
          createdAt: e.created_at,
        })));
      }

      // Milestones
      const { data: dbMilestones } = await supabase.from('milestones').select('*').eq('deal_id', deal.id).order('order', { ascending: true });
      if (dbMilestones && dbMilestones.length > 0) {
        setMilestones(dbMilestones.map((m: any) => ({
          id: m.id,
          dealId: m.deal_id,
          title: m.title,
          description: m.description,
          order: m.order,
          dueDate: m.due_date,
          status: m.status,
          completedAt: m.completed_at,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        })));
      }

      // Contracts / Agreement
      const { data: dbContract } = await supabase.from('deal_contracts').select('*').eq('deal_id', deal.id).maybeSingle();
      if (dbContract) {
        setContractRecord(dbContract);
      }

      // Invoices
      const { data: dbInvoices } = await supabase.from('invoices').select('*, creator:profiles(*)').eq('deal_id', deal.id).neq('status', 'draft').order('created_at', { ascending: false });
      if (dbInvoices && dbInvoices.length > 0) {
        setInvoices(dbInvoices);
      } else if (deal.status === 'completed' && deal.paymentStatus === 'paid') {
        // Auto-reconcile if invoice is missing
        try {
          const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${deal.token}`) : null;
          
          const res = await fetch('/api/invoices/ensure', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(savedToken ? { 'x-client-session-token': savedToken } : {})
            },
            body: JSON.stringify({ dealId: deal.id })
          });
          const json = await res.json();
          if (json.invoice) {
            const { data: genInvoice } = await supabase.from('invoices').select('*, creator:profiles(*)').eq('id', json.invoice.id).maybeSingle();
            if (genInvoice) setInvoices([genInvoice]);
          }
        } catch (e) {
          console.error('Failed to ensure invoice', e);
        }
      }
    }

    loadData();

    // Scoped Realtime channel
    const channel = supabase
      .channel(`deal:${deal.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: `deal_id=eq.${deal.id}` },
        (payload) => {
          const raw = payload.new as any;
          const formattedMsg: DealMessage = {
            id: raw.id,
            dealId: raw.deal_id || raw.dealId || deal.id,
            senderId: raw.sender_id || raw.senderId || 'user',
            senderName: raw.sender_name || raw.senderName || 'User',
            senderRole: raw.sender_role || raw.senderRole || 'client',
            type: raw.type,
            content: raw.content,
            proposalId: raw.proposal_id || raw.proposalId,
            createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
          };
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === formattedMsg.id);
            if (exists) return prev;
            const filtered = prev.filter((m) => !(m.id.startsWith('msg_') && m.content === formattedMsg.content));
            return [...filtered, formattedMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'price_proposals', filter: `deal_id=eq.${deal.id}` },
        (payload) => {
          const raw = payload.new as any;
          const formattedProp: PriceProposal = {
            id: raw.id,
            dealId: raw.deal_id || raw.dealId || deal.id,
            direction: raw.direction,
            previousPrice: Number(raw.previous_price ?? raw.previousPrice ?? 0),
            proposedPrice: Number(raw.proposed_price ?? raw.proposedPrice ?? 0),
            reason: raw.reason,
            state: raw.state,
            proposedBy: raw.proposed_by || raw.proposedBy || 'user',
            proposedByName: raw.proposed_by_name || raw.proposedByName || 'User',
            proposedByRole: raw.proposed_by_role || raw.proposedByRole || 'client',
            counterProposalId: raw.parent_proposal_id || raw.parentProposalId || raw.counter_proposal_id || raw.counterProposalId,
            createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
          };
          if (payload.eventType === 'INSERT') {
            setProposals((prev) => {
              const filtered = prev.filter((p) => !(p.id.startsWith('prop_') && p.proposedPrice === formattedProp.proposedPrice && p.proposedByRole === formattedProp.proposedByRole));
              if (filtered.some((p) => p.id === formattedProp.id)) return filtered;
              return [...filtered, formattedProp];
            });
          } else if (payload.eventType === 'UPDATE') {
            setProposals((prev) =>
              prev.map((p) => (p.id === formattedProp.id ? formattedProp : p))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals', filter: `id=eq.${deal.id}` },
        (payload) => {
          const updated = payload.new as any;
          setCurrentDeal((prev) => ({
            ...prev,
            ...updated,
            scope: updated.scope !== undefined ? (Array.isArray(updated.scope) ? updated.scope : []) : prev.scope,
            paymentStatus: updated.payment_status || prev.paymentStatus,
            lastActivityAt: updated.last_activity_at || prev.lastActivityAt,
          }));
          if (updated.payment_status === 'paid' || updated.status === 'completed') {
            setDeliverables((prev) => prev.map((d) => ({ ...d, status: 'approved' })));
            setFileVersions((prev) => prev.map((v) => ({ ...v, status: 'approved', locked: false })));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milestones', filter: `deal_id=eq.${deal.id}` },
        (payload) => {
          const raw = payload.new as any;
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setMilestones((prev) => prev.filter((m) => m.id !== oldId));
            }
          } else {
            const formatted: Milestone = {
              id: raw.id,
              dealId: raw.deal_id,
              title: raw.title,
              description: raw.description,
              order: raw.order,
              dueDate: raw.due_date,
              status: raw.status,
              completedAt: raw.completed_at,
              createdAt: raw.created_at,
              updatedAt: raw.updated_at,
            };
            if (payload.eventType === 'INSERT') {
              setMilestones((prev) => {
                if (prev.some((m) => m.id === formatted.id)) return prev;
                return [...prev, formatted];
              });
            } else if (payload.eventType === 'UPDATE') {
              setMilestones((prev) =>
                prev.map((m) => (m.id === formatted.id ? formatted : m))
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliverables', filter: `deal_id=eq.${deal.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setDeliverables((prev) => prev.filter((d) => d.id !== oldId));
            }
          } else if (payload.new) {
            const raw = payload.new as any;
            const updatedDel: Deliverable = {
              id: raw.id,
              dealId: raw.deal_id || raw.dealId,
              name: raw.name,
              description: raw.description,
              status: raw.status,
              createdAt: raw.created_at || raw.createdAt,
            };
            setDeliverables((prev) => {
              const exists = prev.some((d) => d.id === updatedDel.id);
              if (exists) {
                return prev.map((d) => (d.id === updatedDel.id ? updatedDel : d));
              }
              return [...prev, updatedDel];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'file_versions', filter: `deal_id=eq.${deal.id}` },
        (payload) => {
          const raw = payload.new as any;
          const updatedVer: FileVersion = {
            id: raw.id,
            dealId: raw.deal_id || raw.dealId,
            deliverableId: raw.deliverable_id || raw.deliverableId,
            version: raw.version,
            description: raw.description,
            uploaderId: raw.uploader_id || raw.uploaderId || 'creator',
            uploaderName: raw.uploader_name || raw.uploaderName || 'Creator',
            status: raw.status,
            locked: raw.locked,
            files: raw.files || [],
            createdAt: raw.created_at || raw.createdAt,
          };
          setFileVersions((prev) => {
            const exists = prev.some((v) => v.id === updatedVer.id);
            if (exists) {
              return prev.map((v) => (v.id === updatedVer.id ? updatedVer : v));
            }
            return [...prev, updatedVer];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deal.id]);

  useEffect(() => {
    const issuedInvoice = invoices.find((i) => i.status === 'issued' || i.status === 'sent');
    if (issuedInvoice) {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${urlToken}`) : null;
      fetch(`/api/invoices/${issuedInvoice.id}/client-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
        body: JSON.stringify({ dealToken: urlToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.invoice) {
            setInvoices((prev) => prev.map((inv) => (inv.id === data.invoice.id ? { ...inv, status: 'viewed' } : inv)));
          }
        })
        .catch((err) => console.error('Error tracking invoice view:', err));
    }
  }, [invoices, urlToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    // Optimistic local add
    const optId = `msg_${Date.now()}`;
    const optMsg: DealMessage = {
      id: optId,
      dealId: currentDeal.id,
      senderId: 'client',
      senderName: clientName,
      senderRole: 'client',
      type: 'text',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optMsg]);

    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${urlToken}`) : null;
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
        body: JSON.stringify({
          dealId: currentDeal.id,
          senderId: 'client',
          senderName: clientName,
          senderRole: 'client',
          type: 'text',
          content: text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          const serverMsg: DealMessage = {
            id: data.message.id,
            dealId: data.message.deal_id,
            senderId: data.message.sender_id,
            senderName: data.message.sender_name,
            senderRole: data.message.sender_role,
            type: data.message.type,
            content: data.message.content,
            createdAt: data.message.created_at,
          };
          setMessages((prev) =>
            prev.map((m) => (m.id === optId ? serverMsg : m))
          );
        }
      }
    } catch (e) {
      console.error('Error sending message:', e);
    }
  }

  async function handleProposePrice(e: React.FormEvent) {
    e.preventDefault();
    const price = parseInt(proposalPrice, 10);
    if (!price || price <= 0 || submittingProposal) return;

    setSubmittingProposal(true);
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${urlToken}`) : null;
      const res = await fetch('/api/negotiation/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
        body: JSON.stringify({
          dealId: currentDeal.id,
          proposedPrice: price,
          reason: proposalReason,
          proposedByRole: 'client',
          proposedByName: clientName,
        }),
      });
      const json = await res.json();
      if (res.ok && json.proposal) {
        const newProp: PriceProposal = {
          id: json.proposal.id,
          dealId: json.proposal.deal_id,
          direction: json.proposal.direction,
          previousPrice: Number(json.proposal.previous_price),
          proposedPrice: Number(json.proposal.proposed_price),
          reason: json.proposal.reason,
          state: json.proposal.state,
          proposedBy: json.proposal.proposed_by,
          proposedByName: json.proposal.proposed_by_name,
          proposedByRole: json.proposal.proposed_by_role,
          createdAt: json.proposal.created_at,
        };
        addProposalToStore(currentDeal.id, price, proposalReason.trim() || undefined, 'client', clientName);
        setProposals((prev) => {
          const filtered = prev.filter((p) => !p.id.startsWith('prop_'));
          if (filtered.some((p) => p.id === newProp.id)) return filtered;
          return [...filtered, newProp];
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingProposal(false);
      setProposalPrice('');
      setProposalReason('');
      setProposalOpen(false);
    }
  }

  async function handleCounterProposal(e: React.FormEvent) {
    e.preventDefault();
    const price = parseInt(proposalPrice, 10);
    if (!price || price <= 0 || !activeProposal || submittingProposal) return;

    setSubmittingProposal(true);
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${urlToken}`) : null;
      const res = await fetch('/api/negotiation/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
        body: JSON.stringify({
          dealId: currentDeal.id,
          proposedPrice: price,
          reason: proposalReason,
          proposedByRole: 'client',
          proposedByName: clientName,
          parentProposalId: activeProposal.id,
        }),
      });
      const json = await res.json();
      if (res.ok && json.proposal) {
        const counterProp: PriceProposal = {
          id: json.proposal.id,
          dealId: json.proposal.deal_id,
          direction: json.proposal.direction,
          previousPrice: Number(json.proposal.previous_price),
          proposedPrice: Number(json.proposal.proposed_price),
          reason: json.proposal.reason,
          state: json.proposal.state,
          proposedBy: json.proposal.proposed_by,
          proposedByName: json.proposal.proposed_by_name,
          proposedByRole: json.proposal.proposed_by_role,
          counterProposalId: activeProposal.id,
          createdAt: json.proposal.created_at,
        };
        addProposalToStore(currentDeal.id, price, proposalReason.trim() || undefined, 'client', clientName, activeProposal.id);
        setProposals((prev) => {
          const filtered = prev.map((p) => p.id === activeProposal.id ? { ...p, state: 'countered' as const } : p)
            .filter((p) => !p.id.startsWith('prop_'));
          if (filtered.some((p) => p.id === counterProp.id)) return filtered;
          return [...filtered, counterProp];
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingProposal(false);
      setProposalPrice('');
      setProposalReason('');
      setActiveProposal(null);
      setProposalOpen(false);
    }
  }

  async function handleAcceptProposal(proposal: PriceProposal) {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${urlToken}`) : null;
      const res = await fetch('/api/negotiation/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          dealId: currentDeal.id,
          response: 'accept',
          responderName: clientName,
          responderRole: 'client',
        }),
      });
      const json = await res.json();
      if (res.ok) {
        respondToProposalInStore(currentDeal.id, proposal.id, 'accept', clientName);
        setCurrentDeal((prev) => ({
          ...prev,
          price: proposal.proposedPrice,
          status: 'agreed',
        }));
        setProposals((prev) =>
          prev.map((p) => (p.id === proposal.id ? { ...p, state: 'accepted' as const, resolvedAt: new Date().toISOString() } : p))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveProposal(null);
      setProposalOpen(false);
    }
  }

  async function handleDeclineProposal(proposal: PriceProposal) {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${urlToken}`) : null;
      const res = await fetch('/api/negotiation/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          dealId: currentDeal.id,
          response: 'decline',
          responderName: clientName,
          responderRole: 'client',
        }),
      });
      const json = await res.json();
      if (res.ok) {
        respondToProposalInStore(currentDeal.id, proposal.id, 'decline', clientName);
        setProposals((prev) =>
          prev.map((p) => (p.id === proposal.id ? { ...p, state: 'declined' as const, resolvedAt: new Date().toISOString() } : p))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveProposal(null);
      setProposalOpen(false);
    }
  }

  function handleOpenApproveModal(del: Deliverable) {
    setActiveApproveDeliverable(del);
    setApproveError('');
    setApproveModalOpen(true);
  }

  async function confirmApproveDeliverable() {
    if (!activeApproveDeliverable) return;
    setApproving(true);
    setApproveError('');
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${urlToken}`) : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (savedToken) headers['x-client-session-token'] = savedToken;

      const res = await fetch('/api/deliverables/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dealId: currentDeal.id,
          dealCode: currentDeal.dealCode || urlToken,
          deliverableId: activeApproveDeliverable.id,
          action: 'approve',
          clientName,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApproveError(data.error || 'Failed to approve deliverable.');
        setApproving(false);
        return;
      }

      setDeliverables((prev) => prev.map((d) => (d.id === activeApproveDeliverable.id ? { ...d, status: 'approved' } : d)));
      setFileVersions((prev) => prev.map((v) => (v.deliverableId === activeApproveDeliverable.id ? { ...v, status: 'approved', locked: false } : v)));
      setApproveModalOpen(false);
      setActiveApproveDeliverable(null);
    } catch (e: any) {
      console.error(e);
      setApproveError(e?.message || 'Network error approving deliverable.');
    } finally {
      setApproving(false);
    }
  }

  async function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    setPromoError('');
    setApplyingPromo(true);

    const code = promoCode.trim().toUpperCase();
    if (code === 'DELT' || code === 'SHREYAN') {
      setTimeout(() => {
        setPromoApplied(true);
        setApplyingPromo(false);
      }, 500);
    } else {
      setTimeout(() => {
        setPromoError('Invalid or expired promo code');
        setApplyingPromo(false);
      }, 500);
    }
  }

  async function handleRedeemPromo() {
    setPaying(true);
    setPromoError('');
    try {
      const savedToken = localStorage.getItem(`delt_client_session_${urlToken}`);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (savedToken) {
        headers['x-client-session-token'] = savedToken;
      }

      const res = await fetch('/api/payments/redeem-promo', {
        method: 'POST',
        headers,
        body: JSON.stringify({ dealId: currentDeal.id, token: currentDeal.token, promoCode }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setPromoError(data.error || 'Failed to redeem promo code');
        setPaying(false);
        return;
      }

      // Success
      simulatePaymentInStore(currentDeal.id, `Promo ${promoCode.toUpperCase()} Applied`);
      setCurrentDeal((prev) => ({
        ...prev,
        paymentStatus: 'paid',
        status: 'completed',
      }));
      setDeliverables((prev) => prev.map((d) => ({ ...d, status: 'approved' })));
      setFileVersions((prev) => prev.map((v) => ({ ...v, status: 'approved', locked: false })));
      setPaymentOpen(false);
    } catch (err: any) {
      console.error(err);
      setPromoError('Network error redeeming promo');
    } finally {
      setPaying(false);
    }
  }

  async function handleRequestChanges(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDeliverableId) return;
    const feedbackText = changeFeedback.trim();
    if (!feedbackText) {
      setChangeRequestError('Please specify what needs to be revised.');
      return;
    }

    setRequestingChanges(true);
    setChangeRequestError('');
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(`delt_client_session_${urlToken}`) : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (savedToken) headers['x-client-session-token'] = savedToken;

      const res = await fetch('/api/deliverables/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dealId: currentDeal.id,
          dealCode: currentDeal.dealCode || urlToken,
          deliverableId: activeDeliverableId,
          action: 'request_changes',
          feedback: feedbackText,
          clientName,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChangeRequestError(data.error || 'Failed to submit change request.');
        setRequestingChanges(false);
        return;
      }

      setDeliverables((prev) => prev.map((d) => (d.id === activeDeliverableId ? { ...d, status: 'changes_requested' } : d)));
      setFileVersions((prev) => {
        const versions = prev.filter((v) => v.deliverableId === activeDeliverableId);
        if (versions.length === 0) return prev;
        const maxVersion = Math.max(...versions.map((v) => v.version));
        return prev.map((v) => (v.deliverableId === activeDeliverableId && v.version === maxVersion ? { ...v, status: 'changes_requested', clientFeedback: feedbackText } : v));
      });
      setChangesOpen(false);
      setChangeFeedback('');
      setActiveDeliverableId(null);
    } catch (e: any) {
      console.error(e);
      setChangeRequestError(e?.message || 'Network error submitting request.');
    } finally {
      setRequestingChanges(false);
    }
  }

  async function handleCompletePayment(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    setPaying(true);
    setPaymentError('');

    try {
      const savedToken = localStorage.getItem(`delt_client_session_${urlToken}`);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (savedToken) {
        headers['x-client-session-token'] = savedToken;
      }

      const activeInvoice = invoices.find(i => i.status !== 'draft');
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({ dealId: currentDeal.id, token: currentDeal.token, metadata: { invoice_id: activeInvoice?.id } }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        setPaymentError(errData.error || 'Failed to create payment order. Please try again.');
        setPaying(false);
        return;
      }

      const orderData = await orderRes.json();

      if (orderData.demo) {
        // Direct verification for offline/demo mode
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: `pay_${Date.now()}`,
            signature: 'verified_sig',
            dealId: currentDeal.id,
            invoiceId: activeInvoice?.id,
            demo: true,
          }),
        });

        if (verifyRes.ok) {
          simulatePaymentInStore(currentDeal.id, 'Razorpay Verified');
          setCurrentDeal((prev) => ({
            ...prev,
            paymentStatus: 'paid',
            status: 'completed',
          }));
          setDeliverables((prev) => prev.map((d) => ({ ...d, status: 'approved' })));
          setFileVersions((prev) => prev.map((v) => ({ ...v, status: 'approved', locked: false })));
          setPaymentOpen(false);
        } else {
          const errData = await verifyRes.json().catch(() => ({}));
          setPaymentError(errData.error || 'Payment verification failed. Please try again.');
        }
      } else {
        // Real Razorpay Checkout flow
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setPaymentError('Failed to load Razorpay SDK. Please check your internet connection and try again.');
          setPaying(false);
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'DELT',
          description: orderData.dealTitle || 'Project Payment',
          order_id: orderData.orderId,
          prefill: {
            name: orderData.clientName || '',
            email: orderData.clientEmail || '',
          },
          notes: {
            dealId: currentDeal.id,
          },
          theme: {
            color: '#0F172A',
          },
          callback_url: undefined, // Explicitly prevent redirect
          handler: async function (response: any) {
            try {
              setPaying(true);
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  dealId: currentDeal.id,
                  invoiceId: activeInvoice?.id,
                  demo: false,
                }),
              });

              if (verifyRes.ok) {
                simulatePaymentInStore(currentDeal.id, 'Razorpay Verified');
                setCurrentDeal((prev) => ({
                  ...prev,
                  paymentStatus: 'paid',
                  status: 'completed',
                }));
                setDeliverables((prev) => prev.map((d) => ({ ...d, status: 'approved' })));
                setFileVersions((prev) => prev.map((v) => ({ ...v, status: 'approved', locked: false })));
                setPaymentOpen(false);
              } else {
                const errData = await verifyRes.json().catch(() => ({}));
                setPaymentError(errData.error || 'Payment verification failed.');
              }
            } catch (vErr: any) {
              console.error('Verification error:', vErr);
              setPaymentError(vErr?.message || 'An error occurred during payment verification.');
            } finally {
              setPaying(false);
            }
          },
          modal: {
            escape: false,
            ondismiss: function () {
              setPaying(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          console.error('Payment failed details:', resp.error);
          setPaymentError(`Payment failed: ${resp.error?.description || 'Transaction declined.'}`);
          setPaying(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err?.message || 'Payment processing error. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  async function handleDownloadFile(filePath: string) {
    setDownloading(true);
    try {
      const savedToken = localStorage.getItem(`delt_client_session_${urlToken}`);
      const res = await fetch('/api/files/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
        body: JSON.stringify({
          dealId: currentDeal.id,
          token: currentDeal.token,
          filePath,
          isCreator: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to download file.');
        return;
      }

      const { signedUrl } = await res.json();
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadAllFiles() {
    const allFiles: { name: string; path: string }[] = [];
    fileVersions.forEach((v) => {
      v.files.forEach((f: any) => {
        const p = f.path || f.url || f.name;
        if (p) allFiles.push({ name: f.name, path: p });
      });
    });

    if (allFiles.length === 0) return;

    setDownloading(true);
    try {
      const savedToken = localStorage.getItem(`delt_client_session_${urlToken}`);
      for (const f of allFiles) {
        const res = await fetch('/api/files/signed-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
          },
          body: JSON.stringify({
            dealId: currentDeal.id,
            token: currentDeal.token,
            filePath: f.path,
            isCreator: false,
          }),
        });
        if (res.ok) {
          const { signedUrl } = await res.json();
          if (signedUrl) {
            const a = document.createElement('a');
            a.href = signedUrl;
            a.download = f.name;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (err) {
      console.error('Error downloading all files:', err);
    } finally {
      setDownloading(false);
    }
  }

  async function handleViewPreview(versionId: string, fileId: string, fileName: string, mimeType: string) {
    if (previewLoadingFileId) return;
    setPreviewLoadingFileId(fileId);
    try {
      const savedToken = localStorage.getItem(`delt_client_session_${urlToken}`);
      const res = await fetch('/api/files/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
        },
        body: JSON.stringify({
          dealId: currentDeal.id,
          token: currentDeal.token,
          fileVersionId: versionId,
          fileId: fileId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to fetch preview');
        return;
      }

      const { signedUrl } = await res.json();
      setPreviewUrl(signedUrl);
      setPreviewMimeType(mimeType);
      setPreviewFileName(fileName);
      setPreviewModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Error loading preview');
    } finally {
      setPreviewLoadingFileId(null);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Client header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Private Client Workspace</span>
          </div>
        </div>
      </header>



      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Deal header */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-display font-semibold tracking-tight">{currentDeal.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>From <span className="font-medium text-foreground">{creatorName}</span></span>
            <span>·</span>
            <span className="font-semibold text-foreground">{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
            <span>·</span>
            <DealStatusBadge status={currentDeal.status} />
            <span>·</span>
            <PaymentStatusBadge status={currentDeal.paymentStatus} />
          </div>

          {isClosed && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-700 dark:text-zinc-300">
              <Check className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>This Deal is closed. Project history and deliverables are preserved in read-only mode.</span>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
            <TabsList className="w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {hasAgreement && <TabsTrigger value="agreement">Agreement</TabsTrigger>}
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
          </div>

          {hasAgreement && (
            <TabsContent value="agreement" className="mt-4">
              <ClientContractPanel
                dealCode={currentDeal.dealCode || urlToken}
                dealTitle={currentDeal.title}
                creatorName={creatorName}
                clientName={clientName}
                clientEmail={clientEmail}
              />
            </TabsContent>
          )}

          {/* Overview */}
          <TabsContent value="overview" className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-4xl"
            >
              <ClientNeedsAttentionBanner
                deal={currentDeal}
                fileVersions={fileVersions}
                deliverables={effectiveDeliverables}
                invoices={invoices}
                onNavigateTab={setActiveTab}
              />

              {/* ① Project Details */}
              {effectiveDeliverables.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Project Details</CardTitle>
                    <CardDescription className="text-xs">Agreed project scope & deliverables</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="space-y-2">
                      {effectiveDeliverables.map((d, idx) => (
                        <li key={d.id || idx} className="flex items-start gap-2.5 text-xs text-foreground">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-medium">{d.name}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* ② Payment & Client */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Payment & Client</span>
                    {hasInvoice && activeInvoice && (
                      <span className="text-xs font-mono font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                        {activeInvoice.invoice_number}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                    <span className="text-muted-foreground">{isPaid ? 'Amount Paid' : 'Amount Due'}</span>
                    <span className="text-lg font-semibold tracking-tight text-foreground">
                      {hasInvoice && activeInvoice ? formatCurrency(activeInvoice.total_amount, activeInvoice.currency) : formatCurrency(currentDeal.price, currentDeal.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                    <span className="text-muted-foreground">Payment Status</span>
                    <PaymentStatusBadge status={currentDeal.paymentStatus} />
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                    <span className="text-muted-foreground">Creator</span>
                    <span className="font-medium text-foreground">{creatorName}</span>
                  </div>

                  {hasInvoice && activeInvoice && (
                    <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                      <span className="text-muted-foreground">Invoice</span>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs font-semibold text-primary"
                        onClick={() => setInvoiceModalOpen(true)}
                      >
                        {activeInvoice.invoice_number || 'View Invoice'} →
                      </Button>
                    </div>
                  )}

                  {/* Promo Code Section */}
                  {!isPaid && !isClosed && (
                    <div className="py-2 border-b border-primary/10 space-y-2">
                      <Label className="text-xs text-muted-foreground">Have a promo code?</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="Enter code (e.g. FREE)"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoApplied(false);
                            setPromoError('');
                          }}
                          disabled={promoApplied || applyingPromo}
                          className="h-9 flex-1 text-xs bg-background"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleApplyPromo}
                          disabled={!promoCode.trim() || promoApplied || applyingPromo}
                          className="h-9 text-xs"
                        >
                          {applyingPromo ? 'Applying...' : promoApplied ? 'Applied' : 'Apply Promo'}
                        </Button>
                      </div>
                      {promoError && (
                        <p className="text-xs text-destructive mt-1">{promoError}</p>
                      )}
                      {promoApplied && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" />
                          Promo code applied (100% discount).
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment Action Button */}
                  {!isPaid && !isClosed ? (
                    <div className="pt-2">
                      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full gap-2 text-xs h-10 font-semibold" disabled={paying}>
                            <CreditCard className="h-4 w-4" />
                            {paying ? 'Preparing secure payment gateway...' : promoApplied ? 'Complete Free Order' : `Pay ${hasInvoice && activeInvoice ? formatCurrency(activeInvoice.total_amount, currentDeal.currency) : formatCurrency(currentDeal.price, currentDeal.currency)} Securely`}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Complete Payment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-2 text-xs">
                            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 border border-border">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Deal Title:</span>
                                <span className="font-semibold text-foreground truncate max-w-[200px]">{currentDeal.title}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-border font-bold text-sm">
                                <span>Total Payable:</span>
                                <span>{promoApplied ? formatCurrency(0, currentDeal.currency) : (hasInvoice && activeInvoice ? formatCurrency(activeInvoice.total_amount, currentDeal.currency) : formatCurrency(currentDeal.price, currentDeal.currency))}</span>
                              </div>
                            </div>
                            {promoApplied ? (
                              <p className="text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                A 100% discount promo code has been applied. Confirming will unlock all deliverable files instantly.
                              </p>
                            ) : (
                              <p className="text-muted-foreground leading-relaxed">
                                Razorpay checkout supports Cards, UPI, Netbanking, and Wallets. Deliverables unlock automatically upon verified payment confirmation.
                              </p>
                            )}
                            {paymentError && (
                              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive text-left">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{paymentError}</span>
                              </div>
                            )}
                          </div>
                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" size="sm" onClick={() => setPaymentOpen(false)} disabled={paying}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={promoApplied ? handleRedeemPromo : handleCompletePayment} disabled={paying}>
                              {paying ? 'Processing...' : promoApplied ? 'Confirm Free Order' : `Confirm Pay ${hasInvoice && activeInvoice ? formatCurrency(activeInvoice.total_amount, currentDeal.currency) : formatCurrency(currentDeal.price, currentDeal.currency)}`}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : isPaid ? (
                    <div className="pt-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-emerald-900 dark:text-emerald-100">Payment Received & Verified</p>
                          <p className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-0.5">
                            All deliverable files are unlocked for high-resolution download.
                          </p>
                        </div>
                      </div>
                      {hasInvoice && activeInvoice && (
                        <Button
                          variant="outline"
                          className="w-full text-xs h-8 bg-background"
                          onClick={() => {
                            const code = activeInvoice.invoice_code || activeInvoice.invoice_number || 'UNKNOWN';
                            printWithFilename(`DELT-${code}-INVOICE`);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1.5" />
                          Download Invoice Receipt
                        </Button>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* ③ Other Information: Milestones when enabled */}
              {hasMilestones && (
                <ScopeMilestones 
                  deal={currentDeal} 
                  milestones={milestones} 
                  isCreator={false} 
                  showScope={false}
                  showMilestones={true}
                />
              )}
            </motion.div>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
                    {messages.map((msg, i) => {
                      const prevMsg = messages[i - 1];
                      const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system';
                      if (msg.type === 'proposal' && msg.proposalId) {
                        const proposal = proposals.find((p) => p.id === msg.proposalId);
                        if (proposal) {
                          return (
                            <ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'client'} showAvatar={showAvatar}>
                              <div className="max-w-sm">
                                <PriceProposalCard
                                  proposal={proposal}
                                  currency={currentDeal.currency}
                                  perspective="client"
                                  onAccept={() => handleAcceptProposal(proposal)}
                                  onCounter={() => { setActiveProposal(proposal); setProposalPrice(''); setProposalReason(''); setProposalOpen(true); }}
                                  onDecline={() => handleDeclineProposal(proposal)}
                                />
                              </div>
                            </ChatMessageItem>
                          );
                        }
                      }
                      return <ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'client'} showAvatar={showAvatar} />;
                    })}
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex items-end gap-2">
                      {!isClosed && (
                        <Dialog open={proposalOpen} onOpenChange={(open) => { setProposalOpen(open); if (!open) setActiveProposal(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                              Propose Price
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{activeProposal ? 'Respond to Proposal' : 'Propose Price Adjustment'}</DialogTitle>
                            </DialogHeader>
                            {activeProposal ? (
                              <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 rounded-lg bg-muted/50 p-3">
                                    <p className="text-xs text-muted-foreground">Previous</p>
                                    <p className="text-sm font-semibold line-through text-muted-foreground">
                                      {formatCurrency(activeProposal.previousPrice, currentDeal.currency)}
                                    </p>
                                  </div>
                                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1 rounded-lg bg-primary/5 p-3">
                                    <p className="text-xs text-muted-foreground">Proposed</p>
                                    <p className="text-sm font-bold text-primary">
                                      {formatCurrency(activeProposal.proposedPrice, currentDeal.currency)}
                                    </p>
                                  </div>
                                </div>
                                {activeProposal.reason && (
                                  <div className="rounded-lg bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground mb-0.5">Their reason</p>
                                    <p className="text-sm text-foreground">{activeProposal.reason}</p>
                                  </div>
                                )}
                                <form onSubmit={handleCounterProposal} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="counterPrice">Your counter price ({currentDeal.currency})</Label>
                                    <Input
                                      id="counterPrice"
                                      type="number"
                                      placeholder={String(activeProposal.proposedPrice)}
                                      value={proposalPrice}
                                      onChange={(e) => setProposalPrice(e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="counterReason">Reason (optional)</Label>
                                    <Textarea
                                      id="counterReason"
                                      placeholder="Explain your counter offer..."
                                      rows={3}
                                      value={proposalReason}
                                      onChange={(e) => setProposalReason(e.target.value)}
                                    />
                                  </div>
                                  <DialogFooter className="gap-2">
                                    <Button type="button" variant="ghost" onClick={() => handleDeclineProposal(activeProposal)} className="mr-auto text-muted-foreground">
                                      Decline
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => handleAcceptProposal(activeProposal)}>
                                      Accept
                                    </Button>
                                    <Button type="submit" disabled={!proposalPrice || submittingProposal}>
                                      {submittingProposal ? 'Sending...' : 'Send Counter'}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </div>
                            ) : (
                              <form onSubmit={handleProposePrice} className="space-y-4 pt-2">
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground">Current price</p>
                                  <p className="text-lg font-semibold">{formatCurrency(currentDeal.price, currentDeal.currency)}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="c-price">New proposed price ({currentDeal.currency})</Label>
                                  <Input
                                    id="c-price"
                                    type="number"
                                    placeholder={String(currentDeal.price)}
                                    value={proposalPrice}
                                    onChange={(e) => setProposalPrice(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="c-reason">Reason (optional)</Label>
                                  <Textarea
                                    id="c-reason"
                                    placeholder="Explain your proposal..."
                                    value={proposalReason}
                                    onChange={(e) => setProposalReason(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setProposalOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={!proposalPrice || submittingProposal}>
                                    {submittingProposal ? 'Sending...' : 'Submit Proposal'}
                                  </Button>
                                </DialogFooter>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                      )}

                      <Textarea
                        placeholder={isClosed ? "Deal is closed (read-only chat history)" : "Type a message to your creator..."}
                        value={input}
                        disabled={isClosed}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isClosed) { e.preventDefault(); sendMessage(); } }}
                        className="min-h-[40px] max-h-24 resize-none"
                        rows={1}
                      />
                      <Button size="icon" onClick={sendMessage} className="shrink-0" disabled={isClosed || !input.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="mt-4">
            <motion.div 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-col gap-1 pb-1">
                <h3 className="text-sm font-semibold text-foreground">Deliverables & Work Files</h3>
                <p className="text-xs text-muted-foreground">Actual files uploaded for your agreed project deliverables.</p>
              </div>

              {/* Download All Bar when files exist and deal is paid */}
              {isPaid && fileVersions.some((v) => v.files.length > 0) && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 mb-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Unlocked Deliverables</p>
                    <p className="text-[11px] text-muted-foreground">Download all approved project files in one click</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={handleDownloadAllFiles}
                    disabled={downloading}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloading ? 'Downloading...' : 'Download All Files'}
                  </Button>
                </div>
              )}

              {effectiveDeliverables.length === 0 && fileVersions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <EmptyState
                      icon={FileCheck}
                      title="No files yet"
                      description="Your creator will upload deliverable files here."
                    />
                  </CardContent>
                </Card>
              ) : (
                effectiveDeliverables.map((del, delIdx) => {
                  const versions = fileVersions.filter((v) => v.deliverableId === del.id || (delIdx === 0 && (!v.deliverableId || v.deliverableId.startsWith('del_scope_'))));
                  return (
                    <Card key={del.id} className="overflow-hidden">
                      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 bg-muted/20">
                        <CardTitle className="text-base font-semibold">{del.name}</CardTitle>
                        <DeliverableStatusBadge status={isPaid || currentDeal.status === 'completed' ? 'approved' : del.status} />
                      </CardHeader>
                      <CardContent className="space-y-3 pt-3">
                        {versions.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No files uploaded for this deliverable yet.</p>
                        ) : (
                          versions.map((v) => (
                            <div key={v.id} className="rounded-lg border border-border p-3 space-y-2 bg-card">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Version {v.version}</span>
                                <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              </div>
                              {v.description && <p className="text-sm text-muted-foreground">{v.description}</p>}
                              {v.status === 'changes_requested' && v.clientFeedback && (
                                <div className="rounded-md bg-amber-500/10 p-2.5 border border-amber-500/20">
                                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5">Revision Feedback</p>
                                  <p className="text-sm text-amber-800 dark:text-amber-200">{v.clientFeedback}</p>
                                </div>
                              )}
                              <div className="space-y-1.5">
                                {v.files.map((f) => {
                                  const effectivePreviewMode = (currentDeal as any).preview_mode || currentDeal.previewMode || (currentDeal.storageProvider === 'google_drive' ? 'EXTERNAL' : (currentDeal.previewEnabled ? 'AUTO' : 'NONE'));
                                  const isGoogleOriginal = currentDeal.storageProvider === 'google_drive' || (f as any).provider === 'google_drive';
                                  const isManualPreview = effectivePreviewMode === 'MANUAL';
                                  const isExternalPreview = effectivePreviewMode === 'EXTERNAL';

                                  return (
                                    <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
                                      <span className="font-medium truncate">{f.name}</span>
                                  {f.deletionStatus === 'deleted' ? (
                                        <span className="text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded text-[10px]">
                                          File deleted (retention expired)
                                        </span>
                                      ) : isPaid ? (
                                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleDownloadFile((f as any).path || (f as any).externalId || f.url || f.name)}>
                                          <Download className="h-3 w-3" />
                                          {isGoogleOriginal ? 'Open in Google Drive' : 'Download'}
                                        </Button>
                                      ) : !currentDeal.previewEnabled ? (
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground flex items-center gap-0.5">
                                            <Lock className="h-3 w-3" /> Locked
                                          </span>
                                        </div>
                                      ) : (effectivePreviewMode === 'OPEN_ORIGINAL' || effectivePreviewMode === 'EXTERNAL') ? (
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1 text-xs text-accent-brand border-accent-brand/30 hover:bg-accent-brand/10 h-7"
                                            onClick={() => handleViewPreview(v.id, f.id, f.name, f.previewType || 'file')}
                                            disabled={previewLoadingFileId === f.id}
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            {isGoogleOriginal ? 'Open in Google Drive' : 'Open Original File'}
                                          </Button>
                                          <span className="text-muted-foreground flex items-center gap-0.5">
                                            <Lock className="h-3 w-3" /> Locked
                                          </span>
                                        </div>
                                      ) : isManualPreview || effectivePreviewMode === 'AUTO' ? (
                                        f.previewStatus === 'ready' && f.previewPath ? (
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="gap-1 text-xs text-primary border-primary/25 hover:bg-primary/5 hover:text-primary h-7"
                                              onClick={() => handleViewPreview(v.id, f.id, f.name, f.previewType || 'image/jpeg')}
                                              disabled={previewLoadingFileId === f.id}
                                            >
                                              <Eye className="h-3 w-3" />
                                              {previewLoadingFileId === f.id ? 'Loading...' : 'Preview'}
                                            </Button>
                                            <span className="text-muted-foreground flex items-center gap-0.5">
                                              <Lock className="h-3 w-3" /> Locked
                                            </span>
                                          </div>
                                        ) : f.previewStatus === 'processing' ? (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground bg-muted/65 px-1.5 py-0.5 rounded animate-pulse">
                                              Preview processing
                                            </span>
                                            <span className="text-muted-foreground flex items-center gap-0.5">
                                              <Lock className="h-3 w-3" /> Locked
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground bg-muted/65 px-1.5 py-0.5 rounded">
                                              Preview unavailable
                                            </span>
                                            <span className="text-muted-foreground flex items-center gap-0.5">
                                              <Lock className="h-3 w-3" /> Locked
                                            </span>
                                          </div>
                                        )
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground flex items-center gap-0.5">
                                            <Lock className="h-3 w-3" /> Locked
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                        
                        {!isClosed && versions.length > 0 && (
                          (() => {
                            const latestVersion = versions.reduce((a, b) => (a.version > b.version ? a : b));
                            const previewEnabled = Boolean(currentDeal.previewEnabled ?? (currentDeal as any).preview_enabled);
                            const previewMode = (currentDeal as any).preview_mode || currentDeal.previewMode;
                            const hasUsablePreview = isUsablePreviewAvailable({
                              previewEnabled,
                              previewMode,
                              storageProvider: currentDeal.storageProvider,
                              files: latestVersion.files,
                            });
                            
                            if (!hasUsablePreview) {
                              return (
                                <div className="pt-2 border-t border-border mt-3 text-xs text-muted-foreground text-center italic">
                                  Preview unavailable. Approval and revision requests are disabled for this deliverable.
                                </div>
                              );
                            }

                            if (latestVersion.status === 'pending_review') {
                              return (
                                <motion.div 
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 mt-3"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                    <div>
                                      <span className="text-xs font-semibold text-foreground">
                                        {latestVersion.version > 1 ? `New version ready for review (V${latestVersion.version})` : 'Ready for your review'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="gap-1.5 text-xs h-8"
                                      onClick={() => { setActiveDeliverableId(del.id); setChangeFeedback(''); setChangeRequestError(''); setChangesOpen(true); }}
                                    >
                                      <Flag className="h-3.5 w-3.5 text-amber-500" />
                                      Request Changes
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium" 
                                      onClick={() => handleOpenApproveModal(del)}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      Approve Deliverable
                                    </Button>
                                  </div>
                                </motion.div>
                              );
                            }
                            
                            if (latestVersion.status === 'changes_requested') {
                              return (
                                <div className="pt-3 mt-3 border-t border-border space-y-2">
                                  {latestVersion.clientFeedback && (
                                    <div className="rounded-md bg-amber-500/10 p-2.5 border border-amber-500/20 text-xs">
                                      <span className="font-semibold text-amber-600 dark:text-amber-400">Submitted Feedback: </span>
                                      <span className="text-amber-800 dark:text-amber-200">{latestVersion.clientFeedback}</span>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground italic text-center">
                                    Changes requested — Waiting for creator to upload a new version...
                                  </p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="pt-2 border-t border-border mt-3 flex items-center justify-end">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> Approved (V{latestVersion.version})
                                </span>
                              </div>
                            );
                          })()
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </motion.div>
            
            {/* Confirmation Dialog for Approval */}
            <Dialog open={approveModalOpen} onOpenChange={(open) => { setApproveModalOpen(open); if (!open) { setActiveApproveDeliverable(null); setApproveError(''); } }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">Approve Deliverable?</DialogTitle>
                </DialogHeader>
                {activeApproveDeliverable && (
                  <div className="space-y-3 py-2 text-xs">
                    <p className="text-muted-foreground">
                      You are approving <span className="font-semibold text-foreground">{activeApproveDeliverable.name}</span>.
                    </p>
                    <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                      <p className="font-medium">Confirming acceptance</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        This confirms that you accept the work submitted for this deliverable.
                      </p>
                    </div>
                    {approveError && (
                      <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive font-medium">
                        {approveError}
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" size="sm" onClick={() => { setApproveModalOpen(false); setActiveApproveDeliverable(null); setApproveError(''); }} disabled={approving}>
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={confirmApproveDeliverable} disabled={approving}>
                    {approving ? 'Approving...' : 'Confirm Approval'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog for Request Changes */}
            <Dialog open={changesOpen} onOpenChange={(open) => { setChangesOpen(open); if (!open) { setActiveDeliverableId(null); setChangeRequestError(''); } }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">Request Deliverable Changes</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRequestChanges} className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">What would you like changed?</Label>
                    <Textarea
                      placeholder="Be specific about the adjustments needed (e.g. mobile spacing, CTA color)..."
                      rows={4}
                      value={changeFeedback}
                      onChange={(e) => { setChangeFeedback(e.target.value); setChangeRequestError(''); }}
                      className="text-xs resize-none"
                      required
                    />
                    {changeRequestError && (
                      <p className="text-xs text-destructive font-medium">{changeRequestError}</p>
                    )}
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setChangesOpen(false); setActiveDeliverableId(null); setChangeRequestError(''); }} disabled={requestingChanges}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={!changeFeedback.trim() || requestingChanges}>
                      {requestingChanges ? 'Sending Request...' : 'Send Request'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>

      {/* Secure File Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base truncate">Preview — {previewFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-muted/20 min-h-[40vh] max-h-[60vh] rounded-md relative">
            {previewUrl.includes('drive.google.com') ? (
              <iframe
                src={previewUrl.replace(/\/view(\?.*)?$/, '/preview')}
                title={previewFileName}
                className="w-full h-[55vh] border-0 rounded shadow-sm"
                allow="autoplay; encrypted-media"
              />
            ) : previewMimeType.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={previewFileName}
                className="max-w-full max-h-[55vh] object-contain rounded shadow-sm select-none pointer-events-none"
              />
            ) : previewMimeType === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                title={previewFileName}
                className="w-full h-[55vh] border-0 rounded shadow-sm"
              />
            ) : previewMimeType.startsWith('video/') ? (
              <video
                src={previewUrl}
                controls
                controlsList="nodownload"
                className="max-w-full max-h-[55vh] object-contain rounded shadow-sm"
              />
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                title={previewFileName}
                className="w-full h-[55vh] border-0 rounded shadow-sm"
              />
            ) : (
              <div className="text-center py-12 space-y-2">
                <p className="text-sm font-semibold text-foreground">Preview unavailable</p>
                <p className="text-xs text-muted-foreground">Original file will be available after payment.</p>
              </div>
            )}
          </div>
          <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium">
              <Lock className="h-3.5 w-3.5" />
              <span>Preview mode — Original file available after payment.</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPreviewModalOpen(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-background border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Receipt</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const activeInvoice = invoices.find(i => i.status !== 'draft');
                if (!activeInvoice) return;
                const code = activeInvoice.invoice_code || activeInvoice.invoice_number || 'UNKNOWN';
                printWithFilename(`DELT-${code}-INVOICE`);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Save PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInvoiceModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-6 pb-12">
            {invoices.length > 0 && (
              <InvoicePreview
                invoice={invoices.find(i => i.status !== 'draft')}
                deal={currentDeal}
                client={{ name: clientName, email: clientEmail }}
                creator={invoices.find(i => i.status !== 'draft')?.creator}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Printable Invoice - always in DOM, only visible when printing */}
      <div className="hidden print:block invoice-document">
        {invoices.length > 0 && (
          <InvoicePreview
            invoice={invoices.find(i => i.status !== 'draft')}
            deal={currentDeal}
            client={{ name: clientName, email: clientEmail }}
            creator={invoices.find(i => i.status !== 'draft')?.creator}
          />
        )}
      </div>
    </div>
  );
}
