-- ── Club Transfers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_transfers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id        UUID        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_name    TEXT        NOT NULL,
  direction      TEXT        NOT NULL CHECK (direction IN ('in', 'out')),
  fee_band       TEXT,                          -- e.g. 'Free', 'Loan', '£0-5m', '£5-15m', '£15m+'
  fee_amount     NUMERIC,                       -- raw fee in units (e.g. 7500000)
  fee_currency   TEXT        DEFAULT '€',
  age_at_transfer INTEGER,
  nationality    TEXT,
  position       TEXT,
  other_club     TEXT,
  transfer_type  TEXT,                          -- 'Permanent', 'Loan', 'Free', 'End of Contract'
  transfer_date  DATE,
  season         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_transfers_club_id  ON public.club_transfers(club_id);
CREATE INDEX IF NOT EXISTS idx_club_transfers_user_id  ON public.club_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_club_transfers_season   ON public.club_transfers(season);
CREATE INDEX IF NOT EXISTS idx_club_transfers_direction ON public.club_transfers(direction);

ALTER TABLE public.club_transfers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_transfers' AND policyname = 'club_transfers_user_policy'
  ) THEN
    CREATE POLICY club_transfers_user_policy ON public.club_transfers
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Club Pathway Data ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_pathway_data (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id                 UUID        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  season                  TEXT        NOT NULL,
  academy_debuts          INTEGER,               -- first-team debuts by academy graduates
  u21_minutes_percentage  NUMERIC,               -- % of league minutes by U21 players (0-100)
  internal_promotions     INTEGER,               -- promotions from academy/B-team to first team
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, season)
);

CREATE INDEX IF NOT EXISTS idx_club_pathway_data_club_id ON public.club_pathway_data(club_id);
ALTER TABLE public.club_pathway_data ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_pathway_data' AND policyname = 'club_pathway_data_user_policy'
  ) THEN
    CREATE POLICY club_pathway_data_user_policy ON public.club_pathway_data
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Extend club_season_results with league_label ────────────────────────────────
ALTER TABLE public.club_season_results
  ADD COLUMN IF NOT EXISTS league_label TEXT;
