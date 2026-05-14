-- =================================================================
-- SentinelX SIEM — Supabase Row Level Security (RLS) Policies
-- =================================================================
-- All policies enforce org_id isolation. The JWT must contain
-- an org_id claim set during Supabase Auth hook / user creation.
-- =================================================================

-- Helper: Extract org_id from JWT
CREATE OR REPLACE FUNCTION auth.org_id() RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'org_id')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'role';
$$ LANGUAGE SQL STABLE;

-- ----------------------------------------------------------------
-- organizations
-- ----------------------------------------------------------------
CREATE POLICY "org_members_can_view_own_org"
  ON organizations FOR SELECT
  USING (id = auth.org_id());

CREATE POLICY "org_admins_can_update_org"
  ON organizations FOR UPDATE
  USING (id = auth.org_id() AND auth.user_role() IN ('super_admin', 'org_admin'));

-- ----------------------------------------------------------------
-- users
-- ----------------------------------------------------------------
CREATE POLICY "users_can_view_own_org_users"
  ON users FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "org_admins_can_manage_users"
  ON users FOR ALL
  USING (org_id = auth.org_id() AND auth.user_role() IN ('super_admin', 'org_admin'));

-- ----------------------------------------------------------------
-- api_keys
-- ----------------------------------------------------------------
CREATE POLICY "users_view_own_api_keys"
  ON api_keys FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "users_manage_own_api_keys"
  ON api_keys FOR ALL
  USING (org_id = auth.org_id() AND auth.user_role() IN ('super_admin', 'org_admin', 'analyst'));

-- ----------------------------------------------------------------
-- logs_metadata
-- ----------------------------------------------------------------
CREATE POLICY "logs_tenant_isolation"
  ON logs_metadata FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "service_role_can_insert_logs"
  ON logs_metadata FOR INSERT
  WITH CHECK (TRUE); -- Parser service uses service role key

-- ----------------------------------------------------------------
-- detection_rules
-- ----------------------------------------------------------------
CREATE POLICY "users_view_rules"
  ON detection_rules FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "analysts_manage_rules"
  ON detection_rules FOR ALL
  USING (org_id = auth.org_id() AND auth.user_role() IN ('super_admin', 'org_admin', 'analyst'));

-- ----------------------------------------------------------------
-- alerts
-- ----------------------------------------------------------------
CREATE POLICY "users_view_alerts"
  ON alerts FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "service_can_insert_alerts"
  ON alerts FOR INSERT
  WITH CHECK (TRUE); -- Detection service uses service role key

CREATE POLICY "analysts_update_alerts"
  ON alerts FOR UPDATE
  USING (org_id = auth.org_id() AND auth.user_role() IN ('super_admin', 'org_admin', 'analyst'));

-- ----------------------------------------------------------------
-- incidents
-- ----------------------------------------------------------------
CREATE POLICY "users_view_incidents"
  ON incidents FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "analysts_manage_incidents"
  ON incidents FOR ALL
  USING (org_id = auth.org_id() AND auth.user_role() IN ('super_admin', 'org_admin', 'analyst'));

-- ----------------------------------------------------------------
-- dashboards
-- ----------------------------------------------------------------
CREATE POLICY "users_view_dashboards"
  ON dashboards FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "users_manage_own_dashboards"
  ON dashboards FOR ALL
  USING (org_id = auth.org_id());

-- ----------------------------------------------------------------
-- integrations
-- ----------------------------------------------------------------
CREATE POLICY "admins_manage_integrations"
  ON integrations FOR ALL
  USING (org_id = auth.org_id() AND auth.user_role() IN ('super_admin', 'org_admin'));
