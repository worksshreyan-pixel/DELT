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

    // Update user profile with avatarUrl
    const admin = createAdminClient();
    const { error: dbError } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
