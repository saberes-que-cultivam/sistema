\set ON_ERROR_STOP on
-- Volume: 10 vezes o tamanho previsto do projeto (300 unidades produtivas, 6.000 visitas, 3.000 entregas, 5.000 despesas, 20.000 linhas de auditoria a mais).
insert into public.agricultores (nome, municipio, uf, diag, gasto0, unidade) select 'Volume ' || g, 'Apodi', 'RN', '2026-08-01', 100 + g % 200, 'c0000000-0000-4000-8000-000000000001' from generate_series(1, 300) g;
insert into public.lotes (unidade, tipo, inicio, qtd, status) select 'c0000000-0000-4000-8000-000000000001', 'Composto orgânico', '2026-08-01', 100000, 'Pronto' from generate_series(1, 30);
insert into public.distribuicoes (data, lote, agricultor, qtd) select '2026-09-01'::date + (g % 30), (select id from public.lotes where codigo = 'EST-CMP-' || lpad((1 + g % 30)::text, 3, '0')), (select id from public.agricultores where nome = 'Volume ' || (1 + g % 300)), 1 from generate_series(1, 3000) g;
insert into public.visitas (data, agricultor, usou, vigor, gasto, obs) select '2026-09-01'::date + (g % 30), (select id from public.agricultores where nome = 'Volume ' || (1 + g % 300)), 'Sim', 1 + g % 5, 50 + g % 100, repeat('observação ', 20) from generate_series(1, 6000) g;
insert into public.despesas (data, etapa, rubrica, descricao, valor, status) select '2026-09-01'::date + (g % 30), '3.1', 'consumo', 'Despesa ' || g, 10, 'Pago' from generate_series(1, 5000) g;
analyze;
\timing on
\echo --- carga completa que o sistema faz ao abrir (as 10 tabelas inteiras) ---
select count(*) from (select * from public.agricultores) x;
select count(*) from (select * from public.visitas) x;
select count(*) from (select * from public.distribuicoes) x;
select count(*) from (select * from public.despesas) x;
\echo --- uma entrega nova num lote com 100 entregas (gatilho soma o saldo) ---
insert into public.distribuicoes (data, lote, agricultor, qtd) select '2026-10-01', (select id from public.lotes where codigo = 'EST-CMP-001'), (select id from public.agricultores where nome = 'Volume 1'), 1;
\echo --- histórico: últimas 200 alterações de uma auditoria grande ---
select count(*) from (select * from public.auditoria order by em desc limit 200) x;
\timing off
select (select count(*) from public.auditoria) as linhas_auditoria, pg_size_pretty(pg_database_size(current_database())) as tamanho_do_banco;
