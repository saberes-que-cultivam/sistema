# Relatório da auditoria — Saberes que Cultivam (15/10/2026, versão sqc-v84)

Segunda rodada da auditoria formal, organizada pelas seis metas do plano de trabalho.

**Referências:**
- Plano de Trabalho Universal do TED, v4 (07/10/2026).
- Plano de trabalho assinado com o MDA (17/07/2026): metas, etapas e datas que o sistema segue.
- Cronograma de atividades da equipe (15/10/2026), recebido nesta auditoria.

A primeira rodada (14/10/2026, sqc-v69, `RELATORIO.md`) continua valendo para o que não mudou. Esta rodada:
- concentra os testes novos no que entrou depois dela (v70 a v83) e nos indicadores de cada meta;
- repete todas as suítes como regressão.

Todos os dados usados são fictícios.

## 1. Resumo executivo

O sistema apoia as seis metas e, na rodada final, passou em todas as suítes automáticas (seção 6).

Foram confirmadas 10 falhas, todas corrigidas e verificadas por teste (seção 14):
- **Duas altas, de confiabilidade dos indicadores:**
  - capacitação e dia de campo contavam como realizados só porque a data passou, mesmo sem ninguém registrado;
  - biofábrica contava como "em funcionamento" só pela última caixa, sem os outros 7 passos.
- **Uma média, de planejamento:** o painel comparava o andamento só com as janelas do TED. Com isso, acusava atraso em etapas que o cronograma da equipe ainda nem começou.

As três foram resolvidas por decisão da coordenação tomada nesta auditoria.

A cobertura também cresceu:
- matriz de acesso no banco (5 perfis + sem login × 17 tabelas);
- contagem das metas refeita em SQL à parte e comparada com a tela;
- os perfis Auxiliar e Formador passaram a ser exercitados nos testes ponta a ponta.

**Parecer: B — apto com ressalvas** (seção 20). Para valer em produção é preciso rodar os scripts `25` e `26` no Supabase (a v85 já está publicada). Sem eles, as contas novas já valem na tela, mas a trava da Meta 2 no banco não, e a data de funcionamento não é gravada.

## 2. Arquitetura e tecnologias

Inalterada desde a v69:
- página única estática (HTML, CSS e JavaScript sem framework), servida pelo GitHub Pages, que funciona sem internet (PWA, fila no IndexedDB);
- Supabase: PostgreSQL com regras de acesso (RLS) em todas as tabelas, login e Storage privado;
- scripts numerados `01` a `25`, que podem ser rodados de novo.

Mudanças desde a v69:
- perfis **Auxiliar** e **Formador** (script `23`);
- foto da equipe (`24`);
- simulação (`?simulacao`, mais `supabase/simulacao`);
- mapa com município e biofábrica;
- quadro de Habilitação;
- biofábrica de referência separada das entregas.

Nesta rodada entra o `25`: "em funcionamento" só com os passos.

## 3. Escopo e limitações

**Testado:**
- tela no Chromium (Playwright), em 320, 390, 768, 1024 e 1280/1440 px;
- toque, modos claro, escuro e sol;
- os 5 perfis;
- banco num PostgreSQL 16 local com o simulador do Supabase (regras de acesso ligadas);
- carga com pgbench.

**Não testado:**
- Safari e iPhone reais (só emulação);
- o Supabase de produção (nenhum teste destrutivo nem de carga foi feito nele);
- leitor de tela real;
- sessão com pessoas da equipe. Nenhum resultado com usuário foi inventado.

**Ambiente:** 2 vCPU e 7 GB.

## 4. Matriz de rastreabilidade das seis metas

Matriz completa em `MATRIZ.md`. Resumo desta rodada:

