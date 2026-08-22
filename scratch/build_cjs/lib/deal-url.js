"use strict";
// ==============================================================================
// DELT — Canonical Deal URL & Token Helpers
// ==============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDealPublicUrl = exports.generateDealToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("@/lib/env");
/**
 * Generates a cryptographically secure, unguessable public/private Deal token.
 * Format: dlt_<32 hex chars>
 */
function generateDealToken() {
    return `dlt_${crypto_1.default.randomBytes(16).toString('hex')}`;
}
exports.generateDealToken = generateDealToken;
/**
 * Returns the canonical absolute URL for a Deal token.
 * Used consistently across:
 * - Copy Link
 * - Web Share API
 * - Transactional Invitation Emails
 * - Workspace Previews
 */
function getDealPublicUrl(token) {
    const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : (env_1.env.app.url || 'http://localhost:3000');
    // Strip trailing slashes
    const cleanBase = baseUrl.replace(/\/+$/, '');
    return `${cleanBase}/deal/${encodeURIComponent(token)}`;
}
exports.getDealPublicUrl = getDealPublicUrl;
