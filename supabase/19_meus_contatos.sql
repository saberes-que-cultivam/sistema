-- =====================================================================
-- Saberes que Cultivam — 19: "Meus dados": cada pessoa da equipe atualiza o próprio celular e município
-- Rode depois do 18. Pode rodar de novo sem medo: não apaga dados.
--
-- O cadastro da equipe (membros) só a coordenação grava. Esta função abre uma porta estreita: quem entrou
-- altera SÓ o celular e o município do PRÓPRIO cadastro (o que tem o mesmo e-mail do acesso e está ativo).
-- Nome, função, e-mail, datas e os dados reservados continuam só com a coordenação. A mudança fica no histórico.
-- =====================================================================

create or replace function public.atualizar_meus_contatos(p_telefone text, p_municipio text)
returns integer language plpgsql security definer set search_path = public as $$
declare v_email text; n integer; tel text := nullif(btrim(coalesce(p_telefone, '')), ''); mun text := nullif(btrim(coalesce(p_municipio, '')), '');
begin
  select email into v_email from public.pessoas where id = public.meu_id() and coalesce(ativo, true);
  if v_email is null then raise exception 'Seu acesso não foi encontrado. Entre de novo.' using errcode = 'P0001'; end if;
  if tel is not null and (length(tel) > 40 or length(regexp_replace(tel, '\D', '', 'g')) not between 10 and 13) then
    raise exception 'Confira o celular: DDD e número, como (84) 99999-0000.' using errcode = 'P0001'; end if;
  if mun is not null and length(mun) > 300 then raise exception 'O município ficou longo demais.' using errcode = 'P0001'; end if;
  update public.membros set telefone = tel, municipio = mun
   where lower(btrim(email)) = lower(btrim(v_email)) and (fim is null or fim >= current_date);
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Seu cadastro na equipe não está ligado a este e-mail. Peça à coordenação para conferir o e-mail no cadastro.' using errcode = 'P0001'; end if;
  return n;
end $$;
revoke execute on function public.atualizar_meus_contatos(text, text) from anon, public;
grant execute on function public.atualizar_meus_contatos(text, text) to authenticated;

notify pgrst, 'reload schema';
select '"Meus dados" ligado: cada pessoa da equipe atualiza o próprio celular e município.' as resultado;
