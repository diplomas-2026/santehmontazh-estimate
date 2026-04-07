ALTER TABLE purchases
    ADD COLUMN supplier_url VARCHAR(1000) NOT NULL DEFAULT '';

UPDATE purchases
SET status = 'IN_PROGRESS'
WHERE status IN ('SUBMITTED', 'APPROVED', 'ORDERED');

UPDATE purchases
SET status = 'COMPLETED'
WHERE status = 'RECEIVED';
