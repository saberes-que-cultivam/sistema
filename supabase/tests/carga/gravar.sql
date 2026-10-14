-- Teste de carga: uma gravação por transação, como o app faz (PostgREST: claims do JWT, set local role authenticated, insert/update ... returning).
-- Pessoa da Equipe (logins 3 a 20). Sorteia uma de 8 operações.
\set u random(3, 20)
\set op random(1, 8)
\set l random(1, 30)
\set a random(1, 30)
\set v random(1, 500)
\set e random(1, 400)
\set t random(1, 3)
\set r random(1, 1000000)
\if :op = 1
-- lote novo (código gerado com trava por unidade+tipo)
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
insert into public.lotes (unidade, tipo, inicio, qtd, status) values ('c0000000-0000-4000-8000-000000000001', (array['Húmus de minhoca','Bokashi','Composto orgânico'])[:t], current_date - 30, 50, 'Em preparo') returning to_json(lotes.*)::text;
COMMIT;
\elif :op = 2
-- edição de lote (gatilho soma as entregas do lote)
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
update public.lotes set obs = 'carga ' || :r where id = ('e1000000-0000-4000-8000-' || lpad(:l::text, 12, '0'))::uuid returning to_json(lotes.*)::text;
COMMIT;
\elif :op = 3
-- entrega (gatilho trava o lote e confere o saldo)
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
insert into public.distribuicoes (data, lote, agricultor, qtd) values (current_date, ('e1000000-0000-4000-8000-' || lpad(:l::text, 12, '0'))::uuid, ('d0000000-0000-4000-8000-' || lpad(:a::text, 12, '0'))::uuid, 1) returning to_json(distribuicoes.*)::text;
COMMIT;
\elif :op = 4
-- visita nova
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
insert into public.visitas (data, agricultor, usou, vigor, gasto, obs) values (current_date, ('d0000000-0000-4000-8000-' || lpad(:a::text, 12, '0'))::uuid, 'Sim', 4, 60, 'carga') returning to_json(visitas.*)::text;
COMMIT;
\elif :op = 5
-- edição de visita
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
update public.visitas set obs = 'editada ' || :r, vigor = 1 + :r % 5 where id = ('90000000-0000-4000-8000-' || lpad(:v::text, 12, '0'))::uuid returning to_json(visitas.*)::text;
COMMIT;
\elif :op = 6
-- atividade nova
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
insert into public.eventos (tipo, data, tema, municipio, part, mulheres) values ('Capacitação', current_date, 'carga', 'Apodi', 20, 10) returning to_json(eventos.*)::text;
COMMIT;
\elif :op = 7
-- presença numa atividade
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
insert into public.presencas (evento, nome, comunidade, municipio, mulher) values (('70000000-0000-4000-8000-' || lpad(:e::text, 12, '0'))::uuid, 'Participante carga ' || :r, 'Comunidade', 'Apodi', true) returning to_json(presencas.*)::text;
COMMIT;
\elif :op = 8
-- edição de atividade
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
update public.eventos set part = 20 + :r % 5 where id = ('70000000-0000-4000-8000-' || lpad(:e::text, 12, '0'))::uuid returning to_json(eventos.*)::text;
COMMIT;
\endif
