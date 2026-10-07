-- Saberes que Cultivam — 08: mais dados no cadastro da equipe
-- Para que serve: o cadastro de quem ocupa uma função passa a guardar nome social, matrícula SIAPE (servidor),
-- se recebe outra bolsa, se já tem cadastro no sistema da FUNCERN, a experiência com agricultura familiar
-- e o registro de que a pessoa foi informada sobre o uso dos dados (LGPD).
-- De propósito NÃO entram: CPF, PIS, conta bancária, endereço completo, renda, raça/cor. Quem precisa deles é a FUNCERN.
-- Precisa do 07_equipe.sql já rodado. Pode rodar de novo sem problema: não apaga nem altera dados.
alter table public.membros
  add column if not exists nome_social text,
  add column if not exists siape text,
  add column if not exists outra_bolsa text,
  add column if not exists arlo text,
  add column if not exists experiencia text,
  add column if not exists lgpd boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'membros_dados_formato') then
    alter table public.membros add constraint membros_dados_formato check (
      (nome_social is null or length(nome_social) <= 300) and (siape is null or length(siape) <= 20)
      and (outra_bolsa is null or outra_bolsa in ('Sim','Não')) and (arlo is null or arlo in ('Sim','Não'))
      and (experiencia is null or length(experiencia) <= 300));
  end if;
end $$;
notify pgrst, 'reload schema';
select 'Cadastro da equipe ampliado.' as resultado;
