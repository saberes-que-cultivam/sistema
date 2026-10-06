-- =====================================================================
-- Saberes que Cultivam — 04: correções da auditoria de 06/10/2026
-- Rode depois do 01. Pode rodar de novo sem medo: não apaga dados.
--   * conta de login antiga não se liga mais a um cadastro que mudou de e-mail
--   * regra da "última coordenação" não falha com duas alterações ao mesmo tempo
--   * valores fora do plano (etapa, rubrica, tipo) e textos gigantes são recusados
--   * lote que já teve distribuição não muda de unidade, tipo, medida nem data de início
--   * código do lote não quebra depois do 999; mensagem de saldo sem "40. kg"
--   * privilégios padrão do Supabase retirados antes de dar só o necessário
-- =====================================================================

-- contas de login que não podem mais se ligar a ninguém (quem teve o e-mail trocado no cadastro)
create table if not exists public.contas_bloqueadas (
  auth_id uuid primary key,
  em      timestamptz not null default now(),
  motivo  text
);
alter table public.contas_bloqueadas enable row level security;   -- sem política: ninguém lê nem grava pelo app
revoke all on public.contas_bloqueadas from anon, authenticated;

create or replace function public.vincular_conta() returns public.pessoas
language plpgsql security definer set search_path = public as $$
declare r public.pessoas;
begin
  if exists (select 1 from public.contas_bloqueadas where auth_id = auth.uid()) then return r; end if;
  perform set_config('sqc.vinculando', '1', true);
  update public.pessoas set auth_id = auth.uid()
   where lower(email) = lower(auth.jwt() ->> 'email') and ativo
     and (auth_id is null or auth_id = auth.uid())
  returning * into r;
  perform set_config('sqc.vinculando', '', true);
  return r;
end $$;

create or replace function public.pessoas_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(trim(new.email)); new.nome := trim(new.nome);
  if tg_op = 'UPDATE' then
    if coalesce(current_setting('sqc.vinculando', true), '') <> '1' then new.auth_id := old.auth_id; end if;
    if old.perfil = 'Coordenação' and old.ativo then
      -- uma alteração de coordenação por vez: duas ao mesmo tempo podiam deixar o projeto sem ninguém
      perform pg_advisory_xact_lock(hashtext('sqc-coordenacao'));
      if (not (new.perfil = 'Coordenação' and new.ativo) or new.email <> old.email)
         and not exists (select 1 from public.pessoas where id <> old.id and perfil = 'Coordenação' and ativo) then
        raise exception 'É preciso manter pelo menos um acesso de coordenação ativo. Cadastre outra coordenação antes de mudar este.' using errcode = 'P0001';
      end if;
    end if;
    -- trocou o e-mail: a conta antiga deixa de valer para sempre; a pessoa faz o primeiro acesso de novo com o e-mail novo
    if new.email <> old.email then
      if old.auth_id is not null then
        insert into public.contas_bloqueadas (auth_id, motivo) values (old.auth_id, 'e-mail trocado no cadastro') on conflict do nothing;
      end if;
      new.auth_id := null;
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Só valores que o plano conhece, e textos de tamanho razoável
-- ---------------------------------------------------------------------
do $$
declare t text; c text; lim integer;
  etapas text := '''1.1'',''2.1'',''3.1'',''3.2'',''3.3'',''4.1'',''5.1'',''5.2'',''6.1'',''6.2'',''6.3''';
  rubricas text := '''bolsa_pesquisador'',''bolsa_estudante'',''diarias'',''ajuda_custo'',''passagens'',''servicos_pj'',''consumo'',''equipamentos'',''doa''';
  tipos text := '''Composto orgânico'',''Biofertilizante líquido'',''Húmus de minhoca'',''Bokashi'',''Microrganismos eficientes (EM)'',''Microrganismo isolado'',''Outro''';
begin
  -- "not valid": não confere o que já está gravado (nada é apagado nem bloqueia a instalação); vale para tudo o que for gravado daqui em diante
  execute 'alter table public.despesas drop constraint if exists despesas_etapa_plano, drop constraint if exists despesas_rubrica_plano';
  execute format('alter table public.despesas add constraint despesas_etapa_plano check (etapa in (%s)) not valid, add constraint despesas_rubrica_plano check (rubrica in (%s)) not valid', etapas, rubricas);
  execute 'alter table public.entregas drop constraint if exists entregas_etapa_plano';
  execute format('alter table public.entregas add constraint entregas_etapa_plano check (etapa in (%s)) not valid', etapas);
  execute 'alter table public.itens drop constraint if exists itens_rubrica_plano';
  execute format('alter table public.itens add constraint itens_rubrica_plano check (rubrica is null or rubrica in (%s)) not valid', rubricas);
  execute 'alter table public.lotes drop constraint if exists lotes_tipo_plano, drop constraint if exists lotes_limites';
  execute format('alter table public.lotes add constraint lotes_tipo_plano check (tipo in (%s)) not valid, add constraint lotes_limites check (dias <= 730 and qtd <= 1000000) not valid', tipos);
  execute 'alter table public.eventos drop constraint if exists eventos_mulheres_com_total';
  execute 'alter table public.eventos add constraint eventos_mulheres_com_total check (mulheres is null or part is not null) not valid';
  -- textos: campo curto até 300 caracteres, campo de observação até 4.000
  for t, c in select table_name::text, column_name::text from information_schema.columns
               where table_schema = 'public' and data_type = 'text'
                 and table_name in ('pessoas','unidades','itens','lotes','agricultores','distribuicoes','visitas','eventos','entregas','despesas') loop
    lim := case when c in ('obs','insumos','problemas','link') then 4000 else 300 end;
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_' || c || '_tam');
    execute format('alter table public.%I add constraint %I check (%I is null or length(%I) <= %s) not valid', t, t || '_' || c || '_tam', c, c, lim);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Lote: rastreabilidade
