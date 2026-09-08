DROP INDEX "idx_invoices_deal_id";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "promo_code" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "order_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invoices_deal_id" ON "invoices" USING btree ("deal_id");