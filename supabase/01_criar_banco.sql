-- =====================================================================
-- Saberes que Cultivam — 01: banco, regras de acesso (RLS), auditoria e login
-- Onde rodar: painel do Supabase > SQL Editor > New query > cole tudo > Run.
-- Pode rodar de novo sem medo: não apaga dados.
--
-- Como funciona o acesso:
--   * Só entra quem a coordenação cadastrou na tabela "pessoas" (pelo e-mail).
--     Conta criada com e-mail que não está lá é recusada pelo banco.
--   * Dois perfis: Coordenação (tudo) e Equipe (registra o trabalho de campo e
--     de produção; não grava despesas nem acessos; só exclui o que ela mesma lançou).
--   * Tudo o que é incluído, alterado ou excluído fica na tabela "auditoria",
--     com quem fez, quando, e como era antes e depois. Só a coordenação lê.
--
-- IMPORTANTE (painel do Supabase > Authentication):
--   * Sign In / Providers > Email: deixe "Confirm email" LIGADO. É a confirmação
--     por e-mail que impede alguém de criar senha no lugar de outra pessoa.
--   * URL Configuration > Site URL: o endereço onde o sistema está publicado.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Pessoas com acesso
-- ---------------------------------------------------------------------
create table if not exists public.pessoas (
  id            uuid primary key default gen_random_uuid(),
  auth_id       uuid unique references auth.users(id) on delete set null,
  nome          text not null check (length(trim(nome)) > 1),
  email         text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  perfil        text not null default 'Equipe' check (perfil in ('Coordenação','Equipe')),
  ativo         boolean not null default true,
  criado_por    uuid,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index if not exists pessoas_email_unico on public.pessoas (lower(email));

create or replace function public.meu_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.pessoas where auth_id = auth.uid() and ativo limit 1
$$;
create or replace function public.meu_perfil() returns text
language sql stable security definer set search_path = public as $$
  select perfil from public.pessoas where auth_id = auth.uid() and ativo limit 1
$$;

-- liga a conta de login ao cadastro (o sistema chama logo depois de entrar)
create or replace function public.vincular_conta() returns public.pessoas
language plpgsql security definer set search_path = public as $$
declare r public.pessoas;
begin
  perform set_config('sqc.vinculando', '1', true);
  update public.pessoas set auth_id = auth.uid()
   where lower(email) = lower(auth.jwt() ->> 'email') and ativo
     and (auth_id is null or auth_id = auth.uid())
  returning * into r;
  perform set_config('sqc.vinculando', '', true);
  return r;
end $$;

-- ---------------------------------------------------------------------
-- Carimbo de quem criou e quando (vale para todas as tabelas)
-- ---------------------------------------------------------------------
create or replace function public.carimbar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.criado_por := public.meu_id(); new.criado_em := now();
  else
    new.criado_por := old.criado_por; new.criado_em := old.criado_em;
  end if;
  new.atualizado_em := now();
  return new;
end $$;

create or replace function public.pessoas_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(trim(new.email)); new.nome := trim(new.nome);
  if tg_op = 'UPDATE' then
    -- a ligação com a conta de login só muda pela função vincular_conta
    if coalesce(current_setting('sqc.vinculando', true), '') <> '1' then new.auth_id := old.auth_id; end if;
    -- trocou o e-mail: a conta antiga deixa de valer; a pessoa cria senha de novo com o e-mail novo
    if new.email <> old.email then new.auth_id := null; end if;
    if old.perfil = 'Coordenação' and old.ativo and not (new.perfil = 'Coordenação' and new.ativo)
       and not exists (select 1 from public.pessoas where id <> old.id and perfil = 'Coordenação' and ativo) then
      raise exception 'É preciso manter pelo menos um acesso de coordenação ativo.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists pessoas_antes on public.pessoas;
create trigger pessoas_antes before insert or update on public.pessoas for each row execute function public.pessoas_antes();

-- só cria conta de login quem está cadastrado e ativo
create or replace function public.bloquear_conta_nao_cadastrada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.pessoas where lower(email) = lower(new.email::text) and ativo) then
    raise exception 'E-mail não cadastrado no projeto.';
  end if;
  return new;
