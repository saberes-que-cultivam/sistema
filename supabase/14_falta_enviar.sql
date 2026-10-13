-- =====================================================================
-- Saberes que Cultivam — 14: "falta enviar" de cada celular (trazido do Mulheres & Quintais, script 58)
-- Rode depois do 13. Pode rodar de novo sem medo: não apaga dados.
--
-- Lançamento feito sem internet fica guardado no celular até o sinal voltar. Se o celular de alguém fica dias
-- sem sinal (ou com um registro recusado parado), ninguém sabia. Agora, quando tem internet, cada aparelho
-- informa só a CONTAGEM do que guarda sem enviar: quantos, desde quando e quantos o servidor recusou.
-- Nunca o conteúdo. A coordenação vê na Visão geral, com destaque para o que está parado há mais de 2 dias.
-- Ninguém lê nem grava a tabela direto: só pelas duas funções abaixo.
-- =====================================================================

create table if not exists public.fila_celular (
  pessoa uuid not null references public.pessoas(id) on delete cascade,
  aparelho text not null check (length(aparelho) between 8 and 64),
  quantos integer not null check (quantos between 0 and 100000),
  recusados integer not null default 0 check (recusados between 0 and 100000),
  desde timestamptz,
  informado_em timestamptz not null default now(),
  primary key (pessoa, aparelho)
);
alter table public.fila_celular enable row level security;   -- sem política: só as funções leem e gravam
revoke all on public.fila_celular from anon, authenticated;

-- o aparelho informa a própria contagem; zero apaga a linha (nada parado)
create or replace function public.informar_fila(p_aparelho text, p_quantos integer, p_recusados integer, p_desde timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare eu uuid := public.meu_id();
begin
  if eu is null or not public.sou_equipe() then return; end if;
  if p_aparelho is null or length(p_aparelho) not between 8 and 64 then raise exception 'Aparelho inválido.' using errcode = 'P0001'; end if;
  if coalesce(p_quantos, 0) <= 0 then delete from public.fila_celular where pessoa = eu and aparelho = p_aparelho; return; end if;
  insert into public.fila_celular (pessoa, aparelho, quantos, recusados, desde, informado_em)
  values (eu, p_aparelho, least(p_quantos, 100000), least(greatest(coalesce(p_recusados, 0), 0), 100000), least(coalesce(p_desde, now()), now()), now())
  on conflict (pessoa, aparelho) do update set quantos = excluded.quantos, recusados = excluded.recusados, desde = excluded.desde, informado_em = now();
end $$;

-- só a coordenação vê a lista (nome de quem tem registro parado, quantos e desde quando)
create or replace function public.listar_fila_celular()
returns table (pessoa uuid, nome text, quantos integer, recusados integer, desde timestamptz, informado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select f.pessoa, p.nome, sum(f.quantos)::integer, sum(f.recusados)::integer, min(f.desde), max(f.informado_em)
    from public.fila_celular f join public.pessoas p on p.id = f.pessoa
   where public.meu_perfil() = 'Coordenação' and f.quantos > 0
   group by f.pessoa, p.nome
   order by min(f.desde)
$$;

revoke execute on function public.informar_fila(text, integer, integer, timestamptz), public.listar_fila_celular() from anon, public;
grant execute on function public.informar_fila(text, integer, integer, timestamptz), public.listar_fila_celular() to authenticated;
notify pgrst, 'reload schema';
select '"Falta enviar" ligado: a coordenação vê na Visão geral quem tem lançamento parado no celular.' as resultado;