| Meta | Produto previsto | Como o sistema apoia | Regra de cálculo (como está agora) | Teste e evidência | Situação |
|---|---|---|---|---|---|
| 1 Diagnóstico | 1 relatório técnico | Cadastro das unidades produtivas com linha de base; entrega 1.1 com link; Relatórios por período; CSV | entrega registrada com data até o dia | metas.js; conferir_metas (1.1 = 1) | atende; demandas prioritárias sem campo próprio (P7) |
| 2 Biofábricas | 2 em funcionamento | Aba Biofábricas: 8 passos, itens, lotes; mapa com resumo da biofábrica | conta para a meta **e** 8 passos marcados (`unidadePronta`); banco não deixa marcar "em funcionamento" antes (`25`) | regras/auditoria_1510.test.js; test_banco (script 25); metas.js; conferir_metas (2.1 = 2) | atende após correção (F2); sem data do funcionamento (P1); quais unidades contam (P2) |
| 3 Capacitação | 5 capacitações; 30 kits | Formação (atividade, lista de presença sem nome repetido, fotos, folha em branco); kit na unidade produtiva | capacitação com data até o dia **e** participantes ou lista; kit com data até o dia | auditoria_1510.test.js; metas.js (atividade sem participantes); conferir_metas (3.2 = 5, 3.3 = 30) | atende após correção (F1) |
| 4 Produção e monitoramento | 30 unidades acompanhadas | Lotes (código, tipo, medida, maturação, saldo); distribuição com saldo no banco; visitas com GPS e fotos | recebeu bioinsumo **e** visita no dia da primeira entrega ou depois; uma vez por unidade | metas.js; estresse (corrida no mesmo lote); conferir_metas (4.1 = 30) | atende |
| 5 Avaliação | 4 dias de campo; 1 relatório | Indicadores (gasto antes × depois, uso do bioinsumo, participantes); entrega 5.2 | dia de campo como a capacitação; indicador só com as duas pontas informadas | metas.js (recontado à mão); conferir_metas (participantes = 259) | atende após correção (F1) |
| 6 Gestão e contas | relatório final; 10 produtos; contrato | Entregas 6.1/6.2; Financeiro (acompanhamento; o oficial é o da FUNCERN); Histórico; downloads registrados | entregas com data até o dia | metas.js; seguranca.js (CSV); matriz de acesso | atende; financeiro é apoio, não o registro oficial |

## 5. Testes planejados e executados

**Planejados nesta rodada:**
- regressão completa (17 suítes);
- testes novos:
  - matriz de acesso;
  - metas em SQL à parte;
  - regras das decisões (unidade, banco e tela);
  - perfis Auxiliar e Formador em segurança, acessibilidade, teclado e simulação;
- carga e estresse com o script `25`.

**Executados:** todos. Nenhum teste ficou bloqueado. Comandos em `CLAUDE.md` e no começo de cada arquivo de teste.

## 6. Aprovados, reprovados e bloqueados (rodada final, v84)

| Suíte | Conferências | Aprovadas | Reprovadas | Bloqueadas |
|---|---:|---:|---:|---:|
| Unidade (`npm test`) | 62 | 62 | 0 | 0 |
| Banco (`test:banco`): conferências do `test_banco.sql`, scripts duas vezes, matriz, metas tela × SQL, cópia e restauração | 179 conferências + 102 combinações + 11 etapas | todas | 0 | 0 |
| Estresse do banco | 6 blocos | todos | 0 | 0 |
| Desempenho das contas (10×) | 1 | 1 | 0 | 0 |
| Metas (`metas.js`) | 139 | 139 | 0 | 0 |
| Simulação (5 perfis × 4 datas) | 111 | 111 | 0 | 0 |
| Fumaça | 47 | 47 | 0 | 0 |
| Robustez | 49 | 49 | 0 | 0 |
| Teclado (1280 e 390 px, 5 perfis) | 21 + 21 | todas | 0 | 0 |
| Entrada pelo teclado | 112 | 112 | 0 | 0 |
| Tipografia (normal, sol, escuro; 5 larguras) | 3 rodadas | todas | 0 | 0 |
| Evidências, Aparência, Trazidos do M&Q (1 e 2), Auditoria 12/10 | 23 + 3 + 16 + 13 + 14 | todas | 0 | 0 |
| Acessibilidade (axe em 276 telas + conferências, 5 perfis) | 105 | 105 | 0 | 0 |
| Segurança (XSS, CSV, fotos, sessão, exportação; 5 perfis) | 113 | 113 | 0 | 0 |

