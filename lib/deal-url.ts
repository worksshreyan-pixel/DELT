// ==============================================================================
// DELT — Canonical Deal URL & Token Helpers
// ==============================================================================

import crypto from 'crypto';
import { env } from '@/lib/env';

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
 *
 * Always derived from NEXT_PUBLIC_APP_URL — never window.location.origin — so
 * the value is identical on server and client (no hydration mismatch in the
 * Deal Card QR) and every scan/link lands on the canonical production origin,
 * even when the app is viewed from localhost or an internal host.
 */
export function getClientDealUrl(dealCode: string): string {
  const cleanBase = (env.app.url || 'http://localhost:3000').replace(/\/+$/, '');
  return `${cleanBase}/deal/${encodeURIComponent(dealCode)}`;
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
export function getDealPublicUrl(token: string): string {
  return getClientDealUrl(token);
}
