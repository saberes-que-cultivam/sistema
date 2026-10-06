-- =====================================================================
-- Saberes que Cultivam — 05: perfil de acompanhamento (SEAB/MDA)
-- Rode depois do 04. Pode rodar de novo sem medo: não apaga dados.
--
-- Terceiro perfil, "Acompanhamento": para quem acompanha o projeto de fora (SEAB/MDA).
--   * VÊ, em tempo real: painel, biofábricas e itens, lotes, distribuição, atividades,
--     entregas do plano, despesas e relatórios.
--   * NÃO VÊ: nome, comunidade nem qualquer dado pessoal de agricultor ou agricultora;
--     texto livre das visitas; e-mail das pessoas da equipe; histórico de alterações.
--     As unidades produtivas aparecem numeradas ("Unidade produtiva 07"), só com o que
--     entra nas contas (município, datas, kit, gasto mensal).
--   * NÃO GRAVA nada.
-- Quem cadastra é a coordenação, na aba Dados > Pessoas com acesso.
-- =====================================================================

alter table public.pessoas drop constraint if exists pessoas_perfil_check;
alter table public.pessoas add constraint pessoas_perfil_check check (perfil in ('Coordenação','Equipe','Acompanhamento'));
alter table public.pessoas add column if not exists orgao text check (orgao is null or length(orgao) <= 120);

-- é da equipe do projeto (coordenação ou equipe)?
create or replace function public.sou_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pessoas where auth_id = auth.uid() and ativo and perfil in ('Coordenação','Equipe'))
$$;
revoke execute on function public.sou_equipe() from anon, public;
grant execute on function public.sou_equipe() to authenticated;

do $$
declare t text;
begin
  -- gravar e excluir: só equipe do projeto (antes bastava ser pessoa ativa)
  foreach t in array array['unidades','itens','lotes','agricultores','distribuicoes','visitas','eventos','entregas'] loop
    execute format('drop policy if exists %I on public.%I', t || '_incluir', t);
    execute format('drop policy if exists %I on public.%I', t || '_alterar', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.sou_equipe())', t || '_incluir', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.sou_equipe()) with check (public.sou_equipe())', t || '_alterar', t);
    execute format('drop policy if exists %I on public.%I', t || '_excluir', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.meu_perfil() = ''Coordenação'' or (public.sou_equipe() and criado_por = public.meu_id()))', t || '_excluir', t);
  end loop;
  -- ler dado pessoal e texto livre de visita: só equipe do projeto
  foreach t in array array['agricultores','visitas'] loop
    execute format('drop policy if exists %I on public.%I', t || '_ler', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.sou_equipe())', t || '_ler', t);
  end loop;
end $$;
-- pessoas: a equipe vê todo mundo; quem acompanha vê só o próprio cadastro
drop policy if exists pessoas_ler on public.pessoas;
create policy pessoas_ler on public.pessoas for select to authenticated using (public.sou_equipe() or auth_id = auth.uid());

-- unidades produtivas sem dado pessoal, numeradas pela ordem de cadastro
create or replace function public.agricultores_anonimos()
returns table (id uuid, nome text, municipio text, uf text, territorio text, unidade uuid, area numeric, diag date, quimico text, gasto0 numeric, kit boolean, kitdata date, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, 'Unidade produtiva ' || lpad((row_number() over (order by a.criado_em, a.id))::text, 2, '0'),
         a.municipio, a.uf, a.territorio, a.unidade, a.area, a.diag, a.quimico, a.gasto0, a.kit, a.kitdata, a.criado_em
    from public.agricultores a
   where public.meu_id() is not null
$$;
-- visitas sem texto livre (pode citar nomes) e sem quem visitou
create or replace function public.visitas_anonimas()
returns table (id uuid, data date, agricultor uuid, usou text, vigor smallint, gasto numeric, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select v.id, v.data, v.agricultor, v.usou, v.vigor, v.gasto, v.criado_em from public.visitas v where public.meu_id() is not null
$$;
revoke execute on function public.agricultores_anonimos(), public.visitas_anonimas() from anon, public;
grant execute on function public.agricultores_anonimos(), public.visitas_anonimas() to authenticated;

select 'Perfil de acompanhamento criado. Cadastre a pessoa da SEAB/MDA em Dados > Pessoas com acesso.' as resultado;
