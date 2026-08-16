# DELT — Database Migration Security & Authorization Guide

> **Phase 1: Neon PostgreSQL + Drizzle ORM Migration**  
> *Objective:* Transition from database-level Row Level Security (RLS tied to Supabase `auth.uid()`) to clean, robust, server-side application authorization checks in Next.js Server Components and API Routes.

---

## 1. RLS Policy to Application-Level Authorization Mapping

In the legacy Supabase architecture, permissions relied on PostgreSQL RLS policies evaluating `auth.uid() = creator_id` and public select policies.

In the target **Neon + Clerk + Twilio Verify** architecture, PostgreSQL is a pure, high-performance datastore. All authorization occurs strictly server-side in API routes and Server Actions before queries touch the database.

| Table | Legacy Supabase RLS Policy | Target Application-Level Authorization Check |
| :--- | :--- | :--- |
| `profiles` | `auth.uid() = id` for INSERT / UPDATE | Extract Clerk user ID (`auth().userId`). Only allow reading or updating the profile where `profiles.id === clerkUserId`. |
| `storage_usage` | `auth.uid() = user_id` for SELECT | Server-side query filtered by authenticated creator ID: `where(eq(storageUsage.userId, clerkUserId))`. |
| `deal_credits` | `auth.uid() = user_id` for SELECT | Server-side query filtered by authenticated creator ID: `where(eq(dealCredits.userId, clerkUserId))`. |
| `clients` | `auth.uid() = creator_id` for ALL | Enforce `creatorId === clerkUserId` on all client CRUD operations. |
| `deals` | `auth.uid() = creator_id` for ALL, public SELECT on token | - **Creator Access:** Enforce `deals.creatorId === clerkUserId`.<br>- **Client Access:** Require valid cryptographic token (`token`) AND validated OTP session matching `deals.clientEmail`. |
| `deal_participants`| Creator or participant viewable | Validated session must match either `creatorId` or `clientEmail`. |
| `deal_messages` | Open INSERT/SELECT in Supabase | Verify sender session on `/api/messages/send`. Reject messages if caller does not own the deal or have a verified client session token for `dealId`. |
| `price_proposals` | Open INSERT/UPDATE in Supabase | Verify proposal sender role and target deal authorization before inserting or updating proposal states. |
| `deliverables` | Creators manage, clients view | Only authenticated creator can insert/update deliverables; verified client can only view. |
| `file_versions` | Creators manage, clients view | Only authenticated creator can upload; clients can only view unlocked file downloads after verified payment. |
| `deal_events` | Open INSERT/SELECT in Supabase | System/server-only insertion on audited user actions. |
| `payments` | Open SELECT in Supabase | Access restricted to deal creator (`creatorId === clerkUserId`) or verified client (`clientEmail === verifiedEmail`). |
| `transactions` | `auth.uid() = creator_id` for SELECT | Filter transactions strictly by authenticated creator: `where(eq(transactions.creatorId, clerkUserId))`. |
| `notifications` | `auth.uid() = user_id` for ALL | Query and update notifications strictly for `where(eq(notifications.userId, clerkUserId))`. |
| `deal_otps` | Service role only in Supabase | Server-only access via API routes (`request-otp` and `verify-otp`). Never exposed to client queries. |

---

## 2. Authorization Design Principles for Next.js API Routes

1. **Explicit Identity Extraction:**
   Every creator route extracts user identity via `const { userId } = auth();`. If `!userId`, return `401 Unauthorized`.
2. **Explicit Resource Ownership Verification:**
   Never assume an ID in request parameters belongs to the caller. Always include ownership filter in the database query:
   ```ts
   const deal = await db.query.deals.findFirst({
     where: and(eq(deals.id, dealId), eq(deals.creatorId, userId)),
   });
   if (!deal) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   ```
3. **Cryptographically Sealed Client Sessions:**
   Client sessions on `/deal/[token]` use HMAC-SHA256 signed session tokens or HTTP-only signed cookies verifying the client's authorized email address and expiry timestamp.
4. **Never Expose Direct Database Access to the Browser:**
   Neon database credentials (`DATABASE_URL`) are strictly server-only environment variables and never prefixed with `NEXT_PUBLIC_`.
