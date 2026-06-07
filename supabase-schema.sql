-- ============================================
-- FINTECH HUB INDIA - Complete SQL Schema for Supabase
-- ============================================
-- This SQL can be used to set up the entire database on Supabase PostgreSQL
-- It includes all tables, indexes, triggers, functions, RLS policies, and seed data
-- Run this ENTIRE file in Supabase SQL Editor — no manual steps needed
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'customer');
CREATE TYPE user_status AS ENUM ('active', 'terminated', 'suspended');
CREATE TYPE report_status AS ENUM ('pending', 'accepted', 'rejected', 'trade_pending', 'trade_completed', 'done');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'rejected');
CREATE TYPE payout_method AS ENUM ('bank', 'upi');
CREATE TYPE ledger_type AS ENUM ('credit', 'debit');
CREATE TYPE ledger_source AS ENUM ('report_completion', 'payout', 'bonus', 'adjustment', 'referral_income', 'passive_income');
CREATE TYPE entity_status AS ENUM ('active', 'inactive');
CREATE TYPE season_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
CREATE TYPE meeting_type AS ENUM ('zoom', 'google_meet');
CREATE TYPE leaderboard_period AS ENUM ('daily', 'weekly', 'monthly');

-- ============================================
-- TABLES
-- ============================================

-- 1. Users (auth-linked profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL DEFAULT '',
  process_id TEXT NOT NULL DEFAULT '',        -- Mandatory: user's process ID (from WhatsApp)
  referral_id TEXT UNIQUE NOT NULL,            -- Auto-generated unique referral code (e.g. FHI5A7K9)
  sponsor_id TEXT NOT NULL DEFAULT '',         -- The referral code of the person who invited this user (optional)
  role user_role NOT NULL DEFAULT 'customer',
  status user_status NOT NULL DEFAULT 'active',
  profile_photo TEXT NOT NULL DEFAULT '',
  sponsor_user_id UUID REFERENCES users(id),  -- Resolved from sponsor_id (the referring user's UUID)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Downline Members (MLM referral tree)
CREATE TABLE downline_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,            -- Depth in the MLM tree (1 = direct, 2 = sponsor's sponsor, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sponsor_user_id, referred_user_id)
);

-- 3. Global Settings (key-value store for app-wide config)
CREATE TABLE global_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. App Catalog (partner apps for report submission)
CREATE TABLE app_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_name TEXT NOT NULL,
  referral_link TEXT NOT NULL DEFAULT '',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status entity_status NOT NULL DEFAULT 'active',
  icon_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Reports (user-submitted reports for partner apps)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  app_id UUID NOT NULL REFERENCES app_catalog(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  account_open_date TEXT NOT NULL DEFAULT '',
  status report_status NOT NULL DEFAULT 'pending',
  trade_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Report Status History (audit trail for report status changes)
CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL DEFAULT '',
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Income Ledger (credits and debits for users)
CREATE TABLE income_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  report_id UUID REFERENCES reports(id),
  amount DECIMAL(10,2) NOT NULL,
  type ledger_type NOT NULL,
  source ledger_source NOT NULL DEFAULT 'report_completion',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Payouts (withdrawal requests from users)
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  method payout_method NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
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

-- 9. Trainings (YouTube video trainings for users)
CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  status entity_status NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Leaderboard Entries (rankings by period)
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  period leaderboard_period NOT NULL DEFAULT 'daily',
  date_label TEXT NOT NULL DEFAULT '',
  is_overridden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Seasons (zoom/google_meet season events)
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  meeting_type meeting_type NOT NULL DEFAULT 'zoom',
  meeting_link TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ NOT NULL,
  status season_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Active Links (admin-managed referral links shown to users)
CREATE TABLE active_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_name TEXT NOT NULL,
  link TEXT NOT NULL,
  status entity_status NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Audit Logs (system-wide action log)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notifications (user notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),           -- NULL = broadcast to all users
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',            -- info, success, warning, error
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Passive Income Transactions
CREATE TABLE passive_income_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source_user_name TEXT NOT NULL DEFAULT '',
  beneficiary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  beneficiary_user_name TEXT NOT NULL DEFAULT '',
  source_report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_level INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_report_commission_type UNIQUE (source_report_id, transaction_type)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_process_id ON users(process_id);
CREATE INDEX idx_users_referral_id ON users(referral_id);
CREATE INDEX idx_users_sponsor_id ON users(sponsor_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_sponsor_user_id ON users(sponsor_user_id);
CREATE INDEX idx_downline_sponsor ON downline_members(sponsor_user_id);
CREATE INDEX idx_downline_referred ON downline_members(referred_user_id);
CREATE INDEX idx_downline_level ON downline_members(level);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_passive_transactions_beneficiary ON passive_income_transactions(beneficiary_user_id);
CREATE INDEX idx_passive_transactions_source_report ON passive_income_transactions(source_report_id);
CREATE INDEX idx_passive_transactions_created_at ON passive_income_transactions(created_at);
CREATE INDEX idx_reports_app_id ON reports(app_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_income_ledger_user_id ON income_ledger(user_id);
CREATE INDEX idx_income_ledger_type ON income_ledger(type);
CREATE INDEX idx_income_ledger_created ON income_ledger(created_at);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_leaderboard_period ON leaderboard_entries(period);
CREATE INDEX idx_leaderboard_date ON leaderboard_entries(date_label);
CREATE INDEX idx_seasons_status ON seasons(status);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_report_history_report ON report_status_history(report_id);

-- ============================================
-- TRIGGERS (auto-update updated_at)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_app_catalog_updated BEFORE UPDATE ON app_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_reports_updated BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_payouts_updated BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_trainings_updated BEFORE UPDATE ON trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_leaderboard_updated BEFORE UPDATE ON leaderboard_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_seasons_updated BEFORE UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_active_links_updated BEFORE UPDATE ON active_links FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_global_settings_updated BEFORE UPDATE ON global_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTION: Generate unique referral ID (e.g. FHI5A7K9)
-- ============================================
CREATE OR REPLACE FUNCTION generate_referral_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- no confusing chars like I,O,0,1
  code TEXT := 'FHI';  -- FINTECH HUB INDIA prefix
  i INTEGER;
  existing_id UUID;
BEGIN
  FOR attempt IN 1..50 LOOP
    code := 'FHI';
    FOR i IN 1..5 LOOP
      code := code || SUBSTRING(chars FROM FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER FOR 1);
    END LOOP;
    
    SELECT id INTO existing_id FROM users WHERE referral_id = code LIMIT 1;
    IF existing_id IS NULL THEN
      RETURN code;
    END IF;
  END LOOP;
  
  RAISE EXCEPTION 'Failed to generate unique referral ID after 50 attempts';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Auto-credit income on report completion
-- Triggers when report status changes to 'done'
-- ============================================
CREATE OR REPLACE FUNCTION credit_income_on_report_done()
RETURNS TRIGGER AS $$
DECLARE
  v_sponsor_id UUID;
  v_app_name TEXT;
  v_upline RECORD;
  v_has_sponsor BOOLEAN := FALSE;
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    -- Fetch the app name for descriptions
    SELECT app_name INTO v_app_name FROM app_catalog WHERE id = NEW.app_id;
    
    -- Check if the user has a sponsor
    SELECT sponsor_user_id INTO v_sponsor_id FROM users WHERE id = NEW.user_id;
    
    IF v_sponsor_id IS NOT NULL THEN
      v_has_sponsor := TRUE;
    END IF;

    IF v_has_sponsor THEN
      -- Loop through uplines up to level 3
      FOR v_upline IN 
        SELECT sponsor_user_id, level FROM downline_members 
        WHERE referred_user_id = NEW.user_id AND level <= 3
        ORDER BY level ASC
      LOOP
        IF v_upline.level = 1 THEN
          -- Level 1 sponsor gets 100% of the app amount
          INSERT INTO income_ledger (user_id, report_id, amount, type, source, description)
          VALUES (
            v_upline.sponsor_user_id,
            NEW.id,
            NEW.amount,
            'credit',
            'referral_income',
            CONCAT('Direct referral income (L1) from ', (SELECT full_name FROM users WHERE id = NEW.user_id), ' - App: ', v_app_name)
          );
        ELSIF v_upline.level = 2 THEN
          -- Level 2 sponsor gets 7.5% of the app amount
          INSERT INTO income_ledger (user_id, report_id, amount, type, source, description)
          VALUES (
            v_upline.sponsor_user_id,
            NEW.id,
            NEW.amount * 0.075,
            'credit',
            'passive_income',
            CONCAT('Level 2 passive income (7.5%) from ', (SELECT full_name FROM users WHERE id = NEW.user_id), ' - App: ', v_app_name)
          );
        ELSIF v_upline.level = 3 THEN
          -- Level 3 sponsor gets 2.5% of the app amount
          INSERT INTO income_ledger (user_id, report_id, amount, type, source, description)
          VALUES (
            v_upline.sponsor_user_id,
            NEW.id,
            NEW.amount * 0.025,
            'credit',
            'passive_income',
            CONCAT('Level 3 passive income (2.5%) from ', (SELECT full_name FROM users WHERE id = NEW.user_id), ' - App: ', v_app_name)
          );
        END IF;
      END LOOP;
    ELSE
      -- Fallback: If no sponsor, credit the user themselves with 100%
      INSERT INTO income_ledger (user_id, report_id, amount, type, source, description)
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_report_income
  AFTER UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION credit_income_on_report_done();

-- ============================================
-- FUNCTION: Auto-create status history on report change
-- ============================================
CREATE OR REPLACE FUNCTION log_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO report_status_history (report_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, 'system', NEW.admin_notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_report_status_log
  AFTER UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION log_report_status_change();

-- ============================================
-- FUNCTION: Build MLM downline tree on user signup
-- Called after a new user is inserted with a valid sponsor_id
-- Creates entries for all levels (direct + upchain sponsors)
-- ============================================
CREATE OR REPLACE FUNCTION build_downline_tree()
RETURNS TRIGGER AS $$
DECLARE
  sponsor_record UUID;
  upchain_entry RECORD;
BEGIN
  -- Only proceed if sponsor_id is provided and resolves to a user
  IF NEW.sponsor_id IS NOT NULL AND NEW.sponsor_id != '' THEN
    -- Find the sponsor user by their referral_id
    SELECT id INTO sponsor_record FROM users WHERE referral_id = NEW.sponsor_id LIMIT 1;
    
    IF sponsor_record IS NOT NULL THEN
      -- Update sponsor_user_id foreign key
      UPDATE users SET sponsor_user_id = sponsor_record WHERE id = NEW.id;
      
      -- Level 1: Direct sponsor -> this user
      INSERT INTO downline_members (sponsor_user_id, referred_user_id, level)
      VALUES (sponsor_record, NEW.id, 1);
      
      -- Level 2+: Add to all upchain sponsors (sponsor's sponsors, their sponsors, etc.)
      FOR upchain_entry IN
        SELECT sponsor_user_id, level FROM downline_members
        WHERE referred_user_id = sponsor_record
        ORDER BY level ASC
      LOOP
        INSERT INTO downline_members (sponsor_user_id, referred_user_id, level)
        VALUES (upchain_entry.sponsor_user_id, NEW.id, upchain_entry.level + 1);
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_build_downline_tree
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION build_downline_tree();

-- ============================================
-- FUNCTION: Get recursive downline for a user
-- Returns all downline members with their level, earnings, etc.
-- Usage: SELECT * FROM get_downline('user-uuid-here');
-- ============================================
CREATE OR REPLACE FUNCTION get_downline(p_user_id UUID)
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
    (SELECT COUNT(*) FROM reports r WHERE r.user_id = u.id) AS report_count,
    COALESCE((SELECT SUM(il.amount) FROM income_ledger il WHERE il.user_id = u.id AND il.type = 'credit'), 0) AS total_earnings
  FROM downline_members dm
  JOIN users u ON u.id = dm.referred_user_id
  WHERE dm.sponsor_user_id = p_user_id
  ORDER BY dm.level ASC, dm.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get income summary for a user
-- Returns daily, monthly, and lifetime income with available balance
-- Usage: SELECT * FROM get_income_summary('user-uuid-here');
-- ============================================
CREATE OR REPLACE FUNCTION get_income_summary(p_user_id UUID)
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
    FROM income_ledger WHERE user_id = p_user_id AND type = 'credit' 
    AND created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
    
  SELECT COALESCE(SUM(commission_amount), 0) INTO daily_passive_credits
    FROM passive_income_transactions WHERE beneficiary_user_id = p_user_id 
    AND transaction_type IN ('PASSIVE_LEVEL_1', 'PASSIVE_LEVEL_2')
    AND created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
    
  daily_credits := daily_report_credits + daily_passive_credits;
  
  SELECT COALESCE(SUM(amount), 0) INTO daily_debits
    FROM income_ledger WHERE user_id = p_user_id AND type = 'debit' 
    AND created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
  
  SELECT COALESCE(SUM(amount), 0) INTO monthly_report_credits
    FROM income_ledger WHERE user_id = p_user_id AND type = 'credit' 
    AND created_at >= NOW() - INTERVAL '30 days';
    
  SELECT COALESCE(SUM(commission_amount), 0) INTO monthly_passive_credits
    FROM passive_income_transactions WHERE beneficiary_user_id = p_user_id 
    AND transaction_type IN ('PASSIVE_LEVEL_1', 'PASSIVE_LEVEL_2')
    AND created_at >= NOW() - INTERVAL '30 days';
    
  monthly_credits := monthly_report_credits + monthly_passive_credits;
  
  SELECT COALESCE(SUM(amount), 0) INTO monthly_debits
    FROM income_ledger WHERE user_id = p_user_id AND type = 'debit' 
    AND created_at >= NOW() - INTERVAL '30 days';
  
  SELECT COALESCE(SUM(amount), 0) INTO lifetime_report_credits
    FROM income_ledger WHERE user_id = p_user_id AND type = 'credit';
    
  SELECT COALESCE(SUM(commission_amount), 0) INTO lifetime_passive_credits
    FROM passive_income_transactions WHERE beneficiary_user_id = p_user_id 
    AND transaction_type IN ('PASSIVE_LEVEL_1', 'PASSIVE_LEVEL_2');
    
  lifetime_credits := lifetime_report_credits + lifetime_passive_credits;
  
  SELECT COALESCE(SUM(amount), 0) INTO lifetime_debits
    FROM income_ledger WHERE user_id = p_user_id AND type = 'debit';
  
  available_balance := lifetime_credits - lifetime_debits;
  
  self_credits := lifetime_report_credits;
  
  SELECT COALESCE(SUM(commission_amount), 0) INTO passive_lvl1_credits
    FROM passive_income_transactions 
    WHERE beneficiary_user_id = p_user_id AND transaction_type = 'PASSIVE_LEVEL_1';
    
  SELECT COALESCE(SUM(commission_amount), 0) INTO passive_lvl2_credits
    FROM passive_income_transactions 
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
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE downline_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE passive_income_transactions ENABLE ROW LEVEL SECURITY;

-- Admin full access policies
CREATE POLICY "Admin full access on users" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access on reports" ON reports FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access on payouts" ON payouts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access on income_ledger" ON income_ledger FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access on app_catalog" ON app_catalog FOR ALL USING (true);
CREATE POLICY "Admin full access on trainings" ON trainings FOR ALL USING (true);
CREATE POLICY "Admin full access on seasons" ON seasons FOR ALL USING (true);
CREATE POLICY "Admin full access on leaderboard" ON leaderboard_entries FOR ALL USING (true);
CREATE POLICY "Admin full access on active_links" ON active_links FOR ALL USING (true);
CREATE POLICY "Admin full access on global_settings" ON global_settings FOR ALL USING (true);
CREATE POLICY "Admin full access on audit_logs" ON audit_logs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access on notifications" ON notifications FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access on report_status_history" ON report_status_history FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Customer read own data
CREATE POLICY "Customer read own profile" ON users FOR SELECT USING (id::text = auth.jwt() ->> 'sub');
CREATE POLICY "Customer update own profile" ON users FOR UPDATE USING (id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Customer read own reports" ON reports FOR SELECT USING (user_id::text = auth.jwt() ->> 'sub');
CREATE POLICY "Customer create own reports" ON reports FOR INSERT WITH CHECK (user_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Customer read own payouts" ON payouts FOR SELECT USING (user_id::text = auth.jwt() ->> 'sub');
CREATE POLICY "Customer create own payouts" ON payouts FOR INSERT WITH CHECK (user_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Customer read own income" ON income_ledger FOR SELECT USING (user_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Customer read own downline" ON downline_members FOR SELECT USING (sponsor_user_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Customer read own notifications" ON notifications FOR SELECT USING (user_id::text = auth.jwt() ->> 'sub' OR user_id IS NULL);

CREATE POLICY "Admin full access on passive_income_transactions" ON passive_income_transactions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Customer read own passive transactions" ON passive_income_transactions FOR SELECT USING (beneficiary_user_id::text = auth.jwt() ->> 'sub');

-- ============================================
-- SEED DATA
-- ============================================

-- Admin user (password: admin123 — bcrypt hash)
INSERT INTO users (email, password_hash, full_name, mobile, process_id, referral_id, sponsor_id, role, status)
VALUES (
  'admin@fintechhub.com',
  '$2a$12$LJ3m4ys3Sz8n5M7vN1EPOOZRTZ5qK6cHvJlYKrGmFdRGXnHFR2Km6',
  'Fintech Admin',
  '9999999999',
  'ADMIN001',
  generate_referral_id(),
  '',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Global settings seed
INSERT INTO global_settings (key, value) VALUES
  ('founderName', 'Fintech Hub India'),
  ('founderPhoto', ''),
  ('customerCareLink', 'https://t.me/fintechhub'),
  ('whatsappLink', 'https://wa.me/919999999999'),
  ('footerDevName', 'Neurox Technology'),
  ('footerInstagram', 'https://instagram.com/neuroxtech'),
  ('footerWhatsapp', 'https://wa.me/919999999999'),
  ('maintenanceMode', 'false')
ON CONFLICT (key) DO NOTHING;

-- Sample app catalog
INSERT INTO app_catalog (app_name, referral_link, amount, status, sort_order) VALUES
  ('Angel One', 'https://angel-one.referral.link', 500, 'active', 1),
  ('Upstox', 'https://upstox.referral.link', 500, 'active', 2),
  ('Groww', 'https://groww.referral.link', 300, 'active', 3),
  ('Zerodha', 'https://zerodha.referral.link', 400, 'active', 4),
  ('5Paisa', 'https://5paisa.referral.link', 350, 'active', 5)
ON CONFLICT DO NOTHING;

-- Sample active links
INSERT INTO active_links (app_name, link, status, sort_order) VALUES
  ('Angel One', 'https://angel-one.referral.link', 'active', 1),
  ('Upstox', 'https://upstox.referral.link', 'active', 2),
  ('Groww', 'https://groww.referral.link', 'active', 3)
ON CONFLICT DO NOTHING;

-- Sample trainings
INSERT INTO trainings (title, youtube_url, status, sort_order) VALUES
  ('Getting Started with Fintech Hub', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'active', 1),
  ('How to Submit Reports', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'active', 2)
ON CONFLICT DO NOTHING;
