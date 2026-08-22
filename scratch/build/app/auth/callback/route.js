var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, searchParams, origin, code, tokenHash, type, next, supabase, error, otpType, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = new URL(request.url), searchParams = _a.searchParams, origin = _a.origin;
                    code = searchParams.get('code');
                    tokenHash = searchParams.get('token_hash');
                    type = searchParams.get('type');
                    next = searchParams.get('next') || '/dashboard';
                    return [4 /*yield*/, createServerSupabaseClient()];
                case 1:
                    supabase = _b.sent();
                    if (!code) return [3 /*break*/, 3];
                    return [4 /*yield*/, supabase.auth.exchangeCodeForSession(code)];
                case 2:
                    error = (_b.sent()).error;
                    if (!error) {
                        return [2 /*return*/, NextResponse.redirect("".concat(origin).concat(next))];
                    }
                    _b.label = 3;
                case 3:
                    if (!tokenHash) return [3 /*break*/, 5];
                    otpType = type || 'signup';
                    return [4 /*yield*/, supabase.auth.verifyOtp({
                            token_hash: tokenHash,
                            type: otpType,
                        })];
                case 4:
                    error = (_b.sent()).error;
                    if (!error) {
                        return [2 /*return*/, NextResponse.redirect("".concat(origin).concat(next))];
                    }
                    _b.label = 5;
                case 5: 
                // Gracefully return user to login with helpful error message
                return [2 /*return*/, NextResponse.redirect("".concat(origin, "/login?error=verification_link_expired"))];
            }
        });
    });
}
