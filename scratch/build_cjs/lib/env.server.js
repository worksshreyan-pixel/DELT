"use strict";
// ==============================================================================
// DELT — Server-Only Environment Configuration & Secret Access
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSenderEmail = exports.hasRazorpayConfig = exports.hasSupabaseServerConfig = exports.hasEmailConfig = exports.serverEnv = void 0;
const env_1 = require("./env");
Object.defineProperty(exports, "hasEmailConfig", { enumerable: true, get: function () { return env_1.hasEmailConfig; } });
Object.defineProperty(exports, "hasSupabaseServerConfig", { enumerable: true, get: function () { return env_1.hasSupabaseServerConfig; } });
Object.defineProperty(exports, "hasRazorpayConfig", { enumerable: true, get: function () { return env_1.hasRazorpayConfig; } });
Object.defineProperty(exports, "getSenderEmail", { enumerable: true, get: function () { return env_1.getSenderEmail; } });
exports.serverEnv = {
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
        from: (0, env_1.getSenderEmail)(),
    },
    app: {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
};
