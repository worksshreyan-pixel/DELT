import { createAdminClient } from '@/lib/supabase/admin';
import type { Currency } from '@/lib/types';

export type ContractStatus = 'draft' | 'sent' | 'viewed' | 'changes_requested' | 'accepted';

export interface ContractDeliverableSnapshot {
  name: string;
  description?: string;
}

export interface ContractMilestoneSnapshot {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface AcceptanceMetadata {
  acceptedByEmail: string;
  clientName: string;
  ipAddress?: string;
  userAgent?: string;
  dealId: string;
  contractId: string;
  versionId: string;
  versionNumber: number;
  acceptedAt: string;
}

export interface ContractData {
  id: string;
  dealId: string;
  currentVersionId?: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContractVersionData {
  id: string;
  contractId: string;
  dealId: string;
  versionNumber: number;
  title: string;
  termsContent: string;
  priceSnapshot: number;
  currencySnapshot: Currency;
  deliverablesSnapshot: ContractDeliverableSnapshot[];
  milestonesSnapshot?: ContractMilestoneSnapshot[];
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  changesRequestedAt?: string;
  acceptedAt?: string;
  clientFeedback?: string;
  acceptanceMetadata?: AcceptanceMetadata;
}

/**
 * Normalizes raw deal_contracts database row to canonical ContractData interface.
 */
export function serializeContract(raw: any): ContractData | null {
  if (!raw) return null;
  return {
    id: String(raw.id),
    dealId: String(raw.deal_id || raw.dealId),
    currentVersionId: raw.current_version_id || raw.currentVersionId ? String(raw.current_version_id || raw.currentVersionId) : undefined,
    status: (raw.status || 'draft') as ContractStatus,
    createdAt: String(raw.created_at || raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updated_at || raw.updatedAt || new Date().toISOString()),
  };
}

/**
 * Normalizes raw contract_versions database row to canonical ContractVersionData interface.
 * Strictly validates that priceSnapshot is a finite number and currencySnapshot is a supported Currency.
 */
export function serializeContractVersion(raw: any): ContractVersionData | null {
  if (!raw) return null;

  const rawPrice = raw.price_snapshot ?? raw.priceSnapshot ?? raw.price;
  const parsedPrice = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);

  if (rawPrice === undefined || rawPrice === null || !Number.isFinite(parsedPrice)) {
    throw new Error(
      `Invalid priceSnapshot in contract version (${raw.id || 'unknown'}): expected a finite number, received ${typeof rawPrice} (${rawPrice})`
    );
  }

  const rawCurrency = raw.currency_snapshot || raw.currencySnapshot || raw.currency || 'INR';
  const validCurrencies: Currency[] = ['INR', 'USD', 'EUR', 'GBP'];
  const currencySnapshot: Currency = validCurrencies.includes(rawCurrency as Currency)
    ? (rawCurrency as Currency)
    : 'INR';

