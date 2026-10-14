-- =====================================================================
-- Saberes que Cultivam — 23: perfis próprios para o auxiliar administrativo e para formador(a); cadastro da equipe
--   no padrão do Mulheres & Quintais (obrigatórios, sem repetição, habilitação na FUNCERN)
-- Rode depois do 22. Pode rodar de novo sem medo: não apaga dados.
--
-- Perfis de acesso (pessoas.perfil):
--   Coordenação     tudo.
--   Equipe          bolsistas discentes: campo, produção, formação (como antes).
--   Auxiliar        auxiliar administrativo: Financeiro completo (lança, altera e exclui despesas; itens das biofábricas),
--                   equipe com os dados reservados (CPF, endereço…) para o cadastro no Arlo da FUNCERN, e marca a
--                   habilitação (Arlo e termo). Não lança dado de campo; vê as unidades produtivas numeradas, como o SEAB/MDA.
--   Formador        formador(a): só a Formação (atividades, lista de presença e fotos das atividades). Não vê dinheiro
--                   nem dado pessoal das unidades produtivas (vê numeradas).
--   Acompanhamento  SEAB/MDA, como antes.
-- Cadastro da equipe (membros):
--   * CPF, celular e e-mail obrigatórios em cadastro novo (os já gravados sem eles continuam valendo até alguém editar esses campos);
--   * CPF e e-mail não se repetem entre quem está na equipe (as vagas por função a tela confere e avisa);
--   * nova coluna termo_em (data em que o termo de compromisso foi assinado na FUNCERN).
-- ATENÇÃO: rodar de novo o 15, o 16 ou o 20 depois deste tira o acesso do auxiliar e do formador: rode do 16 ao último de novo.
-- =====================================================================

alter table public.pessoas drop constraint if exists pessoas_perfil_check;
alter table public.pessoas add constraint pessoas_perfil_check check (perfil in ('Coordenação','Equipe','Acompanhamento','Auxiliar','Formador'));

-- quem trabalha no projeto (qualquer perfil menos o SEAB/MDA)
create or replace function public.sou_do_projeto() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pessoas where auth_id = auth.uid() and ativo and perfil in ('Coordenação','Equipe','Auxiliar','Formador'))
$$;
revoke execute on function public.sou_do_projeto() from anon, public;
grant execute on function public.sou_do_projeto() to authenticated;

