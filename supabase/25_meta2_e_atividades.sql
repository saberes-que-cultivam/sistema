-- =====================================================================
-- Saberes que Cultivam — 25: biofábrica só fica "em funcionamento" com os outros passos da implantação
-- Rode depois do 24. Pode rodar de novo sem medo: não apaga dados.
--
-- Decisão da coordenação (15/10/2026): a Meta 2 conta a unidade de produção que tem os 8 passos marcados.
-- O banco não deixa marcar "Em funcionamento" (nem desmarcar um passo de quem já está em funcionamento) se faltar
-- algum dos outros 7. Cadastro antigo que já estava marcado continua editável; ele só deixa de contar na meta
-- (a conta é feita na tela) até os passos que faltam serem marcados.
-- (A outra decisão do dia — capacitação e dia de campo só contam com participantes — é regra de contagem, na tela.)
-- =====================================================================

create or replace function public.unidade_passos() returns trigger
language plpgsql set search_path = public as $$
declare falta text;
begin
  if not new.funcionando then return new; end if;
  if tg_op = 'UPDATE' and old.funcionando
     and not ((old.local_ok and not new.local_ok) or (old.parceiro_ok and not new.parceiro_ok) or (old.termo and not new.termo)
           or (old.itens_ok and not new.itens_ok) or (old.orcamento and not new.orcamento) or (old.entregue and not new.entregue)
           or (old.montada and not new.montada)) then
    return new;   -- já estava em funcionamento e nenhum passo foi desmarcado agora
  end if;
  falta := concat_ws('; ',
    case when not new.local_ok then 'Local definido' end, case when not new.parceiro_ok then 'Parceiro institucional definido' end,
    case when not new.termo then 'Termo de doação ou cessão formalizado' end, case when not new.itens_ok then 'Lista de itens fechada' end,
    case when not new.orcamento then 'Orçamentos enviados à FUNCERN' end, case when not new.entregue then 'Itens entregues' end,
    case when not new.montada then 'Estrutura montada' end);
  if falta <> '' then
    raise exception 'Só marque “Em funcionamento” depois dos outros passos. Falta: %.', falta using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists b_unidade_passos on public.unidades;
create trigger b_unidade_passos before insert or update on public.unidades for each row execute function public.unidade_passos();

select 'Meta 2: "em funcionamento" só com os outros passos da implantação.' as resultado;
