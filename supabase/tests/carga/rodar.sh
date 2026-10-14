#!/usr/bin/env bash
# Teste de carga do banco — passo 2: roda os 4 cenários no banco que preparar.sh deixou de pé.
# Uso: bash supabase/tests/carga/rodar.sh PASTA_DE_TRABALHO [cenários]   (cenários: a b c d e; padrão: todos)
#   a) carga:     50 clientes, 60 s, leitura + gravação misturadas
#   b) pico:     100 clientes, 30 s, mesma mistura
#   c) duração:   20 clientes, 5 min, mesma mistura
#   e) ritmo de gente: 50 clientes, 60 s, limitados a 3 transações/s no total (~45 aberturas do app e ~135 gravações por minuto)
#   d) corrida:   50 clientes entregando no MESMO lote de 100 kg (10 tentativas cada); confere o saldo no fim
# Os clientes não esperam entre um pedido e outro: cada cliente do pgbench pede bem mais que uma pessoa usando o app.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"; W="$(cd "$1" && pwd)"; shift || true
CEN="${*:-a b c d e}"; . "$W/env"
export PGOPTIONS=--client-min-messages=warning
J="${J:-2}"   # linhas de execução do pgbench (o pgbench roda na mesma máquina e disputa a CPU com o banco)
MIX="-f $W/abrir_equipe.sql@2 -f $W/abrir_coord.sql@1 -f $W/abrir_seab.sql@1 -f $AQUI/gravar.sql@12"
NOMES="abrir (Equipe),abrir (Coordenação),abrir (Acompanhamento),gravar (Equipe)"
mkdir -p "$W/logs"

medir() {   # amostra a cada 5 s: carga, processos do Postgres, memória usada da máquina (MemTotal - MemAvailable) e CPU (vmstat)
  while true; do
    echo "$(date +%T) carga=$(awk '{print $1}' /proc/loadavg) conexões=$(ps -C postgres --no-headers | wc -l) memória_usada=$(awk '/MemTotal/{t=$2} /MemAvailable/{a=$2} END {printf "%.0fMB", (t-a)/1024}' /proc/meminfo) $(vmstat 1 2 | tail -1 | awk '{print "cpu_us="$13" sy="$14" ocioso="$15" io="$16}')"
    sleep 4
  done
}

rodada() {   # $1 nome, $2 clientes, $3 opção de duração, resto: scripts
  local nome="$1" c="$2" d="$3"; shift 3
  bash "$AQUI/gerar_abrir.sh" "$W" >/dev/null
  rm -f "$W/logs/$nome".*
  medir > "$W/logs/$nome.recursos" & local m=$!
  pgbench -n -c "$c" -j "$J" $d -P 10 --failures-detailed -l --log-prefix="$W/logs/$nome" "$@" > "$W/logs/$nome.saida" 2>&1 || true
  kill $m 2>/dev/null; wait $m 2>/dev/null || true
  echo "=== $nome: $c clientes, $d ==="
  grep -E "^(tps|latency average|number of (transactions actually|failed)|number of clients aborted)|aborted|ERROR" "$W/logs/$nome.saida" | sed 's/^/  /' | head -12
  python3 "$AQUI/percentis.py" "$NOMES" "$W/logs/$nome".[0-9]*
  echo "  recursos (amostras a cada ~15 s):"
  awk 'NR%3==1' "$W/logs/$nome.recursos" | sed 's/^/    /' | head -8
}

for x in $CEN; do case "$x" in
  a) rodada a_carga 50 "-T 60" $MIX ;;
  b) rodada b_pico 100 "-T 30" $MIX ;;
  c) rodada c_duracao 20 "-T 300" $MIX ;;
  e) rodada e_ritmo 50 "-T 60 -R 3" $MIX ;;
  d) psql -X -q -c "delete from public.distribuicoes where lote = 'e2000000-0000-4000-8000-000000000001'; truncate carga.recusas;"
     NOMES="entrega no mesmo lote" rodada d_corrida 50 "-t 10" -f "$AQUI/entrega_mesmo_lote.sql"
     psql -X -c "select l.qtd as lote_kg, count(d.id) as entregas_gravadas, coalesce(sum(d.qtd), 0) as kg_entregues, l.qtd - coalesce(sum(d.qtd), 0) as saldo,
                        (select count(*) from carga.recusas) as recusadas_por_saldo,
                        case when l.qtd - coalesce(sum(d.qtd), 0) >= 0 then 'OK: saldo nunca negativo' else 'FALHOU: saldo negativo' end as resultado
                   from public.lotes l left join public.distribuicoes d on d.lote = l.id
                  where l.id = 'e2000000-0000-4000-8000-000000000001' group by l.qtd" ;;
esac; done
psql -X -c "select relname as tabela, n_live_tup as linhas, n_dead_tup as mortas, pg_size_pretty(pg_total_relation_size(relid)) as tamanho from pg_stat_user_tables where schemaname = 'public' order by pg_total_relation_size(relid) desc limit 8"
