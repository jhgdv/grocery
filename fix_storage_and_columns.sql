-- Ensure item-images bucket exists and is public
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = true;

-- Allow public access to item-images bucket (Read)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'item-images' );

-- Allow authenticated users to upload to item-images bucket
create policy "Authenticated Users can upload"
on storage.objects for insert
with check (
  bucket_id = 'item-images'
  and auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
create policy "Users can update their own uploads"
on storage.objects for update
using (
  bucket_id = 'item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure items table has image_url and notes
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='items' and column_name='image_url') then
        alter table public.items add column image_url text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='items' and column_name='notes') then
        alter table public.items add column notes text;
    end if;
end $$;
