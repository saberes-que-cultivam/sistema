-- =====================================================================
-- Saberes que Cultivam — 26: data em que a biofábrica entrou em funcionamento
-- Rode depois do 25. Pode rodar de novo sem medo: não apaga dados.
--
-- Decisão da coordenação (15/10/2026): a Meta 2 passa a saber QUANDO cada unidade começou a funcionar, para o
-- relatório de um período passado contar só o que já funcionava naquele período.
--   * ao marcar "Em funcionamento" é obrigatório informar a data (não pode ser no futuro);
--   * desmarcou "Em funcionamento": a data é apagada;
--   * cadastro antigo, marcado antes deste script, continua editável sem data (a tela pede para completar).
-- =====================================================================

alter table public.unidades add column if not exists funcionando_em date;

create or replace function public.unidade_data_funcionamento() returns trigger
language plpgsql set search_path = public as $$
begin
  if not new.funcionando then new.funcionando_em := null; return new; end if;
  if new.funcionando_em is not null and new.funcionando_em > current_date + 1 then
    raise exception 'A data em que a unidade começou a funcionar não pode ser no futuro.' using errcode = 'P0001';
  end if;
  if new.funcionando_em is null and (tg_op = 'INSERT' or not old.funcionando) then
    raise exception 'Informe a data em que a unidade começou a funcionar.' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists b_unidade_data on public.unidades;
create trigger b_unidade_data before insert or update on public.unidades for each row execute function public.unidade_data_funcionamento();

notify pgrst, 'reload schema';
select 'Meta 2: data de entrada em funcionamento ligada.' as resultado;
