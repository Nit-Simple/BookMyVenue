CREATE TYPE venue_application_status AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE venue_application_type AS ENUM ('NEW_VENUE', 'PRICING_UPDATE');

CREATE TABLE venue_application (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id       UUID NOT NULL REFERENCES venue(venue_id) ON DELETE CASCADE,
    owner_id       UUID NOT NULL,
    type           venue_application_type NOT NULL DEFAULT 'NEW_VENUE',
    status         venue_application_status NOT NULL DEFAULT 'PENDING_REVIEW',
    reviewed_by    UUID,
    admin_notes    TEXT,
    submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venue_app_pending_lookup ON venue_application(venue_id, type)
    WHERE status = 'PENDING_REVIEW';
CREATE INDEX idx_venue_app_status_submitted ON venue_application(status, submitted_at DESC);
CREATE INDEX idx_venue_app_owner_submitted ON venue_application(owner_id, submitted_at DESC);
