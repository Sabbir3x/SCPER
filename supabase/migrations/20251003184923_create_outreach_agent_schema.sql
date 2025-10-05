/*
  # Minimind Outreach Agent Database Schema

  ## Overview
  Complete database schema for the AI-powered outreach agent system with Facebook and Email integration.

  ## New Tables

  ### 1. users
  - `id` (uuid, primary key) - Auto-generated user ID
  - `email` (text, unique) - User email address
  - `name` (text) - Full name
  - `role` (text) - User role: admin, moderator, sales, analyst
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login_at` (timestamptz) - Last login timestamp

  ### 2. pages
  - `id` (uuid, primary key) - Auto-generated page ID
  - `url` (text, unique) - Facebook page URL
  - `page_id` (text) - Facebook page ID
  - `name` (text) - Page name
  - `category` (text) - Page category/industry
  - `contact_email` (text) - Contact email if available
  - `about` (text) - Page description
  - `cover_image_url` (text) - Cover image URL
  - `profile_image_url` (text) - Profile image URL
  - `last_analyzed_at` (timestamptz) - Last analysis timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  - `created_by` (uuid, foreign key) - User who added this page

  ### 3. analyses
  - `id` (uuid, primary key) - Auto-generated analysis ID
  - `page_id` (uuid, foreign key) - Reference to pages table
  - `overall_score` (integer) - Design quality score 0-100
  - `issues` (jsonb) - Array of detected issues with details
  - `suggestions` (jsonb) - Array of improvement suggestions
  - `images_analyzed` (integer) - Number of images analyzed
  - `need_decision` (text) - AI decision: yes, maybe, no
  - `confidence_score` (decimal) - Decision confidence 0-1
  - `rationale` (text) - Human-readable explanation
  - `analysis_date` (timestamptz) - When analysis was performed
  - `analyzed_by` (uuid, foreign key) - User who triggered analysis

  ### 4. campaigns
  - `id` (uuid, primary key) - Auto-generated campaign ID
  - `name` (text) - Campaign name
  - `description` (text) - Campaign description
  - `status` (text) - Status: active, paused, completed, archived
  - `created_by` (uuid, foreign key) - User who created campaign
  - `created_at` (timestamptz) - Campaign creation timestamp
  - `pages_count` (integer) - Total pages in campaign
  - `sent_count` (integer) - Messages sent count
  - `reply_count` (integer) - Replies received count

  ### 5. drafts
  - `id` (uuid, primary key) - Auto-generated draft ID
  - `campaign_id` (uuid, foreign key, nullable) - Associated campaign
  - `page_id` (uuid, foreign key) - Target page
  - `analysis_id` (uuid, foreign key) - Associated analysis
  - `fb_message` (text) - Facebook message content
  - `email_subject` (text) - Email subject line
  - `email_body` (text) - Email body content
  - `pdf_path` (text) - Path to generated PDF proposal
  - `status` (text) - Status: pending, approved, rejected, sent, scheduled
  - `created_at` (timestamptz) - Draft creation timestamp
  - `created_by` (uuid, foreign key) - User who created draft
  - `reviewed_by` (uuid, foreign key, nullable) - Moderator who reviewed
  - `reviewed_at` (timestamptz, nullable) - Review timestamp
  - `scheduled_for` (timestamptz, nullable) - Scheduled send time
  - `version` (integer) - Draft version number

  ### 6. messages
  - `id` (uuid, primary key) - Auto-generated message ID
  - `draft_id` (uuid, foreign key) - Associated draft
  - `page_id` (uuid, foreign key) - Target page
  - `platform` (text) - Platform: facebook, email
  - `platform_message_id` (text) - External message ID
  - `status` (text) - Status: sent, delivered, failed, bounced
  - `sent_at` (timestamptz) - Send timestamp
  - `sent_by` (uuid, foreign key) - User who sent
  - `error_message` (text, nullable) - Error details if failed

  ### 7. replies
  - `id` (uuid, primary key) - Auto-generated reply ID
  - `message_id` (uuid, foreign key) - Original message
  - `page_id` (uuid, foreign key) - Source page
  - `platform` (text) - Platform: facebook, email
  - `content` (text) - Reply content
  - `classification` (text) - AI classification: positive, neutral, negative, spam, needs_info
  - `confidence_score` (decimal) - Classification confidence 0-1
  - `received_at` (timestamptz) - Receipt timestamp
  - `read_at` (timestamptz, nullable) - When reply was read
  - `responded_at` (timestamptz, nullable) - When we responded

  ### 8. follow_ups
  - `id` (uuid, primary key) - Auto-generated follow-up ID
  - `message_id` (uuid, foreign key) - Original message
  - `page_id` (uuid, foreign key) - Target page
  - `sequence_number` (integer) - Follow-up number (1, 2, 3)
  - `draft_id` (uuid, foreign key, nullable) - Associated draft
  - `scheduled_for` (timestamptz) - When to send
  - `status` (text) - Status: pending, sent, skipped, cancelled
  - `sent_at` (timestamptz, nullable) - Actual send time
  - `created_at` (timestamptz) - Record creation

  ### 9. audit_logs
  - `id` (uuid, primary key) - Auto-generated log ID
  - `user_id` (uuid, foreign key, nullable) - User who performed action
  - `action` (text) - Action type
  - `entity_type` (text) - Entity affected (page, draft, message, etc)
  - `entity_id` (uuid, nullable) - ID of affected entity
  - `details` (jsonb) - Additional details
  - `timestamp` (timestamptz) - When action occurred
  - `ip_address` (text, nullable) - User IP address

  ### 10. settings
  - `id` (uuid, primary key) - Auto-generated setting ID
  - `key` (text, unique) - Setting key
  - `value` (jsonb) - Setting value
  - `description` (text) - Setting description
  - `updated_at` (timestamptz) - Last update timestamp
  - `updated_by` (uuid, foreign key, nullable) - User who updated

  ## Security
  - Enable RLS on all tables
  - Policies enforce role-based access control
  - Audit logs track all significant actions
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'analyst',
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  CONSTRAINT valid_role CHECK (role IN ('admin', 'moderator', 'sales', 'analyst'))
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  page_id text,
  name text NOT NULL,
  category text,
  contact_email text,
  about text,
  cover_image_url text,
  profile_image_url text,
  last_analyzed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  overall_score integer NOT NULL,
  issues jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  images_analyzed integer DEFAULT 0,
  need_decision text NOT NULL,
  confidence_score decimal(3,2) NOT NULL,
  rationale text NOT NULL,
  analysis_date timestamptz DEFAULT now(),
  analyzed_by uuid REFERENCES users(id),
  CONSTRAINT valid_score CHECK (overall_score >= 0 AND overall_score <= 100),
  CONSTRAINT valid_decision CHECK (need_decision IN ('yes', 'maybe', 'no')),
  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  pages_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'completed', 'archived'))
);

-- Create drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  fb_message text,
  email_subject text,
  email_body text,
  pdf_path text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  scheduled_for timestamptz,
  version integer DEFAULT 1,
  CONSTRAINT valid_draft_status CHECK (status IN ('pending', 'approved', 'rejected', 'sent', 'scheduled'))
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES drafts(id) ON DELETE CASCADE,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  platform text NOT NULL,
  platform_message_id text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES users(id),
  error_message text,
  CONSTRAINT valid_platform CHECK (platform IN ('facebook', 'email')),
  CONSTRAINT valid_message_status CHECK (status IN ('sent', 'delivered', 'failed', 'bounced'))
);

-- Create replies table
CREATE TABLE IF NOT EXISTS replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  platform text NOT NULL,
  content text NOT NULL,
  classification text DEFAULT 'neutral',
  confidence_score decimal(3,2),
  received_at timestamptz DEFAULT now(),
  read_at timestamptz,
  responded_at timestamptz,
  CONSTRAINT valid_reply_platform CHECK (platform IN ('facebook', 'email')),
  CONSTRAINT valid_classification CHECK (classification IN ('positive', 'neutral', 'negative', 'spam', 'needs_info')),
  CONSTRAINT valid_reply_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  sequence_number integer NOT NULL,
  draft_id uuid REFERENCES drafts(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_followup_status CHECK (status IN ('pending', 'sent', 'skipped', 'cancelled'))
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  ip_address text
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for pages table
CREATE POLICY "Authenticated users can read pages"
  ON pages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Page creators can update their pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete pages"
  ON pages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for analyses table
CREATE POLICY "Authenticated users can read analyses"
  ON analyses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create analyses"
  ON analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = analyzed_by);

-- RLS Policies for campaigns table
CREATE POLICY "Authenticated users can read campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Moderators and admins can create campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Campaign creators and admins can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for drafts table
CREATE POLICY "Authenticated users can read drafts"
  ON drafts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create drafts"
  ON drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Moderators can update drafts"
  ON drafts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')
    )
  );

-- RLS Policies for messages table
CREATE POLICY "Authenticated users can read messages"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Moderators can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sent_by AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin', 'sales')
    )
  );

-- RLS Policies for replies table
CREATE POLICY "Authenticated users can read replies"
  ON replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert replies"
  ON replies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update reply status"
  ON replies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for follow_ups table
CREATE POLICY "Authenticated users can read follow_ups"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage follow_ups"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Moderators can update follow_ups"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for settings table
CREATE POLICY "Authenticated users can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pages_created_by ON pages(created_by);
CREATE INDEX IF NOT EXISTS idx_pages_last_analyzed ON pages(last_analyzed_at);
CREATE INDEX IF NOT EXISTS idx_analyses_page_id ON analyses(page_id);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_by ON analyses(analyzed_by);
CREATE INDEX IF NOT EXISTS idx_analyses_need_decision ON analyses(need_decision);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_drafts_campaign_id ON drafts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_drafts_page_id ON drafts(page_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_messages_draft_id ON messages(draft_id);
CREATE INDEX IF NOT EXISTS idx_messages_page_id ON messages(page_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_replies_message_id ON replies(message_id);
CREATE INDEX IF NOT EXISTS idx_replies_classification ON replies(classification);
CREATE INDEX IF NOT EXISTS idx_follow_ups_message_id ON follow_ups(message_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('daily_send_limit', '100', 'Maximum messages to send per day'),
  ('follow_up_delay_days', '[5, 12, 25]', 'Days to wait for follow-ups'),
  ('auto_approve_enabled', 'false', 'Enable auto-approval for drafts'),
  ('need_threshold_score', '60', 'Score below which pages need help'),
  ('moderator_approval_required', 'true', 'Require moderator approval before sending')
ON CONFLICT (key) DO NOTHING;