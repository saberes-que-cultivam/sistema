#!/usr/bin/env bash
# Estresse do banco: gravações simultâneas nas regras que protegem dado, e medidas com 10x o volume do projeto.
# Não rode sozinho: use  npm run test:estresse  (ele sobe o banco de teste descartável e chama este arquivo).
set -euo pipefail
rodar() { if [ -n "${COMO:-}" ]; then $COMO "$1"; else bash -c "$1"; fi; }
Q="${PSQL/-v ON_ERROR_STOP=1/}"   # nas rajadas, recusa do banco é resultado esperado, não erro do teste
rodar "$PSQL -f $DIR/estresse_preparo.sql" >/dev/null
jwt() { echo "select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad('$1', 12, '0'), false); set role authenticated;"; }

echo "1) 200 entregas de 3 kg ao mesmo tempo no mesmo lote de 100 kg (20 pessoas)"
for i in $(seq 1 200); do u=$((1 + i % 20)); a=$((1 + i % 30))
  echo "$(jwt $u) insert into public.distribuicoes (data, lote, agricultor, qtd) values ('2026-10-01', 'e0000000-0000-4000-8000-000000000001', ('d0000000-0000-4000-8000-' || lpad('$a', 12, '0'))::uuid, 3);" > "$DIR/d$i.sql"; done
chmod a+r "$DIR"/d*.sql; ini=$(date +%s.%N)
for i in $(seq 1 200); do rodar "$Q -f $DIR/d$i.sql" >/dev/null 2>&1 & [ $((i % 50)) -eq 0 ] && wait; done; wait   # 50 conexões por vez (o Postgres de teste aceita 100)
echo "   terminou em $(echo "$(date +%s.%N) - $ini" | bc | cut -c1-5) s"

echo "2) 200 lotes do mesmo tipo criados ao mesmo tempo (o código não pode repetir)"
for i in $(seq 1 200); do u=$((1 + i % 20)); echo "$(jwt $u) insert into public.lotes (unidade, tipo, inicio, qtd) values ('c0000000-0000-4000-8000-000000000001', 'Húmus de minhoca', '2026-09-01', 10);" > "$DIR/l$i.sql"; done
chmod a+r "$DIR"/l*.sql; ini=$(date +%s.%N)
for i in $(seq 1 200); do rodar "$Q -f $DIR/l$i.sql" >/dev/null 2>&1 & [ $((i % 50)) -eq 0 ] && wait; done; wait
echo "   terminou em $(echo "$(date +%s.%N) - $ini" | bc | cut -c1-5) s"

echo "3) as 2 coordenações tentando sair ao mesmo tempo, 40 rodadas"
for r in $(seq 1 40); do
  rodar "$Q -c \"$(jwt 1) update public.pessoas set perfil = 'Equipe' where email = 'estresse1@teste.br';\"" >/dev/null 2>&1 &
  rodar "$Q -c \"$(jwt 2) update public.pessoas set ativo = false where email = 'estresse2@teste.br';\"" >/dev/null 2>&1 &
  wait
  rodar "$Q -c \"update public.pessoas set perfil = 'Coordenação', ativo = true where email in ('estresse1@teste.br','estresse2@teste.br');\"" >/dev/null 2>&1
  n=$(rodar "$Q -At -c \"select count(*) from public.pessoas where perfil = 'Coordenação' and ativo and email like 'estresse%'\"")
done
rodar "$Q -c \"$(jwt 1) update public.pessoas set perfil = 'Equipe' where email = 'estresse1@teste.br';\"" >/dev/null 2>&1 &
rodar "$Q -c \"$(jwt 2) update public.pessoas set ativo = false where email = 'estresse2@teste.br';\"" >/dev/null 2>&1 &
wait
rodar "$PSQL -f $DIR/estresse_confere.sql" 2>&1 | sed -E 's/^psql:[^ ]* WARNING: */   /'
echo "4) volume: 10 vezes o tamanho previsto do projeto"
rodar "$PSQL -f $DIR/estresse_volume.sql" 2>&1 | grep -E '^---|Time:|linhas_auditoria|^ +[0-9]+ \|' | sed 's/^/   /'
echo "5) carga crescente: N pessoas gravando uma visita e lendo o painel ao mesmo tempo (o Postgres de teste aceita 100 conexões)"
echo "   pessoas | gravadas | recusadas | tempo total | por pessoa"
for n in 1 5 10 25 50 75 100 150 200; do
  antes=$(rodar "$Q -At -c \"select count(*) from public.visitas where obs = 'carga $n'\"")
  for i in $(seq 1 $n); do u=$((1 + i % 20)); a=$((1 + i % 30))
    echo "$(jwt $u) insert into public.visitas (data, agricultor, usou, obs) values ('2026-10-05', ('d0000000-0000-4000-8000-' || lpad('$a', 12, '0'))::uuid, 'Sim', 'carga $n'); select count(*) from public.visitas; select count(*) from public.distribuicoes; select count(*) from public.lotes;" > "$DIR/c$i.sql"; done
  chmod a+r "$DIR"/c*.sql; ini=$(date +%s.%N)
  for i in $(seq 1 $n); do rodar "$Q -f $DIR/c$i.sql" >/dev/null 2>&1 & done; wait
  t=$(echo "$(date +%s.%N) - $ini" | bc); ok=$(rodar "$Q -At -c \"select count(*) from public.visitas where obs = 'carga $n'\""); ok=$((ok - antes))
  printf "   %7s | %8s | %9s | %9.2f s | %7.0f ms\n" "$n" "$ok" "$((n - ok))" "$t" "$(echo "$t * 1000 / $n" | bc -l)"
  rm -f "$DIR"/c*.sql
done
orf=$(rodar "$Q -At -c \"select (select count(*) from public.visitas v where not exists (select 1 from public.agricultores a where a.id = v.agricultor)) + (select count(*) from public.distribuicoes d where not exists (select 1 from public.lotes l where l.id = d.lote))\"")
[ "$orf" = "0" ] || { echo "   FALHOU: $orf registro(s) sem dono depois da carga"; exit 1; }
vivo=$(rodar "$Q -At -c \"select 1\""); [ "$vivo" = "1" ] || { echo "   FALHOU: o banco não respondeu depois da carga"; exit 1; }
echo "   depois da carga: banco respondendo, nenhum registro sem dono"
echo "ESTRESSE DO BANCO: TUDO CERTO"
