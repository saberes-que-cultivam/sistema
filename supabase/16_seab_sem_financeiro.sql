-- =====================================================================
-- Saberes que Cultivam — 16: o acompanhamento (SEAB/MDA) não lê as despesas
-- Rode depois do 15. Pode rodar de novo sem medo: não apaga dados.
--
-- Decisão de 14/10/2026: a parte financeira fica com a gestão do projeto. O SEAB/MDA continua vendo
-- a execução física (metas, biofábricas, lotes, distribuição, formação), mas não as despesas:
-- valor, rubrica, descrição e o nome de quem recebeu cada pagamento (dado pessoal de bolsistas).
-- A tela também já não mostra Financeiro, Relatórios nem Dados a esse perfil; aqui é o banco que garante.
-- Atenção: o 15 rodado de novo depois deste reabre as despesas ao SEAB/MDA. Se acontecer, rode este de novo
-- (o 00_verificar.sql aponta).
-- =====================================================================

alter policy despesas_ler on public.despesas using ((select public.sou_equipe()));

notify pgrst, 'reload schema';
select 'Despesas fechadas para o acompanhamento (SEAB/MDA): só a equipe do projeto lê.' as resultado;
