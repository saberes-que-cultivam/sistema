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
# o passo 3 deixa uma das duas coordenações desativada (qual delas depende de quem ganhou a corrida): reativa as duas para a carga medir só o banco
rodar "$Q -c \"update public.pessoas set perfil = 'Coordenação', ativo = true where email in ('estresse1@teste.br','estresse2@teste.br');\"" >/dev/null 2>&1
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
echo "6) corridas achadas na auditoria de 13/10 (script 15)"
# foto gravando enquanto outra pessoa exclui a atividade: uma das duas tem de ser recusada (antes, a foto ficava órfã)
orf=0
for r in 1 2 3; do
  E=$(rodar "$Q -At -c \"$(jwt 3) insert into public.eventos (tipo, data, tema) values ('Reunião','2026-10-01','Corrida $r') returning id;\"" | tail -1)
  C="eventos/$E/$(cat /proc/sys/kernel/random/uuid).jpg"
  rodar "$Q -c \"$(jwt 3) begin; insert into public.fotos (tabela, registro, caminho) values ('eventos', '$E', '$C'); select pg_sleep(1.5); commit;\"" >/dev/null 2>&1 &
  sleep 0.4; rodar "$Q -c \"$(jwt 1) delete from public.eventos where id = '$E';\"" >/dev/null 2>&1 || true; wait || true
  n=$(rodar "$Q -At -c \"select count(*) from public.fotos f where f.registro = '$E' and not exists (select 1 from public.eventos e where e.id = f.registro)\""); orf=$((orf + n))
done
[ "$orf" = "0" ] || { echo "   FALHOU: $orf foto(s) órfã(s) depois de excluir a atividade ao mesmo tempo"; exit 1; }
echo "   foto x exclusão da atividade ao mesmo tempo: nenhuma foto órfã em 3 rodadas"
# 40 pedidos de link de cadastro ao mesmo tempo: o limite de 20 abertos tem de valer
rodar "$Q -c \"update public.convites set status = 'cancelado' where status = 'aberto';\"" >/dev/null 2>&1
for i in $(seq 1 40); do rodar "$Q -c \"$(jwt 1) select public.criar_convite('discente');\"" >/dev/null 2>&1 & done; wait || true
n=$(rodar "$Q -At -c \"select count(*) from public.convites where status = 'aberto' and expira_em > now()\"")
[ "$n" -le 20 ] || { echo "   FALHOU: $n links abertos (limite 20)"; exit 1; }
echo "   40 pedidos de link ao mesmo tempo: $n abertos (limite 20)"
echo "ESTRESSE DO BANCO: TUDO CERTO"
