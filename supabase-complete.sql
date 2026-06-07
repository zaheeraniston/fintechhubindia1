-- ============================================================
-- FINTECH HUB INDIA - Refined Database Schema for Supabase
-- ============================================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean up existing structures if they exist (for a fresh start)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_income_summary(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_downline(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.build_downline_tree() CASCADE;
DROP FUNCTION IF EXISTS public.log_report_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.credit_income_on_report_done() CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.approve_and_credit_report(UUID, TEXT) CASCADE;

DROP VIEW IF EXISTS public.v_user_income CASCADE;

DROP TABLE IF EXISTS public.passive_income_transactions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.active_links CASCADE;
DROP TABLE IF EXISTS public.seasons CASCADE;
DROP TABLE IF EXISTS public.leaderboard_entries CASCADE;
DROP TABLE IF EXISTS public.trainings CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.income_ledger CASCADE;
DROP TABLE IF EXISTS public.report_status_history CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.app_catalog CASCADE;
DROP TABLE IF EXISTS public.global_settings CASCADE;
DROP TABLE IF EXISTS public.downline_members CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.report_status CASCADE;
DROP TYPE IF EXISTS public.payout_status CASCADE;
DROP TYPE IF EXISTS public.payout_method CASCADE;
DROP TYPE IF EXISTS public.ledger_type CASCADE;
DROP TYPE IF EXISTS public.ledger_source CASCADE;
DROP TYPE IF EXISTS public.entity_status CASCADE;
DROP TYPE IF EXISTS public.season_status CASCADE;
DROP TYPE IF EXISTS public.meeting_type CASCADE;
DROP TYPE IF EXISTS public.leaderboard_period CASCADE;

-- 3. Custom Types (Enums)
CREATE TYPE public.user_role AS ENUM ('admin', 'customer');
CREATE TYPE public.user_status AS ENUM ('active', 'terminated', 'suspended');
CREATE TYPE public.report_status AS ENUM ('pending', 'accepted', 'rejected', 'trade_pending', 'trade_completed', 'done');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'rejected');
CREATE TYPE public.payout_method AS ENUM ('bank', 'upi');
CREATE TYPE public.ledger_type AS ENUM ('credit', 'debit');
CREATE TYPE public.ledger_source AS ENUM ('report_completion', 'payout', 'bonus', 'adjustment', 'referral_income', 'passive_income');
CREATE TYPE public.entity_status AS ENUM ('active', 'inactive');
CREATE TYPE public.season_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
CREATE TYPE public.meeting_type AS ENUM ('zoom', 'google_meet');
CREATE TYPE public.leaderboard_period AS ENUM ('daily', 'weekly', 'monthly');

-- 4. Create Tables

-- 4.1 Users (linked to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  process_id TEXT NOT NULL DEFAULT '',
  referral_id TEXT UNIQUE NOT NULL,
  sponsor_id TEXT NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'customer',
  status public.user_status NOT NULL DEFAULT 'active',
  profile_photo TEXT NOT NULL DEFAULT '',
  sponsor_user_id UUID, -- Self-referencing constraint added via ALTER TABLE below
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Downline Members (MLM tree)
CREATE TABLE public.downline_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sponsor_user_id, referred_user_id)
);

-- 4.3 Global Settings
CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.4 App Catalog
CREATE TABLE public.app_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_name TEXT NOT NULL,
  referral_link TEXT NOT NULL DEFAULT '',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status public.entity_status NOT NULL DEFAULT 'active',
  icon_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.5 Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.app_catalog(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  account_open_date TEXT NOT NULL DEFAULT '',
  status public.report_status NOT NULL DEFAULT 'pending',
  trade_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.6 Report Status History
CREATE TABLE public.report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL DEFAULT '',
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.7 Income Ledger
CREATE TABLE public.income_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type public.ledger_type NOT NULL,
  source public.ledger_source NOT NULL DEFAULT 'report_completion',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.8 Payouts
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method public.payout_method NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  account_number TEXT NOT NULL DEFAULT '',
  ifsc_code TEXT NOT NULL DEFAULT '',
  account_holder_name TEXT NOT NULL DEFAULT '',
  branch_name TEXT NOT NULL DEFAULT '',
  upi_id TEXT NOT NULL DEFAULT '',
  upi_name TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.9 Trainings
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  status public.entity_status NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.10 Leaderboard Entries
CREATE TABLE public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rank INTEGER NOT NULL DEFAULT 0,
  period public.leaderboard_period NOT NULL DEFAULT 'daily',
  date_label TEXT NOT NULL DEFAULT '',
  is_overridden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11 Seasons
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  meeting_type public.meeting_type NOT NULL DEFAULT 'zoom',
  meeting_link TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ NOT NULL,
  status public.season_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.12 Active Links
CREATE TABLE public.active_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_name TEXT NOT NULL,
  link TEXT NOT NULL,
  status public.entity_status NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.13 Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.14 Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.15 Passive Income Transactions
CREATE TABLE public.passive_income_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  source_user_name TEXT NOT NULL DEFAULT '',
  beneficiary_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  beneficiary_user_name TEXT NOT NULL DEFAULT '',
  source_report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_level INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_report_commission_type UNIQUE (source_report_id, transaction_type)
);

