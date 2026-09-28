import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { GalaxyBackground } from '@/components/marketing/galaxy-background';
import { SecurityArchitectureInteractive } from '@/components/marketing/security-architecture-interactive';

export const metadata: Metadata = {
  title: 'Security — DELT',
  alternates: {
    canonical: '/security',
  },
};

export default function SecurityPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-accent-brand/20 selection:text-accent-brand font-sans">
      {/* Shared DELT Galaxy Background (45% intensity for dark technical atmosphere) */}
      <GalaxyBackground intensity={0.45} />

      <MarketingNav />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-32 pb-24 space-y-12">
        {/* Technical Hero Surface */}
        <section className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-8 sm:p-12 text-center shadow-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3.5 py-1 text-xs font-semibold text-foreground shadow-xs">
            <Shield className="h-3.5 w-3.5 text-accent-brand" />
            <span>Security Architecture</span>
          </div>
          <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl lg:text-6xl mb-4">
            Your deal stays isolated.{' '}
            <span className="text-muted-foreground font-normal block sm:inline">
              Your access stays controlled.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            DELT separates participants, deal access, deliverables and payment state inside a controlled, server-verified deal workspace. Security is architected at the data layer.
          </p>
        </section>

        {/* Interactive Security Architecture & Data Protection Pipeline */}
        <SecurityArchitectureInteractive />
      </main>

      <MarketingFooter />
    </div>
  );
}
