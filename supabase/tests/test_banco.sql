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
select 'TODOS OS TESTES DO BANCO PASSARAM' as resultado;
