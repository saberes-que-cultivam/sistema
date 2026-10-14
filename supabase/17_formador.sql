-- =====================================================================
-- Saberes que Cultivam — 17: função "formador(a)" na equipe
-- Rode depois do 16. Pode rodar de novo sem medo: não apaga dados.
--
-- O plano de trabalho universal v4 (07/10/2026) criou a bolsa de formador(a): especialista em bioinsumos e
-- agroecologia que planeja e ministra as capacitações da Meta 3, pago por atividade (80 × R$ 100, nov/2026 a jun/2027).
-- Aqui a equipe e o link de cadastro passam a aceitar essa função.
-- Atenção: o 15 rodado de novo depois deste volta a recusar link de cadastro para formador(a). Se acontecer,
-- rode este de novo (o 00_verificar.sql aponta).
-- =====================================================================

alter table public.membros drop constraint if exists membros_funcao_check;
alter table public.membros add constraint membros_funcao_check check (funcao in ('coordenacao','auxiliar','discente','formador'));
alter table public.convites drop constraint if exists convites_funcao_check;
alter table public.convites add constraint convites_funcao_check check (funcao in ('coordenacao','auxiliar','discente','formador'));

create or replace function public.criar_convite(p_funcao text) returns text
language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if public.meu_perfil() is distinct from 'Coordenação' then raise exception 'Só a coordenação gera link de cadastro.' using errcode = 'P0001'; end if;
  if p_funcao not in ('coordenacao','auxiliar','discente','formador') then raise exception 'Função desconhecida.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('sqc-convite'));
  if (select count(*) from public.convites where status = 'aberto' and expira_em > now()) >= 20 then
    raise exception 'Já existem 20 links abertos. Cancele os que não servem mais antes de gerar outro.' using errcode = 'P0001'; end if;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.convites (funcao, token_hash, expira_em, criado_por)
    values (p_funcao, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), now() + interval '7 days', public.meu_id());
  return v_token;
end $$;
revoke execute on function public.criar_convite(text) from public, anon;
grant execute on function public.criar_convite(text) to authenticated;

notify pgrst, 'reload schema';
select 'Função formador(a) ligada: dá para cadastrar e gerar link de cadastro para ela.' as resultado;
