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
              then 'VOLTOU ATRÁS: o 01 foi rodado depois do 15; rode do 04 ao último script de novo'
            when (select coalesce(with_check, '') from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'evidencias_enviar') not like '%fotos%'
              or pg_get_functiondef('public.fotos_antes()'::regprocedure) not like '%key share%'
              then 'VOLTOU ATRÁS: o 13 foi rodado depois do 15 (foto sem linha voltou a subir); rode o 15 e o 20 de novo'
            when pg_get_functiondef('public.vincular_conta()'::regprocedure) not like '%for update%'
              then 'VOLTOU ATRÁS: o 04 foi rodado depois do 15; rode do 15 ao último script de novo' else 'ok' end
union all
select 'despesas fora do alcance do SEAB/MDA (16)',
       case when (select qual from pg_policies where schemaname = 'public' and tablename = 'despesas' and policyname = 'despesas_ler') like '%sou_equipe%' then 'ok'
            else 'ABERTO: o SEAB/MDA lê as despesas; rode o 16 (de novo, se o 15 foi rodado depois dele)' end
union all
select 'função formador(a) na equipe (17)',
       case when pg_get_constraintdef((select oid from pg_constraint where conname = 'membros_funcao_check')) not like '%formador%' then 'FALTA: rode o 17'
            when pg_get_functiondef('public.criar_convite(text)'::regprocedure) not like '%formador%' then 'VOLTOU ATRÁS: o 11 ou o 15 foi rodado depois do 17; rode o 17 de novo' else 'ok' end
union all
select 'localização da visita (18)', case when not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'visitas' and column_name = 'lat') then 'FALTA: rode o 18'
            when pg_get_functiondef('public.visitas_anonimas()'::regprocedure) like '%lat%' then 'ABERTO: a lista do SEAB/MDA traz a localização; confira o 05' else 'ok' end
union all
select 'meus dados: celular e município (19)', case when to_regprocedure('public.atualizar_meus_contatos(text,text)') is null then 'FALTA: rode o 19' else 'ok' end
union all
select 'correções da auditoria de 14/10 (20)',
       case when to_regprocedure('public.itens_acompanhamento()') is null then 'FALTA: rode o 20'
            when pg_get_functiondef('public.atualizar_meus_contatos(text,text)'::regprocedure) not like '%sou_equipe%' and pg_get_functiondef('public.atualizar_meus_contatos(text,text)'::regprocedure) not like '%sou_do_projeto%' then 'VOLTOU ATRÁS: o 19 foi rodado depois do 20; rode o 20 de novo'
            when pg_get_functiondef('public.fotos_antes()'::regprocedure) not like '%storage.objects%' then 'VOLTOU ATRÁS: o 13 ou o 15 foi rodado depois do 20; rode o 20 de novo'
            when (select qual from pg_policies where schemaname = 'public' and tablename = 'itens' and policyname = 'itens_ler') not like '%sou_equipe%' then 'ABERTO: o SEAB/MDA lê valor e rubrica dos itens (o 15 foi rodado depois do 20); rode o 20 de novo'
            else 'ok' end
union all
select 'histórico de downloads (21)', case when to_regprocedure('public.registrar_download(text,integer)') is null then 'FALTA: rode o 21' else 'ok' end
union all
select 'correções da auditoria formal (22)',
       case when not exists (select 1 from pg_trigger where tgname = 'b_visita_data' and tgrelid = 'public.visitas'::regclass) then 'FALTA: rode o 22'
            when (select qual from pg_policies where schemaname = 'public' and tablename = 'auditoria' and policyname = 'auditoria_ler') like '%AS meu_perfil) =%' then 'CONFIRA: o 15 foi rodado depois do 22 (histórico lento); rode o 22 de novo'
            else 'ok' end
