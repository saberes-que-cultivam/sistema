/* Funcionalidades trazidas do Mulheres & Quintais (12/10/2026): máscaras, ditado por voz e prazo nas chamadas ao servidor.
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/trazidos_mq.js */
const { chromium } = require('playwright');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const ok = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('ok  ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'pt-BR' });
  // reconhecimento de fala de mentira: "diz" uma frase quando começa
  await ctx.addInitScript(() => { window.SpeechRecognition = class { start() { setTimeout(() => this.onresult && this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'composto pronto vírgula sem cheiro ponto final' }], { isFinal: true })] }), 20); }
    stop() { setTimeout(() => this.onend && this.onend(), 5); } }; });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', e => erros.push(String(e)));
  await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await p.goto(URL_); await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('.dx-topo');
  // máscaras no cadastro da equipe
  await p.click('[data-tab="equipe"]'); await p.click('[data-cadeq]'); const digitar = await p.$('#frm button:has-text("Digitar")'); if (digitar) await digitar.click();
  await p.waitForSelector('#f_cpf');
  await p.type('#f_cpf', '52998224725'); ok(await p.inputValue('#f_cpf') === '529.982.247-25', 'CPF ganha pontos e traço enquanto digita');
  await p.type('#f_telefone', '84999990000'); ok(await p.inputValue('#f_telefone') === '(84) 99999-0000', 'celular ganha DDD entre parênteses');
  await p.fill('#f_telefone', ''); await p.type('#f_telefone', '+55 84 99999-8888'); ok(await p.inputValue('#f_telefone') === '(84) 99999-8888', 'celular com +55 na frente não estraga (auditoria 13/10)');
  await p.fill('#f_telefone', '084 99999-8888'); await p.dispatchEvent('#f_telefone', 'input'); ok(await p.inputValue('#f_telefone') === '(84) 99999-8888', 'celular com 0 na frente não estraga');
  await p.fill('#f_cpf', 'CPF: 529.982.247-25'); await p.dispatchEvent('#f_cpf', 'input'); ok(await p.inputValue('#f_cpf') === '529.982.247-25', 'CPF colado com texto antes fica certo');
  await p.fill('#f_cpf', ''); await p.fill('#f_telefone', ''); await p.type('#f_telefone', '84999990000');
  await p.fill('#f_email', ''); await p.type('#f_email', 'Fulana @Gmial.com'); ok(await p.inputValue('#f_email') === 'fulana@gmial.com', 'e-mail sem espaço e em minúsculas');
  await p.focus('#f_nome'); ok((await p.textContent('#frm')).includes('fulana@gmail.com'), 'sugere corrigir gmial.com');
  await p.click('.sug-email'); ok(await p.inputValue('#f_email') === 'fulana@gmail.com', 'um toque usa o e-mail corrigido');
  await p.fill('#f_cpf', ''); await p.type('#f_cpf', '11111111111'); await p.focus('#f_nome'); ok((await p.textContent('#frm')).includes('CPF inválido'), 'CPF inválido avisado ao sair do campo');
  await p.fill('#f_cpf', ''); await p.type('#f_cpf', '52998224725'); await p.fill('#f_nome', 'Pessoa Exemplo da Silva');
  const lgpd = await p.$('#f_lgpd'); if (lgpd) await lgpd.check();
  await p.click('#fsalvar'); await p.waitForSelector('#dlg:not([open])', { state: 'attached' });
  const m = (await p.evaluate(() => SQC.app._estado().db.membros)).find(x => x.nome === 'Pessoa Exemplo da Silva');
  ok(m && m.cpf === '52998224725', 'CPF guardado só com números');
  await p.click(`[data-edit="membros:${m.id}"]`); await p.waitForSelector('#f_cpf'); ok(await p.inputValue('#f_cpf') === '529.982.247-25', 'ao abrir de novo, CPF aparece formatado');
  await p.keyboard.press('Escape'); ok(!(await p.$('#dlg[open]')), 'abrir e fechar sem mexer não pede confirmação (a máscara não conta como alteração)');
  // ditado por voz
  await p.click('[data-tab="eventos"]'); await p.click('[data-new="eventos"]'); await p.waitForSelector('#f_obs');
  ok(!!(await p.$('#frm .btn-voz')), 'campo de observações tem o botão Falar');
  await p.click('#frm .btn-voz'); await p.waitForFunction(() => document.querySelector('#f_obs').value.length > 5);
  await p.click('#frm .btn-voz'); await p.waitForTimeout(50);
  ok(await p.inputValue('#f_obs') === 'Composto pronto, sem cheiro.', 'fala vira texto com maiúscula e pontuação');
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  // prazo nas chamadas: servidor que não responde vira "sem internet" em vez de ficar preso
  await p.route('**/nunca-responde', () => {});
  const r = await p.evaluate(async () => { SQC.prazoRede = 400; const t = Date.now(); try { await SQC.fetchComPrazo(location.origin + '/nunca-responde'); return 'respondeu'; } catch (e) { return [e.name, e.message, Date.now() - t]; } });
  ok(Array.isArray(r) && /Failed to fetch/.test(r[1]) && r[2] < 3000, 'chamada sem resposta desiste no prazo e conta como falta de internet');
  ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await b.close(); console.log('TRAZIDOS DO MULHERES & QUINTAIS: CONFERIDOS');
})().catch(e => { console.error(e.message); process.exit(1); });
