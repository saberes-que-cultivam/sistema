-- =====================================================================
-- Saberes que Cultivam — 29: correções da auditoria das versões 85 a 89 (15/10/2026)
-- Rode depois do 28. Pode rodar de novo sem medo: não apaga dados.
--
-- 1) Documento das entregas: qualquer bolsista podia apagar, pela API, o documento ligado a uma entrega de outra pessoa
--    (a entrega ficava apontando para um arquivo que não existe mais). Agora só se apaga arquivo que NÃO está ligado a
--    nenhuma entrega (o que sobrou de uma troca, de um envio que falhou ou de uma entrega excluída); a coordenação apaga qualquer um.
-- 2) Data de funcionamento da biofábrica: depois de informada, não pode ser apagada enquanto a unidade estiver em funcionamento
--    (sem ela, o relatório de um período passado voltaria a contar a unidade como se sempre tivesse funcionado).
--    Cadastro antigo que nunca teve data continua editável sem ela (a tela avisa).
-- 3) Substituta: uma pessoa não pode estar registrada como substituta de si mesma.
-- =====================================================================

-- ---------- 1) apagar documento ----------
drop policy if exists documentos_excluir on storage.objects;
create policy documentos_excluir on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (select public.sou_equipe())
         and ((select public.meu_perfil()) = 'Coordenação'
              or not exists (select 1 from public.entregas e where e.arquivo = objects.name)));

-- ---------- 2) data de funcionamento não some depois de informada ----------
create or replace function public.unidade_data_funcionamento() returns trigger
language plpgsql set search_path = public as $$
begin
  if not new.funcionando then new.funcionando_em := null; return new; end if;
  if new.funcionando_em is not null and new.funcionando_em > current_date + 1 then   -- +1: folga de fuso (o servidor está em UTC)
    raise exception 'A data em que a unidade começou a funcionar não pode ser no futuro.' using errcode = 'P0001';
  end if;
  if new.funcionando_em is null and (tg_op = 'INSERT' or not old.funcionando or old.funcionando_em is not null) then
    raise exception 'Informe a data em que a unidade começou a funcionar.' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- ---------- 3) substituta de si mesma ----------
update public.membros set substitui = null where substitui = id;
alter table public.membros drop constraint if exists membros_substitui_outra;
alter table public.membros add constraint membros_substitui_outra check (substitui is null or substitui <> id);

notify pgrst, 'reload schema';
select 'Correções de 15/10 (documentos, data de funcionamento, substituta) ligadas.' as resultado;
