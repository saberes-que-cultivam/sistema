-- Saberes que Cultivam — 00: conferência (não muda nada, só mostra).
-- Rode depois do 01 e sempre que quiser saber se o banco está inteiro.
-- Esperado: 11 tabelas, todas com "rls" = true; "politicas" entre 1 e 4; e pelo menos 1 coordenação ativa.
select c.relname as tabela, c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as politicas,
       (select count(*) from pg_trigger g where g.tgrelid = c.oid and not g.tgisinternal) as gatilhos
  from pg_class c
 where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
 order by 1;

select 'trava de cadastro no login' as item,
       case when exists (select 1 from pg_trigger where tgname = 'auth_so_cadastrados') then 'ok' else 'FALTA: rode o 01 de novo' end as situacao
union all
select 'coordenação ativa',
       case when exists (select 1 from public.pessoas where perfil = 'Coordenação' and ativo) then 'ok' else 'FALTA: rode o 02 com o seu e-mail' end
union all
select 'coordenação que já entrou',
       case when exists (select 1 from public.pessoas where perfil = 'Coordenação' and ativo and auth_id is not null) then 'ok' else 'ainda ninguém criou senha' end;