-- ---------- Auxiliar administrativo: financeiro e itens ----------
alter policy despesas_ler on public.despesas using ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar');
alter policy despesas_incluir on public.despesas with check ((select public.meu_perfil()) in ('Coordenação','Auxiliar'));
alter policy despesas_alterar on public.despesas using ((select public.meu_perfil()) in ('Coordenação','Auxiliar')) with check ((select public.meu_perfil()) in ('Coordenação','Auxiliar'));
alter policy despesas_excluir on public.despesas using ((select public.meu_perfil()) in ('Coordenação','Auxiliar'));
alter policy itens_ler on public.itens using ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar');
alter policy itens_incluir on public.itens with check ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar');
alter policy itens_alterar on public.itens using ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar') with check ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar');
alter policy itens_excluir on public.itens using ((select public.meu_perfil()) = 'Coordenação' or (((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar') and criado_por = (select public.meu_id())));

-- ---------- Formador(a): atividades, lista de presença e fotos das atividades ----------
alter policy eventos_ler on public.eventos using ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador');
alter policy eventos_incluir on public.eventos with check ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador');
alter policy eventos_alterar on public.eventos using ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador') with check ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador');
alter policy eventos_excluir on public.eventos using ((select public.meu_perfil()) = 'Coordenação' or (((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador') and criado_por = (select public.meu_id())));
alter policy presencas_ler on public.presencas using ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador');
alter policy presencas_incluir on public.presencas with check ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador');
alter policy presencas_alterar on public.presencas using ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador') with check ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador');
alter policy presencas_excluir on public.presencas using ((select public.meu_perfil()) = 'Coordenação' or (((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador') and criado_por = (select public.meu_id())));
-- fotos: o formador só as das atividades (as das visitas mostram as unidades produtivas)
alter policy fotos_ler on public.fotos using ((select public.sou_equipe()) or ((select public.meu_perfil()) = 'Formador' and tabela = 'eventos'));
alter policy fotos_incluir on public.fotos with check ((select public.sou_equipe()) or ((select public.meu_perfil()) = 'Formador' and tabela = 'eventos'));
alter policy fotos_alterar on public.fotos using ((select public.sou_equipe()) or ((select public.meu_perfil()) = 'Formador' and tabela = 'eventos')) with check ((select public.sou_equipe()) or ((select public.meu_perfil()) = 'Formador' and tabela = 'eventos'));
alter policy fotos_excluir on public.fotos using ((select public.meu_perfil()) = 'Coordenação' or (((select public.sou_equipe()) or ((select public.meu_perfil()) = 'Formador' and tabela = 'eventos')) and criado_por = (select public.meu_id())));
drop policy if exists evidencias_ler on storage.objects;
create policy evidencias_ler on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and ((select public.sou_equipe()) or ((select public.meu_perfil()) = 'Formador' and (storage.foldername(name))[1] = 'eventos')));
drop policy if exists evidencias_enviar on storage.objects;
create policy evidencias_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Formador')
              and exists (select 1 from public.fotos f where f.caminho = objects.name and f.criado_por = (select public.meu_id())));

-- ---------- equipe: o auxiliar lê todos (com os reservados, para o Arlo) e marca só a habilitação ----------
alter table public.membros add column if not exists termo_em date;
grant select (termo_em) on public.membros to authenticated;
alter policy membros_ler on public.membros using ((select public.sou_equipe()) or (select public.meu_perfil()) = 'Auxiliar');
alter policy membros_alterar on public.membros using ((select public.meu_perfil()) in ('Coordenação','Auxiliar')) with check ((select public.meu_perfil()) in ('Coordenação','Auxiliar'));
create or replace function public.membros_reservados()
returns table (id uuid, cpf text, pis text, nascimento date, cep text, logradouro text, numero text, complemento text, bairro text, uf text,
               socio boolean, escolaridade text, raca_cor text, renda numeric, pessoas_casa smallint)
language sql stable security definer set search_path = public as $$
  select m.id, m.cpf, m.pis, m.nascimento, m.cep, m.logradouro, m.numero, m.complemento, m.bairro, m.uf,
         m.socio, m.escolaridade, m.raca_cor, m.renda, m.pessoas_casa
    from public.membros m where public.meu_perfil() in ('Coordenação','Auxiliar')
$$;
revoke execute on function public.membros_reservados() from anon, public;
grant execute on function public.membros_reservados() to authenticated;

-- cadastro: obrigatórios, sem repetição, vagas por função; o auxiliar só muda a habilitação
create or replace function public.membros_conferir() returns trigger
language plpgsql security definer set search_path = public as $$
declare ativo_ boolean := new.fim is null or new.fim >= current_date;
begin
  if tg_op = 'UPDATE' and public.meu_perfil() = 'Auxiliar' and coalesce(current_setting('sqc.meus_contatos', true), '') <> '1' then
    if (to_jsonb(new) - 'arlo' - 'termo_em' - 'atualizado_em') is distinct from (to_jsonb(old) - 'arlo' - 'termo_em' - 'atualizado_em') then
      raise exception 'O auxiliar administrativo só marca a habilitação (Arlo e termo). Os outros dados são da coordenação.' using errcode = 'P0001';
    end if;
    return new;
  end if;
  -- obrigatórios: em cadastro novo, ou quando alguém apaga o dado
  if (tg_op = 'INSERT' or old.cpf is not null) and new.cpf is null then raise exception 'Informe o CPF.' using errcode = 'P0001'; end if;
  if (tg_op = 'INSERT' or old.telefone is not null) and nullif(btrim(coalesce(new.telefone, '')), '') is null then raise exception 'Informe o celular com WhatsApp.' using errcode = 'P0001'; end if;
  if (tg_op = 'INSERT' or old.email is not null) and nullif(btrim(coalesce(new.email, '')), '') is null then raise exception 'Informe o e-mail (é o login no sistema).' using errcode = 'P0001'; end if;
  if new.email is not null and btrim(new.email) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Confira o e-mail.' using errcode = 'P0001'; end if;
  if ativo_ then
    perform pg_advisory_xact_lock(hashtext('sqc-membros'));   -- dois cadastros ao mesmo tempo com o mesmo CPF ou e-mail: o segundo espera e é recusado
    if new.cpf is not null and exists (select 1 from public.membros m where m.id <> new.id and m.cpf = new.cpf and (m.fim is null or m.fim >= current_date)) then
      raise exception 'Já existe uma pessoa ativa na equipe com este CPF.' using errcode = 'P0001'; end if;
    if new.email is not null and exists (select 1 from public.membros m where m.id <> new.id and lower(btrim(m.email)) = lower(btrim(new.email)) and (m.fim is null or m.fim >= current_date)) then
      raise exception 'Já existe uma pessoa ativa na equipe com este e-mail.' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
revoke execute on function public.membros_conferir() from anon, authenticated, public;
drop trigger if exists b_membros_conferir on public.membros;
create trigger b_membros_conferir before insert or update on public.membros for each row execute function public.membros_conferir();

-- ---------- funções que valiam só para a equipe e passam a valer para quem trabalha no projeto ----------
create or replace function public.atualizar_meus_contatos(p_telefone text, p_municipio text)
returns integer language plpgsql security definer set search_path = public as $$
declare v_email text; n integer; tel text := nullif(btrim(coalesce(p_telefone, '')), ''); mun text := nullif(btrim(coalesce(p_municipio, '')), '');
begin
  if not public.sou_do_projeto() then raise exception 'Só quem é da equipe do projeto atualiza dados por aqui.' using errcode = 'P0001'; end if;
  select email into v_email from public.pessoas where id = public.meu_id() and coalesce(ativo, true);
  if v_email is null then raise exception 'Seu acesso não foi encontrado. Entre de novo.' using errcode = 'P0001'; end if;
  if tel is not null and (length(tel) > 40 or length(regexp_replace(tel, '\D', '', 'g')) not between 10 and 13) then
    raise exception 'Confira o celular: DDD e número, como (84) 99999-0000.' using errcode = 'P0001'; end if;
  if tel is null then raise exception 'Informe o celular com WhatsApp.' using errcode = 'P0001'; end if;
  if mun is not null and length(mun) > 300 then raise exception 'O município ficou longo demais.' using errcode = 'P0001'; end if;
  select count(*) into n from public.membros where lower(btrim(email)) = lower(btrim(v_email)) and (fim is null or fim >= current_date);
  if n = 0 then raise exception 'Seu cadastro na equipe não está ligado a este e-mail. Peça à coordenação para conferir o e-mail no cadastro.' using errcode = 'P0001'; end if;
  if n > 1 then raise exception 'Há mais de um cadastro ativo na equipe com o seu e-mail. Peça à coordenação para corrigir antes de alterar por aqui.' using errcode = 'P0001'; end if;
  perform set_config('sqc.meus_contatos', '1', true);
  update public.membros set telefone = tel, municipio = mun
   where lower(btrim(email)) = lower(btrim(v_email)) and (fim is null or fim >= current_date);
  return 1;
end $$;
revoke execute on function public.atualizar_meus_contatos(text, text) from anon, public;
grant execute on function public.atualizar_meus_contatos(text, text) to authenticated;

create or replace function public.registrar_download(p_tipo text, p_qtd integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_do_projeto() then return; end if;
  if p_tipo is null or p_tipo !~ '^(json|unidades|itens|lotes|agricultores|distribuicoes|visitas|eventos|entregas|despesas|membros|presencas)$' then
    raise exception 'Tipo de planilha desconhecido.' using errcode = 'P0001'; end if;
  insert into public.auditoria (tabela, registro_id, acao, por, depois)
  values ('planilhas', null, 'PLANILHA', public.meu_id(), jsonb_build_object('tipo', p_tipo, 'qtd', greatest(0, least(coalesce(p_qtd, 0), 1000000))));
end $$;
revoke execute on function public.registrar_download(text, integer) from anon, public;
grant execute on function public.registrar_download(text, integer) to authenticated;

create or replace function public.informar_fila(p_aparelho text, p_quantos integer, p_recusados integer, p_desde timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare eu uuid := public.meu_id();
begin
  if eu is null or not public.sou_do_projeto() then return; end if;
  if p_aparelho is null or length(p_aparelho) not between 8 and 64 then raise exception 'Aparelho inválido.' using errcode = 'P0001'; end if;
  if coalesce(p_quantos, 0) <= 0 then delete from public.fila_celular where pessoa = eu and aparelho = p_aparelho; return; end if;
  perform pg_advisory_xact_lock(hashtext('sqc-fila-' || eu::text));
  if not exists (select 1 from public.fila_celular where pessoa = eu and aparelho = p_aparelho)
     and (select count(*) from public.fila_celular where pessoa = eu) >= 10 then
    raise exception 'Muitos aparelhos informando lançamentos parados para a mesma pessoa.' using errcode = 'P0001';
  end if;
  insert into public.fila_celular (pessoa, aparelho, quantos, recusados, desde, informado_em)
  values (eu, p_aparelho, least(p_quantos, 100000), least(greatest(coalesce(p_recusados, 0), 0), 100000),
          greatest(least(coalesce(p_desde, now()), now()), now() - interval '1 year'), now())
  on conflict (pessoa, aparelho) do update set quantos = excluded.quantos, recusados = excluded.recusados, desde = excluded.desde, informado_em = now();
end $$;
revoke execute on function public.informar_fila(text, integer, integer, timestamptz) from anon, public;
grant execute on function public.informar_fila(text, integer, integer, timestamptz) to authenticated;

notify pgrst, 'reload schema';
select 'Perfis do auxiliar administrativo e de formador(a) ligados; cadastro da equipe com obrigatórios e sem repetição.' as resultado;
