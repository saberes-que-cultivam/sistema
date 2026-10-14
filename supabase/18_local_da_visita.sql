-- =====================================================================
-- Saberes que Cultivam — 18: localização da visita de monitoramento
-- Rode depois do 17. Pode rodar de novo sem medo: não apaga dados.
--
-- No formulário da visita, "Pegar a localização" usa o GPS do celular (funciona sem internet no campo)
-- e grava latitude, longitude e a precisão em metros. A localização mostra onde a família mora ou planta:
-- é dado pessoal. Fica só com a equipe do projeto; a lista que o SEAB/MDA recebe (visitas_anonimas, script 05)
-- tem as colunas escolhidas uma a uma e não inclui estas.
-- =====================================================================

alter table public.visitas add column if not exists lat double precision;
alter table public.visitas add column if not exists lng double precision;
alter table public.visitas add column if not exists precisao integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'visitas_local_valido') then
    alter table public.visitas add constraint visitas_local_valido check (
      (lat is null and lng is null and precisao is null)
      or (lat between -90 and 90 and lng between -180 and 180 and (precisao is null or precisao between 0 and 100000)));
  end if;
end $$;

notify pgrst, 'reload schema';
select 'Localização da visita ligada (só a equipe vê).' as resultado;
