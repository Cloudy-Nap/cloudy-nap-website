-- Bundle / deal packages for the storefront (CMS-managed).
-- Run in Supabase SQL editor.

create table if not exists public.catalog_deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  deal_price numeric(12, 2) not null default 0,
  image text,
  image_urls jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.catalog_deals.items is
  'JSON array: [{ "catalog_type": "bed|accessory|furniture|sofacumbed", "product_id": "id", "quantity": 1, "is_free": false, "label": "Optional display name" }]';

create index if not exists catalog_deals_active_sort_idx
  on public.catalog_deals (is_active, sort_order);
