'use client';

import React, { useState, useEffect } from 'react';
import { ContractViewer, ContractData, ContractVersionData } from './contract-viewer';
import {
  FileText,
  Send,
  Save,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface CreatorContractPanelProps {
  dealCode: string;
  dealTitle: string;
  creatorName: string;
  clientName: string;
  clientEmail: string;
}

export function CreatorContractPanel({
  dealCode,
  dealTitle,
  creatorName,
  clientName,
  clientEmail,
}: CreatorContractPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [versions, setVersions] = useState<ContractVersionData[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ContractVersionData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editTerms, setEditTerms] = useState('');

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/deals/${dealCode}/contract`);
      const data = await res.json();

      if (data.success && data.contract) {
        setContract(data.contract);
        setVersions(data.versions || []);
        const active = data.currentVersion || data.versions?.[0] || null;
        setSelectedVersion(active);
        if (active) {
          setEditTitle(active.title);
          setEditTerms(active.termsContent);
        }
      } else {
        setContract(null);
        setVersions([]);
        setSelectedVersion(null);
      }
    } catch (err) {
      console.error('Error fetching contract:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [dealCode]);

  const handleInitialize = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/deals/${dealCode}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Draft agreement created.');
        setContract(data.contract);
        setVersions(data.versions || []);
        setSelectedVersion(data.currentVersion);
        setEditTitle(data.currentVersion.title);
        setEditTerms(data.currentVersion.termsContent);
      } else {
        toast.error(data.error || 'Failed to initialize draft agreement.');
      }
    } catch (err) {
      toast.error('Failed to initialize draft agreement.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/deals/${dealCode}/contract/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          termsContent: editTerms,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Draft terms saved.');
        setSelectedVersion(data.currentVersion);
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to save draft.');
      }
    } catch (err) {
      toast.error('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendContract = async () => {
    try {
      setSending(true);
      const res = await fetch(`/api/deals/${dealCode}/contract/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Agreement sent to client for review!');
        setContract(data.contract);
        setSelectedVersion(data.currentVersion);
        fetchContract();
      } else {
        toast.error(data.error || 'Failed to send agreement.');
      }
    } catch (err) {
      toast.error('Failed to send agreement.');
    } finally {
      setSending(false);
    }
  };

  const handleCreateNewVersion = async () => {
    try {
      setCreatingVersion(true);
      const res = await fetch(`/api/deals/${dealCode}/contract/new-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle || undefined,
          termsContent: editTerms || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Created new draft Agreement v${data.currentVersion.versionNumber}.`);
        setContract(data.contract);
        setSelectedVersion(data.currentVersion);
        setEditTitle(data.currentVersion.title);
        setEditTerms(data.currentVersion.termsContent);
        setIsEditing(true);
        fetchContract();
      } else {
        toast.error(data.error || 'Failed to create new version.');
      }
    } catch (err) {
      toast.error('Failed to create new version.');
    } finally {
      setCreatingVersion(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 bg-zinc-950 border border-zinc-800/80 rounded-2xl">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
        Loading agreement details...
      </div>
    );
  }

  if (!contract || !selectedVersion) {
    return (
      <div className="p-8 sm:p-12 text-center bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-bold text-zinc-100">No Agreement Created Yet</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Establish formal agreement terms, commercial snapshots, and deliverable commitments with {clientName}.
          </p>
        </div>
        <button
          onClick={handleInitialize}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
          Initialize Agreement Draft
        </button>
      </div>
    );
  }

  const isCurrentVersionSelected = selectedVersion.id === contract.currentVersionId;
  const isDraft = contract.status === 'draft' && isCurrentVersionSelected;
  const isChangesRequested = contract.status === 'changes_requested' && isCurrentVersionSelected;

  return (
    <div className="space-y-6">
      {/* Action Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
        {/* Version dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" /> Version:
          </span>
          <select
            value={selectedVersion.id}
            onChange={(e) => {
              const found = versions.find((v) => v.id === e.target.value);
              if (found) {
                setSelectedVersion(found);
                setEditTitle(found.title);
                setEditTerms(found.termsContent);
                setIsEditing(false);
              }
            }}
            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-blue-500"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} — {v.id === contract.currentVersionId ? 'Current Active' : 'Historical'}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isDraft && (
            <>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-zinc-700/50"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Terms
                </button>
              ) : (
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Draft
                </button>
              )}

              <button
                onClick={handleSendContract}
                disabled={sending}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send to Client
              </button>
            </>
          )}

          {isChangesRequested && (
            <button
              onClick={handleCreateNewVersion}
              disabled={creatingVersion}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {creatingVersion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />} Create New Draft Version
            </button>
          )}
        </div>
      </div>

      {/* Changes Requested Banner */}
      {isChangesRequested && selectedVersion.clientFeedback && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-semibold text-rose-300">{clientName} Requested Revisions</div>
            <div className="text-xs text-rose-200/90 whitespace-pre-wrap font-sans">"{selectedVersion.clientFeedback}"</div>
            <div className="text-xs text-rose-400/80 pt-1">
              Click "Create New Draft Version" above to edit the agreement and send updated v{selectedVersion.versionNumber + 1}.
            </div>
          </div>
        </div>
      )}

      {/* Inline Editor for Draft */}
      {isDraft && isEditing ? (
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4 font-sans">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-400" /> Edit Draft Agreement Terms
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Agreement Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Terms & Conditions Prose</label>
            <textarea
              rows={12}
              value={editTerms}
              onChange={(e) => setEditTerms(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs font-sans text-zinc-200 leading-relaxed focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Draft
            </button>
          </div>
        </div>
      ) : (
        /* Render Formal Document Viewer */
        <ContractViewer
          contract={contract}
          version={selectedVersion}
          dealTitle={dealTitle}
          creatorName={creatorName}
          clientName={clientName}
          clientEmail={clientEmail}
          dealCode={dealCode}
        />
      )}
    </div>
  );
}
