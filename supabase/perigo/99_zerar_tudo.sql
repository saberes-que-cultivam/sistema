-- PERIGO — apaga TODOS os registros do projeto (unidades, lotes, agricultores, visitas, atividades, listas de presença,
-- fotos, despesas, contagens dos celulares). Mantém as pessoas com acesso, a equipe e a auditoria.
-- Não tem volta: faça antes a cópia de segurança (ferramentas/backup/LEIA-ME.md, passos 1 e 1b).
-- Os ARQUIVOS das fotos ficam no Storage: depois de rodar, apague-os no painel do Supabase > Storage > evidencias
-- (selecionar tudo > Delete). Senão ficam fotos soltas, que podem mostrar rosto de agricultor.
-- Para rodar de propósito, troque NAO por SIM na linha abaixo.
do $$ begin
  if 'NAO' <> 'SIM' then raise exception 'Nada foi apagado. Para apagar, troque NAO por SIM neste arquivo.'; end if;
  truncate public.fotos, public.presencas, public.distribuicoes, public.visitas, public.itens, public.lotes, public.agricultores,
           public.unidades, public.eventos, public.entregas, public.despesas;
  if to_regclass('public.fila_celular') is not null then execute 'truncate public.fila_celular'; end if;
end $$;
