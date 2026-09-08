-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Clients can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view invoice items if they can view the invoice" ON public.invoice_items;

-- Create open SELECT policies matching the Deal Workspace anonymous access pattern
CREATE POLICY "Clients can view their invoices"
  ON public.invoices FOR SELECT
  USING (true);

CREATE POLICY "Users can view invoice items if they can view the invoice"
  ON public.invoice_items FOR SELECT
  USING (true);
