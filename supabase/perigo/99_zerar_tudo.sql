-- PERIGO — apaga TODOS os registros do projeto (unidades, lotes, agricultores, visitas, despesas...).
-- Mantém as pessoas com acesso e a auditoria. Não tem volta: baixe a cópia de segurança antes (aba Dados).
-- Para rodar de propósito, troque NAO por SIM na linha abaixo.
do $$ begin
  if 'NAO' <> 'SIM' then raise exception 'Nada foi apagado. Para apagar, troque NAO por SIM neste arquivo.'; end if;
  truncate public.distribuicoes, public.visitas, public.itens, public.lotes, public.agricultores, public.unidades, public.eventos, public.entregas, public.despesas;
end $$;
