'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealStatusBadge, PaymentStatusBadge, DeliverableStatusBadge } from '@/components/deal-status-badge';
import { PriceProposalCard } from '@/components/price-proposal-card';
import { ChatMessageItem } from '@/components/chat-message';
import { FileCard } from '@/components/file-card';
import { Timeline } from '@/components/timeline-event';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { addMessageToStore, addProposalToStore, respondToProposalInStore, simulatePaymentInStore } from '@/lib/app-store';
import type { Deal, DealMessage, PriceProposal, DealEvent, Deliverable, FileVersion } from '@/lib/types';

function getInitials(name?: string) {
  if (!name) return 'CL';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ClientDealPage() {
  const params = useParams();
  const token = params.token as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealMeta, setDealMeta] = useState<{ title?: string; clientEmail?: string; creatorName?: string } | null>(null);
  const [dealNotFound, setDealNotFound] = useState(false);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
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
          if (json.error) {
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

    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your email address.');
      return;
    }

    // Client email match check against private workspace meta
    if (dealMeta?.clientEmail && targetEmail !== dealMeta.clientEmail.toLowerCase()) {
      setError('This email address is not authorized for this private Deal workspace.');
      return;
    }

    isSendingRef.current = true;
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
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
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

    const code = (codeToVerify || otp.join('')).trim();
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    const targetEmail = (email || dealMeta?.clientEmail || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Email address is required.');
      return;
    }

    isVerifyingRef.current = true;
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

  function handleOtpChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (value && idx === 5 && newOtp.every((d) => d !== '')) {
      setTimeout(() => handleVerifyOtp(newOtp.join('')), 50);
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!pasted) return;
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;
    const newOtp = [...otp];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    const focusIdx = Math.min(digits.length, 5);
    otpRefs.current[focusIdx]?.focus();
    if (digits.length === 6) {
      setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
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

                        <div className="flex justify-center gap-2">
                          {otp.map((digit, i) => (
                            <Input
                              key={i}
                              ref={(el) => { otpRefs.current[i] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              className="h-12 w-12 text-center text-lg font-semibold"
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              onPaste={handleOtpPaste}
                            />
                          ))}
                        </div>

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
      creatorName="Creator"
    />
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
}: {
  deal: Deal;
  clientEmail: string;
  clientName: string;
  creatorName: string;
}) {
  const [currentDeal, setCurrentDeal] = useState<Deal>(deal);
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [proposals, setProposals] = useState<PriceProposal[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [fileVersions, setFileVersions] = useState<FileVersion[]>([]);
  const [events, setEvents] = useState<DealEvent[]>([]);

  const [input, setInput] = useState('');
  const [proposalOpen, setProposalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [changeFeedback, setChangeFeedback] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalReason, setProposalReason] = useState('');
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeProposal, setActiveProposal] = useState<PriceProposal | null>(null);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMimeType, setPreviewMimeType] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewLoadingFileId, setPreviewLoadingFileId] = useState<string | null>(null);

  const isClosed = currentDeal.status === 'closed';
  const isPaid = currentDeal.paymentStatus === 'paid' || currentDeal.status === 'completed';

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
        { event: '*', schema: 'public', table: 'deliverables', filter: `deal_id=eq.${deal.id}` },
        (payload) => {
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
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: currentDeal.id,
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
      const res = await fetch('/api/negotiation/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/negotiation/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/negotiation/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/negotiation/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async function handleApproveDeliverables() {
    try {
      await fetch('/api/deliverables/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: currentDeal.id,
          action: 'approve',
          clientName,
        }),
      });
      setDeliverables((prev) => prev.map((d) => ({ ...d, status: 'approved' })));
      setFileVersions((prev) => prev.map((v) => ({ ...v, status: 'approved', locked: false })));
      alert('Deliverables approved! All project files are verified.');
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRequestChanges(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/deliverables/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: currentDeal.id,
          action: 'request_changes',
          feedback: changeFeedback,
          clientName,
        }),
      });
      setDeliverables((prev) => prev.map((d) => ({ ...d, status: 'changes_requested' })));
      setChangesOpen(false);
      setChangeFeedback('');
      alert('Change request submitted to creator.');
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCompletePayment() {
    setPaying(true);

    try {
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: currentDeal.id, token: currentDeal.token }),
      });

      const orderData = await orderRes.json();

      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: `pay_${Date.now()}`,
          signature: 'verified_sig',
          dealId: currentDeal.id,
          demo: true,
        }),
      });

      if (verifyRes.ok) {
        simulatePaymentInStore(currentDeal.id, 'Razorpay Verified');
        setCurrentDeal((prev) => ({
          ...prev,
          paymentStatus: 'paid',
          status: 'completed',
          progress: 100,
        }));
        setDeliverables((prev) => prev.map((d) => ({ ...d, status: 'approved' })));
        setFileVersions((prev) => prev.map((v) => ({ ...v, status: 'approved', locked: false })));
        setPaymentOpen(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      simulatePaymentInStore(currentDeal.id, 'Demo Card');
      setCurrentDeal((prev) => ({
        ...prev,
        paymentStatus: 'paid',
        status: 'completed',
        progress: 100,
      }));
      setDeliverables((prev) => prev.map((d) => ({ ...d, status: 'approved' })));
      setFileVersions((prev) => prev.map((v) => ({ ...v, status: 'approved', locked: false })));
      setPaymentOpen(false);
    } finally {
      setPaying(false);
    }
  }

  async function handleDownloadFile(filePath: string) {
    setDownloading(true);
    try {
      const savedToken = localStorage.getItem(`delt_session_${currentDeal.token}`);
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
      const savedToken = localStorage.getItem(`delt_session_${currentDeal.token}`);
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
      const savedToken = localStorage.getItem(`delt_session_${currentDeal.token}`);
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
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Private Client Workspace</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Deal header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold tracking-tight">{currentDeal.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
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

        <Tabs defaultValue="overview">
          <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
            <TabsList className="w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                      <p className="text-sm font-semibold">{formatCurrency(currentDeal.price, currentDeal.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                      <p className="text-sm font-semibold capitalize">{currentDeal.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
                      <p className="text-sm font-semibold">
                        {currentDeal.deadline ? new Date(currentDeal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                      <PaymentStatusBadge status={currentDeal.paymentStatus} />
                    </div>
                  </div>
                  {currentDeal.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm leading-relaxed">{currentDeal.description}</p>
                    </div>
                  )}
                  {currentDeal.scope && currentDeal.scope.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Scope</p>
                      <ul className="space-y-1.5">
                        {currentDeal.scope.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {deliverables.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Deliverables</p>
                      <div className="space-y-2">
                        {deliverables.map((d) => (
                          <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                              <p className="text-sm font-medium">{d.name}</p>
                              {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                            </div>
                            <DeliverableStatusBadge status={isPaid ? 'approved' : d.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Client Access</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">{getInitials(clientName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{clientEmail}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Access verified via Email OTP</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Encrypted communication</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
            <div className="space-y-4">
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

              {deliverables.length === 0 && fileVersions.length === 0 ? (
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
                deliverables.map((del) => {
                  const versions = fileVersions.filter((v) => v.deliverableId === del.id);
                  return (
                    <Card key={del.id}>
                      <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">{del.name}</CardTitle>
                        <DeliverableStatusBadge status={isPaid || currentDeal.status === 'completed' ? 'approved' : del.status} />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {versions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No files uploaded yet.</p>
                        ) : (
                          versions.map((v) => (
                            <div key={v.id} className="rounded-lg border border-border p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Version {v.version}</span>
                                <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              </div>
                              {v.description && <p className="text-sm text-muted-foreground mb-2">{v.description}</p>}
                              <div className="space-y-1.5">
                                {v.files.map((f) => (
                                  <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
                                    <span className="font-medium truncate">{f.name}</span>
                                    {f.deletionStatus === 'deleted' ? (
                                      <span className="text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded text-[10px]">
                                        File deleted (retention expired)
                                      </span>
                                    ) : isPaid ? (
                                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleDownloadFile((f as any).path || f.url || f.name)}>
                                        <Download className="h-3 w-3" />
                                        Download
                                      </Button>
                                    ) : currentDeal.previewEnabled ? (
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
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* Approval & Changes Bar */}
              {!isClosed && (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Flag className="h-3.5 w-3.5" />
                        Request Changes
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Deliverable Changes</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRequestChanges} className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>What needs to be revised?</Label>
                          <Textarea
                            placeholder="Describe the adjustments needed..."
                            rows={4}
                            value={changeFeedback}
                            onChange={(e) => setChangeFeedback(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setChangesOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Submit Request</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApproveDeliverables}>
                    <Check className="h-3.5 w-3.5" />
                    Approve Deliverables
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Payment */}
          <TabsContent value="payment" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Project Amount</span>
                    <span className="text-sm font-semibold">{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Amount Due</span>
                    <span className="text-lg font-display font-semibold">
                      {isPaid ? formatCurrency(0, currentDeal.currency) : formatCurrency(currentDeal.price, currentDeal.currency)}
                    </span>
                  </div>

                  {!isPaid && !isClosed ? (
                    <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full gap-2 mt-2">
                          <CreditCard className="h-4 w-4" />
                          Pay with Razorpay ({formatCurrency(currentDeal.price, currentDeal.currency)})
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Complete Deal Payment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Deal:</span>
                              <span className="font-medium">{currentDeal.title}</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                              <span>Total Amount:</span>
                              <span>{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Razorpay checkout handles Credit/Debit Cards, UPI, Netbanking, and Wallets. Files unlock instantly upon payment confirmation.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCompletePayment} disabled={paying}>
                            {paying ? 'Processing Payment...' : `Confirm Pay ${formatCurrency(currentDeal.price, currentDeal.currency)}`}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : isPaid ? (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3 mt-2">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                        Payment confirmed. All deliverable files are unlocked for download.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <span>This deal is closed without payment.</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <PaymentStatusBadge status={currentDeal.paymentStatus} />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isPaid
                      ? 'Payment complete. You can download all deliverables under the Files tab.'
                      : isClosed
                      ? 'Deal is closed.'
                      : 'Files will be unlocked automatically once payment is confirmed.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Deal Activity Timeline</CardTitle></CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <EmptyState icon={Clock} title="No activity recorded" description="Events will appear here as work progresses." />
                ) : (
                  <Timeline events={events} />
                )}
              </CardContent>
            </Card>
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
            {previewMimeType.startsWith('image/') ? (
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
    </div>
  );
}