end $$;
drop trigger if exists auth_so_cadastrados on auth.users;
create trigger auth_so_cadastrados before insert on auth.users
  for each row execute function public.bloquear_conta_nao_cadastrada();

-- ---------------------------------------------------------------------
-- Tabelas do projeto
-- ---------------------------------------------------------------------
-- Unidades de produção de bioinsumos (biofábricas). Meta 2: conta = 'Sim' e funcionando.
create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null, sigla text not null check (sigla ~ '^[A-Za-z]{2,4}$'),
  municipio text, uf text, territorio text, modelo text,
  conta text not null default 'Sim' check (conta in ('Sim','Não')),
  parceiro text, responsavel text,
  local_ok boolean not null default false, parceiro_ok boolean not null default false, termo boolean not null default false,
  itens_ok boolean not null default false, orcamento boolean not null default false, entregue boolean not null default false,
  montada boolean not null default false, funcionando boolean not null default false,
  obs text,
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create unique index if not exists unidades_sigla_unica on public.unidades (upper(sigla));

-- Itens e aquisições de cada unidade
create table if not exists public.itens (
  id uuid primary key default gen_random_uuid(),
  unidade uuid not null references public.unidades(id) on delete restrict,
  descricao text not null, valor numeric(12,2) check (valor is null or valor >= 0),
  rubrica text,
  status text not null default 'A definir' check (status in ('A definir','Orçamento enviado','Em compras na FUNCERN','Entregue')),
  data date,
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);

-- Lotes de produção (um por batelada)
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  unidade uuid not null references public.unidades(id) on delete restrict,
  tipo text not null, inicio date not null, dias integer not null default 30 check (dias >= 0),
  qtd numeric(12,2) not null check (qtd > 0), med text not null default 'kg' check (med in ('kg','L')),
  status text not null default 'Em preparo' check (status in ('Em preparo','Maturando','Pronto','Descartado')),
  responsavel text, insumos text, obs text,
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create unique index if not exists lotes_codigo_unico on public.lotes (codigo);

-- Agricultores(as) e unidades produtivas (Metas 3.3 e 4.1). DADO PESSOAL: nunca vai para arquivo público.
create table if not exists public.agricultores (
  id uuid primary key default gen_random_uuid(),
  nome text not null, comunidade text, municipio text, uf text, territorio text,
  unidade uuid references public.unidades(id) on delete restrict,
  culturas text, area numeric(10,2) check (area is null or area >= 0),
  diag date, quimico text check (quimico is null or quimico in ('Sim','Parcial','Não')),
  gasto0 numeric(12,2) check (gasto0 is null or gasto0 >= 0),
  kit boolean not null default false, kitdata date,
  check (not kit or kitdata is not null),
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);

-- Distribuição: liga um lote a uma unidade produtiva
create table if not exists public.distribuicoes (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  lote uuid not null references public.lotes(id) on delete restrict,
  agricultor uuid not null references public.agricultores(id) on delete restrict,
  qtd numeric(12,2) not null check (qtd > 0),
  cultura text, area numeric(10,2) check (area is null or area >= 0), forma text,
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create index if not exists distribuicoes_lote on public.distribuicoes (lote);
create index if not exists distribuicoes_agricultor on public.distribuicoes (agricultor);

-- Visitas de monitoramento
create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  agricultor uuid not null references public.agricultores(id) on delete restrict,
  tecnico text, usou text not null check (usou in ('Sim','Parcial','Não')),
  vigor smallint check (vigor is null or vigor between 1 and 5),
  gasto numeric(12,2) check (gasto is null or gasto >= 0),
  obs text, problemas text,
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create index if not exists visitas_agricultor on public.visitas (agricultor);

-- Capacitações, dias de campo, reuniões e articulações
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('Capacitação','Dia de campo','Reunião','Articulação')),
  data date not null, tema text not null, lugar text, municipio text,
  part integer check (part is null or part >= 0), mulheres integer check (mulheres is null or mulheres >= 0),
  link text, obs text,
  check (mulheres is null or part is null or mulheres <= part),
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);

