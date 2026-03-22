-- ============================================================
-- Hui Lima Federation Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  handle TEXT,
  description TEXT,
  location TEXT,
  primary_color TEXT DEFAULT '#7c3aed',
  logo_url TEXT,
  contact TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved communities"
  ON communities FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- 2. Community members table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memberships"
  ON community_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read memberships in their communities"
  ON community_members FOR SELECT
  TO authenticated
  USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can manage members"
  ON community_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'organizer'
    )
  );

CREATE POLICY "Authenticated users can insert own membership"
  ON community_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Community sites table (replaces sites.json)
CREATE TABLE IF NOT EXISTS community_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  details TEXT,
  contact TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE community_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community sites"
  ON community_sites FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage community sites"
  ON community_sites FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_sites.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'organizer'
    )
  );

-- 4. Invite codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read unused codes to validate"
  ON invite_codes FOR SELECT
  TO authenticated
  USING (used_by IS NULL);

CREATE POLICY "Authenticated users can claim codes"
  ON invite_codes FOR UPDATE
  TO authenticated
  USING (used_by IS NULL)
  WITH CHECK (auth.uid() = used_by);

-- 5. Add community_id to existing tables
ALTER TABLE user_activity ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);
ALTER TABLE bot_findings ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);

CREATE INDEX IF NOT EXISTS idx_user_activity_community
  ON user_activity(community_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bot_findings_community
  ON bot_findings(community_id, created_at DESC);

-- 6. Seed the founding community
INSERT INTO communities (slug, name, handle, description, location, is_approved)
VALUES (
  'ikaikahussey',
  'Ikaika Hussey',
  '@ikaikahussey',
  'Collecting donations and organizing volunteers to support the residents in Waialua, Haleiwa, and elsewhere that are evacuating. List your donation sites and coordinate volunteer responses here.',
  'North Shore, Oahu, HI',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- 7. Backfill existing data to the founding community
UPDATE user_activity
SET community_id = (SELECT id FROM communities WHERE slug = 'ikaikahussey')
WHERE community_id IS NULL;

UPDATE bot_findings
SET community_id = (SELECT id FROM communities WHERE slug = 'ikaikahussey')
WHERE community_id IS NULL;

-- 8. Migrate sites.json data into community_sites
INSERT INTO community_sites (community_id, name, location, details, contact)
SELECT
  (SELECT id FROM communities WHERE slug = 'ikaikahussey'),
  s.name, s.location, s.details, s.contact
FROM (VALUES
  ('Kalihi Valley Station', '2406 Kalihi St, Honolulu, HI 96819', 'Seeking donations of canned goods, clothing, blankets', '808-221-2843'),
  ('Dole Plantation Lot', '64-1550 Kamehameha Hwy, Wahiawa', 'Drop-off for supplies and water. Open daily.', NULL)
) AS s(name, location, details, contact)
WHERE NOT EXISTS (SELECT 1 FROM community_sites LIMIT 1);

-- 9. Generate a few initial invite codes for testing
INSERT INTO invite_codes (code) VALUES
  ('HUILIMA-ALPHA-001'),
  ('HUILIMA-ALPHA-002'),
  ('HUILIMA-ALPHA-003')
ON CONFLICT (code) DO NOTHING;
