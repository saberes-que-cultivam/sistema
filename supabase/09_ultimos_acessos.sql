-- Saberes que Cultivam — 09: últimos acessos (aba Histórico)
-- Para que serve: a coordenação vê quando cada pessoa cadastrada entrou no sistema pela última vez.
-- Não cria tabela nem guarda nada novo: lê a data do último acesso que o próprio Supabase já registra em cada conta.
-- Quem vê: só a Coordenação (para os outros perfis a função devolve lista vazia).
-- Pode rodar de novo sem problema: não apaga nem altera dados.
create or replace function public.ultimos_acessos()
returns table (id uuid, nome text, perfil text, orgao text, ativo boolean, ultimo timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.perfil, p.orgao, p.ativo, u.last_sign_in_at
    from public.pessoas p left join auth.users u on u.id = p.auth_id
   where public.meu_perfil() = 'Coordenação'
   order by u.last_sign_in_at desc nulls last, p.nome
$$;
revoke execute on function public.ultimos_acessos() from anon, public;
grant execute on function public.ultimos_acessos() to authenticated;
notify pgrst, 'reload schema';
select 'Função de últimos acessos criada. A aba Histórico já pode mostrar quem entrou e quando.' as resultado;
