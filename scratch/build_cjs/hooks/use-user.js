"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUser = void 0;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const client_1 = require("@/lib/supabase/client");
const env_1 = require("@/lib/env");
const app_store_1 = require("@/lib/app-store");
const plans_1 = require("@/lib/plans");
function useUser() {
    const router = (0, navigation_1.useRouter)();
    const supabase = (0, client_1.createClient)();
    const isConfigured = (0, env_1.hasSupabasePublicConfig)();
    const [user, setUser] = (0, react_1.useState)(null);
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [storage, setStorage] = (0, react_1.useState)(null);
    const [credits, setCredits] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchUserData = (0, react_1.useCallback)(async (authUser) => {
        try {
            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();
            const userProfile = profileData
                ? profileData
                : {
                    id: authUser.id,
                    email: authUser.email || '',
                    displayName: authUser.user_metadata?.displayName || authUser.email?.split('@')[0] || 'Creator',
                    createdAt: authUser.created_at,
                    updatedAt: authUser.created_at,
                };
            setProfile(userProfile);
            // Link store to active user
            (0, app_store_1.setStoreUser)({
                id: authUser.id,
                email: userProfile.email,
                displayName: userProfile.displayName,
            });
            // Sync live records from Supabase
            (0, app_store_1.syncStoreFromSupabase)(authUser.id);
            // Fetch storage
            const { data: storageData } = await supabase
                .from('storage_usage')
                .select('*')
                .eq('user_id', authUser.id)
                .maybeSingle();
            if (storageData) {
                setStorage({
                    totalBytes: Number(storageData.total_bytes || 0),
                    limitBytes: Number(storageData.limit_bytes || plans_1.FREE_PLAN_STORAGE_BYTES),
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
                    limitBytes: plans_1.FREE_PLAN_STORAGE_BYTES,
                    breakdown: { files: 0, versions: 0, attachments: 0 },
                });
            }
            // Fetch credits
            const { data: creditsData } = await supabase
                .from('deal_credits')
                .select('*')
                .eq('user_id', authUser.id)
                .maybeSingle();
            if (creditsData) {
                setCredits(creditsData);
            }
            else {
                setCredits({
                    planId: 'free',
                    total: plans_1.FREE_PLAN_DEAL_LIMIT,
                    used: 0,
                    remaining: plans_1.FREE_PLAN_DEAL_LIMIT,
                });
            }
        }
        catch (err) {
            console.error('Error fetching user data from Supabase', err);
        }
    }, [supabase]);
    const refresh = (0, react_1.useCallback)(async () => {
        if (!isConfigured) {
            setLoading(false);
            return;
        }
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        if (authUser) {
            await fetchUserData(authUser);
        }
        else {
            setProfile(null);
            setStorage(null);
            setCredits(null);
        }
        setLoading(false);
    }, [supabase, isConfigured, fetchUserData]);
    (0, react_1.useEffect)(() => {
        refresh();
        if (!isConfigured)
            return;
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (currentUser) {
                await fetchUserData(currentUser);
            }
            else {
                (0, app_store_1.clearStoreState)();
                setProfile(null);
                setStorage(null);
                setCredits(null);
            }
            setLoading(false);
        });
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase, isConfigured, refresh, fetchUserData]);
    const signOut = async () => {
        (0, app_store_1.clearStoreState)();
        if (isConfigured) {
            await supabase.auth.signOut();
        }
        setUser(null);
        setProfile(null);
        setStorage(null);
        setCredits(null);
        router.push('/login');
        router.refresh();
    };
    return {
        user,
        profile,
        storage,
        credits,
        loading,
        isConfigured,
        signOut,
        refresh,
    };
}
exports.useUser = useUser;
