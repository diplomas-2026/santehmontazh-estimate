alter table estimate_items
    alter column material_id drop not null,
    alter column work_name drop not null;
