'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/about', label: 'About' },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated === null ? (
            <div className="w-32 h-8 bg-muted/40 animate-pulse rounded-md" />
          ) : isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium',
                  pathname === link.href ? 'text-foreground bg-muted' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-2">
              {isAuthenticated === null ? (
                <div className="w-full h-8 bg-muted/40 animate-pulse rounded-md" />
              ) : isAuthenticated ? (
                <Link href="/dashboard" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
