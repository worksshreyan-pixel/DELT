'use client';
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
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { setStoreUser, syncStoreFromSupabase, clearStoreState } from '@/lib/app-store';
import { FREE_PLAN_DEAL_LIMIT, FREE_PLAN_STORAGE_BYTES } from '@/lib/plans';
export function useUser() {
    var _this = this;
    var router = useRouter();
    var supabase = createClient();
    var isConfigured = hasSupabasePublicConfig();
    var _a = useState(null), user = _a[0], setUser = _a[1];
    var _b = useState(null), profile = _b[0], setProfile = _b[1];
    var _c = useState(null), storage = _c[0], setStorage = _c[1];
    var _d = useState(null), credits = _d[0], setCredits = _d[1];
    var _e = useState(true), loading = _e[0], setLoading = _e[1];
    var fetchUserData = useCallback(function (authUser) { return __awaiter(_this, void 0, void 0, function () {
        var profileData, userProfile, storageData, creditsData, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', authUser.id)
                            .maybeSingle()];
                case 1:
                    profileData = (_c.sent()).data;
                    userProfile = profileData
                        ? profileData
                        : {
                            id: authUser.id,
                            email: authUser.email || '',
                            displayName: ((_a = authUser.user_metadata) === null || _a === void 0 ? void 0 : _a.displayName) || ((_b = authUser.email) === null || _b === void 0 ? void 0 : _b.split('@')[0]) || 'Creator',
                            createdAt: authUser.created_at,
                            updatedAt: authUser.created_at,
                        };
                    setProfile(userProfile);
                    // Link store to active user
                    setStoreUser({
                        id: authUser.id,
                        email: userProfile.email,
                        displayName: userProfile.displayName,
                    });
                    // Sync live records from Supabase
                    syncStoreFromSupabase(authUser.id);
                    return [4 /*yield*/, supabase
                            .from('storage_usage')
                            .select('*')
                            .eq('user_id', authUser.id)
                            .maybeSingle()];
                case 2:
                    storageData = (_c.sent()).data;
                    if (storageData) {
                        setStorage({
                            totalBytes: Number(storageData.total_bytes || 0),
                            limitBytes: Number(storageData.limit_bytes || FREE_PLAN_STORAGE_BYTES),
                            breakdown: {
                                files: Number(storageData.files_bytes || 0),
                                versions: Number(storageData.versions_bytes || 0),
                                attachments: Number(storageData.attachments_bytes || 0),
                            },
                        });
                    }
                    else {
                        setStorage({
                            totalBytes: 0,
                            limitBytes: FREE_PLAN_STORAGE_BYTES,
                            breakdown: { files: 0, versions: 0, attachments: 0 },
                        });
                    }
                    return [4 /*yield*/, supabase
                            .from('deal_credits')
                            .select('*')
                            .eq('user_id', authUser.id)
                            .maybeSingle()];
                case 3:
                    creditsData = (_c.sent()).data;
                    if (creditsData) {
                        setCredits(creditsData);
                    }
                    else {
                        setCredits({
                            planId: 'free',
                            total: FREE_PLAN_DEAL_LIMIT,
                            used: 0,
                            remaining: FREE_PLAN_DEAL_LIMIT,
                        });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _c.sent();
                    console.error('Error fetching user data from Supabase', err_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [supabase]);
    var refresh = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var authUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isConfigured) {
                        setLoading(false);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 1:
                    authUser = (_a.sent()).data.user;
                    setUser(authUser);
                    if (!authUser) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetchUserData(authUser)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    setProfile(null);
                    setStorage(null);
                    setCredits(null);
                    _a.label = 4;
                case 4:
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); }, [supabase, isConfigured, fetchUserData]);
    useEffect(function () {
        refresh();
        if (!isConfigured)
            return;
        var authListener = supabase.auth.onAuthStateChange(function (event, session) { return __awaiter(_this, void 0, void 0, function () {
            var currentUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        currentUser = (session === null || session === void 0 ? void 0 : session.user) || null;
                        setUser(currentUser);
                        if (!currentUser) return [3 /*break*/, 2];
                        return [4 /*yield*/, fetchUserData(currentUser)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        clearStoreState();
                        setProfile(null);
                        setStorage(null);
                        setCredits(null);
                        _a.label = 3;
                    case 3:
                        setLoading(false);
                        return [2 /*return*/];
                }
            });
        }); }).data;
        return function () {
            authListener.subscription.unsubscribe();
        };
    }, [supabase, isConfigured, refresh, fetchUserData]);
    var signOut = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearStoreState();
                    if (!isConfigured) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase.auth.signOut()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    setUser(null);
                    setProfile(null);
                    setStorage(null);
                    setCredits(null);
                    router.push('/login');
                    router.refresh();
                    return [2 /*return*/];
            }
        });
    }); };
    return {
        user: user,
        profile: profile,
        storage: storage,
        credits: credits,
        loading: loading,
        isConfigured: isConfigured,
        signOut: signOut,
        refresh: refresh,
    };
}
