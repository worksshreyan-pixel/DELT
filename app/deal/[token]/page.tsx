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
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealStatusBadge, PaymentStatusBadge, DeliverableStatusBadge } from '@/components/deal-status-badge';
import { PriceProposalCard } from '@/components/price-proposal-card';
import { ChatMessageItem } from '@/components/chat-message';
import { FileCard } from '@/components/file-card';
import { Timeline } from '@/components/timeline-event';
import { formatCurrency } from '@/lib/plans';
import {
  getDealByToken,
  getClientById,
  getMessagesByDeal,
  getProposalsByDeal,
  getEventsByDeal,
  getDeliverablesByDeal,
  getFileVersionsByDeal,
  getPaymentsByDeal,
  CURRENT_USER,
} from '@/lib/demo-data';
import type { DealMessage, PriceProposal } from '@/lib/types';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ClientDealPage() {
  const params = useParams();
  const token = params.token as string;
  const deal = getDealByToken(token);

  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!deal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <Lock className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-display font-semibold tracking-tight mb-1">Deal not found</h2>
            <p className="text-sm text-muted-foreground">
              This deal link is invalid or may have expired. Please contact your creator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = getClientById(deal.clientId);

  function handleSendOtp() {
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
    }, 600);
  }

  function handleVerifyOtp() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
    }, 600);
  }

  function handleOtpChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  // Verification screen
  if (!verified) {
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
                    <motion.div key="email" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-lg font-display font-semibold tracking-tight mb-1">Access your deal</h1>
                        <p className="text-sm text-muted-foreground">
                          {deal.title} from {CURRENT_USER.displayName}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the email your creator used to invite you.
                          </p>
                        </div>
                        <Button onClick={handleSendOtp} className="w-full gap-2" disabled={!email || loading}>
                          {loading ? 'Sending...' : 'Send verification code'}
                          {!loading && <ArrowRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="otp" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-lg font-display font-semibold tracking-tight mb-1">Enter verification code</h1>
                        <p className="text-sm text-muted-foreground">
                          We sent a 6-digit code to {email}
                        </p>
                      </div>
                      <div className="space-y-4">
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
                            />
                          ))}
                        </div>
                        <Button onClick={handleVerifyOtp} className="w-full gap-2" disabled={otp.some((d) => !d) || loading}>
                          {loading ? 'Verifying...' : 'Verify and continue'}
                          {!loading && <ArrowRight className="h-4 w-4" />}
                        </Button>
                        <button
                          onClick={() => { setOtpSent(false); setOtp(['', '', '', '', '', '']); }}
                          className="w-full text-xs text-muted-foreground hover:text-foreground"
                        >
                          Use a different email
                        </button>
                      </div>
                      <p className="mt-4 text-center text-xs text-muted-foreground/60">
                        Demo mode — OTP verification is simulated. This will be connected to Supabase Auth OTP in production.
                      </p>
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

  // Verified — show client portal
  return <ClientPortal deal={deal} clientName={client?.name || 'Client'} creatorName={CURRENT_USER.displayName} />;
}

// ---------------------------------------------------------------------------
// Client Portal
// ---------------------------------------------------------------------------

