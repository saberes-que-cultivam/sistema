/* Cadastro da equipe no padrão do Mulheres & Quintais, desligamento com substituta e documento das entregas do plano (15/10/2026).
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   NODE_PATH=$(npm root -g) node testes/automaticos/cadastro_e_entregas.js
   Modo demonstração; todos os dados são fictícios. Não para na primeira falha: junta tudo e mostra o resumo no fim. */
const { chromium } = require('playwright');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const CONFIG = "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};";
let falhas = 0; const ok = (c, m, x) => { if (c) console.log('ok  ' + m); else { falhas++; console.log('FALHOU: ' + m + (x ? ' — ' + x : '')); } };

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, serviceWorkers: 'block' }), p = await ctx.newPage(), erros = [];
  p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await ctx.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: CONFIG }));
  await p.goto(URL_); await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('#view');
  const db = () => p.evaluate(() => JSON.parse(JSON.stringify(SQC.app._estado().db)));
  const fechar = async () => { if (await p.evaluate(() => document.getElementById('dlg').open)) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); } };

  /* ---------- cadastro: primeiro a escolha, depois o link ou o formulário ---------- */
  await p.click('[data-tab="equipe"]'); await p.waitForTimeout(300);
  await p.click('[data-cadeq="discente"]'); await p.waitForSelector('#frm .esc');
  ok(/Como você quer fazer este cadastro\?/.test(await p.textContent('#frm')) && await p.$('#frm [data-gerarlink]') && await p.$('#frm [data-digitar]'), 'cadastrar: primeiro pergunta como fazer (link recomendado ou digitar)');
  await p.click('#frm [data-gerarlink]'); await p.waitForSelector('.conv-pronto');
  const link = await p.inputValue('#lk_txt');
  ok(/#c=[0-9a-f]{20,}/.test(link) && /Link pronto/i.test(await p.textContent('.conv-pronto')) && /Vale 7 dias e só pode ser usado uma vez/.test(await p.textContent('.conv-pronto')), 'link pronto: endereço, aviso de 7 dias e uso único');
  ok(await p.$eval('.conv-botoes a.b.p', a => /wa\.me/.test(a.href)) && !!(await p.$('[data-copiarlink]')), 'link pronto: Enviar pelo WhatsApp e Copiar link');
  await p.click('.cad-modo[data-digitar]'); await p.waitForSelector('#f_nome');
  ok(/Prefere que a pessoa preencha\?/.test(await p.textContent('#frm .cad-modo')), 'formulário: oferece trocar para o link');
  ok(await p.$eval('#f_funcao', e => e.closest('.fm-g').hidden) && /Função\s*Bolsista discente/.test(await p.textContent('#fm_faz')), 'formulário: função fixa, mostrada no quadro “Função”');
  ok((await p.textContent('#fsalvar')).trim() === 'Cadastrar', 'formulário: botão “Cadastrar”');
  ok(await p.$$eval('#frm .sn-q', l => l.length) >= 6, 'formulário: perguntas de Sim/Não em botões');
  await p.click('[data-sn="arlo"][data-v="Sim"]');
  ok(await p.$eval('#f_arlo', e => e.value) === 'Sim' && await p.$eval('.fm-g[data-semarlo]', e => e.hidden), 'Arlo = Sim esconde os dados que a FUNCERN já tem');
  await p.click('[data-sn="arlo"][data-v="Sim"]');
  ok(await p.$eval('#f_arlo', e => e.value) === '' && !(await p.$eval('.fm-g[data-semarlo]', e => e.hidden)), 'tocar de novo no Sim desmarca e mostra os dados de novo');
  const secs = await p.$$eval('#frm .fm-sec', l => l.map(x => x.textContent.trim()).filter(Boolean));
  const ordem = ['Dados pessoais', 'Perfil no campo', 'Cadastro na FUNCERN (sistema Arlo)', 'Mais dados pessoais', 'Endereço', 'Questionário socioeconômico (opcional)', 'Bolsa', 'Proteção de dados'];
  ok(JSON.stringify(secs) === JSON.stringify(ordem), 'formulário: seções na ordem dos prints', secs.join(' / '));
  await p.fill('#f_nome', 'Bolsista Nova (exemplo)'); await p.fill('#f_cpf', '000.000.001-91'); await p.fill('#f_telefone', '(84) 90000-0001'); await p.fill('#f_email', 'nova@exemplo.br');
  await p.click('[data-sn="agricultor"][data-v="Não"]'); await p.click('[data-sn="outra_bolsa"][data-v="Não"]'); await p.check('#f_lgpd'); await p.click('#fsalvar'); await p.waitForTimeout(500);
  let m = (await db()).membros.find(x => x.email === 'nova@exemplo.br');
  ok(m && m.agricultor === 'Não' && m.outra_bolsa === 'Não' && m.substitui, 'cadastro gravado com as respostas Sim/Não e ligado a quem saiu', JSON.stringify(m && { a: m.agricultor, o: m.outra_bolsa, s: m.substitui }));
  await fechar();

  /* ---------- desligar da equipe e cadastrar a substituta ---------- */
  await p.evaluate(id => document.querySelector(`[data-fichamembro="${id}"]`).click(), m.id); await p.waitForSelector('[data-desligar]');
  await p.click('[data-desligar]'); await p.waitForSelector('#dl_fim');
  await p.click('[data-salvardesl]'); ok(/motivo/.test(await p.textContent('#ferr')), 'desligar: motivo obrigatório');
  await p.fill('#dl_fim', '2020-01-01'); await p.selectOption('#dl_mot', 'Pediu para sair'); await p.click('[data-salvardesl]');
  ok(/antes do início/.test(await p.textContent('#ferr')), 'desligar: data antes do início da bolsa é recusada');
  await p.fill('#dl_fim', await p.evaluate(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }));
  await p.fill('#dl_obs', 'mudou de curso'); await p.click('[data-salvardesl]'); await p.waitForSelector('[data-substituta]');
  m = (await db()).membros.find(x => x.email === 'nova@exemplo.br');
  ok(m.fim && m.motivo === 'Pediu para sair: mudou de curso', 'desligamento gravado com data e motivo', m.motivo);
  await p.click('[data-substituta]'); await p.waitForSelector('#frm .esc');
  ok(/Cadastrar substituta/.test(await p.textContent('#frm .fm-eye')), 'depois de desligar: “Cadastrar substituta”');
  await p.click('#frm [data-digitar]'); await p.waitForSelector('#f_nome');
  ok(/Substitui\s+Bolsista Nova \(exemplo\)/.test(await p.textContent('#frm .fm-sub')), 'substituta: o formulário diz quem ela substitui');
  await fechar();

  /* ---------- entregas do plano: etapa fixa, documento anexado, tipo errado recusado ---------- */
  await p.click('[data-tab="painel"]'); await p.waitForSelector('.mts-l');
  await p.click('.mts-l li:first-child summary'); await p.click('[data-new="entregas"][data-pre="1.1"]'); await p.waitForSelector('#f_titulo');
  ok(await p.$eval('#f_etapa', e => e.closest('.fld').hidden) && /1\.1 · Diagnóstico/.test(await p.textContent('.fm-fixo')), '“Registrar entrega desta etapa”: a etapa vem fixa, sem dar para trocar');
  await p.fill('#f_titulo', 'Relatório de diagnóstico (exemplo)');
  await p.setInputFiles('#f_arquivo', { name: 'virus.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('x') }); await p.click('#fsalvar');
  ok(/tipo de arquivo não é aceito/.test(await p.textContent('#ferr')), 'documento: tipo de arquivo estranho é recusado');
  await p.setInputFiles('#f_arquivo', { name: 'relatorio.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
  ok(/relatorio\.png/.test(await p.textContent('#f_arquivo_n')), 'documento: o nome do arquivo escolhido aparece');
  await p.click('#fsalvar'); await p.waitForTimeout(500);
  const g = (await db()).entregas.find(x => x.titulo === 'Relatório de diagnóstico (exemplo)');
  ok(g && g.etapa === '1.1' && g.arquivo && g.arquivo_nome === 'relatorio.png', 'entrega gravada na etapa 1.1 com o documento', JSON.stringify(g));
  await p.click('.mts-l li:first-child summary').catch(() => {});
  const [nova] = await Promise.all([ctx.waitForEvent('page'), p.click(`[data-doc="${g.id}"]`)]); await nova.waitForTimeout(800);
  ok(/^blob:/.test(nova.url()), '“abrir o documento” abre o arquivo numa janela nova', nova.url()); await nova.close();

  /* SEAB/MDA vê que a entrega tem documento, mas não abre */
  await p.click('[data-sair]'); await p.click('[data-demo="Acompanhamento"]'); await p.waitForSelector('.mts-l');
  ok(!(await p.$('[data-doc]')), 'SEAB/MDA não tem botão para abrir documento');
  ok(!erros.length, 'sem erro de script', erros.join(' | '));
  await b.close();
  console.log(falhas ? `\nCADASTRO E ENTREGAS: ${falhas} FALHOU` : '\nCADASTRO E ENTREGAS: TUDO CERTO'); process.exit(falhas ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE: ' + e.message); process.exit(2); });
