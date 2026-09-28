import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateDealToken, generateDealCode, getClientDealUrl, getCreatorUsername } from '@/lib/deal-url';
import { sendDealInvitationEmail, sendDealCreatedEmail } from '@/lib/email';
import { serializeDescription } from '@/lib/utils';
import {
  captureDeliverablesSnapshot,
  captureMilestonesSnapshot,
  getDefaultContractTerms,
} from '@/lib/contracts/state';

import { FREE_PLAN_DEAL_LIMIT } from '@/lib/plans';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export async function POST(request: Request) {
  console.log(`[DEAL_CREATE_START]`, JSON.stringify({
    timestamp: new Date().toISOString()
  }));
  try {
    const supabase = await createServerSupabaseClient();
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
    let previewEnabled = false;
    let previewFiles: File[] = [];
    let projectStructure = 'scope_and_milestones';
    let storageProvider = 'supabase';
    let storageConnectionId: string | null = null;
    let previewMode: 'AUTO' | 'MANUAL' | 'EXTERNAL' | 'NONE' = 'AUTO';
    let createAgreement = false;
    let createInvoice = false;
    let milestones: any[] = [];

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
      previewEnabled = formData.get('previewEnabled') === 'true';
      createAgreement = formData.get('createAgreement') === 'true';
      createInvoice = formData.get('createInvoice') === 'true';
      const rawPreviewMode = formData.get('previewMode') as string;
      if (rawPreviewMode) previewMode = rawPreviewMode as any;

      const rawMilestones = formData.get('milestones') as string;
      if (rawMilestones) {
        try {
          milestones = JSON.parse(rawMilestones);
        } catch {
          milestones = [];
        }
      }

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

      // Collect preview files
      const allPreviews = formData.getAll('previewFiles');
      for (const entry of allPreviews) {
        if (entry instanceof File && entry.size > 0) {
          previewFiles.push(entry);
        }
      }
      projectStructure = (formData.get('projectStructure') as string) || 'scope_and_milestones';
      storageProvider = (formData.get('storageProvider') as string) || 'supabase';
      storageConnectionId = (formData.get('storageConnectionId') as string) || null;
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
      previewEnabled = body.previewEnabled === true;
      createAgreement = body.createAgreement === true;
      createInvoice = body.createInvoice === true;
      milestones = Array.isArray(body.milestones) ? body.milestones : [];
      projectStructure = body.projectStructure || 'scope_and_milestones';
      storageProvider = body.storageProvider || 'supabase';
      storageConnectionId = body.storageConnectionId || null;
      if (body.previewMode) previewMode = body.previewMode;
    }

    // Validate provider-aware previewMode
    if (!previewEnabled) {
      previewMode = 'NONE';
      previewEnabled = false;
    } else if (storageProvider === 'google_drive') {
      if (previewMode !== 'EXTERNAL' && previewMode !== 'MANUAL') {
        previewMode = 'EXTERNAL';
      }
      previewEnabled = true;
    } else {
      if (previewMode !== 'NONE' && previewMode !== 'AUTO' && previewMode !== 'MANUAL') {
        previewMode = 'NONE';
      }
      previewEnabled = true;
    }

    const validStructures = ['none', 'scope', 'milestones', 'scope_and_milestones'];
    const structureToSave = validStructures.includes(projectStructure) ? projectStructure : 'scope_and_milestones';
    const hasScope = structureToSave === 'scope' || structureToSave === 'scope_and_milestones';

    if (!clientName.trim() || !clientEmail.trim() || !title.trim() || !price || price <= 0) {
      return NextResponse.json({ error: 'Missing required deal fields (Client name, email, project title, price).' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Validate Google Drive connection if selected
    if (storageProvider === 'google_drive') {
      if (!storageConnectionId) {
        return NextResponse.json({ error: 'Google Drive connection ID is missing.' }, { status: 400 });
      }
      const { data: activeConn } = await admin
        .from('storage_connections')
        .select('id')
        .eq('id', storageConnectionId)
        .eq('user_id', user.id)
        .eq('provider', 'google_drive')
        .eq('status', 'connected')
        .limit(1)
        .maybeSingle();

      if (!activeConn) {
        return NextResponse.json({ error: 'Selected Google Drive connection is invalid or disconnected.' }, { status: 403 });
      }
    } else {
      // Force null if not an external provider
      storageConnectionId = null;
    }

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
    const canonicalScope = scope.length > 0 ? scope : (deliverables.length > 0 ? deliverables : (hasScope ? ['Project requirements & delivery'] : ['Final Project Deliverable']));

    let deal: any = null;
    let dealError: any = null;
    
    for (let attempt = 0; attempt < 5; attempt++) {
      const dealCode = generateDealCode();
      
      const { data, error } = await admin
        .from('deals')
        .insert({
          deal_code: dealCode,
          token,
          creator_id: user.id,
          client_id: clientId,
          client_name: clientName.trim(),
          client_email: clientEmail.trim().toLowerCase(),
          title: title.trim(),
          description: serializeDescription(description.trim() || null, previewEnabled),
          scope: canonicalScope,
          project_structure: structureToSave,
          price: price,
          currency,
          status: 'in_progress',
          deadline: deadline || null,
          payment_status: 'pending',
          last_activity_at: now,
          storage_provider: storageProvider,
          storage_connection_id: storageConnectionId,
          preview_mode: previewMode,
        })
        .select()
        .single();
        
      if (error) {
        dealError = error;
        // Postgres unique violation code is '23505'
        if (error.code === '23505' || (error.message && error.message.includes('deal_code'))) {
          continue; // Try again
        }
        break; // Other error, don't retry
      }
      
      deal = data;
      dealError = null;
      break; // Success
    }

    if (dealError || !deal) {
      console.error('Deal creation error:', dealError);
      return NextResponse.json({ error: dealError?.message || 'Failed to create deal' }, { status: 500 });
    }

    console.log(`[DEAL_CREATED]`, JSON.stringify({
      dealId: deal.id,
      clientEmailMasked: maskEmail(deal.client_email),
      tokenPresent: Boolean(deal.token),
      timestamp: new Date().toISOString()
    }));

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
    const deliverableItems = canonicalScope;
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

    // 5b. Create Agreement Draft if explicitly requested by creator
    if (createAgreement) {
      try {
        const delivSnapshots = await captureDeliverablesSnapshot(deal.id, canonicalScope);
        const milestoneSnapshots = await captureMilestonesSnapshot(deal.id);
        const defaultTerms = getDefaultContractTerms(title.trim(), clientName.trim());

        const { data: newContract } = await admin
          .from('deal_contracts')
          .insert({
            deal_id: deal.id,
            status: 'draft',
          })
          .select()
          .single();

        if (newContract) {
          const { data: newVersion } = await admin
            .from('contract_versions')
            .insert({
              contract_id: newContract.id,
              deal_id: deal.id,
              version_number: 1,
              title: `${title.trim()} — Service Agreement`,
              terms_content: defaultTerms,
              price_snapshot: price,
              currency_snapshot: currency || 'INR',
              deliverables_snapshot: delivSnapshots,
              milestones_snapshot: milestoneSnapshots,
              created_by: user.id,
            })
            .select()
            .single();

          if (newVersion) {
            await admin
              .from('deal_contracts')
              .update({ current_version_id: newVersion.id })
              .eq('id', newContract.id);

            await admin.from('deal_events').insert({
              deal_id: deal.id,
              type: 'contract_created',
              actor_id: user.id,
              actor_name: user.user_metadata?.displayName || 'Creator',
              actor_role: 'creator',
              description: `Draft agreement initialized during deal creation.`,
            });
          }
        }
      } catch (cErr) {
        console.error('Non-blocking error initializing contract during deal creation:', cErr);
      }
    }

    // 5c. Create Initial Milestones if explicitly configured
    if (Array.isArray(milestones) && milestones.length > 0) {
      try {
        for (let i = 0; i < milestones.length; i++) {
          const m = milestones[i];
          const mTitle = typeof m === 'string' ? m : m.title;
          const mDesc = typeof m === 'object' ? m.description : null;
          const mDueDate = typeof m === 'object' ? m.dueDate : null;
          if (mTitle && mTitle.trim()) {
            await admin.from('milestones').insert({
              deal_id: deal.id,
              title: mTitle.trim(),
              description: mDesc ? mDesc.trim() : null,
              due_date: mDueDate || null,
              order: i,
              status: 'pending',
            });
          }
        }
        await admin.from('deal_events').insert({
          deal_id: deal.id,
          type: 'milestone_created',
          actor_id: user.id,
          actor_name: user.user_metadata?.displayName || 'Creator',
          actor_role: 'creator',
          description: `${milestones.length} milestone(s) initialized during deal creation.`,
        });
      } catch (mErr) {
        console.error('Non-blocking error initializing milestones during deal creation:', mErr);
      }
    }

    // 5d. Create Initial Draft Invoice if explicitly requested
    if (createInvoice) {
      try {
        const invoiceNumber = `DELT-INV-${Array.from({ length: 6 }, () =>
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
        ).join('')}`;

        const { data: newInvoice } = await admin
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            deal_id: deal.id,
            creator_id: user.id,
            client_id: clientId,
            status: 'draft',
            type: 'standard',
            currency: currency || 'INR',
            issue_date: now,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            subtotal: price,
            discount_amount: 0,
            tax_amount: 0,
            total_amount: price,
            amount_paid: 0,
            amount_due: price,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (newInvoice) {
          await admin.from('invoice_items').insert({
            invoice_id: newInvoice.id,
            description: `${title.trim()} — Professional Services`,
            quantity: 1,
            unit_price: price,
            line_total: price,
            sort_order: 0,
          });

          await admin.from('deal_events').insert({
            deal_id: deal.id,
            type: 'invoice_created',
            actor_id: user.id,
            actor_name: user.user_metadata?.displayName || 'Creator',
            actor_role: 'creator',
            description: `Draft invoice initialized during deal creation.`,
          });
        }
      } catch (iErr) {
        console.error('Non-blocking error initializing invoice during deal creation:', iErr);
      }
    }

    // 6. Handle file uploads (delegated to client direct upload)
    let uploadedFileItems: any[] = [];

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
    const { data: creatorProfile } = await admin.from('profiles').select('*').eq('id', user.id).single();
    const creatorUsername = getCreatorUsername(creatorProfile || { username: user.user_metadata?.username, email: user.email, display_name: user.user_metadata?.displayName });
    const canonicalDealUrl = getClientDealUrl(deal.deal_code, creatorUsername);
    const creatorDisplayName = creatorProfile?.display_name || user.user_metadata?.displayName || user.email?.split('@')[0] || 'Creator';

    console.log(`[INVITATION_EMAIL_START]`, JSON.stringify({
      dealId: deal.id,
      clientEmailMasked: maskEmail(clientEmail),
      timestamp: new Date().toISOString()
    }));

    // Client invitation (with the Deal Card) — the email the client receives.
    const invitationEmailResult = await sendDealInvitationEmail({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      creatorName: creatorDisplayName,
      dealTitle: title.trim(),
      dealPrice: price,
      dealCurrency: currency,
      dealUrl: canonicalDealUrl,
      dealCode: deal.deal_code || deal.id || '',
      dealStatus: deal.status || 'sent',
    });

    console.log(`[INVITATION_EMAIL_RESULT]`, JSON.stringify({
      dealId: deal.id,
      success: invitationEmailResult.success,
      delivered: invitationEmailResult.delivered,
      simulated: invitationEmailResult.simulated,
      messageId: invitationEmailResult.messageId || null,
      error: invitationEmailResult.error || null,
      timestamp: new Date().toISOString()
    }));

    if (invitationEmailResult.delivered) {
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'deal_shared',
        actor_name: 'DELT System',
        actor_role: 'system',
        description: `Invitation email delivered to ${clientEmail}`,
      });
    }

    // Creator confirmation (with the same Deal Card) — keep both sides in sync.
    await sendDealCreatedEmail({
      creatorEmail: user.email || '',
      creatorName: creatorDisplayName,
      dealTitle: title.trim(),
      dealCode: deal.deal_code || deal.id || '',
      dealUrl: canonicalDealUrl,
      clientName: clientName.trim(),
      dealPrice: price,
      dealCurrency: (currency as 'INR' | 'USD' | 'EUR' | 'GBP') || 'INR',
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      deal,
      token: deal.token,
      url: canonicalDealUrl,
      emailResult: invitationEmailResult,
      deliverableId: primaryDeliverableId,
      filesUploaded: 0,
    });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
