'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/plans';

export function InvoicePreview({
  invoice,
  creator,
  client,
  deal,
}: {
  invoice: any;
  creator?: any;
  client?: any;
  deal?: any;
}) {
  if (!invoice) return null;

  const creatorName = creator?.displayName || creator?.name || deal?.creatorName || 'Creator';
  const creatorEmail = creator?.email || deal?.creatorEmail || '';
  const clientName = client?.name || deal?.client_name || 'Client';
  const clientEmail = client?.email || deal?.client_email || '';

  const subtotal = Number(invoice.subtotal ?? 0);
  const discount = Number(invoice.discount_amount ?? invoice.discountAmount ?? 0);
  const tax = Number(invoice.tax_amount ?? invoice.taxAmount ?? 0);
  const total = Number(invoice.total_amount ?? invoice.totalAmount ?? 0);
  const currency = invoice.currency || deal?.currency || 'INR';
  const promoCode = invoice.promo_code || invoice.promoCode || null;

  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ description: deal?.title || 'Professional Services', quantity: 1, unit_price: subtotal, line_total: subtotal }];

  const statusLabel = (invoice.status || 'draft').toUpperCase();

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white text-zinc-900 border border-zinc-200 shadow-sm print:shadow-none print:border-none">
      <CardContent className="p-8 sm:p-12 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-zinc-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-2xl tracking-tight text-zinc-900">DELT</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase border border-zinc-200">
                {statusLabel}
              </span>
            </div>
            <h1 className="text-2xl font-light text-zinc-700 mt-2">INVOICE</h1>
            <p className="text-sm font-medium text-zinc-500">{invoice.invoice_number || invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="font-semibold text-lg text-zinc-900">{creatorName}</h2>
            {creatorEmail && <p className="text-sm text-zinc-500">{creatorEmail}</p>}
          </div>
        </div>

        {/* Billed To & Info */}
        <div className="flex justify-between items-start text-sm">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Billed To</h3>
            <p className="font-semibold text-zinc-900">{clientName}</p>
            {clientEmail && <p className="text-zinc-500">{clientEmail}</p>}
          </div>
          <div className="text-right space-y-1">
            {invoice.issue_date && (
              <div className="flex justify-end gap-3 text-sm">
                <span className="text-zinc-500">Issue Date:</span>
                <span className="font-medium text-zinc-800">{new Date(invoice.issue_date).toLocaleDateString()}</span>
              </div>
            )}
            {invoice.due_date && (
              <div className="flex justify-end gap-3 text-sm">
                <span className="text-zinc-500">Due Date:</span>
                <span className="font-medium text-zinc-800">{new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {deal?.title && (
              <div className="flex justify-end gap-3 text-sm mt-1">
                <span className="text-zinc-500">Deal:</span>
                <span className="font-medium text-zinc-800 max-w-[200px] truncate">{deal.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr className="text-zinc-500">
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-center font-semibold uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item: any, i: number) => {
                const qty = Number(item.quantity ?? 1);
                const price = Number(item.unit_price ?? item.unitPrice ?? 0);
                const lineTotal = Number(item.line_total ?? item.lineTotal ?? qty * price);
                return (
                  <tr key={i}>
                    <td className="px-4 py-3.5 font-medium text-zinc-800">{item.description || 'Item'}</td>
                    <td className="px-4 py-3.5 text-center text-zinc-600">{qty}</td>
                    <td className="px-4 py-3.5 text-right text-zinc-600">{formatCurrency(price, currency)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-zinc-900">{formatCurrency(lineTotal, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span className="font-medium text-zinc-800">{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{formatCurrency(discount, currency)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Tax</span>
                <span>+{formatCurrency(tax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-3 border-t border-zinc-200 text-zinc-900">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="border-t border-zinc-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-600">
            {invoice.notes && (
              <div>
                <span className="font-semibold text-zinc-800 block mb-1">Notes:</span>
                <p className="whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <span className="font-semibold text-zinc-800 block mb-1">Terms:</span>
                <p className="whitespace-pre-line">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Payment Info */}
        <div className="border-t border-zinc-200 pt-6 text-xs text-zinc-500 flex justify-between items-center">
          <div>
            <span>Payment Status: </span>
            <span className={`font-bold uppercase ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-zinc-700'}`}>
              {invoice.status}
            </span>
          </div>
          {(invoice.payment_id || invoice.paymentId) && (
            <div>
              <span>Payment Ref: </span>
              <span className="font-mono text-zinc-700">{invoice.payment_id || invoice.paymentId}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
