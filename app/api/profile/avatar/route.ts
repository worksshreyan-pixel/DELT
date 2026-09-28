import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return NextResponse.json({ error: 'Avatar file size must not exceed 2MB' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WebP, and SVG images are allowed' }, { status: 400 });
    }

    // Convert file to Base64 data URI for immediate persistent storage
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const avatarUrl = `data:${file.type};base64,${base64}`;

    const admin = createAdminClient();

    // Check if user profile already exists
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      // Profile exists: update ONLY avatar_url and updated_at.
      // Do NOT touch display_name or other fields so NOT NULL constraints are never violated.
      const { error: dbError } = await admin
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) {
        console.error('Error updating avatar_url in profiles:', dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
    } else {
      // Profile does not exist: insert a new row providing all NOT NULL columns with clean fallbacks.
      const defaultDisplayName = user.user_metadata?.displayName || user.email?.split('@')[0] || 'Creator';
      const defaultUsername = user.user_metadata?.username || (user.email ? user.email.split('@')[0].replace(/[^a-z0-9_-]/gi, '').toLowerCase() : 'creator');

      const { error: dbError } = await admin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          display_name: defaultDisplayName,
          username: defaultUsername,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Error inserting profile with avatar_url:', dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err: any) {
    console.error('Unhandled error in POST /api/profile/avatar:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
