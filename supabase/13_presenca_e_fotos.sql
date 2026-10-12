-- =====================================================================
-- Saberes que Cultivam — 13: lista de presença das atividades e fotos de evidência
-- Rode depois do 12. Pode rodar de novo sem medo: não apaga dados.
--
-- 1) presencas: quem participou de cada capacitação, dia de campo ou reunião (nome, comunidade, município).
--    É dado pessoal: só a equipe do projeto lê e grava. O acompanhamento (SEAB/MDA) não lê esta tabela;
--    continua vendo só o número de participantes que já está na atividade.
-- 2) fotos: foto de uma atividade ou de uma visita, guardada no Storage (pasta privada "evidencias").
--    Foto pode mostrar rosto de agricultor: mesma regra, só a equipe do projeto vê. A data em que a foto foi
--    tirada vem de dentro do arquivo (lida pela tela) e fica registrada para conferência.
-- =====================================================================

create table if not exists public.presencas (
  id uuid primary key default gen_random_uuid(),
  evento uuid not null references public.eventos(id) on delete restrict,
  nome text not null check (length(btrim(nome)) > 0 and length(nome) <= 300),
  comunidade text check (comunidade is null or length(comunidade) <= 300),
  municipio text check (municipio is null or length(municipio) <= 300),
  mulher boolean not null default false,
  agricultor uuid references public.agricultores(id) on delete set null,
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create index if not exists presencas_evento on public.presencas (evento);

create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  tabela text not null check (tabela in ('eventos','visitas')),
  registro uuid not null,
  caminho text not null unique check (length(caminho) <= 300),
  tirada_em date,
  legenda text check (legenda is null or length(legenda) <= 300),
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  constraint fotos_caminho_do_registro check (caminho like tabela || '/' || registro::text || '/%')
);
create index if not exists fotos_registro on public.fotos (tabela, registro);

-- foto só de atividade ou visita que existe; e não muda de registro depois de enviada
create or replace function public.fotos_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.tabela <> old.tabela or new.registro <> old.registro or new.caminho <> old.caminho) then
    raise exception 'A foto não muda de atividade nem de visita depois de enviada. Exclua e envie de novo.' using errcode = 'P0001';
  end if;
  if (new.tabela = 'eventos' and not exists (select 1 from public.eventos where id = new.registro))
     or (new.tabela = 'visitas' and not exists (select 1 from public.visitas where id = new.registro)) then
    raise exception 'A atividade ou visita desta foto não existe mais.' using errcode = '23503';
  end if;
  return new;
end $$;
drop trigger if exists b_fotos_antes on public.fotos;
create trigger b_fotos_antes before insert or update on public.fotos for each row execute function public.fotos_antes();

-- atividade ou visita com foto não é excluída por engano (como acontece com lote que já teve entrega)
create or replace function public.com_foto_nao_exclui() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.fotos where tabela = tg_table_name and registro = old.id) then
    raise exception 'Este registro tem fotos. Exclua as fotos antes.' using errcode = '23503';
  end if;
  return old;
end $$;
drop trigger if exists b_com_foto on public.eventos;
create trigger b_com_foto before delete on public.eventos for each row execute function public.com_foto_nao_exclui();
drop trigger if exists b_com_foto on public.visitas;
create trigger b_com_foto before delete on public.visitas for each row execute function public.com_foto_nao_exclui();

do $$
declare t text;
begin
  foreach t in array array['presencas','fotos'] loop
    execute format('drop trigger if exists a_carimbar on public.%I', t);
    execute format('create trigger a_carimbar before insert or update on public.%I for each row execute function public.carimbar()', t);
    execute format('drop trigger if exists z_auditoria on public.%I', t);
    execute format('create trigger z_auditoria after insert or update or delete on public.%I for each row execute function public.auditar()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_ler', t);
    execute format('drop policy if exists %I on public.%I', t || '_incluir', t);
    execute format('drop policy if exists %I on public.%I', t || '_alterar', t);
    execute format('drop policy if exists %I on public.%I', t || '_excluir', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.sou_equipe())', t || '_ler', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.sou_equipe())', t || '_incluir', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.sou_equipe()) with check (public.sou_equipe())', t || '_alterar', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.meu_perfil() = ''Coordenação'' or (public.sou_equipe() and criado_por = public.meu_id()))', t || '_excluir', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
revoke execute on function public.fotos_antes(), public.com_foto_nao_exclui() from anon, authenticated, public;

-- ---------------------------------------------------------------------
-- Storage: pasta privada "evidencias" (até 5 MB por foto; só imagem)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists evidencias_ler on storage.objects;
drop policy if exists evidencias_enviar on storage.objects;
drop policy if exists evidencias_excluir on storage.objects;
create policy evidencias_ler on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and public.sou_equipe());
create policy evidencias_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and public.sou_equipe() and (storage.foldername(name))[1] in ('eventos','visitas'));
-- excluir o arquivo: a coordenação, ou quem enviou a foto (enquanto o registro da foto ainda existe)
create policy evidencias_excluir on storage.objects for delete to authenticated
  using (bucket_id = 'evidencias' and (public.meu_perfil() = 'Coordenação'
         or exists (select 1 from public.fotos f where f.caminho = name and f.criado_por = public.meu_id())));

notify pgrst, 'reload schema';
select 'Lista de presença e fotos de evidência ligadas. A aba Formação passa a ter a lista de cada atividade.' as resultado;
