import { redirect } from 'next/navigation';
import { resolveDealByCode } from '@/lib/deal-auth';

export default async function CreatorDealLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
  
  // If it's a UUID/old token format, try to resolve and redirect
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  const isOldToken = identifier.startsWith('dlt_') && identifier.length > 20;

  if (isUuid || isOldToken) {
    const resolution = await resolveDealByCode(identifier);
    if (resolution && resolution.deal.dealCode) {
      // 307 Temporary Redirect to the canonical deal code URL
      redirect(`/deals/${resolution.deal.dealCode}`);
    }
  }

  return <>{children}</>;
}