**Rodada da v85** (P1 e P2 resolvidas, script `26`): repetidas todas as suítes, todas sem reprovação.
- Unidade: 63.
- Metas: 141.
- Acessibilidade: 105.
- Segurança: 113.
- Banco: matriz e conferência tela × SQL.
- As demais: tudo certo.

## 7. Resultados funcionais e de integração

**Fluxos das seis metas:** passaram pela tela (`metas.js`, 138), entre eles:
- casos de borda: obrigatórios, número inválido, saldo, lote não pronto, data futura, período do relatório;
- as regras novas: atividade sem participantes e "em funcionamento" fora de ordem.

**Simulação:** coerente nos 5 perfis e em 4 datas. Lotes nunca ficam negativos, nenhuma entrega sai de lote não pronto, nenhuma visita fica no futuro e, no fim do projeto, todas as etapas estão cumpridas.

**Conferência independente** (dados do banco povoado pela simulação, que não são os mesmos do navegador; ali a etapa 6.3 fica com 0):
- com o banco povoado pela simulação, as 11 etapas e o total de participantes contados em SQL à parte (`supabase/tests/conferir_metas.sql`) batem com os da tela (`js/regras.js`);
- resultado: 1.1 = 1, 2.1 = 2, 3.1 = 1, 3.2 = 5, 3.3 = 30, 4.1 = 30, 5.1 = 4, 5.2 = 1, 6.1 = 10, 6.2 = 1, 6.3 = 0, e 259 participantes;
- limite: os dados da simulação podem não ter os casos de borda das duas regras novas (atividade passada sem participantes, biofábrica com passos faltando). Esses casos são cobertos pelos testes de unidade, pelo `metas.js` e pelo `test_banco.sql`.

## 8. Acessibilidade (WCAG 2.2 AA)

**Cobertura:** axe-core (WCAG 2.0 a 2.2 AA e boas práticas) em 1280 e 390 px, nos modos claro, escuro e sol, nos 5 perfis. Conferências próprias:
- títulos;
- nome acessível e "rótulo no nome" (2.5.3);
- alvo de 24 px;
- regiões vivas;
- alternativa de gráfico e mapa;
- refluxo em 320 px;
- espaçamento de texto (1.4.12);
- foco não escondido (2.4.11).

**Início da rodada:** 3 reprovações.
- Regra `label-content-name-mismatch` do axe, em 6 elementos.
- Conferência própria do 2.5.3, em 4 casos.

  As duas apontam para a mesma falha (F4): os botões da biofábrica no mapa (v82) tinham nome acessível sem o texto visível.
- Espaçamento de texto (1.4.12), em 8 casos a 320 px (F5).

**Fim da rodada:** 105 conferências, 0 reprovadas (276 telas no axe). Fica um aviso AAA (2.4.12): o painel "Pessoas com acesso" sai em parte sob a barra fixa a 390 px. Não conta como falha AA.

**Não comprovado:** leitor de tela real e ordem de leitura com pessoas. Não se declara conformidade integral.

## 9. Usabilidade

Avaliação heurística, sem teste com pessoas.

**Ajustes desta rodada:**
- a atividade com data passada e sem participantes aparece como "sem participantes: não conta" e vira aviso em "O que pede atenção";
- o formulário da biofábrica diz quais passos faltam;
- o painel mostra os dois previstos, com legenda: traço cheio para o cronograma da equipe, traço vazado para o TED. A forma diferente distingue os dois sem depender de cor;
- os próximos marcos incluem as atividades do cronograma da equipe.

