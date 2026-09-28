'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatCurrency } from '@/lib/plans';

export function InvoiceForm({ deal, invoice = null, onSuccess }: { deal: any; invoice?: any; onSuccess?: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState(
    invoice?.items?.length > 0
      ? invoice.items.map((it: any) => ({
          description: it.description || '',
          quantity: it.quantity ?? 1,
          unitPrice: it.unitPrice ?? it.unit_price ?? 0,
        }))
      : [{ description: deal?.title || 'Professional Services', quantity: 1, unitPrice: deal?.price || 0 }]
  );
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [terms, setTerms] = useState(invoice?.terms || 'Payment is due upon receipt.');
  const [discountAmount, setDiscountAmount] = useState<number | string>(
    invoice?.discount_amount !== undefined && invoice?.discount_amount !== null 
      ? invoice.discount_amount 
      : (invoice?.discountAmount ?? 0)
  );
  const [taxAmount, setTaxAmount] = useState<number | string>(
    invoice?.tax_amount !== undefined && invoice?.tax_amount !== null 
      ? invoice.tax_amount 
      : (invoice?.taxAmount ?? 0)
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const calculateSubtotal = () => {
    return items.reduce((sum: number, item: any) => {
      const q = Math.max(0, parseInt(item.quantity) || 0);
      const p = Math.max(0, parseFloat(item.unitPrice) || 0);
      return sum + (q * p);
    }, 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const disc = Math.max(0, parseFloat(String(discountAmount)) || 0);
    const tax = Math.max(0, parseFloat(String(taxAmount)) || 0);
    return Math.max(0, sub - disc + tax);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async (send: boolean = false) => {
    setErrorMessage('');
    setSaving(true);
    try {
      let currentInvoiceId = invoice?.id;

      if (!currentInvoiceId) {
        // Create draft first
        const createRes = await fetch('/api/invoices/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId: deal.id }),
        });
        const createData = await createRes.json();
        if (!createData.success) throw new Error(createData.error || 'Failed to create draft invoice.');
        currentInvoiceId = createData.invoice.id;
      }

      // Update draft
      const updateRes = await fetch(`/api/invoices/${currentInvoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          notes,
          terms,
          discountAmount: Math.max(0, parseFloat(String(discountAmount)) || 0),
          taxAmount: Math.max(0, parseFloat(String(taxAmount)) || 0),
        }),
      });
      const updateData = await updateRes.json();
      if (!updateData.success) throw new Error(updateData.error || 'Failed to update invoice.');

      if (send) {
        const sendRes = await fetch(`/api/invoices/${currentInvoiceId}/send`, {
          method: 'POST',
        });
        const sendData = await sendRes.json();
        if (!sendData.success) throw new Error(sendData.error || 'Failed to issue invoice.');
      }

      router.refresh();
      if (onSuccess) {
        onSuccess();
      } else if (!invoice) {
        router.push(`/deals/${deal.id}`);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error saving invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {invoice ? 'Edit Invoice' : 'Create New Invoice'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">
            <div className="w-[50%]">Item Description</div>
            <div className="w-[15%] text-right">Qty</div>
            <div className="w-[15%] text-right">Unit Price</div>
            <div className="w-[15%] text-right">Line Total</div>
            <div className="w-[5%]"></div>
          </div>
          {items.map((item: any, index: number) => {
            const qty = Math.max(0, parseInt(item.quantity) || 0);
            const price = Math.max(0, parseFloat(item.unitPrice) || 0);
            const lineTotal = qty * price;
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="w-[50%]">
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Describe product or service..."
                  />
                </div>
                <div className="w-[15%]">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="w-[15%]">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="w-[15%] text-right text-sm font-semibold">
                  {formatCurrency(lineTotal, deal?.currency || 'INR')}
                </div>
                <div className="w-[5%] flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                  </Button>
                </div>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Notes to Client</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or instructions for the client..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Terms & Conditions</label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms..."
                rows={2}
              />
            </div>
          </div>
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(calculateSubtotal(), deal?.currency || 'INR')}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-muted-foreground">Discount</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-32 text-right h-8 text-sm"
              />
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-muted-foreground">Tax</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="w-32 text-right h-8 text-sm"
              />
            </div>
            <div className="flex justify-between items-center font-bold text-base pt-3 border-t border-border">
              <span>Total Amount</span>
              <span className="text-primary">{formatCurrency(calculateTotal(), deal?.currency || 'INR')}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-border pt-4">
        <Button variant="outline" onClick={() => onSuccess ? onSuccess() : router.back()} disabled={saving}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Send className="w-4 h-4 mr-2" />
            Issue Invoice
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
