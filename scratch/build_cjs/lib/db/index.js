"use strict";
// ==============================================================================
// DELT — Neon PostgreSQL Client & Drizzle ORM Instance
// Server-only connection with connection pooling & serverless resilience
// ==============================================================================
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.getDb = void 0;
const serverless_1 = require("@neondatabase/serverless");
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const schema = __importStar(require("./schema"));
// Enable WebSocket connection pooling for serverless transactions
serverless_1.neonConfig.fetchConnectionCache = true;
/**
 * Creates a serverless Drizzle ORM instance connected to Neon PostgreSQL.
 * Safe for Next.js API Routes and Server Components.
 */
function getDb() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('[Neon Database Error] DATABASE_URL is not set in environment variables.');
    }
    const pool = new serverless_1.Pool({ connectionString });
    return (0, neon_serverless_1.drizzle)(pool, { schema });
}
exports.getDb = getDb;
exports.db = process.env.DATABASE_URL
    ? (0, neon_serverless_1.drizzle)(new serverless_1.Pool({ connectionString: process.env.DATABASE_URL }), { schema })
    : null;
__exportStar(require("./schema"), exports);
