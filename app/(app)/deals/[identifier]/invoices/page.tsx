'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DealInvoicesPage() {
  const params = useParams();
  const dealId = params.identifier as string;
  const router = useRouter();

  useEffect(() => {
    router.replace(`/deals/${dealId}`);
  }, [dealId, router]);

  return (
    <div className="p-12 text-center">
      <h3 className="text-lg font-medium">Invoices are now automatically generated.</h3>
      <p className="text-muted-foreground">Redirecting to deal overview...</p>
    </div>
  );
}
