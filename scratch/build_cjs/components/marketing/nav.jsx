"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingNav = void 0;
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const logo_1 = require("@/components/logo");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
const navLinks = [
    { href: '/how-it-works', label: 'How it works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/security', label: 'Security' },
    { href: '/about', label: 'About' },
];
function MarketingNav() {
    const pathname = (0, navigation_1.usePathname)();
    const [mobileOpen, setMobileOpen] = (0, react_1.useState)(false);
    return (<header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <logo_1.Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (<link_1.default key={link.href} href={link.href} className={(0, utils_1.cn)('rounded-md px-3 py-2 text-sm font-medium transition-colors', pathname === link.href
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground')}>
                {link.label}
              </link_1.default>))}
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <link_1.default href="/login">
            <button_1.Button variant="ghost" size="sm">Log in</button_1.Button>
          </link_1.default>
          <link_1.default href="/signup">
            <button_1.Button size="sm">Get started</button_1.Button>
          </link_1.default>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-md md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <lucide_react_1.X className="h-5 w-5"/> : <lucide_react_1.Menu className="h-5 w-5"/>}
        </button>
      </div>
      {mobileOpen && (<div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (<link_1.default key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={(0, utils_1.cn)('rounded-md px-3 py-2 text-sm font-medium', pathname === link.href ? 'text-foreground bg-muted' : 'text-muted-foreground')}>
                {link.label}
              </link_1.default>))}
            <div className="flex gap-2 mt-2">
              <link_1.default href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <button_1.Button variant="outline" size="sm" className="w-full">Log in</button_1.Button>
              </link_1.default>
              <link_1.default href="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                <button_1.Button size="sm" className="w-full">Get started</button_1.Button>
              </link_1.default>
            </div>
          </nav>
        </div>)}
    </header>);
}
exports.MarketingNav = MarketingNav;
