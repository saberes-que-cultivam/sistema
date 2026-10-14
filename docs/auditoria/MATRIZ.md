# Matriz de rastreabilidade das seis metas — auditoria formal de 14/10/2026

Referência: Minuta do Plano de Trabalho Universal do TED, versão 4 (07/10/2026), e Plano de Trabalho do TED assinado em 17/07/2026 (metas, etapas e datas que o sistema segue).
Situação: **atende** (há função e teste que passou), **atende após correção** (falha encontrada nesta auditoria e corrigida), **parcial** (apoio limitado, registrado como pendência), **fora do sistema** (é feito em outro lugar), **decisão** (precisa da coordenação).

Arquivos de teste citados: `testes/automaticos/metas.js` (fluxos pela tela, 130 conferências), `testes/unit/*.test.js` (52 testes), `supabase/tests/test_banco.sql` (banco com regras de acesso), `testes/automaticos/fumaca.js`, `evidencias.js`, `seguranca.js`, `acessibilidade.js`, `supabase/tests/carga/`.

## Meta 1 — Diagnóstico territorial e planejamento (1 relatório técnico)

| Requisito | Funcionalidade no sistema | Cenário de teste | Resultado esperado | Risco | Evidência | Situação |
|---|---|---|---|---|---|---|
| Cadastro e caracterização dos agricultores | Aba Unidades produtivas (nome, comunidade, município/UF, culturas, linha de base com gasto mensal, kit) | Cadastro, campos obrigatórios, número no formato brasileiro, edição | Grava; recusa obrigatório vazio, texto em campo numérico e número negativo | Médio | metas.js (“Cadastro”, “150,50 vira 150.5”) | atende |
| Produto: relatório de diagnóstico | Registro da entrega na etapa 1.1 (aba Entregas, com link do documento) | Entrega com data futura | Não conta como entregue até a data chegar | Alto | metas.js; regras.test.js “o que tem data depois…” | atende após correção (F01) |
| Demandas prioritárias, planejamento das ações | Não há módulo; o diagnóstico é um documento externo ligado por link | — | — | Baixo | Inspeção do código | parcial (P7) |
| Relatório a partir dos dados | Aba Relatórios (período, seções 1 a 10), CSV por cadastro | Totais do relatório x registros; CSV x cadastro | Iguais | Alto | metas.js “Relatório…”, “CSV…” | atende |

## Meta 2 — Duas unidades de produção implantadas e em funcionamento

| Requisito | Funcionalidade | Cenário | Esperado | Risco | Evidência | Situação |
|---|---|---|---|---|---|---|
| Cadastro individual, localização, parceiro | Aba Biofábricas (sigla única, modelo, município, parceiro institucional) | Sigla repetida, sigla inválida | Recusa | Médio | regras.test.js; metas.js | atende |
| Situação de implantação | 8 passos (local, parceiro, termo, itens, orçamento, entrega, montagem, funcionamento) | Unidade só cadastrada; com parte dos passos | Não conta para a 2.1 | Alto | metas.js “Meta 2…” | atende |
| Contar só a unidade em funcionamento | `feito('2.1')` = “conta para a Meta 2” + “em funcionamento” | Unidade de apoio em funcionamento | Não conta | Alto | regras.test.js; metas.js | atende |
| Ordem dos passos | Não é exigida: só “em funcionamento” marcado já conta | Marcar só o último passo | — | Médio | metas.js (observação) | decisão (P1) |
| Equipamentos e materiais | Aba Biofábricas, itens de cada unidade (sem valor para o SEAB/MDA) | SEAB/MDA lê itens | Sem valor e sem rubrica | Médio | test_banco.sql (20) | atende |
| Evidências de implantação | Histórico de alterações (coordenação) e link nas entregas | — | — | Baixo | — | parcial |

## Meta 3 — Cinco capacitações; kits de apoio

| Requisito | Funcionalidade | Cenário | Esperado | Risco | Evidência | Situação |
|---|---|---|---|---|---|---|
| Atividade formativa (data, local, tema, participantes) | Aba Formação | Obrigatórios, mulheres > participantes, números inteiros | Recusa | Médio | regras.test.js; metas.js | atende |
| Distinguir planejada de realizada | Pela data: com data futura aparece “agendada” e não conta | Capacitação amanhã e em +30 dias | 3.2 conta só a já feita | **Crítico para a meta** | metas.js; regras.test.js | atende após correção (F01) |
| Cancelada não conta | Não há situação “cancelada”; a atividade cancelada é excluída | — | — | Médio | Inspeção | decisão (P2) |
| Lista de presença sem duplicidade | Lista por atividade; nome repetido (maiúsculas e espaços) é recusado | Nome duplicado | Recusa | Médio | metas.js; evidencias.js | atende |
| Fotos (evidência) | Fotos por atividade, pasta privada, data da foto conferida | Arquivo que não é imagem, data futura | Recusa | Alto | evidencias.js; seguranca.js | atende |
| Kits de apoio (3.3) | Marca e data do kit na unidade produtiva | Kit com data futura | Não conta até a data | Médio | metas.js | atende após correção (F01) |
| Conteúdo de cada kit | Não registrado | — | — | Baixo | Inspeção | parcial (P3) |
| Formadores | Função “formador(a)” na equipe; bolsa paga contada (i16) | — | — | Baixo | test_banco.sql (17) | atende |

