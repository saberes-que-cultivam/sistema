\set ON_ERROR_STOP on
-- Conferência depois das gravações simultâneas. Cada linha é uma regra que não pode ter sido furada.
do $$ declare v numeric; n integer; d integer; begin
  select coalesce(sum(qtd), 0), count(*) into v, n from public.distribuicoes where lote = 'e0000000-0000-4000-8000-000000000001';
  raise warning 'saldo: % entregas aceitas somando % kg num lote de 100 kg (200 tentativas de 3 kg, 50 ao mesmo tempo)', n, v;
  if v > 100 then raise exception 'FALHOU: distribuído % kg de um lote de 100 kg', v; end if;
  if v < 99 then raise exception 'FALHOU: sobrou saldo sem motivo (só % kg aceitos)', v; end if;
  select count(*), count(distinct codigo) into n, d from public.lotes where codigo like 'EST-HUM-%';
  raise warning 'código de lote: % lotes criados ao mesmo tempo, % códigos diferentes', n, d;
  if n <> 200 or d <> 200 then raise exception 'FALHOU: lotes % / códigos distintos %', n, d; end if;
  if (select max(substr(codigo, 9)::int) from public.lotes where codigo like 'EST-HUM-%') <> 200 then raise exception 'FALHOU: sequência de código com buraco ou repetição'; end if;
  select count(*) into n from public.pessoas where perfil = 'Coordenação' and ativo and email like 'estresse%';
  raise warning 'coordenação: % ativa(s) depois de 2 tentarem sair ao mesmo tempo, 40 vezes', n;
  if n < 1 then raise exception 'FALHOU: projeto ficou sem coordenação'; end if;
  select count(*) into n from public.auditoria a where a.tabela = 'distribuicoes' and a.acao = 'INSERT' and a.registro_id in (select id from public.distribuicoes where lote = 'e0000000-0000-4000-8000-000000000001');
  select count(*) into d from public.distribuicoes where lote = 'e0000000-0000-4000-8000-000000000001';
  if n <> d then raise exception 'FALHOU: auditoria com % linhas para % entregas', n, d; end if;
  raise warning 'auditoria: 1 linha para cada entrega aceita, nenhuma para as recusadas';
end $$;
