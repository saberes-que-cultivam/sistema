-- =====================================================================
-- Saberes que Cultivam — 15: correções da 2ª auditoria (13/10/2026): corridas, volume, fotos, fila e acompanhamento
-- Rode depois do 14. Pode rodar de novo sem medo: não apaga dados.
--   1) foto x exclusão da atividade/visita ao mesmo tempo: a foto trava o registro-pai antes de conferir (antes ficava órfã).
--   2) vincular_conta: volta a conferir e-mail/ativo na hora de ligar (corrida trazida pelo 12 com troca de e-mail simultânea).
--   3) criar_convite: um por vez, para o limite de 20 links abertos valer com clique duplo.
--   4) leitura: as regras chamam a função de perfil UMA vez por consulta (antes, uma vez por linha: lento com volume).
--   5) índices para a leitura em páginas e para presencas.agricultor e o código do lote.
--   6) fotos: a linha em "fotos" é gravada ANTES do arquivo, e só se envia arquivo com o caminho exato de uma linha sua.
--      Assim não sobra arquivo solto, não se "empresta" foto de outro registro e o nome do arquivo tem formato fixo.
--   7) "falta enviar": no máximo 10 aparelhos por pessoa, data "desde" de até 1 ano atrás e soma sem estourar.
--   8) acompanhamento (SEAB/MDA): deixa de receber o link e as observações das atividades (o link costuma apontar para
--      a pasta da lista de presença e das fotos; a observação é texto livre e pode citar nomes). Recebe as atividades
--      pela função eventos_acompanhamento(), sem esses dois campos.
-- ATENÇÃO: rodar de novo o 05 ou o 13 depois deste recria regras antigas (corretas, mas lentas, e o SEAB/MDA volta a ler
--          o link das atividades). Se acontecer, rode o 15 de novo. O 00_verificar.sql aponta.
-- =====================================================================

-- 1) foto x exclusão do registro-pai
create or replace function public.fotos_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.tabela <> old.tabela or new.registro <> old.registro or new.caminho <> old.caminho) then
    raise exception 'A foto não muda de atividade nem de visita depois de enviada. Exclua e envie de novo.' using errcode = 'P0001';
  end if;
  -- trava o registro-pai como faria uma chave estrangeira: uma exclusão ao mesmo tempo espera esta gravação terminar
  if new.tabela = 'eventos' then perform 1 from public.eventos where id = new.registro for key share;
  else perform 1 from public.visitas where id = new.registro for key share; end if;
  if not found then
    raise exception 'A atividade ou visita desta foto não existe mais.' using errcode = '23503';
  end if;
  return new;
end $$;
revoke execute on function public.fotos_antes() from anon, authenticated, public;

-- 2) vincular_conta
create or replace function public.vincular_conta() returns public.pessoas
language plpgsql security definer set search_path = public as $$
declare r public.pessoas; alvo uuid;
begin
  select id into alvo from public.pessoas
   where lower(email) = lower(auth.jwt() ->> 'email') and ativo
     and (auth_id is null or auth_id = auth.uid())
   limit 1
   for update;                                   -- espera uma troca de e-mail em andamento e confere de novo
  if alvo is null then return r; end if;
  if exists (select 1 from public.contas_bloqueadas b
              where b.auth_id = auth.uid() and (b.pessoa is null or b.pessoa is distinct from alvo)) then
    return r;
  end if;
  perform set_config('sqc.vinculando', '1', true);
  update public.pessoas set auth_id = auth.uid()
   where id = alvo and lower(email) = lower(auth.jwt() ->> 'email') and ativo
     and (auth_id is null or auth_id = auth.uid())
  returning * into r;
  perform set_config('sqc.vinculando', '', true);
  return r;
end $$;
revoke execute on function public.vincular_conta() from anon, public;
grant execute on function public.vincular_conta() to authenticated;

-- 3) criar_convite: um por vez
create or replace function public.criar_convite(p_funcao text) returns text
language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if public.meu_perfil() is distinct from 'Coordenação' then raise exception 'Só a coordenação gera link de cadastro.' using errcode = 'P0001'; end if;
  if p_funcao not in ('coordenacao','auxiliar','discente') then raise exception 'Função desconhecida.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('sqc-convite'));
  if (select count(*) from public.convites where status = 'aberto' and expira_em > now()) >= 20 then
    raise exception 'Já existem 20 links abertos. Cancele os que não servem mais antes de gerar outro.' using errcode = 'P0001'; end if;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.convites (funcao, token_hash, expira_em, criado_por)
    values (p_funcao, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), now() + interval '7 days', public.meu_id());
  return v_token;
end $$;
revoke execute on function public.criar_convite(text) from public, anon;
grant execute on function public.criar_convite(text) to authenticated;

