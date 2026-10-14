# Relatório da auditoria formal — Saberes que Cultivam (14/10/2026, versão sqc-v69)

Roteiro seguido: "Auditoria completa, testes automatizados e validação para produção" (documento da coordenação). Referência: Minuta do Plano de Trabalho Universal v4 (07/10/2026) e TED assinado (17/07/2026). Todos os dados usados são fictícios e marcados "(exemplo)". Nada foi testado contra o banco real do Supabase nem contra o site publicado com tráfego de ataque.

## 1. Resumo executivo

A auditoria encontrou **3 falhas altas nas contagens das metas** (atividade, kit ou entrega com data futura contava como realizada; visita feita antes da entrega contava como acompanhamento; visita podia ter data no futuro), 1 média no relatório (metas físicas ignoravam a data final do período), 1 média de desempenho no banco, 1 vulnerabilidade baixa e latente de XSS no Histórico e 7 problemas de acessibilidade. Todas foram corrigidas e testadas de novo. Nenhuma falha crítica de segurança ou de permissão foi encontrada. Restam pendências que dependem de decisão da coordenação (seção 19) e verificações que só se fazem com aparelho e pessoas reais.

**Classificação: B — APTO COM RESSALVAS**, condicionada a (1) rodar no Supabase os scripts 19 a 22 e o `00_verificar.sql` sem nenhum aviso; (2) a coordenação aceitar formalmente as pendências da seção 19; (3) um teste em celular real (GPS, foto, uso sem internet). Sem esses três passos, a classificação honesta é D (inconclusivo) para o ambiente de produção.

## 2. Arquitetura e tecnologias

- Site estático (HTML, CSS e JavaScript sem framework), publicado no GitHub Pages, instalável no celular (service worker, cópia para uso sem internet por até 72 h, fila de envios em IndexedDB).
- Banco: Supabase (PostgreSQL com regras de acesso por linha, Storage privado `evidencias`, login por e-mail e senha). Biblioteca `supabase-js` 2.117.2 guardada no repositório.
- 23 scripts SQL numerados e repetíveis (`supabase/00` a `22`); cerca de 2.900 linhas de JavaScript próprio e 1.300 de CSS.
- Perfis: Coordenação, Equipe (bolsistas) e Acompanhamento (SEAB/MDA, sem dinheiro e sem dado pessoal). Modo demonstração sem servidor, usado nos testes.

## 3. Escopo e limitações

Coberto: regras de negócio das seis metas, telas dos três perfis, banco com as regras de acesso (PostgreSQL 16 local com simulação do Supabase), carga e concorrência no banco, segurança do cliente, acessibilidade automatizada, refluxo e teclado.
Não coberto (limitação do ambiente, não declarado como aprovado): leitores de tela reais (NVDA, TalkBack, VoiceOver); Safari/iOS e aparelhos Android reais; latência e limites do plano gratuito do Supabase; cabeçalhos do site publicado (o acesso ao endereço foi bloqueado pelo ambiente de testes); testes de usabilidade com pessoas da equipe.

## 4. Matriz de rastreabilidade

Ver [`MATRIZ.md`](MATRIZ.md): requisito, meta, funcionalidade, cenário, resultado esperado, risco, evidência e situação, meta a meta.

## 5. Testes planejados e executados

