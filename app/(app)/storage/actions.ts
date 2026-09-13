'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function disconnectStorageConnection(connectionId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Soft-disconnect the connection.
  // We preserve the row, do not delete or modify storage_objects,
  // and do not delete any physical external files.
  const { error } = await supabase
    .from('storage_connections')
    .update({ 
      status: 'disconnected', 
      disconnected_at: new Date().toISOString() 
    })
    .eq('id', connectionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to disconnect storage:', error);
    throw new Error('Failed to disconnect storage.');
  }

  revalidatePath('/storage');
}
