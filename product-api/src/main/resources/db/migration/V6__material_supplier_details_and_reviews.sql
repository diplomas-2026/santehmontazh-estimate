alter table materials
    add column if not exists photo_url varchar(1000);

alter table suppliers
    add column if not exists website_url varchar(1000),
    add column if not exists telegram varchar(255);

create table if not exists material_reviews (
    id bigserial primary key,
    material_id bigint not null references materials(id) on delete cascade,
    author_id bigint not null references users(id) on delete cascade,
    rating integer not null,
    comment varchar(1000) not null,
    created_at timestamptz not null default now()
);

create table if not exists supplier_reviews (
    id bigserial primary key,
    supplier_id bigint not null references suppliers(id) on delete cascade,
    author_id bigint not null references users(id) on delete cascade,
    rating integer not null,
    comment varchar(1000) not null,
    created_at timestamptz not null default now()
);