| Suíte | O que verifica | Arquivo |
|---|---|---|
| Unidade | regras, cálculos, plano (R$ 400.000), importação da FUNCERN, fila | `testes/unit/*.test.js` (`npm test`) |
| Metas (novo) | fluxos das seis metas pela tela, limites, valores inválidos, relatório e CSV x registros | `testes/automaticos/metas.js` |
| Banco | regras de acesso por perfil, gatilhos, scripts rodados duas vezes, cópia e restauração | `supabase/tests/testar.sh` (`npm run test:banco`) |
| Estresse do banco | volume 10×, corridas conhecidas | `npm run test:estresse` |
| Carga (novo) | pgbench: 50, 100 e 20 clientes; corrida no mesmo lote | `supabase/tests/carga/` |
| Segurança (novo) | XSS em todos os formulários e dados forjados, CSV, fotos, sessão, exportação | `testes/automaticos/seguranca.js` |
| Acessibilidade (novo) | axe-core WCAG 2.2 AA em 38 telas × 2 larguras × 3 modos; refluxo, espaçamento, foco, alvos | `testes/automaticos/acessibilidade.js` |
| Fumaça, robustez, teclado, tipografia, evidências e anteriores | fluxos gerais, rede ruim, teclado em 1280 e 390 px, escala de letra em 5 larguras e 3 modos | `testes/automaticos/` |

## 6. Aprovados, reprovados e bloqueados (rodada final, v69)

| Suíte | Resultado |
|---|---|
| Unidade | 52 aprovados, 0 reprovados |
| Metas | 130 conferências aprovadas, 0 reprovadas (antes das correções: 118 e 14) |
| Banco | todos aprovados; cópia e restauração conferem |
| Estresse do banco | todos aprovados |
| Segurança | 95 aprovados, 0 reprovados (antes: 94 e 1) |
| Acessibilidade | 88 aprovados, 1 reprovado (7 casos de espaçamento a 320 px; antes: 82 e 10) |
| Fumaça, robustez, entrada pelo teclado, auditoria 12/10, trazidos M&Q 1 e 2, evidências, teclado 1280 e 390 px, tipografia normal/sol/escuro | todos aprovados |
| Bloqueados | `npm audit` (o projeto não tem dependências instaladas por npm); cabeçalhos do site publicado |

## 7. Resultados funcionais e de integração

Confirmado: campos obrigatórios; número no formato brasileiro; recusa de negativos e de texto em campo numérico; saldo de lote na tela e no banco; só lote pronto é distribuído; distribuição não antes do lote nem no futuro; lote com entrega não volta atrás; lista de presença sem nome repetido; unidade de apoio não conta na Meta 2; mesma unidade produtiva com várias entregas conta uma vez; relatório por período exclui o que está fora; CSV bate com os registros; visão do SEAB/MDA igual às contas, sem dado pessoal. As falhas estão na seção 14.

## 8. Acessibilidade (WCAG 2.2 AA)

axe-core: nenhuma violação séria ou crítica, nenhuma de contraste nos modos claro, escuro e sol. Corrigidas: tela de entrada sem região principal; títulos pulando nível (Relatórios e Dados); 11 tabelas com o mesmo nome; botões Editar/Excluir saindo 11 px da tela em 390 px; textos cortados com espaçamento ampliado (aba "Primeiro acesso", botão "Escuro", indicadores financeiros); aba focada pelo Tab escondida na barra lateral do celular; foco escondido sob o menu fixo; cartão "Vaga aberta" sem nome.
Residual (1.4.12, só a 320 px com espaçamento de texto forçado): 7 casos nos indicadores do Financeiro, no cronograma do painel e na tabela da Distribuição (rolagem de 2 a 27 px). Sem espaçamento forçado, nenhuma tela rola de lado em 320 px.
Não comprovado por automação: experiência com leitor de tela, ordem de leitura, clareza das mensagens. Não se declara conformidade integral.

## 9. Usabilidade

Avaliação heurística (não houve teste com pessoas; nenhum resultado com usuário foi inventado). Tarefas do roteiro percorridas pela tela no `metas.js`: registrar diagnóstico (entrega 1.1), cadastrar biofábrica, registrar capacitação com lista e fotos, registrar lote e distribuição, visita de monitoramento, relatório de execução. Achados e ajustes: atividade com data futura agora aparece como "agendada" na Formação e "kit previsto para…" na unidade produtiva (antes parecia realizada); os textos "Como é calculado" explicam a regra da data. Recomendação: sessão de 30 minutos com 2 bolsistas fazendo essas tarefas no celular, medindo conclusão e dúvidas.

