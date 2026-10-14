-- Teste de carga — dados fictícios a mais (roda depois de estresse_preparo.sql e estresse_volume.sql). Nada aqui é dado real.
-- Pessoas: as 20 do estresse (1-2 Coordenação, 3-20 Equipe) + 4 do Acompanhamento (SEAB/MDA), logins b0000000-...-000000000021 a 24.
\set ON_ERROR_STOP on
insert into public.pessoas (id, nome, email, perfil, orgao)
  select ('a0000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'Acompanhamento ' || g, 'seab' || g || '@teste.br', 'Acompanhamento', 'SEAB'
    from generate_series(21, 24) g;
insert into auth.users (id, email) select ('b0000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'seab' || g || '@teste.br' from generate_series(21, 24) g;
select set_config('sqc.vinculando', '1', false);
update public.pessoas p set auth_id = ('b0000000-0000-4000-8000-' || right(p.id::text, 12))::uuid where p.email like 'seab%';
select set_config('sqc.vinculando', '', false);

-- mais biofábricas, itens, entregas do plano e equipe
insert into public.unidades (nome, sigla, municipio, uf) select 'Unidade carga ' || g, 'C' || chr(65 + g / 26) || chr(65 + g % 26), 'Apodi', 'RN' from generate_series(1, 20) g;
insert into public.itens (unidade, descricao, valor, rubrica, status) select 'c0000000-0000-4000-8000-000000000001', 'Item ' || g, 100 + g, 'consumo', 'A definir' from generate_series(1, 200) g;
insert into public.entregas (etapa, titulo, data) select '3.1', 'Entrega ' || g, '2026-09-01'::date + g % 30 from generate_series(1, 100) g;
insert into public.membros (funcao, nome, email, inicio, cpf, telefone) select 'discente', 'Membro ' || g, 'membro' || g || '@teste.br', '2026-08-01', lpad(g::text, 11, '0'), '(84) 90000-0000' from generate_series(1, 30) g;

-- 30 lotes grandes com id conhecido (gravações da carga) e 1 lote de 100 kg (corrida no mesmo lote)
insert into public.lotes (id, unidade, tipo, inicio, qtd, status)
  select ('e1000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'c0000000-0000-4000-8000-000000000001', 'Biofertilizante líquido', '2026-08-01', 1000000, 'Pronto' from generate_series(1, 30) g;
insert into public.lotes (id, unidade, tipo, inicio, qtd, status)
  values ('e2000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Microrganismo isolado', '2026-08-01', 100, 'Pronto');

-- 400 atividades com id conhecido, 20 presenças em cada (8.000) e 600 fotos
insert into public.eventos (id, tipo, data, tema, municipio, part, mulheres)
  select ('70000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, (array['Capacitação','Dia de campo','Reunião','Articulação'])[1 + g % 4], '2026-09-01'::date + g % 30, 'Atividade ' || g, 'Apodi', 20, 10 from generate_series(1, 400) g;
insert into public.presencas (evento, nome, comunidade, municipio, mulher)
  select ('70000000-0000-4000-8000-' || lpad((1 + g % 400)::text, 12, '0'))::uuid, 'Participante ' || g, 'Comunidade ' || g % 50, 'Apodi', g % 2 = 0 from generate_series(1, 8000) g;
insert into public.fotos (tabela, registro, caminho, tirada_em)
  select 'eventos', ('70000000-0000-4000-8000-' || lpad((1 + g % 400)::text, 12, '0'))::uuid, 'eventos/70000000-0000-4000-8000-' || lpad((1 + g % 400)::text, 12, '0') || '/' || gen_random_uuid() || '.jpg', '2026-09-10' from generate_series(1, 600) g;

-- 500 visitas com id conhecido (edição na carga)
insert into public.visitas (id, data, agricultor, usou, vigor, gasto, obs)
  select ('90000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, '2026-09-15', ('d0000000-0000-4000-8000-' || lpad((1 + g % 30)::text, 12, '0'))::uuid, 'Sim', 3, 80, 'Visita de carga ' || g from generate_series(1, 500) g;

-- função só do teste (não existe no Supabase): entrega no lote de 100 kg; recusa de saldo conta como resultado, não derruba o cliente do pgbench.
-- SECURITY INVOKER: roda como "authenticated", com RLS e o gatilho de saldo valendo.
create schema if not exists carga;
grant usage on schema carga to authenticated;
create table if not exists carga.recusas (em timestamptz default clock_timestamp(), msg text);
grant insert on carga.recusas to authenticated;
create or replace function carga.entregar(p_agricultor uuid, p_qtd numeric) returns boolean language plpgsql security invoker as $$
begin
  insert into public.distribuicoes (data, lote, agricultor, qtd) values (current_date, 'e2000000-0000-4000-8000-000000000001', p_agricultor, p_qtd);
  return true;
exception when sqlstate 'P0001' then
  insert into carga.recusas (msg) values (sqlerrm); return false;
end $$;
grant execute on function carga.entregar(uuid, numeric) to authenticated;
analyze;
select (select count(*) from public.agricultores) agricultores, (select count(*) from public.visitas) visitas, (select count(*) from public.distribuicoes) distribuicoes,
       (select count(*) from public.despesas) despesas, (select count(*) from public.eventos) eventos, (select count(*) from public.presencas) presencas,
       (select count(*) from public.lotes) lotes, (select count(*) from public.auditoria) auditoria, pg_size_pretty(pg_database_size(current_database())) tamanho;
