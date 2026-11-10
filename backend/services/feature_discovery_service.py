"""
feature_discovery_service.py — Dynamic latent feature promotion.

How it works:
  1. Every time OpenAI returns latent_vars for a correction, we record
     each non-null key via record_latent_keys().
  2. Periodically (every 24h via APScheduler), check_and_promote() runs:
     - Any key that has appeared ≥ PROMOTION_THRESHOLD times and is not
       yet promoted gets promoted to a real float column on
       user_behavior_events via a Supabase RPC function.
     - Existing JSONB data is backfilled into the new column automatically.

Required Supabase setup (run once in the SQL editor):
─────────────────────────────────────────────────────
-- Table to track how often each latent key has been seen
CREATE TABLE IF NOT EXISTS latent_key_stats (
    key          text        PRIMARY KEY,
    count        integer     NOT NULL DEFAULT 0,
    promoted     boolean     NOT NULL DEFAULT false,
    promoted_at  timestamptz
);

-- Atomic increment function (avoids read-modify-write race)
CREATE OR REPLACE FUNCTION increment_latent_key(key_name text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO latent_key_stats (key, count, promoted)
    VALUES (key_name, 1, false)
    ON CONFLICT (key) DO UPDATE
        SET count = latent_key_stats.count + 1;
END;
$$;

-- Promotion function: adds column + backfills + marks promoted
-- Uses SECURITY DEFINER so the API role can run ALTER TABLE
CREATE OR REPLACE FUNCTION promote_latent_column(col_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Add column if it doesn't exist yet
    EXECUTE format(
        'ALTER TABLE user_behavior_events ADD COLUMN IF NOT EXISTS %I float',
        col_name
    );
    -- Backfill from existing JSONB data
    EXECUTE format(
        'UPDATE user_behavior_events
            SET %I = (latent_features->>%L)::float
          WHERE latent_features ? %L
            AND %I IS NULL',
        col_name, col_name, col_name, col_name
    );
    -- Mark as promoted
    UPDATE latent_key_stats
       SET promoted = true, promoted_at = now()
     WHERE key = col_name;
END;
$$;
─────────────────────────────────────────────────────
"""

import re

# Key must appear this many times across all users before being promoted
PROMOTION_THRESHOLD = 50

# Postgres identifier: starts with letter, only lowercase letters/digits/underscores, ≤63 chars
_SAFE_KEY = re.compile(r'^[a-z][a-z0-9_]{0,62}$')

# Keys that should never become real columns regardless of frequency
_BLOCKED_KEYS = {"id", "user_id", "task_id", "action", "created_at", "slot_offered",
                 "priority_norm", "urgency_norm", "duration_fit", "latent_features"}


def sanitize_latent_key(key: str) -> str | None:
    """
    Normalise a latent key to a safe Postgres column name.
    Returns None if the key cannot be made safe.
    """
    clean = key.strip().lower().replace(" ", "_").replace("-", "_")
    if not _SAFE_KEY.match(clean):
        return None
    if clean in _BLOCKED_KEYS:
        return None
    return clean


class FeatureDiscoveryService:

    def __init__(self, repo):
        self.repo = repo

    # ── Called on every correction event ─────────────────────────────────────

    def record_latent_keys(self, latent_vars: dict) -> None:
        """
        Increment the seen-count for each non-null key returned by OpenAI.
        Safe keys only — invalid names are silently dropped.
        """
        for key, val in latent_vars.items():
            if val is None:
                continue
            safe = sanitize_latent_key(key)
            if safe:
                try:
                    self.repo.increment_latent_key_count(safe)
                except Exception:
                    pass  # never block the correction pipeline

    # ── Called every 24h by APScheduler ──────────────────────────────────────

    def check_and_promote(self) -> list[str]:
        """
        Promote any key that has crossed PROMOTION_THRESHOLD and is not yet
        a real column.  Returns the list of keys that were promoted this run.
        """
        promoted = []
        try:
            candidates = self.repo.get_promotable_latent_keys(PROMOTION_THRESHOLD)
        except Exception:
            return promoted

        for key in candidates:
            safe = sanitize_latent_key(key)
            if not safe:
                continue
            try:
                self.repo.promote_latent_column(safe)
                promoted.append(safe)
                print(f"  [feature_discovery] Promoted latent key → column: {safe}")
            except Exception as e:
                print(f"  [feature_discovery] Failed to promote '{safe}': {e}")

        return promoted
