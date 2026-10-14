-- =====================================================================
-- Saberes que Cultivam — 20: correções da auditoria de 14/10/2026
-- Rode depois do 19. Pode rodar de novo sem medo: não apaga dados.
--
-- 1) "Meus dados" (19): só quem é da equipe usa; e, se dois cadastros ativos tiverem o mesmo e-mail, não muda nenhum
--    (antes mudava os dois) e pede à coordenação para corrigir o e-mail duplicado.
-- 2) Foto: um caminho de arquivo que ainda existe na pasta "evidencias" não pode ser "adotado" por outra linha.
--    Antes, apagar só a linha da foto deixava o arquivo, e um colega podia criar uma linha nova com o mesmo caminho
--    e passar a ser o "dono" do arquivo (podia apagá-lo ou mostrá-lo como seu).
-- 3) Itens das biofábricas: o SEAB/MDA não recebe mais valor nem rubrica (a parte financeira fica com a gestão).
--    A equipe lê a tabela; o SEAB/MDA lê pela função itens_acompanhamento(), sem esses dois campos.
-- Atenção: rodar o 15 de novo depois deste reabre os itens ao SEAB/MDA, e rodar o 13 ou o 15 volta a regra antiga
-- da foto. Se acontecer, rode este de novo (o 00_verificar.sql aponta).
-- =====================================================================

-- 1) meus dados
create or replace function public.atualizar_meus_contatos(p_telefone text, p_municipio text)
returns integer language plpgsql security definer set search_path = public as $$
declare v_email text; n integer; tel text := nullif(btrim(coalesce(p_telefone, '')), ''); mun text := nullif(btrim(coalesce(p_municipio, '')), '');
begin
  if not public.sou_equipe() then raise exception 'Só quem é da equipe do projeto atualiza dados por aqui.' using errcode = 'P0001'; end if;
  select email into v_email from public.pessoas where id = public.meu_id() and coalesce(ativo, true);
  if v_email is null then raise exception 'Seu acesso não foi encontrado. Entre de novo.' using errcode = 'P0001'; end if;
  if tel is not null and (length(tel) > 40 or length(regexp_replace(tel, '\D', '', 'g')) not between 10 and 13) then
    raise exception 'Confira o celular: DDD e número, como (84) 99999-0000.' using errcode = 'P0001'; end if;
  if mun is not null and length(mun) > 300 then raise exception 'O município ficou longo demais.' using errcode = 'P0001'; end if;
  select count(*) into n from public.membros where lower(btrim(email)) = lower(btrim(v_email)) and (fim is null or fim >= current_date);
  if n = 0 then raise exception 'Seu cadastro na equipe não está ligado a este e-mail. Peça à coordenação para conferir o e-mail no cadastro.' using errcode = 'P0001'; end if;
  if n > 1 then raise exception 'Há mais de um cadastro ativo na equipe com o seu e-mail. Peça à coordenação para corrigir antes de alterar por aqui.' using errcode = 'P0001'; end if;
  update public.membros set telefone = tel, municipio = mun
   where lower(btrim(email)) = lower(btrim(v_email)) and (fim is null or fim >= current_date);
  return 1;
end $$;
revoke execute on function public.atualizar_meus_contatos(text, text) from anon, public;
grant execute on function public.atualizar_meus_contatos(text, text) to authenticated;

-- 2) foto: o mesmo corpo do 15 (trava do registro-pai) e a nova regra do caminho
create or replace function public.fotos_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.tabela <> old.tabela or new.registro <> old.registro or new.caminho <> old.caminho) then
    raise exception 'A foto não muda de atividade nem de visita depois de enviada. Exclua e envie de novo.' using errcode = 'P0001';
  end if;
  -- caminho com arquivo ainda na pasta: pertence a quem enviou; não se "adota" (auditoria de 14/10)
  if tg_op = 'INSERT' and exists (select 1 from storage.objects where bucket_id = 'evidencias' and name = new.caminho) then
    raise exception 'Já existe um arquivo com este nome na pasta de fotos. Envie a foto de novo.' using errcode = 'P0001';
  end if;
  -- trava o registro-pai como faria uma chave estrangeira: uma exclusão ao mesmo tempo espera esta gravação terminar
  if new.tabela = 'eventos' then perform 1 from public.eventos where id = new.registro for key share;
  else perform 1 from public.visitas where id = new.registro for key share; end if;
  if not found then
    raise exception 'A atividade ou visita desta foto não existe mais.' using errcode = '23503';
  end if;
  return new;
end $$;
revoke execute on function public.fotos_antes() from anon, authenticated, public;

-- 3) itens: a equipe lê; o SEAB/MDA lê pela função, sem valor e sem rubrica
alter policy itens_ler on public.itens using ((select public.sou_equipe()));
create or replace function public.itens_acompanhamento()
returns table (id uuid, unidade uuid, descricao text, status text, data date, criado_em timestamptz, atualizado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, i.unidade, i.descricao, i.status, i.data, i.criado_em, i.atualizado_em
    from public.itens i
   where public.meu_id() is not null
   order by i.criado_em, i.id
$$;
revoke execute on function public.itens_acompanhamento() from anon, public;
grant execute on function public.itens_acompanhamento() to authenticated;

notify pgrst, 'reload schema';
select 'Correções da auditoria de 14/10 aplicadas (meus dados, foto, itens sem valor para o SEAB/MDA).' as resultado;
