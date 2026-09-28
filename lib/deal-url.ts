// ==============================================================================
// DELT — Canonical Deal URL & Token Helpers
// ==============================================================================

import crypto from 'crypto';
import { env } from '@/lib/env';

export const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'deals',
  'auth',
  'login',
  'signup',
  'creator',
  'settings',
  'clients',
  'invoices',
  'notifications',
  'pricing',
  'privacy',
  'terms',
  'storage',
  'templates',
  'dashboard',
  'transactions',
  'security',
  'about',
  'how-it-works',
  'help',
  'support',
  'user',
  'users',
  'profile',
  'profiles',
  'delt',
]);

/**
 * Validates a username against length, character, and reserved-word constraints.
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  const trimmed = username.trim();
  const normalized = trimmed.toLowerCase();
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  if (normalized.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters long' };
  }
  if (!/^[a-z0-9_-]+$/.test(normalized)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return { valid: false, error: `"${normalized}" is a reserved system name` };
  }
  return { valid: true };
}

/**
 * Generates an SVG Data URI avatar based on initials for default/fallback display.
 */
export function generateDefaultAvatarDataUrl(nameOrUsername?: string): string {
  const clean = (nameOrUsername || 'DELT').trim();
  const initials = clean
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'D';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="#0F172A"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#38BDF8" font-family="sans-serif" font-size="44" font-weight="bold">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Normalizes a username for safe URL path consumption.
 * Trims, converts to lowercase, and strips invalid characters.
 */
export function normalizeUsername(input?: string | null): string {
  if (!input || typeof input !== 'string') return 'creator';
  const clean = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  return clean || 'creator';
}

/**
 * Helper to extract canonical creator username from profile or metadata.
 */
export function getCreatorUsername(profile?: { username?: string | null; display_name?: string | null; displayName?: string | null; email?: string | null } | null): string {
  if (!profile) return 'creator';
  if (profile.username && profile.username.trim()) {
    return normalizeUsername(profile.username);
  }
  const name = profile.displayName || profile.display_name;
  if (name && name.trim()) {
    return normalizeUsername(name);
  }
  if (profile.email && profile.email.includes('@')) {
    return normalizeUsername(profile.email.split('@')[0]);
  }
  return 'creator';
}

/**
 * Generates a cryptographically secure, unguessable public/private Deal token.
 * Format: dlt_<32 hex chars>
 */
export function generateDealToken(): string {
  return `dlt_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Generates a shorter, user-friendly Deal Code for URLs.
 * Format: DLT-<8 uppercase alphanumeric>
 */
export function generateDealCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, 1, O, 0
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return `DLT-${code}`;
}

/**
 * Returns the canonical absolute URL for a Client Deal Workspace.
 * Format: /{creatorUsername}/{dealCode} (e.g. /shreyan/DLT-XCYK336T)
 *
 * Always derived from NEXT_PUBLIC_APP_URL — never window.location.origin — so
 * the value is identical on server and client (no hydration mismatch) and every
 * link lands on the canonical production origin.
 */
export function getClientDealUrl(dealCode: string, creatorUsername?: string): string {
  const cleanBase = (env.app.url || 'http://localhost:3000').replace(/\/+$/, '');
  const username = normalizeUsername(creatorUsername);
  return `${cleanBase}/${encodeURIComponent(username)}/${encodeURIComponent(dealCode)}`;
}

/**
 * Returns the canonical absolute URL for a Creator Deal Dashboard.
 * Environment-derived — see getClientDealUrl.
 */
export function getCreatorDealUrl(dealCode: string): string {
  const cleanBase = (env.app.url || 'http://localhost:3000').replace(/\/+$/, '');
  return `${cleanBase}/deals/${encodeURIComponent(dealCode)}`;
}

/**
 * @deprecated Use getClientDealUrl instead.
 */
export function getDealPublicUrl(token: string, creatorUsername?: string): string {
  return getClientDealUrl(token, creatorUsername);
}
