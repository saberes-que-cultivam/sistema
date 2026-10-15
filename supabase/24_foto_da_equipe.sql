-- =====================================================================
-- Saberes que Cultivam — 24: foto de perfil das pessoas da equipe
-- Rode depois do 23. Pode rodar de novo sem medo: não apaga dados.
--
-- A foto é dado pessoal (LGPD):
--   * fica numa pasta PRIVADA do Storage, "equipe" (separada das evidências), só com JPEG de até 300 KB
--     (o sistema reduz a foto para 320 × 320 px antes de enviar);
--   * vê quem já vê o cadastro da equipe: coordenação, equipe (bolsistas) e auxiliar administrativo.
--     O SEAB/MDA e formador(a) não veem (não leem a equipe);
--   * troca a própria pessoa (em "Meus dados") ou a coordenação (na ficha de qualquer pessoa);
--   * o caminho do arquivo tem formato fixo: <id da pessoa na equipe>/<código>.jpg, e só se grava na tabela
--     o caminho de um arquivo que já está na pasta daquela pessoa.
-- =====================================================================

alter table public.membros add column if not exists foto text;
alter table public.membros drop constraint if exists membros_foto_formato;
alter table public.membros add constraint membros_foto_formato
  check (foto is null or foto ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$');
grant select (foto) on public.membros to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipe', 'equipe', false, 307200, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- o cadastro ativo na equipe de quem está entrando (pelo e-mail do acesso); nulo se não houver ou houver mais de um
create or replace function public.meu_membro() returns uuid
language sql stable security definer set search_path = public as $$
  select case when count(*) = 1 then min(m.id::text)::uuid end
    from public.membros m join public.pessoas p on lower(btrim(p.email)) = lower(btrim(m.email))
   where p.auth_id = auth.uid() and p.ativo and (m.fim is null or m.fim >= current_date)
$$;
revoke execute on function public.meu_membro() from anon, public;
grant execute on function public.meu_membro() to authenticated;

drop policy if exists equipe_foto_ler on storage.objects;
drop policy if exists equipe_foto_enviar on storage.objects;
drop policy if exists equipe_foto_excluir on storage.objects;
create policy equipe_foto_ler on storage.objects for select to authenticated
  using (bucket_id = 'equipe' and ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar'));
create policy equipe_foto_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'equipe'
              and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
              and ((select public.meu_perfil()) = 'Coordenação' or (storage.foldername(name))[1] = (select public.meu_membro())::text));
create policy equipe_foto_excluir on storage.objects for delete to authenticated
  using (bucket_id = 'equipe' and ((select public.meu_perfil()) = 'Coordenação' or (storage.foldername(name))[1] = (select public.meu_membro())::text));

-- grava (ou tira) a foto de uma pessoa: a coordenação de qualquer uma; cada pessoa, a sua. Devolve o caminho antigo, para apagar o arquivo.
create or replace function public.definir_foto(p_membro uuid, p_caminho text)
returns text language plpgsql security definer set search_path = public as $$
declare antes text;
begin
  if not (public.meu_perfil() = 'Coordenação' or p_membro = public.meu_membro()) then
    raise exception 'Só a própria pessoa ou a coordenação trocam esta foto.' using errcode = 'P0001'; end if;
  if p_caminho is not null then
    if split_part(p_caminho, '/', 1) <> p_membro::text then raise exception 'Foto de outra pessoa.' using errcode = 'P0001'; end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'equipe' and o.name = p_caminho) then
      raise exception 'A foto ainda não chegou ao servidor. Tente de novo.' using errcode = 'P0001'; end if;
  end if;
  select foto into antes from public.membros where id = p_membro for update;
  if not found then raise exception 'Esta pessoa não está mais no cadastro.' using errcode = 'P0001'; end if;
  perform set_config('sqc.meus_contatos', '1', true);   -- o 23 deixa o auxiliar mexer só na habilitação; a foto dele mesmo passa por aqui
  update public.membros set foto = p_caminho where id = p_membro;
  return antes;
end $$;
revoke execute on function public.definir_foto(uuid, text) from anon, public;
grant execute on function public.definir_foto(uuid, text) to authenticated;

notify pgrst, 'reload schema';
select 'Foto de perfil da equipe ligada (pasta privada "equipe").' as resultado;
