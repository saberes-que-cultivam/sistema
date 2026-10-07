# Saberes que Cultivam — regras para quem mexe neste repositório

- Este repositório é **público**. Nunca grave aqui dado real de agricultor, e-mail de pessoa, senha, chave `secret`/`service_role` nem cópia de segurança. Exemplos são sempre fictícios e marcados como exemplo.
- Depois de mudar qualquer arquivo em `js/` (menos `config.js`), rode `node ferramentas/montar.js` (gera `js/tudo.js`) e suba o número em `VERSAO` no `sw.js`.
- Antes de enviar: `npm test`. Se mexeu em `supabase/`, rode também `npm run test:banco` e `npm run test:estresse` (precisam de PostgreSQL local).
- Dado pessoal de agricultor nunca chega ao perfil Acompanhamento (SEAB/MDA): o corte é feito no banco (`05_acompanhamento.sql`), não na tela. Campo novo em `agricultores` ou `visitas` só entra nas funções `*_anonimos`/`*_anonimas` se não identificar ninguém.
- Mudou tela ou fluxo: rode o teste de fumaça (`testes/automaticos/fumaca.js`, instruções no começo do arquivo).
- Tipografia: Manrope em tudo e Lora só no nome da marca. Nenhum componente define tamanho de letra solto: use as variáveis `--t-*` do `css/app.css` (`--t-hero` é só da chamada da tela de entrada; `--t-num` é só do percentual grande no cabeçalho do painel e do financeiro). Mexeu em tela ou em CSS: rode `npm run test:tipografia` (confere 390 e 1440 px: escala, mínimo de 12 px, texto cortado, itálico, maiúsculas e contraste).
- Banco: scripts numerados em `supabase/`, sempre possíveis de rodar de novo sem apagar dados. Mudança no banco = script novo com o próximo número; não reescreva script que já foi rodado em produção.
- Regra que protege dado (saldo de lote, permissão por perfil) vale no banco (`supabase/`) **e** na tela (`js/regras.js`). A tela avisa, o banco garante.
- Números do plano de trabalho (etapas, rubricas, parcelas) ficam só em `js/dados.js`; os testes conferem que fecham em R$ 400.000,00.
- O sistema é pequeno de propósito (equipe de 3 a 4 pessoas, 11 meses). Antes de criar módulo novo, pergunte se uma coluna ou um aviso no painel não resolve.
- Este sistema usa a mesma arquitetura do `mulheres-e-quintais/sistema`, mas é independente: nada daqui escreve naquele repositório nem usa o banco dele.