  return {
    id: String(raw.id),
    contractId: String(raw.contract_id || raw.contractId),
    dealId: String(raw.deal_id || raw.dealId),
    versionNumber: Number(raw.version_number ?? raw.versionNumber ?? 1),
    title: String(raw.title || 'Service Agreement'),
    termsContent: String(raw.terms_content ?? raw.termsContent ?? ''),
    priceSnapshot: parsedPrice,
    currencySnapshot,
    deliverablesSnapshot: Array.isArray(raw.deliverables_snapshot)
      ? raw.deliverables_snapshot
      : Array.isArray(raw.deliverablesSnapshot)
      ? raw.deliverablesSnapshot
      : [],
    milestonesSnapshot: Array.isArray(raw.milestones_snapshot)
      ? raw.milestones_snapshot
      : Array.isArray(raw.milestonesSnapshot)
      ? raw.milestonesSnapshot
      : [],
    createdBy: String(raw.created_by || raw.createdBy || ''),
    createdAt: String(raw.created_at || raw.createdAt || new Date().toISOString()),
    sentAt: raw.sent_at || raw.sentAt ? String(raw.sent_at || raw.sentAt) : undefined,
    viewedAt: raw.viewed_at || raw.viewedAt ? String(raw.viewed_at || raw.viewedAt) : undefined,
    changesRequestedAt: raw.changes_requested_at || raw.changesRequestedAt ? String(raw.changes_requested_at || raw.changesRequestedAt) : undefined,
    acceptedAt: raw.accepted_at || raw.acceptedAt ? String(raw.accepted_at || raw.acceptedAt) : undefined,
    clientFeedback: raw.client_feedback || raw.clientFeedback ? String(raw.client_feedback || raw.clientFeedback) : undefined,
    acceptanceMetadata: raw.acceptance_metadata || raw.acceptanceMetadata ? (raw.acceptance_metadata || raw.acceptanceMetadata) : undefined,
  };
}

/**
 * Validates allowable contract status transitions.
 */
export function isValidContractStatusTransition(
  currentStatus: ContractStatus,
  targetStatus: ContractStatus
): boolean {
  if (currentStatus === targetStatus) return true;

  switch (currentStatus) {
    case 'draft':
      return targetStatus === 'sent';
    case 'sent':
      return targetStatus === 'viewed' || targetStatus === 'changes_requested' || targetStatus === 'accepted';
    case 'viewed':
      return targetStatus === 'changes_requested' || targetStatus === 'accepted';
    case 'changes_requested':
      return targetStatus === 'draft'; // via new draft version
    case 'accepted':
      return false; // Immutable state
    default:
      return false;
  }
}

/**
 * Generates standard baseline contract terms content.
 */
export function getDefaultContractTerms(dealTitle: string, clientName: string): string {
  return `1. SCOPE OF SERVICES & DELIVERABLES
The Creator agrees to deliver the project "${dealTitle}" for ${clientName} according to the agreed deliverables and milestone schedule outlined in this agreement.

2. COMMERCIAL TERMS & PAYMENT
The total agreed fee for the specified scope is specified in the commercial snapshot below. Payment shall be made according to the agreed billing milestones or upon final completion. All deliverable source files remain locked until payment is verified.

3. REVISIONS & APPROVALS
Upon submission of deliverables, ${clientName} will review the submitted files. Approvals or change requests must be submitted directly through the DELT workspace. 

4. INTELLECTUAL PROPERTY & TRANSFER
Upon full receipt of agreed payment, all copyright and rights to the final deliverables are transferred to ${clientName}. 

5. CONFIDENTIALITY & WORKSPACE SECURITY
Both parties agree that all project files, communications, and financial terms conducted within this private DELT workspace remain strictly confidential.`;
}

/**
 * Fetches contract and all versions for a given deal, returning normalized camelCase objects.
 */
export async function getDealContractWithVersions(dealId: string): Promise<{
  contract: ContractData;
  versions: ContractVersionData[];
  currentVersion: ContractVersionData | null;
} | null> {
  const admin = createAdminClient();

  const { data: rawContract, error: contractErr } = await admin
    .from('deal_contracts')
    .select('*')
    .eq('deal_id', dealId)
    .maybeSingle();

  if (contractErr) {
    console.error('Database error fetching deal contract:', contractErr);
  }
  if (contractErr || !rawContract) {
    return null;
  }

  const { data: rawVersions, error: versionErr } = await admin
    .from('contract_versions')
    .select('*')
    .eq('contract_id', rawContract.id)
    .order('version_number', { ascending: false });

  const contract = serializeContract(rawContract)!;

  if (versionErr) {
    return { contract, versions: [], currentVersion: null };
  }

  const versions = (rawVersions || [])
    .map((v: any) => serializeContractVersion(v))
    .filter((v): v is ContractVersionData => v !== null);

  const currentVersion =
    versions.find((v) => v.id === contract.currentVersionId) || versions[0] || null;

  return {
    contract,
    versions,
    currentVersion,
  };
}

/**
 * Captures current deal deliverables as an array of snapshot objects.
 */
export async function captureDeliverablesSnapshot(dealId: string, dealScope: string[]): Promise<ContractDeliverableSnapshot[]> {
  const admin = createAdminClient();
  const { data: deliverables } = await admin
    .from('deliverables')
    .select('name, description')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true });

  if (deliverables && deliverables.length > 0) {
    return deliverables.map((d: any) => ({
      name: d.name,
      description: d.description || undefined,
    }));
  }

  if (Array.isArray(dealScope) && dealScope.length > 0) {
    return dealScope.map((item) => ({ name: item }));
  }

  return [];
}

/**
 * Captures current deal milestones as an array of snapshot objects.
 */
export async function captureMilestonesSnapshot(dealId: string): Promise<ContractMilestoneSnapshot[]> {
  const admin = createAdminClient();
  const { data: milestones } = await admin
    .from('milestones')
    .select('title, description, due_date')
    .eq('deal_id', dealId)
    .order('order', { ascending: true });

  if (!milestones || milestones.length === 0) return [];

  return milestones.map((m: any) => ({
    title: m.title,
    description: m.description || undefined,
    dueDate: m.due_date || undefined,
  }));
}
