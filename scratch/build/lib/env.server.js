// ==============================================================================
// DELT — Server-Only Environment Configuration & Secret Access
// ==============================================================================
import { hasEmailConfig, hasSupabaseServerConfig, hasRazorpayConfig, getSenderEmail } from './env';
export var serverEnv = {
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
        resendApiKey: (process.env.RESEND_API_KEY || '').trim(),
        from: getSenderEmail(),
    },
    app: {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
};
export { hasEmailConfig, hasSupabaseServerConfig, hasRazorpayConfig, getSenderEmail };