-- ---------------------------------------------------------------------
create or replace function public.lote_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_pre text; v_n integer; v_dist numeric;
begin
  if tg_op = 'UPDATE' then
    new.codigo := old.codigo;
    select coalesce(sum(qtd), 0) into v_dist from public.distribuicoes where lote = new.id;
    if new.qtd < v_dist then
      raise exception 'A quantidade ficou menor do que o já distribuído (%).', replace(rtrim(to_char(v_dist, 'FM999999990.99'), '.'), '.', ',') using errcode = 'P0001';
    end if;
    if v_dist > 0 and new.status <> 'Pronto' then
      raise exception 'Este lote já teve distribuição: não pode deixar de estar pronto.' using errcode = 'P0001';
    end if;
    -- o código carrega a unidade e o tipo: depois de criado, lote não muda de unidade nem de tipo (crie outro lote)
    if new.unidade <> old.unidade or new.tipo <> old.tipo then
      raise exception 'Lote não muda de unidade nem de tipo depois de criado, porque o código % depende deles. Crie outro lote.', old.codigo using errcode = 'P0001';
    end if;
    if v_dist > 0 and (new.med <> old.med or new.inicio <> old.inicio) then
      raise exception 'Este lote já teve distribuição: a medida e a data de início não mudam mais.' using errcode = 'P0001';
    end if;
    return new;
  end if;
  select upper(u.sigla) || '-' || case new.tipo
           when 'Composto orgânico' then 'CMP' when 'Biofertilizante líquido' then 'BIO' when 'Húmus de minhoca' then 'HUM'
           when 'Bokashi' then 'BOK' when 'Microrganismos eficientes (EM)' then 'EM' when 'Microrganismo isolado' then 'ISO' else 'OUT' end || '-'
    into v_pre from public.unidades u where u.id = new.unidade;
  perform pg_advisory_xact_lock(hashtext('sqc-lote-' || v_pre));
  select coalesce(max(nullif(regexp_replace(substr(codigo, length(v_pre) + 1), '\D', '', 'g'), '')::integer), 0) + 1
    into v_n from public.lotes where codigo like v_pre || '%';
  new.codigo := v_pre || case when v_n < 1000 then lpad(v_n::text, 3, '0') else v_n::text end;   -- lpad cortava o 1000 para "100"
  return new;
end $$;

create or replace function public.distribuicao_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare l public.lotes; v_outras numeric;
begin
  select * into l from public.lotes where id = new.lote for update;
  if l.status <> 'Pronto' then
    raise exception 'O lote % ainda não está marcado como pronto.', l.codigo using errcode = 'P0001';
  end if;
  if new.data < l.inicio then
    raise exception 'A data da entrega é anterior ao início do preparo do lote.' using errcode = 'P0001';
  end if;
  if new.data > current_date + 1 then
    raise exception 'A data da entrega está no futuro. Confira o ano.' using errcode = 'P0001';
  end if;
  select coalesce(sum(qtd), 0) into v_outras from public.distribuicoes where lote = new.lote and id <> new.id;
  if new.qtd > l.qtd - v_outras then
    raise exception 'O lote % só tem % % de saldo.', l.codigo, replace(rtrim(to_char(l.qtd - v_outras, 'FM999999990.99'), '.'), '.', ','), l.med using errcode = 'P0001';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Privilégios: tira tudo o que o Supabase dá por padrão e devolve só o necessário
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['pessoas','unidades','itens','lotes','agricultores','distribuicoes','visitas','eventos','entregas','despesas'] loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update%s on public.%I to authenticated', case when t = 'pessoas' then '' else ', delete' end, t);
  end loop;
end $$;
revoke all on public.auditoria from anon, authenticated;
grant select on public.auditoria to authenticated;

select 'Correções aplicadas. Agora rode o 05_acompanhamento.sql.' as resultado;
