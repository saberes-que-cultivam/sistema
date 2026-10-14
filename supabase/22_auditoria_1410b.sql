-- =====================================================================
-- Saberes que Cultivam — 22: correções da auditoria formal (14/10/2026)
-- Rode depois do 21. Pode rodar de novo sem medo: não apaga dados.
--   1) visita de monitoramento não pode ter data no futuro (mesma regra da distribuição: até amanhã, por causa do fuso).
--      Antes, uma visita "marcada" para o mês que vem já contava como unidade produtiva acompanhada (Meta 4)
--      e entrava no indicador de gasto da Meta 5. Vale só para visita nova ou para quem troca a data.
--   2) histórico (auditoria): a regra de leitura passa a ser calculada inteira uma vez por consulta.
--      Mesmo resultado; o banco volta a usar o índice por data (antes lia a tabela inteira para mostrar 200 linhas).
-- =====================================================================

-- 1) visita no futuro
create or replace function public.visita_data_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT' or new.data is distinct from old.data) and new.data > current_date + 1 then
    raise exception 'A data da visita está no futuro. Registre a visita depois de feita.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public.visita_data_antes() from anon, authenticated, public;
drop trigger if exists b_visita_data on public.visitas;
create trigger b_visita_data before insert or update of data on public.visitas
  for each row execute function public.visita_data_antes();

-- 2) leitura do histórico
alter policy auditoria_ler on public.auditoria using ((select public.meu_perfil() = 'Coordenação'));

notify pgrst, 'reload schema';
select 'Correções da auditoria de 14/10 aplicadas (visita no futuro e leitura do histórico).' as resultado;
