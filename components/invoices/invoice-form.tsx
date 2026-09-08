'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Send, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatCurrency } from '@/lib/plans';

export function InvoiceForm({ deal, invoice = null }: { deal: any; invoice?: any }) {
  const router = useRouter();
  const [items, setItems] = useState(
    invoice?.items?.length > 0
      ? invoice.items
      : [{ description: deal?.title || '', quantity: 1, unitPrice: deal?.price || 0 }]
  );
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [terms, setTerms] = useState(invoice?.terms || 'Payment is due upon receipt.');
  const [discountAmount, setDiscountAmount] = useState<number | string>(
    invoice?.discount_amount !== undefined && invoice?.discount_amount !== null 
      ? invoice.discount_amount 
      : 0
  );
  const [taxAmount, setTaxAmount] = useState<number | string>(
    invoice?.tax_amount !== undefined && invoice?.tax_amount !== null 
      ? invoice.tax_amount 
      : 0
  );
  const [saving, setSaving] = useState(false);

  const calculateSubtotal = () => {
    return items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - Number(discountAmount) + Number(taxAmount);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async (send: boolean = false) => {
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
        if (!createData.success) throw new Error(createData.error);
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
          discountAmount: Number(discountAmount),
          taxAmount: Number(taxAmount),
        }),
      });
      const updateData = await updateRes.json();
      if (!updateData.success) throw new Error(updateData.error);

      if (send) {
        const sendRes = await fetch(`/api/invoices/${currentInvoiceId}/send`, {
          method: 'POST',
        });
        const sendData = await sendRes.json();
        if (!sendData.success) throw new Error(sendData.error);
      }

      router.refresh();
      if (!invoice) {
        router.push(`/deals/${deal.id}/invoices`);
      }
    } catch (error: any) {
      alert(error.message || 'Error saving invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between font-medium text-sm text-muted-foreground mb-2">
            <div className="w-[50%]">Description</div>
            <div className="w-[15%] text-right">Qty</div>
            <div className="w-[15%] text-right">Price</div>
            <div className="w-[15%] text-right">Total</div>
            <div className="w-[5%]"></div>
          </div>
          {items.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="w-[50%]">
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Item description"
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
              <div className="w-[15%] text-right text-sm font-medium">
                {formatCurrency(Number(item.quantity) * Number(item.unitPrice), deal?.currency || 'INR')}
              </div>
              <div className="w-[5%] flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={items.length === 1}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for the client"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Terms</label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms"
                rows={2}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(calculateSubtotal(), deal?.currency || 'INR')}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-muted-foreground">Discount</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-32 text-right"
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
                className="w-32 text-right"
              />
            </div>
            <div className="flex justify-between items-center font-bold text-lg pt-4 border-t">
              <span>Total</span>
              <span>{formatCurrency(calculateTotal(), deal?.currency || 'INR')}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Send className="w-4 h-4 mr-2" />
            Save & Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
