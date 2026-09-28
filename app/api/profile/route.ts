import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateUsername, normalizeUsername } from '@/lib/deal-url';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json({ profile: profile || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { username, displayName, bio, profession, company, avatarUrl } = body;

    if (username) {
      const valResult = validateUsername(username);
      if (!valResult.valid) {
        return NextResponse.json({ error: valResult.error }, { status: 400 });
      }

      const normalized = normalizeUsername(username);

      // Check unique username in profiles table (excluding current user)
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from('profiles')
        .select('id, username')
        .eq('username', normalized)
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: `Username "${normalized}" is already taken` }, { status: 400 });
      }
    }

    const admin = createAdminClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) updatePayload.username = normalizeUsername(username);
    if (displayName !== undefined) updatePayload.display_name = displayName;
    if (bio !== undefined) updatePayload.bio = bio;
    if (profession !== undefined) updatePayload.profession = profession;
    if (company !== undefined) updatePayload.company = company;
    if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl;

    const { data: updated, error } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        ...updatePayload,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
