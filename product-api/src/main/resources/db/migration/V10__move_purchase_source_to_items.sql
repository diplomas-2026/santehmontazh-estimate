ALTER TABLE purchase_items
ADD COLUMN supplier_name VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN supplier_url VARCHAR(1000) NOT NULL DEFAULT '';

UPDATE purchase_items item
SET supplier_name = purchase.supplier_name,
    supplier_url = purchase.supplier_url
FROM purchases purchase
WHERE item.purchase_id = purchase.id
  AND item.supplier_name = ''
  AND item.supplier_url = '';