union all
select 'perfis do auxiliar e de formador(a) (23)',
       case when to_regprocedure('public.sou_do_projeto()') is null then 'FALTA: rode o 23'
            when (select qual from pg_policies where schemaname = 'public' and tablename = 'despesas' and policyname = 'despesas_ler') not like '%Auxiliar%'
              or (select qual from pg_policies where schemaname = 'public' and tablename = 'eventos' and policyname = 'eventos_ler') not like '%Formador%'
              or (select qual from pg_policies where schemaname = 'public' and tablename = 'membros' and policyname = 'membros_ler') not like '%Auxiliar%'
              or (select qual from pg_policies where schemaname = 'public' and tablename = 'itens' and policyname = 'itens_ler') not like '%Auxiliar%'
              then 'VOLTOU ATRÁS: o 15, o 16 ou o 20 foi rodado depois do 23; rode do 16 ao último de novo'
            when not exists (select 1 from pg_trigger where tgname = 'b_membros_conferir') then 'FALTA: rode o 23'
            else 'ok' end
union all
select 'foto de perfil da equipe (24)',
       case when to_regprocedure('public.definir_foto(uuid,text)') is null then 'FALTA: rode o 24'
            when exists (select 1 from storage.buckets where id = 'equipe' and public) then 'ABERTO: a pasta de fotos da equipe está pública; rode o 24 de novo'
            when (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'equipe_foto_%') <> 3 then 'CONFIRA: deviam ser 3 regras equipe_foto_* (rode o 24 de novo)'
            else 'ok' end
union all
select 'Meta 2: em funcionamento só com os passos (25)',
       case when not exists (select 1 from pg_trigger where tgname = 'b_unidade_passos' and tgrelid = 'public.unidades'::regclass) then 'FALTA: rode o 25'
            else 'ok' end
union all
select 'Meta 2: data de entrada em funcionamento (26)',
       case when not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'unidades' and column_name = 'funcionando_em')
              or not exists (select 1 from pg_trigger where tgname = 'b_unidade_data' and tgrelid = 'public.unidades'::regclass) then 'FALTA: rode o 26'
            else 'ok' end
union all
select 'documento das entregas e substituta (27)',
       case when to_regprocedure('public.definir_documento(uuid,text,text)') is null
              or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'membros' and column_name = 'substitui') then 'FALTA: rode o 27'
            when exists (select 1 from storage.buckets where id = 'documentos' and public) then 'ABERTO: a pasta de documentos está pública; rode o 27 de novo'
            when (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'documentos_%') <> 3 then 'CONFIRA: deviam ser 3 regras documentos_* (rode o 27 de novo)'
            else 'ok' end
union all
select 'cargo de quem acompanha (28)',
       case when not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pessoas' and column_name = 'cargo') then 'FALTA: rode o 28' else 'ok' end
union all
select 'correções da auditoria das versões 85 a 89 (29)',
       case when not exists (select 1 from pg_constraint where conname = 'membros_substitui_outra') then 'FALTA: rode o 29'
            when (select qual from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'documentos_excluir') not like '%entregas%'
              then 'VOLTOU ATRÁS: o 27 foi rodado depois do 29 (bolsista volta a apagar documento de qualquer entrega); rode o 29 de novo'
            when pg_get_functiondef('public.unidade_data_funcionamento()'::regprocedure) not like '%old.funcionando_em is not null%'
              then 'VOLTOU ATRÁS: o 26 foi rodado depois do 29; rode o 29 de novo'
            else 'ok' end
union all
select 'colunas da equipe que a tela lê (23, 24, 27)',
       case when to_regclass('public.membros') is null then 'ainda sem a tabela (rode o 07)'
            when exists (select 1 from (values ('termo_em'), ('foto'), ('substitui')) v(c)
                          where exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'membros' and column_name = v.c)
                            and not has_column_privilege('authenticated', 'public.membros', v.c, 'select'))
              then 'VOLTOU ATRÁS: o 10 foi rodado depois do 23, 24 ou 27 (a aba Equipe fica vazia); rode do 23 ao último de novo'
            else 'ok' end
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
