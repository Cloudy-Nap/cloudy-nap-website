-- Run in Supabase SQL Editor once. Batch category discounts for Cloudynap storefront.

create table if not exists public.category_batch_discounts (
  category text primary key
    check (category in ('bed', 'accessory', 'furniture', 'sofacumbed')),
  discount_percent numeric(6, 2) not null
    check (discount_percent > 0 and discount_percent <= 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists category_batch_discounts_time_idx
  on public.category_batch_discounts (starts_at, ends_at);

comment on table public.category_batch_discounts is 'CMS batch discounts per catalog type (bed, accessory, furniture, sofacumbed).';
