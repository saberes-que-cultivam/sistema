-- =====================================================================
-- Saberes que Cultivam — 12: e-mail corrigido de volta não tranca mais a pessoa
-- Rode depois do 11. Pode rodar de novo sem medo: não apaga dados.
--
-- O 04 bloqueia a conta de login antiga quando a coordenação troca o e-mail de alguém
-- (para a conta antiga não se ligar a outra pessoa que venha a usar aquele e-mail).
-- Efeito colateral: se o e-mail foi trocado por engano e depois corrigido de volta,
-- a própria pessoa ficava trancada para sempre.
-- Agora o bloqueio guarda de qual cadastro a conta era: ela continua recusada para
-- qualquer outro cadastro, mas volta a valer para o cadastro de onde saiu.
-- (Bloqueios gravados antes deste script não sabem de quem eram e continuam valendo para todos.)
-- =====================================================================

alter table public.contas_bloqueadas add column if not exists pessoa uuid;

create or replace function public.vincular_conta() returns public.pessoas
language plpgsql security definer set search_path = public as $$
declare r public.pessoas; alvo uuid;
begin
  select id into alvo from public.pessoas
   where lower(email) = lower(auth.jwt() ->> 'email') and ativo
     and (auth_id is null or auth_id = auth.uid())
   limit 1;
  if exists (select 1 from public.contas_bloqueadas b
              where b.auth_id = auth.uid() and (b.pessoa is null or b.pessoa is distinct from alvo)) then
    return r;
  end if;
  perform set_config('sqc.vinculando', '1', true);
  update public.pessoas set auth_id = auth.uid()
   where id = alvo
  returning * into r;
  perform set_config('sqc.vinculando', '', true);
  return r;
end $$;

create or replace function public.pessoas_antes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(trim(new.email)); new.nome := trim(new.nome);
  if tg_op = 'UPDATE' then
    if coalesce(current_setting('sqc.vinculando', true), '') <> '1' then new.auth_id := old.auth_id; end if;
    if old.perfil = 'Coordenação' and old.ativo then
      -- uma alteração de coordenação por vez: duas ao mesmo tempo podiam deixar o projeto sem ninguém
      perform pg_advisory_xact_lock(hashtext('sqc-coordenacao'));
      if (not (new.perfil = 'Coordenação' and new.ativo) or new.email <> old.email)
         and not exists (select 1 from public.pessoas where id <> old.id and perfil = 'Coordenação' and ativo) then
        raise exception 'É preciso manter pelo menos um acesso de coordenação ativo. Cadastre outra coordenação antes de mudar este.' using errcode = 'P0001';
      end if;
    end if;
    -- trocou o e-mail: a conta antiga deixa de valer para qualquer outro cadastro; a pessoa faz o primeiro acesso de novo com o e-mail novo
    if new.email <> old.email then
      if old.auth_id is not null then
        insert into public.contas_bloqueadas (auth_id, motivo, pessoa) values (old.auth_id, 'e-mail trocado no cadastro', old.id)
        on conflict (auth_id) do update set pessoa = coalesce(public.contas_bloqueadas.pessoa, excluded.pessoa);
      end if;
      new.auth_id := null;
    end if;
  end if;
  return new;
end $$;

revoke execute on function public.vincular_conta() from anon, public;
grant execute on function public.vincular_conta() to authenticated;
