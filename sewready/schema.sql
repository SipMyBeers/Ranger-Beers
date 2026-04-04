-- SewReady D1 Database Schema
-- Run: wrangler d1 execute sewready-db --file=schema.sql

-- ── Orders ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  customer TEXT,
  phone TEXT,
  email TEXT,
  uniform TEXT,
  deadline TEXT,
  urgency TEXT DEFAULT 'on-track',
  data TEXT,  -- full JSON blob of the order object
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_slug);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders(shop_slug, status);
CREATE INDEX IF NOT EXISTS idx_orders_shop_deadline ON orders(shop_slug, deadline);

-- ── Incoming Orders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incoming_orders (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer TEXT,
  phone TEXT,
  email TEXT,
  data TEXT,  -- full JSON blob
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_incoming_shop ON incoming_orders(shop_slug);

-- ── Customers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  password TEXT,
  unit TEXT,
  data TEXT,  -- extra fields as JSON
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_slug);
CREATE INDEX IF NOT EXISTS idx_customers_shop_email ON customers(shop_slug, email);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  type TEXT,
  title TEXT,
  body TEXT,
  order_id TEXT,
  incoming_id TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_shop ON notifications(shop_slug);

-- ── Notification Log (SMS/Email audit trail) ──────────────────
CREATE TABLE IF NOT EXISTS notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_slug TEXT NOT NULL,
  order_id TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  type TEXT,       -- 'sms' or 'email'
  status TEXT,     -- 'sent' or 'failed'
  provider_id TEXT,
  error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notiflog_shop ON notification_log(shop_slug);
CREATE INDEX IF NOT EXISTS idx_notiflog_order ON notification_log(shop_slug, order_id);

-- ── Shops Registry ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'storefront',
  owner TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  tagline TEXT,
  theme_primary TEXT DEFAULT '#a855f7',
  theme_secondary TEXT DEFAULT '#1c2833',
  theme_accent TEXT DEFAULT '#06b6d4',
  admin_password TEXT,
  config TEXT,  -- full JSON blob for extra fields (employees, shopHours, etc.)
  vertical TEXT DEFAULT 'sewing',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(active);
CREATE INDEX IF NOT EXISTS idx_shops_vertical ON shops(vertical);

-- ── Snipcart Billing Columns ────────────────────────────────
-- Run these ALTER statements to add billing columns to existing shops table:
-- ALTER TABLE shops ADD COLUMN snipcart_customer_email TEXT;
-- ALTER TABLE shops ADD COLUMN snipcart_subscription_id TEXT;
-- ALTER TABLE shops ADD COLUMN snipcart_order_token TEXT;
-- ALTER TABLE shops ADD COLUMN subscription_status TEXT DEFAULT 'none';
-- subscription_status: 'none' | 'active' | 'paused' | 'canceled'

-- ══════════════════════════════════════════════════════════════
--  Phase 3 Tables
-- ══════════════════════════════════════════════════════════════

-- ── Admin Users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',  -- 'owner' | 'manager' | 'employee'
  employee_id TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_users_shop ON admin_users(shop_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(shop_slug, email);

-- ── Sessions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_shop ON sessions(shop_slug);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ── Audit Log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_slug TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_shop ON audit_log(shop_slug);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(shop_slug, entity_type, entity_id);

-- ── Drivers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_drivers_shop ON drivers(shop_slug);

-- ── Driver Assignments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_assignments (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  order_id TEXT NOT NULL,
  driver_id TEXT,
  pickup_address TEXT,
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'assigned'|'en-route'|'picked-up'|'delivered'|'cancelled'
  scheduled_date TEXT,
  scheduled_time TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_driver_assign_shop ON driver_assignments(shop_slug);
CREATE INDEX IF NOT EXISTS idx_driver_assign_order ON driver_assignments(shop_slug, order_id);
CREATE INDEX IF NOT EXISTS idx_driver_assign_driver ON driver_assignments(driver_id);

-- ── Order Photos ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_photos (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  order_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  filename TEXT,
  content_type TEXT,
  size_bytes INTEGER,
  uploaded_by TEXT,
  caption TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_photos_shop ON order_photos(shop_slug);
CREATE INDEX IF NOT EXISTS idx_photos_order ON order_photos(shop_slug, order_id);

-- ── Phase 4: Password Reset Columns ──────────────────────────
-- These use IF NOT EXISTS pattern to be idempotent (SQLite doesn't support it natively,
-- so we use a CREATE TABLE trick to avoid errors on re-run)
-- To add manually: ALTER TABLE admin_users ADD COLUMN reset_token TEXT;
--                  ALTER TABLE admin_users ADD COLUMN reset_expires TEXT;
SELECT 1;

-- ── Rate Limiting ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- ── Phase 5A: Driver Auth Columns ─────────────────────────────
-- ALTER TABLE drivers ADD COLUMN email TEXT;
-- ALTER TABLE drivers ADD COLUMN password_hash TEXT;
-- ALTER TABLE drivers ADD COLUMN reset_token TEXT;
-- ALTER TABLE drivers ADD COLUMN reset_expires TEXT;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_email ON drivers(shop_slug, email);

-- ── Contact Form Submissions ────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  read INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_contact_shop ON contact_submissions(shop_slug);

-- ── Payment Records ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_slug TEXT NOT NULL,
  order_id TEXT,
  square_payment_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_shop ON payments(shop_slug);

-- ── Intake Form Submissions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS intake_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  tier TEXT,
  details TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_intake_created ON intake_submissions(created_at);

-- ══════════════════════════════════════════════════════════════
--  AI Automation Tables
-- ══════════════════════════════════════════════════════════════

-- ── Social Posts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT,       -- JSON array of hashtag strings
  platform TEXT,       -- 'instagram' | 'facebook' | 'tiktok'
  image_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'scheduled' | 'published'
  scheduled_for TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_social_posts_shop ON social_posts(shop_slug);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(status, scheduled_for);

-- ── Campaigns ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  shop_slug TEXT NOT NULL,
  campaign_type TEXT,   -- 'holiday' | 'newproduct' | 'loyalty' | 'seasonal' | etc.
  email_subject TEXT,
  email_body TEXT,
  sms TEXT,
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'scheduled' | 'sent' | 'failed'
  scheduled_for TEXT,
  sent_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_campaigns_shop ON campaigns(shop_slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns(status, scheduled_for);

-- ── Automation Config ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_slug TEXT NOT NULL,
  feature TEXT NOT NULL,  -- 'social' | 'campaign' | etc.
  enabled INTEGER DEFAULT 0,
  config TEXT,            -- JSON blob for feature-specific settings
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_automation_shop ON automation_config(shop_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_shop_feature ON automation_config(shop_slug, feature);

-- ── Review Responses ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_slug TEXT NOT NULL,
  stars INTEGER NOT NULL,
  review_text TEXT NOT NULL,
  response_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'pending' | 'ready' | 'sent'
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_review_resp_shop ON review_responses(shop_slug);
CREATE INDEX IF NOT EXISTS idx_review_resp_status ON review_responses(status);

-- ── Chat Logs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  shop_slug TEXT NOT NULL,
  role TEXT NOT NULL,          -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_shop ON chat_logs(shop_slug);
