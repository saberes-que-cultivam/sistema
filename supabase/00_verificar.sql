-- Saberes que Cultivam — 00: conferência (não muda nada, só mostra).
-- Rode sempre que quiser saber se o banco está inteiro.
-- Esperado: todas as tabelas com "rls" = true; "politicas" de 1 a 4 (contas_bloqueadas tem 0 de propósito: ninguém lê pelo app);
-- e, na segunda lista, tudo "ok".
select c.relname as tabela, c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as politicas,
       (select count(*) from pg_trigger g where g.tgrelid = c.oid and not g.tgisinternal) as gatilhos
  from pg_class c
 where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
 order by 1;

select 'trava de cadastro no login' as item,
       case when exists (select 1 from pg_trigger where tgname = 'auth_so_cadastrados') then 'ok' else 'FALTA: rode o 01 e depois, em ordem, do 04 ao último script' end as situacao
union all
select 'regras do 04 em vigor (login e acompanhamento)',
       case when pg_get_functiondef('public.vincular_conta()'::regprocedure) like '%contas_bloqueadas%' then 'ok' else 'FALTA: rode de novo do 04 ao último script, em ordem (o 01 foi rodado depois deles)' end
union all
select 'CPF e dados reservados da equipe fechados',
       case when to_regclass('public.membros') is null then 'ainda sem a tabela (rode o 07)'
            when not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'membros' and column_name = 'cpf') then 'ainda sem os campos (rode o 10)'
            when has_column_privilege('authenticated', 'public.membros', 'cpf', 'select') then 'ABERTO: rode o 10 de novo agora' else 'ok' end
union all
select 'coordenação ativa',
       case when exists (select 1 from public.pessoas where perfil = 'Coordenação' and ativo) then 'ok' else 'FALTA: rode o 02 com o seu e-mail' end
union all
select 'coordenação que já entrou',
       case when exists (select 1 from public.pessoas where perfil = 'Coordenação' and ativo and auth_id is not null) then 'ok' else 'ainda ninguém criou senha' end;
