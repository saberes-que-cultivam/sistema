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
select 'lista de presença e fotos (13)',
       case when to_regclass('public.presencas') is null or to_regclass('public.fotos') is null then 'FALTA: rode o 13'
            when not exists (select 1 from storage.buckets where id = 'evidencias') then 'FALTA a pasta de fotos: rode o 13 de novo'
            when (select public from storage.buckets where id = 'evidencias') then 'ABERTA: a pasta de fotos não pode ser pública; rode o 13 de novo' else 'ok' end
union all
select 'falta enviar dos celulares (14)', case when to_regclass('public.fila_celular') is null then 'FALTA: rode o 14' else 'ok' end
union all
select 'correções da auditoria de 13/10 (15)',
       case when to_regclass('public.visitas_pagina') is null or to_regprocedure('public.eventos_acompanhamento()') is null then 'FALTA: rode o 15'
            when (select qual from pg_policies where schemaname = 'public' and tablename = 'eventos' and policyname = 'eventos_ler') not like '%sou_equipe%'
              then 'VOLTOU ATRÁS: o 05 ou o 13 foi rodado depois do 15; rode o 15 de novo' else 'ok' end
union all
select 'regras da pasta de fotos',
       case when (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'evidencias_%') <> 3 then 'CONFIRA: deviam ser exatamente 3 regras evidencias_* (rode o 13 e o 15 de novo)'
            when exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname not like 'evidencias_%'
                          and (coalesce(qual, '') || coalesce(with_check, '')) like '%evidencias%') then 'CONFIRA: há regra criada pelo painel que mexe na pasta evidencias'
            when exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and ('anon' = any(roles) or 'public' = any(roles))) then 'CONFIRA: há regra de arquivos para quem não entrou (anon/public)'
            else 'ok' end
union all
select 'contagem dos celulares fechada', case when to_regclass('public.fila_celular') is null then 'ainda sem a tabela (rode o 14)'
       when has_table_privilege('authenticated', 'public.fila_celular', 'select') then 'ABERTA: rode o 14 de novo' else 'ok' end
union all
select 'coordenação ativa',
       case when exists (select 1 from public.pessoas where perfil = 'Coordenação' and ativo) then 'ok' else 'FALTA: rode o 02 com o seu e-mail' end
union all
select 'coordenação que já entrou',
       case when exists (select 1 from public.pessoas where perfil = 'Coordenação' and ativo and auth_id is not null) then 'ok' else 'ainda ninguém criou senha' end;
