-- =====================================================================
-- Saberes que Cultivam — 27: documento anexado às entregas do plano e ligação entre quem saiu e quem entrou na equipe
-- Rode depois do 26. Pode rodar de novo sem medo: não apaga dados.
--
-- 1) Entregas do plano (relatório, material didático, produto de comunicação) passam a aceitar o ARQUIVO, além do link:
--    * pasta PRIVADA "documentos" no Storage (PDF, Word, Excel, PowerPoint, LibreOffice, JPEG ou PNG; até 20 MB);
--    * caminho fixo <id da entrega>/<código>.<extensão>; só a equipe do projeto (coordenação e bolsistas) envia,
--      e quem lê a equipe (coordenação, bolsistas e auxiliar administrativo) baixa. SEAB/MDA e formador(a) não baixam:
--      o documento pode ter dado pessoal (nome de agricultor, por exemplo);
--    * o arquivo vai primeiro para a pasta e só depois a entrega aponta para ele, pela função definir_documento(),
--      que confere se o arquivo existe e é desta entrega. Assim a entrega nunca aponta para arquivo que não existe.
-- 2) membros.substitui: quem entrou no lugar de quem foi desligado (o histórico liga as duas pessoas).
-- =====================================================================

-- ---------- 1) documento das entregas ----------
alter table public.entregas add column if not exists arquivo text, add column if not exists arquivo_nome text;
alter table public.entregas drop constraint if exists entregas_arquivo_formato;
alter table public.entregas add constraint entregas_arquivo_formato check (arquivo is null or (
  arquivo ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|jpe?g|png)$'
  and split_part(arquivo, '/', 1) = id::text));
alter table public.entregas drop constraint if exists entregas_arquivo_nome;
alter table public.entregas add constraint entregas_arquivo_nome check (arquivo_nome is null or length(arquivo_nome) <= 200);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 20971520, array[
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet', 'application/vnd.oasis.opendocument.presentation',
  'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documentos_ler on storage.objects;
drop policy if exists documentos_enviar on storage.objects;
drop policy if exists documentos_excluir on storage.objects;
create policy documentos_ler on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar'));
create policy documentos_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (select public.sou_equipe())
              and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|jpe?g|png)$'
              and exists (select 1 from public.entregas e where e.id::text = (storage.foldername(name))[1]));
create policy documentos_excluir on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (select public.sou_equipe()));

-- liga (ou tira) o documento de uma entrega. Devolve o caminho antigo, para a tela apagar o arquivo que saiu.
create or replace function public.definir_documento(p_entrega uuid, p_caminho text, p_nome text)
returns text language plpgsql security definer set search_path = public as $$
declare antes text;
begin
  if not public.sou_equipe() then raise exception 'Só a equipe do projeto anexa documento às entregas.' using errcode = 'P0001'; end if;
  if p_caminho is not null then
    if split_part(p_caminho, '/', 1) <> p_entrega::text then raise exception 'Documento de outra entrega.' using errcode = 'P0001'; end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'documentos' and o.name = p_caminho) then
      raise exception 'O documento ainda não chegou ao servidor. Tente de novo.' using errcode = 'P0001'; end if;
  end if;
  select arquivo into antes from public.entregas where id = p_entrega for update;
  if not found then raise exception 'Esta entrega não existe mais.' using errcode = 'P0001'; end if;
  update public.entregas set arquivo = p_caminho, arquivo_nome = case when p_caminho is null then null else left(btrim(coalesce(p_nome, '')), 200) end
   where id = p_entrega;
  return antes;
end $$;
revoke execute on function public.definir_documento(uuid, text, text) from anon, public;
grant execute on function public.definir_documento(uuid, text, text) to authenticated;

-- ---------- 2) quem substitui quem na equipe ----------
alter table public.membros add column if not exists substitui uuid references public.membros(id) on delete set null;
grant select (substitui) on public.membros to authenticated;

notify pgrst, 'reload schema';
select 'Documento das entregas (pasta privada "documentos") e substituta na equipe ligados.' as resultado;
