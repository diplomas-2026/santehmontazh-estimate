create table users (
    id bigserial primary key,
    full_name varchar(255) not null,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    role varchar(50) not null,
    active boolean not null default true,
    created_at timestamptz not null
);

create table projects (
    id bigserial primary key,
    name varchar(255) not null,
    code varchar(255) not null unique,
    address varchar(255) not null,
    description text not null,
    status varchar(50) not null,
    planned_start_date date not null,
    planned_end_date date not null,
    created_at timestamptz not null
);

create table material_categories (
    id bigserial primary key,
    name varchar(255) not null unique,
    description text not null
);

create table materials (
    id bigserial primary key,
    name varchar(255) not null,
    sku varchar(255) not null unique,
    unit varchar(50) not null,
    category_id bigint not null references material_categories(id),
    default_price numeric(12,2) not null,
    description text not null,
    active boolean not null default true
);

create table suppliers (
    id bigserial primary key,
    name varchar(255) not null unique,
    contact_person varchar(255) not null,
    phone varchar(255) not null,
    email varchar(255) not null,
    address text not null,
    rating numeric(3,2) not null,
    active boolean not null default true
);

create table estimates (
    id bigserial primary key,
    project_id bigint not null references projects(id),
    name varchar(255) not null,
    version integer not null,
    status varchar(50) not null,
    notes text not null,
    created_by bigint not null references users(id),
    base_estimate_id bigint references estimates(id),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table estimate_items (
    id bigserial primary key,
    estimate_id bigint not null references estimates(id) on delete cascade,
    material_id bigint not null references materials(id),
    work_name varchar(255) not null,
    quantity numeric(12,2) not null,
    unit_price numeric(12,2) not null,
    line_total numeric(14,2) not null,
    comment text not null
);

create table purchases (
    id bigserial primary key,
    project_id bigint not null references projects(id),
    estimate_id bigint not null references estimates(id),
    created_by bigint not null references users(id),
    status varchar(50) not null,
    planned_total numeric(14,2) not null,
    actual_total numeric(14,2) not null,
    supplier_name varchar(255) not null,
    comment text not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table purchase_items (
    id bigserial primary key,
    purchase_id bigint not null references purchases(id) on delete cascade,
    material_id bigint not null references materials(id),
    planned_quantity numeric(12,2) not null,
    planned_price numeric(12,2) not null,
    planned_line_total numeric(14,2) not null,
    actual_quantity numeric(12,2) not null,
    actual_price numeric(12,2) not null,
    actual_line_total numeric(14,2) not null,
    comment text not null
);

create table supplier_offers (
    id bigserial primary key,
    purchase_item_id bigint not null references purchase_items(id) on delete cascade,
    supplier_id bigint not null references suppliers(id),
    offered_price numeric(12,2) not null,
    delivery_days integer not null,
    comment text not null,
    selected boolean not null default false
);

create table approval_comments (
    id bigserial primary key,
    entity_type varchar(50) not null,
    entity_id bigint not null,
    author_id bigint not null references users(id),
    message text not null,
    created_at timestamptz not null
);

create table audit_events (
    id bigserial primary key,
    entity_type varchar(50) not null,
    entity_id bigint not null,
    action varchar(255) not null,
    actor_id bigint not null references users(id),
    details text not null,
    created_at timestamptz not null
);
