import type {
  Deal,
  DealEvent,
  DealMessage,
  DealTemplate,
  Payment,
  PriceProposal,
  FileVersion,
  Deliverable,
  Milestone,
  Client,
  AppNotification,
  StorageUsage,
  DealCredit,
  Transaction,
  ChangeRequest,
  Approval,
  Profile,
} from './types';
import { PLANS } from './plans';

// ============================================================================
// DEMO DATA — Realistic fictional data for the entire application.
// Structured so it can be swapped for Supabase queries without touching UI.
// ============================================================================

export const CURRENT_USER: Profile = {
  id: 'u-alex-001',
  email: 'alex@delt.app',
  displayName: 'Alex Morgan',
  avatarUrl: '',
  bio: 'Independent web designer & developer. I build clean, fast websites for clinics, studios and small businesses.',
  profession: 'Web Designer & Developer',
  company: 'Alex Morgan Studio',
  website: 'alexmorgan.studio',
  location: 'Bengaluru, India',
  createdAt: '2024-08-12T09:00:00Z',
  updatedAt: '2025-01-15T14:30:00Z',
};

export const DEMO_CLIENTS: Client[] = [
  {
    id: 'c-sarah-001',
    creatorId: 'u-alex-001',
    name: 'Sarah Mitchell',
    email: 'sarah@brightsmiledental.com',
    company: 'BrightSmile Dental',
    dealCount: 3,
    totalValue: 145000,
    currency: 'INR',
    lastActivityAt: '2025-08-07T10:30:00Z',
    status: 'active',
    createdAt: '2024-09-03T11:00:00Z',
  },
  {
    id: 'c-daniel-001',
    creatorId: 'u-alex-001',
    name: 'Daniel Carter',
    email: 'daniel@novastudio.co',
    company: 'Nova Studio',
    dealCount: 2,
    totalValue: 88000,
    currency: 'INR',
    lastActivityAt: '2025-08-05T16:45:00Z',
    status: 'active',
    createdAt: '2024-10-20T13:00:00Z',
  },
  {
    id: 'c-nova-001',
    creatorId: 'u-alex-001',
    name: 'Priya Sharma',
    email: 'priya@novastudio.co',
    company: 'Nova Studio',
    dealCount: 1,
    totalValue: 35000,
    currency: 'INR',
    lastActivityAt: '2025-07-28T09:15:00Z',
    status: 'active',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'c-marcus-001',
    creatorId: 'u-alex-001',
    name: 'Marcus Lee',
    email: 'marcus@fitfuel.in',
    company: 'FitFuel',
    dealCount: 1,
    totalValue: 42000,
    currency: 'INR',
    lastActivityAt: '2025-06-22T12:00:00Z',
    status: 'inactive',
    createdAt: '2025-02-14T10:00:00Z',
  },
];

