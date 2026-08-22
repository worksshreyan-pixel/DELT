'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Check, X, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProposalStatusBadge } from '@/components/deal-status-badge';
import { formatCurrency } from '@/lib/plans';
export function PriceProposalCard(_a) {
    var proposal = _a.proposal, _b = _a.currency, currency = _b === void 0 ? 'INR' : _b, perspective = _a.perspective, onAccept = _a.onAccept, onCounter = _a.onCounter, onDecline = _a.onDecline;
    var isIncoming = (perspective === 'creator' && proposal.direction === 'client_to_creator') ||
        (perspective === 'client' && proposal.direction === 'creator_to_client');
    var showActions = isIncoming && proposal.state === 'pending';
    return (<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5">
            <ArrowLeftRight className="h-4 w-4 text-primary"/>
          </div>
          <span className="text-sm font-semibold tracking-tight">Price Proposal</span>
        </div>
        <ProposalStatusBadge status={proposal.state}/>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Previous</p>
          <p className="text-sm font-semibold line-through text-muted-foreground">
            {formatCurrency(proposal.previousPrice, currency)}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0"/>
        <div className="flex-1 rounded-lg bg-primary/5 px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Proposed</p>
          <p className="text-base font-bold text-primary">
            {formatCurrency(proposal.proposedPrice, currency)}
          </p>
        </div>
      </div>

      {proposal.reason && (<div className="rounded-lg bg-muted/30 px-3 py-2 mb-3">
          <p className="text-xs text-muted-foreground mb-0.5">Reason</p>
          <p className="text-sm text-foreground">{proposal.reason}</p>
        </div>)}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {proposal.proposedByName} · {proposal.proposedByRole === 'creator' ? 'Creator' : 'Client'}
        </span>
        <span>{new Date(proposal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>

      {showActions && (<div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button size="sm" onClick={onAccept} className="gap-1.5">
            <Check className="h-3.5 w-3.5"/>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={onCounter} className="gap-1.5">
            <ArrowRight className="h-3.5 w-3.5"/>
            Counter Offer
          </Button>
          <Button size="sm" variant="ghost" onClick={onDecline} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5"/>
            Decline
          </Button>
        </div>)}
    </motion.div>);
}
