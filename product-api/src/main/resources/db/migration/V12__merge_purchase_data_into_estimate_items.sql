ALTER TABLE estimate_items
    ADD COLUMN actual_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN actual_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN actual_line_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    ADD COLUMN purchase_source_name VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN purchase_source_url VARCHAR(1000) NOT NULL DEFAULT '',
    ADD COLUMN purchase_note VARCHAR(1000) NOT NULL DEFAULT '';

UPDATE estimates
SET status = 'IN_PROGRESS'
WHERE status IN ('READY_FOR_PURCHASE', 'IN_PURCHASE');

WITH estimate_ranked AS (
    SELECT
        ei.id,
        ei.estimate_id,
        ei.material_id,
        ROW_NUMBER() OVER (PARTITION BY ei.estimate_id, ei.material_id ORDER BY ei.id) AS rn
    FROM estimate_items ei
    WHERE ei.material_id IS NOT NULL
),
purchase_ranked AS (
    SELECT
        pi.id,
        p.estimate_id,
        pi.material_id,
        pi.actual_quantity,
        pi.actual_price,
        pi.actual_line_total,
        COALESCE(NULLIF(p.supplier_name, ''), '') AS supplier_name,
        COALESCE(NULLIF(p.supplier_url, ''), '') AS supplier_url,
        COALESCE(NULLIF(pi.comment, ''), '') AS purchase_note,
        ROW_NUMBER() OVER (PARTITION BY p.estimate_id, pi.material_id ORDER BY pi.id) AS rn
    FROM purchase_items pi
    JOIN purchases p ON p.id = pi.purchase_id
)
UPDATE estimate_items ei
SET actual_quantity = pr.actual_quantity,
    actual_price = pr.actual_price,
    actual_line_total = pr.actual_line_total,
    purchase_source_name = pr.supplier_name,
    purchase_source_url = pr.supplier_url,
    purchase_note = pr.purchase_note
FROM estimate_ranked er
JOIN purchase_ranked pr
  ON pr.estimate_id = er.estimate_id
 AND pr.material_id = er.material_id
 AND pr.rn = er.rn
WHERE ei.id = er.id;
