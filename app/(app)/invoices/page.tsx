import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader, Breadcrumb } from '@/components/app-shell';
import { DealStatusBadge } from '@/components/deal-status-badge';
import { formatCurrency } from '@/lib/plans';
import Link from 'next/link';
import { FileText, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function GlobalInvoicesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all invoices for the current user's deals
  const { data: deals } = await supabase
    .from('deals')
    .select('id, title')
    .eq('creator_id', user.id);

  const dealIds = deals?.map(d => d.id) || [];
  
  let invoices: any[] = [];
  if (dealIds.length > 0) {
    const { data: invData } = await supabase
      .from('invoices')
      .select('*, deals(title)')
      .in('deal_id', dealIds)
      .order('created_at', { ascending: false });
    invoices = invData || [];
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Invoices' }]} />
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage all your invoices across all deals.</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No invoices yet</h3>
            <p>Create an invoice from within a deal's workspace.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Invoice</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Deal</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Issue Date</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {inv.invoice_number}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <Link href={`/deals/${inv.deal_id}`} className="hover:underline">
                      {inv.deals?.title || 'Unknown Deal'}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <DealStatusBadge status={inv.status} />
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatCurrency(inv.total_amount, inv.currency)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/deals/${inv.deal_id}/invoices`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
