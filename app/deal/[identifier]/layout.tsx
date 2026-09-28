import { redirect } from 'next/navigation';
import { resolveDealByCode } from '@/lib/deal-auth';
import { getCreatorUsername } from '@/lib/deal-url';

export default async function LegacyDealLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;

  if (identifier) {
    const resolution = await resolveDealByCode(identifier);
    if (resolution && resolution.deal) {
      const creatorUsername = getCreatorUsername(resolution.creator);
      const dealCode = resolution.deal.dealCode || resolution.deal.token;
      // Redirect legacy /deal/{identifier} to canonical /{creatorUsername}/{dealCode}
      redirect(`/${encodeURIComponent(creatorUsername)}/${encodeURIComponent(dealCode)}`);
    }
  }

  return <>{children}</>;
}
