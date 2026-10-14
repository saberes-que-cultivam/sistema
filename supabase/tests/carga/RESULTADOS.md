# Resultados — 14/10/2026

Máquina: 2 vCPU, 8 GB, PostgreSQL 16 local (`shared_buffers=256MB`, `max_connections=150`), pgbench na mesma máquina (`-j 2`).
Volume: 10× o previsto (330 unidades produtivas, ~6.600 visitas, ~3.100 entregas, 5.000 despesas, 400 atividades, 8.000 presenças, ~25.000 linhas de auditoria).
"Abrir" = o `carregar()` inteiro (35 pedidos Equipe, 37 Coordenação, 12 Acompanhamento). Latências em ms, no servidor (sem rede).

| cenário | clientes | TPS | falhas | abrir Equipe p50 / p95 / p99 | abrir Acomp. p50 / p95 | gravar p50 / p95 / p99 |
|---|---:|---:|---:|---|---|---|
| a) carga 60 s | 50 | 24,8 | 0 | 8.718 / 10.450 / 10.705 | 2.179 / 2.720 | 128 / 244 / 305 |
| b) pico 30 s | 100 | 25,2 | 0 | 15.940 / 22.672 / 23.524 | 4.791 / 7.258 | 305 / 608 / 785 |
| c) duração 5 min | 20 | 22,1 | 0 | 4.126 / 4.834 / 5.169 | 1.009 / 1.320 | 42 / 80 / 108 |
| e) ritmo de gente (3 tx/s) | 50 | 2,7 | 0 | 385 / 612 / 799 | 95 / 150 | 8 / 22 / 27 |
| d) corrida no mesmo lote | 50 | 477 | 0 | — | — | entrega 60 / 309 / 417 |

- **d)** 500 tentativas de 1 kg num lote de 100 kg: 100 gravadas, 400 recusadas pelo saldo, saldo final 0,00. Nunca negativo.
- **c)** TPS estável os 5 min (19–28 por intervalo de 10 s), sem degradação; nenhuma falha, nenhum cliente abortado.
- CPU: 0 % ocioso em a/b/c (o banco **e** o pgbench disputam 2 vCPU); 70–80 % ocioso em e. Memória da máquina: ~1,1 GB parada → ~1,6 GB com 50 conexões → ~2,0 GB com 100 (≈ 8 MB por conexão).
- Em a/b/c o gargalo é a abertura do app: cada uma ordena e serializa em JSON as tabelas inteiras (~35 consultas, ~25.000 linhas). A ~25 TPS são ~6 aberturas/s + ~19 gravações/s.

## Consultas mais lentas (EXPLAIN ANALYZE, RLS ligado; `explicar.sql`)

| consulta | tempo | plano |
|---|---:|---|
| visitas, página 6 (`limit 1000 offset 5000`) | 26 ms | Seq Scan + Sort de todas as 6.600 linhas, em toda página |
| presenças, página 8 | 17 ms | idem (8.100 linhas) |
| auditoria `order by em desc limit 200` (Coordenação) | 22 ms | **Seq Scan + top-N sort; o índice `auditoria_em` não é usado** |
| `visitas_anonimas()` (Acompanhamento) | 80 ms | uma resposta só com 6.600 linhas em JSON |
| entrega nova (gatilho de saldo) | 7 ms | `distribuicao_antes` 2,7 ms (`for update` no lote + soma pelo índice `distribuicoes_lote`) |
| lote novo | 5 ms | `lote_antes` 2 ms |

As regras `sou_equipe()` viram filtro único por consulta (InitPlan `$0`), não linha a linha; o custo do RLS é ~0,3–0,9 ms por pedido.

**Auditoria:** a regra `(select public.meu_perfil()) = 'Coordenação'` deixa o planejador estimar 0,5 % das linhas e desistir do índice. Testado (com rollback):
`alter policy auditoria_ler on public.auditoria using ((select public.meu_perfil() = 'Coordenação'))` → Index Scan em `auditoria_em`, **22 ms → 2 ms**,
e deixa de crescer com a tabela. Aplicado no `22_auditoria_1410b.sql` (14/10/2026).

**Páginas:** índice `(criado_em, id)` em `visitas`, `presencas`, `despesas`, `distribuicoes` só ajuda a 1ª página (9 ms); com `offset` o planejador continua ordenando tudo.
No volume real (1/10 deste) cada tabela cabe em 1 página e isso não pesa.

## Ressalvas

Postgres local ≠ Supabase: não há rede (cada pedido no Supabase soma ~50–200 ms de ida e volta do Brasil; a abertura faz 13 pedidos em paralelo, com as páginas em sequência),
nem PostgREST/Supavisor no meio, nem os limites do plano gratuito (instância pequena com CPU compartilhada, poucas dezenas de conexões diretas, pooler na frente). Os números aqui são o custo do banco, não o tempo que a pessoa vê.