## Meta 4 — Trinta unidades produtivas acompanhadas

| Requisito | Funcionalidade | Cenário | Esperado | Risco | Evidência | Situação |
|---|---|---|---|---|---|---|
| Produção com tipo, data, quantidade e medida | Aba Lotes (código automático, tipo, medida, dias até ficar pronto) | Quantidade zero, dias fora de 0–730 | Recusa | Médio | regras.test.js | atende |
| Distribuição coerente com a produção | Saldo do lote; só lote “Pronto”; data não antes do início nem no futuro | Acima do saldo, lote maturando, data antes do lote, +5 dias | Recusa (tela e banco) | **Crítico** | metas.js; test_banco.sql; carga (corrida de 50 clientes no mesmo lote: saldo final 0, nunca negativo) | atende |
| Lote não volta atrás | Lote com entrega não deixa de estar pronto nem fica menor que o entregue | — | Recusa | Alto | regras.test.js | atende |
| Acompanhamento sem dupla contagem | `acompanhada()` por unidade produtiva | 2 entregas e 3 visitas na mesma | Conta 1 | **Crítico** | metas.js | atende |
| Sequência entrega → visita | Visita no dia da primeira entrega ou depois | Visita antes da entrega | Não conta | **Crítico** | metas.js; regras.test.js | atende após correção (F02, F05) |
| Visita com data válida | Data até amanhã (fuso), na tela e no banco | Visita em +30 dias | Recusa | Alto | metas.js; test_banco.sql (22) | atende após correção (F03) |
| Histórico das alterações | Aba Histórico (quem, quando, o que mudou, campo a campo) | Linha forjada no histórico | Mostrada sem executar nada | Médio | seguranca.js | atende após correção (F06) |
| Receitas, composição, validade | Não existem | — | — | — | Inspeção | não exigido sem validação da equipe |

## Meta 5 — Avaliação e validação participativa

| Requisito | Funcionalidade | Cenário | Esperado | Risco | Evidência | Situação |
|---|---|---|---|---|---|---|
| Comparação ao longo do tempo | Gasto com insumos comprados: linha de base x visita mais recente; “aplicou?” | Conta à mão | Igual (R$ 175,25 → R$ 110,00, −37%) | Alto | metas.js; regras.test.js | atende |
| Só dados já colhidos | Visita futura e atividade futura fora do indicador | Visita em +30 dias; dia de campo em +10 | Fora | Alto | metas.js | atende após correção (F01, F03) |
| Dias de campo (5.1) | Aba Formação, tipo “Dia de campo” | Data futura | Não conta | Alto | metas.js | atende após correção (F01) |
| Relatório de avaliação (5.2) | Registro de entrega com link | Data futura | Não conta | Médio | metas.js | atende após correção (F01) |
| Outros indicadores (produtividade, ambiente) | Não existem; só vigor e observações por visita | — | — | Médio | Inspeção | parcial (P5) |
| Resultado registrado x calculado x verificado | O sistema só calcula a partir do registrado; não marca validação | — | — | Médio | Inspeção | parcial (P5) |

## Meta 6 — Comunicação, gestão e prestação de contas

| Requisito | Funcionalidade | Cenário | Esperado | Risco | Evidência | Situação |
|---|---|---|---|---|---|---|
| Relatório de execução por período | Aba Relatórios; metas físicas até a data final | Período 20/08–02/10 | Só o feito até 02/10 | Alto | metas.js | atende após correção (F04) |
| Despesas por meta, rubrica e item | Aba Financeiro; importação da planilha da FUNCERN (CPF descartado) | Totais por meta = por rubrica; R$ 400.000 | Iguais | Alto | regras.test.js; plano.test.js; fumaca.js | atende |
| Registro oficial | FUNCERN | — | — | — | Texto na tela | fora do sistema |
| Exportação | CSV (Excel/LibreOffice) e cópia JSON; download vai para o histórico | Fórmula em célula; número negativo | Fórmula desarmada; número segue número | Médio | seguranca.js | atende após correção (F07) |
| Permissões | Coordenação, Equipe, SEAB/MDA (sem dinheiro, sem dado pessoal) | SEAB/MDA lê despesas, itens, nomes | Recusa no banco | **Crítico** | test_banco.sql; evidencias.js; fumaca.js | atende |
| Rastreabilidade | Histórico (só coordenação) | Equipe lê o histórico | Recusa | Alto | test_banco.sql (22) | atende |
| Produtos de comunicação (6.1) | Registro de entrega com link | — | — | Baixo | — | atende |
