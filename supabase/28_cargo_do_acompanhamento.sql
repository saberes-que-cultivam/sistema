-- =====================================================================
-- Saberes que Cultivam — 28: cargo ou função de quem tem acesso (usado no acompanhamento externo, SEAB/MDA)
-- Rode depois do 27. Pode rodar de novo sem medo: não apaga dados.
-- Opcional. Não se pede CPF de quem só acompanha: o acesso é pelo e-mail e a pessoa não grava nada (LGPD: só o necessário).
-- =====================================================================
alter table public.pessoas add column if not exists cargo text;
alter table public.pessoas drop constraint if exists pessoas_cargo_tamanho;
alter table public.pessoas add constraint pessoas_cargo_tamanho check (cargo is null or length(cargo) <= 120);
notify pgrst, 'reload schema';
select 'Cargo ou função de quem acompanha ligado.' as resultado;
