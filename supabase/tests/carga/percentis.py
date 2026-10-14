#!/usr/bin/env python3
"""Lê os logs por transação do pgbench (-l) e imprime, por script, quantidade, falhas, média e percentis (ms).
Uso: python3 percentis.py "nome1,nome2,..." arquivo_log [arquivo_log ...]
Formato da linha (pgbench 16): client_id transaction_no time script_no time_epoch time_us [schedule_lag] [retries];
time = latência em microssegundos, ou "failed"/"skipped"."""
import sys

nomes = sys.argv[1].split(",")
lat, falhas = {}, {}
for arq in sys.argv[2:]:
    with open(arq) as f:
        for linha in f:
            c = linha.split()
            if len(c) < 6:
                continue
            s = int(c[3])
            if c[2] in ("failed", "skipped"):
                falhas[s] = falhas.get(s, 0) + 1
                continue
            lat.setdefault(s, []).append(int(c[2]) / 1000.0)


def p(v, q):
    return v[min(len(v) - 1, int(round(q * (len(v) - 1))))]


print("| script | transações | falhas | média ms | p50 | p95 | p99 | máx |")
print("|---|---:|---:|---:|---:|---:|---:|---:|")
todos = []
for s in sorted(set(lat) | set(falhas)):
    v = sorted(lat.get(s, []))
    todos += v
    n = nomes[s] if s < len(nomes) else str(s)
    if v:
        print(f"| {n} | {len(v)} | {falhas.get(s, 0)} | {sum(v)/len(v):.1f} | {p(v,.5):.1f} | {p(v,.95):.1f} | {p(v,.99):.1f} | {v[-1]:.1f} |")
    else:
        print(f"| {n} | 0 | {falhas.get(s, 0)} | - | - | - | - | - |")
todos.sort()
if todos and len(lat) > 1:
    print(f"| **todos** | {len(todos)} | {sum(falhas.values())} | {sum(todos)/len(todos):.1f} | {p(todos,.5):.1f} | {p(todos,.95):.1f} | {p(todos,.99):.1f} | {todos[-1]:.1f} |")
