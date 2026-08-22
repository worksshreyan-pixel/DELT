"use strict";
// ==============================================================================
// DELT — Neon PostgreSQL Database Schema (Drizzle ORM)
// Independent, decoupled relational schema ready for Clerk auth and Cloudflare R2
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsRelations = exports.paymentsRelations = exports.priceProposalsRelations = exports.dealMessagesRelations = exports.fileVersionsRelations = exports.deliverablesRelations = exports.dealsRelations = exports.clientsRelations = exports.profilesRelations = exports.dealOtps = exports.notifications = exports.transactions = exports.payments = exports.dealEvents = exports.fileVersions = exports.deliverables = exports.priceProposals = exports.dealMessages = exports.dealParticipants = exports.deals = exports.clients = exports.dealCredits = exports.storageUsage = exports.profiles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// ------------------------------------------------------------------------------
// 1. Profiles (Creator accounts — compatible with Clerk user IDs and legacy UUIDs)
// ------------------------------------------------------------------------------
exports.profiles = (0, pg_core_1.pgTable)('profiles', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    bio: (0, pg_core_1.text)('bio'),
    profession: (0, pg_core_1.text)('profession'),
    company: (0, pg_core_1.text)('company'),
    website: (0, pg_core_1.text)('website'),
    location: (0, pg_core_1.text)('location'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// ------------------------------------------------------------------------------
// 2. Storage Usage & Deal Credits (Entitlements & Usage Quotas)
// ------------------------------------------------------------------------------
exports.storageUsage = (0, pg_core_1.pgTable)('storage_usage', {
    userId: (0, pg_core_1.text)('user_id')
        .primaryKey()
        .references(() => exports.profiles.id, { onDelete: 'cascade' }),
    totalBytes: (0, pg_core_1.bigint)('total_bytes', { mode: 'number' }).notNull().default(0),
    limitBytes: (0, pg_core_1.bigint)('limit_bytes', { mode: 'number' }).notNull().default(5368709120),
    filesBytes: (0, pg_core_1.bigint)('files_bytes', { mode: 'number' }).notNull().default(0),
    versionsBytes: (0, pg_core_1.bigint)('versions_bytes', { mode: 'number' }).notNull().default(0),
    attachmentsBytes: (0, pg_core_1.bigint)('attachments_bytes', { mode: 'number' }).notNull().default(0),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.dealCredits = (0, pg_core_1.pgTable)('deal_credits', {
    userId: (0, pg_core_1.text)('user_id')
        .primaryKey()
        .references(() => exports.profiles.id, { onDelete: 'cascade' }),
    planId: (0, pg_core_1.text)('plan_id').notNull().default('free'),
    total: (0, pg_core_1.integer)('total').notNull().default(50),
    used: (0, pg_core_1.integer)('used').notNull().default(0),
    remaining: (0, pg_core_1.integer)('remaining').notNull().default(50),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// ------------------------------------------------------------------------------
// 3. Clients (Creator's CRM Directory)
// ------------------------------------------------------------------------------
exports.clients = (0, pg_core_1.pgTable)('clients', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    creatorId: (0, pg_core_1.text)('creator_id')
        .notNull()
        .references(() => exports.profiles.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    company: (0, pg_core_1.text)('company'),
    dealCount: (0, pg_core_1.integer)('deal_count').notNull().default(0),
    totalValue: (0, pg_core_1.numeric)('total_value').notNull().default('0'),
    currency: (0, pg_core_1.text)('currency').notNull().default('INR'),
    status: (0, pg_core_1.text)('status').notNull().default('active'),
    lastActivityAt: (0, pg_core_1.timestamp)('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    creatorIdIdx: (0, pg_core_1.index)('idx_clients_creator_id').on(table.creatorId),
    emailIdx: (0, pg_core_1.index)('idx_clients_email').on(table.email),
}));
// ------------------------------------------------------------------------------
// 4. Deals (Core Transaction Agreement)
// ------------------------------------------------------------------------------
exports.deals = (0, pg_core_1.pgTable)('deals', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    creatorId: (0, pg_core_1.text)('creator_id')
        .notNull()
        .references(() => exports.profiles.id, { onDelete: 'cascade' }),
    clientId: (0, pg_core_1.uuid)('client_id').references(() => exports.clients.id, { onDelete: 'set null' }),
    clientName: (0, pg_core_1.text)('client_name').notNull(),
    clientEmail: (0, pg_core_1.text)('client_email').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    scope: (0, pg_core_1.jsonb)('scope').$type().notNull().default([]),
    price: (0, pg_core_1.numeric)('price').notNull(),
    currency: (0, pg_core_1.text)('currency').notNull().default('INR'),
    status: (0, pg_core_1.text)('status').notNull().default('in_progress'),
    deadline: (0, pg_core_1.timestamp)('deadline', { withTimezone: true }),
    progress: (0, pg_core_1.integer)('progress').notNull().default(0),
    paymentStatus: (0, pg_core_1.text)('payment_status').notNull().default('pending'),
    lastActivityAt: (0, pg_core_1.timestamp)('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
    previewEnabled: (0, pg_core_1.boolean)('preview_enabled').notNull().default(false),
}, (table) => ({
    creatorIdIdx: (0, pg_core_1.index)('idx_deals_creator_id').on(table.creatorId),
    tokenIdx: (0, pg_core_1.uniqueIndex)('idx_deals_token').on(table.token),
    clientEmailIdx: (0, pg_core_1.index)('idx_deals_client_email').on(table.clientEmail),
}));
// ------------------------------------------------------------------------------
// 5. Deal Participants (Role mapping: creator vs client)
// ------------------------------------------------------------------------------
exports.dealParticipants = (0, pg_core_1.pgTable)('deal_participants', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.text)('user_id'),
    role: (0, pg_core_1.text)('role').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    joinedAt: (0, pg_core_1.timestamp)('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    dealIdIdx: (0, pg_core_1.index)('idx_deal_participants_deal_id').on(table.dealId),
    emailIdx: (0, pg_core_1.index)('idx_deal_participants_email').on(table.email),
}));
// ------------------------------------------------------------------------------
// 6. Deal Messages (Chat & In-deal interactive embeds)
// ------------------------------------------------------------------------------
exports.dealMessages = (0, pg_core_1.pgTable)('deal_messages', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    senderId: (0, pg_core_1.text)('sender_id').notNull(),
    senderName: (0, pg_core_1.text)('sender_name').notNull(),
    senderRole: (0, pg_core_1.text)('sender_role').notNull(),
    senderAvatarUrl: (0, pg_core_1.text)('sender_avatar_url'),
    type: (0, pg_core_1.text)('type').notNull().default('text'),
    content: (0, pg_core_1.text)('content').notNull(),
    proposalId: (0, pg_core_1.uuid)('proposal_id'),
    attachments: (0, pg_core_1.jsonb)('attachments').$type().default([]),
    readAt: (0, pg_core_1.timestamp)('read_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    dealIdIdx: (0, pg_core_1.index)('idx_deal_messages_deal_id').on(table.dealId),
    createdAtIdx: (0, pg_core_1.index)('idx_deal_messages_created_at').on(table.createdAt),
}));
// ------------------------------------------------------------------------------
// 7. Price Proposals (Negotiation History & State Machine)
// ------------------------------------------------------------------------------
exports.priceProposals = (0, pg_core_1.pgTable)('price_proposals', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    direction: (0, pg_core_1.text)('direction').notNull(),
    previousPrice: (0, pg_core_1.numeric)('previous_price').notNull(),
    proposedPrice: (0, pg_core_1.numeric)('proposed_price').notNull(),
    reason: (0, pg_core_1.text)('reason'),
    state: (0, pg_core_1.text)('state').notNull().default('pending'),
    counterProposalId: (0, pg_core_1.uuid)('counter_proposal_id'),
    proposedBy: (0, pg_core_1.text)('proposed_by').notNull(),
    proposedByName: (0, pg_core_1.text)('proposed_by_name').notNull(),
    proposedByRole: (0, pg_core_1.text)('proposed_by_role').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at', { withTimezone: true }),
}, (table) => ({
    dealIdIdx: (0, pg_core_1.index)('idx_price_proposals_deal_id').on(table.dealId),
}));
// ------------------------------------------------------------------------------
// 8. Deliverables & File Versions
// ------------------------------------------------------------------------------
exports.deliverables = (0, pg_core_1.pgTable)('deliverables', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    approvedAt: (0, pg_core_1.timestamp)('approved_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    dealIdIdx: (0, pg_core_1.index)('idx_deliverables_deal_id').on(table.dealId),
}));
exports.fileVersions = (0, pg_core_1.pgTable)('file_versions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    deliverableId: (0, pg_core_1.uuid)('deliverable_id')
        .notNull()
        .references(() => exports.deliverables.id, { onDelete: 'cascade' }),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    version: (0, pg_core_1.integer)('version').notNull().default(1),
    description: (0, pg_core_1.text)('description'),
    uploaderId: (0, pg_core_1.text)('uploader_id').notNull(),
    uploaderName: (0, pg_core_1.text)('uploader_name').notNull(),
    files: (0, pg_core_1.jsonb)('files')
        .$type()
        .notNull()
        .default([]),
    status: (0, pg_core_1.text)('status').notNull().default('pending_review'),
    locked: (0, pg_core_1.boolean)('locked').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    dealIdIdx: (0, pg_core_1.index)('idx_file_versions_deal_id').on(table.dealId),
    deliverableIdIdx: (0, pg_core_1.index)('idx_file_versions_deliverable_id').on(table.deliverableId),
}));
// ------------------------------------------------------------------------------
// 9. Deal Events (Audit Trail & Activity Timeline)
// ------------------------------------------------------------------------------
exports.dealEvents = (0, pg_core_1.pgTable)('deal_events', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.text)('type').notNull(),
    actorId: (0, pg_core_1.text)('actor_id'),
    actorName: (0, pg_core_1.text)('actor_name'),
    actorRole: (0, pg_core_1.text)('actor_role'),
    description: (0, pg_core_1.text)('description').notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    dealIdIdx: (0, pg_core_1.index)('idx_deal_events_deal_id').on(table.dealId),
    createdAtIdx: (0, pg_core_1.index)('idx_deal_events_created_at').on(table.createdAt),
}));
// ------------------------------------------------------------------------------
// 10. Payments & Transactions (Razorpay Integration)
// ------------------------------------------------------------------------------
exports.payments = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    clientId: (0, pg_core_1.text)('client_id'),
    clientName: (0, pg_core_1.text)('client_name').notNull(),
    dealTitle: (0, pg_core_1.text)('deal_title').notNull(),
    amount: (0, pg_core_1.numeric)('amount').notNull(),
    currency: (0, pg_core_1.text)('currency').notNull().default('INR'),
    platformFee: (0, pg_core_1.numeric)('platform_fee').notNull().default('0'),
    processingFee: (0, pg_core_1.numeric)('processing_fee').notNull().default('0'),
    creatorNet: (0, pg_core_1.numeric)('creator_net').notNull(),
    state: (0, pg_core_1.text)('state').notNull().default('pending'),
    method: (0, pg_core_1.text)('method'),
    razorpayOrderId: (0, pg_core_1.text)('razorpay_order_id'),
    razorpayPaymentId: (0, pg_core_1.text)('razorpay_payment_id'),
    razorpaySignature: (0, pg_core_1.text)('razorpay_signature'),
    idempotencyKey: (0, pg_core_1.text)('idempotency_key').unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
}, (table) => ({
    dealIdIdx: (0, pg_core_1.index)('idx_payments_deal_id').on(table.dealId),
    orderIdIdx: (0, pg_core_1.index)('idx_payments_order_id').on(table.razorpayOrderId),
}));
exports.transactions = (0, pg_core_1.pgTable)('transactions', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    paymentId: (0, pg_core_1.uuid)('payment_id').references(() => exports.payments.id, { onDelete: 'cascade' }),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    creatorId: (0, pg_core_1.text)('creator_id')
        .notNull()
        .references(() => exports.profiles.id, { onDelete: 'cascade' }),
    dealTitle: (0, pg_core_1.text)('deal_title').notNull(),
    clientName: (0, pg_core_1.text)('client_name').notNull(),
    amount: (0, pg_core_1.numeric)('amount').notNull(),
    currency: (0, pg_core_1.text)('currency').notNull().default('INR'),
    platformFee: (0, pg_core_1.numeric)('platform_fee').notNull().default('0'),
    processingFee: (0, pg_core_1.numeric)('processing_fee').notNull().default('0'),
    netAmount: (0, pg_core_1.numeric)('net_amount').notNull(),
    state: (0, pg_core_1.text)('state').notNull().default('paid'),
    date: (0, pg_core_1.timestamp)('date', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    creatorIdIdx: (0, pg_core_1.index)('idx_transactions_creator_id').on(table.creatorId),
}));
// ------------------------------------------------------------------------------
// 11. Notifications
// ------------------------------------------------------------------------------
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(() => exports.profiles.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.text)('type').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    dealId: (0, pg_core_1.uuid)('deal_id').references(() => exports.deals.id, { onDelete: 'cascade' }),
    dealTitle: (0, pg_core_1.text)('deal_title'),
    read: (0, pg_core_1.boolean)('read').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('idx_notifications_user_id').on(table.userId),
    createdAtIdx: (0, pg_core_1.index)('idx_notifications_created_at').on(table.createdAt),
}));
// ------------------------------------------------------------------------------
// 12. Deal OTPs (Client Verification Passcodes)
// ------------------------------------------------------------------------------
exports.dealOtps = (0, pg_core_1.pgTable)('deal_otps', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    dealId: (0, pg_core_1.uuid)('deal_id')
        .notNull()
        .references(() => exports.deals.id, { onDelete: 'cascade' }),
    email: (0, pg_core_1.text)('email').notNull(),
    otpHash: (0, pg_core_1.text)('otp_hash').notNull(),
    attempts: (0, pg_core_1.integer)('attempts').notNull().default(0),
    verified: (0, pg_core_1.boolean)('verified').notNull().default(false),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    dealEmailIdx: (0, pg_core_1.index)('idx_deal_otps_deal_email').on(table.dealId, table.email),
    expiresAtIdx: (0, pg_core_1.index)('idx_deal_otps_expires_at').on(table.expiresAt),
}));
// ------------------------------------------------------------------------------
// Relations Definitions for Drizzle Relational Queries
// ------------------------------------------------------------------------------
exports.profilesRelations = (0, drizzle_orm_1.relations)(exports.profiles, ({ many, one }) => ({
    deals: many(exports.deals),
    clients: many(exports.clients),
    storageUsage: one(exports.storageUsage, {
        fields: [exports.profiles.id],
        references: [exports.storageUsage.userId],
    }),
    dealCredits: one(exports.dealCredits, {
        fields: [exports.profiles.id],
        references: [exports.dealCredits.userId],
    }),
    transactions: many(exports.transactions),
    notifications: many(exports.notifications),
}));
exports.clientsRelations = (0, drizzle_orm_1.relations)(exports.clients, ({ one, many }) => ({
    creator: one(exports.profiles, {
        fields: [exports.clients.creatorId],
        references: [exports.profiles.id],
    }),
    deals: many(exports.deals),
}));
exports.dealsRelations = (0, drizzle_orm_1.relations)(exports.deals, ({ one, many }) => ({
    creator: one(exports.profiles, {
        fields: [exports.deals.creatorId],
        references: [exports.profiles.id],
    }),
    client: one(exports.clients, {
        fields: [exports.deals.clientId],
        references: [exports.clients.id],
    }),
    participants: many(exports.dealParticipants),
    messages: many(exports.dealMessages),
    proposals: many(exports.priceProposals),
    deliverables: many(exports.deliverables),
    fileVersions: many(exports.fileVersions),
    events: many(exports.dealEvents),
    payments: many(exports.payments),
    transactions: many(exports.transactions),
    otps: many(exports.dealOtps),
}));
exports.deliverablesRelations = (0, drizzle_orm_1.relations)(exports.deliverables, ({ one, many }) => ({
    deal: one(exports.deals, {
        fields: [exports.deliverables.dealId],
        references: [exports.deals.id],
    }),
    versions: many(exports.fileVersions),
}));
exports.fileVersionsRelations = (0, drizzle_orm_1.relations)(exports.fileVersions, ({ one }) => ({
    deliverable: one(exports.deliverables, {
        fields: [exports.fileVersions.deliverableId],
        references: [exports.deliverables.id],
    }),
    deal: one(exports.deals, {
        fields: [exports.fileVersions.dealId],
        references: [exports.deals.id],
    }),
}));
exports.dealMessagesRelations = (0, drizzle_orm_1.relations)(exports.dealMessages, ({ one }) => ({
    deal: one(exports.deals, {
        fields: [exports.dealMessages.dealId],
        references: [exports.deals.id],
    }),
}));
exports.priceProposalsRelations = (0, drizzle_orm_1.relations)(exports.priceProposals, ({ one }) => ({
    deal: one(exports.deals, {
        fields: [exports.priceProposals.dealId],
        references: [exports.deals.id],
    }),
}));
exports.paymentsRelations = (0, drizzle_orm_1.relations)(exports.payments, ({ one, many }) => ({
    deal: one(exports.deals, {
        fields: [exports.payments.dealId],
        references: [exports.deals.id],
    }),
    transactions: many(exports.transactions),
}));
exports.transactionsRelations = (0, drizzle_orm_1.relations)(exports.transactions, ({ one }) => ({
    payment: one(exports.payments, {
        fields: [exports.transactions.paymentId],
        references: [exports.payments.id],
    }),
    deal: one(exports.deals, {
        fields: [exports.transactions.dealId],
        references: [exports.deals.id],
    }),
    creator: one(exports.profiles, {
        fields: [exports.transactions.creatorId],
        references: [exports.profiles.id],
    }),
}));
