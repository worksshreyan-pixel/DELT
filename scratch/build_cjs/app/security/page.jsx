"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const nav_1 = require("@/components/marketing/nav");
const footer_1 = require("@/components/marketing/footer");
const principles = [
    { icon: lucide_react_1.KeyRound, title: 'Verified access', desc: 'Clients access deals through a private link plus email verification via OTP. No unguessable URL is treated as a security boundary on its own.' },
    { icon: lucide_react_1.Lock, title: 'Private file storage', desc: 'Deliverables are stored in private buckets, not public URLs. Access is authorized per deal participant and delivered through signed URLs.' },
    { icon: lucide_react_1.FileCheck, title: 'Payment-aware delivery', desc: 'Files remain locked until payment is confirmed server-side. The client cannot unlock deliverables through frontend state alone.' },
    { icon: lucide_react_1.Eye, title: 'Participant-based access', desc: 'Only the creator and the invited client can access a deal workspace. Authorization is enforced at the data layer, not by hiding buttons.' },
    { icon: lucide_react_1.Activity, title: 'Full audit trail', desc: 'Every action — from deal creation to file upload to payment — is logged as an immutable event in the activity timeline.' },
    { icon: lucide_react_1.Shield, title: 'Secure by architecture', desc: 'Row-level security, server-side validation, and signed URLs are designed into the data model from day one, not bolted on later.' },
];
function SecurityPage() {
    return (<div className="min-h-screen bg-background">
      <nav_1.MarketingNav />

      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <lucide_react_1.Shield className="h-3.5 w-3.5"/>
          Security
        </div>
        <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl">
          Designed for trust, built for control.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          DELT is architected so that access, files and payments are protected at the data layer — not just in the interface.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (<card_1.Card key={p.title} className="h-full">
              <card_1.CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 mb-3">
                  <p.icon className="h-5 w-5 text-primary"/>
                </div>
                <h3 className="font-semibold mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </card_1.CardContent>
            </card_1.Card>))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-balance text-2xl font-display font-semibold tracking-tight text-center mb-8">
            What we do not do
          </h2>
          <div className="space-y-3">
            {[
            'We do not rely on hiding buttons for authorization.',
            'We do not trust client-side payment state as confirmation.',
            'We do not expose private files through public URLs.',
            'We do not use predictable IDs as access credentials.',
            'We do not store service-role credentials in the browser.',
        ].map((item) => (<div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0"/>
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            DELT is designed for clean integration with Supabase Auth, RLS, private storage buckets and signed URLs. Backend enforcement will be activated when the database layer is connected.
          </p>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-balance text-2xl font-display font-semibold tracking-tight">
            Your work deserves a secure workspace.
          </h2>
          <div className="mt-6">
            <link_1.default href="/signup">
              <button_1.Button size="lg" className="gap-2">
                Get started
                <lucide_react_1.ArrowRight className="h-4 w-4"/>
              </button_1.Button>
            </link_1.default>
          </div>
        </div>
      </section>

      <footer_1.MarketingFooter />
    </div>);
}
exports.default = SecurityPage;
