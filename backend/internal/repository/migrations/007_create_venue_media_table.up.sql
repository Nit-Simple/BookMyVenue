CREATE TABLE venue_media (
    media_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id    UUID NOT NULL REFERENCES venue(venue_id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    "primary"   BOOLEAN NOT NULL DEFAULT FALSE,
    metadata    JSONB,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venue_media_venue_id ON venue_media (venue_id);
CREATE INDEX idx_venue_media_sort ON venue_media (venue_id, sort_order);
CREATE UNIQUE INDEX idx_venue_media_primary ON venue_media (venue_id) WHERE "primary" = TRUE;