-- Entregas e evidências do plano de trabalho
create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  etapa text not null, titulo text not null, data date not null, link text, obs text,
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);

-- Despesas: cada uma tem etapa (plano do TED) e rubrica (plano universal/FUNCERN)
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  data date not null, etapa text not null, rubrica text not null,
  descricao text not null, favorecido text, doc text,
  valor numeric(12,2) not null check (valor > 0),
  status text not null default 'Solicitado' check (status in ('Solicitado','Em compras na FUNCERN','Pago')),
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Regras que o banco garante (a tela avisa antes; aqui ninguém passa)
-- ---------------------------------------------------------------------
-- Lote: código gerado pela sigla da unidade + tipo; quantidade nunca menor que o já distribuído
create or replace function public.lote_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_pre text; v_n integer; v_dist numeric;
begin
  if tg_op = 'UPDATE' then
    new.codigo := old.codigo;                       -- o código não muda depois de criado
    select coalesce(sum(qtd), 0) into v_dist from public.distribuicoes where lote = new.id;
    if new.qtd < v_dist then
      raise exception 'A quantidade ficou menor do que o já distribuído (%).', v_dist using errcode = 'P0001';
    end if;
    if v_dist > 0 and new.status <> 'Pronto' then
      raise exception 'Este lote já teve distribuição: não pode deixar de estar pronto.' using errcode = 'P0001';
    end if;
    return new;
  end if;
  select upper(u.sigla) || '-' || case new.tipo
           when 'Composto orgânico' then 'CMP' when 'Biofertilizante líquido' then 'BIO' when 'Húmus de minhoca' then 'HUM'
           when 'Bokashi' then 'BOK' when 'Microrganismos eficientes (EM)' then 'EM' when 'Microrganismo isolado' then 'ISO' else 'OUT' end || '-'
    into v_pre from public.unidades u where u.id = new.unidade;
  perform pg_advisory_xact_lock(hashtext('sqc-lote-' || v_pre));   -- dois lotes ao mesmo tempo não pegam o mesmo número
  select coalesce(max(nullif(regexp_replace(substr(codigo, length(v_pre) + 1), '\D', '', 'g'), '')::integer), 0) + 1
    into v_n from public.lotes where codigo like v_pre || '%';
  new.codigo := v_pre || lpad(v_n::text, 3, '0');
  return new;
end $$;
drop trigger if exists lote_antes on public.lotes;
create trigger lote_antes before insert or update on public.lotes for each row execute function public.lote_antes();

-- Distribuição: só de lote pronto, e nunca mais do que o saldo
create or replace function public.distribuicao_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare l public.lotes; v_outras numeric;
begin
  select * into l from public.lotes where id = new.lote for update;   -- trava o lote: duas entregas ao mesmo tempo não estouram o saldo
  if l.status <> 'Pronto' then
    raise exception 'O lote % ainda não está marcado como pronto.', l.codigo using errcode = 'P0001';
  end if;
  if new.data < l.inicio then
    raise exception 'A data da entrega é anterior ao início do preparo do lote.' using errcode = 'P0001';
  end if;
  select coalesce(sum(qtd), 0) into v_outras from public.distribuicoes where lote = new.lote and id <> new.id;
  if new.qtd > l.qtd - v_outras then
    raise exception 'O lote % só tem % % de saldo.', l.codigo, trim(to_char(l.qtd - v_outras, 'FM999G999G990D99')), l.med using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists distribuicao_antes on public.distribuicoes;
