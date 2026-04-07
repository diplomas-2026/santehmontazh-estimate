alter table projects
    add column if not exists owner_id bigint references users(id);

update projects p
set owner_id = coalesce(
    (
        select e.created_by
        from estimates e
        where e.project_id = p.id
        order by e.created_at
        limit 1
    ),
    (
        select pu.created_by
        from purchases pu
        where pu.project_id = p.id
        order by pu.created_at
        limit 1
    ),
    (
        select u.id
        from users u
        where u.role = 'ADMIN'
        order by u.id
        limit 1
    )
)
where owner_id is null;

alter table projects
    alter column owner_id set not null;

update users
set role = 'BASE_USER'
where role in ('ESTIMATOR', 'PURCHASER', 'MANAGER');
