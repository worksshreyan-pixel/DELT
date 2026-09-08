'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/plans';

export function InvoicePreview({ invoice, creator, client, deal }: { invoice: any; creator: any; client: any; deal?: any }) {
  if (!invoice) return null;

  // Normalize numeric fields to ensure 0 is safely handled and strings are parsed
  const subtotal = Number(invoice.subtotal ?? 0);
  const discount = Number(invoice.discount_amount ?? invoice.discountAmount ?? 0);
  const total = Number(invoice.total_amount ?? invoice.totalAmount ?? 0);
  const currency = invoice.currency || 'INR';
  const promoCode = invoice.promo_code || invoice.promoCode || null;

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white text-zinc-900 border-none shadow-sm print:shadow-none">
      <CardContent className="p-8 sm:p-12">
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-light text-zinc-800">INVOICE</h1>
            <p className="text-sm font-medium mt-1 text-zinc-500">{invoice.invoice_number || invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="font-semibold text-xl">{creator.displayName || creator.name}</h2>
            <p className="text-sm text-zinc-500">{creator.email}</p>
          </div>
        </div>

        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Billed To</h3>
            <p className="font-medium">{client.name}</p>
            {client.company && <p className="text-sm">{client.company}</p>}
            <p className="text-sm text-zinc-500">{client.email}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex justify-end gap-4 text-sm">
              <span className="font-medium text-zinc-500">Payment Date:</span>
              <span className="w-24">{new Date(invoice.paid_at || invoice.paidAt || invoice.created_at || invoice.createdAt).toLocaleDateString()}</span>
            </div>
            {deal?.title && (
              <div className="flex justify-end gap-4 text-sm mt-2">
                <span className="font-medium text-zinc-500">Deal:</span>
                <span className="w-48 truncate">{deal.title}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50">
              <tr className="border-b text-zinc-500">
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-100">
                <td className="px-4 py-4 font-medium">{deal?.title || 'Project Deal'}</td>
                <td className="px-4 py-4 text-right">{formatCurrency(subtotal, currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4 mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Original Amount</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {promoCode ? (
              <>
                <div className="flex justify-between text-zinc-500">
                  <span>Promo Code</span>
                  <span className="font-medium">{promoCode}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount, currency)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-zinc-500">
                  <span>Promo Code</span>
                  <span>None</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Discount</span>
                  <span>{formatCurrency(0, currency)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4 text-zinc-900">
              <span>TOTAL PAID</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 text-sm text-zinc-500 flex flex-col gap-1">
          <div className="flex gap-2">
            <span className="font-semibold text-zinc-700">Payment Status:</span>
            <span className="uppercase text-emerald-600 font-bold">{invoice.status === 'paid' ? 'PAID' : invoice.status}</span>
          </div>
          {(invoice.payment_id || invoice.paymentId) && (
            <div className="flex gap-2">
              <span className="font-semibold text-zinc-700">Payment ID:</span>
              <span>{invoice.payment_id || invoice.paymentId}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