**Recomendação mantida:** uma sessão de 30 minutos com 2 bolsistas no celular.

## 10. Segurança e privacidade (OWASP / LGPD)

**Testes de tela (`seguranca.js`, 113 conferências, 0 falhas; na v83, com 3 perfis, eram 95):** XSS por todos os formulários e por dados forjados, agora nos 5 perfis. Também CSV, links `javascript:`, fotos e sessão.

**No banco, a matriz de acesso** (`test_matriz_perfis.sql`) tenta ler, alterar e excluir em cada tabela, com cada perfil e sem login. Confirmou:
- **Auxiliar:** não lê agricultores, visitas, presenças, fotos nem o histórico; não altera dado de campo.
- **Formador:** grava só na Formação (atividades, presenças e fotos de atividade). Lê também unidades, lotes, distribuições e entregas, como todo perfil. Não lê despesas, itens, equipe nem dado de campo.
- **SEAB/MDA:** não lê agricultores, visitas, despesas, itens, presenças, fotos, equipe nem o histórico.
- **Sem login:** não lê nem altera nada.
- **Coordenação:** nem ela altera o histórico.

Observação (O1, baixa): `unidades`, `lotes`, `distribuicoes` e `entregas` são lidos por qualquer pessoa com login, inclusive o SEAB/MDA, o Auxiliar e o Formador. Não há nome nos registros, só o identificador da unidade produtiva, e o SEAB/MDA precisa deles para contar entregas. Mantido por desenho e registrado.

**Na simulação:** nenhum nome, comunidade ou observação de visita chega ao Auxiliar, ao Formador ou ao SEAB/MDA; foto de visita e despesas também não. A lista de presença chega só ao Formador.

A matriz testa "alterar" com `update … set id = id` em todas as linhas, o que é grosso para colunas. Que o Auxiliar só muda `arlo` e `termo_em` na equipe é conferido à parte no `test_banco.sql`: ele é recusado ao mudar o nome ou ao cadastrar alguém.

**Vulnerabilidades novas:** nenhuma.

## 11. Desempenho, carga e estresse

Cenário de carga: banco local com volume 10× o esperado e regras de acesso ligadas, scripts `01` a `25`. Mesmo método da v69 (`supabase/tests/carga`).

| Cenário | Clientes | Transações/s | Erros | Abrir (Equipe) p50/p95/p99 | Gravar p50/p95/p99 |
|---|---|---|---|---|---|
| Carga 60 s | 50 | 39,0 | 0 | 5,9 / 6,8 / 7,0 s | 94 / 174 / 209 ms |
| Pico 30 s | 100 | 37,3 | 0 | 10,8 / 14,7 / 16,1 s | 224 / 440 / 621 ms |
| Duração 5 min | 20 | 37,2 | 0 | 2,5 / 2,9 / 3,2 s | 27 / 52 / 68 ms |
| Ritmo de gente | 50 | 3,5 | 0 | 0,31 / 0,42 / 0,47 s | 4,6 / 10,7 / 21,9 ms |
| Corrida no mesmo lote | 50 | 869 | 0 | — | 500 tentativas sem erro de banco: 100 gravadas e 400 recusadas pelo saldo; saldo final 0, nunca negativo (consulta final do `rodar.sh`, mostrada no terminal, não gravada em arquivo) |

**Comparação com a v69:** menor tempo de resposta em todos os cenários (carga de 24,8 para 39,0 transações/s). No "ritmo de gente" as transações por segundo são limitadas pelo próprio teste, e só os tempos contam; ali há 34 aberturas medidas.

Os cenários sem pausa estão muito acima do uso real (3 a 4 pessoas e o SEAB/MDA). No ritmo de gente, abrir o sistema leva menos de 0,5 s.

**Estresse:** até 200 gravações simultâneas sem erro e sem registro órfão.

## 12. Integridade do banco

