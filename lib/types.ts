// ============================================================================
// DELT — Domain Types
// Centralized type definitions for the entire application.
// Structured for clean Supabase integration later.
// ============================================================================

export type UUID = string;
export type ISODate = string;

// ---------------------------------------------------------------------------
// Users & Profiles
// ---------------------------------------------------------------------------

export type UserRole = 'creator' | 'client';

export interface Profile {
  id: UUID;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  profession?: string;
  company?: string;
  website?: string;
  location?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export type ClientStatus = 'active' | 'inactive';

export interface Client {
  id: UUID;
  creatorId: UUID;
  name: string;
  email: string;
  avatarUrl?: string;
  company?: string;
  dealCount: number;
  totalValue: number;
  currency: Currency;
  lastActivityAt: ISODate;
  status: ClientStatus;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export type DealStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'negotiating'
  | 'agreed'
  | 'in_progress'
  | 'payment_pending'
  | 'paid'
  | 'delivered'
  | 'completed'
  | 'closed'
  | 'cancelled';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface Deal {
  id: UUID;
  dealCode?: string; // e.g. DLT-A7F39C21
  token: string; // unguessable share token for client access
  creatorId: UUID;
  clientId: UUID;
  title: string;
  description: string;
  scope: string[];
  price: number;
  currency: Currency;
  status: DealStatus;
  deadline?: ISODate;
  progress: number; // 0-100
  paymentStatus: PaymentState;
  lastActivityAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
  previewEnabled: boolean;
}

export type DealParticipantRole = 'creator' | 'client';

export interface DealParticipant {
  id: UUID;
  dealId: UUID;
  profileId: UUID;
  role: DealParticipantRole;
  email: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: ISODate;
}

// ---------------------------------------------------------------------------
// Messages & Chat
// ---------------------------------------------------------------------------

export type MessageType =
  | 'text'
  | 'system'
  | 'file'
  | 'proposal'
  | 'payment'
  | 'approval'
  | 'change_request';

export interface DealMessage {
  id: UUID;
  dealId: UUID;
  senderId: UUID;
  senderName: string;
  senderRole: DealParticipantRole;
  senderAvatarUrl?: string;
  type: MessageType;
  content: string;
  attachments?: DealAttachment[];
  proposalId?: UUID;
  createdAt: ISODate;
}

export interface DealAttachment {
  id: UUID;
  name: string;
  size: number;
  type: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Negotiation — Price Proposals
// ---------------------------------------------------------------------------

export type ProposalState =
  | 'pending'
  | 'accepted'
  | 'countered'
  | 'declined'
  | 'cancelled'
  | 'expired';

export type ProposalDirection = 'creator_to_client' | 'client_to_creator';

export interface PriceProposal {
  id: UUID;
  dealId: UUID;
  direction: ProposalDirection;
  previousPrice: number;
  proposedPrice: number;
  reason?: string;
  state: ProposalState;
  counterProposalId?: UUID; // link to the counter offer if countered
  proposedBy: UUID;
  proposedByName: string;
  proposedByRole: DealParticipantRole;
  createdAt: ISODate;
  resolvedAt?: ISODate;
}

// ---------------------------------------------------------------------------
// Deliverables & Files
// ---------------------------------------------------------------------------

export type DeliverableStatus =
  | 'pending'
  | 'in_progress'
  | 'uploaded'
  | 'approved'
  | 'changes_requested';

export interface Deliverable {
  id: UUID;
  dealId: UUID;
  name: string;
  description?: string;
  status: DeliverableStatus;
  approvedAt?: ISODate;
  createdAt: ISODate;
}

export type FileVersionStatus = 'pending_review' | 'approved' | 'changes_requested';

export interface FileVersionItem {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  url?: string;
  previewPath?: string;
  previewType?: string;
  previewStatus?: 'ready' | 'failed' | 'processing';
  previewGeneratedAt?: string;
  previewStart?: number;
  previewDuration?: number;
  deletedAt?: string;
  deletionStatus?: 'active' | 'retention' | 'eligible' | 'deleted';
  retentionUntil?: string;
}

export interface FileVersion {
  id: UUID;
  deliverableId: UUID;
  dealId: UUID;
  version: number;
  description?: string;
  uploaderId: UUID;
  uploaderName: string;
  files: FileVersionItem[];
  status: FileVersionStatus;
  locked: boolean; // locked until payment
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'paid';

export interface Milestone {
  id: UUID;
  dealId: UUID;
  title: string;
  description?: string;
  amount: number;
  status: MilestoneStatus;
  order: number;
  completedAt?: ISODate;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export type PaymentState =
  | 'none'
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'disputed';

export interface Payment {
  id: UUID;
  dealId: UUID;
  clientId: UUID;
  clientName: string;
  dealTitle: string;
  amount: number;
  currency: Currency;
  platformFee: number;
  processingFee: number;
  creatorNet: number;
  state: PaymentState;
  method?: string;
  createdAt: ISODate;
  completedAt?: ISODate;
}

// ---------------------------------------------------------------------------
// Change Requests & Approvals
// ---------------------------------------------------------------------------

export type ChangeRequestStatus = 'open' | 'accepted' | 'declined' | 'price_proposed';
export type ChangeRequestResponse = 'accept' | 'decline' | 'propose_price';

export interface ChangeRequest {
  id: UUID;
  dealId: UUID;
  title: string;
  description: string;
  attachmentName?: string;
  requestedBy: UUID;
  requestedByName: string;
  requestedByRole: DealParticipantRole;
  status: ChangeRequestStatus;
  proposalId?: UUID;
  createdAt: ISODate;
}

export interface Approval {
  id: UUID;
  dealId: UUID;
  deliverableId: UUID;
  deliverableName: string;
  version: number;
  approvedBy: UUID;
  approvedByName: string;
  approvedByRole: DealParticipantRole;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Activity / Events
// ---------------------------------------------------------------------------

export type DealEventType =
  | 'deal_created'
  | 'deal_shared'
  | 'deal_viewed'
  | 'client_verified'
  | 'message_sent'
  | 'price_proposed'
  | 'counter_offered'
  | 'price_accepted'
  | 'price_declined'
  | 'file_uploaded'
  | 'file_version_created'
  | 'deliverable_approved'
  | 'change_requested'
  | 'change_responded'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'files_unlocked'
  | 'milestone_completed'
  | 'project_completed'
  | 'deal_closed';

export interface DealEvent {
  id: UUID;
  dealId: UUID;
  type: DealEventType;
  actorId?: UUID;
  actorName?: string;
  actorRole?: DealParticipantRole;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'new_message'
  | 'new_proposal'
  | 'counter_offer'
  | 'payment_received'
  | 'file_uploaded'
  | 'deliverable_approved'
  | 'change_request'
  | 'deal_completed';

export interface AppNotification {
  id: UUID;
  type: NotificationType;
  title: string;
  description: string;
  dealId?: UUID;
  dealTitle?: string;
  read: boolean;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface DealTemplate {
  id: UUID;
  creatorId: UUID;
  name: string;
  description: string;
  scope: string[];
  defaultPrice: number;
  currency: Currency;
  deliverables: string[];
  category: string;
  usageCount: number;
  createdAt: ISODate;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export interface StorageUsage {
  totalBytes: number;
  limitBytes: number;
  breakdown: {
    files: number;
    versions: number;
    attachments: number;
  };
}

// ---------------------------------------------------------------------------
// Plans, Entitlements & Credits
// ---------------------------------------------------------------------------

export type PlanId = 'free' | 'starter' | 'creator' | 'professional';

export interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  dealCredits: number;
  storageBytes: number;
  features: string[];
  highlighted?: boolean;
  price?: number; // optional display price, configured separately
  currency?: Currency;
}

export interface DealCredit {
  planId: PlanId;
  total: number;
  used: number;
  remaining: number;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export interface Transaction {
  id: UUID;
  paymentId: UUID;
  dealId: UUID;
  dealTitle: string;
  clientName: string;
  amount: number;
  currency: Currency;
  platformFee: number;
  processingFee: number;
  netAmount: number;
  state: PaymentState;
  date: ISODate;
}
