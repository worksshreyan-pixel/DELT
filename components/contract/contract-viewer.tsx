'use client';

import React from 'react';
import { formatCardCurrency } from '@/lib/deal-card-data';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Building2,
  Calendar,
  PackageCheck,
  Layers,
  Lock,
} from 'lucide-react';

export interface ContractVersionData {
  id: string;
  versionNumber: number;
  title: string;
  termsContent: string;
  priceSnapshot: number;
  currencySnapshot: string;
  deliverablesSnapshot: Array<{ name: string; description?: string }>;
  milestonesSnapshot?: Array<{ title: string; description?: string; dueDate?: string }>;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  changesRequestedAt?: string;
  acceptedAt?: string;
  clientFeedback?: string;
  acceptanceMetadata?: {
    acceptedByEmail?: string;
    clientName?: string;
    ipAddress?: string;
    versionNumber?: number;
    acceptedAt?: string;
  };
}

export interface ContractData {
  id: string;
  dealId: string;
  currentVersionId?: string;
  status: 'draft' | 'sent' | 'viewed' | 'changes_requested' | 'accepted';
  createdAt: string;
  updatedAt: string;
}

interface ContractViewerProps {
  contract: ContractData;
  version: ContractVersionData;
  dealTitle: string;
  creatorName: string;
  clientName: string;
  clientEmail: string;
  dealCode: string;
}

export function ContractViewer({
  contract,
  version,
  dealTitle,
  creatorName,
  clientName,
  clientEmail,
  dealCode,
}: ContractViewerProps) {
  const isAccepted = contract.status === 'accepted' || Boolean(version.acceptedAt);
  const formattedPrice = formatCardCurrency(version.priceSnapshot, version.currencySnapshot as any);

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 font-sans">
      {/* Top Banner Status Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/60 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Version {version.versionNumber}
            </span>
            {isAccepted ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Agreement Accepted & Locked
              </span>
            ) : contract.status === 'sent' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pending Client Review
              </span>
            ) : contract.status === 'viewed' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Viewed by Client
              </span>
            ) : contract.status === 'changes_requested' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Revisions Requested
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-zinc-800 text-zinc-400 border border-zinc-700/50 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Draft
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">{version.title}</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Private Workspace Reference: <code className="font-mono text-zinc-300">{dealCode}</code>
          </p>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-800">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Agreed Commercial Value</div>
          <div className="text-2xl font-extrabold text-blue-400 tracking-tight mt-0.5">{formattedPrice}</div>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="p-6 sm:p-10 space-y-8">
        {/* Parties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-5 sm:p-6 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-400" /> Service Provider (Creator)
            </div>
            <div className="text-base font-semibold text-zinc-100">{creatorName}</div>
            <div className="text-xs text-zinc-400">Authorized Work Creator</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" /> Client
            </div>
            <div className="text-base font-semibold text-zinc-100">{clientName}</div>
            <div className="text-xs text-zinc-400">{clientEmail}</div>
          </div>
        </div>

        {/* Deliverables Snapshot */}
        {version.deliverablesSnapshot && version.deliverablesSnapshot.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              <PackageCheck className="w-4 h-4 text-blue-400" /> Agreed Deliverables Snapshot
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {version.deliverablesSnapshot.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl">
                  <div className="text-sm font-medium text-zinc-100 flex items-start gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 mt-0.5">
                      0{idx + 1}
                    </span>
                    {item.name}
                  </div>
                  {item.description && <div className="text-xs text-zinc-400 mt-1 pl-7">{item.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones Snapshot */}
        {version.milestonesSnapshot && version.milestonesSnapshot.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-blue-400" /> Schedule & Milestones
            </div>
            <div className="space-y-2">
              {version.milestonesSnapshot.map((m, idx) => (
                <div key={idx} className="p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{m.title}</div>
                    {m.description && <div className="text-xs text-zinc-400">{m.description}</div>}
                  </div>
                  {m.dueDate && (
                    <div className="text-xs text-zinc-400 flex items-center gap-1 font-sans">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(m.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Terms Prose */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Agreement Terms & Conditions
          </div>
          <div className="p-5 sm:p-6 bg-zinc-900/30 border border-zinc-800/70 rounded-xl text-sm leading-relaxed text-zinc-300 font-normal whitespace-pre-wrap font-sans">
            {version.termsContent}
          </div>
        </div>

        {/* Acceptance Audit Badge */}
        {isAccepted && (
          <div className="p-5 sm:p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Formal Acceptance Record
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked & Immutable
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-emerald-200/90 font-sans">
              <div>
                <span className="text-emerald-500/70 block uppercase text-[10px] font-semibold tracking-wider mb-0.5">Accepted By</span>
                <span className="font-medium text-emerald-100">{version.acceptanceMetadata?.acceptedByEmail || clientEmail}</span>
              </div>
              <div>
                <span className="text-emerald-500/70 block uppercase text-[10px] font-semibold tracking-wider mb-0.5">Accepted At</span>
                <span className="font-medium text-emerald-100">{new Date(version.acceptedAt || version.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-emerald-500/70 block uppercase text-[10px] font-semibold tracking-wider mb-0.5">Agreement Version</span>
                <span className="font-medium text-emerald-100">Version {version.versionNumber}</span>
              </div>
              <div>
                <span className="text-emerald-500/70 block uppercase text-[10px] font-semibold tracking-wider mb-0.5">Agreed Commercial Amount</span>
                <span className="font-medium text-emerald-100">{formattedPrice}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
