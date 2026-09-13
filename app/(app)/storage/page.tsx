import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StorageClient from './storage-client';

export const metadata = {
  title: 'Storage | DELT',
  description: 'Manage your storage providers and usage.',
};

export default async function StoragePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch storage connections for the authenticated user
  const { data: connections, error } = await supabase
    .from('storage_connections')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching storage connections:', error);
  }

  return <StorageClient initialConnections={connections || []} />;
}
