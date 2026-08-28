-- Remove mock records from production

DELETE FROM alerts WHERE source_id LIKE 'mock-%' OR id LIKE '%mock%';
DELETE FROM alert_revisions WHERE alert_id IN (SELECT id FROM alerts WHERE source_id LIKE 'mock-%' OR id LIKE '%mock%');
