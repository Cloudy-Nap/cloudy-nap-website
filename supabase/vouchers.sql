-- Run this file OR supabase/single_voucher.sql (same migration).
-- Table name: single_voucher

create table if not exists public.single_voucher (
  id bigint generated always as identity not null,
  name text not null,
  code text not null,
  discount_percent numeric(5, 2) not null,
  is_used boolean not null default false,
  used_at timestamp with time zone null,
  used_by_order_id bigint null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint single_voucher_pkey primary key (id),
  constraint single_voucher_code_key unique (code),
  constraint single_voucher_discount_percent_check check (
    discount_percent > 0
    and discount_percent <= 100
  )
);

create index if not exists idx_single_voucher_code on public.single_voucher using btree (code);
create index if not exists idx_single_voucher_is_used on public.single_voucher using btree (is_used);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'single_voucher_used_by_order_id_fkey'
  ) then
    alter table public.single_voucher
      add constraint single_voucher_used_by_order_id_fkey
      foreign key (used_by_order_id) references public.orders (id) on delete set null;
  end if;
end $$;

alter table public.orders drop constraint if exists orders_voucher_id_fkey;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_voucher_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_voucher_id_fkey
      foreign key (voucher_id) references public.single_voucher (id) on delete set null;
  end if;
end $$;
