-- Saberes que Cultivam — 07: equipe do projeto (coordenação, auxiliar administrativo e bolsistas discentes)
-- Para que serve: a aba Equipe passa a ter cadastro. A coordenação registra quem ocupa cada função, desde quando,
-- e a data do desligamento quando a pessoa sai (o registro fica como histórico).
-- Quem vê: só a equipe do projeto. O perfil de acompanhamento (SEAB/MDA) não lê esta tabela.
-- Quem grava e exclui: só a Coordenação.
-- Precisa do 05_acompanhamento.sql já rodado. Pode rodar de novo sem problema: não apaga nem altera dados.
create table if not exists public.membros (
  id uuid primary key default gen_random_uuid(),
  funcao text not null check (funcao in ('coordenacao','auxiliar','discente')),
  nome text not null check (length(btrim(nome)) > 0 and length(nome) <= 300),
  vinculo text check (vinculo is null or length(vinculo) <= 300),
  email text check (email is null or length(email) <= 300),
  telefone text check (telefone is null or length(telefone) <= 40),
  municipio text check (municipio is null or length(municipio) <= 300),
  inicio date not null,
  fim date,
  motivo text check (motivo is null or length(motivo) <= 300),
  obs text check (obs is null or length(obs) <= 4000),
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  constraint membros_periodo check (fim is null or fim >= inicio)
);
drop trigger if exists a_carimbar on public.membros;
create trigger a_carimbar before insert or update on public.membros for each row execute function public.carimbar();
drop trigger if exists z_auditoria on public.membros;
create trigger z_auditoria after insert or update or delete on public.membros for each row execute function public.auditar();
alter table public.membros enable row level security;
drop policy if exists membros_ler on public.membros;
drop policy if exists membros_incluir on public.membros;
drop policy if exists membros_alterar on public.membros;
drop policy if exists membros_excluir on public.membros;
create policy membros_ler on public.membros for select to authenticated using (public.sou_equipe());
create policy membros_incluir on public.membros for insert to authenticated with check (public.meu_perfil() = 'Coordenação');
create policy membros_alterar on public.membros for update to authenticated using (public.meu_perfil() = 'Coordenação') with check (public.meu_perfil() = 'Coordenação');
create policy membros_excluir on public.membros for delete to authenticated using (public.meu_perfil() = 'Coordenação');
revoke all on public.membros from anon, authenticated;
grant select, insert, update, delete on public.membros to authenticated;
notify pgrst, 'reload schema';
select 'Tabela "membros" criada. A coordenação já pode cadastrar a equipe na aba Equipe.' as resultado;
