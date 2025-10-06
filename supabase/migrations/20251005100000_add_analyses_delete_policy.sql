-- This migration file first drops all existing RLS policies and then recreates them, including the new delete policy for admins/moderators.

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read pages" ON public.pages;
DROP POLICY IF EXISTS "Authenticated users can insert pages" ON public.pages;
DROP POLICY IF EXISTS "Page creators can update their pages" ON public.pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON public.pages;
DROP POLICY IF EXISTS "Authenticated users can read analyses" ON public.analyses;
DROP POLICY IF EXISTS "Authenticated users can create analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analyses; -- Also drop the old one if it exists
DROP POLICY IF EXISTS "Admins and moderators can delete analyses" ON public.analyses; -- And the new one
DROP POLICY IF EXISTS "Authenticated users can read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Moderators and admins can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Campaign creators and admins can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can read drafts" ON public.drafts;
DROP POLICY IF EXISTS "Authenticated users can create drafts" ON public.drafts;
DROP POLICY IF EXISTS "Moderators can update drafts" ON public.drafts;
DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Moderators can create messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can read replies" ON public.replies;
DROP POLICY IF EXISTS "System can insert replies" ON public.replies;
DROP POLICY IF EXISTS "Users can update reply status" ON public.replies;
DROP POLICY IF EXISTS "Authenticated users can read follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "System can manage follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Moderators can update follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;

-- Recreate all policies

-- RLS Policies for users table
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for pages table
CREATE POLICY "Authenticated users can read pages" ON public.pages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pages" ON public.pages FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Page creators can update their pages" ON public.pages FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can delete pages" ON public.pages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- RLS Policies for analyses table
CREATE POLICY "Authenticated users can read analyses" ON public.analyses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create analyses" ON public.analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = analyzed_by);
CREATE POLICY "Admins and moderators can delete analyses" ON public.analyses FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'moderator')));

-- RLS Policies for campaigns table
CREATE POLICY "Authenticated users can read campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Moderators and admins can create campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')));
CREATE POLICY "Campaign creators and admins can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')) WITH CHECK (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- RLS Policies for drafts table
CREATE POLICY "Authenticated users can read drafts" ON public.drafts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create drafts" ON public.drafts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Moderators can update drafts" ON public.drafts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin'))) WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')));

-- RLS Policies for messages table
CREATE POLICY "Authenticated users can read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Moderators can create messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sent_by AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin', 'sales')));

-- RLS Policies for replies table
CREATE POLICY "Authenticated users can read replies" ON public.replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert replies" ON public.replies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update reply status" ON public.replies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for follow_ups table
CREATE POLICY "Authenticated users can read follow_ups" ON public.follow_ups FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage follow_ups" ON public.follow_ups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Moderators can update follow_ups" ON public.follow_ups FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin'))) WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')));

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for settings table
CREATE POLICY "Authenticated users can read settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
