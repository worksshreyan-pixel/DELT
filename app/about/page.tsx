import type { Metadata } from 'next';
import { Target } from 'lucide-react';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { GalaxyBackground } from '@/components/marketing/galaxy-background';
import { AboutWorkflowConvergence } from '@/components/marketing/about-workflow-convergence';

export const metadata: Metadata = {
  title: 'About DELT — Secure Digital Work',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-accent-brand/20 selection:text-accent-brand font-sans">
      {/* Shared DELT Galaxy Background (70% intensity for editorial atmosphere) */}
      <GalaxyBackground intensity={0.70} />

      <MarketingNav />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-32 pb-24 space-y-12">
        {/* Hero Section */}
        <section className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-8 sm:p-12 text-center shadow-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3.5 py-1 text-xs font-semibold text-foreground shadow-xs">
            <Target className="h-3.5 w-3.5 text-accent-brand" />
            <span>About DELT</span>
          </div>
          <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl lg:text-6xl mb-4">
            Built around the way digital work{' '}
            <span className="text-muted-foreground font-normal block sm:inline">
              actually moves.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            From agreement to delivery, DELT replaces five fragmented tools with one private, structured transaction workspace for creators and clients.
          </p>
        </section>

        {/* Narrative & Interactive Convergence Component */}
        <AboutWorkflowConvergence />
      </main>

      <MarketingFooter />
    </div>
  );
}