- scripts `01` e `03` a `25` rodados duas vezes sem erro (o `02`, da primeira coordenação, não entra no teste);
- a receita "rodou o `15` de novo, rode do `16` em diante" foi conferida;
- simulação: povoar, recusar o segundo povoamento e limpar sem rastro;
- cópia e restauração num banco novo conferem linhas, regras (53), gatilhos (36, com o do `25`) e verificações (145);
- corridas: foto × exclusão, 40 links ao mesmo tempo e entrega no mesmo lote, todas sem dado inconsistente;
- o `00_verificar.sql` aponta o `25` quando ele falta. Isso foi conferido lendo o código; nenhum teste roda o verificar sem o `25`.

## 13. Validação dos indicadores e relatórios

- Os 4 cartões da Visão geral, as metas, o cronograma e o relatório de execução usam a mesma conta (`feito()`), que foi conferida contra o SQL independente (seção 7).
- O relatório de execução conta até a data final do período.
- A seção 2 do relatório (biofábricas) tem contagem própria e descritiva: biofábricas com os 8 passos, sobre todas as cadastradas, incluídas as de apoio. Passou a exigir os 8 passos (F7) e é conferida no `metas.js`.
- Os previstos do painel mostram as duas referências.
- Prazo vencido e prestação de contas seguem o TED.

## 14. Falhas identificadas

| Id | Categoria | Módulo | Gravidade | Descrição | Reprodução | Esperado | Observado | Evidência | Correção | Situação |
|---|---|---|---|---|---|---|---|---|---|---|
| F1 | Regra de negócio / indicador | Formação, Metas 3 e 5 | Alta | Capacitação ou dia de campo com data passada contava mesmo sem participante (atividade que não aconteceu e ninguém apagou) | atividade de ontem sem participantes | não contar; avisar | contava na 3.2/5.1 | auditoria_1510.test.js; metas.js | `realizada()`: participantes > 0 ou lista de presença; selo e aviso (decisão da coordenação) | corrigida |
| F2 | Regra de negócio / indicador | Biofábricas, Meta 2 | Alta | Só a caixa "em funcionamento" bastava para contar | marcar só a última caixa | recusar; não contar | aceitava e contava | auditoria_1510.test.js; test_banco (25); metas.js | `unidadePronta()` + validação na tela + gatilho `b_unidade_passos` (script 25) | corrigida |
| F3 | Planejamento / indicador | Visão geral | Média | Previsto só pelas janelas do TED; o cronograma da equipe não estava no sistema e o painel acusava atraso falso (ex.: acompanhamento previsto desde jul/2026, mas a equipe começa em fev/2027) | painel em out/2026 | mostrar as duas referências | uma só, com "abaixo do previsto" | auditoria_1510.test.js (previsto) | `CRONOGRAMA_EQUIPE` e `eq` por etapa; dois traços; ritmo pela equipe; prazo e contas pelo TED (decisão da coordenação) | corrigida |
| F4 | Acessibilidade (2.5.3) | Mapa | Média | Botões da biofábrica (v82) com nome acessível sem o texto visível | axe | nome com o texto visível | não tinha | acessibilidade.js | nome começa pela sigla; lista sem `aria-label` | corrigida |
| F5 | Acessibilidade (1.4.12) | Painel, Financeiro, Distribuição, Equipe, Aparência | Baixa | Com espaçamento ampliado a 320 px: corte e rolagem de 2 a 27 px | acessibilidade.js | sem corte | 8 casos | acessibilidade.js | quebras de linha em botão, números, selos, e-mail e cabeçalho | corrigida |
| F6 | Cadastro | Unidades produtivas | Média | Território Sertão do Apodi ausente (o cronograma atende Apodi) | lista de territórios | Apodi presente | ia para "Outro" | auditoria_1510.test.js | `TERRITORIOS` | corrigida |
| F7 | Relatório | Relatórios, seção 2 | Baixa | Contava "em funcionamento" pela caixa solta | relatório | 8 passos | caixa solta | metas.js ("Relatório, seção 2") | `nCheck = 8` | corrigida |
| F8 | Cobertura de testes | Perfis Auxiliar e Formador | Média | Nenhum teste ponta a ponta exercitava esses perfis (desde a v75) | — | cobertos | ausentes | — | incluídos em seguranca, acessibilidade, teclado e simulacao | corrigida |
| F9 | Cobertura de testes | Banco | Média | Acesso por perfil testado só em pontos soltos | — | matriz completa | ausente | — | `test_matriz_perfis.sql` (102 combinações) | corrigida |
| F10 | Cobertura de testes | Indicadores | Média | Indicadores sem conferência independente dos dados | — | SQL à parte | ausente | — | `conferir_metas.sql` e `.js` no `testar.sh` | corrigida |