## 10. Segurança e privacidade (OWASP / LGPD)

Vulnerabilidade: V1, Histórico mostrava o tipo de ação sem escapar (XSS, baixa, não explorável hoje: ninguém grava no histórico e a política de conteúdo bloqueia o script). Corrigida.
Endurecimento aplicado: datas na tela só com dígitos; célula de CSV começando com quebra de linha desarmada e número negativo volta a ser número; cópia offline vencida (72 h) apagada; o sistema não abre dentro de moldura de outro site; `referrer` desligado.
Verificado como seguro: XSS por todos os formulários, pela planilha da FUNCERN e por dados forjados em todas as telas; links `javascript:` recusados; fotos (HTML disfarçado, SVG, arquivo vazio, data futura, imagem gigante); sessão (saída apaga a cópia; 15 min de inatividade; token do link de cadastro sai do endereço); SEAB/MDA sem nomes, CPF, listas, fotos ou dinheiro; `supabase-js` 2.117.2 sem aviso de vulnerabilidade conhecido.
LGPD: a equipe pode baixar a cópia completa com nomes (por desenho, e o download fica no Histórico); a fila offline guarda nomes no aparelho até enviar. Ambos devem constar do manual e do termo da equipe.

## 11. Desempenho, carga e estresse

PostgreSQL 16 local, 2 vCPU, volume 10× o esperado (330 unidades produtivas, 6.600 visitas, 5.000 despesas, 25.000 linhas de histórico), cada pedido como o Supabase faz (papel autenticado e regras de acesso ligadas). Detalhes em `supabase/tests/carga/RESULTADOS.md`.

| Cenário | Clientes | Transações/s | Erros | Abrir o sistema (Equipe) p50/p95/p99 | Gravar p50/p95/p99 |
|---|---|---|---|---|---|
| Carga 60 s | 50 | 24,8 | 0 | 8,7 / 10,5 / 10,7 s | 128 / 244 / 305 ms |
| Pico 30 s | 100 | 25,2 | 0 | 15,9 / 22,7 / 23,5 s | 305 / 608 / 785 ms |
| Duração 5 min | 20 | 22,1 | 0 | 4,1 / 4,8 / 5,2 s | 42 / 80 / 108 ms |
| Ritmo de gente | 50 | 2,7 | 0 | 0,39 / 0,61 / 0,80 s | 8 / 22 / 27 ms |
| Corrida no mesmo lote | 50 | 477 | 0 | — | saldo final 0, nunca negativo |

Os cenários sem pausa (50 e 100 clientes abrindo o sistema sem parar) são muito acima do uso real (3 a 4 pessoas e o SEAB/MDA). No ritmo de uso humano, o banco responde em menos de 1 s. A leitura do Histórico deixava de usar o índice por causa da regra de acesso: corrigido no script 22 (22 ms → 2 ms). Ressalva: o Supabase gratuito tem rede (50 a 200 ms por pedido), CPU compartilhada e menos conexões; os tempos reais serão maiores.

## 12. Integridade do banco

Chaves, campos obrigatórios e verificações conferidos pelos testes; scripts rodados duas vezes sem erro; corridas conhecidas (foto x exclusão, 40 links ao mesmo tempo, distribuição concorrente) sem dado inconsistente; cópia e restauração em banco novo conferem linhas, regras, gatilhos e verificações. Achado de operação: rodar o 15 de novo desfaz partes do 16, 17, 20 e 22. O `00_verificar.sql` aponta cada caso e o teste do banco agora confere a receita "rodou o 15, rode do 16 ao último".

## 13. Indicadores e relatórios

Todas as contas das metas (cartões, cronograma, lista de metas, avisos, relatório, CSV e visão do SEAB/MDA) foram conferidas contra os registros de origem e entre si. Regra adotada e documentada: registro com data depois de hoje é planejado e não conta; o relatório conta até a data final do período; unidade produtiva acompanhada = recebeu bioinsumo e teve visita no dia da primeira entrega ou depois. O indicador de gasto da Meta 5 foi reproduzido à mão.

