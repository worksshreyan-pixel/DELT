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
 * Returns the canonical absolute URL for a Deal token.
 * Used consistently across:
 * - Copy Link
 * - Web Share API
 * - Transactional Invitation Emails
 * - Workspace Previews
 */
export function getDealPublicUrl(token: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (env.app.url || 'http://localhost:3000');

  // Strip trailing slashes
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/deal/${encodeURIComponent(token)}`;
}
