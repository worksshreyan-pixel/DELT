'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

const navLinks = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/about', label: 'About' },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Authenticated user state from useUser hook
  const { user, loading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track window scroll with hysteresis for smooth Dynamic Island transformation
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > 50) {
        setScrolled(true);
      } else if (y < 20) {
        setScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeTarget = hoveredLink ?? navLinks.find((l) => l.href === pathname)?.href ?? null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.header
        layout
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 28,
          mass: 0.6,
        }}
        className={cn(
          'pointer-events-auto backdrop-blur-xl transition-colors duration-300',
          scrolled
            ? 'mt-3 w-auto max-w-max rounded-full bg-card/90 border border-border/80 shadow-xl px-4 sm:px-5 py-2'
            : 'mt-0 w-full rounded-none bg-background/90 border-b border-border/80 shadow-xs px-6 sm:px-12 py-3.5'
        )}
      >
        <div
          className={cn(
            'mx-auto flex items-center justify-between',
            scrolled ? 'gap-4 sm:gap-6' : 'max-w-7xl gap-6 sm:gap-12'
          )}
        >
          {/* Logo Mark */}
          <motion.div layout="position" className="flex items-center gap-2">
            <Logo />
          </motion.div>

          {/* Desktop Links */}
          <nav
            className="hidden items-center md:flex"
            aria-label="Primary navigation"
          >
            <div
              className="relative flex items-center gap-1 rounded-full bg-muted/30 p-1 border border-border/40"
              onMouseLeave={() => setHoveredLink(null)}
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const isSelected = activeTarget === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onFocus={() => setHoveredLink(link.href)}
                    onBlur={() => setHoveredLink(null)}
                    className={cn(
                      'relative z-10 px-3.5 py-1.5 text-xs font-sans font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full',
                      isSelected
                        ? 'text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-background shadow-xs border border-border/80"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right Controls: Theme Toggle & Auth CTAs */}
          <motion.div layout="position" className="hidden items-center gap-2.5 md:flex">
            {mounted && (
              <motion.button
                whileHover={{ rotate: 15, scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </motion.button>
            )}

            {loading ? (
              <div className="h-8 w-32 animate-pulse rounded-full bg-muted/30 border border-border/40" />
            ) : user ? (
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button size="sm" className="rounded-full text-xs font-mono gap-1 font-semibold group">
                    <span>Dashboard</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="rounded-full text-xs font-mono text-muted-foreground hover:text-foreground">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button size="sm" className="rounded-full text-xs font-mono gap-1 font-semibold group">
                      <span>Get started</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </motion.div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden pt-3 border-t border-border/40 md:hidden mt-2"
            >
              <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-mono transition-colors',
                          isActive
                            ? 'text-foreground bg-muted font-bold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span>{link.label}</span>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent-brand" />}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="pt-3 mt-2 border-t border-border/40 flex gap-2">
                  {loading ? (
                    <div className="h-8 w-full animate-pulse rounded-full bg-muted/30 border border-border/40" />
                  ) : user ? (
                    <Link href="/dashboard" className="flex-1">
                      <Button size="sm" className="w-full rounded-full text-xs font-mono gap-1">
                        <span>Dashboard</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full rounded-full text-xs font-mono">
                          Log in
                        </Button>
                      </Link>
                      <Link href="/signup" className="flex-1">
                        <Button size="sm" className="w-full rounded-full text-xs font-mono gap-1">
                          <span>Get started</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}