## 14. Falhas identificadas

| Id | Categoria | Módulo | Gravidade | Descrição | Reprodução | Esperado | Observado | Evidência | Correção | Situação |
|---|---|---|---|---|---|---|---|---|---|---|
| F01 | Regra de negócio | Metas 1, 3, 5, 6 | Alta | Registro com data futura contava como realizado | Capacitação para amanhã e para +30 dias | 3.2 = 1 | 3.2 = 3; participantes 62 em vez de 32 | metas.js | `feito()` e `indicadores()` contam até hoje (`js/regras.js`) | corrigida |
| F02 | Regra de negócio | Meta 4 | Alta | Visita antes da entrega contava como acompanhamento | Entrega em −50 dias, visita em −55 | Não conta | Contava | metas.js | `acompanhada()` exige visita no dia da 1ª entrega ou depois | corrigida |
| F03 | Validação | Metas 4 e 5 | Alta | Visita aceitava data futura e entrava nas contas | Visita em +30 dias | Recusa | Gravava | metas.js; test_banco.sql | `validar()` e gatilho `b_visita_data` (script 22) | corrigida |
| F04 | Relatório | Meta 6 | Média | Metas físicas do relatório ignoravam a data final | Período 20/08–02/10 | 3.2 = 1 | 3.2 = 3 | metas.js | relatório usa `feito(db, e, data final)` | corrigida |
| F05 | Consistência | Meta 4 | Baixa | Aviso e contagem com regras diferentes | igual a F02 | Mesma regra | Divergiam | metas.js | mesma regra de F02 | corrigida |
| F06 | Segurança (A03) | Histórico | Baixa, latente | Tipo de ação sem escape | Linha de histórico forjada no modo demonstração | Texto | Script executado | seguranca.js | `esc()` | corrigida |
| F07 | Exportação | Dados | Baixa | CSV: célula iniciando com quebra de linha não desarmada; negativos saíam como texto | Valor `\n=1+1`, gasto −5 | Desarmado; número | Não; `'-5` | seguranca.js | regex do `seguro()` | corrigida |
| F08 | Desempenho | Banco/Histórico | Média | Regra de acesso impedia o índice | EXPLAIN com 25 mil linhas | Index Scan | Seq Scan, 22 ms | carga/explicar.sql | script 22 | corrigida |
| F09 | Acessibilidade | Entrada | Moderada | Sem região principal | axe | `main` | ausente | acessibilidade.js | `<main class="ent">`, rodapé `contentinfo` | corrigida |
| F10 | Acessibilidade | Relatórios, Dados | Moderada | Títulos pulando nível | axe | h1 → h2 → h3 | h1 → h3 | acessibilidade.js | níveis ajustados, mesmo visual | corrigida |
| F11 | Acessibilidade | Visão geral, Relatórios | Moderada | 11 tabelas com o mesmo nome | axe | nomes distintos | iguais | acessibilidade.js | nome pelo título da seção | corrigida |
| F12 | Refluxo (1.4.10) | Listas no celular | Média | Botões Editar/Excluir 11 px fora da tela em 390 px | Lotes em 390 px | dentro | fora | acessibilidade.js | `width:auto` na célula de ações | corrigida |
| F13 | Foco (2.4.11) | Menu de abas, listas | Média | Aba focada fora da tela; foco sob o menu fixo | Tab em 390 px | visível | escondido | acessibilidade.js; teclado.js | barra rola até a aba focada; `scroll-padding-top` | corrigida |
| F14 | Espaçamento (1.4.12) | Entrada, Aparência, Financeiro | Baixa | Textos cortados com espaçamento ampliado | 320 px + espaçamento | quebra | corta | acessibilidade.js | quebra de linha permitida | parcial (7 casos a 320 px) |
| F15 | Acessibilidade | Equipe | Baixa | "Vaga aberta" sem nome acessível | leitor | nome | sem nome | acessibilidade.js | `aria-labelledby` | corrigida |
| F16 | Operação | Banco | Média | Rodar o 15 de novo desfaz 16, 17, 20 e 22 | testar.sh | aviso | apontado só em parte | testar.sh | receita no CLAUDE.md e teste | corrigida |

