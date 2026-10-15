-- Matriz de acesso por perfil (auditoria de 15/10/2026). Roda depois do test_banco.sql, com os dados que ele deixou.
-- Para cada perfil (e para quem não entrou), em cada tabela: quantas linhas lê, quantas consegue alterar e quantas
-- consegue excluir. Alteração e exclusão são desfeitas na hora (subtransação), nada fica gravado.
-- Falha com "FALHOU: ..." quando uma regra do CLAUDE.md não vale no banco. A matriz inteira sai no fim, para o relatório.
\set ON_ERROR_STOP on
create table if not exists teste.matriz (perfil text, tabela text, le int, altera int, exclui int);
grant all on teste.matriz to authenticated, anon;
-- garante ao menos uma linha de cada tabela de campo (o test_banco pode ter apagado as dele)
insert into public.agricultores (id, nome) values ('dddddddd-0000-4000-8000-0000000000ff', 'Agricultora da matriz (fictícia)') on conflict do nothing;
insert into public.visitas (agricultor, data, usou) values ('dddddddd-0000-4000-8000-0000000000ff', current_date, 'Sim');

create or replace function teste.medir(p_perfil text) returns void language plpgsql as $$
declare t text; le int; al int; ex int;
begin
  foreach t in array array['pessoas','unidades','itens','lotes','agricultores','distribuicoes','visitas','eventos','entregas','despesas',
                           'auditoria','contas_bloqueadas','membros','convites','presencas','fotos','fila_celular'] loop
    begin execute format('select count(*) from public.%I', t) into le; exception when insufficient_privilege then le := -1; end;
    al := 0; ex := 0;
    begin execute format('update public.%I set id = id', t); get diagnostics al = row_count; raise exception 'desfaz';
    exception when others then if sqlerrm <> 'desfaz' then al := -1; end if; end;
    begin execute format('delete from public.%I', t); get diagnostics ex = row_count; raise exception 'desfaz';
    exception when others then if sqlerrm <> 'desfaz' then ex := -1; end if; end;
    insert into teste.matriz values (p_perfil, t, le, al, ex);
  end loop;
end $$;
grant execute on function teste.medir(text) to authenticated, anon;

select teste.sou('bbbbbbbb-0000-4000-8000-000000000001', 'coord@teste.br'); set role authenticated; select teste.medir('Coordenação'); reset role;
select teste.sou('bbbbbbbb-0000-4000-8000-000000000003', 'e2@teste.br');    set role authenticated; select teste.medir('Equipe'); reset role;
select teste.sou('bbbbbbbb-0000-4000-8000-00000000000a', 'aux@teste.br');   set role authenticated; select teste.medir('Auxiliar'); reset role;
select teste.sou('bbbbbbbb-0000-4000-8000-00000000000b', 'form@teste.br');  set role authenticated; select teste.medir('Formador'); reset role;
select teste.sou('bbbbbbbb-0000-4000-8000-000000000009', 'mda@teste.br');   set role authenticated; select teste.medir('Acompanhamento'); reset role;
select teste.sou('', '');                                                    set role anon;          select teste.medir('Sem login'); reset role;

\pset footer off
select tabela, string_agg(perfil || '=' || le || '/' || altera || '/' || exclui, '  ' order by perfil) as "lê/altera/exclui (-1 = sem permissão)"
  from teste.matriz group by tabela order by tabela;
do $$ declare r record; erros text := '';
  -- regras do CLAUDE.md: quem NÃO pode ler (0 linhas ou sem permissão)
  ler_nao constant text[][] := array[
    ['Auxiliar','agricultores'],['Auxiliar','visitas'],['Auxiliar','presencas'],['Auxiliar','fotos'],['Auxiliar','auditoria'],
    ['Formador','agricultores'],['Formador','visitas'],['Formador','despesas'],['Formador','membros'],['Formador','auditoria'],['Formador','itens'],
    ['Acompanhamento','agricultores'],['Acompanhamento','visitas'],['Acompanhamento','despesas'],['Acompanhamento','auditoria'],['Acompanhamento','membros'],
    ['Acompanhamento','presencas'],['Acompanhamento','fotos'],['Acompanhamento','itens'],['Acompanhamento','eventos'],
    ['Equipe','auditoria']];
  -- quem PRECISA ler para trabalhar
  ler_sim constant text[][] := array[['Coordenação','auditoria'],['Coordenação','despesas'],['Equipe','agricultores'],['Equipe','visitas'],
    ['Auxiliar','despesas'],['Auxiliar','membros'],['Auxiliar','itens'],['Formador','eventos'],['Formador','presencas']];
  -- quem NÃO pode alterar nem excluir nada da tabela
  mexer_nao constant text[][] := array[
    ['Auxiliar','agricultores'],['Auxiliar','visitas'],['Auxiliar','lotes'],['Auxiliar','eventos'],['Auxiliar','distribuicoes'],['Auxiliar','auditoria'],
    ['Formador','agricultores'],['Formador','visitas'],['Formador','lotes'],['Formador','despesas'],['Formador','membros'],['Formador','unidades'],['Formador','auditoria'],
    ['Acompanhamento','unidades'],['Acompanhamento','lotes'],['Acompanhamento','eventos'],['Acompanhamento','entregas'],['Acompanhamento','membros'],['Acompanhamento','pessoas'],
    ['Equipe','despesas'],['Equipe','auditoria'],['Coordenação','auditoria']];
  i int;
begin
  for i in 1 .. array_length(ler_nao, 1) loop
    select * into r from teste.matriz where perfil = ler_nao[i][1] and tabela = ler_nao[i][2];
    if r.le > 0 then erros := erros || format(' %s lê %s linha(s) de %s;', r.perfil, r.le, r.tabela); end if; end loop;
  for i in 1 .. array_length(ler_sim, 1) loop
    select * into r from teste.matriz where perfil = ler_sim[i][1] and tabela = ler_sim[i][2];
    if coalesce(r.le, 0) <= 0 then erros := erros || format(' %s não lê %s;', ler_sim[i][1], ler_sim[i][2]); end if; end loop;
  for i in 1 .. array_length(mexer_nao, 1) loop
    select * into r from teste.matriz where perfil = mexer_nao[i][1] and tabela = mexer_nao[i][2];
    if r.altera > 0 or r.exclui > 0 then erros := erros || format(' %s altera %s/exclui %s em %s;', r.perfil, r.altera, r.exclui, r.tabela); end if; end loop;
  for r in select * from teste.matriz where perfil = 'Sem login' loop
    if r.le > 0 or r.altera > 0 or r.exclui > 0 then erros := erros || format(' sem login mexe em %s;', r.tabela); end if; end loop;
  if erros <> '' then raise exception 'FALHOU: matriz de acesso:%', erros; end if;
end $$;

select 'MATRIZ DE ACESSO: ok (' || count(*) || ' combinações perfil × tabela)' from teste.matriz;
