'use client';

import React, { useState, useEffect } from 'react';
import { ContractViewer, ContractData, ContractVersionData } from './contract-viewer';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Send,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface ClientContractPanelProps {
  dealCode: string;
  dealTitle: string;
  creatorName: string;
  clientName: string;
  clientEmail: string;
}

export function ClientContractPanel({
  dealCode,
  dealTitle,
  creatorName,
  clientName,
  clientEmail,
}: ClientContractPanelProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [versions, setVersions] = useState<ContractVersionData[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ContractVersionData | null>(null);

  // Modals
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/deals/${dealCode}/contract`);
      const data = await res.json();

      if (data.success && data.contract) {
        setContract(data.contract);
        setVersions(data.versions || []);
        setSelectedVersion(data.currentVersion || data.versions?.[0] || null);
      } else {
        setContract(null);
        setVersions([]);
        setSelectedVersion(null);
      }
    } catch (err) {
      console.error('Error fetching client contract:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [dealCode]);

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter revision feedback.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/deals/${dealCode}/contract/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: feedback.trim(),
          versionId: selectedVersion?.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Revision request submitted to creator.');
        setShowRequestChangesModal(false);
        setFeedback('');
        fetchContract();
      } else {
        toast.error(data.error || 'Failed to submit change request.');
      }
    } catch (err) {
      toast.error('Failed to submit change request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAgreement = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/deals/${dealCode}/contract/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: selectedVersion?.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Agreement formally accepted!');
        setShowAcceptModal(false);
        fetchContract();
      } else {
        toast.error(data.error || 'Failed to accept agreement.');
      }
    } catch (err) {
      toast.error('Failed to accept agreement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 bg-zinc-950 border border-zinc-800/80 rounded-2xl">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
        Loading agreement...
      </div>
    );
  }

  if (!contract || !selectedVersion) {
    return (
      <div className="p-8 text-center bg-zinc-950 border border-zinc-800/80 rounded-2xl">
        <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-zinc-200">No Agreement Sent Yet</h3>
        <p className="text-xs text-zinc-400 mt-1">
          {creatorName} has not sent a formal agreement for review yet.
        </p>
      </div>
    );
  }

  const canAction = (contract.status === 'sent' || contract.status === 'viewed') && selectedVersion.id === contract.currentVersionId;
  const isAccepted = contract.status === 'accepted' || Boolean(selectedVersion.acceptedAt);

  return (
    <div className="space-y-6">
      {/* Client Action Header Bar */}
      {canAction && (
        <div className="p-5 bg-blue-950/40 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-blue-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" /> Action Required: Review & Accept Agreement
            </div>
            <div className="text-xs text-blue-300/80">
              Please review the commercial terms, scope snapshot, and agreement prose below.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRequestChangesModal(true)}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-xs font-medium transition-all"
            >
              Request Changes
            </button>

            <button
              onClick={() => setShowAcceptModal(true)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Accept Agreement
            </button>
          </div>
        </div>
      )}

      {/* Render Agreement Document */}
      <ContractViewer
        contract={contract}
        version={selectedVersion}
        dealTitle={dealTitle}
        creatorName={creatorName}
        clientName={clientName}
        clientEmail={clientEmail}
        dealCode={dealCode}
      />

      {/* Modal: Request Changes */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-zinc-100 relative">
            <button
              onClick={() => setShowRequestChangesModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" /> Request Agreement Revisions
            </h3>
            <p className="text-xs text-zinc-400">
              Describe the specific changes you would like {creatorName} to make before accepting.
            </p>

            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Please clarify milestone delivery dates or update invoice terms..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRequestChangesModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Accept Confirmation */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-zinc-100 relative">
            <button
              onClick={() => setShowAcceptModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Accept Formal Agreement</h3>
                <p className="text-xs text-zinc-400">Version {selectedVersion.versionNumber}</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-400">Accepting Party:</span>
                <span className="font-semibold text-zinc-100">{clientName} ({clientEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Service Provider:</span>
                <span className="font-semibold text-zinc-100">{creatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Agreed Price:</span>
                <span className="font-semibold text-blue-400">{selectedVersion.currencySnapshot} {selectedVersion.priceSnapshot}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              By clicking <strong className="text-emerald-400 font-semibold">Confirm & Lock Agreement</strong>, you formally accept the agreement terms and deliverables snapshot above. An immutable timestamped acceptance record will be generated.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAcceptModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium"
              >
                Back
              </button>
              <button
                onClick={handleAcceptAgreement}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Confirm & Lock Agreement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
