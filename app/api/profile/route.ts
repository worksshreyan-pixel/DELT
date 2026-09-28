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

    // Check if profile exists
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let updated = null;
    let error = null;

    if (existingProfile) {
      // Profile exists: update ONLY the provided fields in updatePayload
      const res = await admin
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select('*')
        .single();
      updated = res.data;
      error = res.error;
    } else {
      // Profile does not exist: insert a new row with required column defaults
      const defaultDisplayName = displayName || user.user_metadata?.displayName || user.email?.split('@')[0] || 'Creator';
      const defaultUsername = updatePayload.username || (user.email ? normalizeUsername(user.email.split('@')[0]) : 'creator');

      const res = await admin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          display_name: defaultDisplayName,
          username: defaultUsername,
          ...updatePayload,
        })
        .select('*')
        .single();
      updated = res.data;
      error = res.error;
    }

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
