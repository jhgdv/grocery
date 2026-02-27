-- Workspace model for shared collaborative lists
-- Run this after your existing list/list_shares schema.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(created_by, name)
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  invited_email text not null,
  user_id uuid references auth.users(id) on delete set null,
  invited_by uuid references auth.users(id) on delete set null,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique(workspace_id, invited_email)
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

alter table public.lists add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
create index if not exists idx_lists_workspace_id on public.lists(workspace_id);
create index if not exists idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index if not exists idx_workspace_members_email on public.workspace_members(invited_email);

insert into public.workspaces (name, created_by)
select distinct 'Personal', l.user_id
from public.lists l
where l.user_id is not null
on conflict (created_by, name) do nothing;

insert into public.workspace_members (workspace_id, invited_email, user_id, invited_by, role, status)
select w.id, lower(u.email), w.created_by, w.created_by, 'owner', 'accepted'
from public.workspaces w
join auth.users u on u.id = w.created_by
where lower(w.name) = 'personal'
on conflict (workspace_id, invited_email) do update
set user_id = excluded.user_id,
    invited_by = excluded.invited_by,
    role = 'owner',
    status = 'accepted';

update public.lists l
set workspace_id = w.id
from public.workspaces w
where l.workspace_id is null
  and l.user_id = w.created_by
  and lower(w.name) = 'personal';

-- Workspace policies

drop policy if exists "workspace_select" on public.workspaces;
create policy "workspace_select"
  on public.workspaces
  for select
  using (
    created_by = auth.uid()
    or exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.status = 'accepted'
        and (
          wm.user_id = auth.uid()
          or lower(wm.invited_email) = lower(auth.jwt() ->> 'email')
        )
    )
  );

drop policy if exists "workspace_insert" on public.workspaces;
create policy "workspace_insert"
  on public.workspaces
  for insert
  with check (created_by = auth.uid());

drop policy if exists "workspace_update" on public.workspaces;
create policy "workspace_update"
  on public.workspaces
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "workspace_delete" on public.workspaces;
create policy "workspace_delete"
  on public.workspaces
  for delete
  using (created_by = auth.uid());

-- Workspace member policies

drop policy if exists "workspace_member_select" on public.workspace_members;
create policy "workspace_member_select"
  on public.workspace_members
  for select
  using (
    lower(invited_email) = lower(auth.jwt() ->> 'email')
    or exists (
      select 1
      from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.created_by = auth.uid()
    )
  );

drop policy if exists "workspace_member_insert" on public.workspace_members;
create policy "workspace_member_insert"
  on public.workspace_members
  for insert
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.created_by = auth.uid()
    )
  );

drop policy if exists "workspace_member_update" on public.workspace_members;
create policy "workspace_member_update"
  on public.workspace_members
  for update
  using (
    lower(invited_email) = lower(auth.jwt() ->> 'email')
    or exists (
      select 1
      from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.created_by = auth.uid()
    )
  )
  with check (
    lower(invited_email) = lower(auth.jwt() ->> 'email')
    or exists (
      select 1
      from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.created_by = auth.uid()
    )
  );

drop policy if exists "workspace_member_delete" on public.workspace_members;
create policy "workspace_member_delete"
  on public.workspace_members
  for delete
  using (
    lower(invited_email) = lower(auth.jwt() ->> 'email')
    or exists (
      select 1
      from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.created_by = auth.uid()
    )
  );

-- Lists policies aligned with workspace membership

drop policy if exists "lists_workspace_select" on public.lists;
create policy "lists_workspace_select"
  on public.lists
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.list_shares ls
      where ls.list_id = lists.id
        and ls.status = 'accepted'
        and lower(ls.invited_email) = lower(auth.jwt() ->> 'email')
    )
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
  );

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

drop policy if exists "lists_workspace_update" on public.lists;
create policy "lists_workspace_update"
  on public.lists
  for update
  using (
    user_id = auth.uid()
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
  with check (
    user_id = auth.uid()
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
  );

drop policy if exists "lists_workspace_delete" on public.lists;
create policy "lists_workspace_delete"
  on public.lists
  for delete
  using (user_id = auth.uid());

-- Items policies aligned with workspace membership

drop policy if exists "items_workspace_select" on public.items;
create policy "items_workspace_select"
  on public.items
  for select
  using (
    exists (
      select 1
      from public.lists l
      where l.id = items.list_id
        and (
          l.user_id = auth.uid()
          or exists (
            select 1
            from public.list_shares ls
            where ls.list_id = l.id
              and ls.status = 'accepted'
              and lower(ls.invited_email) = lower(auth.jwt() ->> 'email')
          )
          or exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = l.workspace_id
              and wm.status = 'accepted'
              and (
                wm.user_id = auth.uid()
                or lower(wm.invited_email) = lower(auth.jwt() ->> 'email')
              )
          )
        )
    )
  );

drop policy if exists "items_workspace_insert" on public.items;
create policy "items_workspace_insert"
  on public.items
  for insert
  with check (
    exists (
      select 1
      from public.lists l
      where l.id = items.list_id
        and (
          l.user_id = auth.uid()
          or exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = l.workspace_id
              and wm.status = 'accepted'
              and (
                wm.user_id = auth.uid()
                or lower(wm.invited_email) = lower(auth.jwt() ->> 'email')
              )
          )
        )
    )
  );

drop policy if exists "items_workspace_update" on public.items;
create policy "items_workspace_update"
  on public.items
  for update
  using (
    exists (
      select 1
      from public.lists l
      where l.id = items.list_id
        and (
          l.user_id = auth.uid()
          or exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = l.workspace_id
              and wm.status = 'accepted'
              and (
                wm.user_id = auth.uid()
                or lower(wm.invited_email) = lower(auth.jwt() ->> 'email')
              )
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.lists l
      where l.id = items.list_id
        and (
          l.user_id = auth.uid()
          or exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = l.workspace_id
              and wm.status = 'accepted'
              and (
                wm.user_id = auth.uid()
                or lower(wm.invited_email) = lower(auth.jwt() ->> 'email')
              )
          )
        )
    )
  );

drop policy if exists "items_workspace_delete" on public.items;
create policy "items_workspace_delete"
  on public.items
  for delete
  using (
    exists (
      select 1
      from public.lists l
      where l.id = items.list_id
        and (
          l.user_id = auth.uid()
          or exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = l.workspace_id
              and wm.status = 'accepted'
              and (
                wm.user_id = auth.uid()
                or lower(wm.invited_email) = lower(auth.jwt() ->> 'email')
              )
          )
        )
    )
  );
