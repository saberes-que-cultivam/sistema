-- Saberes que Cultivam — 10: cadastro completo da equipe
-- Para que serve: o cadastro de quem ocupa uma função passa a ter CPF, PIS, data de nascimento, endereço,
-- questionário socioeconômico (opcional), organização e perfil no campo.
-- PROTEÇÃO: os dados reservados (CPF, PIS, nascimento, endereço, escolaridade, raça/cor, renda, pessoas na casa)
-- só chegam à Coordenação. O perfil Equipe continua vendo nome, contato e função dos colegas, e mais nada;
-- o perfil de acompanhamento (SEAB/MDA) continua sem ver a equipe. O corte é feito aqui no banco, coluna por coluna.
-- Precisa do 08_equipe_dados.sql já rodado. Pode rodar de novo sem problema: não apaga nem altera dados.
alter table public.membros
  add column if not exists cpf text, add column if not exists pis text, add column if not exists nascimento date,
  add column if not exists cep text, add column if not exists logradouro text, add column if not exists numero text,
  add column if not exists complemento text, add column if not exists bairro text, add column if not exists uf text,
  add column if not exists socio boolean not null default false,
  add column if not exists escolaridade text, add column if not exists raca_cor text,
  add column if not exists renda numeric(12,2), add column if not exists pessoas_casa smallint,
  add column if not exists organizacao text,
  add column if not exists agricultor text, add column if not exists atua_af text,
  add column if not exists zona_rural text, add column if not exists celular_internet text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'membros_cadastro_formato') then
    alter table public.membros add constraint membros_cadastro_formato check (
      (cpf is null or cpf ~ '^[0-9]{11}$') and (pis is null or pis ~ '^[0-9]{11}$') and (cep is null or cep ~ '^[0-9]{8}$')
      and (nascimento is null or (nascimento > date '1900-01-01' and nascimento < inicio))
      and (uf is null or uf ~ '^[A-Z]{2}$')
      and (logradouro is null or length(logradouro) <= 300) and (numero is null or length(numero) <= 20)
      and (complemento is null or length(complemento) <= 300) and (bairro is null or length(bairro) <= 300)
      and (escolaridade is null or length(escolaridade) <= 100) and (raca_cor is null or length(raca_cor) <= 100)
      and (renda is null or renda >= 0) and (pessoas_casa is null or pessoas_casa between 1 and 40)
      and (organizacao is null or length(organizacao) <= 300)
      and (agricultor is null or agricultor in ('Sim','Não')) and (atua_af is null or atua_af in ('Sim','Não'))
      and (zona_rural is null or zona_rural in ('Sim','Não')) and (celular_internet is null or celular_internet in ('Sim','Não')));
  end if;
end $$;

-- leitura coluna por coluna: quem não é da coordenação nunca recebe os dados reservados, nem pedindo direto ao banco
revoke select on public.membros from authenticated;
grant select (id, funcao, nome, nome_social, vinculo, siape, email, telefone, municipio, outra_bolsa, arlo, experiencia, lgpd,
              inicio, fim, motivo, obs, organizacao, agricultor, atua_af, zona_rural, celular_internet,
              criado_por, criado_em, atualizado_em) on public.membros to authenticated;

-- os dados reservados saem só por esta função, e só para a Coordenação
create or replace function public.membros_reservados()
returns table (id uuid, cpf text, pis text, nascimento date, cep text, logradouro text, numero text, complemento text, bairro text, uf text,
               socio boolean, escolaridade text, raca_cor text, renda numeric, pessoas_casa smallint)
language sql stable security definer set search_path = public as $$
  select m.id, m.cpf, m.pis, m.nascimento, m.cep, m.logradouro, m.numero, m.complemento, m.bairro, m.uf,
         m.socio, m.escolaridade, m.raca_cor, m.renda, m.pessoas_casa
    from public.membros m where public.meu_perfil() = 'Coordenação'
$$;
revoke execute on function public.membros_reservados() from anon, public;
grant execute on function public.membros_reservados() to authenticated;
notify pgrst, 'reload schema';
select 'Cadastro completo da equipe criado. Dados reservados: só a Coordenação lê.' as resultado;
