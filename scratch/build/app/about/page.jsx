import Link from 'next/link';
import { Target, Users, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
var values = [
    { icon: Target, title: 'Focused', desc: 'We build one thing well: the private transaction between a creator and a client. No bloat, no feature creep.' },
    { icon: Users, title: 'Human', desc: 'DELT is built for real freelancers managing real client work. Every decision starts with the user experience.' },
    { icon: Zap, title: 'Efficient', desc: 'Less context switching. Fewer tools. One link that does the job of five apps. Speed is a feature.' },
];
export default function AboutPage() {
    return (<div className="min-h-screen bg-background">
      <MarketingNav />

      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl">
          We are building the workspace for digital work.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          DELT exists because freelancers deserve better than a scattered workflow across five disconnected tools.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            Every freelancer knows the pattern. A client reaches out on WhatsApp. Files get emailed back and forth. A payment link is sent manually. Deliverables live in a Drive folder with no version control. Tracking who said what and when becomes impossible.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            DELT replaces that chaos with a single, structured workspace. One private link. One conversation. one negotiation. One delivery. One payment. One complete record.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We are not building a marketplace. We are not building a project management tool. We are building the professional transaction workspace that freelancers, creators and agencies use to manage private client work from start to finish.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {values.map(function (v) { return (<Card key={v.title} className="h-full">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 mb-3">
                  <v.icon className="h-5 w-5 text-primary"/>
                </div>
                <h3 className="font-semibold mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </CardContent>
            </Card>); })}
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-balance text-2xl font-display font-semibold tracking-tight">
            Join the freelancers building with DELT.
          </h2>
          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get started
                <ArrowRight className="h-4 w-4"/>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>);
}
