import { redirect } from 'next/navigation';
import { resolveDealByCode } from '@/lib/deal-auth';
import { getCreatorUsername, normalizeUsername } from '@/lib/deal-url';

export default async function CreatorDealLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ creatorUsername: string; identifier: string }>;
}) {
  const { creatorUsername, identifier } = await params;

  if (identifier) {
    const resolution = await resolveDealByCode(identifier);
    if (resolution && resolution.deal) {
      const actualCreatorUsername = getCreatorUsername(resolution.creator);
      const normalizedUrlUser = normalizeUsername(creatorUsername);
      const normalizedActualUser = normalizeUsername(actualCreatorUsername);

      // Verify creator ownership: creatorUsername in URL must match deal's actual creator username
      if (normalizedUrlUser !== normalizedActualUser) {
        const dealCode = resolution.deal.dealCode || resolution.deal.token;
        redirect(`/${encodeURIComponent(actualCreatorUsername)}/${encodeURIComponent(dealCode)}`);
      }
    }
  }

  return <>{children}</>;
}
