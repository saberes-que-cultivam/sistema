-- Conferência independente das metas (auditoria de 15/10/2026): com o banco povoado pela simulação, conta cada etapa
-- com SQL escrito à parte (as regras do CLAUDE.md, sem usar o código da tela) e devolve, numa linha JSON, essas contas
-- e as tabelas da simulação. O conferir_metas.js roda as contas da tela (js/regras.js) nos mesmos dados e compara.
\pset tuples_only on
\pset format unaligned
with s as (select 'ffffffff-0000-4000-8000-%'::text as p, current_date as hoje),
ag as (select a.* from public.agricultores a, s where a.id::text like s.p),
ev as (select e.* from public.eventos e, s where e.id::text like s.p),
conta as (
  select json_build_object(
    '2.1', (select count(*) from public.unidades u, s where u.id::text like s.p and u.conta = 'Sim'
              and u.local_ok and u.parceiro_ok and u.termo and u.itens_ok and u.orcamento and u.entregue and u.montada and u.funcionando),
    '3.2', (select count(*) from ev, s where ev.tipo = 'Capacitação' and ev.data <= s.hoje
              and (coalesce(ev.part, 0) > 0 or exists (select 1 from public.presencas p where p.evento = ev.id))),
    '5.1', (select count(*) from ev, s where ev.tipo = 'Dia de campo' and ev.data <= s.hoje
              and (coalesce(ev.part, 0) > 0 or exists (select 1 from public.presencas p where p.evento = ev.id))),
    '3.3', (select count(*) from ag, s where ag.kit and ag.kitdata <= s.hoje),
    '4.1', (select count(*) from ag, s where exists (
              select 1 from public.visitas v where v.agricultor = ag.id and v.data <= s.hoje
                and v.data >= (select min(d.data) from public.distribuicoes d where d.agricultor = ag.id and d.data <= s.hoje))),
    'entregas', (select coalesce(json_object_agg(etapa, n), '{}') from (select g.etapa, count(*) n from public.entregas g, s where g.id::text like s.p and g.data <= s.hoje group by 1) x),
    'participantes', (select coalesce(sum(ev.part), 0) from ev, s where ev.tipo in ('Capacitação','Dia de campo') and ev.data <= s.hoje
              and (coalesce(ev.part, 0) > 0 or exists (select 1 from public.presencas p where p.evento = ev.id))),
    'hoje', (select hoje from s)) as j)
select json_build_object('sql', (select j from conta),
  'tabelas', json_build_object(
    'unidades', (select json_agg(u) from public.unidades u, s where u.id::text like s.p),
    'lotes', (select json_agg(l) from public.lotes l, s where l.id::text like s.p),
    'agricultores', (select json_agg(a) from ag a),
    'distribuicoes', (select json_agg(d) from public.distribuicoes d, s where d.id::text like s.p),
    'visitas', (select json_agg(v) from public.visitas v, s where v.id::text like s.p),
    'eventos', (select json_agg(e) from ev e),
    'presencas', (select json_agg(p) from public.presencas p, s where p.id::text like s.p),
    'entregas', (select json_agg(g) from public.entregas g, s where g.id::text like s.p)));
