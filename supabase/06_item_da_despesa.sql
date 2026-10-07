-- Saberes que Cultivam — 06: item do plano na despesa
-- Para que serve: o Financeiro passa a mostrar, dentro de cada rubrica, quanto de cada item do plano
-- já foi pago e comprometido. Para isso a despesa guarda (opcionalmente) a qual item ela pertence.
-- Pode rodar de novo sem problema: não apaga nem altera nenhum dado. Despesas antigas ficam "sem item".
alter table public.despesas add column if not exists item text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'despesas_item_formato') then
    alter table public.despesas add constraint despesas_item_formato check (item is null or item ~ '^i[0-9]{2}$');
  end if;
end $$;
notify pgrst, 'reload schema';
select 'Coluna "item" criada em despesas. O Financeiro já pode mostrar a execução por item do plano.' as resultado;
