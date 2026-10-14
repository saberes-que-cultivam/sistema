-- EXPLAIN (ANALYZE, BUFFERS) das consultas mais lentas, com RLS valendo (pessoa da Equipe nº 5 / Coordenação nº 1 / Acompanhamento nº 21).
-- Uso: psql -X -f explicar.sql   (com o env de preparar.sh carregado)
\pset pager off
begin;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000005', true), set_config('request.jwt.claim.email', 'estresse5@teste.br', true);
set local role authenticated;
\echo '--- 1) visitas, página 6 (Equipe): o range() vira limit/offset e cada página ordena a tabela inteira'
explain (analyze, buffers, costs off) select coalesce(json_agg(x), '[]')::text from (select * from public.visitas order by criado_em, id limit 1000 offset 5000) x;
\echo '--- 2) presencas, página 8 (Equipe)'
explain (analyze, buffers, costs off) select coalesce(json_agg(x), '[]')::text from (select * from public.presencas order by criado_em, id limit 1000 offset 7000) x;
\echo '--- 3) pessoas (Equipe): regra com "sou_equipe() or auth_id = auth.uid()" é avaliada linha a linha'
explain (analyze, buffers, costs off) select coalesce(json_agg(x), '[]')::text from (select * from public.pessoas order by criado_em, id limit 1000 offset 0) x;
\echo '--- 4) entrega nova num lote com muitas entregas (gatilho: trava o lote + soma as entregas)'
explain (analyze, buffers, costs off) insert into public.distribuicoes (data, lote, agricultor, qtd) values (current_date, 'e1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 1);
\echo '--- 5) lote novo (gatilho: trava por unidade+tipo + max() do código)'
explain (analyze, buffers, costs off) insert into public.lotes (unidade, tipo, inicio, qtd) values ('c0000000-0000-4000-8000-000000000001', 'Bokashi', current_date - 30, 50);
rollback;
begin;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true), set_config('request.jwt.claim.email', 'estresse1@teste.br', true);
set local role authenticated;
\echo '--- 6) histórico (Coordenação): auditoria order by em desc limit 200'
explain (analyze, buffers, costs off) select coalesce(json_agg(x), '[]')::text from (select * from public.auditoria order by em desc limit 200) x;
rollback;
begin;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000021', true), set_config('request.jwt.claim.email', 'seab21@teste.br', true);
set local role authenticated;
\echo '--- 7) visitas_anonimas() (Acompanhamento): tudo numa resposta só'
explain (analyze, buffers, costs off) select coalesce(json_agg(x), '[]')::text from public.visitas_anonimas() x;
\echo '--- 8) agricultores_anonimos() (Acompanhamento)'
explain (analyze, buffers, costs off) select coalesce(json_agg(x), '[]')::text from public.agricultores_anonimos() x;
rollback;