create trigger distribuicao_antes before insert or update on public.distribuicoes for each row execute function public.distribuicao_antes();

-- ---------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------
create table if not exists public.auditoria (
  id          bigint generated always as identity primary key,
  tabela      text not null,
  registro_id uuid,
  acao        text not null,
  por         uuid,
  em          timestamptz not null default now(),
  antes       jsonb,
  depois      jsonb
);
create index if not exists auditoria_em on public.auditoria (em desc);

create or replace function public.auditar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- gravar de novo sem mudar nada (reenvio da fila do celular) não gera linha
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'atualizado_em') = (to_jsonb(old) - 'atualizado_em') then return new; end if;
  insert into public.auditoria (tabela, registro_id, acao, por, antes, depois)
  values (tg_table_name, coalesce(new.id, old.id), tg_op, public.meu_id(),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

-- ---------------------------------------------------------------------
-- Carimbo, auditoria e regras de acesso, tabela por tabela
-- ---------------------------------------------------------------------
do $$
declare t text; restrita boolean;
begin
  foreach t in array array['pessoas','unidades','itens','lotes','agricultores','distribuicoes','visitas','eventos','entregas','despesas'] loop
    restrita := t in ('pessoas','despesas');
    execute format('drop trigger if exists a_carimbar on public.%I', t);
    execute format('create trigger a_carimbar before insert or update on public.%I for each row execute function public.carimbar()', t);
    execute format('drop trigger if exists z_auditoria on public.%I', t);
    execute format('create trigger z_auditoria after insert or update or delete on public.%I for each row execute function public.auditar()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_ler', t);
    execute format('drop policy if exists %I on public.%I', t || '_incluir', t);
    execute format('drop policy if exists %I on public.%I', t || '_alterar', t);
    execute format('drop policy if exists %I on public.%I', t || '_excluir', t);
    -- ler: qualquer pessoa cadastrada e ativa
    execute format('create policy %I on public.%I for select to authenticated using (public.meu_id() is not null)', t || '_ler', t);
    if restrita then
      execute format('create policy %I on public.%I for insert to authenticated with check (public.meu_perfil() = ''Coordenação'')', t || '_incluir', t);
      execute format('create policy %I on public.%I for update to authenticated using (public.meu_perfil() = ''Coordenação'') with check (public.meu_perfil() = ''Coordenação'')', t || '_alterar', t);
    else
      execute format('create policy %I on public.%I for insert to authenticated with check (public.meu_id() is not null)', t || '_incluir', t);
      execute format('create policy %I on public.%I for update to authenticated using (public.meu_id() is not null) with check (public.meu_id() is not null)', t || '_alterar', t);
    end if;
    -- excluir: pessoas nunca se excluem (desative o acesso); despesas só a coordenação;
    -- no resto, a coordenação exclui tudo e a equipe só o que ela mesma lançou
    if t = 'despesas' then
      execute format('create policy %I on public.%I for delete to authenticated using (public.meu_perfil() = ''Coordenação'')', t || '_excluir', t);
    elsif t <> 'pessoas' then
      execute format('create policy %I on public.%I for delete to authenticated using (public.meu_perfil() = ''Coordenação'' or criado_por = public.meu_id())', t || '_excluir', t);
    end if;
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
  revoke delete on public.pessoas from authenticated;
end $$;

alter table public.auditoria enable row level security;
drop policy if exists auditoria_ler on public.auditoria;
create policy auditoria_ler on public.auditoria for select to authenticated using (public.meu_perfil() = 'Coordenação');
revoke all on public.auditoria from anon, authenticated;
grant select on public.auditoria to authenticated;

revoke execute on function public.vincular_conta(), public.meu_id(), public.meu_perfil() from anon, public;
grant execute on function public.vincular_conta(), public.meu_id(), public.meu_perfil() to authenticated;

select 'Banco criado. Agora rode o 02_primeira_coordenacao.sql (com o SEU e-mail).' as resultado;
