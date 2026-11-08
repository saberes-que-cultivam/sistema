/* Saberes que Cultivam — modo demonstração: sem servidor, dados só neste navegador.
   Vale quando js/config.js está com supabaseUrl vazio. Serve para conhecer e testar as telas.
   Os registros marcados com ex:1 são FICTÍCIOS (aparecem com a etiqueta "exemplo"). */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const R = SQC.regras,
    D = SQC.dados;
  const SIM = SQC.SIMULACAO,
    CHAVE = SIM ? 'sqc-sim-v8-' + SIM.dia : 'sqc-demo-v1'; // simulação (js/simulacao.js): guarda à parte, uma por data
  const mem = {}; // usado quando o navegador bloqueia o armazenamento (e nos testes)
  const ler = k => {
    try {
      const v = G.localStorage.getItem(k);
      return v == null ? (k in mem ? mem[k] : null) : v;
    } catch (e) {
      return k in mem ? mem[k] : null;
    }
  };
  const gravar = (k, v) => {
    mem[k] = v;
    try {
      G.localStorage.setItem(k, v);
    } catch (e) {
      /* fica só na memória */
    }
  };

  const semente = hoje => (SIM && SQC.simular ? SQC.simular(sementeBase(hoje)) : sementeBase(hoje));
  function sementeBase(hoje) {
    hoje = hoje || new Date();
    const atras = n => R.iso(new Date(hoje.getTime() - n * 864e5));
    return {
      membros: [
        {
          id: 'q1',
          ex: 1,
          lgpd: true,
          arlo: 'Sim',
          outra_bolsa: 'Não',
          funcao: 'coordenacao',
          nome: 'Coordenador de exemplo',
          vinculo: 'IFRN Campus Apodi',
          email: 'coordenacao@exemplo.br',
          telefone: '(00) 00000-0000',
          municipio: 'Apodi/RN',
          inicio: '2026-09-01'
        },
        // os perfis da demonstração ligados a um cadastro da equipe pelo e-mail (como em produção): "Meus dados" mostra a foto e o celular
        {
          id: 'q3',
          ex: 1,
          lgpd: true,
          arlo: 'Sim',
          outra_bolsa: 'Não',
          funcao: 'discente',
          nome: 'Bolsista de exemplo',
          vinculo: 'Tecnologia em Agroecologia',
          email: 'equipe@exemplo.br',
          telefone: '(00) 00000-0001',
          municipio: 'Apodi/RN',
          inicio: '2026-08-10'
        },
        {
          id: 'q4',
          ex: 1,
          lgpd: true,
          arlo: 'Sim',
          outra_bolsa: 'Não',
          funcao: 'auxiliar',
          nome: 'Auxiliar de exemplo',
          vinculo: 'IFRN Campus Apodi',
          email: 'auxiliar@exemplo.br',
          telefone: '(00) 00000-0002',
          municipio: 'Apodi/RN',
          inicio: '2026-08-01'
        },
        {
          id: 'q5',
          ex: 1,
          lgpd: true,
          arlo: 'Sim',
          outra_bolsa: 'Não',
          funcao: 'formador',
          nome: 'Formador(a) de exemplo',
          vinculo: 'IFRN Campus Apodi',
          email: 'formador@exemplo.br',
          telefone: '(00) 00000-0003',
          municipio: 'Mulungu/CE',
          inicio: '2026-09-01'
        },
        {
          id: 'q2',
          ex: 1,
          lgpd: true,
          funcao: 'discente',
          nome: 'Bolsista de exemplo (saiu)',
          vinculo: 'Tecnologia em Agroecologia',
          inicio: '2026-08-10',
          fim: atras(20),
          motivo: 'Concluiu o curso'
        }
      ],
      pessoas: [
        { id: 'p-coord', nome: 'Coordenação (demonstração)', email: 'coordenacao@exemplo.br', perfil: 'Coordenação', ativo: true },
        { id: 'p-equipe', nome: 'Equipe (demonstração)', email: 'equipe@exemplo.br', perfil: 'Equipe', ativo: true },
        {
          id: 'p-mda',
          nome: 'Acompanhamento (demonstração)',
          email: 'acompanhamento@exemplo.br',
          perfil: 'Acompanhamento',
          orgao: 'SEAB/MDA',
          ativo: true
        },
        { id: 'p-aux', nome: 'Auxiliar administrativo (demonstração)', email: 'auxiliar@exemplo.br', perfil: 'Auxiliar', ativo: true },
        { id: 'p-form', nome: 'Formador(a) (demonstração)', email: 'formador@exemplo.br', perfil: 'Formador', ativo: true }
      ],
      unidades: [
        {
          id: 'u1',
          nome: 'Polo São Paulo do Potengi',
          sigla: 'SPP',
          municipio: 'São Paulo do Potengi',
          uf: 'RN',
          territorio: 'Potengi/RN',
          modelo: 'A definir',
          conta: 'Sim',
          parceiro: '',
          responsavel: '',
          obs: 'Ata 22/2026: microrganismos isolados se houver local adequado; senão, área aberta com cobertura.'
        },
        {
          id: 'u2',
          nome: 'Polo Mulungu',
          sigla: 'MUL',
          municipio: 'Mulungu',
          uf: 'CE',
          territorio: 'Maciço de Baturité/CE',
          modelo: 'A definir',
          conta: 'Sim',
          parceiro: '',
          responsavel: '',
          obs: 'Ata 22/2026: mesma regra do polo de São Paulo do Potengi.'
        },
        {
          id: 'u3',
          nome: 'Base IFRN Campus Apodi (minhocário)',
          sigla: 'APO',
          municipio: 'Apodi',
          uf: 'RN',
          territorio: 'Sertão do Apodi/RN',
          modelo: 'Área aberta com cobertura (compostagem e biofertilizantes)',
          conta: 'Não',
          parceiro: 'IFRN Campus Apodi',
          responsavel: '',
          local_ok: true,
          parceiro_ok: true,
          obs: 'Área da fazenda com piso concretado; laboratório do campus como apoio.'
        }
      ],
      itens: [],
      lotes: [
        {
          id: 'l1',
          ex: 1,
          codigo: 'APO-HUM-001',
          unidade: 'u3',
          tipo: 'Húmus de minhoca',
          inicio: atras(70),
          dias: 60,
          qtd: 180,
          med: 'kg',
          insumos: 'Esterco bovino curtido, restos de capina',
          responsavel: '',
          status: 'Pronto',
          obs: 'Odor de terra, sem aquecimento'
        },
        {
          id: 'l2',
          ex: 1,
          codigo: 'APO-BIO-001',
          unidade: 'u3',
          tipo: 'Biofertilizante líquido',
          inicio: atras(12),
          dias: 30,
          qtd: 200,
          med: 'L',
          insumos: 'Esterco fresco, melaço, leite, cinzas, água sem cloro',
          responsavel: '',
          status: 'Maturando',
          obs: ''
        }
      ],
      agricultores: [
        {
          id: 'a1',
          ex: 1,
          nome: 'Maria das Dores (exemplo)',
          comunidade: 'Assentamento vizinho ao campus',
          municipio: 'Apodi',
          uf: 'RN',
          territorio: 'Outro',
          unidade: 'u3',
          culturas: 'Hortaliças, milho, feijão',
          area: 1.5,
          quimico: 'Parcial',
          gasto0: 180,
          diag: atras(60),
          kit: true,
          kitdata: atras(20)
        },
        {
          id: 'a2',
          ex: 1,
          nome: 'José Raimundo (exemplo)',
          comunidade: 'Assentamento vizinho ao campus',
          municipio: 'Apodi',
          uf: 'RN',
          territorio: 'Outro',
          unidade: 'u3',
          culturas: 'Banana, macaxeira',
          area: 2,
          quimico: 'Sim',
          gasto0: 320,
          diag: atras(60),
          kit: false,
          kitdata: ''
        },
        {
          id: 'a3',
          ex: 1,
          nome: 'Francisca Lima (exemplo)',
          comunidade: 'Sítio Lagoa',
          municipio: 'Apodi',
          uf: 'RN',
          territorio: 'Outro',
          unidade: 'u3',
          culturas: 'Hortaliças',
          area: 0.5,
          quimico: 'Não',
          gasto0: 0,
          diag: '',
          kit: false,
          kitdata: ''
        }
      ],
      distribuicoes: [
        { id: 'd1', ex: 1, data: atras(8), lote: 'l1', agricultor: 'a1', qtd: 40, cultura: 'Hortaliças', area: 0.3, forma: 'No solo' },
        { id: 'd2', ex: 1, data: atras(45), lote: 'l1', agricultor: 'a2', qtd: 60, cultura: 'Banana', area: 0.5, forma: 'No solo' }
      ],
      visitas: [
        {
          id: 'v1',
          ex: 1,
          data: atras(2),
          agricultor: 'a1',
          tecnico: '',
          usou: 'Sim',
          vigor: 4,
          gasto: 120,
          obs: 'Canteiros com melhor retenção de umidade',
          problemas: ''
        }
      ],
      eventos: [
        {
          id: 'e1',
          tipo: 'Participação em evento',
          data: '2026-09-03',
          tema: 'Encontro da Rede BioAF (SEAB/MDA) na Expointer',
          lugar: 'Parque de Exposições Assis Brasil',
          municipio: 'Esteio/RS',
          part: '',
          mulheres: '',
          link: '',
          obs: 'Participação da coordenação, 03 e 04/09/2026.'
        },
        {
          id: 'e2',
          tipo: 'Reunião',
          data: '2026-09-08',
          tema: 'Informes da Rede BioAF e planejamento das unidades de produção',
          lugar: 'Google Meet',
          municipio: '',
          part: 2,
          mulheres: 0,
          link: '',
          obs: 'Ata 22/2026 - DG/AP/RE/IFRN.',
          resumo:
            'Informes da Rede BioAF. As unidades de São Paulo do Potengi e Mulungu produzem microrganismos isolados se houver local adequado; senão, em área aberta com cobertura. Encaminhamento: visitar os dois locais antes da compra dos itens.'
        }
      ],
      despesas: [
        {
          id: 'x1',
          ex: 1,
          data: atras(25),
          etapa: '3.1',
          rubrica: 'servicos_pj',
          item: 'i09',
          descricao: 'Impressão de cartilhas (exemplo)',
          favorecido: 'Gráfica',
          doc: 'NF 0000',
          valor: 1800,
          status: 'Pago'
        },
        {
          id: 'x2',
          ex: 1,
          data: atras(10),
          etapa: '6.1',
          rubrica: 'consumo',
          descricao: 'Material para feira e oficinas (exemplo)',
          favorecido: '',
          doc: '',
          valor: 2400,
          status: 'Em compras na FUNCERN'
        }
      ],
      presencas: [],
      fotos: [],
      anexos: [],
      entregas: [
        {
          id: 'g1',
          etapa: '6.3',
          titulo: 'Contrato 220/2026 com a FUNCERN; 1ª parcela liquidada (2026NS001323)',
          data: '2026-09-22',
          link: '',
          obs: 'Contrato assinado em 20/08/2026.'
        }
      ]
    };
  }

  let db = null,
    eu = null;
  /* simulação (23/10/2026): documentos e fotos fictícios desenhados na hora, para a tela abrir alguma coisa (nada vem de fora) */
  const nomeDoCaminho = c => {
    const a = ((db && db.anexos) || []).find(x => x.caminho === c),
      g = db && ['entregas', 'eventos', 'unidades'].map(t => (db[t] || []).find(x => x.arquivo === c)).find(Boolean);
    return (a && a.nome) || (g && g.arquivo_nome) || 'documento';
  };
  function pdfFicticio(nome) {
    const lat = t =>
      String(t)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\x20-\x7e]/g, '?')
        .replace(/[()\\]/g, '\\$&');
    const linhas = [
      'Saberes que Cultivam - SIMULACAO',
      '',
      'Documento ficticio: ' + nome,
      '',
      'Este arquivo foi gerado pela simulacao do sistema.',
      'Nao e um documento real do projeto.'
    ];
    const txt = 'BT /F1 14 Tf 60 760 Td 20 TL ' + linhas.map(l => `(${lat(l)}) '`).join(' ') + ' ET';
    const obj = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      `<< /Length ${txt.length} >>\nstream\n${txt}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ];
    let out = '%PDF-1.4\n';
    const pos = [];
    obj.forEach((o, i) => {
      pos.push(out.length);
      out += `${i + 1} 0 obj\n${o}\nendobj\n`;
    });
    const x = out.length;
    out +=
      `xref\n0 ${obj.length + 1}\n0000000000 65535 f \n` +
      pos.map(p => String(p).padStart(10, '0') + ' 00000 n \n').join('') +
      `trailer\n<< /Size ${obj.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
    return new Blob([out], { type: 'application/pdf' });
  }
  /* simulação (23/10/2026, "tudo preenchido"): relatos de problema já respondidos e o histórico de alterações montado com os próprios
     registros fictícios (cada inclusão com quem fez e quando; lotes que ficaram prontos; despesas importadas; planilhas baixadas) */
  const quando = (d, k) => {
    const h = 8 + (k % 9),
      m = (k * 7) % 60;
    return new Date(`${String(d).slice(0, 10)}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-03:00`).toISOString();
  };
  function relatosSim() {
    const dia = SIM.dia,
      ok = d => d <= dia,
      R_ = [
        [
          'p-aux',
          '2026-09-02',
          'Salvei uma visita sem internet e não sei se ela foi enviada (exemplo).',
          'visitas',
          'Foi, sim. Sem internet, a visita fica guardada no aparelho e é enviada sozinha quando o sinal volta. A faixa no alto da tela mostra quantos lançamentos ainda esperam envio (exemplo).'
        ],
        [
          'p-form',
          '2026-11-19',
          'Na lista de presença, não achei como colocar vários nomes de uma vez (exemplo).',
          'eventos',
          'Dá para colocar todos de uma vez. Na Lista, cole os nomes da ata no campo de nomes, um por linha, toque em “Conferir os nomes” e depois em “Adicionar” (exemplo).'
        ],
        [
          'p-equipe',
          '2027-03-10',
          'O documento da entrega não abre no celular (exemplo).',
          'painel',
          'O problema era o arquivo, que estava corrompido. Enviei de novo pelo computador, e agora ele abre normalmente no celular (exemplo).'
        ]
      ];
    return R_.filter(r => ok(r[1]))
      .map((r, k) => ({
        id: 'rel-sim-' + k,
        por: r[0],
        em: quando(r[1], k + 3),
        texto: r[2],
        aba: r[3],
        versao: 'Versão de exemplo',
        tecnico: '',
        situacao: 'Resolvido',
        resolvido_em: quando(r[1], k + 6),
        resposta: r[4],
        respondido_em: quando(r[1], k + 5),
        respondido_por: 'p-coord',
        visto_em: quando(r[1], k + 8)
      }))
      .reverse();
  }
  function historicoSim() {
    const H = [],
      dia = SIM.dia,
      AUT = { eventos: 'p-form', presencas: 'p-form', entregas: 'p-equipe', despesas: 'p-coord', unidades: 'p-coord', itens: 'p-coord' };
    const dataDe = (t, r) =>
      r.data ||
      r.diag ||
      r.inicio ||
      (t === 'presencas' ? (db.eventos.find(e => e.id === r.evento) || {}).data : '') ||
      (t === 'unidades' ? r.funcionando_em || '2026-08-01' : '') ||
      r.tirada_em ||
      r.criado_em ||
      '';
    let n = 0;
    ['unidades', 'itens', 'lotes', 'agricultores', 'distribuicoes', 'visitas', 'eventos', 'presencas', 'entregas', 'despesas'].forEach(t =>
      (db[t] || []).forEach(r => {
        const d = String(dataDe(t, r) || '').slice(0, 10);
        if (!d || d > dia) return;
        H.push({
          id: ++n,
          tabela: t,
          registro_id: r.id,
          acao: 'INSERT',
          por: AUT[t] || (n % 4 ? 'p-aux' : 'p-coord'),
          em: quando(d, n),
          depois: r
        });
      })
    );
    (db.lotes || []).forEach(l => {
      if (l.status === 'Pronto' && l.inicio) {
        const d = new Date(l.inicio + 'T12:00:00');
        d.setDate(d.getDate() + (+l.dias || 30));
        const x = d.toISOString().slice(0, 10);
        if (x <= dia)
          H.push({
            id: ++n,
            tabela: 'lotes',
            registro_id: l.id,
            acao: 'UPDATE',
            por: 'p-aux',
            em: quando(x, n),
            antes: Object.assign({}, l, { status: 'Maturando' }),
            depois: l
          });
      }
    });
    for (let m = new Date('2026-09-28T12:00:00'); m.toISOString().slice(0, 10) <= dia; m.setMonth(m.getMonth() + 1)) {
      H.push({
        id: ++n,
        tabela: 'planilhas',
        acao: 'PLANILHA',
        por: 'p-coord',
        em: quando(m.toISOString(), n),
        depois: { tipo: 'json', qtd: D.TABELAS.reduce((t, k) => t + (db[k] || []).length, 0) }
      });
    }
    // uma visita excluída por engano, para o "Desfazer a exclusão" aparecer
    const v2 = (db.visitas || [])[1];
    if (v2 && !db.visitas.some(x => x.id === 'v-excluida-sim'))
      H.push({
        id: ++n,
        tabela: 'visitas',
        registro_id: 'v-excluida-sim',
        acao: 'DELETE',
        por: 'p-aux',
        em: quando(dia, 5),
        antes: Object.assign({}, v2, { id: 'v-excluida-sim', obs: 'Visita lançada em dobro e excluída (exemplo)' })
      });
    return H.sort((a, b) => (a.em < b.em ? 1 : -1));
  }
  function fotoFicticia(legenda) {
    return new Promise(ok => {
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 600;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 800, 600);
      gr.addColorStop(0, '#2f6b3f');
      gr.addColorStop(1, '#a8c686');
      g.fillStyle = gr;
      g.fillRect(0, 0, 800, 600);
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.font = 'bold 34px sans-serif';
      g.fillText('Foto fictícia (simulação)', 40, 90);
      g.font = '26px sans-serif';
      g.fillText(String(legenda || '').slice(0, 48), 40, 140);
      c.toBlob(b => ok(b), 'image/jpeg', 0.8);
    });
  }
  function carregarLocal() {
    if (SIM && SQC.simularPlano) SQC.simularPlano();
    try {
      db = JSON.parse(ler(CHAVE));
    } catch (e) {
      db = null;
    }
    const s = semente();
    if (!db || !Array.isArray(db.unidades)) db = s;
    D.TABELAS.forEach(t => {
      if (!Array.isArray(db[t])) db[t] = s[t];
    });
    ['Acompanhamento', 'Auxiliar', 'Formador'].forEach(pf => {
      if (!db.pessoas.some(p => p.perfil === pf)) db.pessoas.push(s.pessoas.find(p => p.perfil === pf));
    }); // demonstração criada antes desses perfis existirem
    return db;
  }
  const persistir = () => gravar(CHAVE, JSON.stringify(db));
  const falha = msg => {
    const e = new Error(msg);
    e.code = 'P0001';
    return e;
  };

  SQC.apiDemo = {
    modo: 'demo',
    semente,
    async iniciar() {
      carregarLocal();
      const id = ler(CHAVE + '-eu');
      eu = db.pessoas.find(p => p.id === id && p.ativo !== false) || null;
      return eu;
    },
    async entrarDemo(perfil) {
      carregarLocal();
      eu = db.pessoas.find(p => p.perfil === perfil && p.ativo !== false) || null;
      if (!eu) throw falha('Não há acesso ativo com esse perfil na demonstração.');
      gravar(CHAVE + '-eu', eu.id);
      return eu;
    },
    async atualizarMeusContatos(telefone, municipio) {
      if (!db) carregarLocal();
      const e = String((eu && eu.email) || '')
          .trim()
          .toLowerCase(),
        hj = R.iso(new Date());
      const L = db.membros.filter(
        m =>
          String(m.email || '')
            .trim()
            .toLowerCase() === e &&
          (!m.fim || m.fim >= hj)
      );
      if (!L.length)
        throw falha('Seu cadastro na equipe não está ligado a este e-mail. Peça à coordenação para conferir o e-mail no cadastro.');
      L.forEach(m => {
        m.telefone = telefone || null;
        m.municipio = municipio || null;
        m.atualizado_em = new Date().toISOString();
      });
      persistir();
    },
    async habilitar(id, arlo, termoEm) {
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação marca a habilitação.');
      const m = db.membros.find(x => x.id === id);
      if (!m) throw falha(R.MSG_EXCLUIDO);
      m.arlo = arlo || null;
      m.termo_em = termoEm || null;
      m.atualizado_em = new Date().toISOString();
      persistir();
      return JSON.parse(JSON.stringify(m));
    },
    /* foto da equipe na demonstração: guardada no próprio navegador (imagem pequena, 320 px) */
    async fotoEquipe(caminho) {
      return caminho;
    },
    async trocarFotoEquipe(membro, blob) {
      if (!eu || !(eu.perfil === 'Coordenação' || (db.membros.find(m => m.id === membro) || {}).email === eu.email))
        throw falha('Só a própria pessoa ou a coordenação trocam esta foto.');
      const url = await new Promise((ok, no) => {
        const r = new FileReader();
        r.onload = () => ok(r.result);
        r.onerror = () => no(falha('Não foi possível ler a foto.'));
        r.readAsDataURL(blob);
      });
      const m = db.membros.find(x => x.id === membro);
      m.foto = url;
      persistir();
      return url;
    },
    /* documento das entregas na demonstração: o arquivo fica só na memória enquanto a página está aberta (o nome fica gravado) */
    _docs: {},
    async enviarDocumento(entrega, arquivo, tabela = 'entregas') {
      // entregas, atividades e biofábricas, como no banco (27 e 34)
      if (!eu || !(tabela === 'entregas' ? ['Coordenação', 'Equipe', 'Auxiliar'] : ['Coordenação', 'Auxiliar']).includes(eu.perfil))
        throw falha(
          tabela === 'entregas'
            ? 'Só a equipe do projeto anexa documento às entregas.'
            : 'Só a coordenação e o auxiliar anexam documento à atividade e à biofábrica.'
        ); // como no banco (27, 34 e 40)
      const msg = R.validarDocumento(arquivo);
      if (msg) throw falha(msg);
      const g = (db[tabela] || []).find(x => x.id === entrega);
      if (!g) throw falha(R.MSG_EXCLUIDO);
      if (tabela === 'entregas') {
        const mx = R.mexerRegistro(db, eu, 'entregas', g, { arquivo: '(novo)' });
        if (mx) throw falha(mx);
      } /* 48 */
      const caminho = `${entrega}/${SQC.novoId()}.${R.extDocumento(arquivo.name)}`;
      this._docs[caminho] = arquivo;
      g.arquivo = caminho;
      g.arquivo_nome = String(arquivo.name || '').slice(0, 200);
      g.atualizado_em = new Date().toISOString();
      persistir();
      return caminho;
    },
    async tirarDocumento(entrega, tabela = 'entregas') {
      if (!eu || !(tabela === 'entregas' ? ['Coordenação', 'Equipe', 'Auxiliar'] : ['Coordenação', 'Auxiliar']).includes(eu.perfil))
        throw falha('O seu perfil não tira este documento.');
      if (tabela === 'entregas') {
        const g0 = (db.entregas || []).find(x => x.id === entrega),
          mx = g0 && R.mexerRegistro(db, eu, 'entregas', g0, { arquivo: null });
        if (mx) throw falha(mx);
      }
      /* 48 */ const g = (db[tabela] || []).find(x => x.id === entrega);
      if (g) {
        g.arquivo = null;
        g.arquivo_nome = null;
        persistir();
      }
    },
    /* como no banco (43): relata qualquer perfil; lê e marca só a coordenação (guardado neste navegador) */
    _rel() {
      try {
        const g = ler(CHAVE + '-relatos');
        if (g === null && SIM) {
          const L = relatosSim();
          gravar(CHAVE + '-relatos', JSON.stringify(L));
          return L;
        }
        return JSON.parse(g || '[]');
      } catch (e) {
        return [];
      }
    },
    async relatarProblema(r) {
      if (!eu) throw falha('Entre no sistema para relatar o problema.');
      const L = this._rel();
      const x = {
        id: SQC.novoId(),
        por: eu.id,
        em: new Date().toISOString(),
        texto: String(r.texto).slice(0, 4000),
        aba: r.aba,
        versao: r.versao,
        tecnico: r.tecnico,
        foto: r.foto || null,
        situacao: 'Aberto'
      };
      L.unshift(x);
      gravar(CHAVE + '-relatos', JSON.stringify(L));
      return x.id;
    },
    /* 67: na demonstração, os erros ficam só enquanto a página está aberta; na simulação há dois exemplos */
    _errs: [],
    async registrarErroTela(p) {
      if (!eu) return true;
      const d = new Date(),
        dia = d.toISOString().slice(0, 10),
        ex = this._errs.find(e => e.dia === dia && e.tipo === p.tipo && e.mensagem === p.mensagem && e.onde === p.onde);
      if (ex) {
        ex.vezes++;
        ex.ultimo_em = d.toISOString();
      } else
        this._errs.unshift(
          Object.assign({ dia, vezes: 1, primeiro_em: d.toISOString(), ultimo_em: d.toISOString(), perfil: eu.perfil }, p)
        );
      return true;
    },
    async errosTela() {
      if (!eu || eu.perfil !== 'Coordenação') return [];
      const ag = Date.now(),
        iso = h => new Date(ag - h * 3600e3).toISOString();
      const ex = SIM
        ? [
            {
              dia: iso(26).slice(0, 10),
              tipo: 'TypeError',
              mensagem: 'Cannot read properties of undefined (reading "…") (exemplo)',
              onde: 'telaLotes app.js:1873:41 < render app.js:2236:18',
              versao: '233',
              aba: 'lotes',
              perfil: 'Auxiliar',
              navegador: 'Chrome 130 · Android',
              largura: 390,
              vezes: 3,
              primeiro_em: iso(28),
              ultimo_em: iso(26)
            },
            {
              dia: iso(70).slice(0, 10),
              tipo: 'RangeError',
              mensagem: 'Invalid time value (exemplo)',
              onde: 'dataBr app.js:742:22',
              versao: '232',
              aba: 'relatorios',
              perfil: 'Coordenação',
              navegador: 'Safari 18 · iOS',
              largura: 820,
              vezes: 1,
              primeiro_em: iso(70),
              ultimo_em: iso(70)
            }
          ]
        : [];
      return this._errs.concat(ex);
    },
    async relatos() {
      return eu && eu.perfil === 'Coordenação' ? this._rel() : [];
    },
    /* 69: na demonstração a foto do relato fica só enquanto a página está aberta */
    async enviarFotoRelato(meuId, blob) {
      const caminho = `${meuId}/${SQC.novoId()}.jpg`;
      this._docs[caminho] = blob;
      return caminho;
    },
    async urlFotoRelato(caminho) {
      const a = this._docs[caminho];
      if (!a) throw falha('Na demonstração a foto fica só enquanto a página está aberta.');
      return URL.createObjectURL(a);
    },
    async avisosRelatos() {
      if (!eu) return null;
      const L = this._rel();
      return {
        abertos: eu.perfil === 'Coordenação' ? L.filter(x => x.situacao !== 'Resolvido').length : 0,
        respostas: L.filter(x => x.por === eu.id && x.resposta && !x.visto_em).map(x => ({
          id: x.id,
          em: x.em,
          texto: x.texto,
          resposta: x.resposta,
          respondido_em: x.respondido_em,
          situacao: x.situacao
        }))
      };
    },
    async responderRelato(id, resposta) {
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação responde o relato.');
      const L = this._rel(),
        x = L.find(y => y.id === id);
      if (!x) throw falha(R.MSG_EXCLUIDO);
      const t =
        String(resposta || '')
          .trim()
          .slice(0, 2000) || null;
      if (t !== (x.resposta || null)) {
        x.resposta = t;
        x.respondido_em = t ? new Date().toISOString() : null;
        x.respondido_por = t ? eu.id : null;
        x.visto_em = null;
      }
      gravar(CHAVE + '-relatos', JSON.stringify(L));
      return Object.assign({}, x);
    },
    async relatoVisto(id) {
      if (!eu) return;
      const L = this._rel(),
        x = L.find(y => y.id === id && y.por === eu.id && y.resposta);
      if (x) {
        x.visto_em = new Date().toISOString();
        gravar(CHAVE + '-relatos', JSON.stringify(L));
      }
    },
    async marcarRelato(id, situacao) {
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação marca o relato.');
      const L = this._rel(),
        x = L.find(y => y.id === id);
      if (!x) throw falha(R.MSG_EXCLUIDO);
      x.situacao = situacao;
      x.resolvido_em = situacao === 'Resolvido' ? new Date().toISOString() : null;
      gravar(CHAVE + '-relatos', JSON.stringify(L));
      return Object.assign({}, x);
    },
    async enviarAnexo(tabela, registro, arquivo) {
      // como no banco (42): coordenação e auxiliar, até 10 por registro
      if (!eu || !['Coordenação', 'Auxiliar'].includes(eu.perfil))
        throw falha('Só a coordenação e o auxiliar anexam documento à atividade e à biofábrica.');
      const msg = R.validarDocumento(arquivo);
      if (msg) throw falha(msg);
      if (!(db[tabela] || []).some(x => x.id === registro)) throw falha(R.MSG_EXCLUIDO);
      if (db.anexos.filter(a => a.registro === registro).length >= 10)
        throw falha('Este registro já tem 10 documentos. Junte alguns num PDF só ou remova os que não servem mais.');
      const caminho = `${registro}/${SQC.novoId()}.${R.extDocumento(arquivo.name)}`;
      this._docs[caminho] = arquivo;
      const a = {
        id: SQC.novoId(),
        tabela,
        registro,
        caminho,
        nome: String(arquivo.name || '').slice(0, 200),
        criado_por: eu.id,
        criado_em: new Date().toISOString()
      };
      db.anexos.push(a);
      persistir();
      return Object.assign({}, a);
    },
    async removerAnexo(a) {
      const x = db.anexos.find(y => y.id === a.id);
      if (!x) return;
      if (!eu || !(eu.perfil === 'Coordenação' || (eu.perfil === 'Auxiliar' && x.criado_por === eu.id)))
        throw falha('Só a coordenação ou quem anexou pode remover este documento.');
      db.anexos = db.anexos.filter(y => y.id !== a.id);
      delete this._docs[a.caminho];
      persistir();
    },
    async urlDocumento(caminho) {
      if (!this._docs[caminho] && SIM) this._docs[caminho] = pdfFicticio(nomeDoCaminho(caminho)); // simulação: um PDF de uma página dizendo que é fictício
      const a = this._docs[caminho];
      if (!a) throw falha('Na demonstração o arquivo fica só enquanto a página está aberta. Envie de novo para ver.');
      return URL.createObjectURL(a);
    },
    async tirarFotoEquipe(membro) {
      const m = db.membros.find(x => x.id === membro);
      if (m) {
        m.foto = null;
        persistir();
      }
    },
    async sair() {
      eu = null;
      gravar(CHAVE + '-eu', '');
    },
    /* igual ao banco de verdade: quem acompanha de fora recebe as unidades produtivas numeradas e as visitas sem texto livre */
    async carregar() {
      const c = JSON.parse(JSON.stringify(carregarLocal()));
      const pf = eu ? eu.perfil : '',
        nPres = {},
        nMu = {};
      c.presencas.forEach(x => {
        nPres[x.evento] = (nPres[x.evento] || 0) + 1;
        if (x.mulher) nMu[x.evento] = (nMu[x.evento] || 0) + 1;
      });
      if (pf === 'Formador') {
        // como no banco (23): unidades produtivas numeradas, visitas sem texto; cada um só o que é seu (o auxiliar lê o campo inteiro desde o 36)
        c.agricultores = [];
        c.entregas = [];
        c.lotes = [];
        c.itens = [];
        c.presencas = c.presencas.map(x => {
          const y = Object.assign({}, x);
          delete y.agricultor;
          return y;
        }); /* 50 (ataque ao perfil Formador, 29/10/2026): nem o número das unidades produtivas (ligado ao nome da lista, desfazia o anonimato), nem entregas, lotes e itens */
        c.visitas = []; /* 48 */
        c.distribuicoes = []; /* 49: entrega de bioinsumo ligada ao nome da lista identificava quem recebeu */
        c.pessoas = c.pessoas.filter(p => p.id === eu.id);
        c.despesas = [];
        c.membros = [];
        {
          const meus = new Set(c.eventos.filter(e => e.criado_por === eu.id).map(e => e.id));
          c.fotos = c.fotos.filter(f => f.tabela === 'eventos' && meus.has(f.registro));
          c.presencas = c.presencas.filter(x => meus.has(x.evento));
        }
        /* 51: lista e fotos só das atividades que registrou */ c.itens = c.itens.map(i => {
          const x = Object.assign({}, i);
          delete x.valor;
          delete x.rubrica;
          return x;
        });
      }
      if (pf === 'Acompanhamento')
        c.entregas = c.entregas.map(g => ({
          id: g.id,
          etapa: g.etapa,
          titulo: R.tituloPublico(g),
          data: g.data,
          criado_em: g.criado_em,
          atualizado_em: g.atualizado_em,
          ex: g.ex
        })); /* 50: como entregas_acompanhamento() */
      if (['Acompanhamento', 'Formador', 'Equipe'].includes(pf)) c.anexos = []; // como no banco (42): a lista de documentos é de quem registra o campo
      if (pf === 'Equipe') {
        // como no banco (40 e 41): o bolsista recebe o campo numerado, sem presença, fotos, valor dos itens, acessos dos outros
        c.eventos = c.eventos.map(e => {
          const x = Object.assign({}, e);
          delete x.link;
          delete x.obs;
          delete x.resumo;
          delete x.arquivo;
          delete x.arquivo_nome;
          return x;
        }); // e a atividade como o SEAB/MDA
        c.agricultores = [...c.agricultores]
          .sort((a, b) => (String(a.criado_em || '') < String(b.criado_em || '') ? -1 : 1))
          .map((a, i) => ({
            id: a.id,
            nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'),
            municipio: a.municipio,
            uf: a.uf,
            territorio: a.territorio,
            unidade: a.unidade,
            area: a.area,
            diag: a.diag,
            quimico: a.quimico,
            gasto0: a.gasto0,
            kit: a.kit,
            kitdata: a.kitdata,
            ex: a.ex
          }));
        c.visitas = c.visitas.map(v => ({
          id: v.id,
          data: v.data,
          agricultor: v.agricultor,
          usou: v.usou,
          vigor: v.vigor,
          gasto: v.gasto,
          ex: v.ex
        }));
        c.pessoas = c.pessoas.filter(p => p.id === eu.id);
        c.presencas = [];
        c.fotos = [];
        c.itens = c.itens.map(i => {
          const x = Object.assign({}, i);
          delete x.valor;
          delete x.rubrica;
          return x;
        });
      }
      if (eu && eu.perfil === 'Acompanhamento') {
        c.agricultores = c.agricultores.map((a, i) => ({
          id: a.id,
          nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'),
          municipio: a.municipio,
          uf: a.uf,
          territorio: a.territorio,
          unidade: a.unidade,
          area: a.area,
          diag: a.diag,
          quimico: a.quimico,
          gasto0: a.gasto0,
          kit: a.kit,
          kitdata: a.kitdata,
          ex: a.ex
        }));
        c.visitas = c.visitas.map(v => ({
          id: v.id,
          data: v.data,
          agricultor: v.agricultor,
          usou: v.usou,
          vigor: v.vigor,
          gasto: v.gasto,
          ex: v.ex
        }));
        c.pessoas = c.pessoas.filter(p => p.id === eu.id);
        c.membros = [];
        c.presencas = [];
        c.fotos = [];
        c.despesas = [];
        c.itens = c.itens.map(i => {
          const x = Object.assign({}, i);
          delete x.valor;
          delete x.rubrica;
          return x;
        }); // como no banco (script 16): sem despesas; itens sem valor
        c.eventos = c.eventos.map(e => {
          const x = Object.assign({}, e);
          delete x.link;
          delete x.obs;
          delete x.resumo;
          delete x.arquivo;
          delete x.arquivo_nome;
          return x;
        }); // como no banco (script 15)
      }
      if (pf === 'Acompanhamento' || pf === 'Equipe') {
        c.eventos.forEach(e => {
          e.presentes = nPres[e.id] || 0;
          if (e.presentes) e.mulheres_lista = nMu[e.id] || 0;
        }); // como no banco (32, 40 e 41): só as contagens
      }
      if (pf === 'Equipe')
        c.membros = c.membros.filter(
          m =>
            String(m.email || '')
              .trim()
              .toLowerCase() ===
            String(eu.email || '')
              .trim()
              .toLowerCase()
        ); /* 48: o bolsista lê só o próprio cadastro da equipe */
      if (pf === 'Equipe') c.despesas = []; // como no banco (33): o bolsista não lê as despesas
      if (eu && eu.perfil !== 'Coordenação')
        c.membros = c.membros.map(m => {
          const x = Object.assign({}, m);
          R.CAMPOS_RESERVADOS.concat(['motivo', 'obs']).forEach(k => {
            delete x[k];
          });
          return x;
        }); // como no banco: dado reservado (e, desde o 65, motivo e observação) só para a coordenação
      if (pf === 'Acompanhamento') {
        c.lotes = (c.lotes || []).map(l => {
          const x = Object.assign({}, l);
          delete x.obs;
          return x;
        });
        c.unidades = (c.unidades || []).map(u => {
          const x = Object.assign({}, u);
          delete x.obs;
          delete x.arquivo;
          delete x.arquivo_nome;
          return x;
        });
      } /* 65: o SEAB/MDA sem as observações de lote e biofábrica */
      c._avisos = await this.avisosRelatos();
      /* 62: na demonstração, avisos ligados de exemplo para a coordenação ver a coluna na lista de acessos */
      if (pf === 'Coordenação') {
        const at = (c.pessoas || []).filter(x => x.ativo !== false);
        c._aparelhos = at
          .slice(0, 2)
          .map((x, i) => ({
            pessoa: x.id,
            aparelho: i ? 'Android' : 'iPhone',
            ligado_em: new Date(Date.now() - (i + 2) * 864e5).toISOString()
          }))
          .concat(at[0] ? [{ pessoa: at[0].id, aparelho: 'Windows', ligado_em: new Date(Date.now() - 864e5).toISOString() }] : []);
      }
      return c;
    },
    async salvar(tabela, reg) {
      if (!db) carregarLocal();
      if (!R.podeGravar(eu, tabela)) throw falha('O seu perfil não tem permissão para fazer isso.');
      const i = db[tabela].findIndex(x => x.id === reg.id);
      const ant = i >= 0 ? db[tabela][i] : null;
      const r = Object.assign({}, ant || {}, reg);
      delete r._pendente;
      delete r._erro;
      const mx = R.mexerRegistro(db, eu, tabela, ant, reg);
      if (mx) throw falha(mx); /* 48 */
      const msg = R.validar(db, tabela, r, ant);
      if (msg) throw falha(msg);
      if (!ant) {
        r.id = r.id || SQC.novoId();
        r.criado_por = eu.id;
        r.criado_em = new Date().toISOString();
        if (tabela === 'lotes') r.codigo = R.codigoLote(db, r);
      } else {
        r.criado_por = ant.criado_por;
        r.criado_em = ant.criado_em;
        if (tabela === 'lotes') r.codigo = ant.codigo;
      }
      r.atualizado_em = new Date().toISOString();
      if (ant) db[tabela][i] = r;
      else db[tabela].push(r);
      persistir();
      if (eu && r.id === eu.id) eu = r;
      return JSON.parse(JSON.stringify(r));
    },
    async excluir(tabela, id) {
      const r = db[tabela].find(x => x.id === id);
      if (!r) return;
      if (tabela === 'pessoas') throw falha('Acesso não se exclui: desative.');
      if (!R.podeExcluir(eu, tabela, r)) throw falha('Só a coordenação ou quem lançou pode excluir este registro.');
      if (R.emUso(db, tabela, id).length) {
        const e = new Error('em uso');
        e.code = '23503';
        throw e;
      }
      // como no banco: a unidade produtiva sai das listas de presença (on delete set null); o "Desfazer" devolve (41)
      const pres = tabela === 'agricultores' ? (db.presencas || []).filter(p => p.agricultor === id).map(p => p.id) : [];
      pres.forEach(pid => {
        const p = db.presencas.find(x => x.id === pid);
        if (p) p.agricultor = null;
      });
      if (tabela === 'lotes' && r.codigo)
        db._codigosExcluidos = (db._codigosExcluidos || []).concat(
          r.codigo
        ); /* 30/10/2026 (homologação F1-04): como o banco (41), código de lote excluído não volta a outro lote */
      this._lixo[tabela + ':' + id] = { r: JSON.parse(JSON.stringify(r)), quem: eu && eu.id, em: Date.now(), pres };
      db[tabela] = db[tabela].filter(x => x.id !== id);
      if (['eventos', 'unidades', 'agricultores'].includes(tabela)) db.anexos = (db.anexos || []).filter(a => a.registro !== id);
      persistir();
    },
    _lixo: {},
    /* como no banco (41): só quem excluiu, até 30 minutos depois; volta igual (autor, data de criação, código do lote), sem o documento */
    async anonimizarAgricultor(id) {
      /* como o 51 */
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação atende pedido de apagar dados.');
      const a = db.agricultores.find(x => x.id === id);
      if (!a) throw falha('Unidade produtiva não encontrada.');
      const nomeAntes = a.nome;
      a.nome = 'Titular anonimizado';
      a.comunidade = null;
      db.visitas
        .filter(v => v.agricultor === id)
        .forEach(v => {
          v.obs = null;
          v.problemas = null;
          v.lat = null;
          v.lng = null;
          v.precisao = null;
        });
      db.anexos = (db.anexos || []).filter(x => x.registro !== id);
      /* como o 53: lista de presença e fotos das visitas também */
      const vs = new Set(db.visitas.filter(v => v.agricultor === id).map(v => v.id)),
        rot = 'Titular anonimizado (nº ' + (a.numero || String(id).slice(0, 8)) + ')';
      const nm = s =>
          String(s || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase(),
        alvo = nm(nomeAntes);
      (db.presencas || [])
        .filter(p => p.agricultor === id || (alvo && !p.agricultor && nm(p.nome) === alvo))
        .forEach(p => {
          p.nome = rot;
          p.comunidade = null;
        });
      db.fotos = (db.fotos || []).filter(f => !(f.tabela === 'visitas' && vs.has(f.registro)));
      persistir();
      return true;
    },
    /* 57: importações da FUNCERN (na demonstração, só enquanto a página está aberta) */
    _imps: [],
    async importacaoRegistrar(arquivo, novas, atualizadas, removidas) {
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação importa a planilha da FUNCERN.');
      const x = {
        id: SQC.novoId(),
        ordem: this._imps.length + 1,
        arquivo: String(arquivo || 'planilha').slice(0, 300),
        feita_em: new Date().toISOString(),
        feita_por: eu.id,
        novas,
        atualizadas,
        removidas,
        desfeita_em: null,
        desfeita_por: null,
        retiradas: null
      };
      this._imps.unshift(x);
      return x.id;
    },
    async importacoes() {
      if (!eu || eu.perfil !== 'Coordenação') return [];
      /* simulação: as despesas do último mês aparecem como vindas de uma planilha importada (exemplo), para o quadro e o "Desfazer" aparecerem */
      if (SIM && !this._imps.length && !this._impsSim) {
        this._impsSim = true;
        if (!db) carregarLocal();
        const ds = db.despesas.filter(d => d.data && d.data <= SIM.dia),
          ult = ds
            .map(d => d.data.slice(0, 7))
            .sort()
            .pop();
        if (ult) {
          const id = SQC.novoId(),
            L = ds.filter(d => d.data.slice(0, 7) === ult);
          L.forEach(d => {
            d.importacao = id;
          });
          this._imps.push({
            id,
            ordem: 1,
            arquivo: 'solicitacoes_funcern_' + ult.split('-').reverse().join('-') + ' (exemplo).xlsx',
            feita_em: SIM.dia + 'T10:00:00',
            feita_por: 'p-coord',
            novas: L.length,
            atualizadas: 0,
            removidas: 0,
            desfeita_em: null,
            desfeita_por: null,
            retiradas: null
          });
          persistir();
        }
      }
      return this._imps.map(x => Object.assign({}, x));
    },
    async desfazerImportacao(id) {
      if (!db) carregarLocal();
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação desfaz uma importação.');
      const x = this._imps.find(y => y.id === id);
      if (!x) throw falha('Importação não encontrada.');
      if (x.desfeita_em) throw falha('Esta importação já foi desfeita.');
      if (this._imps.some(y => y.ordem > x.ordem && !y.desfeita_em))
        throw falha('Só dá para desfazer a última importação. Desfaça antes as que vieram depois dela.');
      const n = db.despesas.filter(d => d.importacao === id).length;
      db.despesas = db.despesas.filter(d => d.importacao !== id);
      x.desfeita_em = new Date().toISOString();
      x.desfeita_por = eu.id;
      x.retiradas = n;
      persistir();
      return n;
    },
    async desfazerExclusao(tabela, id) {
      const x = this._lixo[tabela + ':' + id];
      if (!x || !eu || x.quem !== eu.id) throw falha('Só quem excluiu pode desfazer; peça à coordenação para restaurar pelo Histórico.');
      if (Date.now() - x.em > 30 * 60000) throw falha('Passou o tempo de desfazer; peça à coordenação para restaurar pelo Histórico.');
      if (db[tabela].some(y => y.id === id)) throw falha('O registro já existe de novo; não há exclusão a desfazer.');
      const r = Object.assign({}, x.r);
      delete r.arquivo;
      delete r.arquivo_nome;
      r.atualizado_em = new Date().toISOString();
      if (tabela === 'lotes' && db.lotes.some(l => l.codigo === r.codigo)) r.codigo = R.codigoLote(db, r);
      const msg = R.validar(db, tabela, r, null);
      if (msg) throw falha(msg);
      db[tabela].push(r);
      x.pres.forEach(pid => {
        const p = db.presencas.find(y => y.id === pid);
        if (p && !p.agricultor) p.agricultor = id;
      });
      delete this._lixo[tabela + ':' + id];
      persistir();
      return { ok: true, tabela, id };
    },
    /* demonstração: alguns registros fictícios, montados com os dados de exemplo, para mostrar como o histórico aparece */
    async auditoria(limite, antes) {
      if (!db) carregarLocal();
      if (SIM) {
        const H = (this._rest || []).concat(historicoSim());
        this._hist = H;
        return H.filter(x => !antes || x.em < antes).slice(0, limite || 200);
      }
      if (antes) return [];
      const quem = (db.pessoas.find(p => p.perfil === 'Coordenação') || {}).id,
        eqp = (db.pessoas.find(p => p.perfil === 'Equipe') || {}).id,
        h = Date.now(),
        H = [];
      const em = horas => new Date(h - horas * 3600e3).toISOString(),
        l = db.lotes[0],
        u = db.unidades[0],
        v = db.visitas[0];
      if (l)
        H.push({
          id: 1,
          tabela: 'lotes',
          registro_id: l.id,
          acao: 'UPDATE',
          por: eqp,
          em: em(2),
          antes: Object.assign({}, l, { status: 'Maturando' }),
          depois: l
        });
      H.push({
        id: 2,
        tabela: 'planilhas',
        acao: 'PLANILHA',
        por: quem,
        em: em(5),
        depois: { tipo: 'agricultores', qtd: db.agricultores.length }
      });
      if (v) H.push({ id: 3, tabela: 'visitas', registro_id: v.id, acao: 'INSERT', por: eqp, em: em(27), depois: v });
      if (u)
        H.push({
          id: 4,
          tabela: 'unidades',
          registro_id: u.id,
          acao: 'UPDATE',
          por: quem,
          em: em(50),
          antes: Object.assign({}, u, { local_ok: false }),
          depois: u
        });
      H.push({
        id: 5,
        tabela: 'planilhas',
        acao: 'PLANILHA',
        por: quem,
        em: em(75),
        depois: { tipo: 'json', qtd: D.TABELAS.reduce((t, k) => t + (db[k] || []).length, 0) }
      });
      const v2 = db.visitas[1];
      if (v2 && !db.visitas.some(x => x.id === 'v-excluida-demo'))
        H.push({
          id: 6,
          tabela: 'visitas',
          registro_id: 'v-excluida-demo',
          acao: 'DELETE',
          por: eqp,
          em: em(90),
          antes: Object.assign({}, v2, { id: 'v-excluida-demo', obs: 'Visita excluída por engano (exemplo)' })
        });
      for (const r of this._rest || []) H.unshift(r);
      this._hist = H;
      return H.slice(0, limite || 200);
    },
    /* demonstração: restaura na memória, como o banco faria (script 39) */
    async restaurar(id, forcar) {
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação restaura versões pelo histórico.');
      const h = (this._hist || []).find(x => x.id === id);
      if (!h || !h.antes) throw falha('Esta linha do histórico não existe mais.');
      const t = h.tabela,
        sem = o => {
          const c = Object.assign({}, o);
          delete c.criado_em;
          delete c.criado_por;
          delete c.atualizado_em;
          delete c.arquivo;
          delete c.arquivo_nome;
          return c;
        };
      if (!forcar && (this._rest || []).some(r => r.registro_id === h.registro_id)) return { ok: false, conflito: true };
      if (h.acao === 'DELETE') {
        if (db[t].some(x => x.id === h.registro_id)) throw falha('O registro já existe de novo; não há exclusão a desfazer.');
        db[t].push(Object.assign(sem(h.antes), { atualizado_em: new Date().toISOString() }));
      } else {
        const r = db[t].find(x => x.id === h.registro_id);
        if (!r) throw falha('O registro foi excluído depois desta alteração.');
        Object.assign(r, sem(h.antes), { atualizado_em: new Date().toISOString() });
      }
      persistir();
      (this._rest = this._rest || []).push({
        id: 1000 + this._rest.length,
        tabela: t,
        registro_id: h.registro_id,
        acao: h.acao === 'DELETE' ? 'INSERT' : 'UPDATE',
        por: eu.id,
        em: new Date().toISOString(),
        depois: db[t].find(x => x.id === h.registro_id),
        obs: 'restauração'
      });
      return { ok: true };
    },
    async registrarDownload() {
      /* a demonstração não guarda histórico */
    },
    async informarFila() {},
    async listarFila() {
      // demonstração: um exemplo fixo, para a coordenação ver como aparece
      if (!eu || eu.perfil !== 'Coordenação' || SIM) return [];
      return [
        {
          pessoa: 'p-equipe',
          nome: 'Equipe (demonstração)',
          quantos: 3,
          recusados: 1,
          desde: new Date(Date.now() - 3 * 864e5).toISOString(),
          informado_em: new Date(Date.now() - 2 * 3600e3).toISOString(),
          ex: 1
        }
      ];
    },
    /* fotos na demonstração: a imagem fica só na memória desta página (não ocupa o armazenamento do navegador) */
    _img: {},
    async enviarFoto(tabela, registro, blob, tiradaEm, legenda) {
      if (!R.podeGravar(eu, 'fotos')) throw falha('O seu perfil não tem permissão para fazer isso.');
      if (!(db[tabela] || []).some(x => x.id === registro))
        throw falha('O registro desta foto (atividade, visita ou biofábrica) não existe mais.');
      const id = SQC.novoId();
      this._img[id] = blob;
      return this.salvar('fotos', {
        id,
        tabela,
        registro,
        caminho: `${tabela}/${registro}/${id}.jpg`,
        tirada_em: tiradaEm || null,
        legenda: legenda || null
      });
    },
    async arquivoFoto(f) {
      if (!this._img[f.id] && SIM) this._img[f.id] = await fotoFicticia(f.legenda);
      if (!this._img[f.id]) throw falha('Na demonstração a imagem fica só enquanto a página está aberta.');
      return this._img[f.id];
    },
    async excluirFoto(f) {
      await this.excluir('fotos', f.id);
      delete this._img[f.id];
    },
    async destacarFoto(id, sim) {
      /* as mesmas regras do 55 */
      if (!db) carregarLocal();
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação escolhe as fotos do relatório.');
      const f = (db.fotos || []).find(x => x.id === id);
      if (!f) throw falha('Esta foto não existe mais.');
      if (sim) {
        if (f.tabela === 'visitas') {
          const v = (db.visitas || []).find(x => x.id === f.registro),
            a = v && (db.agricultores || []).find(x => x.id === v.agricultor);
          if (!a || a.imagem !== 'Sim')
            throw falha('A pessoa desta visita não autorizou o uso de imagem no termo: a foto não vai para o relatório.');
        }
        if (db.fotos.filter(x => x.tabela === f.tabela && x.registro === f.registro && x.destaque && x.id !== id).length >= 2)
          throw falha('Já há 2 fotos deste registro no relatório. Tire a estrela de uma delas antes.');
      }
      f.destaque = !!sim;
      f.atualizado_em = new Date().toISOString();
      persistir();
      return f.atualizado_em;
    },
    /* link de cadastro, simulado neste navegador (na demonstração o "banco" é o próprio aparelho) */
    preparar() {},
    _cv(g) {
      const K = 'sqc-demo-convites';
      let l = [];
      try {
        l = JSON.parse(ler(K)) || [];
      } catch (e) {
        l = [];
      }
      if (g) {
        const n = g(l);
        gravar(K, JSON.stringify(n));
        return n;
      }
      return l;
    },
    async convites() {
      if (!eu || eu.perfil !== 'Coordenação') return [];
      return this._cv()
        .filter(c => c.status === 'preenchido' || (c.status === 'aberto' && new Date(c.expira_em) > new Date()))
        .map(c => ({
          id: c.id,
          funcao: c.funcao,
          status: c.status,
          dados: c.dados,
          expira_em: c.expira_em,
          preenchido_em: c.preenchido_em,
          criado_em: c.criado_em
        }));
    },
    async criarConvite(funcao) {
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação gera link de cadastro.');
      const token = (SQC.novoId() + SQC.novoId()).replace(/-/g, '');
      this._cv(l =>
        l.concat([
          {
            id: SQC.novoId(),
            funcao,
            token,
            status: 'aberto',
            dados: null,
            expira_em: new Date(Date.now() + 7 * 864e5).toISOString(),
            criado_em: new Date().toISOString()
          }
        ])
      );
      return token;
    },
    async conviteVer(token) {
      const c = this._cv().find(x => x.token === token && x.status === 'aberto' && new Date(x.expira_em) > new Date());
      return c ? c.funcao : null;
    },
    async conviteEnviar(token, dados) {
      let ok = false;
      const limpo = {};
      R.CAMPOS_CONVITE.forEach(k => {
        if (k in dados && String(dados[k]).length <= 300) limpo[k] = dados[k];
      });
      const fn = (this._cv().find(x => x.token === token) || {}).funcao;
      const msg = R.validarConvite(limpo, fn);
      if (msg) throw falha(msg);
      this._cv(l =>
        l.map(c => {
          if (c.token === token && c.status === 'aberto' && new Date(c.expira_em) > new Date()) {
            ok = true;
            return Object.assign({}, c, { status: 'preenchido', dados: limpo, preenchido_em: new Date().toISOString() });
          }
          return c;
        })
      );
      if (!ok) throw falha('Este link já foi usado ou venceu. Peça outro à coordenação do projeto.');
    },
    async conviteEncerrar(id, status) {
      if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação encerra convite.');
      this._cv(l => l.map(c => (c.id === id ? Object.assign({}, c, { status, dados: null }) : c)));
    },
    async acessos() {
      if (!db) carregarLocal();
      return eu && eu.perfil === 'Coordenação'
        ? db.pessoas.map((p, i) => ({
            id: p.id,
            nome: p.nome,
            perfil: p.perfil,
            orgao: p.orgao,
            ativo: p.ativo !== false,
            ultimo:
              p.id === eu.id
                ? new Date().toISOString()
                : SIM
                  ? new Date(Date.now() - (i * 19 + 3) * 3600e3).toISOString()
                  : i === 1
                    ? new Date(Date.now() - 12 * 864e5).toISOString()
                    : null
          }))
        : [];
    }, // simulação: todo mundo entrou nos últimos dias
    /* só na demonstração */
    async apagarExemplos() {
      ['distribuicoes', 'visitas', 'lotes', 'agricultores', 'eventos', 'entregas', 'itens', 'despesas', 'membros'].forEach(t => {
        db[t] = db[t].filter(r => !r.ex);
      });
      db.distribuicoes = db.distribuicoes.filter(
        x => db.lotes.some(l => l.id === x.lote) && db.agricultores.some(a => a.id === x.agricultor)
      );
      db.visitas = db.visitas.filter(x => db.agricultores.some(a => a.id === x.agricultor));
      db.presencas = (db.presencas || []).filter(x => db.eventos.some(e => e.id === x.evento));
      db.fotos = (db.fotos || []).filter(x => (db[x.tabela] || []).some(r => r.id === x.registro));
      persistir();
    },
    async recomecar() {
      const p = db.pessoas;
      db = semente();
      db.pessoas = p;
      persistir();
    },
    _db: () => db,
    _zerar() {
      db = null;
      eu = null;
      Object.keys(mem).forEach(k => delete mem[k]);
      try {
        G.localStorage.removeItem(CHAVE);
        G.localStorage.removeItem(CHAVE + '-eu');
      } catch (e) {}
    }
  };
})();
