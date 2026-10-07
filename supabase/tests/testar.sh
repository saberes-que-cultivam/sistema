#!/usr/bin/env bash
# Testa os scripts do banco num Postgres local descartável (não toca no Supabase).
# Uso: bash supabase/tests/testar.sh     (precisa de PostgreSQL instalado; em Linux como root, usa o usuário "postgres")
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"; SUPA="$(dirname "$AQUI")"
BIN="$(dirname "$(ls /usr/lib/postgresql/*/bin/initdb 2>/dev/null | tail -1 || command -v initdb)")"
DIR="$(mktemp -d)"; PORTA=54329; chmod 755 "$DIR"
cp "$SUPA"/[0-9]*.sql "$AQUI"/stub_supabase.sql "$AQUI"/test_banco.sql "$DIR"/
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
for n in 04_endurecimento 05_acompanhamento 06_item_da_despesa 07_equipe 08_equipe_dados 09_ultimos_acessos 10_equipe_cadastro_completo 11_convite_cadastro 04_endurecimento 05_acompanhamento 06_item_da_despesa 07_equipe 08_equipe_dados 09_ultimos_acessos 10_equipe_cadastro_completo 11_convite_cadastro; do rodar "$P -f $DIR/$n.sql" >/dev/null; done   # duas vezes: rodar de novo não pode dar erro
rodar "$P -f $DIR/00_verificar.sql" >/dev/null
rodar "$P -f $DIR/test_banco.sql" | tail -3
# cópia e restauração: copia o banco de teste, restaura num banco novo e confere se voltou tudo (linhas, regras de acesso, gatilhos e verificações)
conta() { rodar "psql -At -h $SOCK -p $PORTA -d $1 -c \"select (select count(*) from public.pessoas)||'/'||(select count(*) from public.despesas)||'/'||(select count(*) from public.membros)||'/'||(select count(*) from public.auditoria)||' regras='||(select count(*) from pg_policies where schemaname='public')||' gatilhos='||(select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth') and not t.tgisinternal)||' verificacoes='||(select count(*) from pg_constraint k join pg_namespace n on n.oid=k.connamespace where n.nspname='public')\""; }
rodar "pg_dump -h $SOCK -p $PORTA -d postgres -Fc -f $DIR/copia.dump" && rodar "createdb -h $SOCK -p $PORTA restaurado" && rodar "pg_restore -h $SOCK -p $PORTA -d restaurado --no-owner $DIR/copia.dump" >/dev/null 2>$DIR/rest.log || true
A="$(conta postgres)"; B="$(conta restaurado)"
if [ "$A" = "$B" ]; then echo " CÓPIA E RESTAURAÇÃO: conferem ($A)"; else echo " CÓPIA E RESTAURAÇÃO: DIFERENTES  original=$A  restaurado=$B"; tail -5 $DIR/rest.log; exit 1; fi
# ESTRESSE=1: com o banco de teste ainda de pé, roda as gravações simultâneas e as medidas com volume
if [ -n "${ESTRESSE:-}" ]; then cp "$AQUI"/estresse.sh "$AQUI"/estresse_*.sql "$DIR"/; chmod -R a+rX "$DIR"; PSQL="$P" COMO="$COMO" DIR="$DIR" bash "$DIR/estresse.sh"; fi
