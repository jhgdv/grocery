-- Create a table for list shares
create table if not exists public.list_shares (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  invited_email text not null,
  invited_by uuid references auth.users(id) on delete set null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(list_id, invited_email)
);

-- Enable RLS
alter table public.list_shares enable row level security;

-- Policy: Users can view shares for lists they own
create policy "Users can view shares for their lists"
  on public.list_shares for select
  using (
    exists (
      select 1 from public.lists
      where lists.id = list_shares.list_id
      and lists.user_id = auth.uid()
    )
  );

-- Policy: Users can invite others to their lists
create policy "Users can create shares for their lists"
  on public.list_shares for insert
  with check (
    exists (
      select 1 from public.lists
      where lists.id = list_shares.list_id
      and lists.user_id = auth.uid()
    )
  );

-- Policy: Invited users can view their own invites
create policy "Invited users can view their invites"
  on public.list_shares for select
  using (
    invited_email = auth.jwt() ->> 'email'
  );

-- Policy: Invited users can update status (accept/decline)
create policy "Invited users can accept invites"
  on public.list_shares for update
  using (
    invited_email = auth.jwt() ->> 'email'
  )
  with check (
    invited_email = auth.jwt() ->> 'email'
  );

-- ACCESS POLICIES FOR LISTS AND ITEMS --

-- Update policies for 'lists' table to allow shared access
create policy "Collaborators can view shared lists"
  on public.lists for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.list_shares
      where list_shares.list_id = lists.id
      and list_shares.invited_email = auth.jwt() ->> 'email'
      and list_shares.status = 'accepted'
    )
  );

-- Update policies for 'items' table to allow shared access
create policy "Collaborators can view items of shared lists"
  on public.items for select
  using (
    exists (
      select 1 from public.lists
      where lists.id = items.list_id
      and (
        lists.user_id = auth.uid()
        or exists (
          select 1 from public.list_shares
          where list_shares.list_id = lists.id
          and list_shares.invited_email = auth.jwt() ->> 'email'
          and list_shares.status = 'accepted'
        )
      )
    )
  );

create policy "Collaborators can insert items into shared lists"
  on public.items for insert
  with check (
    exists (
      select 1 from public.lists
      where lists.id = items.list_id
      and (
        lists.user_id = auth.uid()
        or exists (
          select 1 from public.list_shares
          where list_shares.list_id = lists.id
          and list_shares.invited_email = auth.jwt() ->> 'email'
          and list_shares.status = 'accepted'
        )
      )
    )
  );

create policy "Collaborators can update items in shared lists"
  on public.items for update
  using (
    exists (
      select 1 from public.lists
      where lists.id = items.list_id
      and (
        lists.user_id = auth.uid()
        or exists (
          select 1 from public.list_shares
          where list_shares.list_id = lists.id
          and list_shares.invited_email = auth.jwt() ->> 'email'
          and list_shares.status = 'accepted'
        )
      )
    )
  );
