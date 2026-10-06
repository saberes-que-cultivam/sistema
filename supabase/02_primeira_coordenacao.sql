-- Saberes que Cultivam — 02: primeiro acesso de coordenação.
-- ANTES DE RODAR: troque o nome e o e-mail abaixo pelos seus (as duas linhas marcadas com <<<).
-- Depois de rodar: abra o sistema, toque em "Primeiro acesso", informe esse e-mail e crie a senha.
-- As outras pessoas você cadastra dentro do sistema (aba Acessos); não precisa voltar aqui.
-- Este arquivo fica no repositório público: NÃO grave o seu e-mail nele, só cole no SQL Editor com o e-mail trocado.
do $$
declare
  v_nome  text := 'NOME DA COORDENAÇÃO';        -- <<< troque
  v_email text := 'email@exemplo.br';           -- <<< troque
begin
  if v_email = 'email@exemplo.br' then
    raise exception 'Troque o nome e o e-mail no começo do arquivo antes de rodar.';
  end if;
  insert into public.pessoas (nome, email, perfil) values (v_nome, lower(v_email), 'Coordenação')
  on conflict (lower(email)) do update set perfil = 'Coordenação', ativo = true;
end $$;
select nome, email, perfil, ativo from public.pessoas order by criado_em;
