#!/usr/bin/env bash
# Teste de carga — passo 3: derruba o Postgres descartável e apaga os dados dele. Uso: bash parar.sh PASTA_DE_TRABALHO
set -euo pipefail
W="$(cd "$1" && pwd)"; . "$W/env"
if [ -n "$COMO" ]; then $COMO "$BIN/pg_ctl -D $PGDIR/dados -m fast stop" >/dev/null; else "$BIN/pg_ctl" -D "$PGDIR/dados" -m fast stop >/dev/null; fi
rm -rf "$PGDIR"; echo "banco de carga parado e apagado (os logs ficam em $W/logs)"