export const DEMO_DEALS: Deal[] = [
  {
    id: 'd-clinic-001',
    token: 'dl_a8f3k2m9x7q4',
    creatorId: 'u-alex-001',
    clientId: 'c-sarah-001',
    title: 'Clinic Website Redesign',
    description:
      'Complete redesign of the BrightSmile Dental website with a modern, calming aesthetic. Includes appointment booking, service pages, and mobile-first responsive design.',
    scope: [
      'Homepage with hero and services overview',
      'Appointment booking flow',
      'Service pages (5)',
      'About and contact pages',
      'Mobile responsive design',
      'Basic SEO setup',
    ],
    price: 65000,
    currency: 'INR',
    status: 'in_progress',
    deadline: '2025-09-15T23:59:00Z',
    progress: 65,
    paymentStatus: 'pending',
    lastActivityAt: '2025-08-08T14:20:00Z',
    createdAt: '2025-07-20T10:00:00Z',
    updatedAt: '2025-08-08T14:20:00Z',
  },
  {
    id: 'd-brand-001',
    token: 'dl_b7x2n4p8r1q6',
    creatorId: 'u-alex-001',
    clientId: 'c-daniel-001',
    title: 'Brand Identity Package',
    description:
      'Full brand identity for Nova Studio including logo, color system, typography, and brand guidelines document.',
    scope: [
      'Logo design (3 concepts + 2 revisions)',
      'Color palette and typography system',
      'Brand guidelines PDF',
      'Social media templates',
    ],
    price: 48000,
    currency: 'INR',
    status: 'paid',
    deadline: '2025-08-01T23:59:00Z',
    progress: 100,
    paymentStatus: 'paid',
    lastActivityAt: '2025-08-05T16:45:00Z',
    createdAt: '2025-06-15T09:00:00Z',
    updatedAt: '2025-08-05T16:45:00Z',
  },
  {
    id: 'd-landing-001',
    token: 'dl_c9m1k5j3f8r2',
    creatorId: 'u-alex-001',
    clientId: 'c-nova-001',
    title: 'Product Landing Page',
    description:
      'High-conversion landing page for Nova Studio product launch. Single page with animations, pricing section, and signup form.',
    scope: [
      'Hero section with animated headline',
      'Feature showcase section',
      'Pricing comparison table',
      'Email signup form',
      'Responsive design',
    ],
    price: 35000,
    currency: 'INR',
    status: 'negotiating',
    deadline: '2025-09-30T23:59:00Z',
    progress: 15,
    paymentStatus: 'none',
    lastActivityAt: '2025-08-07T11:30:00Z',
    createdAt: '2025-08-01T14:00:00Z',
    updatedAt: '2025-08-07T11:30:00Z',
  },
  {
    id: 'd-video-001',
    token: 'dl_d3r8t6y2u1i9',
    creatorId: 'u-alex-001',
    clientId: 'c-sarah-001',
    title: 'Promotional Video Campaign',
    description:
      '30-second promotional video for BrightSmile Dental social media campaign. Includes storyboard, filming, and post-production.',
    scope: [
      'Storyboard and creative direction',
      'Filming at clinic location',
      'Post-production and color grading',
      'Two format deliverables (16:9 and 9:16)',
    ],
    price: 55000,
    currency: 'INR',
    status: 'completed',
    deadline: '2025-06-30T23:59:00Z',
    progress: 100,
    paymentStatus: 'paid',
    lastActivityAt: '2025-07-02T15:00:00Z',
    createdAt: '2025-05-10T09:00:00Z',
    updatedAt: '2025-07-02T15:00:00Z',
  },
  {
    id: 'd-fitfuel-001',
    token: 'dl_e5w0q7a4s2d6',
    creatorId: 'u-alex-001',
    clientId: 'c-marcus-001',
    title: 'FitFuel Mobile App UI',
    description:
      'UI design for FitFuel mobile app — meal planning and tracking. 12 screens with design system.',
    scope: [
      'Design system setup',
      'Onboarding flow (3 screens)',
      'Dashboard and meal tracking',
      'Profile and settings',
      'Handoff to development',
    ],
    price: 42000,
    currency: 'INR',
    status: 'completed',
    deadline: '2025-06-15T23:59:00Z',
    progress: 100,
    paymentStatus: 'paid',
    lastActivityAt: '2025-06-22T12:00:00Z',
    createdAt: '2025-02-14T10:00:00Z',
    updatedAt: '2025-06-22T12:00:00Z',
  },
  {
    id: 'd-clinic-002',
    token: 'dl_f2g8h5j6k3l1',
    creatorId: 'u-alex-001',
    clientId: 'c-sarah-001',
    title: 'Clinic SEO Setup',
    description:
      'Technical SEO setup for BrightSmile Dental website including sitemap, meta tags, and Google Business Profile optimization.',
    scope: [
      'Technical SEO audit',
      'Meta tags and schema markup',
      'Google Business Profile setup',
      'Sitemap and robots.txt',
    ],
    price: 25000,
    currency: 'INR',
    status: 'draft',
    deadline: '2025-10-01T23:59:00Z',
    progress: 0,
    paymentStatus: 'none',
    lastActivityAt: '2025-08-06T09:00:00Z',
    createdAt: '2025-08-06T09:00:00Z',
    updatedAt: '2025-08-06T09:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Messages for the Clinic Website deal
// ---------------------------------------------------------------------------

export const DEMO_MESSAGES: DealMessage[] = [
  {
    id: 'm-001',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'system',
    content: 'Deal created and share link generated',
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'm-002',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'system',
    content: 'Client viewed the Deal workspace',
    createdAt: '2025-07-21T08:15:00Z',
  },
  {
    id: 'm-003',
    dealId: 'd-clinic-001',
    senderId: 'c-sarah-001',
    senderName: 'Sarah Mitchell',
    senderRole: 'client',
    type: 'text',
    content:
      'Hi Alex! I reviewed the proposal. The scope looks great. Can we also add dark mode for the appointment booking section?',
    createdAt: '2025-07-21T08:22:00Z',
  },
  {
    id: 'm-004',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'text',
    content:
      "Hi Sarah! Yes, I can include dark mode in the booking section. I'll add it to the scope and have the first version ready by next week.",
    createdAt: '2025-07-21T09:10:00Z',
  },
  {
    id: 'm-005',
    dealId: 'd-clinic-001',
    senderId: 'c-sarah-001',
    senderName: 'Sarah Mitchell',
    senderRole: 'client',
    type: 'proposal',
    content: 'Price proposal submitted',
    proposalId: 'p-001',
    createdAt: '2025-07-22T14:30:00Z',
  },
  {
    id: 'm-006',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'proposal',
    content: 'Counter offer submitted',
    proposalId: 'p-002',
    createdAt: '2025-07-22T16:00:00Z',
  },
  {
    id: 'm-007',
    dealId: 'd-clinic-001',
    senderId: 'c-sarah-001',
    senderName: 'Sarah Mitchell',
    senderRole: 'client',
    type: 'text',
    content: '₹62,000 works for me. Let us proceed with that.',
    createdAt: '2025-07-22T17:45:00Z',
  },
  {
    id: 'm-008',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'system',
    content: 'Price agreed at ₹62,000',
    createdAt: '2025-07-22T18:00:00Z',
  },
  {
    id: 'm-009',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'system',
    content: 'Version 1 uploaded — Homepage and services overview',
    createdAt: '2025-08-01T11:00:00Z',
  },
  {
    id: 'm-010',
    dealId: 'd-clinic-001',
    senderId: 'c-sarah-001',
    senderName: 'Sarah Mitchell',
    senderRole: 'client',
    type: 'text',
    content:
      'The homepage looks fantastic! The color palette is exactly what I imagined. Can we make the hero image slightly larger on mobile?',
    createdAt: '2025-08-02T09:30:00Z',
  },
  {
    id: 'm-011',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'text',
    content:
      "Absolutely. I'll adjust the hero image sizing for mobile and push version 2 with the booking flow by Friday.",
    createdAt: '2025-08-02T10:15:00Z',
  },
  {
    id: 'm-012',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'system',
    content: 'Version 2 uploaded — Appointment booking flow with dark mode',
    createdAt: '2025-08-05T15:00:00Z',
  },
  {
    id: 'm-013',
    dealId: 'd-clinic-001',
    senderId: 'c-sarah-001',
    senderName: 'Sarah Mitchell',
    senderRole: 'client',
    type: 'text',
    content: 'The booking flow looks great and dark mode is perfect. A few tweaks on the service pages — I will send notes.',
    createdAt: '2025-08-06T11:20:00Z',
  },
  {
    id: 'm-014',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'text',
    content: 'Sounds good, looking forward to the notes. I will start on the About and Contact pages meanwhile.',
    createdAt: '2025-08-06T12:00:00Z',
  },
  {
    id: 'm-015',
    dealId: 'd-clinic-001',
    senderId: 'u-alex-001',
    senderName: 'Alex Morgan',
    senderRole: 'creator',
    type: 'text',
    content: 'Quick update — About and Contact pages are done. I will upload version 3 with everything together once I have your notes.',
    createdAt: '2025-08-08T14:20:00Z',
  },
];

// ---------------------------------------------------------------------------
// Price Proposals
// ---------------------------------------------------------------------------

export const DEMO_PROPOSALS: PriceProposal[] = [
  {
    id: 'p-001',
    dealId: 'd-clinic-001',
    direction: 'client_to_creator',
    previousPrice: 65000,
    proposedPrice: 55000,
    reason: 'Budget is a bit tight. Would ₹55,000 work if we reduce to 4 service pages?',
    state: 'countered',
    proposedBy: 'c-sarah-001',
    proposedByName: 'Sarah Mitchell',
    proposedByRole: 'client',
    createdAt: '2025-07-22T14:30:00Z',
    resolvedAt: '2025-07-22T16:00:00Z',
  },
  {
    id: 'p-002',
    dealId: 'd-clinic-001',
    direction: 'creator_to_client',
    previousPrice: 55000,
    proposedPrice: 62000,
    reason: 'I can reduce to 5 service pages and include dark mode. ₹62,000 covers the full scope with the booking flow.',
    counterProposalId: 'p-001',
    state: 'accepted',
    proposedBy: 'u-alex-001',
    proposedByName: 'Alex Morgan',
    proposedByRole: 'creator',
    createdAt: '2025-07-22T16:00:00Z',
    resolvedAt: '2025-07-22T18:00:00Z',
  },
];

// Landing page deal — active negotiation
export const DEMO_PROPOSALS_LANDING: PriceProposal[] = [
  {
    id: 'p-003',
    dealId: 'd-landing-001',
    direction: 'client_to_creator',
    previousPrice: 35000,
    proposedPrice: 28000,
    reason: 'The page is fairly simple. Would ₹28,000 work?',
    state: 'pending',
    proposedBy: 'c-nova-001',
    proposedByName: 'Priya Sharma',
    proposedByRole: 'client',
    createdAt: '2025-08-07T11:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Deliverables & File Versions
// ---------------------------------------------------------------------------

export const DEMO_DELIVERABLES: Deliverable[] = [
  {
    id: 'del-001',
    dealId: 'd-clinic-001',
    name: 'Homepage & Services',
    description: 'Homepage with hero, services overview, and navigation',
    status: 'approved',
    approvedAt: '2025-08-02T09:30:00Z',
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'del-002',
    dealId: 'd-clinic-001',
    name: 'Appointment Booking Flow',
    description: 'Booking form, calendar selection, and confirmation with dark mode',
    status: 'uploaded',
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'del-003',
    dealId: 'd-clinic-001',
    name: 'Service Pages',
    description: '5 service detail pages with consistent layout',
    status: 'in_progress',
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'del-004',
    dealId: 'd-clinic-001',
    name: 'About & Contact Pages',
    description: 'About page with team section and contact page with form',
    status: 'in_progress',
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'del-005',
    dealId: 'd-clinic-001',
    name: 'SEO Setup',
    description: 'Meta tags, sitemap, and basic SEO configuration',
    status: 'pending',
    createdAt: '2025-07-20T10:00:00Z',
  },
];

export const DEMO_FILE_VERSIONS: FileVersion[] = [
  {
    id: 'fv-001',
    deliverableId: 'del-001',
    dealId: 'd-clinic-001',
    version: 1,
    description: 'Initial homepage design with hero and services overview',
    uploaderId: 'u-alex-001',
    uploaderName: 'Alex Morgan',
    files: [
      { id: 'f-001', name: 'homepage-v1.fig', size: 24_500_000, type: 'design' },
      { id: 'f-002', name: 'homepage-v1-preview.png', size: 3_200_000, type: 'image' },
    ],
    status: 'approved',
    locked: false,
    createdAt: '2025-08-01T11:00:00Z',
  },
  {
    id: 'fv-002',
    deliverableId: 'del-002',
    dealId: 'd-clinic-001',
    version: 2,
    description: 'Booking flow with dark mode and mobile adjustments',
    uploaderId: 'u-alex-001',
    uploaderName: 'Alex Morgan',
    files: [
      { id: 'f-003', name: 'booking-flow-v2.fig', size: 31_800_000, type: 'design' },
      { id: 'f-004', name: 'dark-mode-preview.png', size: 2_800_000, type: 'image' },
      { id: 'f-005', name: 'mobile-views.png', size: 1_900_000, type: 'image' },
    ],
    status: 'pending_review',
    locked: true,
    createdAt: '2025-08-05T15:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export const DEMO_MILESTONES: Milestone[] = [
  {
    id: 'ms-001',
    dealId: 'd-clinic-001',
    title: 'Design',
    description: 'Homepage and overall design system',
    amount: 20000,
    status: 'completed',
    order: 1,
    completedAt: '2025-08-02T09:30:00Z',
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'ms-002',
    dealId: 'd-clinic-001',
    title: 'Development',
    description: 'Booking flow, service pages, and responsive build',
    amount: 32000,
    status: 'in_progress',
    order: 2,
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'ms-003',
    dealId: 'd-clinic-001',
    title: 'Deployment',
    description: 'Final deployment, SEO setup, and handoff',
    amount: 10000,
    status: 'pending',
    order: 3,
    createdAt: '2025-07-20T10:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Payments & Transactions
// ---------------------------------------------------------------------------

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    dealId: 'd-brand-001',
    clientId: 'c-daniel-001',
    clientName: 'Daniel Carter',
    dealTitle: 'Brand Identity Package',
    amount: 48000,
    currency: 'INR',
    platformFee: 1200,
    processingFee: 960,
    creatorNet: 45840,
    state: 'paid',
    method: 'UPI',
    createdAt: '2025-08-04T10:00:00Z',
    completedAt: '2025-08-04T10:05:00Z',
  },
  {
    id: 'pay-002',
    dealId: 'd-video-001',
    clientId: 'c-sarah-001',
    clientName: 'Sarah Mitchell',
    dealTitle: 'Promotional Video Campaign',
    amount: 55000,
    currency: 'INR',
    platformFee: 1375,
    processingFee: 1100,
    creatorNet: 52525,
    state: 'paid',
    method: 'Bank Transfer',
    createdAt: '2025-07-01T14:00:00Z',
    completedAt: '2025-07-01T14:10:00Z',
  },
  {
    id: 'pay-003',
    dealId: 'd-fitfuel-001',
    clientId: 'c-marcus-001',
    clientName: 'Marcus Lee',
    dealTitle: 'FitFuel Mobile App UI',
    amount: 42000,
    currency: 'INR',
    platformFee: 1050,
    processingFee: 840,
    creatorNet: 40110,
    state: 'paid',
    method: 'UPI',
    createdAt: '2025-06-20T11:00:00Z',
    completedAt: '2025-06-20T11:03:00Z',
  },
];

export const DEMO_TRANSACTIONS: Transaction[] = DEMO_PAYMENTS.map((p) => ({
  id: `tx-${p.id}`,
  paymentId: p.id,
  dealId: p.dealId,
  dealTitle: p.dealTitle,
  clientName: p.clientName,
  amount: p.amount,
  currency: p.currency,
  platformFee: p.platformFee,
  processingFee: p.processingFee,
  netAmount: p.creatorNet,
  state: p.state,
  date: p.completedAt || p.createdAt,
}));

// ---------------------------------------------------------------------------
// Activity / Events
// ---------------------------------------------------------------------------

export const DEMO_EVENTS: DealEvent[] = [
  {
    id: 'ev-001',
    dealId: 'd-clinic-001',
    type: 'deal_created',
    actorId: 'u-alex-001',
    actorName: 'Alex Morgan',
    actorRole: 'creator',
    description: 'Deal created',
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'ev-002',
    dealId: 'd-clinic-001',
    type: 'deal_shared',
    actorId: 'u-alex-001',
    actorName: 'Alex Morgan',
    actorRole: 'creator',
    description: 'Private deal link shared with client',
    createdAt: '2025-07-20T10:05:00Z',
  },
  {
    id: 'ev-003',
    dealId: 'd-clinic-001',
    type: 'deal_viewed',
    actorId: 'c-sarah-001',
    actorName: 'Sarah Mitchell',
    actorRole: 'client',
    description: 'Client opened the deal workspace',
    createdAt: '2025-07-21T08:15:00Z',
  },
  {
    id: 'ev-004',
    dealId: 'd-clinic-001',
    type: 'client_verified',
    actorId: 'c-sarah-001',
    actorName: 'Sarah Mitchell',
    actorRole: 'client',
    description: 'Client verified email via OTP',
    createdAt: '2025-07-21T08:14:00Z',
  },
  {
    id: 'ev-005',
    dealId: 'd-clinic-001',
    type: 'price_proposed',
    actorId: 'c-sarah-001',
    actorName: 'Sarah Mitchell',
    actorRole: 'client',
    description: 'Sarah proposed ₹55,000 (was ₹65,000)',
    createdAt: '2025-07-22T14:30:00Z',
  },
  {
    id: 'ev-006',
    dealId: 'd-clinic-001',
    type: 'counter_offered',
    actorId: 'u-alex-001',
    actorName: 'Alex Morgan',
    actorRole: 'creator',
    description: 'Alex countered with ₹62,000',
    createdAt: '2025-07-22T16:00:00Z',
  },
  {
    id: 'ev-007',
    dealId: 'd-clinic-001',
    type: 'price_accepted',
    actorId: 'c-sarah-001',
    actorName: 'Sarah Mitchell',
    actorRole: 'client',
    description: 'Price agreed at ₹62,000',
    createdAt: '2025-07-22T18:00:00Z',
  },
  {
    id: 'ev-008',
    dealId: 'd-clinic-001',
    type: 'file_uploaded',
    actorId: 'u-alex-001',
    actorName: 'Alex Morgan',
    actorRole: 'creator',
    description: 'Version 1 uploaded — Homepage & Services',
    createdAt: '2025-08-01T11:00:00Z',
  },
  {
    id: 'ev-009',
    dealId: 'd-clinic-001',
    type: 'deliverable_approved',
    actorId: 'c-sarah-001',
    actorName: 'Sarah Mitchell',
    actorRole: 'client',
    description: 'Homepage & Services approved',
    createdAt: '2025-08-02T09:30:00Z',
  },
  {
    id: 'ev-010',
    dealId: 'd-clinic-001',
    type: 'file_version_created',
    actorId: 'u-alex-001',
    actorName: 'Alex Morgan',
    actorRole: 'creator',
    description: 'Version 2 uploaded — Booking flow with dark mode',
    createdAt: '2025-08-05T15:00:00Z',
  },
  {
    id: 'ev-011',
    dealId: 'd-clinic-001',
    type: 'message_sent',
    actorId: 'c-sarah-001',
    actorName: 'Sarah Mitchell',
    actorRole: 'client',
    description: 'Sarah sent a message',
    createdAt: '2025-08-06T11:20:00Z',
  },
  {
    id: 'ev-012',
    dealId: 'd-clinic-001',
    type: 'message_sent',
    actorId: 'u-alex-001',
    actorName: 'Alex Morgan',
    actorRole: 'creator',
    description: 'Alex sent a message',
    createdAt: '2025-08-08T14:20:00Z',
  },
];

// ---------------------------------------------------------------------------
// Change Requests
// ---------------------------------------------------------------------------

export const DEMO_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: 'cr-001',
    dealId: 'd-clinic-001',
    title: 'Add testimonial section to homepage',
    description:
      'Can we add a testimonials section below the services overview? We have 3 patient reviews we would like to feature.',
    requestedBy: 'c-sarah-001',
    requestedByName: 'Sarah Mitchell',
    requestedByRole: 'client',
    status: 'open',
    createdAt: '2025-08-06T11:25:00Z',
  },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-001',
    type: 'new_message',
    title: 'New message from Sarah Mitchell',
    description: 'The booking flow looks great and dark mode is perfect...',
    dealId: 'd-clinic-001',
    dealTitle: 'Clinic Website Redesign',
    read: false,
    createdAt: '2025-08-08T14:20:00Z',
  },
  {
    id: 'n-002',
    type: 'new_proposal',
    title: 'New price proposal',
    description: 'Priya Sharma proposed ₹28,000 for Product Landing Page',
    dealId: 'd-landing-001',
    dealTitle: 'Product Landing Page',
    read: false,
    createdAt: '2025-08-07T11:30:00Z',
  },
  {
    id: 'n-003',
    type: 'change_request',
    title: 'Change request from Sarah Mitchell',
    description: 'Add testimonial section to homepage',
    dealId: 'd-clinic-001',
    dealTitle: 'Clinic Website Redesign',
    read: false,
    createdAt: '2025-08-06T11:25:00Z',
  },
  {
    id: 'n-004',
    type: 'payment_received',
    title: 'Payment received',
    description: '₹48,000 received from Daniel Carter for Brand Identity Package',
    dealId: 'd-brand-001',
    dealTitle: 'Brand Identity Package',
    read: true,
    createdAt: '2025-08-04T10:05:00Z',
  },
  {
    id: 'n-005',
    type: 'deliverable_approved',
    title: 'Deliverable approved',
    description: 'Sarah Mitchell approved Homepage & Services',
    dealId: 'd-clinic-001',
    dealTitle: 'Clinic Website Redesign',
    read: true,
    createdAt: '2025-08-02T09:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Storage & Credits
// ---------------------------------------------------------------------------

export const DEMO_STORAGE: StorageUsage = {
  totalBytes: 7.4 * 1024 * 1024 * 1024,
  limitBytes: 20 * 1024 * 1024 * 1024,
  breakdown: {
    files: 5.2 * 1024 * 1024 * 1024,
    versions: 1.8 * 1024 * 1024 * 1024,
    attachments: 0.4 * 1024 * 1024 * 1024,
  },
};

export const DEMO_CREDITS: DealCredit = {
  planId: 'creator',
  total: PLANS.creator.dealCredits,
  used: 38,
  remaining: 12,
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const DEMO_TEMPLATES: DealTemplate[] = [
  {
    id: 'tpl-001',
    creatorId: 'u-alex-001',
    name: 'Website Development',
    description: 'Standard website development project with design and build phases',
    scope: [
      'Homepage design',
      'Inner pages (up to 5)',
      'Responsive build',
      'CMS setup',
      'Deployment',
    ],
    defaultPrice: 65000,
    currency: 'INR',
    deliverables: ['Design files', 'Source code', 'Documentation'],
    category: 'Web Development',
    usageCount: 8,
    createdAt: '2024-09-01T10:00:00Z',
  },
  {
    id: 'tpl-002',
    creatorId: 'u-alex-001',
    name: 'Logo Design',
    description: 'Logo design with concepts, revisions, and final files',
    scope: [
      '3 initial concepts',
      '2 rounds of revisions',
      'Final logo in multiple formats',
      'Brand color guide',
    ],
    defaultPrice: 15000,
    currency: 'INR',
    deliverables: ['Logo files (PNG, SVG, PDF)', 'Color guide'],
    category: 'Branding',
    usageCount: 12,
    createdAt: '2024-09-01T10:00:00Z',
  },
  {
    id: 'tpl-003',
    creatorId: 'u-alex-001',
    name: 'Landing Page',
    description: 'Single high-conversion landing page with animations',
    scope: [
      'Hero section',
      'Feature section',
      'Pricing section',
      'Signup form',
      'Responsive design',
    ],
    defaultPrice: 35000,
    currency: 'INR',
    deliverables: ['Design files', 'Source code'],
    category: 'Web Development',
    usageCount: 5,
    createdAt: '2024-10-15T10:00:00Z',
  },
  {
    id: 'tpl-004',
    creatorId: 'u-alex-001',
    name: 'Video Editing',
    description: 'Short-form video editing for social media',
    scope: [
      'Storyboard review',
      'Video editing and color grading',
      'Sound design',
      'Two format exports',
    ],
    defaultPrice: 25000,
    currency: 'INR',
    deliverables: ['Final video (16:9)', 'Final video (9:16)'],
    category: 'Video',
    usageCount: 3,
    createdAt: '2025-01-10T10:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getDealById(id: string): Deal | undefined {
  return DEMO_DEALS.find((d) => d.id === id);
}

export function getDealByToken(token: string): Deal | undefined {
  return DEMO_DEALS.find((d) => d.token === token);
}

export function getClientById(id: string): Client | undefined {
  return DEMO_CLIENTS.find((c) => c.id === id);
}

export function getMessagesByDeal(dealId: string): DealMessage[] {
  return DEMO_MESSAGES.filter((m) => m.dealId === dealId);
}

export function getProposalsByDeal(dealId: string): PriceProposal[] {
  return [...DEMO_PROPOSALS, ...DEMO_PROPOSALS_LANDING].filter(
    (p) => p.dealId === dealId
  );
}

export function getEventsByDeal(dealId: string): DealEvent[] {
  return DEMO_EVENTS.filter((e) => e.dealId === dealId);
}

export function getDeliverablesByDeal(dealId: string): Deliverable[] {
  return DEMO_DELIVERABLES.filter((d) => d.dealId === dealId);
}

export function getFileVersionsByDeal(dealId: string): FileVersion[] {
  return DEMO_FILE_VERSIONS.filter((f) => f.dealId === dealId);
}

export function getMilestonesByDeal(dealId: string): Milestone[] {
  return DEMO_MILESTONES.filter((m) => m.dealId === dealId).sort(
    (a, b) => a.order - b.order
  );
}

export function getChangeRequestsByDeal(dealId: string): ChangeRequest[] {
  return DEMO_CHANGE_REQUESTS.filter((cr) => cr.dealId === dealId);
}

export function getPaymentsByDeal(dealId: string): Payment[] {
  return DEMO_PAYMENTS.filter((p) => p.dealId === dealId);
}

export function getDealByIdOrToken(idOrToken: string): Deal | undefined {
  return (
    DEMO_DEALS.find((d) => d.id === idOrToken) ||
    DEMO_DEALS.find((d) => d.token === idOrToken)
  );
}
