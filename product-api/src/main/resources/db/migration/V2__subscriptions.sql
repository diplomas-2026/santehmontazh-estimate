create table subscriptions (
    id bigserial primary key,
    user_id bigint not null unique references users(id) on delete cascade,
    tier_id varchar(100) not null,
    tier_name varchar(255) not null,
    period_id varchar(100) not null,
    period_label varchar(255) not null,
    price_label varchar(255) not null,
    company_name varchar(255) not null,
    card_holder varchar(255) not null,
    status varchar(50) not null,
    activated_at timestamptz not null,
    expires_at timestamptz not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);
