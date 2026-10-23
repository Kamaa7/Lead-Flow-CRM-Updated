-- Lock the leads table down to its owner. Idempotent.

alter table public.leads alter column user_id set default auth.uid();

drop policy if exists "Allow insert for all" on public.leads;
drop policy if exists "Allow insert for authenticated" on public.leads;
drop policy if exists "Users can manage their own leads" on public.leads;
drop policy if exists leads_select on public.leads;
drop policy if exists leads_insert on public.leads;
drop policy if exists leads_update on public.leads;
drop policy if exists leads_delete on public.leads;

create policy leads_select on public.leads for select to authenticated using (user_id = auth.uid());
create policy leads_insert on public.leads for insert to authenticated with check (user_id = auth.uid());
create policy leads_update on public.leads for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy leads_delete on public.leads for delete to authenticated using (user_id = auth.uid());

alter table public.leads enable row level security;

revoke all on public.leads from anon;

notify pgrst, 'reload schema';
