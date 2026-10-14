-- =====================================================================
-- Saberes que Cultivam — 21: o histórico registra quem baixou planilha ou cópia dos dados
-- Rode depois do 20. Pode rodar de novo sem medo: não apaga dados.
--
-- Trazido do Mulheres & Quintais (aba Histórico): baixar a planilha de unidades produtivas (que tem dados pessoais)
-- ou a cópia completa dos dados fica no histórico, com quem, quando e quantas linhas. Só a coordenação lê o histórico.
-- Ninguém grava na tabela auditoria direto: só por esta função, que aceita apenas os tipos conhecidos.
-- =====================================================================

create or replace function public.registrar_download(p_tipo text, p_qtd integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_equipe() then return; end if;
  if p_tipo is null or p_tipo !~ '^(json|unidades|itens|lotes|agricultores|distribuicoes|visitas|eventos|entregas|despesas|membros|presencas)$' then
    raise exception 'Tipo de planilha desconhecido.' using errcode = 'P0001'; end if;
  insert into public.auditoria (tabela, registro_id, acao, por, depois)
  values ('planilhas', null, 'PLANILHA', public.meu_id(), jsonb_build_object('tipo', p_tipo, 'qtd', greatest(0, least(coalesce(p_qtd, 0), 1000000))));
end $$;
revoke execute on function public.registrar_download(text, integer) from anon, public;
grant execute on function public.registrar_download(text, integer) to authenticated;

notify pgrst, 'reload schema';
select 'O histórico passa a registrar quem baixou planilha ou cópia dos dados.' as resultado;
