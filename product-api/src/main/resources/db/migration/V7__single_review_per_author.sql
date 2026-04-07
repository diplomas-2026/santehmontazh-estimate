DELETE FROM material_reviews older
USING material_reviews newer
WHERE older.material_id = newer.material_id
  AND older.author_id = newer.author_id
  AND (
    older.created_at < newer.created_at
    OR (older.created_at = newer.created_at AND older.id < newer.id)
  );

ALTER TABLE material_reviews
    ADD CONSTRAINT uq_material_reviews_material_author UNIQUE (material_id, author_id);

DELETE FROM supplier_reviews older
USING supplier_reviews newer
WHERE older.supplier_id = newer.supplier_id
  AND older.author_id = newer.author_id
  AND (
    older.created_at < newer.created_at
    OR (older.created_at = newer.created_at AND older.id < newer.id)
  );

ALTER TABLE supplier_reviews
    ADD CONSTRAINT uq_supplier_reviews_supplier_author UNIQUE (supplier_id, author_id);
