-- ==============================================================================
-- SALTY AUTO: OPENREPLY-GRADE FEATURES SCHEMA MIGRATION (v1.1)
-- Adds support for:
-- 1. Rich Button Templates (up to 3 clickable buttons: web_url or postback)
-- 2. Follower-Gate Verification ("Require Follow" before link reveal)
-- 3. Tracked Link Shortener & Click Analytics (/r/[slug])
-- 4. Scheduled Follow-up DMs & "Attach to Next Reel" workflows
-- ==============================================================================

-- 1. Extend auto_automation_rules with OpenReply features
ALTER TABLE public.auto_automation_rules
  ADD COLUMN IF NOT EXISTS buttons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS require_follow BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_prompt_message TEXT,
  ADD COLUMN IF NOT EXISTS follow_prompt_button_label TEXT DEFAULT 'I Followed! Unlock Link',
  ADD COLUMN IF NOT EXISTS follow_up_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_message TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_delay_minutes INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS pending_next_reel BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whole_word_match BOOLEAN DEFAULT true;

-- 2. Create auto_tracked_links table
CREATE TABLE IF NOT EXISTS public.auto_tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.auto_workspaces(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.auto_automation_rules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  label TEXT,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create auto_link_clicks table for CTR & visitor analytics
CREATE TABLE IF NOT EXISTS public.auto_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.auto_workspaces(id) ON DELETE CASCADE,
  tracked_link_id UUID NOT NULL REFERENCES public.auto_tracked_links(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.auto_automation_rules(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. High-performance lookup indexes
CREATE INDEX IF NOT EXISTS idx_auto_tracked_links_slug ON public.auto_tracked_links(slug);
CREATE INDEX IF NOT EXISTS idx_auto_tracked_links_rule_id ON public.auto_tracked_links(rule_id);
CREATE INDEX IF NOT EXISTS idx_auto_link_clicks_tracked_link ON public.auto_link_clicks(tracked_link_id);
CREATE INDEX IF NOT EXISTS idx_auto_link_clicks_created_at ON public.auto_link_clicks(created_at);

-- 5. Row-Level Security (RLS) Configuration
ALTER TABLE public.auto_tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on auto_tracked_links"
  ON public.auto_tracked_links FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on auto_link_clicks"
  ON public.auto_link_clicks FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public anonymous select for link redirect"
  ON public.auto_tracked_links FOR SELECT
  TO anon USING (true);
