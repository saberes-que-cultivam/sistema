/* Saberes que Cultivam — gera os manuais em PDF de cada perfil a partir das TELAS REAIS (modo demonstração, dados fictícios).
   Ideia trazida do Mulheres & Quintais, em versão enxuta: um manual por perfil, com o texto da própria ajuda do sistema
   (SQC.app.AJUDA) e uma captura de cada aba. Assim o manual não fica desatualizado em relação ao sistema.
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node ferramentas/manuais/gerar.js
   Saída: manuais/manual-coordenacao.pdf, manual-equipe.pdf, manual-acompanhamento.pdf
   Regra: mudou tela ou fluxo, gere de novo (depois de subir a VERSAO do sw.js: a versão sai impressa no manual). */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const RAIZ = path.join(__dirname, '..', '..'), SAIDA = path.join(RAIZ, 'manuais');
const VERSAO = (/VERSAO = '([^']+)'/.exec(fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8')) || [])[1] || '';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PERFIS = {
  coordenacao: { perfil: 'Coordenação', titulo: 'Manual da coordenação',
    papel: 'A coordenação faz tudo no sistema: registra o trabalho do projeto, lança e importa as despesas da FUNCERN, cadastra a equipe (inclusive pelo link de cadastro), cria os acessos e vê o histórico de quem mudou o quê.',
    extras: ['Cadastre o acompanhamento do SEAB/MDA em Equipe › Acompanhamento externo. Antes, use “Ver como” para conferir o que essa pessoa vai ver.',
      'Despesas: importe a planilha de solicitações da FUNCERN em Financeiro. O CPF que vem na planilha é descartado.',
      'Cópia de segurança do banco: toda semana, no seu computador (ferramentas/backup/LEIA-ME.md). O Supabase gratuito não guarda cópia.',
      '“Falta enviar”, no alto da Visão geral: quem tem lançamento guardado no celular sem enviar, e desde quando. Em vermelho, parado há mais de 2 dias.'] },
  equipe: { perfil: 'Equipe', titulo: 'Manual da equipe',
    papel: 'A equipe registra o trabalho de produção e de campo: lotes de bioinsumo, entregas, unidades produtivas, visitas, atividades de formação com lista de presença e fotos. Despesas, acessos e o cadastro da equipe são da coordenação.',
    extras: ['No campo sem sinal, registre normalmente: o lançamento fica “aguardando envio” e sobe sozinho quando a internet voltar. Fotos precisam de internet.',
      'Vai aplicar no papel? Abra o formulário novo e toque em “Imprimir em branco”.',
      'Nas observações, toque em “Falar” para ditar em vez de digitar. Revise o texto antes de salvar.',
      'No sol forte, toque no botão do sol, no alto da tela, e ligue o modo sol: letra preta em fundo branco e maior.',
      'Lançamento parado no celular aparece para a coordenação como “Falta enviar” (só a quantidade, nunca o conteúdo). Abra o sistema com internet para enviar.'] },
  acompanhamento: { perfil: 'Acompanhamento', titulo: 'Manual do acompanhamento (SEAB/MDA)',
    papel: 'O acompanhamento consulta a execução física do projeto em tempo real, sem alterar nada: metas e cronograma, biofábricas, lotes, distribuição e formação. Não aparecem nomes nem dados pessoais de agricultoras e agricultores, nem a equipe: as unidades produtivas são numeradas e as visitas aparecem sem texto livre. A parte financeira fica com a gestão do projeto. Esse corte é feito no banco de dados, não só na tela.',
    extras: ['As metas mostram o que a equipe registrou no sistema, em tempo real. O relatório oficial do projeto é o que a coordenação envia.',
      'Para trocar a sua senha: na Visão geral, no aviso “Acesso de acompanhamento”, toque em “Trocar a minha senha”.',
      'Dúvidas sobre os números: fale com a coordenação do projeto.'] }
};

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  for (const [arq, P] of Object.entries(PERFIS)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'pt-BR' });
    const p = await ctx.newPage();
    const foto = async () => 'data:image/jpeg;base64,' + (await p.screenshot({ type: 'jpeg', quality: 70 })).toString('base64');
    // tela de entrada como ela é de verdade (e-mail e senha): endereço de banco fictício, só para desenhar a tela, sem conectar
    let demoLigada = false;
    await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: demoLigada ? "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};"
      : "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'https://exemplo.invalid',supabaseAnonKey:'exemplo',semServiceWorker:true};" }));
    await p.goto(URL_); await p.waitForSelector('#auth:not([hidden])'); await p.waitForTimeout(300); const entrada = await foto();
    demoLigada = true; await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p.reload(); await p.waitForSelector('[data-demo]');
    await p.click(`[data-demo="${P.perfil}"]`); await p.waitForSelector('.dx-topo');
    const { abas, ajuda } = await p.evaluate(() => ({ abas: SQC.app.abas(), ajuda: SQC.app.AJUDA }));
    const telas = [];
    for (const [k, nome] of abas) { await p.click(`[data-tab="${k}"]`); await p.waitForTimeout(250); await p.evaluate(() => scrollTo(0, 0)); telas.push({ nome, texto: ajuda[k] || '', img: await foto() }); }
    // um formulário aberto, para quem registra
    if (P.perfil !== 'Acompanhamento') {
      await p.click('[data-tab="eventos"]'); await p.click('[data-new="eventos"]'); await p.waitForSelector('#dlg[open]');
      telas.push({ nome: 'Registrar uma atividade', texto: 'Toque em “Nova atividade”, preencha e salve. “Imprimir em branco” gera a folha para aplicar no papel. Depois de salvar, a atividade ganha os botões Lista (presença) e Fotos na tabela.', img: await foto() });
      await p.keyboard.press('Escape');
    }
    await ctx.close();
    const hoje = new Date().toLocaleDateString('pt-BR');
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
      @page{size:A4;margin:16mm 14mm} body{font:11pt/1.5 Manrope,Arial,sans-serif;color:#17241B;margin:0}
      .capa{height:250mm;display:flex;flex-direction:column;justify-content:center;gap:10px;page-break-after:always;border-left:8px solid #27663A;padding-left:18px}
      .capa .m{font:700 13pt Lora,Georgia,serif;color:#27663A} .capa h1{font-size:28pt;margin:0;line-height:1.15} .capa p{margin:0;color:#3D4B41}
      h2{font-size:16pt;margin:0 0 6px;color:#27663A} h3{font-size:12.5pt;margin:0 0 4px}
      .bloco{page-break-inside:avoid;margin-bottom:14px} ul{margin:4px 0 0;padding-left:18px}
      .tela{display:grid;grid-template-columns:62mm 1fr;gap:12px;align-items:start;page-break-inside:avoid;margin:0 0 12px;padding-top:10px;border-top:1px solid #D5DED7}
      .tela img{width:62mm;border:1px solid #C9D3CB;border-radius:6px} .rod{color:#4F5E53;font-size:9pt}
    </style></head><body>
    <section class="capa"><span class="m">Saberes que Cultivam</span><h1>${esc(P.titulo)}</h1><p>Sistema de acompanhamento do projeto · IFRN Campus Apodi · TED MDA</p><p class="rod">Versão do sistema ${esc(VERSAO)} · gerado em ${hoje} · telas do modo de demonstração, com dados fictícios</p></section>
    <div class="bloco"><h2>O seu papel</h2><p>${esc(P.papel)}</p></div>
    <div class="bloco"><h2>Entrar</h2><div class="tela" style="border:0"><img src="${entrada}" alt=""><div><p>Abra o endereço do sistema no celular ou no computador. Na primeira vez, toque em <b>Primeiro acesso</b> e informe o seu e-mail: chega um link para você criar a senha. Depois, entre com e-mail e senha.</p><p>Esqueceu a senha: “Esqueci a senha”, na mesma tela. O sistema sai sozinho depois de 15 minutos sem uso.</p><p>Dá para instalar como aplicativo: no menu do navegador, “Adicionar à tela inicial”.</p></div></div></div>
    <div class="bloco"><h2>Bom saber</h2><ul>${P.extras.map(x => `<li>${esc(x)}</li>`).join('')}<li>No rodapé de qualquer tela: <b>Ajuda desta página</b> explica a tela em que você está, e <b>Relatar problema</b> monta um texto com o que aconteceu para mandar à coordenação.</li></ul></div>
    <h2>As telas, uma por uma</h2>
    ${telas.map(t => `<div class="tela"><img src="${t.img}" alt=""><div><h3>${esc(t.nome)}</h3><p>${esc(t.texto)}</p></div></div>`).join('')}
    <div class="bloco"><h2>Dados pessoais</h2><p>O sistema segue a Lei nº 13.709/2018 (LGPD). Nome, comunidade e observações de agricultoras e agricultores, a lista de presença e as fotos só aparecem para a equipe do projeto. CPF, endereço e renda da equipe só aparecem para a coordenação. Não tire captura de tela com dado pessoal para mandar por mensagem.</p></div>
    </body></html>`;
    const pg = await b.newPage(); await pg.setContent(html, { waitUntil: 'load' });
    await pg.pdf({ path: path.join(SAIDA, `manual-${arq}.pdf`), format: 'A4', printBackground: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: `<div style="font:8pt Arial;color:#4F5E53;width:100%;text-align:center">${esc(P.titulo)} · página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`, margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' } });
    await pg.close();
    console.log(`manuais/manual-${arq}.pdf: ${telas.length} telas, ${Math.round(fs.statSync(path.join(SAIDA, `manual-${arq}.pdf`)).size / 1024)} KB`);
  }
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
