/* =====================================================================
   Prospeceve · storage.js
   Persistência em LocalStorage. Expõe window.PP.Storage.
   Coleções: clients, projects, payments, files, activity, settings.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const { uid, today } = PP.Utils;

  const KEY = 'prospeceve.db.v1';

  /* Estrutura padrão + dados de exemplo (só na primeira execução). */
  function seed() {
    const c1 = uid('cli'), c2 = uid('cli'), c3 = uid('cli');
    const p1 = uid('prj'), p2 = uid('prj');
    return {
      settings: { userName: 'Você', theme: 'light', accentTheme: 'green', company: 'Meu Ateliê Web' },
      dashboardLayout: defaultDashboardLayout(),
      clients: [
        {
          id: c1, name: 'Ana Beatriz Souza', company: 'Doceria da Ana', phone: '(21) 99999-1010',
          whatsapp: '(21) 99999-1010', email: 'ana@doceriadaana.com', address: 'Rua das Flores, 120',
          city: 'Rio de Janeiro', state: 'RJ', cep: '20000-000', region: 'Zona Sul',
          instagram: '@doceriadaana', currentSite: '', leadSource: 'Instagram',
          firstContact: '2026-05-02', lastContact: '2026-06-20', nextFollowup: '2026-07-10',
          notes: 'Quer um site com cardápio online e botão de WhatsApp.', status: 'producao',
          proposal: { value: 3200, discount: 200, date: '2026-05-10', accepted: true, refusedReason: '', notes: '30% de entrada' },
          domain: { registrar: 'Registro.br', login: 'ana.souza', password: 'oculta', date: '2026-05-15', expires: '2027-05-15', ssl: true, backup: true },
          maintenance: { plan: 'Essencial', monthly: 120, nextPayment: '2026-07-15', tickets: 0, history: '' },
          createdAt: '2026-05-02'
        },
        {
          id: c2, name: 'Carlos Mendes', company: 'CM Advocacia', phone: '(11) 98888-2020',
          whatsapp: '(11) 98888-2020', email: 'carlos@cmadv.com.br', address: 'Av. Paulista, 900',
          city: 'São Paulo', state: 'SP', cep: '01310-100', region: 'Centro',
          instagram: '@cmadvocacia', currentSite: 'cmadv.com.br', leadSource: 'Indicação',
          firstContact: '2026-04-12', lastContact: '2026-06-28', nextFollowup: '2026-07-05',
          notes: 'Site institucional sério, com blog jurídico.', status: 'aceita',
          proposal: { value: 5400, discount: 0, date: '2026-04-20', accepted: true, refusedReason: '', notes: '' },
          domain: { registrar: '', login: '', password: '', date: '', expires: '', ssl: false, backup: false },
          maintenance: { plan: '', monthly: 0, nextPayment: '', tickets: 0, history: '' },
          createdAt: '2026-04-12'
        },
        {
          id: c3, name: 'Juliana Prado', company: 'Studio JP Fotografia', phone: '(31) 97777-3030',
          whatsapp: '(31) 97777-3030', email: 'ju@studiojp.com', address: 'Rua da Bahia, 45',
          city: 'Belo Horizonte', state: 'MG', cep: '30160-010', region: 'Savassi',
          instagram: '@studiojp', currentSite: '', leadSource: 'Google',
          firstContact: '2026-06-15', lastContact: '2026-06-25', nextFollowup: '2026-07-02',
          notes: 'Portfólio com galeria de fotos e agendamento.', status: 'proposta',
          proposal: { value: 2800, discount: 0, date: '2026-06-18', accepted: false, refusedReason: '', notes: 'Aguardando resposta' },
          domain: { registrar: '', login: '', password: '', date: '', expires: '', ssl: false, backup: false },
          maintenance: { plan: '', monthly: 0, nextPayment: '', tickets: 0, history: '' },
          createdAt: '2026-06-15'
        },
      ],
      projects: [
        {
          id: p1, clientId: c1, name: 'Site Doceria da Ana', createdAt: '2026-05-12',
          stages: defaultStages([{ i: 0, s: 'done' }, { i: 1, s: 'done' }, { i: 2, s: 'doing' }]),
          checklist: defaultChecklist(['Logo', 'Fotos', 'Textos', 'Domínio']),
        },
        {
          id: p2, clientId: c2, name: 'Site CM Advocacia', createdAt: '2026-04-22',
          stages: defaultStages([{ i: 0, s: 'done' }]),
          checklist: defaultChecklist(['Logo']),
        },
      ],
      payments: [
        { id: uid('pay'), clientId: c1, projectId: p1, total: 3000, entry: 900, received: 900, method: 'PIX', status: 'pendente', date: '2026-05-12', installments: 3, notes: 'Entrada paga' },
        { id: uid('pay'), clientId: c2, projectId: p2, total: 5400, entry: 2700, received: 5400, method: 'Transferência', status: 'pago', date: '2026-06-30', installments: 2, notes: '' },
      ],
      files: [
        { id: uid('file'), clientId: c1, name: 'logo-doceria.png', kind: 'Logo', size: '84 KB', date: '2026-05-14' },
        { id: uid('file'), clientId: c1, name: 'fotos-produtos.zip', kind: 'Fotos', size: '3,2 MB', date: '2026-05-16' },
      ],
      activity: [
        { id: uid('act'), text: 'Projeto “Site Doceria da Ana” avançou para Front-end', date: today(), ico: '🌼' },
        { id: uid('act'), text: 'Pagamento recebido de CM Advocacia', date: today(), ico: '🪙' },
        { id: uid('act'), text: 'Nova proposta enviada para Studio JP', date: '2026-06-18', ico: '🧵' },
      ],
    };
  }

  /* Etapas padrão da timeline de um projeto. */
  function defaultStages(overrides = []) {
    const names = ['Briefing', 'Layout', 'Front-end', 'Back-end', 'Responsividade',
      'SEO', 'Performance', 'Testes', 'Correções', 'Aprovação', 'Publicação'];
    const map = {}; overrides.forEach(o => map[o.i] = o.s);
    return names.map((n, i) => ({
      name: n, status: map[i] || 'todo', date: map[i] === 'done' ? '' : '', notes: '',
      progress: map[i] === 'done' ? 100 : map[i] === 'doing' ? 50 : 0,
    }));
  }

  /* Checklist padrão de publicação. */
  function defaultChecklist(doneItems = []) {
    const names = ['Logo', 'Fotos', 'Textos', 'Domínio', 'Hospedagem', 'DNS', 'SSL',
      'Analytics', 'Search Console', 'SEO', 'Backup', 'WhatsApp', 'Publicação'];
    return names.map(n => ({ name: n, done: doneItems.includes(n) }));
  }

  /* Layout padrão dos quadros (widgets) do dashboard. */
  function defaultDashboardLayout() {
    return [
      { id: uid('wid'), type: 'stat:clients',    w: 3, h: 8 },
      { id: uid('wid'), type: 'stat:projects',   w: 3, h: 8 },
      { id: uid('wid'), type: 'stat:received',   w: 3, h: 8 },
      { id: uid('wid'), type: 'stat:pending',    w: 3, h: 8 },
      { id: uid('wid'), type: 'stat:published',  w: 3, h: 8 },
      { id: uid('wid'), type: 'stat:inProgress', w: 3, h: 8 },
      { id: uid('wid'), type: 'stat:proposals',  w: 3, h: 8 },
      { id: uid('wid'), type: 'stat:monthProfit',w: 3, h: 8 },
      { id: uid('wid'), type: 'chart:revenue',        w: 6, h: 16 },
      { id: uid('wid'), type: 'quick:actions',        w: 6, h: 15 },
      { id: uid('wid'), type: 'list:projectProgress', w: 6, h: 16 },
      { id: uid('wid'), type: 'list:recentProjects',  w: 6, h: 15 },
      { id: uid('wid'), type: 'list:recentActivity',  w: 6, h: 15 },
    ];
  }

  /* ---- Núcleo de leitura/escrita ---- */
  let db = null;

  function load() {
    if (db) return db;
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? JSON.parse(raw) : seed();
    } catch (e) {
      console.warn('Falha ao ler dados, recriando.', e);
      db = seed();
    }
    return db;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { PP.Utils.toast('Não foi possível salvar (armazenamento cheio?)', 'error'); }
  }

  /* Registra uma atividade recente. */
  function log(text, ico = '✨') {
    load();
    db.activity.unshift({ id: uid('act'), text, date: today(), ico });
    db.activity = db.activity.slice(0, 40);
    save();
  }

  /* Fábrica de CRUD genérico para uma coleção. */
  function collection(name, prefix) {
    return {
      all() { return load()[name].slice(); },
      get(id) { return load()[name].find(x => x.id === id) || null; },
      add(obj) {
        load();
        const item = Object.assign({ id: uid(prefix), createdAt: today() }, obj);
        db[name].push(item); save(); return item;
      },
      update(id, patch) {
        load();
        const i = db[name].findIndex(x => x.id === id);
        if (i < 0) return null;
        db[name][i] = Object.assign({}, db[name][i], patch);
        save(); return db[name][i];
      },
      remove(id) {
        load();
        db[name] = db[name].filter(x => x.id !== id);
        save();
      },
    };
  }

  const Storage = {
    load, save, log, defaultStages, defaultChecklist, defaultDashboardLayout,

    clients:  collection('clients', 'cli'),
    projects: collection('projects', 'prj'),
    payments: collection('payments', 'pay'),
    files:    collection('files', 'file'),

    activity() { return load().activity.slice(); },

    settings() { return load().settings; },
    saveSettings(patch) { load(); db.settings = Object.assign({}, db.settings, patch); save(); },

    /** Layout de quadros (widgets) do dashboard. */
    dashboardLayout() {
      load();
      if (!Array.isArray(db.dashboardLayout)) db.dashboardLayout = defaultDashboardLayout();
      return db.dashboardLayout.slice();
    },
    saveDashboardLayout(layout) { load(); db.dashboardLayout = layout; save(); },

    /** Exporta todo o banco como string JSON (para backup). */
    export() { return JSON.stringify(load(), null, 2); },

    /** Importa um JSON de backup. Retorna true/false. */
    import(json) {
      try {
        const data = JSON.parse(json);
        if (!data.clients || !data.settings) throw new Error('formato inválido');
        db = data; save(); return true;
      } catch (e) { return false; }
    },

    /** Zera tudo e recria os dados de exemplo. */
    reset() { db = seed(); save(); },

    /** Apaga tudo, deixando o sistema vazio. */
    wipe() {
      db = { settings: { userName: 'Você', theme: 'light', company: '' },
             dashboardLayout: defaultDashboardLayout(),
             clients: [], projects: [], payments: [], files: [], activity: [] };
      save();
    },
  };

  PP.Storage = Storage;
})();
