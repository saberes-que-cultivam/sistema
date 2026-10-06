# Saberes que Cultivam: sistema do projeto

Sistema web de acompanhamento do projeto **Saberes que Cultivam: Bioinsumos, Agroecologia e Fortalecimento da Agricultura Familiar na Região Nordeste** (TED MDA/IFRN, Plano de Ação 30879420260055-006262, execução pelo IFRN Campus Apodi via FUNCERN, contrato 220/2026).

## O que faz

- **Painel:** metas do plano com previsto × realizado, o que precisa de atenção, recursos do TED, cronograma físico e indicadores da Meta 5.
- **Biofábricas e itens:** as 8 etapas de implantação de cada unidade de produção e as aquisições pela FUNCERN.
- **Lotes:** um por batelada, com código gerado (sigla da unidade + tipo + sequência), maturação e saldo.
- **Unidades produtivas:** agricultores e agricultoras acompanhados, linha de base e kit.
- **Distribuição:** liga cada entrega a um lote (só lote pronto, nunca acima do saldo).
- **Monitoramento:** visitas, uso do bioinsumo e gasto com insumos comprados.
- **Formação e entregas:** capacitações, dias de campo, reuniões e evidências do plano.
- **Financeiro:** despesas por **meta/etapa** (plano do TED) e por **rubrica** (plano executado pela FUNCERN), com aviso quando uma rubrica chega a 90% ou estoura.
- **Relatórios:** relatório de execução por período, pronto para imprimir ou salvar em PDF; planilhas CSV.
- **Acessos e histórico:** três perfis e registro de quem incluiu, alterou ou excluiu cada coisa.
  - **Coordenação:** faz tudo.
  - **Equipe:** registra o trabalho de campo e de produção; não lança despesa nem cadastra acesso; só exclui o que ela mesma lançou.
  - **Acompanhamento (SEAB/MDA):** consulta em tempo real o painel, biofábricas, lotes, distribuição, atividades, entregas, financeiro e relatórios. Não grava nada e não recebe nome nem dado pessoal de agricultor (as unidades produtivas chegam numeradas, direto do banco).

Funciona no celular, pode ser instalado como aplicativo e guarda no aparelho o que for lançado sem internet (lotes, entregas, visitas, cadastros de campo), enviando quando o sinal volta. Despesas e acessos exigem conexão.

## Como está organizado

```
index.html              página única (instalável)
css/app.css             visual (claro e escuro)
js/config.js            endereço e chave pública do Supabase (vazio = modo demonstração)
js/dados.js             números do plano: etapas, rubricas, parcelas, tipos de bioinsumo
js/regras.js            contas e conferências (saldo, metas, financeiro, alertas, permissões)
js/api-demo.js          modo demonstração (sem servidor, dados de exemplo no navegador)
js/api-supabase.js      modo produção (Supabase)
js/fila.js              fila do aparelho para trabalhar sem internet
js/sessao.js            saída automática depois de 15 minutos sem uso
js/app.js               telas e navegação
js/tudo.js              GERADO por ferramentas/montar.js (não edite)
sw.js, manifest         instalação no celular e abertura sem internet
supabase/00_verificar.sql            conferência do banco (não muda nada)
supabase/01_criar_banco.sql          tabelas, regras de acesso (RLS), auditoria, login
supabase/02_primeira_coordenacao.sql primeiro acesso de coordenação (troque o e-mail antes de rodar)
supabase/03_dados_iniciais.sql       unidades e registros já conhecidos dos documentos (opcional)
supabase/04_endurecimento.sql        correções da auditoria de 06/10/2026 (obrigatório)
supabase/05_acompanhamento.sql       perfil de acompanhamento para a SEAB/MDA (obrigatório)
supabase/tests/                      testes do banco e de estresse num Postgres local
testes/desempenho/                   desempenho das contas com volume (1x, 10x e 50x)
testes/unit/                         testes de unidade (npm test)
testes/automaticos/fumaca.js         teste no navegador, em modo demonstração
```

## Colocar no ar (uma vez)

1. **Banco:** no painel do Supabase, abra *SQL Editor* e rode, nesta ordem, `01_criar_banco.sql`, `02_primeira_coordenacao.sql` (trocando nome e e-mail no começo do arquivo), `03_dados_iniciais.sql` (opcional), `04_endurecimento.sql` e `05_acompanhamento.sql`. Rode `00_verificar.sql` para conferir.
2. **Login:** em *Authentication*, deixe **Confirm email ligado** e coloque em *URL Configuration > Site URL* o endereço do sistema.
3. **Site:** no GitHub, *Settings > Pages > Deploy from a branch > main / (root)*. O endereço fica `https://saberes-que-cultivam.github.io/sistema/`.
4. **Entrar:** abra o sistema, use **Primeiro acesso** com o e-mail do passo 1, toque no link que chegar por e-mail e crie a senha na tela que abrir. As outras pessoas são cadastradas na aba *Dados > Pessoas com acesso*; cada uma faz o próprio **Primeiro acesso**.

## Desenvolver

```
node ferramentas/montar.js        # depois de mudar js/
npm test                          # testes de unidade
npm run test:banco                # testes do banco (precisa de PostgreSQL local)
npm run test:estresse             # gravações simultâneas e volume no banco de teste
npm run test:desempenho           # contas do painel com 1x, 10x e 50x o volume do projeto
node ferramentas/servidor_teste.js   # abre em http://localhost:8766
```

Para ver o modo demonstração no seu computador, esvazie `supabaseUrl` no `js/config.js` (sem enviar essa mudança).

## Limites conhecidos

- Se duas pessoas editarem o mesmo registro, a segunda a salvar recebe o aviso de que o registro mudou e refaz a alteração sobre a versão nova (nada é sobrescrito em silêncio).
- A Equipe pode alterar registros lançados por colegas (o trabalho de campo é compartilhado); fica no histórico quem alterou.
- Sem falar com o servidor há mais de 72 horas, o aparelho deixa de abrir os dados guardados e pede internet.
- As listas mostram 100 registros por vez. O sistema foi medido até 10 vezes o tamanho previsto do projeto; acima disso o relatório por período fica lento.
- Excluir registro exige internet.
- O financeiro é um espelho para acompanhamento: o registro oficial é o da FUNCERN.
- O plano gratuito do Supabase pode pausar projeto sem uso; confira no painel se o sistema parar de responder.
