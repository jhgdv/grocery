-- Fix: infinite recursion in workspace_members RLS policy
--
-- Het probleem:
--   workspace_select policy  → leest workspace_members
--   workspace_member_select  → leest workspaces (terug!)
--   → oneindige lus → elke database-actie mislukt
--
-- De oplossing: workspace_member_select mag NIET meer de workspaces tabel lezen.
-- In plaats daarvan gebruiken we invited_by en user_id die al op de rij zelf staan.

drop policy if exists "workspace_member_select" on public.workspace_members;

create policy "workspace_member_select"
  on public.workspace_members
  for select
  using (
    -- De uitgenodigde persoon kan zijn eigen uitnodigingen zien (via email)
    lower(invited_email) = lower(auth.jwt() ->> 'email')
    -- De uitgenodigde persoon kan zijn rij zien nadat hij heeft geaccepteerd (via user_id)
    or user_id = auth.uid()
    -- De persoon die heeft uitgenodigd kan zijn eigen uitnodigingen zien
    or invited_by = auth.uid()
  );

-- Controleer ook of de lists insert policy correct is (geen extra recursie)
drop policy if exists "lists_workspace_insert" on public.lists;

create policy "lists_workspace_insert"
  on public.lists
  for insert
  with check (
    user_id = auth.uid()
    and (
      workspace_id is null
      or exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = lists.workspace_id
          and wm.status = 'accepted'
          and (
            wm.user_id = auth.uid()
            or lower(wm.invited_email) = lower(auth.jwt() ->> 'email')
          )
      )
    )
  );
