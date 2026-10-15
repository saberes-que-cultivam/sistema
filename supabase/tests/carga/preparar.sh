#!/usr/bin/env bash
# Teste de carga do banco (pgbench) — passo 1: sobe um Postgres local descartável, igual ao testar.sh, e deixa de pé.
# NÃO toca no Supabase. Uso:  bash supabase/tests/carga/preparar.sh [PASTA_DE_TRABALHO]
# Depois: bash supabase/tests/carga/rodar.sh [PASTA_DE_TRABALHO]   e, no fim,   bash supabase/tests/carga/parar.sh [PASTA]
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"; TESTES="$(dirname "$AQUI")"; SUPA="$(dirname "$TESTES")"
W="${1:-$(mktemp -d)}"; mkdir -p "$W"; W="$(cd "$W" && pwd)"
BIN="$(dirname "$(ls /usr/lib/postgresql/*/bin/initdb 2>/dev/null | tail -1 || command -v initdb)")"
PORTA="${PORTA:-54330}"
# o servidor roda como "postgres" (não roda como root); os dados ficam numa pasta própria em /tmp que ele consegue abrir
PG="$(mktemp -d /tmp/carga-pg-XXXX)"; chmod 755 "$PG"
COMO=""; if [ "$(id -u)" = "0" ]; then chown postgres "$PG"; COMO="su postgres -c"; fi
rodar() { if [ -n "$COMO" ]; then $COMO "$1"; else bash -c "$1"; fi; }
rodar "$BIN/initdb -D $PG/dados -A trust >/dev/null"
# 150 conexões: o pico usa 100 clientes + folga para os scripts de conferência
rodar "$BIN/pg_ctl -D $PG/dados -o \"-p $PORTA -c listen_addresses= -c unix_socket_directories=$PG -c max_connections=150 -c shared_buffers=256MB\" -l $PG/log -w start >/dev/null"
cat > "$W/env" <<EOF
export PGHOST=$PG PGPORT=$PORTA PGUSER=postgres PGDATABASE=postgres BIN=$BIN PGDIR=$PG COMO="$COMO"
EOF
. "$W/env"
P="psql -q -X -v ON_ERROR_STOP=1"
export PGOPTIONS=--client-min-messages=warning
$P -f "$TESTES/stub_supabase.sql"
$P -f "$SUPA/01_criar_banco.sql" >/dev/null
$P -f "$SUPA/03_dados_iniciais.sql" >/dev/null
for n in 04_endurecimento 05_acompanhamento 06_item_da_despesa 07_equipe 08_equipe_dados 09_ultimos_acessos 10_equipe_cadastro_completo 11_convite_cadastro 12_contas_e_conferencias 13_presenca_e_fotos 14_falta_enviar 15_auditoria_1310 16_seab_sem_financeiro 17_formador 18_local_da_visita 19_meus_contatos 20_auditoria_1410 21_historico_downloads 22_auditoria_1410b 23_perfis_auxiliar_formador 24_foto_da_equipe; do
  $P -f "$SUPA/$n.sql" >/dev/null
done
V="$($P -At -f "$SUPA/00_verificar.sql" | grep -v '^coordenação ativa' || true)"
if echo "$V" | grep -E "FALTA|ABERT|VOLTOU|CONFIRA" >/dev/null; then echo "00_verificar acusou problema:"; echo "$V" | grep -E "FALTA|ABERT|VOLTOU|CONFIRA"; exit 1; fi
# volume: 20 pessoas da equipe (estresse_preparo) + 10x o projeto (estresse_volume) + o que falta para a carga (carga_preparo)
$P -f "$TESTES/estresse_preparo.sql" >/dev/null
$P -f "$TESTES/estresse_volume.sql" >/dev/null
$P -f "$AQUI/carga_preparo.sql"
echo "banco de carga pronto. Pasta de trabalho: $W   (dados em $PG, porta $PORTA)"
