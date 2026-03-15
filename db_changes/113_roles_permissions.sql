insert into public.mst_admin_roles (role, created_at)
values ('Product User', now());

alter table public.mst_admin_roles
    add role_code varchar(100);

update public.mst_admin_roles set role_code = 'super_admin' where role = 'Super Admin';
update public.mst_admin_roles set role_code = 'franchise_admin' where role = 'Franchise Admin';
update public.mst_admin_roles set role_code = 'nutritionist' where role = 'Nutritionist';
update public.mst_admin_roles set role_code = 'blog_admin' where role = 'Blog Admin';
update public.mst_admin_roles set role_code = 'product_user' where role = 'Product User';