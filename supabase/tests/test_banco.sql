-- Testes do banco (rodam num Postgres local com o stub; ver testar.sh). Cada bloco falha com "FALHOU: ..." se a regra não valer.
\set ON_ERROR_STOP on
-- pessoas: 1 coordenação (c), 1 equipe (e), 1 equipe (e2), 1 inativa
insert into public.pessoas (id, nome, email, perfil) values
 ('aaaaaaaa-0000-4000-8000-000000000001', 'Coord', 'Coord@Teste.br', 'Coordenação'),
 ('aaaaaaaa-0000-4000-8000-000000000002', 'Equipe Um', 'e1@teste.br', 'Equipe'),
 ('aaaaaaaa-0000-4000-8000-000000000003', 'Equipe Dois', 'e2@teste.br', 'Equipe');
insert into public.pessoas (nome, email, perfil, ativo) values ('Fora', 'fora@teste.br', 'Equipe', false);

-- conta de login: só e-mail cadastrado e ativo
insert into auth.users (id, email) values ('bbbbbbbb-0000-4000-8000-000000000001', 'coord@teste.br'), ('bbbbbbbb-0000-4000-8000-000000000002', 'e1@teste.br'), ('bbbbbbbb-0000-4000-8000-000000000003', 'e2@teste.br');
do $$ begin
  begin insert into auth.users (email) values ('estranho@teste.br'); raise exception 'FALHOU: aceitou conta de e-mail não cadastrado';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  begin insert into auth.users (email) values ('fora@teste.br'); raise exception 'FALHOU: aceitou conta de pessoa inativa';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
end $$;

