import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: methods } = await admin
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ success: true, methods: methods || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
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
    const { type, label, accountNumber, upiId, bankName, ifscCode } = body;

    if (!type || !label) {
      return NextResponse.json({ error: 'Payment method type and label are required' }, { status: 400 });
    }

    // Mask sensitive details — NO raw card numbers or private credentials stored
    let maskedDetails: Record<string, any> = {};

    if (type === 'bank_account') {
      if (!accountNumber || !ifscCode) {
        return NextResponse.json({ error: 'Bank account number and IFSC code are required' }, { status: 400 });
      }
      const cleanAcc = accountNumber.toString().trim();
      maskedDetails = {
        bankName: bankName || 'Bank Account',
        accountLast4: cleanAcc.slice(-4),
        maskedAccount: `•••• •••• ${cleanAcc.slice(-4)}`,
        ifscCode: ifscCode.toString().trim().toUpperCase(),
      };
    } else if (type === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        return NextResponse.json({ error: 'Please enter a valid UPI ID (e.g. name@bank)' }, { status: 400 });
      }
      const cleanUpi = upiId.toString().trim().toLowerCase();
      const parts = cleanUpi.split('@');
      const maskedUser = parts[0].length > 2 ? `${parts[0].slice(0, 2)}***` : parts[0];
      maskedDetails = {
        upiId: cleanUpi,
        maskedUpi: `${maskedUser}@${parts[1]}`,
      };
    } else {
      maskedDetails = { info: 'Saved payment token' };
    }

    const admin = createAdminClient();

    // Check if first payment method -> set as default
    const { count } = await admin
      .from('payment_methods')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const isFirst = (count || 0) === 0;

    const { data: newMethod, error } = await admin
      .from('payment_methods')
      .insert({
        user_id: user.id,
        type,
        provider: 'razorpay',
        label,
        details: maskedDetails,
        is_default: isFirst,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, method: newMethod });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const methodId = searchParams.get('id');

    if (!methodId) {
      return NextResponse.json({ error: 'Method ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('payment_methods')
      .delete()
      .eq('id', methodId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
