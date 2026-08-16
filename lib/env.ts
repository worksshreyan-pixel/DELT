// ==============================================================================
// DELT — Browser-Safe & Universal Environment Variable Access
// ==============================================================================

const isServer = typeof window === 'undefined';

/**
 * Validates whether Supabase public client credentials are configured.
 */
export function hasSupabasePublicConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-supabase-anon-key'
  );
}

/**
 * Validates whether Supabase server service role is configured (server-side only).
 */
export function hasSupabaseServerConfig(): boolean {
  if (!isServer) return false;
  return Boolean(
    hasSupabasePublicConfig() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-supabase-service-role-key'
  );
}

/**
 * Validates whether Razorpay is configured.
 */
export function hasRazorpayConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== 'rzp_test_your_key_id' &&
    (isServer ? Boolean(process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret') : true)
  );
}

/**
 * Validates whether Resend / Transactional Email is configured (server-side).
 */
export function hasEmailConfig(): boolean {
  const key = isServer ? (process.env.RESEND_API_KEY || '').trim() : '';
  return Boolean(key && key !== 're_your_resend_api_key');
}

/**
 * Returns the sanitized sender address.
 */
export function getSenderEmail(): string {
  const configured = (process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || '').trim();

  if (
    !configured ||
    configured.toLowerCase().includes('@gmail.com') ||
    configured.toLowerCase().includes('@yahoo.') ||
    configured.toLowerCase().includes('@hotmail.') ||
    configured.toLowerCase().includes('@outlook.')
  ) {
    return 'DELT <onboarding@resend.dev>';
  }
  return configured;
}

export const env = {
  supabase: {
    get url() {
      return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    },
    get anonKey() {
      return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    },
    get serviceRoleKey() {
      return isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY || '' : '';
    },
  },
  razorpay: {
    get keyId() {
      return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    },
    get keySecret() {
      return isServer ? process.env.RAZORPAY_KEY_SECRET || '' : '';
    },
    get webhookSecret() {
      return isServer ? process.env.RAZORPAY_WEBHOOK_SECRET || '' : '';
    },
  },
  email: {
    get resendApiKey() {
      return isServer ? (process.env.RESEND_API_KEY || '').trim() : '';
    },
    get from() {
      return getSenderEmail();
    },
  },
  app: {
    get url() {
      return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    },
    get fileRetentionDays() {
      return Number(process.env.FILE_RETENTION_DAYS || '30');
    },
  },
};
