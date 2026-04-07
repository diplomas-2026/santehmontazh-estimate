CREATE TABLE supplier_materials (
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    PRIMARY KEY (supplier_id, material_id)
);

INSERT INTO supplier_materials (supplier_id, material_id)
SELECT DISTINCT so.supplier_id, pi.material_id
FROM supplier_offers so
JOIN purchase_items pi ON pi.id = so.purchase_item_id
WHERE pi.material_id IS NOT NULL
ON CONFLICT DO NOTHING;
