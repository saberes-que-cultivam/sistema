#!/usr/bin/env bash
# Testa os scripts do banco num Postgres local descartável (não toca no Supabase).
# Uso: bash supabase/tests/testar.sh     (precisa de PostgreSQL instalado; em Linux como root, usa o usuário "postgres")
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"; SUPA="$(dirname "$AQUI")"
BIN="$(dirname "$(ls /usr/lib/postgresql/*/bin/initdb 2>/dev/null | tail -1 || command -v initdb)")"
DIR="$(mktemp -d)"; PORTA=54329; chmod 755 "$DIR"
cp "$SUPA"/[0-9]*.sql "$AQUI"/stub_supabase.sql "$AQUI"/test_banco.sql "$AQUI"/test_matriz_perfis.sql "$AQUI"/conferir_metas.sql "$DIR"/; cp "$SUPA"/simulacao/povoar.sql "$DIR"/sim_povoar.sql; cp "$SUPA"/simulacao/limpar.sql "$DIR"/sim_limpar.sql
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
for n in 04_endurecimento 05_acompanhamento 06_item_da_despesa 07_equipe 08_equipe_dados 09_ultimos_acessos 10_equipe_cadastro_completo 11_convite_cadastro 12_contas_e_conferencias 13_presenca_e_fotos 14_falta_enviar 15_auditoria_1310 16_seab_sem_financeiro 17_formador 18_local_da_visita 19_meus_contatos 20_auditoria_1410 21_historico_downloads 22_auditoria_1410b 23_perfis_auxiliar_formador 24_foto_da_equipe 25_meta2_e_atividades 26_data_funcionamento 27_documentos_e_substituta 04_endurecimento 05_acompanhamento 06_item_da_despesa 07_equipe 08_equipe_dados 09_ultimos_acessos 10_equipe_cadastro_completo 11_convite_cadastro 12_contas_e_conferencias 13_presenca_e_fotos 14_falta_enviar 15_auditoria_1310 16_seab_sem_financeiro 17_formador 18_local_da_visita 19_meus_contatos 20_auditoria_1410 21_historico_downloads 22_auditoria_1410b 23_perfis_auxiliar_formador 24_foto_da_equipe 25_meta2_e_atividades 26_data_funcionamento 27_documentos_e_substituta; do rodar "$P -f $DIR/$n.sql" >/dev/null; done   # duas vezes: rodar de novo não pode dar erro
V="$(rodar "$P -At -f $DIR/00_verificar.sql")"
V="$(echo "$V" | grep -v "^coordenação ativa")"   # banco de teste ainda sem pessoas neste ponto
if echo "$V" | grep -E "FALTA|ABERT|VOLTOU|CONFIRA" >/dev/null; then echo " 00_verificar acusou problema:"; echo "$V" | grep -E "FALTA|ABERT|VOLTOU|CONFIRA"; exit 1; fi
rodar "$P -f $DIR/15_auditoria_1310.sql" >/dev/null   # o 15 rodado depois do 22 tem de ser apontado, e o 22 de novo conserta
V2="$(rodar "$P -At -f $DIR/00_verificar.sql")"
for t in "o 15 foi rodado depois do 22" "rode o 16" "rode o 20 de novo"; do echo "$V2" | grep -q "$t" || { echo " 00_verificar não apontou o 15 rodado de novo ($t)"; exit 1; }; done
for n in 16_seab_sem_financeiro 17_formador 18_local_da_visita 19_meus_contatos 20_auditoria_1410 21_historico_downloads 22_auditoria_1410b 23_perfis_auxiliar_formador 24_foto_da_equipe 25_meta2_e_atividades 26_data_funcionamento 27_documentos_e_substituta; do rodar "$P -f $DIR/$n.sql" >/dev/null; done   # a receita do CLAUDE.md: rodou o 15 de novo, rode do 16 em diante
rodar "$P -At -f $DIR/00_verificar.sql" | grep -v "^coordenação ativa" | grep -E "FALTA|ABERT|VOLTOU|CONFIRA" && { echo " rodar do 16 em diante não consertou"; exit 1; }
# simulação: povoa com dados fictícios, recusa povoar duas vezes, limpa sem deixar rastro e sem tocar no que é real
AUD0="$(rodar "psql -At -h $SOCK -p $PORTA -d postgres -c 'select count(*) from public.auditoria'")"
rodar "$P -f $DIR/sim_povoar.sql" >/dev/null
[ "$(rodar "psql -At -h $SOCK -p $PORTA -d postgres -c \"select count(*) from public.visitas where id::text like 'ffffffff-0000-4000-8000-%'\"")" -gt 100 ] || { echo " simulação: povoar não gravou as visitas"; exit 1; }
if rodar "$P -f $DIR/sim_povoar.sql" >/dev/null 2>&1; then echo " simulação: povoar duas vezes não foi recusado"; exit 1; fi
rodar "$P -q -f $DIR/conferir_metas.sql" > $DIR/metas.json && node "$AQUI/conferir_metas.js" $DIR/metas.json
rodar "$P -f $DIR/sim_limpar.sql" >/dev/null
[ "$(rodar "psql -At -h $SOCK -p $PORTA -d postgres -c \"select (select count(*) from public.unidades where id::text like 'ffffffff%')+(select count(*) from public.despesas where id::text like 'ffffffff%')+(select count(*) from public.presencas where id::text like 'ffffffff%')\"")" = "0" ] || { echo " simulação: limpar deixou registros"; exit 1; }
[ "$(rodar "psql -At -h $SOCK -p $PORTA -d postgres -c 'select count(*) from public.auditoria'")" = "$AUD0" ] || { echo " simulação: limpar deixou rastro no histórico"; exit 1; }
rodar "$P -f $DIR/test_banco.sql" | tail -3
rodar "$P -f $DIR/test_matriz_perfis.sql" > $DIR/matriz.out || { cat $DIR/matriz.out; exit 1; }; grep -o 'MATRIZ DE ACESSO.*' $DIR/matriz.out | sed 's/^/ /'; [ -n "${MATRIZ:-}" ] && cat $DIR/matriz.out > "$MATRIZ"
# cópia e restauração: copia o banco de teste, restaura num banco novo e confere se voltou tudo (linhas, regras de acesso, gatilhos e verificações)
conta() { rodar "psql -At -h $SOCK -p $PORTA -d $1 -c \"select (select count(*) from public.pessoas)||'/'||(select count(*) from public.despesas)||'/'||(select count(*) from public.membros)||'/'||(select count(*) from public.auditoria)||' regras='||(select count(*) from pg_policies where schemaname='public')||' gatilhos='||(select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth') and not t.tgisinternal)||' verificacoes='||(select count(*) from pg_constraint k join pg_namespace n on n.oid=k.connamespace where n.nspname='public')\""; }
rodar "pg_dump -h $SOCK -p $PORTA -d postgres -Fc -f $DIR/copia.dump" && rodar "createdb -h $SOCK -p $PORTA restaurado" && rodar "pg_restore -h $SOCK -p $PORTA -d restaurado --no-owner $DIR/copia.dump" >/dev/null 2>$DIR/rest.log || true
A="$(conta postgres)"; B="$(conta restaurado)"
if [ "$A" = "$B" ]; then echo " CÓPIA E RESTAURAÇÃO: conferem ($A)"; else echo " CÓPIA E RESTAURAÇÃO: DIFERENTES  original=$A  restaurado=$B"; tail -5 $DIR/rest.log; exit 1; fi
# ESTRESSE=1: com o banco de teste ainda de pé, roda as gravações simultâneas e as medidas com volume
if [ -n "${ESTRESSE:-}" ]; then cp "$AQUI"/estresse.sh "$AQUI"/estresse_*.sql "$DIR"/; chmod -R a+rX "$DIR"; PSQL="$P" COMO="$COMO" DIR="$DIR" bash "$DIR/estresse.sh"; fi