## 15. Correções realizadas

`js/regras.js` (contagens com data de corte, visita futura, data só com dígitos), `js/app.js` (relatório até a data final, kits previstos, atividade agendada, escape no Histórico, CSV, títulos, nomes das tabelas, foco, proteção contra moldura), `js/api-supabase.js` (cópia vencida apagada), `index.html` (região principal, referrer), `css/app.css` (refluxo e espaçamento), `supabase/22_auditoria_1410b.sql` (visita no futuro, índice do histórico), `00_verificar.sql`, testes novos e atualizados.

## 16. Regressão

Duas regressões foram introduzidas durante as correções e pegas pela suíte antes de publicar: (a) rolar a barra de abas no foco também no toque tirava o botão de baixo do dedo (pega pela fumaça; agora só pelo teclado); (b) um comentário na mesma linha anulou a volta do foco depois de redesenhar (pega pelo teste de teclado). A rodada final completa (seção 6) foi feita depois das duas correções.

## 17. Cobertura de código

`c8` nos testes de unidade: 94% das instruções, 79% dos desvios e 77% das funções de `regras.js`, `dados.js`, `planilha.js`, `fila.js`, `api-demo.js` e `geo.js` (`regras.js`: 95% das instruções). As telas (`app.js`, `api-supabase.js`, `sessao.js`, `fotodia.js`) são cobertas pelos testes de navegador, sem medição por linha. O número de instruções é otimista porque várias regras ficam numa linha só.

## 18. Riscos residuais

1. Banco de produção sem os scripts 19 a 22 confirmados (sem eles: visita futura aceita no banco, histórico lento, Meus dados e downloads sem função).
2. Uso real em celular (GPS, câmera, iOS) não testado em aparelho.
3. Aparelho perdido sem internet expõe a cópia por até 72 h.
4. Plano v4 ainda é minuta: se mudar, `js/dados.js` muda.
5. Atividade cancelada só pode ser excluída (não há situação "cancelada").
6. Supabase gratuito: tempos maiores que os medidos; pausa por inatividade do plano gratuito.

## 19. Plano de correção priorizado

| Prioridade | Ação | Responsável |
|---|---|---|
| 1 | Rodar no Supabase os scripts 19 (se ainda não), 20, 21 e 22 e o `00_verificar.sql`; tudo "ok" | Coordenação |
| 2 | Teste em celular real: entrar, visita com localização e foto, sem internet, voltar a internet | Equipe |
| 3 | Decidir: Meta 2 exige os passos anteriores antes de "em funcionamento"? (P1) | Coordenação |
| 4 | Decidir: precisa da situação "cancelada" ou excluir basta? (P2) | Coordenação |
| 5 | Decidir se vale registrar o conteúdo dos kits (P3) e outros indicadores da Meta 5 (P5) | Coordenação e equipe técnica |
| 6 | Primeira cópia de segurança e guarda fora do repositório | Coordenação |
| 7 | Ajustar os 7 casos de espaçamento a 320 px | Desenvolvimento |
| 8 | Sessão curta de usabilidade com 2 bolsistas | Coordenação |

## 20. Parecer

O sistema conta corretamente o que o plano pede, protege o dado pessoal e o dinheiro no banco (não só na tela), aguenta com folga o uso esperado e tem testes que reproduzem cada falha corrigida. As falhas que mais importavam para a prestação de contas (planejado contando como feito, acompanhamento sem sequência) foram corrigidas. **Classificação B — apto com ressalvas**, nas três condições do resumo executivo. Não é A porque partes essenciais (banco de produção atualizado, aparelho real, leitor de tela) não puderam ser comprovadas daqui.
