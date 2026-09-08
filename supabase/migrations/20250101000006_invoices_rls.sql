-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Invoices Policies
CREATE POLICY "Creators can manage their own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = creator_id);

CREATE POLICY "Clients can view their invoices"
  ON public.invoices FOR SELECT
  USING (true);

-- Invoice Items Policies
CREATE POLICY "Users can view invoice items if they can view the invoice"
  ON public.invoice_items FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage invoice items for their invoices"
  ON public.invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.creator_id = auth.uid()
    )
  );
