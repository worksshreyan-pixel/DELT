'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { setStoreUser, syncStoreFromSupabase, clearStoreState } from '@/lib/app-store';
import { FREE_PLAN_DEAL_LIMIT, FREE_PLAN_STORAGE_BYTES } from '@/lib/plans';
import type { User } from '@supabase/supabase-js';
import type { Profile, StorageUsage, DealCredit } from '@/lib/types';

export interface UserContextState {
  user: User | null;
  profile: Profile | null;
  storage: StorageUsage | null;
  credits: DealCredit | null;
  loading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUser(): UserContextState {
  const router = useRouter();
  const supabase = createClient();
  const isConfigured = hasSupabasePublicConfig();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [credits, setCredits] = useState<DealCredit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (authUser: User) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const userProfile: Profile = profileData
        ? (profileData as Profile)
        : {
            id: authUser.id,
            email: authUser.email || '',
            displayName: authUser.user_metadata?.displayName || authUser.email?.split('@')[0] || 'Creator',
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

      // Fetch storage
      const { data: storageData } = await supabase
        .from('storage_usage')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

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
      } else {
        setStorage({
          totalBytes: 0,
          limitBytes: FREE_PLAN_STORAGE_BYTES,
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
        setCredits(creditsData as DealCredit);
      } else {
        setCredits({
          planId: 'free',
          total: FREE_PLAN_DEAL_LIMIT,
          used: 0,
          remaining: FREE_PLAN_DEAL_LIMIT,
        });
      }
    } catch (err) {
      console.error('Error fetching user data from Supabase', err);
    }
  }, [supabase]);

  const refresh = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);
    if (authUser) {
      await fetchUserData(authUser);
    } else {
      setProfile(null);
      setStorage(null);
      setCredits(null);
    }
    setLoading(false);
  }, [supabase, isConfigured, fetchUserData]);

  useEffect(() => {
    refresh();

    if (!isConfigured) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        clearStoreState();
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
    clearStoreState();
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
