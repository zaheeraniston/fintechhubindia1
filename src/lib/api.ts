import { supabase } from './supabase';

/**
 * Client-Side API Helper mapping Next.js routes directly to Supabase queries
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : null;

  // 1. Authentication Endpoints
  if (path === '/auth/me') {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) throw new Error('Not authenticated');

    const user = session.user;
    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      // If profile doesn't exist yet, return safe defaults from session metadata
      return {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || '',
        mobile: user.user_metadata?.mobile || '',
        processId: user.user_metadata?.process_id || '',
        referralId: '',
        sponsorId: user.user_metadata?.sponsor_id || '',
        role: 'customer',
        status: 'active',
        profilePhoto: '',
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      mobile: profile.mobile,
      processId: profile.process_id,
      referralId: profile.referral_id,
      sponsorId: profile.sponsor_id,
      role: profile.role,
      status: profile.status,
      profilePhoto: profile.profile_photo,
    };
  }

  if (path === '/auth/login') {
    const { email, password } = body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // Store token locally (optional, Supabase client handles session automatically)
    if (data.session) {
      localStorage.setItem('fintech_token', data.session.access_token);
    }

    let userProfile: any = null;
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      userProfile = {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name || data.user.user_metadata?.full_name || '',
        mobile: profile?.mobile || data.user.user_metadata?.mobile || '',
        processId: profile?.process_id || data.user.user_metadata?.process_id || '',
        referralId: profile?.referral_id || '',
        sponsorId: profile?.sponsor_id || data.user.user_metadata?.sponsor_id || '',
        role: profile?.role || 'customer',
        status: profile?.status || 'active',
        profilePhoto: profile?.profile_photo || '',
      };
    }

    return { token: data.session?.access_token, user: userProfile };
  }

  // ── Forgot Password Request ──
  if (path === '/auth/forgot-password') {
    const { email } = body;
    if (!email) throw new Error('Email is required');

    // Verify if user exists in public.users to prevent sending resets to unregistered emails
    const { data: userExists, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) throw new Error(checkError.message);
    if (!userExists) throw new Error('No account found with this email address.');

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);

    return { success: true };
  }

  // ── Reset Password with OTP ──
  if (path === '/auth/reset-password') {
    const { email, token, password } = body;
    if (!email || !token || !password) {
      throw new Error('Email, reset token, and password are required');
    }

    // Step 1: Verify OTP (this authenticates the session)
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (verifyError) throw new Error(verifyError.message || 'Invalid or expired reset token');

    // Step 2: Update the password for the currently authenticated session
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    if (updateError) throw new Error(updateError.message);

    // Step 3: Sign out so they must log in manually with the new password
    await supabase.auth.signOut();

    return { success: true };
  }

  // ── Daily Access Code Verification (for signup page pre-check) ──
  if (path === '/auth/verify-access-code') {
    const { code } = body;
    if (!code || !code.trim()) {
      return { valid: false, message: 'Please enter the daily access code.' };
    }
    const { data, error } = await supabase.rpc('verify_daily_access_code', { p_code: code.trim() });
    if (error) return { valid: false, message: 'Verification failed. Try again.' };
    if (data?.valid) {
      return { valid: true, message: 'Access code verified!' };
    }
    const reason = data?.reason;
    if (reason === 'no_code_set') {
      return { valid: false, message: 'Access code not set for today. Contact support.' };
    }
    return { valid: false, message: 'Invalid access code. Contact WhatsApp support to get today\'s code.' };
  }

  if (path === '/auth/signup') {
    const { email, password, fullName, mobile, processId, sponsorId, dailyAccessCode } = body;

    // ── STEP 1: Verify Daily Access Code (MANDATORY) ──
    const { data: codeCheck, error: codeError } = await supabase.rpc('verify_daily_access_code', {
      p_code: (dailyAccessCode || '').trim()
    });
    if (codeError || !codeCheck?.valid) {
      const reason = codeCheck?.reason;
      if (reason === 'no_code_set') {
        throw new Error('Access code not configured for today. Contact support.');
      }
      throw new Error('Invalid Daily Access Code. Contact WhatsApp support to get today\'s code.');
    }

    // ── STEP 2: Validate sponsor code exists ──
    if (sponsorId) {
      const { data: sponsor } = await supabase
        .from('users')
        .select('id')
        .eq('referral_id', sponsorId)
        .maybeSingle();

      if (!sponsor) {
        throw new Error('Invalid Sponsor ID. Sponsor code does not exist.');
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          mobile: mobile,
          process_id: processId,
          sponsor_id: sponsorId,
          role: 'customer',
        },
      },
    });

    if (error) throw new Error(error.message);

    let token = data.session?.access_token || '';
    if (token) {
      localStorage.setItem('fintech_token', token);
    }

    let userProfile: any = null;
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      userProfile = {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name || data.user.user_metadata?.full_name || '',
        mobile: profile?.mobile || data.user.user_metadata?.mobile || '',
        processId: profile?.process_id || data.user.user_metadata?.process_id || '',
        referralId: profile?.referral_id || '',
        sponsorId: profile?.sponsor_id || data.user.user_metadata?.sponsor_id || '',
        role: profile?.role || 'customer',
        status: profile?.status || 'active',
        profilePhoto: profile?.profile_photo || '',
      };
    }

    return { success: true, token, user: userProfile };
  }

  if (path.startsWith('/users/validate-sponsor')) {
    const params = new URLSearchParams(path.split('?')[1]);
    const code = params.get('code');
    if (!code) return { valid: false };

    const { data, error } = await supabase
      .from('users')
      .select('full_name')
      .eq('referral_id', code)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) return { valid: false };
    return { valid: true, name: data.full_name, sponsorName: data.full_name };
  }

  // ── Notifications Endpoints ──
  if (path.startsWith('/notifications')) {
    // ── Edit (update) an existing broadcast ──
    if (method === 'PUT' && path.startsWith('/notifications/') && path !== '/notifications/send-broadcast' && path !== '/notifications/mark-read') {
      const id = path.split('/')[2];
      const { title, message, type } = body;
      const { data, error } = await supabase
        .from('notifications')
        .update({ title, message, type })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { success: true, data };
    }

    if (path === '/notifications/send-broadcast') {
      const { title, message, type } = body;
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          type: type || 'info',
          user_id: null
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Fan-out Web Push to all subscribed devices (fire-and-forget, don't block UI)
      supabase.functions
        .invoke('send-push', { body: { title, message, type: type || 'info' } })
        .catch((e) => console.warn('[Push] Fan-out error:', e));

      return { success: true, data };
    }

    if (path === '/notifications/mark-read') {
      const { notificationId, userId } = body;
      if (notificationId) {
        // Only update database for user-specific notifications to avoid marking broadcast read for everyone
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .not('user_id', 'is', null);
        if (error) throw new Error(error.message);
        return { success: true };
      } else if (userId) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId);
        if (error) throw new Error(error.message);
        return { success: true };
      }
    }

    if (method === 'DELETE') {
      const params = new URLSearchParams(path.split('?')[1] || '');
      const id = params.get('id');
      if (!id) throw new Error('Notification ID is required');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    }

    if (method === 'GET') {
      const params = new URLSearchParams(path.split('?')[1] || '');
      const userId = params.get('userId');
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = data.map((n) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        createdAt: n.created_at,
      }));
      return { data: mapped };
    }
  }

  // 2. Apps Catalog Endpoints
  if (path === '/apps' || path.startsWith('/apps?')) {
    if (method === 'GET') {
      const queryStr = path.includes('?') ? path.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const statusParam = params.get('status');

      let query = supabase
        .from('app_catalog')
        .select('*');

      if (statusParam) {
        query = query.eq('status', statusParam);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });
      if (error) throw error;
      const mapped = data.map((app) => ({
        id: app.id,
        appName: app.app_name,
        referralLink: app.referral_link,
        amount: app.amount,
        status: app.status,
        iconUrl: app.icon_url,
        sortOrder: app.sort_order,
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { appName, referralLink, amount, status, iconUrl, sortOrder } = body;
      const { data, error } = await supabase
        .from('app_catalog')
        .insert({
          app_name: appName,
          referral_link: referralLink,
          amount,
          status,
          icon_url: iconUrl || '',
          sort_order: sortOrder || 0,
        })
        .select()
        .single();
      if (error) throw error;

      // Log audit action
      await logAuditAction('CREATE_APP', `Created app ${appName} with payout ₹${amount}`);

      return data;
    }
  }

  if (path.startsWith('/apps/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { appName, referralLink, amount, status, iconUrl, sortOrder } = body;
      const { data, error } = await supabase
        .from('app_catalog')
        .update({
          app_name: appName,
          referral_link: referralLink,
          amount,
          status,
          icon_url: iconUrl,
          sort_order: sortOrder,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('UPDATE_APP', `Updated app ${appName} (payout ₹${amount})`);
      return data;
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('app_catalog').delete().eq('id', id);
      if (error) throw error;

      await logAuditAction('DELETE_APP', `Deleted app ID: ${id}`);
      return { success: true };
    }
  }

  // 3. Active Links Endpoints
  if (path === '/links') {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('active_links')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const mapped = data.map((l) => ({
        id: l.id,
        appName: l.app_name,
        link: l.link,
        status: l.status,
        sortOrder: l.sort_order,
        logoUrl: l.logo_url || '',
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { appName, link, status, sortOrder, logoUrl } = body;
      const { data, error } = await supabase
        .from('active_links')
        .insert({
          app_name: appName,
          link,
          status,
          sort_order: sortOrder || 0,
          logo_url: logoUrl || '',
        })
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('CREATE_LINK', `Created link for ${appName}`);
      return data;
    }
  }

  if (path.startsWith('/links/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { appName, link, status, sortOrder, logoUrl } = body;
      const { data, error } = await supabase
        .from('active_links')
        .update({
          app_name: appName,
          link,
          status,
          sort_order: sortOrder,
          logo_url: logoUrl,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('UPDATE_LINK', `Updated active link ${appName}`);
      return data;
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('active_links').delete().eq('id', id);
      if (error) throw error;

      await logAuditAction('DELETE_LINK', `Deleted active link ID: ${id}`);
      return { success: true };
    }
  }

  // 4. Reports Endpoints
  if (path === '/reports' || path.startsWith('/reports?')) {
    if (method === 'GET') {
      const queryStr = path.includes('?') ? path.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const statusFilter = params.get('status');
      const userIdFilter = params.get('userId');

      let query = supabase
        .from('reports')
        .select('*, app_catalog(app_name), users(full_name, email, process_id, referral_id)')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (userIdFilter) {
        query = query.eq('user_id', userIdFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        appId: r.app_id,
        appName: r.app_catalog?.app_name || 'Unknown App',
        name: r.name,
        phone: r.phone,
        accountOpenDate: r.account_open_date,
        status: r.status,
        tradeSubmitted: r.trade_submitted,
        amount: r.amount,
        adminNotes: r.admin_notes,
        createdAt: r.created_at,
        user: r.users ? {
          fullName: r.users.full_name,
          email: r.users.email,
          processId: r.users.process_id,
          referralId: r.users.referral_id
        } : undefined,
        app: r.app_catalog ? { appName: r.app_catalog.app_name, amount: r.amount } : undefined,
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { appId, name, phone, accountOpenDate } = body;

      // Fetch current app amount to lock it in
      const { data: app } = await supabase
        .from('app_catalog')
        .select('amount')
        .eq('id', appId)
        .single();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          app_id: appId,
          name,
          phone,
          account_open_date: accountOpenDate,
          status: 'pending',
          trade_submitted: false,
          amount: app?.amount || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  if (path.startsWith('/reports/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { status, adminNotes, tradeSubmitted } = body;

      if (status === 'done') {
        const { data: rpcData, error: rpcError } = await supabase.rpc('approve_and_credit_report', {
          p_report_id: id,
          p_admin_notes: adminNotes || ''
        });
        if (rpcError) throw new Error(rpcError.message);

        const { data: r, error: fetchError } = await supabase
          .from('reports')
          .select('*, app_catalog(app_name), users(full_name, email, process_id, referral_id)')
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;

        return {
          id: r.id,
          userId: r.user_id,
          appId: r.app_id,
          appName: r.app_catalog?.app_name || 'Unknown App',
          name: r.name,
          phone: r.phone,
          accountOpenDate: r.account_open_date,
          status: r.status,
          tradeSubmitted: r.trade_submitted,
          amount: r.amount,
          adminNotes: r.admin_notes,
          createdAt: r.created_at,
          user: r.users ? {
            fullName: r.users.full_name,
            email: r.users.email,
            processId: r.users.process_id,
            referralId: r.users.referral_id
          } : undefined,
          app: r.app_catalog ? { appName: r.app_catalog.app_name, amount: r.amount } : undefined,
        };
      }

      const updatePayload: Record<string, any> = {};
      if (status !== undefined) updatePayload.status = status;
      if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;
      if (tradeSubmitted !== undefined) updatePayload.trade_submitted = tradeSubmitted;

      const { data, error } = await supabase
        .from('reports')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('UPDATE_REPORT', `Updated report ${id} status to ${status || 'unchanged'}`);
      return data;
    }
  }

  if (path.startsWith('/reports-history/')) {
    const reportId = path.split('/')[2];
    const { data, error } = await supabase
      .from('report_status_history')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  // 5. Payouts Endpoints
  if (path === '/payouts' || path.startsWith('/payouts?')) {
    if (method === 'GET') {
      const queryStr = path.includes('?') ? path.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const userIdFilter = params.get('userId');

      let query = supabase
        .from('payouts')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false });

      if (userIdFilter) {
        query = query.eq('user_id', userIdFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        accountNumber: p.account_number,
        ifscCode: p.ifsc_code,
        accountHolderName: p.account_holder_name,
        branchName: p.branch_name,
        upiId: p.upi_id,
        upiName: p.upi_name,
        adminNotes: p.admin_notes,
        createdAt: p.created_at,
        user: p.users ? { fullName: p.users.full_name, email: p.users.email } : undefined,
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { amount, method: payMethod, bankDetails, upiDetails } = body;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check available balance before allowing payout
      const summary = await apiFetch('/income/summary');
      console.log('[DEBUG] Payout summary:', summary);

      const balance = summary.data?.lifetime?.availableBalance ?? summary.lifetime?.availableBalance ?? summary.data?.data?.lifetime?.availableBalance ?? 0;

      // Calculate total pending/processing payout requests to prevent double spending
      const { data: pendingPayouts, error: pendingErr } = await supabase
        .from('payouts')
        .select('amount')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);

      if (pendingErr) throw pendingErr;

      const pendingAmount = pendingPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const withdrawableBalance = balance - pendingAmount;

      if (amount > balance) {
        throw new Error(`Insufficient balance. Available: ₹${balance}`);
      }

      if (amount > withdrawableBalance) {
        throw new Error(`Insufficient balance. You have pending/processing payout requests of ₹${pendingAmount}. Maximum withdrawable balance is ₹${withdrawableBalance}`);
      }

      const insertPayload: Record<string, any> = {
        user_id: user.id,
        amount,
        method: payMethod,
        status: 'pending',
      };

      if (payMethod === 'bank') {
        const accountNumber = bankDetails?.accountNumber || body.accountNumber;
        const ifscCode = bankDetails?.ifscCode || body.ifscCode;
        const accountHolderName = bankDetails?.accountHolderName || body.accountHolderName;
        const branchName = bankDetails?.branchName || body.branchName;

        insertPayload.account_number = accountNumber;
        insertPayload.ifsc_code = ifscCode;
        insertPayload.account_holder_name = accountHolderName;
        insertPayload.branch_name = branchName;
      } else {
        const upiId = upiDetails?.upiId || body.upiId;
        const upiName = upiDetails?.upiName || body.upiName;

        insertPayload.upi_id = upiId;
        insertPayload.upi_name = upiName;
      }

      const { data, error } = await supabase
        .from('payouts')
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;

      return data;
    }
  }

  if (path.startsWith('/payouts/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { status, adminNotes } = body;
      const { data: payout } = await supabase.from('payouts').select('*').eq('id', id).single();

      const { data, error } = await supabase
        .from('payouts')
        .update({ status, admin_notes: adminNotes })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // If transitioned to completed, insert debit
      if (status === 'completed' && payout.status !== 'completed') {
        await supabase.from('income_ledger').insert({
          user_id: payout.user_id,
          amount: payout.amount,
          type: 'debit',
          source: 'payout',
          description: `Payout withdrawal completed of ₹${payout.amount}`,
        });
      }

      // If transitioned OUT of completed (reversal/accident correction):
      if (payout.status === 'completed' && status !== 'completed') {
        await supabase.from('income_ledger').insert({
          user_id: payout.user_id,
          amount: payout.amount,
          type: 'credit',
          source: 'adjustment',
          description: `Refund for reversed completed payout (ID: ${id}): ${adminNotes || ''}`,
        });
      }

      await logAuditAction('PROCESS_PAYOUT', `Payout request ID ${id} set to ${status}`);
      return data;
    }
  }

  // 5b. Passive Payouts Endpoints
  if (path === '/passive-payouts' || path.startsWith('/passive-payouts?')) {
    if (method === 'GET') {
      const queryStr = path.includes('?') ? path.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const userIdFilter = params.get('userId');

      let query = supabase
        .from('passive_payouts')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false });

      if (userIdFilter) {
        query = query.eq('user_id', userIdFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        accountNumber: p.account_number,
        ifscCode: p.ifsc_code,
        accountHolderName: p.account_holder_name,
        branchName: p.branch_name,
        upiId: p.upi_id,
        upiName: p.upi_name,
        adminNotes: p.admin_notes,
        createdAt: p.created_at,
        user: p.users ? { fullName: p.users.full_name, email: p.users.email } : undefined,
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { amount, method: payMethod, bankDetails, upiDetails } = body;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check available passive balance
      const passiveSummary = await apiFetch('/income/passive');
      const balance = passiveSummary.totalPassive || 0;
      
      const { data: pendingPayouts, error: pendingErr } = await supabase
        .from('passive_payouts')
        .select('amount')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);
      
      if (pendingErr) throw pendingErr;
      
      const pendingAmount = pendingPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const withdrawableBalance = balance; // balance already subtracts all requested payouts now

      if (amount > withdrawableBalance) {
        throw new Error(`Insufficient passive balance. Maximum withdrawable is ₹${withdrawableBalance}`);
      }

      const insertPayload: Record<string, any> = {
        user_id: user.id,
        amount,
        method: payMethod,
        status: 'pending',
      };

      if (payMethod === 'bank') {
        const accountNumber = bankDetails?.accountNumber || body.accountNumber;
        const ifscCode = bankDetails?.ifscCode || body.ifscCode;
        const accountHolderName = bankDetails?.accountHolderName || body.accountHolderName;
        const branchName = bankDetails?.branchName || body.branchName;

        insertPayload.account_number = accountNumber;
        insertPayload.ifsc_code = ifscCode;
        insertPayload.account_holder_name = accountHolderName;
        insertPayload.branch_name = branchName;
      } else {
        const upiId = upiDetails?.upiId || body.upiId;
        const upiName = upiDetails?.upiName || body.upiName;

        insertPayload.upi_id = upiId;
        insertPayload.upi_name = upiName;
      }

      const { data, error } = await supabase
        .from('passive_payouts')
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;

      return data;
    }
  }

  if (path.startsWith('/passive-payouts/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { status, adminNotes } = body;
      
      const { data, error } = await supabase
        .from('passive_payouts')
        .update({ status, admin_notes: adminNotes })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('PROCESS_PASSIVE_PAYOUT', `Passive Payout request ID ${id} set to ${status}`);
      return data;
    }
  }

  // 6. Trainings Endpoints
  if (path === '/trainings') {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const mapped = data.map((t) => ({
        id: t.id,
        title: t.title,
        youtubeUrl: t.youtube_url,
        status: t.status,
        sortOrder: t.sort_order,
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { title, youtubeUrl, status, sortOrder } = body;
      const { data, error } = await supabase
        .from('trainings')
        .insert({ title, youtube_url: youtubeUrl, status, sort_order: sortOrder || 0 })
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('CREATE_TRAINING', `Created training video ${title}`);
      return data;
    }
  }

  if (path.startsWith('/trainings/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { title, youtubeUrl, status, sortOrder } = body;
      const { data, error } = await supabase
        .from('trainings')
        .update({ title, youtube_url: youtubeUrl, status, sort_order: sortOrder })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('UPDATE_TRAINING', `Updated training ${title}`);
      return data;
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('trainings').delete().eq('id', id);
      if (error) throw error;

      await logAuditAction('DELETE_TRAINING', `Deleted training ID: ${id}`);
      return { success: true };
    }
  }

  // 6b. Q&A Videos Endpoints
  if (path === '/qnas') {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('qna_videos')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const mapped = data.map((t) => ({
        id: t.id,
        title: t.title,
        youtubeUrl: t.youtube_url,
        status: t.status,
        sortOrder: t.sort_order,
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { title, youtubeUrl, status, sortOrder } = body;
      const { data, error } = await supabase
        .from('qna_videos')
        .insert({ title, youtube_url: youtubeUrl, status, sort_order: sortOrder || 0 })
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('CREATE_QNA', `Created Q&A video: ${title}`);
      return data;
    }
  }

  if (path.startsWith('/qnas/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { title, youtubeUrl, status, sortOrder } = body;
      const { data, error } = await supabase
        .from('qna_videos')
        .update({ title, youtube_url: youtubeUrl, status, sort_order: sortOrder })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('UPDATE_QNA', `Updated Q&A video: ${title}`);
      return data;
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('qna_videos').delete().eq('id', id);
      if (error) throw error;

      await logAuditAction('DELETE_QNA', `Deleted Q&A video ID: ${id}`);
      return { success: true };
    }
  }

  if (path === '/leaderboard') {
    if (method === 'GET') {
      const { data: latestDateData } = await supabase
        .from('leaderboard_entries')
        .select('date_label')
        .order('date_label', { ascending: false })
        .limit(1);

      const latestDate = latestDateData?.[0]?.date_label || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*, users(full_name, email, profile_photo)')
        .eq('date_label', latestDate)
        .order('rank', { ascending: true });
      if (error) throw error;
      const mapped = data.map((l: any) => ({
        id: l.id,
        userId: l.user_id,
        fullName: l.users?.full_name || 'System User',
        email: l.users?.email || '',
        earnings: l.earnings,
        rank: l.rank,
        period: l.period,
        dateLabel: l.date_label,
        isOverridden: l.is_overridden,
        user: l.users ? {
          fullName: l.users.full_name,
          profilePhoto: l.users.profile_photo || '',
        } : {
          fullName: 'System User',
          profilePhoto: '',
        }
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { userId, earnings, rank, period, dateLabel, isOverridden } = body;
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .insert({
          user_id: userId,
          earnings,
          rank,
          period,
          date_label: dateLabel || '',
          is_overridden: isOverridden || false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  if (path === '/leaderboard/all-time') {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('all_time_leaderboard')
        .select('*')
        .order('earnings', { ascending: false });
      if (error) throw error;
      return {
        data: data.map((l: any) => ({
          userId: l.user_id,
          earnings: parseFloat(l.earnings || '0'),
          fullName: l.full_name || 'System User',
          profilePhoto: l.profile_photo || ''
        }))
      };
    }
  }

  if (path.startsWith('/leaderboard/monthly')) {
    if (method === 'GET') {
      const params = new URLSearchParams(path.split('?')[1] || '');
      const month = params.get('month');
      
      let query = supabase
        .from('monthly_leaderboard')
        .select('*')
        .order('earnings', { ascending: false });
        
      if (month) {
        query = query.eq('month_label', month);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const { data: monthsData } = await supabase
        .from('monthly_leaderboard')
        .select('month_label')
        .order('month_label', { ascending: false });
        
      const uniqueMonths = Array.from(new Set(monthsData?.map((m: any) => m.month_label) || []));
      
      return {
        data: data.map((l: any) => ({
          userId: l.user_id,
          earnings: parseFloat(l.earnings || '0'),
          monthLabel: l.month_label,
          fullName: l.full_name || 'System User',
          profilePhoto: l.profile_photo || ''
        })),
        months: uniqueMonths
      };
    }
  }

  if (path.startsWith('/leaderboard/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { earnings, rank, period, dateLabel, isOverridden } = body;
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .update({ earnings, rank, period, date_label: dateLabel, is_overridden: isOverridden })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('leaderboard_entries').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    }
  }

  // 8. Seasons Endpoints
  if (path === '/seasons') {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      const mapped = data.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        meetingType: s.meeting_type,
        meetingLink: s.meeting_link,
        startDate: s.start_date,
        status: s.status,
      }));
      return { data: mapped };
    }
    if (method === 'POST') {
      const { title, description, meetingType, meetingLink, startDate, status } = body;
      const { data, error } = await supabase
        .from('seasons')
        .insert({
          title,
          description,
          meeting_type: meetingType,
          meeting_link: meetingLink,
          start_date: startDate,
          status,
        })
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('CREATE_SEASON', `Scheduled webinar: ${title}`);
      return data;
    }
  }

  if (path.startsWith('/seasons/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { title, description, meetingType, meetingLink, startDate, status } = body;
      const { data, error } = await supabase
        .from('seasons')
        .update({
          title,
          description,
          meeting_type: meetingType,
          meeting_link: meetingLink,
          start_date: startDate,
          status,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('UPDATE_SEASON', `Updated webinar: ${title}`);
      return data;
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('seasons').delete().eq('id', id);
      if (error) throw error;

      await logAuditAction('DELETE_SEASON', `Deleted webinar ID: ${id}`);
      return { success: true };
    }
  }

  // 9. Downline Endpoints
  if (path.startsWith('/downline') || path === '/downline') {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Not authenticated');

    const params = new URLSearchParams(path.split('?')[1] || '');
    let targetUserId = params.get('userId') || currentUser.id;

    // Check if the current user is an admin to authorize querying other downlines
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (profile?.role !== 'admin') {
      targetUserId = currentUser.id; // Customers can only query their own downline
    }

    const { data, error } = await supabase.rpc('get_downline', { p_user_id: targetUserId });
    if (error) throw error;

    const flat = data.map((m: any) => ({
      id: m.id,
      fullName: m.full_name,
      email: m.email,
      mobile: m.mobile,
      processId: m.process_id,
      sponsorId: m.sponsor_id,
      referralId: m.referral_id,
      level: m.level,
      reportCount: parseInt(m.report_count || '0'),
      totalEarnings: parseFloat(m.total_earnings || '0'),
    }));

    // Calculate level breakdown statistics
    const levelMap: Record<number, number> = {};
    let maxLevel = 0;
    flat.forEach((m) => {
      levelMap[m.level] = (levelMap[m.level] || 0) + 1;
      if (m.level > maxLevel) maxLevel = m.level;
    });

    const levelBreakdown = Object.entries(levelMap).map(([lvl, cnt]) => ({
      level: parseInt(lvl),
      count: cnt,
    })).sort((a, b) => a.level - b.level);

    // Build recursive tree from flat list using sponsor referral codes
    const treeMap: Record<string, any> = {};
    const treeRoots: any[] = [];

    flat.forEach((item) => {
      treeMap[item.referralId] = { ...item, children: [] };
    });

    flat.forEach((item) => {
      const node = treeMap[item.referralId];
      const parentNode = treeMap[item.sponsorId];
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        if (item.level === 1) {
          treeRoots.push(node);
        }
      }
    });

    return {
      data: flat,
      tree: treeRoots,
      meta: {
        totalDownline: flat.length,
        maxLevel,
        levelBreakdown,
      },
    };
  }

  // 10. Global Settings Endpoints
  if (path === '/settings') {
    if (method === 'GET') {
      const { data, error } = await supabase.from('global_settings').select('key, value');
      if (error) throw error;
      const settings: Record<string, string> = {};
      data.forEach((s) => {
        settings[s.key] = s.value;
      });
      return { map: settings };
    }
    if (method === 'PUT') {
      const entries = Object.entries(body);
      for (const [key, value] of entries) {
        await supabase
          .from('global_settings')
          .upsert({ key, value: String(value) }, { onConflict: 'key' });
      }

      await logAuditAction('UPDATE_SETTINGS', 'Updated global settings configuration');
      return { success: true };
    }
    if (method === 'POST') {
      const { key, value } = body;
      if (!key) throw new Error('Missing key in settings POST');
      await supabase
        .from('global_settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });

      await logAuditAction('UPDATE_SETTINGS', `Updated setting: ${key}`);
      return { success: true };
    }
  }

  // 11. Income Ledger Summary Endpoints
  if (path === '/income/summary') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_income_summary', { p_user_id: user.id });
    if (error) throw error;
    return { data };
  }

  if (path === '/income/ledger') {
    const { data, error } = await supabase
      .from('income_ledger')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((l) => ({
      id: l.id,
      amount: l.amount,
      type: l.type,
      source: l.source,
      description: l.description,
      createdAt: l.created_at,
    }));
  }

  // Passive Income Transactions for logged-in customer
  if (path === '/income/passive') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('passive_income_transactions')
      .select('*, source_report:reports(name, phone, amount, created_at, app_catalog(app_name))')
      .eq('beneficiary_user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const { data: payouts } = await supabase
      .from('passive_payouts')
      .select('amount')
      .eq('user_id', user.id)
      .neq('status', 'rejected');
      
    const totalWithdrawn = payouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const totalPassive = data.reduce((sum: number, t: any) => sum + parseFloat(t.commission_amount || '0'), 0) - totalWithdrawn;

    return {
      data: data.map((t: any) => {
        const commRate = parseFloat(t.commission_percentage || '0') / 100;
        const sourceAmt = t.source_report ? parseFloat(t.source_report.amount || '0') : (commRate > 0 ? parseFloat(t.commission_amount || '0') / commRate : 0);
        return {
          id: t.transaction_id || t.id,
          beneficiaryUserId: t.beneficiary_user_id,
          sourceUserId: t.source_user_id,
          sourceReportId: t.source_report_id,
          transactionType: t.transaction_type === 'PASSIVE_LEVEL_1' ? 'l1_commission' : (t.transaction_type === 'PASSIVE_LEVEL_2' ? 'l2_commission' : t.transaction_type),
          commissionAmount: parseFloat(t.commission_amount || '0'),
          commissionRate: commRate,
          sourceAmount: sourceAmt,
          notes: t.notes,
          createdAt: t.created_at,
          sourceReport: t.source_report ? {
            name: t.source_report.name,
            phone: t.source_report.phone,
            amount: t.source_report.amount,
            appName: t.source_report.app_catalog?.app_name,
          } : null,
        };
      }),
      totalPassive,
    };
  }

  // Admin: All passive commissions (with optional userId filter)
  if (path === '/admin/passive-commissions' || path.startsWith('/admin/passive-commissions?')) {
    const queryStr = path.includes('?') ? path.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const userIdFilter = params.get('userId');

    let query = supabase
      .from('passive_income_transactions')
      .select('*, beneficiary:users!passive_income_transactions_beneficiary_user_id_fkey(full_name, email, process_id), source_report:reports(name, amount, app_catalog(app_name))')
      .order('created_at', { ascending: false });

    if (userIdFilter) {
      query = query.eq('beneficiary_user_id', userIdFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      data: data.map((t: any) => {
        const commRate = parseFloat(t.commission_percentage || '0') / 100;
        const sourceAmt = t.source_report ? parseFloat(t.source_report.amount || '0') : (commRate > 0 ? parseFloat(t.commission_amount || '0') / commRate : 0);
        return {
          id: t.transaction_id || t.id,
          beneficiaryUserId: t.beneficiary_user_id,
          sourceUserId: t.source_user_id,
          sourceReportId: t.source_report_id,
          transactionType: t.transaction_type === 'PASSIVE_LEVEL_1' ? 'l1_commission' : (t.transaction_type === 'PASSIVE_LEVEL_2' ? 'l2_commission' : t.transaction_type),
          commissionAmount: parseFloat(t.commission_amount || '0'),
          commissionRate: commRate,
          sourceAmount: sourceAmt,
          notes: t.notes,
          createdAt: t.created_at,
          beneficiary: t.beneficiary ? {
            fullName: t.beneficiary.full_name,
            email: t.beneficiary.email,
            processId: t.beneficiary.process_id,
          } : null,
          sourceReport: t.source_report ? {
            name: t.source_report.name,
            amount: t.source_report.amount,
            appName: t.source_report.app_catalog?.app_name,
          } : null,
        };
      }),
    };
  }

  // 12. Notifications Endpoints
  if (path === '/notifications') {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    if (method === 'POST') {
      const { userId, title, message, type } = body;
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type: type || 'info',
          is_read: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  if (path.startsWith('/notifications/')) {
    const id = path.split('/')[2];
    if (method === 'PUT') {
      const { isRead } = body;
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: isRead })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  // 13. Audit Log Endpoints
  if (path === '/admin/audit-logs') {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, users(email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const mapped = data.map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      email: a.users?.email || 'System / Auto',
      action: a.action,
      target: a.target,
      details: a.details,
      createdAt: a.created_at,
    }));
    return { data: mapped };
  }

  // 14-A. Admin Stats Endpoint — accurate counts directly from DB (no pagination)
  if (path === '/admin/stats') {
    // Total users (excluding admins for "customer" count)
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalCustomers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('role', 'customer');

    // Reports
    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    const { count: pendingReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: doneReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'done');

    // Payouts
    const { count: totalPayouts } = await supabase
      .from('payouts')
      .select('*', { count: 'exact', head: true });

    const { count: pendingPayouts } = await supabase
      .from('payouts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Apps
    const { count: activeApps } = await supabase
      .from('app_catalog')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: totalApps } = await supabase
      .from('app_catalog')
      .select('*', { count: 'exact', head: true });

    return {
      data: {
        totalUsers: totalUsers ?? 0,
        totalCustomers: totalCustomers ?? 0,
        activeUsers: activeUsers ?? 0,
        totalReports: totalReports ?? 0,
        pendingReports: pendingReports ?? 0,
        doneReports: doneReports ?? 0,
        totalPayouts: totalPayouts ?? 0,
        pendingPayouts: pendingPayouts ?? 0,
        activeApps: activeApps ?? 0,
        totalApps: totalApps ?? 0,
      },
    };
  }

  // 14. Admin Users Management Endpoints
  if (path === '/admin/users' || path === '/users' || path.startsWith('/users?') || path.startsWith('/admin/users?')) {
    const queryStr = path.includes('?') ? path.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const searchVal = params.get('search') || '';
    const pageVal = parseInt(params.get('page') || '1');
    const limitVal = parseInt(params.get('limit') || '20');

    let query = supabase.from('users').select('*');

    if (searchVal) {
      query = query.or(`full_name.ilike.%${searchVal}%,email.ilike.%${searchVal}%,process_id.ilike.%${searchVal}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: users, error: uError } = await query;
    if (uError) throw uError;

    const { data: incomeList } = await supabase
      .from('v_user_income')
      .select('user_id, total_credits, total_debits, available_balance');

    const incomeMap: Record<string, any> = {};
    incomeList?.forEach((i) => {
      incomeMap[i.user_id] = i;
    });

    const mappedUsers = users.map((u) => {
      const userInc = incomeMap[u.id] || { total_credits: 0, total_debits: 0, available_balance: 0 };
      return {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        mobile: u.mobile,
        processId: u.process_id,
        referralId: u.referral_id,
        sponsorId: u.sponsor_id,
        role: u.role,
        status: u.status,
        profilePhoto: u.profile_photo,
        createdAt: u.created_at,
        totalEarnings: parseFloat(userInc.total_credits || '0'),
        availableBalance: parseFloat(userInc.available_balance || '0'),
      };
    });

    const offset = (pageVal - 1) * limitVal;
    const paginatedUsers = mappedUsers.slice(offset, offset + limitVal);

    return {
      data: paginatedUsers,
      pagination: {
        total: mappedUsers.length,
        page: pageVal,
        limit: limitVal,
      }
    };
  }

  if (path.startsWith('/admin/users/') || path.startsWith('/users/')) {
    const parts = path.split('/');
    const id = parts[parts.length - 1];
    if (method === 'PUT') {
      const { fullName, mobile, role, status } = body;
      const { data, error } = await supabase
        .from('users')
        .update({ full_name: fullName, mobile, role, status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('UPDATE_USER_PROFILE', `Admin updated profile for user: ${fullName} (${id})`);
      return data;
    }
    if (method === 'DELETE') {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'terminated' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAuditAction('TERMINATE_USER', `Admin terminated user ID: ${id}`);
      return { success: true };
    }
  }

  throw new Error(`Endpoint not mapped: ${method} ${path}`);
}

/**
 * File upload helper using Supabase Storage
 */
export async function apiUpload(path: string, formData: FormData) {
  if (path === '/upload') {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // Photo size restriction: less than 500KB
    if (file.size > 500 * 1024) {
      throw new Error('Profile photo must be less than 500KB');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload to 'uploads' bucket
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // Update user profile photo
    const { error: dbError } = await supabase
      .from('users')
      .update({ profile_photo: publicUrl })
      .eq('id', user.id);

    if (dbError) throw dbError;

    return { success: true, url: publicUrl };
  }

  // Founder photo upload (admin)
  if (path === '/upload/founder') {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const filePath = `founder-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // Update global settings
    await supabase
      .from('global_settings')
      .upsert({ key: 'founderPhoto', value: publicUrl }, { onConflict: 'key' });

    await logAuditAction('UPLOAD_FOUNDER_PHOTO', `Uploaded new founder image: ${filePath}`);
    return { success: true, url: publicUrl };
  }

  throw new Error(`Upload path not mapped: ${path}`);
}

/**
 * Helper to write system audit logs
 */
async function logAuditAction(action: string, details: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action,
      details,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
