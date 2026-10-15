-- =====================================================================
-- Saberes que Cultivam — SIMULAÇÃO: apaga os dados fictícios criados pelo povoar.sql
-- Apaga SÓ os registros cujo id começa por ffffffff-0000-4000-8000- (os da simulação) e as linhas do histórico desses registros.
-- Nenhum registro real é tocado. Pode rodar mais de uma vez. Rode inteiro, de uma vez, no SQL Editor do Supabase.
-- GERADO por ferramentas/simulacao_sql.js (2026-10-15). Não edite à mão: gere de novo.
-- =====================================================================
begin;
delete from public.despesas where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.entregas where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.presencas where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.eventos where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.visitas where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.distribuicoes where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.agricultores where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.lotes where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.membros where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.itens where id::text like 'ffffffff-0000-4000-8000-%';
delete from public.unidades where id::text like 'ffffffff-0000-4000-8000-%';
-- histórico: as inclusões feitas pelo povoar.sql e as exclusões feitas agora (a simulação não deixa rastro na prestação de contas)
delete from public.auditoria where registro_id::text like 'ffffffff-0000-4000-8000-%';
commit;

select (select count(*) from public.unidades where id::text like 'ffffffff-0000-4000-8000-%') as unidades,
       (select count(*) from public.itens where id::text like 'ffffffff-0000-4000-8000-%') as itens,
       (select count(*) from public.membros where id::text like 'ffffffff-0000-4000-8000-%') as membros,
       (select count(*) from public.lotes where id::text like 'ffffffff-0000-4000-8000-%') as lotes,
       (select count(*) from public.agricultores where id::text like 'ffffffff-0000-4000-8000-%') as agricultores,
       (select count(*) from public.distribuicoes where id::text like 'ffffffff-0000-4000-8000-%') as distribuicoes,
       (select count(*) from public.visitas where id::text like 'ffffffff-0000-4000-8000-%') as visitas,
       (select count(*) from public.eventos where id::text like 'ffffffff-0000-4000-8000-%') as eventos,
       (select count(*) from public.presencas where id::text like 'ffffffff-0000-4000-8000-%') as presencas,
       (select count(*) from public.entregas where id::text like 'ffffffff-0000-4000-8000-%') as entregas,
       (select count(*) from public.despesas where id::text like 'ffffffff-0000-4000-8000-%') as despesas,
       (select count(*) from public.auditoria where registro_id::text like 'ffffffff-0000-4000-8000-%') as historico;   -- tudo zero = limpo
