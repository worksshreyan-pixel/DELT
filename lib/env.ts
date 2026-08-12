// ==============================================================================
// DELT — Environment Variable Validation & Helpers
// ==============================================================================

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
 * Validates whether Supabase server service role is configured.
 */
export function hasSupabaseServerConfig(): boolean {
  return Boolean(
    hasSupabasePublicConfig() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-supabase-service-role-key'
  );
}

/**
 * Validates whether Razorpay is configured for payment processing.
 */
export function hasRazorpayConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== 'rzp_test_your_key_id' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret'
  );
}

/**
 * Validates whether Resend / Transactional Email is configured.
 */
export function hasEmailConfig(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_API_KEY !== 're_your_resend_api_key'
  );
}

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  razorpay: {
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'DELT <deals@delt.app>',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};