create schema teste;
create or replace function teste.sou(p_sub text, p_email text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', p_sub, false); perform set_config('request.jwt.claim.email', p_email, false); end $$;
grant usage on schema teste to authenticated, anon;

-- ===== como COORDENAÇÃO =====
select teste.sou('bbbbbbbb-0000-4000-8000-000000000001', 'coord@teste.br');
set role authenticated;
do $$ declare r public.pessoas; begin
  r := public.vincular_conta();
  if r.id is null or r.perfil <> 'Coordenação' then raise exception 'FALHOU: vincular_conta da coordenação'; end if;
  if public.meu_perfil() <> 'Coordenação' then raise exception 'FALHOU: meu_perfil'; end if;
end $$;
insert into public.unidades (id, nome, sigla, conta) values ('cccccccc-0000-4000-8000-000000000001', 'Unidade Teste', 'tst', 'Sim');
insert into public.agricultores (id, nome) values ('dddddddd-0000-4000-8000-000000000001', 'Agricultora Teste');
insert into public.despesas (data, etapa, rubrica, descricao, valor) values ('2026-10-01', '3.1', 'consumo', 'Teste', 100);
-- a coordenação não pode ficar sem ninguém
do $$ begin
  begin update public.pessoas set perfil = 'Equipe' where id = 'aaaaaaaa-0000-4000-8000-000000000001'; raise exception 'FALHOU: deixou o projeto sem coordenação';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
end $$;
reset role;

-- ===== como EQUIPE 1 =====
select teste.sou('bbbbbbbb-0000-4000-8000-000000000002', 'e1@teste.br');
set role authenticated;
select public.vincular_conta();
-- lote: código gerado, sequência por unidade+tipo
insert into public.lotes (id, unidade, tipo, inicio, dias, qtd, med, status) values
 ('eeeeeeee-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 'Húmus de minhoca', '2026-08-01', 60, 100, 'kg', 'Maturando'),
 ('eeeeeeee-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000001', 'Húmus de minhoca', '2026-08-10', 60, 50, 'kg', 'Pronto');
do $$ declare a text; b text; quem uuid; begin
  select codigo, criado_por into a, quem from public.lotes where id = 'eeeeeeee-0000-4000-8000-000000000001';
  select codigo into b from public.lotes where id = 'eeeeeeee-0000-4000-8000-000000000002';
  if a <> 'TST-HUM-001' or b <> 'TST-HUM-002' then raise exception 'FALHOU: código do lote (% / %)', a, b; end if;
  if quem <> 'aaaaaaaa-0000-4000-8000-000000000002' then raise exception 'FALHOU: criado_por não foi carimbado'; end if;
  -- lote não pronto não distribui
  begin insert into public.distribuicoes (data, lote, agricultor, qtd) values ('2026-10-01', 'eeeeeeee-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', 10);
    raise exception 'FALHOU: distribuiu lote que não está pronto';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  -- saldo: 50 kg; 30 passa, depois 30 não passa
  insert into public.distribuicoes (id, data, lote, agricultor, qtd) values ('ffffffff-0000-4000-8000-000000000001', '2026-10-01', 'eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000001', 30);
  begin insert into public.distribuicoes (data, lote, agricultor, qtd) values ('2026-10-02', 'eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000001', 30);
    raise exception 'FALHOU: distribuiu mais do que o saldo';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  -- editar a própria entrega para 50 passa (o saldo desconta as OUTRAS entregas)
  update public.distribuicoes set qtd = 50 where id = 'ffffffff-0000-4000-8000-000000000001';
  -- lote não pode ficar menor que o distribuído, nem deixar de estar pronto, nem trocar de código
  begin update public.lotes set qtd = 40 where id = 'eeeeeeee-0000-4000-8000-000000000002'; raise exception 'FALHOU: lote ficou menor que o distribuído';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  begin update public.lotes set status = 'Maturando' where id = 'eeeeeeee-0000-4000-8000-000000000002'; raise exception 'FALHOU: lote distribuído deixou de estar pronto';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  update public.lotes set codigo = 'OUTRO' where id = 'eeeeeeee-0000-4000-8000-000000000002';
  if (select codigo from public.lotes where id = 'eeeeeeee-0000-4000-8000-000000000002') <> 'TST-HUM-002' then raise exception 'FALHOU: código do lote mudou'; end if;
  -- lote com distribuição não pode ser excluído
  begin delete from public.lotes where id = 'eeeeeeee-0000-4000-8000-000000000002'; raise exception 'FALHOU: excluiu lote em uso';
  exception when foreign_key_violation then null; end;
  -- mulheres <= participantes
  begin insert into public.eventos (tipo, data, tema, part, mulheres) values ('Capacitação', '2026-11-01', 'x', 5, 6); raise exception 'FALHOU: mulheres > participantes';
  exception when check_violation then null; end;
  -- equipe não grava despesa nem acesso
  begin insert into public.despesas (data, etapa, rubrica, descricao, valor) values ('2026-10-01', '3.1', 'consumo', 'x', 1); raise exception 'FALHOU: equipe lançou despesa';
  exception when insufficient_privilege then null; end;
  begin insert into public.pessoas (nome, email) values ('Intruso', 'i@teste.br'); raise exception 'FALHOU: equipe criou acesso';
  exception when insufficient_privilege then null; end;
  update public.pessoas set perfil = 'Coordenação' where id = 'aaaaaaaa-0000-4000-8000-000000000002';
  if public.meu_perfil() <> 'Equipe' then raise exception 'FALHOU: equipe promoveu a si mesma'; end if;
  update public.despesas set valor = 999999;
  if exists (select 1 from public.despesas where valor = 999999) then raise exception 'FALHOU: equipe alterou despesa'; end if;
  -- auditoria: equipe não lê
  if exists (select 1 from public.auditoria) then raise exception 'FALHOU: equipe leu a auditoria'; end if;
end $$;
insert into public.visitas (id, data, agricultor, usou) values ('99999999-0000-4000-8000-000000000001', '2026-10-03', 'dddddddd-0000-4000-8000-000000000001', 'Sim');
reset role;

-- ===== como EQUIPE 2: não exclui o que a equipe 1 lançou; exclui o próprio =====
select teste.sou('bbbbbbbb-0000-4000-8000-000000000003', 'e2@teste.br');
set role authenticated;
select public.vincular_conta();
insert into public.visitas (id, data, agricultor, usou) values ('99999999-0000-4000-8000-000000000002', '2026-10-04', 'dddddddd-0000-4000-8000-000000000001', 'Parcial');
delete from public.visitas where id = '99999999-0000-4000-8000-000000000001';
delete from public.visitas where id = '99999999-0000-4000-8000-000000000002';
reset role;
do $$ begin
  if not exists (select 1 from public.visitas where id = '99999999-0000-4000-8000-000000000001') then raise exception 'FALHOU: equipe excluiu registro de outra pessoa'; end if;
  if exists (select 1 from public.visitas where id = '99999999-0000-4000-8000-000000000002') then raise exception 'FALHOU: equipe não conseguiu excluir o próprio registro'; end if;
end $$;

-- ===== sem cadastro (conta de login sem pessoa ativa) e anônimo: não leem nada =====
update public.pessoas set ativo = false where id = 'aaaaaaaa-0000-4000-8000-000000000003';
set role authenticated;
do $$ begin
  if exists (select 1 from public.unidades) or exists (select 1 from public.agricultores) then raise exception 'FALHOU: pessoa desativada continua lendo'; end if;
end $$;
reset role;
set role anon;
do $$ begin
  begin perform 1 from public.agricultores; raise exception 'FALHOU: anônimo leu agricultores';
  exception when insufficient_privilege then null; end;
  begin perform public.vincular_conta(); raise exception 'FALHOU: anônimo chamou vincular_conta';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ===== coordenação: lê auditoria, exclui o que é dos outros; reenvio idêntico não gera linha =====
select teste.sou('bbbbbbbb-0000-4000-8000-000000000001', 'coord@teste.br');
set role authenticated;
do $$ declare n1 bigint; n2 bigint; begin
  select count(*) into n1 from public.auditoria;
  if n1 < 8 then raise exception 'FALHOU: auditoria com poucas linhas (%)', n1; end if;
  if not exists (select 1 from public.auditoria where tabela = 'lotes' and acao = 'INSERT' and por = 'aaaaaaaa-0000-4000-8000-000000000002') then raise exception 'FALHOU: auditoria sem autor'; end if;
  update public.unidades set nome = nome;
  select count(*) into n2 from public.auditoria;
  if n2 <> n1 then raise exception 'FALHOU: gravação sem mudança gerou auditoria'; end if;
  begin delete from public.auditoria; exception when insufficient_privilege then null; end;
  begin delete from public.pessoas where perfil = 'Equipe'; raise exception 'FALHOU: excluiu pessoa'; exception when insufficient_privilege then null; end;
  delete from public.visitas where id = '99999999-0000-4000-8000-000000000001';
  if exists (select 1 from public.visitas) then raise exception 'FALHOU: coordenação não excluiu visita'; end if;
end $$;
reset role;

-- ===== 04: correções da auditoria =====
update public.pessoas set ativo = true where id = 'aaaaaaaa-0000-4000-8000-000000000003';
select teste.sou('bbbbbbbb-0000-4000-8000-000000000002', 'e1@teste.br');
set role authenticated;
do $$ begin
  begin insert into public.entregas (etapa, titulo, data) values ('9.9', 'x', '2026-10-01'); raise exception 'FALHOU: aceitou etapa fora do plano'; exception when check_violation then null; end;
  begin insert into public.itens (unidade, descricao, rubrica) values ('cccccccc-0000-4000-8000-000000000001', 'x', 'qualquer'); raise exception 'FALHOU: aceitou rubrica fora do plano'; exception when check_violation then null; end;
  begin insert into public.lotes (unidade, tipo, inicio, qtd) values ('cccccccc-0000-4000-8000-000000000001', '<b>x</b>', '2026-08-01', 1); raise exception 'FALHOU: aceitou tipo fora da lista'; exception when check_violation then null; end;
  begin insert into public.agricultores (nome) values (repeat('a', 5000)); raise exception 'FALHOU: aceitou nome gigante'; exception when check_violation then null; end;
  begin update public.lotes set tipo = 'Bokashi' where id = 'eeeeeeee-0000-4000-8000-000000000002'; raise exception 'FALHOU: lote mudou de tipo'; exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  begin update public.lotes set inicio = '2030-01-01' where id = 'eeeeeeee-0000-4000-8000-000000000002'; raise exception 'FALHOU: lote distribuído mudou a data de início'; exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  begin insert into public.distribuicoes (data, lote, agricultor, qtd) values ('2999-01-01', 'eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000001', 1); raise exception 'FALHOU: aceitou entrega no futuro'; exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  begin insert into public.distribuicoes (data, lote, agricultor, qtd) values ('2026-10-02', 'eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000001', 1); raise exception 'FALHOU: passou do saldo';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; if sqlerrm not like '%só tem 0 kg de saldo%' then raise exception 'FALHOU: mensagem de saldo: %', sqlerrm; end if; end;
end $$;
reset role;
-- código do lote depois do 999
update public.lotes set codigo = 'TST-HUM-999' where id = 'eeeeeeee-0000-4000-8000-000000000001';   -- direto (sem gatilho mudar): simula o 999º
alter table public.lotes disable trigger lote_antes; update public.lotes set codigo = 'TST-HUM-999' where id = 'eeeeeeee-0000-4000-8000-000000000001'; alter table public.lotes enable trigger lote_antes;
insert into public.lotes (id, unidade, tipo, inicio, qtd) values ('eeeeeeee-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000001', 'Húmus de minhoca', '2026-08-01', 1), ('eeeeeeee-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000001', 'Húmus de minhoca', '2026-08-01', 1);
do $$ begin
  if (select codigo from public.lotes where id = 'eeeeeeee-0000-4000-8000-000000000003') <> 'TST-HUM-1000' or (select codigo from public.lotes where id = 'eeeeeeee-0000-4000-8000-000000000004') <> 'TST-HUM-1001' then raise exception 'FALHOU: código do lote depois do 999'; end if;
end $$;
-- e-mail trocado: a conta antiga não se liga a mais ninguém, nem a um cadastro novo com o e-mail antigo
update public.pessoas set email = 'e1novo@teste.br' where id = 'aaaaaaaa-0000-4000-8000-000000000002';
insert into public.pessoas (nome, email, perfil) values ('Outra pessoa', 'e1@teste.br', 'Coordenação');
select teste.sou('bbbbbbbb-0000-4000-8000-000000000002', 'e1@teste.br');
set role authenticated;
do $$ declare r public.pessoas; begin
  r := public.vincular_conta();
  if r.id is not null or public.meu_id() is not null then raise exception 'FALHOU: conta antiga se ligou a outro cadastro'; end if;
end $$;
reset role;
-- única coordenação ativa não troca o próprio e-mail nem sai
update public.pessoas set ativo = false where email = 'e1@teste.br';
do $$ begin
  begin update public.pessoas set email = 'outro@teste.br' where id = 'aaaaaaaa-0000-4000-8000-000000000001'; raise exception 'FALHOU: única coordenação trocou o e-mail';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
end $$;

-- ===== 05: perfil de acompanhamento (SEAB/MDA) =====
insert into public.pessoas (id, nome, email, perfil, orgao) values ('aaaaaaaa-0000-4000-8000-000000000009', 'Pessoa do MDA', 'mda@teste.br', 'Acompanhamento', 'SEAB/MDA');
insert into auth.users (id, email) values ('bbbbbbbb-0000-4000-8000-000000000009', 'mda@teste.br');
insert into public.visitas (data, agricultor, usou, obs, tecnico) values ('2026-10-05', 'dddddddd-0000-4000-8000-000000000001', 'Sim', 'Dona Fulana contou que...', 'Técnico X');
select teste.sou('bbbbbbbb-0000-4000-8000-000000000009', 'mda@teste.br');
set role authenticated;
do $$ declare r public.pessoas; n integer; begin
  r := public.vincular_conta(); if r.perfil <> 'Acompanhamento' then raise exception 'FALHOU: vínculo do acompanhamento'; end if;
  if not exists (select 1 from public.unidades) or not exists (select 1 from public.lotes) or not exists (select 1 from public.despesas) or not exists (select 1 from public.distribuicoes) then raise exception 'FALHOU: acompanhamento não lê o andamento'; end if;
  if exists (select 1 from public.agricultores) or exists (select 1 from public.visitas) or exists (select 1 from public.auditoria) then raise exception 'FALHOU: acompanhamento leu dado pessoal ou auditoria'; end if;
  select count(*) into n from public.pessoas; if n <> 1 then raise exception 'FALHOU: acompanhamento viu % pessoas (devia ver só o próprio cadastro)', n; end if;
  if not exists (select 1 from public.agricultores_anonimos() where nome = 'Unidade produtiva 01') then raise exception 'FALHOU: lista anônima vazia'; end if;
  if exists (select 1 from public.agricultores_anonimos() a where a.nome like '%Teste%') then raise exception 'FALHOU: lista anônima trouxe nome'; end if;
  if (select count(*) from public.visitas_anonimas()) < 1 then raise exception 'FALHOU: visitas anônimas vazias'; end if;
  begin insert into public.eventos (tipo, data, tema) values ('Reunião', '2026-10-01', 'x'); raise exception 'FALHOU: acompanhamento gravou'; exception when insufficient_privilege then null; end;
  begin insert into public.despesas (data, etapa, rubrica, descricao, valor) values ('2026-10-01', '3.1', 'consumo', 'x', 1); raise exception 'FALHOU: acompanhamento lançou despesa'; exception when insufficient_privilege then null; end;
  update public.unidades set nome = 'INVADIDA'; if exists (select 1 from public.unidades where nome = 'INVADIDA') then raise exception 'FALHOU: acompanhamento alterou unidade'; end if;
  delete from public.lotes; if not exists (select 1 from public.lotes) then raise exception 'FALHOU: acompanhamento excluiu lote'; end if;
  update public.pessoas set perfil = 'Coordenação'; if public.meu_perfil() <> 'Acompanhamento' then raise exception 'FALHOU: acompanhamento se promoveu'; end if;
end $$;
reset role;
-- a equipe continua lendo e gravando como antes
select teste.sou('bbbbbbbb-0000-4000-8000-000000000003', 'e2@teste.br');
set role authenticated;
do $$ begin
  if not exists (select 1 from public.agricultores where nome = 'Agricultora Teste') then raise exception 'FALHOU: equipe deixou de ler agricultores'; end if;
  insert into public.eventos (tipo, data, tema) values ('Reunião', '2026-10-01', 'ok');
end $$;
reset role;
select 'TODOS OS TESTES DO BANCO PASSARAM' as resultado;
