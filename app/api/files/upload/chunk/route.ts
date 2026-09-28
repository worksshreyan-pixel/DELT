import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = request.headers.get('x-upload-session-id');
    const contentRange = request.headers.get('content-range');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing x-upload-session-id header' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify upload session in DB
    const { data: session, error: sessionErr } = await admin
      .from('upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionErr || !session) {
      return NextResponse.json(
        { error: 'Google Drive upload session expired. Please retry the upload.' },
        { status: 404 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized session access' }, { status: 403 });
    }

    if (session.status !== 'pending') {
      return NextResponse.json({ error: `Upload session is ${session.status}` }, { status: 400 });
    }

    if (new Date() > new Date(session.expires_at)) {
      return NextResponse.json(
        { error: 'Google Drive upload session expired. Please retry the upload.' },
        { status: 404 }
      );
    }

    if (!session.session_uri) {
      return NextResponse.json({ error: 'Missing Google Drive session URI' }, { status: 400 });
    }

    // Read the chunk payload from the request
    const chunkBuffer = await request.arrayBuffer();

    const headers: Record<string, string> = {
      'Content-Type': request.headers.get('content-type') || 'application/octet-stream',
      'Content-Length': String(chunkBuffer.byteLength),
    };

    if (contentRange) {
      headers['Content-Range'] = contentRange;
    }

    // Forward the chunk server-to-server to Google Drive session URI
    const googleRes = await fetch(session.session_uri, {
      method: 'PUT',
      headers,
      body: chunkBuffer,
    });

    const resStatus = googleRes.status;
    const resText = await googleRes.text();

    const responseHeaders = new Headers();

    const googleRange = googleRes.headers.get('Range');
    if (googleRange) {
      responseHeaders.set('Range', googleRange);
    }

    if (resStatus === 308) {
      return new NextResponse(resText, {
        status: 308,
        headers: responseHeaders,
      });
    }

    if (resStatus === 200 || resStatus === 201) {
      responseHeaders.set('Content-Type', 'application/json');
      return new NextResponse(resText, {
        status: resStatus,
        headers: responseHeaders,
      });
    }

    if (resStatus === 404) {
      return NextResponse.json(
        { error: 'Google Drive upload session expired. Please retry the upload.' },
        { status: 404 }
      );
    }

    if (resStatus === 401 || resStatus === 403) {
      return NextResponse.json(
        { error: 'Google Drive authorization is no longer valid. Reconnect Google Drive.' },
        { status: resStatus }
      );
    }

    if (resStatus === 429) {
      return NextResponse.json(
        { error: 'Google Drive rate limit reached. Retrying...' },
        { status: 429 }
      );
    }

    if (resStatus >= 500) {
      return NextResponse.json(
        { error: `Google Drive temporary server error (${resStatus})` },
        { status: resStatus }
      );
    }

    return new NextResponse(resText, {
      status: resStatus,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error('[GOOGLE_UPLOAD_CHUNK_PROXY_ERROR]', error);
    return NextResponse.json(
      { error: error?.message || 'Network error during Google Drive chunk proxying' },
      { status: 500 }
    );
  }
}