-- 4) regras de leitura: "(select f())" vira um valor calculado uma vez por consulta (mesmo resultado, sem custo por linha)
do $$
declare t text;
begin
  foreach t in array array['unidades','itens','lotes','distribuicoes','entregas','despesas'] loop
    execute format('alter policy %I on public.%I using ((select public.meu_id()) is not null)', t || '_ler', t);
  end loop;
  -- eventos entra aqui (item 8): a equipe lê tudo; o SEAB/MDA lê pela função eventos_acompanhamento()
  foreach t in array array['agricultores','visitas','membros','presencas','fotos','eventos'] loop
    execute format('alter policy %I on public.%I using ((select public.sou_equipe()))', t || '_ler', t);
  end loop;
end $$;
alter policy pessoas_ler on public.pessoas using ((select public.sou_equipe()) or auth_id = (select auth.uid()));
alter policy auditoria_ler on public.auditoria using ((select public.meu_perfil()) = 'Coordenação');

-- 5) índices
do $$
declare t text;
begin
  foreach t in array array['unidades','itens','lotes','agricultores','distribuicoes','visitas','eventos','entregas','despesas','pessoas','membros','presencas','fotos'] loop
    execute format('create index if not exists %I on public.%I (criado_em, id)', t || '_pagina', t);
  end loop;
end $$;
create index if not exists presencas_agricultor on public.presencas (agricultor);
create index if not exists lotes_codigo_prefixo on public.lotes (codigo text_pattern_ops);   -- o LIKE 'SIGLA-TIPO-%' do lote_antes

-- 6) fotos: formato fixo do caminho e arquivo só depois da linha
alter table public.fotos drop constraint if exists fotos_caminho_formato;
alter table public.fotos add constraint fotos_caminho_formato
  check (caminho ~ '^(eventos|visitas)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$') not valid;
drop policy if exists evidencias_enviar on storage.objects;
create policy evidencias_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and (select public.sou_equipe())
              and exists (select 1 from public.fotos f where f.caminho = objects.name and f.criado_por = (select public.meu_id())));

-- 7) "falta enviar": limites
create or replace function public.informar_fila(p_aparelho text, p_quantos integer, p_recusados integer, p_desde timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare eu uuid := public.meu_id();
begin
  if eu is null or not public.sou_equipe() then return; end if;
  if p_aparelho is null or length(p_aparelho) not between 8 and 64 then raise exception 'Aparelho inválido.' using errcode = 'P0001'; end if;
  if coalesce(p_quantos, 0) <= 0 then delete from public.fila_celular where pessoa = eu and aparelho = p_aparelho; return; end if;
  perform pg_advisory_xact_lock(hashtext('sqc-fila-' || eu::text));   -- um aparelho da pessoa por vez, para o limite valer
  if not exists (select 1 from public.fila_celular where pessoa = eu and aparelho = p_aparelho)
     and (select count(*) from public.fila_celular where pessoa = eu) >= 10 then
    raise exception 'Muitos aparelhos informando lançamentos parados para a mesma pessoa.' using errcode = 'P0001';
  end if;
  insert into public.fila_celular (pessoa, aparelho, quantos, recusados, desde, informado_em)
  values (eu, p_aparelho, least(p_quantos, 100000), least(greatest(coalesce(p_recusados, 0), 0), 100000),
          greatest(least(coalesce(p_desde, now()), now()), now() - interval '1 year'), now())
  on conflict (pessoa, aparelho) do update set quantos = excluded.quantos, recusados = excluded.recusados, desde = excluded.desde, informado_em = now();
end $$;
create or replace function public.listar_fila_celular()
returns table (pessoa uuid, nome text, quantos integer, recusados integer, desde timestamptz, informado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select f.pessoa, p.nome, least(sum(f.quantos), 100000)::integer, least(sum(f.recusados), 100000)::integer, min(f.desde), max(f.informado_em)
    from public.fila_celular f join public.pessoas p on p.id = f.pessoa
   where public.meu_perfil() = 'Coordenação' and f.quantos > 0
   group by f.pessoa, p.nome
   order by min(f.desde)
$$;
revoke execute on function public.informar_fila(text, integer, integer, timestamptz), public.listar_fila_celular() from anon, public;
grant execute on function public.informar_fila(text, integer, integer, timestamptz), public.listar_fila_celular() to authenticated;

-- 8) atividades para o SEAB/MDA, sem link e sem observações
create or replace function public.eventos_acompanhamento()
returns table (id uuid, tipo text, data date, tema text, lugar text, municipio text, part integer, mulheres integer, criado_em timestamptz, atualizado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select e.id, e.tipo, e.data, e.tema, e.lugar, e.municipio, e.part, e.mulheres, e.criado_em, e.atualizado_em
    from public.eventos e
   where public.meu_id() is not null
   order by e.criado_em, e.id
$$;
revoke execute on function public.eventos_acompanhamento() from anon, public;
grant execute on function public.eventos_acompanhamento() to authenticated;

notify pgrst, 'reload schema';
select 'Correções da auditoria de 13/10 aplicadas (corridas, volume, fotos, falta enviar e acompanhamento).' as resultado;