## 15. Correções realizadas

**Código:**
- `js/regras.js`: `realizada`, `unidadePronta`, validação dos passos, aviso de atividade sem participantes, previsto da equipe;
- `js/dados.js`: `CRONOGRAMA_EQUIPE`, `eq`, Sertão do Apodi;
- `js/app.js`: painel, metas, marcos, cronograma, Formação, mapa, relatório e textos de ajuda;
- `css/app.css`: dois traços, barra da equipe, 1.4.12.

**Banco:**
- `supabase/25_meta2_e_atividades.sql` (novo);
- `00_verificar.sql`.

**Testes:**
- novos: `testes/unit/auditoria_1510.test.js`, `supabase/tests/test_matriz_perfis.sql`, `conferir_metas.sql/.js`;
- atualizados: `regras.test.js`, `metas.js`, `simulacao.js`, `seguranca.js`, `acessibilidade.js`, `teclado.js`, `testar.sh`, `carga/preparar.sh`.

**Documentação:** `CLAUDE.md`.

## 16. Regressão

Cada falha tem teste.

**Uma regressão desta rodada foi pega antes de publicar:** a primeira tentativa de corrigir o cabeçalho a 320 px (`min-width:0`) piorou a rolagem de 2 para 47 px e foi desfeita.

**Testes afetados pelas decisões da coordenação, ajustados:**
- `regras.test.js`: "em funcionamento" agora exige os 8 passos;
- `metas.js`: a observação "aceita sem os passos" virou conferência de recusa.

A rodada final completa (seção 6) foi feita depois de todas as correções.

## 17. Cobertura de código

Testes de unidade (`node --test --experimental-test-coverage`):

| Arquivo | Linhas | Ramos | Funções |
|---|---:|---:|---:|
| `js/regras.js` | 97,4% | 86,6% | 96,7% |
| `js/dados.js` | 100% | 66,7% | 100% |
| `js/` e `ferramentas/` carregados pelos testes | 94,5% | 81,3% | 83,9% |

As telas (`js/app.js`) são cobertas pelos testes ponta a ponta, sem medida de linha.

## 18. Riscos residuais

- **P1 — data do funcionamento da biofábrica: resolvido na v85** (decisão da coordenação). Script `26`: a data é obrigatória ao marcar "Em funcionamento" e não pode ser no futuro; a meta e o relatório contam a unidade só a partir dela. Cadastro antigo sem data continua contando e aparece em "O que pede atenção" até a data ser informada. Testes: `auditoria_1510.test.js`, `test_banco.sql` e `metas.js`.
- **P2 — quais unidades contam na Meta 2: resolvido** (decisão da coordenação). Contam São Paulo do Potengi e Mulungu, como já está no cadastro. A de Apodi (campus) não é financiada pelo TED: fica como unidade de apoio, que é um acréscimo e não conta na meta. Nada a mudar no cadastro. Na demonstração, ela passou para o território Sertão do Apodi.
- **P3 (baixa, decisão) — curso FIC.** O curso FIC em bioinsumos (item 3.4.1 do cronograma) não tem registro próprio. Pode ser registrado como entrega da etapa 3.1, se a coordenação concordar.
- **P4 (registro) — datas da parcela e da vigência.** Ficam as do sistema: 1ª parcela em 22/09/2026 (data da NS) e vigência até 30/07/2027. O cronograma diz 01/10/2026 e 31/07/2027.
- **P5 — teste com pessoas e aparelhos reais.** Sem teste com pessoas da equipe; sem Safari e iPhone reais.
- **P6 — aviso AAA de foco** a 390 px (seção 8).
- **P7 — demandas prioritárias.** As demandas prioritárias do diagnóstico não têm campo estruturado; vão no documento da entrega 1.1. Mantido desde a v69.
- **O1 (baixa) — leitura de entregas por qualquer perfil.** Lotes e distribuições podem ser lidos por qualquer perfil, sem nome (seção 10).

