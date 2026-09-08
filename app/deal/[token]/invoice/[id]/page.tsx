'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { InvoicePreview } from '@/components/invoices/invoice-preview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ClientInvoicePage() {
  const params = useParams();
  const token = params.token as string;
  const invoiceId = params.id as string;
  const router = useRouter();

  const [invoice, setInvoice] = useState<any>(null);
  const [deal, setDeal] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      const savedToken = localStorage.getItem(`delt_client_session_${token}`);
      try {
        const res = await fetch(`/api/deals/${encodeURIComponent(token)}/verify-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(savedToken ? { 'x-client-session-token': savedToken } : {}),
          },
        });
        const accessData = await res.json();
        
        if (!accessData.authorized || !accessData.deal) {
          setError('Unauthorized. Please access this invoice through the deal workspace link.');
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data: invData, error: invErr } = await supabase
          .from('invoices')
          .select('*, creator:profiles(*)')
          .eq('id', invoiceId)
          .eq('deal_id', accessData.deal.id)
          .single();

        if (invErr || !invData) {
          setError('Invoice not found.');
          setLoading(false);
          return;
        }

        setDeal(accessData.deal);
        setInvoice(invData);
        setCreator(invData.creator);
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Error loading invoice.');
        setLoading(false);
      }
    }

    loadData();
  }, [token, invoiceId]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <Button variant="ghost" onClick={() => router.push(`/deal/${token}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Deal
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              Print / Save PDF
            </Button>
            <div className="flex items-center text-emerald-600 font-bold gap-2 px-4 py-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              PAID
            </div>
          </div>
        </div>

        <InvoicePreview 
          invoice={invoice}
          creator={creator}
          client={{ name: deal.clientName, email: deal.clientEmail }}
          deal={deal}
        />
      </div>
    </div>
  );
}
