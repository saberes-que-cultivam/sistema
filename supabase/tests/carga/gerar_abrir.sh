#!/usr/bin/env bash
# Gera os scripts pgbench de "abrir o sistema" (o que api-supabase.js carregar() pede) com o número de páginas de 1.000
# de cada tabela no momento — as tabelas crescem durante a carga, então rodar.sh chama isto antes de cada cenário.
# Cada pedido é uma transação como o PostgREST faz: claims do JWT (local), "set local role authenticated", a consulta em JSON.
# Uso: gerar_abrir.sh PASTA_DE_TRABALHO   (precisa do env gerado por preparar.sh)
set -euo pipefail
W="$1"; . "$W/env"
TABELAS="unidades itens lotes agricultores distribuicoes visitas eventos entregas despesas pessoas membros presencas fotos"
# membros: só as colunas abertas (as reservadas não têm grant de select; a coordenação recebe por membros_reservados())
MEMBROS="id,criado_por,criado_em,atualizado_em,funcao,nome,nome_social,vinculo,siape,email,telefone,municipio,outra_bolsa,arlo,experiencia,lgpd,organizacao,agricultor,atua_af,zona_rural,celular_internet,inicio,fim,motivo,obs"
paginas() { psql -X -At -c "select greatest(1, ceil((count(*) + 1) / 1000.0))::int from public.$1"; }
req() {   # $1 = e-mail (expressão SQL), $2 = consulta
  printf 'BEGIN;\nselect set_config('"'"'request.jwt.claim.sub'"'"', '"'"'b0000000-0000-4000-8000-'"'"' || lpad(:u::text, 12, '"'"'0'"'"'), true), set_config('"'"'request.jwt.claim.email'"'"', %s, true);\nset local role authenticated;\n%s;\nCOMMIT;\n' "$1" "$2"
}
tabela() {   # todas(): páginas de 1.000 por criado_em, id (o range() do supabase-js vira limit/offset)
  local t="$1" cols='*'; [ "$t" = membros ] && cols="$MEMBROS"
  local n; n=$(paginas "$t")
  for p in $(seq 0 $((n - 1))); do
    req "$2" "select coalesce(json_agg(x), '[]')::text from (select $cols from public.$t order by criado_em, id limit 1000 offset $((p * 1000))) x"
  done
}
rpc() { req "$2" "select coalesce(json_agg(x), '[]')::text from public.$1() x"; }

EQ="'estresse' || :u || '@teste.br'"; SE="'seab' || :u || '@teste.br'"
{ echo '\set u random(3, 20)'; for t in $TABELAS; do tabela "$t" "$EQ"; done; } > "$W/abrir_equipe.sql"
{ echo '\set u random(1, 2)'; for t in $TABELAS; do tabela "$t" "$EQ"; done
  rpc membros_reservados "$EQ"
  req "$EQ" "select coalesce(json_agg(x), '[]')::text from (select * from public.auditoria order by em desc limit 200) x"
} > "$W/abrir_coord.sql"
# Acompanhamento (SEAB/MDA): membros, presenças, fotos e despesas não são pedidos; 4 tabelas vêm por função sem dado pessoal
{ echo '\set u random(21, 24)'
  for t in unidades lotes distribuicoes entregas pessoas; do tabela "$t" "$SE"; done
  for f in itens_acompanhamento agricultores_anonimos visitas_anonimas eventos_acompanhamento; do rpc "$f" "$SE"; done
} > "$W/abrir_seab.sql"
echo "scripts de abertura gerados ($(grep -c '^BEGIN' "$W/abrir_equipe.sql") pedidos equipe, $(grep -c '^BEGIN' "$W/abrir_coord.sql") coordenação, $(grep -c '^BEGIN' "$W/abrir_seab.sql") acompanhamento)"
