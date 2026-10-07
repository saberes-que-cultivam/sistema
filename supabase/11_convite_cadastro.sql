-- Saberes que Cultivam — 11: link de cadastro da equipe
-- Para que serve: a coordenação gera um link; a pessoa abre no celular, sem login, preenche os próprios dados
-- e aceita o termo de uso; a coordenação confere e aprova. Só então o cadastro passa a existir.
-- COMO É PROTEGIDO:
--   * o link carrega um código sorteado de 64 letras e números; o banco guarda só o resumo (hash) dele;
--   * vale 7 dias e serve uma vez: depois de preenchido, o mesmo link não grava de novo;
--   * quem está sem login não lê nem grava tabela nenhuma: só fala com as duas funções abaixo, que conferem o código,
--     aceitam apenas os campos do formulário e recusam envio grande demais;
--   * o que a pessoa enviou fica separado, só a Coordenação lê, e é apagado quando o convite é aprovado, recusado ou cancelado.
-- Precisa do 10_equipe_cadastro_completo.sql já rodado. Pode rodar de novo sem problema.
create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  funcao text not null check (funcao in ('coordenacao','auxiliar','discente')),
  token_hash text not null unique,
  status text not null default 'aberto' check (status in ('aberto','preenchido','aprovado','recusado','cancelado')),
  dados jsonb,
  expira_em timestamptz not null,
  preenchido_em timestamptz,
  criado_por uuid, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
alter table public.convites enable row level security;
drop policy if exists convites_ler on public.convites;
create policy convites_ler on public.convites for select to authenticated using (public.meu_perfil() = 'Coordenação');
revoke all on public.convites from anon, authenticated;
grant select (id, funcao, status, dados, expira_em, preenchido_em, criado_em) on public.convites to authenticated;

-- coordenação gera o convite; devolve o código UMA vez (o banco não guarda o código, só o resumo)
create or replace function public.criar_convite(p_funcao text) returns text
language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if public.meu_perfil() is distinct from 'Coordenação' then raise exception 'Só a coordenação gera link de cadastro.' using errcode = 'P0001'; end if;
  if p_funcao not in ('coordenacao','auxiliar','discente') then raise exception 'Função desconhecida.' using errcode = 'P0001'; end if;
  if (select count(*) from public.convites where status = 'aberto' and expira_em > now()) >= 20 then
    raise exception 'Já existem 20 links abertos. Cancele os que não servem mais antes de gerar outro.' using errcode = 'P0001'; end if;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.convites (funcao, token_hash, expira_em, criado_por)
    values (p_funcao, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), now() + interval '7 days', public.meu_id());
  return v_token;
end $$;

-- quem abre o link: o convite existe e ainda pode ser preenchido? (devolve só a função; nada de dados)
create or replace function public.convite_ver(p_token text) returns text
language sql stable security definer set search_path = public as $$
  select c.funcao from public.convites c
   where length(p_token) = 64 and c.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and c.status = 'aberto' and c.expira_em > now()
$$;

-- quem abre o link envia os dados: uma vez só, só campos conhecidos, tamanho limitado
create or replace function public.convite_enviar(p_token text, p_dados jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare v_id uuid; k text; v jsonb; limpo jsonb := '{}'::jsonb;
  permitidos text[] := array['nome','nome_social','cpf','pis','nascimento','telefone','email','cep','logradouro','numero','complemento','bairro','municipio','uf',
    'vinculo','siape','organizacao','experiencia','outra_bolsa','arlo','agricultor','atua_af','zona_rural','celular_internet',
    'socio','escolaridade','raca_cor','renda','pessoas_casa','lgpd'];
begin
  if p_token is null or length(p_token) <> 64 or p_dados is null or jsonb_typeof(p_dados) <> 'object' or octet_length(p_dados::text) > 8000 then
    raise exception 'Não foi possível enviar. Confira o link e tente de novo.' using errcode = 'P0001'; end if;
  select c.id into v_id from public.convites c
   where c.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and c.status = 'aberto' and c.expira_em > now() for update;
  if v_id is null then raise exception 'Este link já foi usado ou venceu. Peça outro à coordenação do projeto.' using errcode = 'P0001'; end if;
  for k, v in select * from jsonb_each(p_dados) loop
    if k = any(permitidos) and jsonb_typeof(v) in ('string','number','boolean') and length(v #>> '{}') <= 300 then limpo := limpo || jsonb_build_object(k, v); end if;
  end loop;
  if length(btrim(coalesce(limpo ->> 'nome', ''))) < 3 then raise exception 'Informe o nome completo.' using errcode = 'P0001'; end if;
  if coalesce(limpo ->> 'lgpd', '') <> 'true' then raise exception 'É preciso aceitar o termo de uso dos dados.' using errcode = 'P0001'; end if;
  update public.convites set dados = limpo, status = 'preenchido', preenchido_em = now(), atualizado_em = now() where id = v_id;
  return 'ok';
end $$;

-- coordenação encerra o convite (aprovado, recusado ou cancelado): o que a pessoa enviou é apagado daqui
create or replace function public.convite_encerrar(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.meu_perfil() is distinct from 'Coordenação' then raise exception 'Só a coordenação encerra convite.' using errcode = 'P0001'; end if;
  if p_status not in ('aprovado','recusado','cancelado') then raise exception 'Situação desconhecida.' using errcode = 'P0001'; end if;
  update public.convites set status = p_status, dados = null, atualizado_em = now() where id = p_id and status in ('aberto','preenchido');
end $$;

revoke execute on function public.criar_convite(text), public.convite_ver(text), public.convite_enviar(text, jsonb), public.convite_encerrar(uuid, text) from public, anon;
grant execute on function public.criar_convite(text), public.convite_encerrar(uuid, text) to authenticated;
grant execute on function public.convite_ver(text), public.convite_enviar(text, jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
select 'Link de cadastro criado.' as resultado;