## 19. Plano de correção priorizado

1. Rodar no Supabase `supabase/25_meta2_e_atividades.sql`, depois `26_data_funcionamento.sql`, depois o `00_verificar.sql`. **Sem isso, a trava da Meta 2 vale só na tela, e a data de funcionamento não é gravada.**
2. Decidir P3 (curso FIC).
3. Sessão de uso com 2 bolsistas no celular (P5).

## 20. Parecer

**B — APTO COM RESSALVAS.**

Os requisitos essenciais das seis metas são atendidos e os testes críticos passaram, incluindo:
- os indicadores conferidos contra SQL independente;
- a matriz de acesso;
- a segurança nos 5 perfis;
- a carga sem erro.

Não há falha crítica ou alta pendente.

**Ressalvas:**
- os scripts `25` e `26` precisam ser rodados no banco de produção;
- a decisão P3 é da coordenação (P1 e P2 resolvidas na v85);
- falta teste com usuárias e usuários reais e com Safari/iPhone.

A ausência de erros nos testes automáticos não prova ausência de falhas: a cobertura e os limites estão nas seções 3 e 17.

## 21. Adendo: versões 85 a 90 (15/10/2026, à tarde)

Revisão independente das mudanças da v85 à v89 (data de funcionamento, cadastro no padrão do M&Q, desligamento e substituta, documento das entregas, iPad em pé, cargo do acompanhamento). Nada crítico ou alto.

| Achado | Nível | Correção (v90, script `29`) |
|---|---|---|
| Qualquer bolsista apagava, pela API, o documento ligado à entrega de outra pessoa | Médio | Bolsista só apaga arquivo solto (sem entrega apontando para ele); a coordenação apaga qualquer um |
| Entrega excluída deixava o documento na pasta | Baixo | Excluir a entrega apaga o documento junto |
| Data de funcionamento podia ser apagada depois de informada | Baixo | Banco e tela recusam; corrigir a data continua livre |
| Rodar o `10` sozinho depois do `23`/`24`/`27` esvaziava a aba Equipe sem aviso | Baixo | `00_verificar` aponta; CLAUDE.md traz a receita (rode do `23` ao último) |
| Pessoa podia constar como substituta de si mesma | Baixo | Regra no banco |
| Manuais sem desligamento, substituta e documento | Baixo | Texto incluído e manuais gerados de novo |

Ficam como estão, por decisão consciente: o SEAB/MDA vê o **nome** do arquivo anexado (não o arquivo) — evite dado pessoal no nome; o cadastro novo de uma função se liga sozinho à última pessoa desligada sem substituta.

Regressão da v90: unitários 64; banco (inclui o `29`, a matriz de acesso, as metas tela × SQL e as novas conferências do `00_verificar` para o `10`, `26` e `27` rodados fora de ordem); estresse; desempenho; fumaça; robustez; metas 141; simulação; aparência; evidências; trazidos 1 e 2; auditoria 12/10; teclado (1280 e 390); cadastro e entregas; tipografia (normal, sol, escuro); acessibilidade 105/0; segurança 113/0. Tudo passou. Safari de verdade no iPad continua sem teste automático.
