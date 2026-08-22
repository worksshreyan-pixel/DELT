"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingFooter = void 0;
const link_1 = __importDefault(require("next/link"));
const logo_1 = require("@/components/logo");
const footerLinks = {
    Product: [
        { label: 'How it works', href: '/how-it-works' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Security', href: '/security' },
    ],
    Company: [
        { label: 'About', href: '/about' },
        { label: 'Log in', href: '/login' },
        { label: 'Get started', href: '/signup' },
    ],
    Legal: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Cookies', href: '#' },
    ],
};
function MarketingFooter() {
    return (<footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <logo_1.Logo />
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              The workspace where digital work gets done.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (<div key={category}>
              <h4 className="text-sm font-semibold mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (<li key={link.label}>
                    <link_1.default href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </link_1.default>
                  </li>))}
              </ul>
            </div>))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DELT. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for freelancers, creators and agencies.
          </p>
        </div>
      </div>
    </footer>);
}
exports.MarketingFooter = MarketingFooter;
