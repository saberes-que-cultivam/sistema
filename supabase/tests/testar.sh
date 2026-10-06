#!/usr/bin/env bash
# Testa os scripts do banco num Postgres local descartável (não toca no Supabase).
# Uso: bash supabase/tests/testar.sh     (precisa de PostgreSQL instalado; em Linux como root, usa o usuário "postgres")
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"; SUPA="$(dirname "$AQUI")"
BIN="$(dirname "$(ls /usr/lib/postgresql/*/bin/initdb 2>/dev/null | tail -1 || command -v initdb)")"
DIR="$(mktemp -d)"; PORTA=54329; chmod 755 "$DIR"
cp "$SUPA"/0*.sql "$AQUI"/stub_supabase.sql "$AQUI"/test_banco.sql "$DIR"/
COMO=""; if [ "$(id -u)" = "0" ]; then chown -R postgres "$DIR"; COMO="su postgres -c"; fi
rodar() { if [ -n "$COMO" ]; then $COMO "$1"; else bash -c "$1"; fi; }
rodar "$BIN/initdb -D $DIR/pg -A trust >/dev/null"
rodar "$BIN/pg_ctl -D $DIR/pg -o '-p $PORTA -c listen_addresses=' -l $DIR/log -w start >/dev/null"
trap 'rodar "$BIN/pg_ctl -D $DIR/pg -m immediate stop >/dev/null" || true; rm -rf "$DIR"' EXIT
P="psql -q -v ON_ERROR_STOP=1 -h /tmp -p $PORTA -d postgres"
rodar "$BIN/pg_ctl -D $DIR/pg status >/dev/null"
SOCK="$(rodar "psql -At -p $PORTA -d postgres -c 'show unix_socket_directories'" | cut -d, -f1)"
P="PGOPTIONS=--client-min-messages=warning psql -q -v ON_ERROR_STOP=1 -h $SOCK -p $PORTA -d postgres"
rodar "$P -f $DIR/stub_supabase.sql"
rodar "$P -f $DIR/01_criar_banco.sql" >/dev/null
rodar "$P -f $DIR/01_criar_banco.sql" >/dev/null      # rodar duas vezes não pode dar erro
rodar "$P -f $DIR/03_dados_iniciais.sql" >/dev/null
rodar "$P -f $DIR/03_dados_iniciais.sql" >/dev/null
rodar "$P -f $DIR/00_verificar.sql" >/dev/null
rodar "$P -f $DIR/test_banco.sql" | tail -3
