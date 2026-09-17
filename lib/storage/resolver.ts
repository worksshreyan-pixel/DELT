import { IStorageProvider } from './types';
import { storageRegistry } from './registry';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Resolves the appropriate storage provider for a user based on their explicit preference.
 *
 * Requirements:
 * - Checks `deals.storage_provider` and `deals.storage_connection_id` when `dealId` is provided.
 * - If `supabase`, resolves to Supabase.
 * - If `google_drive`, resolves to Google Drive explicitly bound to the deal's connection ID.
 * - If disconnected or mismatched, throws explicit error (No silent fallback).
 */
export async function resolveStorageProvider(userId: string, dealId?: string): Promise<IStorageProvider> {
  const admin = createAdminClient();

  if (!dealId) {
    throw new Error('resolveStorageProvider requires a dealId to determine the authoritative storage provider.');
  }

  // Fetch the authoritative deal configuration
  const { data: deal, error: dealErr } = await admin
    .from('deals')
    .select('storage_provider, storage_connection_id')
    .eq('id', dealId)
    .eq('creator_id', userId)
    .limit(1)
    .maybeSingle();

  if (dealErr || !deal) {
    throw new Error('Deal not found or unauthorized for storage resolution.');
  }

  const providerId = deal.storage_provider || 'supabase';

  // 1. If preference is Supabase, use it.
  if (providerId === 'supabase') {
    return storageRegistry.getProvider('supabase');
  }

  // 2. If preference is Google Drive, verify the specific connection.
  if (providerId === 'google_drive') {
    if (!deal.storage_connection_id) {
      throw new Error('Google Drive connection ID is missing on the deal.');
    }

    const { data: activeConnection } = await admin
      .from('storage_connections')
      .select('id')
      .eq('id', deal.storage_connection_id)
      .eq('user_id', userId)
      .eq('provider', 'google_drive')
      .eq('status', 'connected')
      .limit(1)
      .maybeSingle();

    if (!activeConnection) {
      throw new Error('Google Drive needs to be reconnected.');
    }

    return storageRegistry.getProvider('google_drive');
  }

  // Fallback for unknown preference
  throw new Error(`Unsupported storage provider: ${providerId}`);
}
