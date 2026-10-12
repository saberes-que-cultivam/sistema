-- Imitação mínima do Supabase para testar o banco num Postgres local (NÃO rodar no Supabase)
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as
  $$ select jsonb_build_object('email', current_setting('request.jwt.claim.email', true)) $$;
grant usage on schema public, auth to authenticated, anon;
-- Storage do Supabase (o mínimo que os scripts usam): pastas, arquivos com RLS e a função que separa as pastas do caminho
create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid, created_at timestamptz default now(), metadata jsonb);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to authenticated, anon;
grant select, insert, update, delete on storage.objects to authenticated, anon;
grant select on storage.buckets to authenticated, anon;
grant execute on function storage.foldername(text) to authenticated, anon;
-- como o Supabase: tudo o que for criado em public nasce liberado para anon e authenticated; os scripts têm de fechar
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
grant execute on all functions in schema auth to authenticated, anon;
