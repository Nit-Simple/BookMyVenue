CREATE TYPE venue_onboarding_status AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

CREATE TABLE venue (
    venue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL, -- References User(user_id)
    
    onboarding_status venue_onboarding_status NOT NULL DEFAULT 'PENDING_APPROVAL',
    reviewed_by UUID,       -- References User(user_id) of the admn
    admin_notes TEXT,       -- Stores reason if rejected
    
    venue_name TEXT NOT NULL,
    addressline_1 TEXT NOT NULL,
    addressline_2 TEXT,
    phone TEXT NOT NULL,
    phone_private TEXT,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country_code CHAR(2) NOT NULL, 
    location GEOGRAPHY(Point, 4326), 
    
    seating_capacity INT NOT NULL,
    min_booking_duration INTERVAL NOT NULL, 
    relaxation_period INTERVAL NOT NULL,
    opening_period TIME NOT NULL,
    closing_period TIME NOT NULL,
    
    is_air_conditioned BOOLEAN NOT NULL DEFAULT FALSE,
    venue_type TEXT NOT NULL, -- e.g., 'Cafe', 'Auditorium', 'Conference Hall'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venue_active_approved ON venue (onboarding_status) 
WHERE onboarding_status = 'APPROVED';

CREATE INDEX idx_venue_state_district_approved 
ON venue (state, district) 
WHERE onboarding_status = 'APPROVED';
