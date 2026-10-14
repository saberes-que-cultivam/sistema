# Teste de carga do banco (pgbench, RLS ligado)

Mede se o banco aguenta muita gente ao mesmo tempo com as regras de acesso (RLS) valendo. Roda num PostgreSQL local
descartável, montado como o `testar.sh` (stub do Supabase + scripts `01` a `21`); **não toca no Supabase**. Dados todos fictícios.

Precisa de PostgreSQL 16 (`initdb`, `pg_ctl`, `psql`, `pgbench`) e `python3`. Em Linux como root, o servidor roda como `postgres`.

```bash
W=/tmp/carga                                   # pasta de trabalho (logs, scripts gerados, env)
bash supabase/tests/carga/preparar.sh $W       # sobe o banco (porta 54330) com volume 10x + pessoas de cada perfil (~10 s)
bash supabase/tests/carga/rodar.sh $W          # cenários a b c d e (~8 min); ou só alguns: rodar.sh $W a d
. $W/env && psql -X -f supabase/tests/carga/explicar.sql   # EXPLAIN (ANALYZE, BUFFERS) das consultas mais lentas, com RLS
bash supabase/tests/carga/parar.sh $W          # derruba e apaga o banco
```

| arquivo | o que é |
|---|---|
| `preparar.sh` | sobe o Postgres, roda o stub e os scripts, `estresse_preparo.sql`, `estresse_volume.sql` e `carga_preparo.sql` |
| `carga_preparo.sql` | 4 pessoas do Acompanhamento, lotes/atividades/visitas com id conhecido, 8.000 presenças, 600 fotos, e a função `carga.entregar()` (só do teste) |
| `gerar_abrir.sh` | gera `abrir_equipe.sql`, `abrir_coord.sql`, `abrir_seab.sql`: o que `carregar()` pede (13 tabelas em páginas de 1.000 por `criado_em, id`; Acompanhamento pelas funções `*_anonimos`/`*_acompanhamento`; Coordenação também `membros_reservados()` e a auditoria `order by em desc limit 200`) |
| `gravar.sql` | uma gravação por transação: lote novo, edição de lote, entrega (gatilho de saldo), visita nova/edição, atividade nova/edição, presença |
| `entrega_mesmo_lote.sql` | corrida: todos entregam 1 kg no mesmo lote de 100 kg |
| `percentis.py` | p50/p95/p99 por script a partir dos logs `-l` do pgbench |

Cada pedido imita o PostgREST: `BEGIN; set_config('request.jwt.claim.sub', …, true); set local role authenticated; <consulta em json_agg>; COMMIT;`.
Logins: 1–2 Coordenação, 3–20 Equipe (de `estresse_preparo.sql`), 21–24 Acompanhamento.

Cenários (`rodar.sh`): **a** 50 clientes/60 s, **b** 100 clientes/30 s, **c** 20 clientes/5 min, **d** 50 clientes × 10 entregas no mesmo lote
(confere saldo ≥ 0 no fim), **e** 50 clientes limitados a 3 transações/s (ritmo de gente). Mistura de a/b/c/e: abrir Equipe 2 : abrir Coordenação 1 :
abrir Acompanhamento 1 : gravar 12. Nos cenários a/b/c os clientes não esperam entre pedidos: cada um pede muito mais que uma pessoa usando o app.