-- 4.16 Add Self-Referencing Constraint to Users
ALTER TABLE public.users ADD CONSTRAINT fk_users_sponsor FOREIGN KEY (sponsor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 5. Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_referral_id ON public.users(referral_id);
CREATE INDEX idx_users_sponsor_id ON public.users(sponsor_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_downline_sponsor ON public.downline_members(sponsor_user_id);
CREATE INDEX idx_downline_referred ON public.downline_members(referred_user_id);
CREATE INDEX idx_downline_level ON public.downline_members(level);
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_app_id ON public.reports(app_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_income_ledger_user_id ON public.income_ledger(user_id);
CREATE INDEX idx_income_ledger_type ON public.income_ledger(type);
CREATE INDEX idx_income_ledger_created ON public.income_ledger(created_at);
CREATE INDEX idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_leaderboard_period ON public.leaderboard_entries(period);
CREATE INDEX idx_leaderboard_date ON public.leaderboard_entries(date_label);
CREATE INDEX idx_seasons_status ON public.seasons(status);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_report_history_report ON public.report_status_history(report_id);
CREATE INDEX idx_passive_transactions_beneficiary ON public.passive_income_transactions(beneficiary_user_id);
CREATE INDEX idx_passive_transactions_source_report ON public.passive_income_transactions(source_report_id);
CREATE INDEX idx_passive_transactions_created_at ON public.passive_income_transactions(created_at);

-- 6. Helper Functions

-- 6.1 Check if User is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6.2 Referral ID Generator
CREATE OR REPLACE FUNCTION public.generate_referral_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := 'FHI';
  i INTEGER;
  existing_id UUID;
BEGIN
  FOR attempt IN 1..50 LOOP
    code := 'FHI';
    FOR i IN 1..5 LOOP
      code := code || SUBSTRING(chars FROM FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER FOR 1);
    END LOOP;
    
    SELECT id INTO existing_id FROM public.users WHERE referral_id = code LIMIT 1;
    IF existing_id IS NULL THEN
      RETURN code;
    END IF;
  END LOOP;
  
  RAISE EXCEPTION 'Failed to generate unique referral ID after 50 attempts';
END;
$$ LANGUAGE plpgsql;

-- 6.3 Update updated_at Function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers for updated_at
CREATE TRIGGER tr_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_app_catalog_updated BEFORE UPDATE ON public.app_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_reports_updated BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_payouts_updated BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_trainings_updated BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_leaderboard_updated BEFORE UPDATE ON public.leaderboard_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_seasons_updated BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_active_links_updated BEFORE UPDATE ON public.active_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_global_settings_updated BEFORE UPDATE ON public.global_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Business Logic Triggers & Functions

-- 8.1 Auto Sync Auth Signup to Public Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  sponsor_code TEXT;
  ref_code TEXT;
BEGIN
  ref_code := public.generate_referral_id();
  sponsor_code := COALESCE(new.raw_user_meta_data->>'sponsor_id', '');

  INSERT INTO public.users (
    id,
    email,
    full_name,
    mobile,
    process_id,
    referral_id,
    sponsor_id,
    role,
    status,
    profile_photo
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'mobile', ''),
    COALESCE(new.raw_user_meta_data->>'process_id', ''),
    ref_code,
    sponsor_code,
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'customer'),
    'active',
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8.2 Build MLM Referral tree
CREATE OR REPLACE FUNCTION public.build_downline_tree()
RETURNS TRIGGER AS $$
DECLARE
  sponsor_record UUID;
  upchain_entry RECORD;
BEGIN
  IF NEW.sponsor_id IS NOT NULL AND NEW.sponsor_id != '' THEN
    SELECT id INTO sponsor_record FROM public.users WHERE referral_id = NEW.sponsor_id LIMIT 1;
    
    IF sponsor_record IS NOT NULL THEN
      -- Link them directly
      UPDATE public.users SET sponsor_user_id = sponsor_record WHERE id = NEW.id;
      
      -- Level 1: Direct sponsor
      INSERT INTO public.downline_members (sponsor_user_id, referred_user_id, level)
      VALUES (sponsor_record, NEW.id, 1)
      ON CONFLICT DO NOTHING;
      
      -- Level 2+: Traverse upchain
      FOR upchain_entry IN
        SELECT sponsor_user_id, level FROM public.downline_members
        WHERE referred_user_id = sponsor_record
        ORDER BY level ASC
      LOOP
        INSERT INTO public.downline_members (sponsor_user_id, referred_user_id, level)
        VALUES (upchain_entry.sponsor_user_id, NEW.id, upchain_entry.level + 1)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_build_downline_tree
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.build_downline_tree();

-- 8.3 Auto Payout / Credit Income trigger on Report Complete ('done')
CREATE OR REPLACE FUNCTION public.credit_income_on_report_done()
RETURNS TRIGGER AS $$
DECLARE
  v_sponsor_id UUID;
  v_app_name TEXT;
  v_upline RECORD;
  v_has_sponsor BOOLEAN := FALSE;
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    -- Fetch the app name for descriptions
    SELECT app_name INTO v_app_name FROM public.app_catalog WHERE id = NEW.app_id;
    
    -- Check if the user has a sponsor
    SELECT sponsor_user_id INTO v_sponsor_id FROM public.users WHERE id = NEW.user_id;
    
    IF v_sponsor_id IS NOT NULL THEN
      v_has_sponsor := TRUE;
    END IF;

    IF v_has_sponsor THEN
      -- Loop through uplines up to level 3
      FOR v_upline IN 
        SELECT sponsor_user_id, level FROM public.downline_members 
        WHERE referred_user_id = NEW.user_id AND level <= 3
        ORDER BY level ASC
      LOOP
        IF v_upline.level = 1 THEN
          -- Level 1 sponsor gets 100% of the app amount
          INSERT INTO public.income_ledger (user_id, report_id, amount, type, source, description)
          VALUES (
            v_upline.sponsor_user_id,
            NEW.id,
            NEW.amount,
            'credit',
            'referral_income',
            CONCAT('Direct referral income (L1) from ', (SELECT full_name FROM public.users WHERE id = NEW.user_id), ' - App: ', v_app_name)
          );
        ELSIF v_upline.level = 2 THEN
          -- Level 2 sponsor gets 7.5% of the app amount
          INSERT INTO public.income_ledger (user_id, report_id, amount, type, source, description)
          VALUES (
            v_upline.sponsor_user_id,
            NEW.id,
            NEW.amount * 0.075,
            'credit',
            'passive_income',
            CONCAT('Level 2 passive income (7.5%) from ', (SELECT full_name FROM public.users WHERE id = NEW.user_id), ' - App: ', v_app_name)
          );
        ELSIF v_upline.level = 3 THEN
          -- Level 3 sponsor gets 2.5% of the app amount
          INSERT INTO public.income_ledger (user_id, report_id, amount, type, source, description)
          VALUES (
            v_upline.sponsor_user_id,
            NEW.id,
            NEW.amount * 0.025,
            'credit',
            'passive_income',
            CONCAT('Level 3 passive income (2.5%) from ', (SELECT full_name FROM public.users WHERE id = NEW.user_id), ' - App: ', v_app_name)
          );
        END IF;
      END LOOP;
    ELSE
      -- Fallback: If no sponsor, credit the user themselves with 100%
      INSERT INTO public.income_ledger (user_id, report_id, amount, type, source, description)
      VALUES (
        NEW.user_id,
        NEW.id,
        NEW.amount,
        'credit',
        'report_completion',
        CONCAT('Self-income credited for completed report (No Sponsor) - App: ', v_app_name)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_report_income
  AFTER UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.credit_income_on_report_done();

-- 8.4 Log report status changes
CREATE OR REPLACE FUNCTION public.log_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.report_status_history (report_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, 'admin', NEW.admin_notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_report_status_log
  AFTER UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.log_report_status_change();

-- 8.5 User Income Aggregation View
CREATE OR REPLACE VIEW public.v_user_income AS
SELECT 
  u.id AS user_id,
  (
    COALESCE((SELECT SUM(amount) FROM public.income_ledger WHERE user_id = u.id AND type = 'credit'), 0) +
    COALESCE((SELECT SUM(commission_amount) FROM public.passive_income_transactions WHERE beneficiary_user_id = u.id AND transaction_type IN ('PASSIVE_LEVEL_1', 'PASSIVE_LEVEL_2')), 0)
  ) AS total_credits,
  COALESCE((SELECT SUM(amount) FROM public.income_ledger WHERE user_id = u.id AND type = 'debit'), 0) AS total_debits,
  (
    (
      COALESCE((SELECT SUM(amount) FROM public.income_ledger WHERE user_id = u.id AND type = 'credit'), 0) +
      COALESCE((SELECT SUM(commission_amount) FROM public.passive_income_transactions WHERE beneficiary_user_id = u.id AND transaction_type IN ('PASSIVE_LEVEL_1', 'PASSIVE_LEVEL_2')), 0)
    ) - 
    COALESCE((SELECT SUM(amount) FROM public.income_ledger WHERE user_id = u.id AND type = 'debit'), 0)
  ) AS available_balance
FROM public.users u;

-- 9. RPC functions

-- 9.1 Get Downline
CREATE OR REPLACE FUNCTION public.get_downline(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  mobile TEXT,
  process_id TEXT,
  sponsor_id TEXT,
  referral_id TEXT,
  level INTEGER,
  report_count BIGINT,
  total_earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.email,
    u.mobile,
    u.process_id,
    u.sponsor_id,
    u.referral_id,
    dm.level,
    (SELECT COUNT(*) FROM public.reports r WHERE r.user_id = u.id) AS report_count,
    COALESCE((SELECT SUM(il.amount) FROM public.income_ledger il WHERE il.user_id = u.id AND il.type = 'credit'), 0) AS total_earnings
  FROM public.downline_members dm
  JOIN public.users u ON u.id = dm.referred_user_id
  WHERE dm.sponsor_user_id = p_user_id
  ORDER BY dm.level ASC, dm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.2 Get Income Summary (daily, monthly, lifetime, availableBalance)
CREATE OR REPLACE FUNCTION public.get_income_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  daily_report_credits DECIMAL := 0;
  daily_passive_credits DECIMAL := 0;
  daily_credits DECIMAL := 0;
  daily_debits DECIMAL := 0;
  
  monthly_report_credits DECIMAL := 0;
  monthly_passive_credits DECIMAL := 0;
  monthly_credits DECIMAL := 0;
  monthly_debits DECIMAL := 0;
  
  lifetime_report_credits DECIMAL := 0;
  lifetime_passive_credits DECIMAL := 0;
  lifetime_credits DECIMAL := 0;
  lifetime_debits DECIMAL := 0;
  available_balance DECIMAL := 0;
  
  self_credits DECIMAL := 0;
  passive_lvl1_credits DECIMAL := 0;
  passive_lvl2_credits DECIMAL := 0;
  total_passive DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO daily_report_credits
    FROM public.income_ledger WHERE user_id = p_user_id AND type = 'credit' 
    AND created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
    
  SELECT COALESCE(SUM(commission_amount), 0) INTO daily_passive_credits
    FROM public.passive_income_transactions WHERE beneficiary_user_id = p_user_id 
    AND transaction_type IN ('PASSIVE_LEVEL_1', 'PASSIVE_LEVEL_2')
    AND created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
    
  daily_credits := daily_report_credits + daily_passive_credits;
  
  SELECT COALESCE(SUM(amount), 0) INTO daily_debits
    FROM public.income_ledger WHERE user_id = p_user_id AND type = 'debit' 
    AND created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
  
  SELECT COALESCE(SUM(amount), 0) INTO monthly_report_credits
    FROM public.income_ledger WHERE user_id = p_user_id AND type = 'credit' 
    AND created_at >= NOW() - INTERVAL '30 days';
    
  SELECT COALESCE(SUM(commission_amount), 0) INTO monthly_passive_credits
    FROM public.passive_income_transactions WHERE beneficiary_user_id = p_user_id 
    AND transaction_type IN ('PASSIVE_LEVEL_1', 'PASSIVE_LEVEL_2')
    AND created_at >= NOW() - INTERVAL '30 days';
    
  monthly_credits := monthly_report_credits + monthly_passive_credits;
  
  SELECT COALESCE(SUM(amount), 0) INTO monthly_debits
    FROM public.income_ledger WHERE user_id = p_user_id AND type = 'debit' 
    AND created_at >= NOW() - INTERVAL '30 days';
  
  SELECT COALESCE(SUM(amount), 0) INTO lifetime_report_credits
    FROM public.income_ledger WHERE user_id = p_user_id AND type = 'credit';
    
  SELECT COALESCE(SUM(commission_amount), 0) INTO lifetime_passive_credits
    FROM public.passive_income_transactions WHERE beneficiary_user_id = p_user_id 
    AND transaction_type IN ('PASSIVE_LEVEL_1', 'PASSIVE_LEVEL_2');
    
  lifetime_credits := lifetime_report_credits + lifetime_passive_credits;
  
  SELECT COALESCE(SUM(amount), 0) INTO lifetime_debits
    FROM public.income_ledger WHERE user_id = p_user_id AND type = 'debit';
  
  available_balance := lifetime_credits - lifetime_debits;
  
  self_credits := lifetime_report_credits;
  
  SELECT COALESCE(SUM(commission_amount), 0) INTO passive_lvl1_credits
    FROM public.passive_income_transactions 
    WHERE beneficiary_user_id = p_user_id AND transaction_type = 'PASSIVE_LEVEL_1';
    
  SELECT COALESCE(SUM(commission_amount), 0) INTO passive_lvl2_credits
    FROM public.passive_income_transactions 
    WHERE beneficiary_user_id = p_user_id AND transaction_type = 'PASSIVE_LEVEL_2';
    
  total_passive := passive_lvl1_credits + passive_lvl2_credits;
  
  RETURN json_build_object(
    'daily', json_build_object('credits', daily_credits, 'debits', daily_debits, 'net', daily_credits),
    'monthly', json_build_object('credits', monthly_credits, 'debits', monthly_debits, 'net', monthly_credits),
    'lifetime', json_build_object('credits', lifetime_credits, 'debits', lifetime_debits, 'net', lifetime_credits, 'availableBalance', available_balance),
    'breakdown', json_build_object(
      'self', self_credits,
      'direct', passive_lvl1_credits,
      'level2', passive_lvl2_credits,
      'level3', 0,
      'passive', total_passive
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downline_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passive_income_transactions ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies

-- 11.1 Users Policies
CREATE POLICY "Anyone can view active users for sponsor checking" ON public.users
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access to users" ON public.users
  FOR ALL USING (public.is_admin());

-- 11.2 Reports Policies
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to reports" ON public.reports
  FOR ALL USING (public.is_admin());

-- 11.3 Payouts Policies
CREATE POLICY "Users can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request payouts" ON public.payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id AND amount > 0);

CREATE POLICY "Admins have full access to payouts" ON public.payouts
  FOR ALL USING (public.is_admin());

-- 11.4 Income Ledger Policies
CREATE POLICY "Users can view own ledger" ON public.income_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to ledger" ON public.income_ledger
  FOR ALL USING (public.is_admin());

-- 11.5 Downline Members Policies
CREATE POLICY "Users can view own downline members" ON public.downline_members
  FOR SELECT USING (auth.uid() = sponsor_user_id);

CREATE POLICY "Admins have full access to downline members" ON public.downline_members
  FOR ALL USING (public.is_admin());

-- 11.6 App Catalog Policies
CREATE POLICY "Anyone can view active apps" ON public.app_catalog
  FOR SELECT USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admins have full access to app catalog" ON public.app_catalog
  FOR ALL USING (public.is_admin());

-- 11.7 Trainings Policies
CREATE POLICY "Anyone can view active trainings" ON public.trainings
  FOR SELECT USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admins have full access to trainings" ON public.trainings
  FOR ALL USING (public.is_admin());

-- 11.8 Seasons Policies
CREATE POLICY "Anyone can view active/upcoming seasons" ON public.seasons
  FOR SELECT USING (status IN ('upcoming', 'active') OR public.is_admin());

CREATE POLICY "Admins have full access to seasons" ON public.seasons
  FOR ALL USING (public.is_admin());

-- 11.9 Leaderboard Policies
CREATE POLICY "Anyone can view leaderboard entries" ON public.leaderboard_entries
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins have full access to leaderboard" ON public.leaderboard_entries
  FOR ALL USING (public.is_admin());

-- 11.10 Active Links Policies
CREATE POLICY "Anyone can view active links" ON public.active_links
  FOR SELECT USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admins have full access to active links" ON public.active_links
  FOR ALL USING (public.is_admin());

-- 11.11 Global Settings Policies
CREATE POLICY "Anyone can view settings" ON public.global_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins have full access to global settings" ON public.global_settings
  FOR ALL USING (public.is_admin());

-- 11.12 Audit Logs Policies
CREATE POLICY "Admins have full access to audit logs" ON public.audit_logs
  FOR ALL USING (public.is_admin());

-- 11.13 Notifications Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own notification status" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to notifications" ON public.notifications
  FOR ALL USING (public.is_admin());

-- 11.14 Report History Policies
CREATE POLICY "Users can view own report history" ON public.report_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.reports WHERE reports.id = report_status_history.report_id AND reports.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Admins have full access to report history" ON public.report_status_history
  FOR ALL USING (public.is_admin());

-- 11.15 Passive Income Transactions Policies
CREATE POLICY "Admins have full access to passive transactions" ON public.passive_income_transactions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own passive transactions" ON public.passive_income_transactions
  FOR SELECT USING (auth.uid() = beneficiary_user_id);


-- 12. Seed Sample/Initial Data

-- 12.1 Global Settings
INSERT INTO public.global_settings (key, value) VALUES
  ('founderName', 'Rajesh Kumar'),
  ('founderPhoto', ''),
  ('customerCareLink', 'https://t.me/fintechhubindia_care'),
  ('whatsappLink', 'https://wa.me/919462547328'),
  ('footerDevName', 'Neurox Technology'),
  ('footerInstagram', 'https://instagram.com/neuroxtech'),
  ('footerWhatsapp', 'https://wa.me/919462547328'),
  ('maintenanceMode', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 12.2 App Catalog
INSERT INTO public.app_catalog (app_name, referral_link, amount, status, sort_order) VALUES
  ('Angel One', 'https://angel-one.referral.link/fhi', 500.00, 'active', 1),
  ('Upstox', 'https://upstox.referral.link/fhi', 500.00, 'active', 2),
  ('Groww', 'https://groww.referral.link/fhi', 300.00, 'active', 3),
  ('Zerodha', 'https://zerodha.referral.link/fhi', 400.00, 'active', 4),
  ('5Paisa', 'https://5paisa.referral.link/fhi', 350.00, 'active', 5)
ON CONFLICT DO NOTHING;

-- 12.3 Active Links
INSERT INTO public.active_links (app_name, link, status, sort_order) VALUES
  ('Angel One', 'https://angel-one.referral.link/fhi', 'active', 1),
  ('Upstox', 'https://upstox.referral.link/fhi', 'active', 2),
  ('Groww', 'https://groww.referral.link/fhi', 'active', 3)
ON CONFLICT DO NOTHING;

-- 12.4 Trainings
INSERT INTO public.trainings (title, youtube_url, status, sort_order) VALUES
  ('Getting Started with Fintech Hub India', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'active', 1),
  ('How to Open Account & Submit Reports', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'active', 2)
ON CONFLICT DO NOTHING;

-- 12.5 Seasons
INSERT INTO public.seasons (title, description, meeting_type, meeting_link, start_date, status) VALUES
  ('Fintech Hub Launch Webinar', 'Join us live for the official launch and MLM training session.', 'zoom', 'https://zoom.us/j/1234567890', NOW() + INTERVAL '2 days', 'upcoming')
ON CONFLICT DO NOTHING;


-- 13. Create Auth Admin User (seeded with bcrypt password 'admin123')
DO $$
DECLARE
  admin_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@fintechhub.com') THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      recovery_token,
      phone_change,
      phone_change_token
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@fintechhub.com',
      crypt('admin123', gen_salt('bf', 10)),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Fintech Admin","mobile":"9999999999","process_id":"ADMIN001","sponsor_id":"","role":"admin"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    );
    
    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      admin_id,
      admin_id,
      json_build_object('sub', admin_id, 'email', 'admin@fintechhub.com'),
      'email',
      admin_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END $$;
