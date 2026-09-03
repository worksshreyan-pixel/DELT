import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — DELT Secure Digital Deals',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
