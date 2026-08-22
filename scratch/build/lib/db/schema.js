// ==============================================================================
// DELT — Neon PostgreSQL Database Schema (Drizzle ORM)
// Independent, decoupled relational schema ready for Clerk auth and Cloudflare R2
// ==============================================================================
import { pgTable, text, timestamp, numeric, integer, bigint, boolean, uuid, jsonb, index, uniqueIndex, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// ------------------------------------------------------------------------------
// 1. Profiles (Creator accounts — compatible with Clerk user IDs and legacy UUIDs)
// ------------------------------------------------------------------------------
export var profiles = pgTable('profiles', {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    profession: text('profession'),
    company: text('company'),
    website: text('website'),
    location: text('location'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// ------------------------------------------------------------------------------
// 2. Storage Usage & Deal Credits (Entitlements & Usage Quotas)
// ------------------------------------------------------------------------------
export var storageUsage = pgTable('storage_usage', {
    userId: text('user_id')
        .primaryKey()
        .references(function () { return profiles.id; }, { onDelete: 'cascade' }),
    totalBytes: bigint('total_bytes', { mode: 'number' }).notNull().default(0),
    limitBytes: bigint('limit_bytes', { mode: 'number' }).notNull().default(5368709120),
    filesBytes: bigint('files_bytes', { mode: 'number' }).notNull().default(0),
    versionsBytes: bigint('versions_bytes', { mode: 'number' }).notNull().default(0),
    attachmentsBytes: bigint('attachments_bytes', { mode: 'number' }).notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export var dealCredits = pgTable('deal_credits', {
    userId: text('user_id')
        .primaryKey()
        .references(function () { return profiles.id; }, { onDelete: 'cascade' }),
    planId: text('plan_id').notNull().default('free'),
    total: integer('total').notNull().default(50),
    used: integer('used').notNull().default(0),
    remaining: integer('remaining').notNull().default(50),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// ------------------------------------------------------------------------------
// 3. Clients (Creator's CRM Directory)
// ------------------------------------------------------------------------------
export var clients = pgTable('clients', {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: text('creator_id')
        .notNull()
        .references(function () { return profiles.id; }, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    company: text('company'),
    dealCount: integer('deal_count').notNull().default(0),
    totalValue: numeric('total_value').notNull().default('0'),
    currency: text('currency').notNull().default('INR'),
    status: text('status').notNull().default('active'),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    creatorIdIdx: index('idx_clients_creator_id').on(table.creatorId),
    emailIdx: index('idx_clients_email').on(table.email),
}); });
// ------------------------------------------------------------------------------
// 4. Deals (Core Transaction Agreement)
// ------------------------------------------------------------------------------
export var deals = pgTable('deals', {
    id: uuid('id').defaultRandom().primaryKey(),
    token: text('token').notNull().unique(),
    creatorId: text('creator_id')
        .notNull()
        .references(function () { return profiles.id; }, { onDelete: 'cascade' }),
    clientId: uuid('client_id').references(function () { return clients.id; }, { onDelete: 'set null' }),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    scope: jsonb('scope').$type().notNull().default([]),
    price: numeric('price').notNull(),
    currency: text('currency').notNull().default('INR'),
    status: text('status').notNull().default('in_progress'),
    deadline: timestamp('deadline', { withTimezone: true }),
    progress: integer('progress').notNull().default(0),
    paymentStatus: text('payment_status').notNull().default('pending'),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    previewEnabled: boolean('preview_enabled').notNull().default(false),
}, function (table) { return ({
    creatorIdIdx: index('idx_deals_creator_id').on(table.creatorId),
    tokenIdx: uniqueIndex('idx_deals_token').on(table.token),
    clientEmailIdx: index('idx_deals_client_email').on(table.clientEmail),
}); });
// ------------------------------------------------------------------------------
// 5. Deal Participants (Role mapping: creator vs client)
// ------------------------------------------------------------------------------
export var dealParticipants = pgTable('deal_participants', {
    id: uuid('id').defaultRandom().primaryKey(),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    userId: text('user_id'),
    role: text('role').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    dealIdIdx: index('idx_deal_participants_deal_id').on(table.dealId),
    emailIdx: index('idx_deal_participants_email').on(table.email),
}); });
// ------------------------------------------------------------------------------
// 6. Deal Messages (Chat & In-deal interactive embeds)
// ------------------------------------------------------------------------------
export var dealMessages = pgTable('deal_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    senderId: text('sender_id').notNull(),
    senderName: text('sender_name').notNull(),
    senderRole: text('sender_role').notNull(),
    senderAvatarUrl: text('sender_avatar_url'),
    type: text('type').notNull().default('text'),
    content: text('content').notNull(),
    proposalId: uuid('proposal_id'),
    attachments: jsonb('attachments').$type().default([]),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    dealIdIdx: index('idx_deal_messages_deal_id').on(table.dealId),
    createdAtIdx: index('idx_deal_messages_created_at').on(table.createdAt),
}); });
// ------------------------------------------------------------------------------
// 7. Price Proposals (Negotiation History & State Machine)
// ------------------------------------------------------------------------------
export var priceProposals = pgTable('price_proposals', {
    id: uuid('id').defaultRandom().primaryKey(),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    direction: text('direction').notNull(),
    previousPrice: numeric('previous_price').notNull(),
    proposedPrice: numeric('proposed_price').notNull(),
    reason: text('reason'),
    state: text('state').notNull().default('pending'),
    counterProposalId: uuid('counter_proposal_id'),
    proposedBy: text('proposed_by').notNull(),
    proposedByName: text('proposed_by_name').notNull(),
    proposedByRole: text('proposed_by_role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, function (table) { return ({
    dealIdIdx: index('idx_price_proposals_deal_id').on(table.dealId),
}); });
// ------------------------------------------------------------------------------
// 8. Deliverables & File Versions
// ------------------------------------------------------------------------------
export var deliverables = pgTable('deliverables', {
    id: uuid('id').defaultRandom().primaryKey(),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').notNull().default('pending'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    dealIdIdx: index('idx_deliverables_deal_id').on(table.dealId),
}); });
export var fileVersions = pgTable('file_versions', {
    id: uuid('id').defaultRandom().primaryKey(),
    deliverableId: uuid('deliverable_id')
        .notNull()
        .references(function () { return deliverables.id; }, { onDelete: 'cascade' }),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    description: text('description'),
    uploaderId: text('uploader_id').notNull(),
    uploaderName: text('uploader_name').notNull(),
    files: jsonb('files')
        .$type()
        .notNull()
        .default([]),
    status: text('status').notNull().default('pending_review'),
    locked: boolean('locked').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    dealIdIdx: index('idx_file_versions_deal_id').on(table.dealId),
    deliverableIdIdx: index('idx_file_versions_deliverable_id').on(table.deliverableId),
}); });
// ------------------------------------------------------------------------------
// 9. Deal Events (Audit Trail & Activity Timeline)
// ------------------------------------------------------------------------------
export var dealEvents = pgTable('deal_events', {
    id: uuid('id').defaultRandom().primaryKey(),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    actorId: text('actor_id'),
    actorName: text('actor_name'),
    actorRole: text('actor_role'),
    description: text('description').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    dealIdIdx: index('idx_deal_events_deal_id').on(table.dealId),
    createdAtIdx: index('idx_deal_events_created_at').on(table.createdAt),
}); });
// ------------------------------------------------------------------------------
// 10. Payments & Transactions (Razorpay Integration)
// ------------------------------------------------------------------------------
export var payments = pgTable('payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    clientId: text('client_id'),
    clientName: text('client_name').notNull(),
    dealTitle: text('deal_title').notNull(),
    amount: numeric('amount').notNull(),
    currency: text('currency').notNull().default('INR'),
    platformFee: numeric('platform_fee').notNull().default('0'),
    processingFee: numeric('processing_fee').notNull().default('0'),
    creatorNet: numeric('creator_net').notNull(),
    state: text('state').notNull().default('pending'),
    method: text('method'),
    razorpayOrderId: text('razorpay_order_id'),
    razorpayPaymentId: text('razorpay_payment_id'),
    razorpaySignature: text('razorpay_signature'),
    idempotencyKey: text('idempotency_key').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
}, function (table) { return ({
    dealIdIdx: index('idx_payments_deal_id').on(table.dealId),
    orderIdIdx: index('idx_payments_order_id').on(table.razorpayOrderId),
}); });
export var transactions = pgTable('transactions', {
    id: text('id').primaryKey(),
    paymentId: uuid('payment_id').references(function () { return payments.id; }, { onDelete: 'cascade' }),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    creatorId: text('creator_id')
        .notNull()
        .references(function () { return profiles.id; }, { onDelete: 'cascade' }),
    dealTitle: text('deal_title').notNull(),
    clientName: text('client_name').notNull(),
    amount: numeric('amount').notNull(),
    currency: text('currency').notNull().default('INR'),
    platformFee: numeric('platform_fee').notNull().default('0'),
    processingFee: numeric('processing_fee').notNull().default('0'),
    netAmount: numeric('net_amount').notNull(),
    state: text('state').notNull().default('paid'),
    date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    creatorIdIdx: index('idx_transactions_creator_id').on(table.creatorId),
}); });
// ------------------------------------------------------------------------------
// 11. Notifications
// ------------------------------------------------------------------------------
export var notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(function () { return profiles.id; }, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    dealId: uuid('deal_id').references(function () { return deals.id; }, { onDelete: 'cascade' }),
    dealTitle: text('deal_title'),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    userIdIdx: index('idx_notifications_user_id').on(table.userId),
    createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
}); });
// ------------------------------------------------------------------------------
// 12. Deal OTPs (Client Verification Passcodes)
// ------------------------------------------------------------------------------
export var dealOtps = pgTable('deal_otps', {
    id: uuid('id').defaultRandom().primaryKey(),
    dealId: uuid('deal_id')
        .notNull()
        .references(function () { return deals.id; }, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    otpHash: text('otp_hash').notNull(),
    attempts: integer('attempts').notNull().default(0),
    verified: boolean('verified').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (table) { return ({
    dealEmailIdx: index('idx_deal_otps_deal_email').on(table.dealId, table.email),
    expiresAtIdx: index('idx_deal_otps_expires_at').on(table.expiresAt),
}); });
// ------------------------------------------------------------------------------
// Relations Definitions for Drizzle Relational Queries
// ------------------------------------------------------------------------------
export var profilesRelations = relations(profiles, function (_a) {
    var many = _a.many, one = _a.one;
    return ({
        deals: many(deals),
        clients: many(clients),
        storageUsage: one(storageUsage, {
            fields: [profiles.id],
            references: [storageUsage.userId],
        }),
        dealCredits: one(dealCredits, {
            fields: [profiles.id],
            references: [dealCredits.userId],
        }),
        transactions: many(transactions),
        notifications: many(notifications),
    });
});
export var clientsRelations = relations(clients, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        creator: one(profiles, {
            fields: [clients.creatorId],
            references: [profiles.id],
        }),
        deals: many(deals),
    });
});
export var dealsRelations = relations(deals, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        creator: one(profiles, {
            fields: [deals.creatorId],
            references: [profiles.id],
        }),
        client: one(clients, {
            fields: [deals.clientId],
            references: [clients.id],
        }),
        participants: many(dealParticipants),
        messages: many(dealMessages),
        proposals: many(priceProposals),
        deliverables: many(deliverables),
        fileVersions: many(fileVersions),
        events: many(dealEvents),
        payments: many(payments),
        transactions: many(transactions),
        otps: many(dealOtps),
    });
});
export var deliverablesRelations = relations(deliverables, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        deal: one(deals, {
            fields: [deliverables.dealId],
            references: [deals.id],
        }),
        versions: many(fileVersions),
    });
});
export var fileVersionsRelations = relations(fileVersions, function (_a) {
    var one = _a.one;
    return ({
        deliverable: one(deliverables, {
            fields: [fileVersions.deliverableId],
            references: [deliverables.id],
        }),
        deal: one(deals, {
            fields: [fileVersions.dealId],
            references: [deals.id],
        }),
    });
});
export var dealMessagesRelations = relations(dealMessages, function (_a) {
    var one = _a.one;
    return ({
        deal: one(deals, {
            fields: [dealMessages.dealId],
            references: [deals.id],
        }),
    });
});
export var priceProposalsRelations = relations(priceProposals, function (_a) {
    var one = _a.one;
    return ({
        deal: one(deals, {
            fields: [priceProposals.dealId],
            references: [deals.id],
        }),
    });
});
export var paymentsRelations = relations(payments, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        deal: one(deals, {
            fields: [payments.dealId],
            references: [deals.id],
        }),
        transactions: many(transactions),
    });
});
export var transactionsRelations = relations(transactions, function (_a) {
    var one = _a.one;
    return ({
        payment: one(payments, {
            fields: [transactions.paymentId],
            references: [payments.id],
        }),
        deal: one(deals, {
            fields: [transactions.dealId],
            references: [deals.id],
        }),
        creator: one(profiles, {
            fields: [transactions.creatorId],
            references: [profiles.id],
        }),
    });
});
