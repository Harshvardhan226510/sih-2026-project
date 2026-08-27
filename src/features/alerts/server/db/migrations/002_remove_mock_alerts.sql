-- Remove all mock alert records (they have no historical value)
DELETE FROM alert_revisions WHERE alert_id LIKE 'mock-%';
DELETE FROM alerts WHERE source = 'mock';
DELETE FROM provider_status WHERE provider = 'mock';
