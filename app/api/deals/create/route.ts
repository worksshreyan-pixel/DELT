import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateDealToken, getDealPublicUrl } from '@/lib/deal-url';
import { sendDealInvitationEmail } from '@/lib/email';

import { FREE_PLAN_DEAL_LIMIT } from '@/lib/plans';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let clientName = '';
    let clientEmail = '';
    let clientCompany = '';
    let title = '';
    let description = '';
    let scope: string[] = [];
    let price = 0;
    let currency = 'INR';
    let deadline = '';
    let deliverables: string[] = [];
    let uploadedFiles: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      clientName = (formData.get('clientName') as string) || '';
      clientEmail = (formData.get('clientEmail') as string) || '';
      clientCompany = (formData.get('clientCompany') as string) || '';
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      price = Number(formData.get('price') || 0);
      currency = (formData.get('currency') as string) || 'INR';
      deadline = (formData.get('deadline') as string) || '';

      const rawScope = formData.get('scope') as string;
      if (rawScope) {
        try {
          scope = JSON.parse(rawScope);
        } catch {
          scope = [rawScope];
        }
      }

      const rawDeliverables = formData.get('deliverables') as string;
      if (rawDeliverables) {
        try {
          deliverables = JSON.parse(rawDeliverables);
        } catch {
          deliverables = [rawDeliverables];
        }
      }

      // Collect uploaded files
      const allEntries = formData.getAll('files');
      for (const entry of allEntries) {
        if (entry instanceof File && entry.size > 0) {
          uploadedFiles.push(entry);
        }
      }
    } else {
      const body = await request.json();
      clientName = body.clientName || '';
      clientEmail = body.clientEmail || '';
      clientCompany = body.clientCompany || '';
      title = body.title || '';
      description = body.description || '';
      price = Number(body.price || 0);
      currency = body.currency || 'INR';
      deadline = body.deadline || '';
      scope = Array.isArray(body.scope) ? body.scope : [];
      deliverables = Array.isArray(body.deliverables) ? body.deliverables : [];
    }

    if (!clientName.trim() || !clientEmail.trim() || !title.trim() || !price || price <= 0) {
      return NextResponse.json({ error: 'Missing required deal fields (Client name, email, project title, price).' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Check & ensure deal credit entitlement (configurable limit)
    let { data: creditRecord } = await admin
      .from('deal_credits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!creditRecord) {
      const { data: newCredit } = await admin
        .from('deal_credits')
        .insert({
          user_id: user.id,
          plan_id: 'free',
          total: FREE_PLAN_DEAL_LIMIT,
          used: 0,
          remaining: FREE_PLAN_DEAL_LIMIT,
        })
        .select()
        .single();
      creditRecord = newCredit;
    } else if (creditRecord.total < FREE_PLAN_DEAL_LIMIT) {
      // Auto-upgrade legacy 1-deal limit to the configurable limit
      await admin
        .from('deal_credits')
        .update({
          total: FREE_PLAN_DEAL_LIMIT,
          remaining: Math.max(0, FREE_PLAN_DEAL_LIMIT - (creditRecord.used || 0)),
        })
        .eq('user_id', user.id);
      creditRecord.total = FREE_PLAN_DEAL_LIMIT;
      creditRecord.remaining = Math.max(0, FREE_PLAN_DEAL_LIMIT - (creditRecord.used || 0));
    }

    if (creditRecord && creditRecord.remaining <= 0) {
      return NextResponse.json(
        { error: 'You have reached your plan limit for active Deals. Please upgrade to create more deals.' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    // Cryptographically secure canonical deal token
    const token = generateDealToken();

    // 2. Client management: find or create client
    let clientId: string | null = null;
    const { data: existingClient } = await admin
      .from('clients')
      .select('id, deal_count, total_value')
      .eq('creator_id', user.id)
      .eq('email', clientEmail.trim().toLowerCase())
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
      await admin
        .from('clients')
        .update({
          deal_count: existingClient.deal_count + 1,
          total_value: Number(existingClient.total_value) + price,
          last_activity_at: now,
        })
        .eq('id', existingClient.id);
    } else {
      const { data: newClient } = await admin
        .from('clients')
        .insert({
          creator_id: user.id,
          name: clientName.trim(),
          email: clientEmail.trim().toLowerCase(),
          company: clientCompany.trim() || null,
          deal_count: 1,
          total_value: price,
          currency,
          status: 'active',
          last_activity_at: now,
        })
        .select()
        .single();
      if (newClient) {
        clientId = newClient.id;
      }
    }

    // 3. Create Deal record
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .insert({
        token,
        creator_id: user.id,
        client_id: clientId,
        client_name: clientName.trim(),
        client_email: clientEmail.trim().toLowerCase(),
        title: title.trim(),
        description: description.trim() || null,
        scope: scope.length > 0 ? scope : ['Project requirements & delivery'],
        price: price,
        currency,
        status: 'in_progress',
        deadline: deadline || null,
        progress: 10,
        payment_status: 'pending',
        last_activity_at: now,
      })
      .select()
      .single();

    if (dealError || !deal) {
      console.error('Deal creation error:', dealError);
      return NextResponse.json({ error: dealError?.message || 'Failed to create deal' }, { status: 500 });
    }

    // 4. Create participants
    await admin.from('deal_participants').insert([
      {
        deal_id: deal.id,
        user_id: user.id,
        role: 'creator',
        email: user.email || '',
        display_name: user.user_metadata?.displayName || 'Creator',
      },
      {
        deal_id: deal.id,
        role: 'client',
        email: clientEmail.trim().toLowerCase(),
        display_name: clientName.trim(),
      },
    ]);

    // 5. Create deliverables
    const deliverableItems = deliverables.length > 0 ? deliverables : ['Final Project Deliverables'];
    let primaryDeliverableId = '';
    for (let i = 0; i < deliverableItems.length; i++) {
      const delName = deliverableItems[i];
      const { data: delivRecord } = await admin.from('deliverables').insert({
        deal_id: deal.id,
        name: delName,
        status: 'pending',
      }).select().single();
      if (i === 0 && delivRecord) {
        primaryDeliverableId = delivRecord.id;
      }
    }

    // 6. Handle file uploads if files were provided
    let uploadedFileItems: any[] = [];
    if (uploadedFiles.length > 0 && primaryDeliverableId) {
      for (const file of uploadedFiles) {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${deal.id}/v1/${Date.now()}_${cleanFileName}`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadErr } = await admin.storage
          .from('deal-files')
          .upload(storagePath, fileBuffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true,
          });

        if (!uploadErr) {
          uploadedFileItems.push({
            id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            path: storagePath,
          });
        }
      }

      if (uploadedFileItems.length > 0) {
        await admin.from('file_versions').insert({
          deliverable_id: primaryDeliverableId,
          deal_id: deal.id,
          version: 1,
          description: 'Initial project deliverable files',
          uploader_id: user.id,
          uploader_name: user.user_metadata?.displayName || 'Creator',
          files: uploadedFileItems,
          status: 'pending_review',
          locked: true,
        });

        // Update user storage usage
        const totalUploadedBytes = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
        const { data: stRecord } = await admin.from('storage_usage').select('*').eq('user_id', user.id).maybeSingle();
        if (stRecord) {
          await admin.from('storage_usage').update({
            total_bytes: Number(stRecord.total_bytes || 0) + totalUploadedBytes,
            files_bytes: Number(stRecord.files_bytes || 0) + totalUploadedBytes,
            updated_at: now,
          }).eq('user_id', user.id);
        }
      }
    }

    // 7. Initial Events & Greeting message
    await admin.from('deal_events').insert([
      {
        deal_id: deal.id,
        type: 'deal_created',
        actor_id: user.id,
        actor_name: user.user_metadata?.displayName || 'Creator',
        actor_role: 'creator',
        description: `Deal created for ${clientName} at ${price} ${currency}`,
      },
      {
        deal_id: deal.id,
        type: 'deal_shared',
        actor_id: user.id,
        actor_name: user.user_metadata?.displayName || 'Creator',
        actor_role: 'creator',
        description: `Private link generated for ${clientEmail}`,
      },
    ]);

    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: user.id,
      sender_name: user.user_metadata?.displayName || 'Creator',
      sender_role: 'creator',
      type: 'text',
      content: `Welcome to the Deal workspace! I have prepared the scope and details for "${title}". Feel free to chat, propose adjustments, or review progress right here.`,
    });

    // 8. Update credits
    if (creditRecord) {
      await admin
        .from('deal_credits')
        .update({
          used: creditRecord.used + 1,
          remaining: Math.max(0, creditRecord.remaining - 1),
          updated_at: now,
        })
        .eq('user_id', user.id);
    }

    // 9. Send Client Invitation Email
    const canonicalDealUrl = getDealPublicUrl(deal.token);
    const creatorDisplayName = user.user_metadata?.displayName || user.email?.split('@')[0] || 'Creator';

    const emailResult = await sendDealInvitationEmail({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      creatorName: creatorDisplayName,
      dealTitle: title.trim(),
      dealPrice: price,
      dealCurrency: currency,
      dealUrl: canonicalDealUrl,
    });

    if (emailResult.delivered) {
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'deal_shared',
        actor_name: 'DELT System',
        actor_role: 'system',
        description: `Invitation email delivered to ${clientEmail}`,
      });
    }

    return NextResponse.json({
      success: true,
      deal,
      token: deal.token,
      url: canonicalDealUrl,
      emailResult,
      filesUploaded: uploadedFileItems.length,
    });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
