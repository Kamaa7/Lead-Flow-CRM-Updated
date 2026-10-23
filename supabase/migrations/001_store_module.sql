-- LeadFlow Store module: products, stock ledger, customers, cash memos / bills, payments.
-- Run this whole file once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to re-run.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.store_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.store_profiles (
  user_id       uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  business_name text not null default '',
  address       text,
  phone         text,
  email         text,
  gstin         text,
  memo_footer   text,
  currency      text not null default 'INR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sku             text,
  name            text not null check (length(trim(name)) > 0),
  unit            text not null default 'pcs',
  sale_price      numeric(12, 2) not null default 0 check (sale_price >= 0),
  tax_rate        numeric(5, 2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  stock_qty       numeric(12, 3) not null default 0 check (stock_qty >= 0),
  low_stock_alert numeric(12, 3) not null default 0 check (low_stock_alert >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists products_user_sku_key
  on public.products (user_id, lower(sku))
  where sku is not null and sku <> '';

create index if not exists products_user_name_idx on public.products (user_id, name);

create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  phone      text,
  email      text,
  address    text,
  gstin      text,
  notes      text,
  lead_id    uuid references public.leads (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_name_idx on public.customers (user_id, name);

create table if not exists public.doc_sequences (
  user_id     uuid not null references auth.users (id) on delete cascade,
  doc_type    text not null check (doc_type in ('cash_memo', 'bill')),
  last_number integer not null default 0,
  primary key (user_id, doc_type)
);

create table if not exists public.sales (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  doc_type         text not null check (doc_type in ('cash_memo', 'bill')),
  doc_number       text not null,
  sale_date        date not null default current_date,
  customer_id      uuid references public.customers (id) on delete set null,
  customer_name    text,
  customer_phone   text,
  customer_address text,
  customer_gstin   text,
  subtotal         numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount         numeric(12, 2) not null default 0 check (discount >= 0),
  tax_total        numeric(12, 2) not null default 0 check (tax_total >= 0),
  grand_total      numeric(12, 2) not null default 0 check (grand_total >= 0),
  amount_paid      numeric(12, 2) not null default 0 check (amount_paid >= 0),
  payment_method   text not null default 'cash',
  status           text not null check (status in ('paid', 'unpaid', 'partial')),
  notes            text,
  created_at       timestamptz not null default now(),
  constraint sales_paid_not_above_total check (amount_paid <= grand_total),
  constraint sales_user_doc_number_key unique (user_id, doc_number)
);

create index if not exists sales_user_date_idx on public.sales (user_id, sale_date desc, created_at desc);
create index if not exists sales_customer_idx on public.sales (customer_id);

create table if not exists public.sale_items (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references public.sales (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid references public.products (id) on delete restrict,
  position    integer not null,
  description text not null,
  unit        text not null default 'pcs',
  qty         numeric(12, 3) not null check (qty > 0),
  unit_price  numeric(12, 2) not null check (unit_price >= 0),
  tax_rate    numeric(5, 2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  line_amount numeric(12, 2) not null check (line_amount >= 0)
);

create index if not exists sale_items_sale_idx on public.sale_items (sale_id, position);
create index if not exists sale_items_product_idx on public.sale_items (product_id);

create table if not exists public.sale_payments (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  amount     numeric(12, 2) not null check (amount > 0),
  method     text not null default 'cash',
  note       text,
  paid_at    timestamptz not null default now()
);

create index if not exists sale_payments_sale_idx on public.sale_payments (sale_id, paid_at);

create table if not exists public.stock_movements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  change_qty    numeric(12, 3) not null check (change_qty <> 0),
  balance_after numeric(12, 3) not null,
  reason        text not null check (reason in ('opening', 'sale', 'adjustment', 'purchase', 'return')),
  note          text,
  sale_id       uuid references public.sales (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists store_profiles_updated_at on public.store_profiles;
create trigger store_profiles_updated_at before update on public.store_profiles
  for each row execute function public.store_set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.store_set_updated_at();

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers
  for each row execute function public.store_set_updated_at();

-- Opening stock entered when a product is created is written to the stock ledger.
create or replace function public.store_log_opening_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stock_qty <> 0 then
    insert into public.stock_movements (user_id, product_id, change_qty, balance_after, reason, note)
    values (new.user_id, new.id, new.stock_qty, new.stock_qty, 'opening', 'Opening stock');
  end if;
  return new;
end;
$$;

drop trigger if exists products_opening_stock on public.products;
create trigger products_opening_stock after insert on public.products
  for each row execute function public.store_log_opening_stock();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.store_profiles  enable row level security;
alter table public.products        enable row level security;
alter table public.customers       enable row level security;
alter table public.doc_sequences   enable row level security;
alter table public.sales           enable row level security;
alter table public.sale_items      enable row level security;
alter table public.sale_payments   enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists store_profiles_select on public.store_profiles;
drop policy if exists store_profiles_insert on public.store_profiles;
drop policy if exists store_profiles_update on public.store_profiles;
create policy store_profiles_select on public.store_profiles for select to authenticated using (user_id = auth.uid());
create policy store_profiles_insert on public.store_profiles for insert to authenticated with check (user_id = auth.uid());
create policy store_profiles_update on public.store_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists products_select on public.products;
drop policy if exists products_insert on public.products;
drop policy if exists products_update on public.products;
drop policy if exists products_delete on public.products;
create policy products_select on public.products for select to authenticated using (user_id = auth.uid());
create policy products_insert on public.products for insert to authenticated with check (user_id = auth.uid());
create policy products_update on public.products for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy products_delete on public.products for delete to authenticated using (user_id = auth.uid());

drop policy if exists customers_select on public.customers;
drop policy if exists customers_insert on public.customers;
drop policy if exists customers_update on public.customers;
drop policy if exists customers_delete on public.customers;
create policy customers_select on public.customers for select to authenticated using (user_id = auth.uid());
create policy customers_insert on public.customers for insert to authenticated with check (user_id = auth.uid());
create policy customers_update on public.customers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy customers_delete on public.customers for delete to authenticated using (user_id = auth.uid());

-- Sales, items, payments and the stock ledger are read-only to clients;
-- they are written only through the functions below.
drop policy if exists sales_select on public.sales;
drop policy if exists sale_items_select on public.sale_items;
drop policy if exists sale_payments_select on public.sale_payments;
drop policy if exists stock_movements_select on public.stock_movements;
create policy sales_select on public.sales for select to authenticated using (user_id = auth.uid());
create policy sale_items_select on public.sale_items for select to authenticated using (user_id = auth.uid());
create policy sale_payments_select on public.sale_payments for select to authenticated using (user_id = auth.uid());
create policy stock_movements_select on public.stock_movements for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on public.store_profiles, public.products, public.customers, public.doc_sequences,
  public.sales, public.sale_items, public.sale_payments, public.stock_movements from anon;

grant select, insert, update on public.store_profiles to authenticated;
grant select, insert, delete on public.products to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select on public.sales, public.sale_items, public.sale_payments, public.stock_movements to authenticated;
revoke all on public.doc_sequences from authenticated;
revoke insert, update, delete on public.sales, public.sale_items, public.sale_payments, public.stock_movements from authenticated;

-- stock_qty can only change through adjust_stock / create_sale so the ledger stays complete.
revoke update on public.products from authenticated;
grant update (sku, name, unit, sale_price, tax_rate, low_stock_alert, is_active) on public.products to authenticated;

-- ---------------------------------------------------------------------------
-- Functions (called with supabase.rpc)
-- ---------------------------------------------------------------------------

create or replace function public.create_sale(
  p_doc_type         text,
  p_items            jsonb,
  p_customer_id      uuid default null,
  p_customer_name    text default null,
  p_customer_phone   text default null,
  p_customer_address text default null,
  p_discount         numeric default 0,
  p_amount_paid      numeric default null,
  p_payment_method   text default 'cash',
  p_sale_date        date default null,
  p_notes            text default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_sale      public.sales;
  v_customer  public.customers;
  v_product   public.products;
  v_item      jsonb;
  v_pos       integer := 0;
  v_qty       numeric;
  v_price     numeric;
  v_rate      numeric;
  v_desc      text;
  v_unit      text;
  v_line      numeric;
  v_balance   numeric;
  v_subtotal  numeric := 0;
  v_tax_raw   numeric := 0;
  v_discount  numeric := round(coalesce(p_discount, 0), 2);
  v_tax       numeric;
  v_grand     numeric;
  v_paid      numeric;
  v_status    text;
  v_number    integer;
  v_method    text := coalesce(nullif(trim(p_payment_method), ''), 'cash');
  v_name      text := nullif(trim(p_customer_name), '');
  v_phone     text := nullif(trim(p_customer_phone), '');
  v_address   text := nullif(trim(p_customer_address), '');
  v_gstin     text := null;
begin
  if v_uid is null then
    raise exception 'You must be signed in';
  end if;

  if p_doc_type is null or p_doc_type not in ('cash_memo', 'bill') then
    raise exception 'Document type must be cash_memo or bill';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item';
  end if;

  if v_discount < 0 then
    raise exception 'Discount cannot be negative';
  end if;

  if p_customer_id is not null then
    select * into v_customer from public.customers where id = p_customer_id and user_id = v_uid;
    if not found then
      raise exception 'Customer not found';
    end if;
    v_name    := coalesce(v_name, v_customer.name);
    v_phone   := coalesce(v_phone, v_customer.phone);
    v_address := coalesce(v_address, v_customer.address);
    v_gstin   := v_customer.gstin;
  end if;

  if p_doc_type = 'bill' and v_name is null then
    raise exception 'A bill needs a customer name';
  end if;

  insert into public.doc_sequences (user_id, doc_type, last_number)
  values (v_uid, p_doc_type, 1)
  on conflict (user_id, doc_type) do update set last_number = public.doc_sequences.last_number + 1
  returning last_number into v_number;

  insert into public.sales (
    user_id, doc_type, doc_number, sale_date, customer_id,
    customer_name, customer_phone, customer_address, customer_gstin,
    payment_method, status, notes
  )
  values (
    v_uid, p_doc_type,
    case when p_doc_type = 'cash_memo' then 'CM-' else 'BILL-' end || lpad(v_number::text, 5, '0'),
    coalesce(p_sale_date, current_date), p_customer_id,
    v_name, v_phone, v_address, v_gstin,
    v_method, 'unpaid', nullif(trim(p_notes), '')
  )
  returning * into v_sale;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_pos := v_pos + 1;
    v_qty := round(nullif(v_item ->> 'qty', '')::numeric, 3);

    if v_qty is null or v_qty <= 0 then
      raise exception 'Item %: quantity must be greater than zero', v_pos;
    end if;

    if nullif(v_item ->> 'product_id', '') is not null then
      select * into v_product
      from public.products
      where id = (v_item ->> 'product_id')::uuid and user_id = v_uid
      for update;

      if not found then
        raise exception 'Item %: product not found', v_pos;
      end if;
      if not v_product.is_active then
        raise exception 'Item %: % is inactive', v_pos, v_product.name;
      end if;
      if v_product.stock_qty < v_qty then
        raise exception 'Not enough stock for % (available %, requested %)',
          v_product.name, trim_scale(v_product.stock_qty), trim_scale(v_qty);
      end if;

      v_price := coalesce(nullif(v_item ->> 'unit_price', '')::numeric, v_product.sale_price);
      v_rate  := coalesce(nullif(v_item ->> 'tax_rate', '')::numeric, v_product.tax_rate);
      v_desc  := coalesce(nullif(trim(v_item ->> 'description'), ''), v_product.name);
      v_unit  := v_product.unit;

      update public.products
      set stock_qty = stock_qty - v_qty
      where id = v_product.id
      returning stock_qty into v_balance;

      insert into public.stock_movements (user_id, product_id, change_qty, balance_after, reason, note, sale_id)
      values (v_uid, v_product.id, -v_qty, v_balance, 'sale', v_sale.doc_number, v_sale.id);
    else
      v_desc  := nullif(trim(v_item ->> 'description'), '');
      v_price := nullif(v_item ->> 'unit_price', '')::numeric;
      v_rate  := coalesce(nullif(v_item ->> 'tax_rate', '')::numeric, 0);
      v_unit  := coalesce(nullif(trim(v_item ->> 'unit'), ''), 'pcs');

      if v_desc is null then
        raise exception 'Item %: description is required', v_pos;
      end if;
      if v_price is null then
        raise exception 'Item %: price is required', v_pos;
      end if;
    end if;

    if v_price < 0 then
      raise exception 'Item %: price cannot be negative', v_pos;
    end if;
    if v_rate < 0 or v_rate > 100 then
      raise exception 'Item %: tax rate must be between 0 and 100', v_pos;
    end if;

    v_price := round(v_price, 2);
    v_rate  := round(v_rate, 2);
    v_line  := round(v_qty * v_price, 2);
    v_subtotal := v_subtotal + v_line;
    v_tax_raw  := v_tax_raw + v_line * v_rate / 100;

    insert into public.sale_items (
      sale_id, user_id, product_id, position, description, unit, qty, unit_price, tax_rate, line_amount
    )
    values (
      v_sale.id, v_uid, case when nullif(v_item ->> 'product_id', '') is null then null else v_product.id end,
      v_pos, v_desc, v_unit, v_qty, v_price, v_rate, v_line
    );
  end loop;

  if v_discount > v_subtotal then
    raise exception 'Discount cannot be more than the subtotal';
  end if;

  -- The discount reduces the taxable value of every line proportionally.
  v_tax := case when v_subtotal > 0
                then round(v_tax_raw * (v_subtotal - v_discount) / v_subtotal, 2)
                else 0 end;
  v_grand := v_subtotal - v_discount + v_tax;

  if p_doc_type = 'cash_memo' then
    v_paid := v_grand;
  else
    v_paid := round(coalesce(p_amount_paid, 0), 2);
    if v_paid < 0 then
      raise exception 'Amount paid cannot be negative';
    end if;
    if v_paid > v_grand then
      raise exception 'Amount paid cannot be more than the bill total';
    end if;
  end if;

  v_status := case when v_paid >= v_grand then 'paid'
                   when v_paid > 0 then 'partial'
                   else 'unpaid' end;

  update public.sales
  set subtotal = v_subtotal,
      discount = v_discount,
      tax_total = v_tax,
      grand_total = v_grand,
      amount_paid = v_paid,
      status = v_status
  where id = v_sale.id
  returning * into v_sale;

  if v_paid > 0 then
    insert into public.sale_payments (sale_id, user_id, amount, method, note)
    values (v_sale.id, v_uid, v_paid, v_method, 'Paid at sale');
  end if;

  return v_sale;
end;
$$;

create or replace function public.record_sale_payment(
  p_sale_id uuid,
  p_amount  numeric,
  p_method  text default 'cash',
  p_note    text default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_sale   public.sales;
  v_amount numeric := round(coalesce(p_amount, 0), 2);
  v_due    numeric;
begin
  if v_uid is null then
    raise exception 'You must be signed in';
  end if;

  select * into v_sale from public.sales where id = p_sale_id and user_id = v_uid for update;
  if not found then
    raise exception 'Sale not found';
  end if;

  v_due := v_sale.grand_total - v_sale.amount_paid;

  if v_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;
  if v_amount > v_due then
    raise exception 'Payment is more than the amount due (%)', v_due;
  end if;

  insert into public.sale_payments (sale_id, user_id, amount, method, note)
  values (v_sale.id, v_uid, v_amount, coalesce(nullif(trim(p_method), ''), 'cash'), nullif(trim(p_note), ''));

  update public.sales
  set amount_paid = amount_paid + v_amount,
      status = case when amount_paid + v_amount >= grand_total then 'paid' else 'partial' end
  where id = v_sale.id
  returning * into v_sale;

  return v_sale;
end;
$$;

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_change_qty numeric,
  p_reason     text default 'adjustment',
  p_note       text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_product public.products;
  v_change  numeric := round(coalesce(p_change_qty, 0), 3);
  v_reason  text := coalesce(nullif(trim(p_reason), ''), 'adjustment');
begin
  if v_uid is null then
    raise exception 'You must be signed in';
  end if;
  if v_reason not in ('adjustment', 'purchase', 'return') then
    raise exception 'Reason must be adjustment, purchase or return';
  end if;
  if v_change = 0 then
    raise exception 'Quantity change cannot be zero';
  end if;
  if v_reason in ('purchase', 'return') and v_change < 0 then
    raise exception 'Purchases and returns must add stock';
  end if;

  select * into v_product from public.products where id = p_product_id and user_id = v_uid for update;
  if not found then
    raise exception 'Product not found';
  end if;

  if v_product.stock_qty + v_change < 0 then
    raise exception 'Stock cannot go below zero (current %)', trim_scale(v_product.stock_qty);
  end if;

  update public.products
  set stock_qty = stock_qty + v_change
  where id = v_product.id
  returning * into v_product;

  insert into public.stock_movements (user_id, product_id, change_qty, balance_after, reason, note)
  values (v_uid, v_product.id, v_change, v_product.stock_qty, v_reason, nullif(trim(p_note), ''));

  return v_product;
end;
$$;

revoke all on function public.create_sale(text, jsonb, uuid, text, text, text, numeric, numeric, text, date, text) from public, anon;
revoke all on function public.record_sale_payment(uuid, numeric, text, text) from public, anon;
revoke all on function public.adjust_stock(uuid, numeric, text, text) from public, anon;
revoke all on function public.store_log_opening_stock() from public, anon, authenticated;
grant execute on function public.create_sale(text, jsonb, uuid, text, text, text, numeric, numeric, text, date, text) to authenticated;
grant execute on function public.record_sale_payment(uuid, numeric, text, text) to authenticated;
grant execute on function public.adjust_stock(uuid, numeric, text, text) to authenticated;

notify pgrst, 'reload schema';
