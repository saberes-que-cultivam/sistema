-- Preparo do teste de estresse: 20 pessoas da equipe com login, 1 unidade, 30 unidades produtivas e 1 lote pronto de 100 kg.
insert into public.pessoas (id, nome, email, perfil)
  select ('a0000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'Estresse ' || g, 'estresse' || g || '@teste.br', case when g <= 2 then 'Coordenação' else 'Equipe' end from generate_series(1, 20) g;
insert into auth.users (id, email) select ('b0000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'estresse' || g || '@teste.br' from generate_series(1, 20) g;
select set_config('sqc.vinculando', '1', false);   -- só neste preparo: liga os logins direto, sem passar pelo primeiro acesso
update public.pessoas p set auth_id = ('b0000000-0000-4000-8000-' || right(p.id::text, 12))::uuid where p.email like 'estresse%';
select set_config('sqc.vinculando', '', false);
insert into public.unidades (id, nome, sigla) values ('c0000000-0000-4000-8000-000000000001', 'Unidade de estresse', 'EST');
insert into public.agricultores (id, nome, diag, gasto0) select ('d0000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'Pessoa ' || g, '2026-08-01', 100 from generate_series(1, 30) g;
insert into public.lotes (id, unidade, tipo, inicio, qtd, status) values ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Bokashi', '2026-08-01', 100, 'Pronto');
-- as coordenações dos outros testes saem de cena: no teste 3 só podem existir as duas de estresse
update public.pessoas set ativo = false where perfil = 'Coordenação' and email not like 'estresse%';
