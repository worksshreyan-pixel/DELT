import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FolderKanban, Users, MessageSquare, FileCheck, CreditCard, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

const steps = [
  { icon: FolderKanban, title: 'Create a Deal', desc: 'Set up your project with a title, description, scope, price, deadline and deliverables. Everything your client needs to understand the work, in one structured form.' },
  { icon: Users, title: 'Invite your client', desc: 'Share a private, unguessable link. Your client enters their email, verifies with a 6-digit OTP, and lands in a focused project portal — no account creation required.' },
  { icon: MessageSquare, title: 'Discuss & negotiate', desc: 'All communication happens inside the Deal workspace. No more searching through WhatsApp threads. Propose new prices, counter-offer, and reach agreement with a full audit trail.' },
  { icon: FileCheck, title: 'Deliver the work', desc: 'Upload files in versions. Each version has a description, approval state, and access control. Files stay locked until payment clears.' },
  { icon: CreditCard, title: 'Get paid', desc: 'Payment status is tracked alongside the work. When payment is confirmed, files unlock automatically. You see the full fee breakdown — platform fee, processing fee, and your net amount.' },
  { icon: CheckCircle2, title: 'Complete the project', desc: 'Mark the Deal complete. Every action — from creation to completion — is preserved in the activity timeline as a permanent record.' },
];

export const metadata: Metadata = {
  title: 'How DELT Works — Digital Deals & Delivery',
  alternates: {
    canonical: '/how-it-works',
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-16 text-center">
        <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl">
          How DELT works
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Six steps from creation to completion. Every Deal follows the same clear, structured path.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-20">
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <Card>
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 shrink-0">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Step {i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="hidden text-xs font-medium text-muted-foreground sm:inline">Step {i + 1}</span>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </CardContent>
              </Card>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="h-4 w-px bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-balance text-2xl font-display font-semibold tracking-tight">
            Ready to create your first Deal?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Start free with 1 Deal credit. No credit card required.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