function ClientPortal({
  deal,
  clientName,
  creatorName,
}: {
  deal: ReturnType<typeof getDealByToken>;
  clientName: string;
  creatorName: string;
}) {
  if (!deal) return null;

  const messages = getMessagesByDeal(deal.id);
  const proposals = getProposalsByDeal(deal.id);
  const events = getEventsByDeal(deal.id);
  const deliverables = getDeliverablesByDeal(deal.id);
  const fileVersions = getFileVersionsByDeal(deal.id);
  const payments = getPaymentsByDeal(deal.id);
  const isPaid = deal.paymentStatus === 'paid';

  const [localMessages, setLocalMessages] = useState<DealMessage[]>(messages);
  const [input, setInput] = useState('');
  const [proposalOpen, setProposalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [localMessages]);

  function sendMessage() {
    if (!input.trim()) return;
    setLocalMessages([
      ...localMessages,
      {
        id: `m-${Date.now()}`,
        dealId: deal.id,
        senderId: 'c-sarah-001',
        senderName: clientName,
        senderRole: 'client',
        type: 'text',
        content: input.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput('');
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Client header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Private deal workspace</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Deal header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold tracking-tight">{deal.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>by {creatorName}</span>
            <span>·</span>
            <span>{formatCurrency(deal.price, deal.currency)}</span>
            <span>·</span>
            <DealStatusBadge status={deal.status} />
          </div>
        </div>

        <Tabs defaultValue="overview">
          <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
            <TabsList className="w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
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
                      <p className="text-sm font-semibold">{formatCurrency(deal.price, deal.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Progress</p>
                      <p className="text-sm font-semibold">{deal.progress}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
                      <p className="text-sm font-semibold">{deal.deadline ? new Date(deal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                      <PaymentStatusBadge status={deal.paymentStatus} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm leading-relaxed">{deal.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Scope</p>
                    <ul className="space-y-1.5">
                      {deal.scope.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Deliverables</p>
                    <div className="space-y-2">
                      {deliverables.map((d) => (
                        <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <p className="text-sm font-medium">{d.name}</p>
                            {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                          </div>
                          <DeliverableStatusBadge status={d.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Your Creator</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">{getInitials(creatorName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{creatorName}</p>
                      <p className="text-xs text-muted-foreground">{CURRENT_USER.profession}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Private & secure workspace</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Your access is verified</span>
                    </div>
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
                    {localMessages.map((msg, i) => {
                      const prevMsg = localMessages[i - 1];
                      const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system';
                      if (msg.type === 'proposal' && msg.proposalId) {
                        const proposal = proposals.find((p) => p.id === msg.proposalId);
                        if (proposal) {
                          return (
                            <ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'client'} showAvatar={showAvatar}>
                              <div className="max-w-sm">
                                <PriceProposalCard proposal={proposal} currency={deal.currency} perspective="client" />
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
                      <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setProposalOpen(true)}>
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Propose Price
                      </Button>
                      <Textarea
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        className="min-h-[40px] max-h-24 resize-none"
                        rows={1}
                      />
                      <Button size="icon" onClick={sendMessage} className="shrink-0">
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
              {deliverables.map((del) => {
                const versions = fileVersions.filter((v) => v.deliverableId === del.id);
                if (versions.length === 0) return null;
                return (
                  <Card key={del.id}>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">{del.name}</CardTitle>
                      <DeliverableStatusBadge status={del.status} />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {versions.map((v) => (
                        <div key={v.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Version {v.version}</span>
                            <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          {v.description && <p className="text-sm text-muted-foreground mb-2">{v.description}</p>}
                          <div className="space-y-1.5">
                            {v.files.map((f) => (
                              <FileCard key={f.id} file={f} locked={v.locked && !isPaid} />
                            ))}
                          </div>
                          {!isPaid && v.locked && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              <span>Complete payment to unlock files</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
              {fileVersions.length === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center text-center">
                      <FileCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium">No files yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Files will appear here once the creator uploads them.</p>
                    </div>
                  </CardContent>
                </Card>
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
                    <span className="text-sm text-muted-foreground">Project amount</span>
                    <span className="text-sm font-semibold">{formatCurrency(deal.price, deal.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Amount due</span>
                    <span className="text-lg font-display font-semibold">{formatCurrency(deal.price, deal.currency)}</span>
                  </div>
                  {deal.paymentStatus !== 'paid' && deal.paymentStatus !== 'none' && (
                    <Button className="w-full gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </Button>
                  )}
                  {deal.paymentStatus === 'paid' && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-emerald-700 dark:text-emerald-300">Payment confirmed. Files have been unlocked.</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Payment processing requires integration with a payment provider. This is a demo interface.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <PaymentStatusBadge status={deal.paymentStatus} />
                  <p className="text-sm text-muted-foreground">
                    {deal.paymentStatus === 'paid'
                      ? 'Payment complete. All deliverables are unlocked.'
                      : 'Files will be unlocked automatically once payment is confirmed.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
