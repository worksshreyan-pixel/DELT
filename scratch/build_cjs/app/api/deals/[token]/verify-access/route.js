"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const admin_1 = require("@/lib/supabase/admin");
const server_2 = require("@/lib/supabase/server");
const env_1 = require("@/lib/env");
const utils_1 = require("@/lib/utils");
async function POST(request, { params }) {
    try {
        const { token } = await params;
        if (!token) {
            return server_1.NextResponse.json({ error: 'Deal token is required.' }, { status: 400 });
        }
        if (!(0, env_1.hasSupabasePublicConfig)()) {
            return server_1.NextResponse.json({ error: 'Database is not configured.' }, { status: 500 });
        }
        const admin = (0, admin_1.createAdminClient)();
        // 1. Fetch deal by token
        const { data: dbDeal, error: dealError } = await admin
            .from('deals')
            .select('*')
            .eq('token', token)
            .maybeSingle();
        if (dealError || !dbDeal) {
            return server_1.NextResponse.json({ error: 'Deal not found or invalid link.' }, { status: 404 });
        }
        // Fetch creator profile for display
        const { data: creator } = await admin
            .from('profiles')
            .select('display_name, email, profession, company')
            .eq('id', dbDeal.creator_id)
            .maybeSingle();
        const expectedClientEmail = (dbDeal.client_email || '').trim().toLowerCase();
        const creatorId = dbDeal.creator_id;
        // 2. Check Supabase Auth user session from cookies
        const supabase = await (0, server_2.createServerSupabaseClient)();
        const { data: { user } } = await supabase.auth.getUser();
        // 3. Check custom signed client session token from header
        const clientSessionHeader = request.headers.get('x-client-session-token');
        const { verifyClientSessionToken } = await Promise.resolve().then(() => __importStar(require('@/lib/otp')));
        const hasValidClientToken = clientSessionHeader
            ? verifyClientSessionToken(clientSessionHeader, token, expectedClientEmail)
            : false;
        let isAuthorizedClient = false;
        let isCreator = false;
        let userEmail = '';
        if (user) {
            userEmail = (user.email || '').trim().toLowerCase();
            isAuthorizedClient = Boolean(userEmail && userEmail === expectedClientEmail);
            isCreator = Boolean(user.id === creatorId ||
                (user.email && creator?.email && user.email.toLowerCase() === creator.email.toLowerCase()));
        }
        else if (hasValidClientToken) {
            isAuthorizedClient = true;
            userEmail = expectedClientEmail;
        }
        // Unauthenticated user
        if (!user && !hasValidClientToken) {
            return server_1.NextResponse.json({
                authorized: false,
                dealExists: true,
                dealTitle: dbDeal.title,
                clientEmail: dbDeal.client_email,
                creatorName: creator?.display_name || 'Creator',
            });
        }
        // Unauthorized authenticated user
        if (!isAuthorizedClient && !isCreator) {
            return server_1.NextResponse.json({
                authorized: false,
                error: `You are signed in as ${user?.email || 'an unauthorized account'}, but this Deal workspace is private to ${dbDeal.client_email}.`,
                dealTitle: dbDeal.title,
                clientEmail: dbDeal.client_email,
                userEmail: user?.email,
            }, { status: 403 });
        }
        // If client is accessing, log verification event if not already logged recently
        if (isAuthorizedClient) {
            await admin.from('deal_events').insert({
                deal_id: dbDeal.id,
                type: 'client_verified',
                actor_id: userEmail,
                actor_name: dbDeal.client_name || 'Client',
                actor_role: 'client',
                description: `${dbDeal.client_name || 'Client'} accessed the private Deal workspace.`,
            });
        }
        // Authorized! Return complete deal workspace payload
        return server_1.NextResponse.json({
            authorized: true,
            deal: {
                id: dbDeal.id,
                token: dbDeal.token,
                creatorId: dbDeal.creator_id,
                clientId: dbDeal.client_id,
                clientName: dbDeal.client_name,
                clientEmail: dbDeal.client_email,
                title: dbDeal.title,
                description: (0, utils_1.parseDescription)(dbDeal.description).description,
                scope: Array.isArray(dbDeal.scope) ? dbDeal.scope : [],
                price: Number(dbDeal.price),
                currency: dbDeal.currency || 'INR',
                status: dbDeal.status || 'in_progress',
                deadline: dbDeal.deadline,
                progress: Number(dbDeal.progress || 0),
                paymentStatus: dbDeal.payment_status || 'pending',
                lastActivityAt: dbDeal.last_activity_at || dbDeal.created_at,
                createdAt: dbDeal.created_at,
                previewEnabled: (0, utils_1.parseDescription)(dbDeal.description).previewEnabled,
            },
            clientName: dbDeal.client_name,
            clientEmail: dbDeal.client_email,
            creatorName: creator?.display_name || 'Creator',
            role: isCreator ? 'creator' : 'client',
        });
    }
    catch (error) {
        console.error('Error verifying deal access:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Verification failed.' }, { status: 500 });
    }
}
exports.POST = POST;
