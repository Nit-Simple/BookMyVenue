DROP INDEX IF EXISTS idx_venue_app_owner_submitted;
DROP INDEX IF EXISTS idx_venue_app_status_submitted;
DROP INDEX IF EXISTS idx_venue_app_pending_lookup;
DROP TABLE IF EXISTS venue_application;
DROP TYPE IF EXISTS venue_application_type;
DROP TYPE IF EXISTS venue_application_status;
