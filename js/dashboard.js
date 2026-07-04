/* =====================================================================
   Prospeceve · dashboard.js
   Painel inicial com quadros (widgets) que podem ser arrastados,
   redimensionados, adicionados e removidos pelo usuário.
   Expõe window.PP.Dashboard.render(container) e .projectProgress(pr).
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;

  /* Tamanho de cada "unidade" do grid (deve casar com o CSS .dash-grid) */
  const ROW_PX = 20, GAP_PX = 16, COLS = 12;

  /* ---------------------------------------------------------------
     Cálculos de dados (reaproveitados pelos widgets)
     --------------------------------------------------------------- */
  function computeStats() {
    const S = PP.Storage;
    const clients = S.clients.all();
    const projects = S.projects.all();
    const payments = S.payments.all();

    const received = payments.reduce((s, p) => s + (Number(p.received) || 0), 0);
    const totalContracted = payments.reduce((s, p) => s + (Number(p.total) || 0), 0);
    const pending = totalContracted - received;

    const published = clients.filter(c => c.status === 'publicado' || c.status === 'finalizado').length;
    const inProgress = projects.filter(p => p.stages.some(s => s.status !== 'done') &&
      p.stages.some(s => s.status !== 'todo')).length ||
      clients.filter(c => c.status === 'producao').length;
    const proposals = clients.filter(c => c.status === 'proposta' || c.status === 'negociacao').length;

    const ym = new Date().toISOString().slice(0, 7);
    const monthProfit = payments
      .filter(p => (p.date || '').slice(0, 7) === ym)
      .reduce((s, p) => s + (Number(p.received) || 0), 0);

    return {
      clients: clients.length, projects: projects.length,
      received, pending, published, inProgress, proposals, monthProfit,
    };
  }

  function projectProgress(pr) {
    if (!pr.stages.length) return 0;
    const sum = pr.stages.reduce((s, st) => s + (Number(st.progress) || 0), 0);
    return Math.round(sum / pr.stages.length);
  }

  function drawRevenueChart(canvas) {
    const S = PP.Storage;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const months = [];
    const base = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push({ key: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('pt-BR', { month: 'short' }), value: 0 });
    }
    S.payments.all().forEach(p => {
      const m = months.find(x => x.key === (p.date || '').slice(0, 7));
      if (m) m.value += Number(p.received) || 0;
    });

    const max = Math.max(1, ...months.map(m => m.value));
    const pad = 34, gap = 18;
    const barW = (W - pad * 2 - gap * (months.length - 1)) / months.length;

    ctx.strokeStyle = '#e6ded6'; ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
    ctx.setLineDash([]);

    months.forEach((m, i) => {
      const x = pad + i * (barW + gap);
      const h = (m.value / max) * (H - pad * 2);
      const y = H - pad - h;
      const grad = ctx.createLinearGradient(0, y, 0, H - pad);
      grad.addColorStop(0, '#8ed6f8'); grad.addColorStop(1, '#59bfef');
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barW, h, 8); ctx.fill();
      ctx.fillStyle = '#8d7a70'; ctx.font = '600 12px Quicksand, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, x + barW / 2, H - pad + 18);
      if (m.value > 0) {
        ctx.fillStyle = '#5d4037'; ctx.font = '700 11px Quicksand, sans-serif';
        ctx.fillText(shortMoney(m.value), x + barW / 2, y - 6);
      }
    });
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2 || r);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function shortMoney(v) {
    if (v >= 1000) return 'R$' + (v / 1000).toFixed(1).replace('.', ',') + 'k';
    return 'R$' + v;
  }
  function emptyLine(t) { return `<div class="page-head__sub" style="padding:10px 0">${t}</div>`; }

  /* ---------------------------------------------------------------
     Registro dos quadros disponíveis (cada um representa uma função)
     --------------------------------------------------------------- */
  function statBody(color, ico, value, label) {
    return `<div class="stat stat--${color}" style="cursor:default">
      <div class="stat__ico">${ico}</div>
      <div class="stat__value">${value}</div>
      <div class="stat__label">${label}</div>
    </div>`;
  }

  function buildRegistry(ctx) {
    const { s, S, projects, activity } = ctx;
    return {
      'stat:clients':     { label: 'Clientes',            ico: '🧵', group: 'Estatística', w: 3, h: 8, minW: 2, minH: 6,
        html: () => statBody('green', '🧵', s.clients, 'Clientes') },
      'stat:projects':    { label: 'Projetos',             ico: '🌼', group: 'Estatística', w: 3, h: 8, minW: 2, minH: 6,
        html: () => statBody('blue', '🌼', s.projects, 'Projetos') },
      'stat:received':    { label: 'Valor recebido',       ico: '🪙', group: 'Estatística', w: 3, h: 8, minW: 2, minH: 6,
        html: () => statBody('yellow', '🪙', U.money(s.received), 'Valor recebido') },
      'stat:pending':     { label: 'Valor pendente',       ico: '⏳', group: 'Estatística', w: 3, h: 8, minW: 2, minH: 6,
        html: () => statBody('pink', '⏳', U.money(s.pending), 'Valor pendente') },
      'stat:published':   { label: 'Sites publicados',     ico: '🚀', group: 'Estatística', w: 3, h: 8, minW: 2, minH: 6,
        html: () => statBody('green', '🚀', s.published, 'Sites publicados') },
      'stat:inProgress':  { label: 'Em andamento',         ico: '🛠️', group: 'Estatística', w: 3, h: 8, minW: 2, minH: 6,
        html: () => statBody('orange', '🛠️', s.inProgress, 'Em andamento') },
      'stat:proposals':   { label: 'Propostas aguardando', ico: '📨', group: 'Estatística', w: 3, h: 8, minW: 2, minH: 6,
        html: () => statBody('lilac', '📨', s.proposals, 'Propostas aguardando') },
      'stat:monthProfit': { label: 'Lucro do mês',         ico: '💰', group: 'Estatística', w: 3, h: 8, minW: 2, minH: 6,
        html: () => statBody('yellow', '💰', U.money(s.monthProfit), 'Lucro do mês') },

      'quick:actions': {
        label: 'Ações rápidas', ico: '⚡', group: 'Atalho', w: 6, h: 15, minW: 4, minH: 8,
        html: () => `<h3 class="section-title">⚡ Ações rápidas</h3>
          <div class="quick-actions">
            <button type="button" class="quick-action quick-action--green" data-quick="client">
              <span class="quick-action__ico">🧵</span>
              <span class="quick-action__label">Novo cliente</span>
            </button>
            <button type="button" class="quick-action quick-action--blue" data-quick="project">
              <span class="quick-action__ico">🌼</span>
              <span class="quick-action__label">Novo projeto</span>
            </button>
            <button type="button" class="quick-action quick-action--yellow" data-quick="payment">
              <span class="quick-action__ico">🪙</span>
              <span class="quick-action__label">Novo pagamento</span>
            </button>
          </div>`,
        after: (el) => {
          const map = {
            client:  () => PP.Clients.openForm(),
            project: () => PP.Projects.openForm(),
            payment: () => PP.Financial.openForm(),
          };
          el.querySelectorAll('[data-quick]').forEach(btn => {
            btn.onclick = map[btn.dataset.quick];
          });
        },
      },

      'chart:revenue': {
        label: 'Gráfico de faturamento', ico: '📈', group: 'Gráfico', w: 6, h: 16, minW: 4, minH: 10,
        html: () => `<h3 class="section-title">📈 Faturamento (6 meses)</h3>
          <canvas class="dash-chart-canvas" width="520" height="220" style="width:100%;height:calc(100% - 34px)"></canvas>`,
        after: (el) => {
          const canvas = el.querySelector('.dash-chart-canvas');
          if (!canvas) return;
          const cssW = canvas.clientWidth || 520, cssH = canvas.clientHeight || 220;
          canvas.width = cssW; canvas.height = cssH;
          drawRevenueChart(canvas);
        },
      },
      'list:projectProgress': {
        label: 'Andamento dos projetos', ico: '🌼', group: 'Lista', w: 6, h: 16, minW: 4, minH: 8,
        html: () => `<h3 class="section-title">🌼 Andamento dos projetos</h3>
          ${projects.length ? projects.map(pr => {
            const pct = projectProgress(pr);
            return `<div class="progress-row">
              <span class="progress-row__label">${U.esc(pr.name)}</span>
              <div class="pbar" style="flex:1"><div class="pbar__fill" style="width:${pct}%"></div></div>
              <span class="progress-row__pct">${pct}%</span>
            </div>`;
          }).join('') : emptyLine('Nenhum projeto ainda')}`,
      },
      'list:recentProjects': {
        label: 'Projetos recentes', ico: '🧸', group: 'Lista', w: 6, h: 15, minW: 4, minH: 8,
        html: () => `<h3 class="section-title">🧸 Projetos recentes
            <a class="count-pill" href="#/projetos" style="text-decoration:none">ver todos →</a></h3>
          ${projects.length ? projects.map(pr => {
            const client = S.clients.get(pr.clientId);
            const pct = projectProgress(pr);
            return `<div class="progress-row" style="gap:10px">
              <div style="flex:1">
                <b>${U.esc(pr.name)}</b>
                <div class="page-head__sub">${client ? U.esc(client.name) : 'Sem cliente'} · ${pct}% concluído</div>
              </div>
              <a class="mini-btn" href="#/projetos">Abrir</a>
            </div>`;
          }).join('') : emptyLine('Cadastre seu primeiro projeto')}`,
      },
      'list:recentActivity': {
        label: 'Atividades recentes', ico: '✨', group: 'Lista', w: 6, h: 15, minW: 4, minH: 8,
        html: () => `<h3 class="section-title">✨ Atividades recentes</h3>
          ${activity.length ? activity.map(a => `
            <div class="progress-row" style="gap:10px">
              <span style="font-size:20px">${a.ico || '✨'}</span>
              <div style="flex:1">
                <div>${U.esc(a.text)}</div>
                <div class="page-head__sub">${U.dateBR(a.date)}</div>
              </div>
            </div>`).join('') : emptyLine('Sem atividades ainda')}`,
      },
    };
  }

  /* ---------------------------------------------------------------
     Render principal
     --------------------------------------------------------------- */
  function render(container) {
    const S = PP.Storage;
    const s = computeStats();
    const name = S.settings().userName || 'Você';
    const projects = S.projects.all().slice(-4).reverse();
    const activity = S.activity().slice(0, 6);
    const registry = buildRegistry({ s, S, projects, activity });
    const layout = S.dashboardLayout();

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">🏠 Olá, ${U.esc(name)}!</h1>
          <div class="page-head__sub">Aqui está o resumo fofinho do seu ateliê hoje — arraste, redimensione e monte do seu jeito 🌷</div>
        </div>
      </div>
    `;

    const grid = document.createElement('div');
    grid.className = 'dash-grid';
    grid.id = 'dash-grid';
    container.appendChild(grid);

    const bodyRefs = [];
    layout.forEach(item => {
      const def = registry[item.type];
      if (!def) return; // tipo desconhecido (ex.: de um backup antigo) — ignora com segurança
      const { el, bodyEl } = buildWidgetEl(item, def);
      grid.appendChild(el);
      if (def.after) bodyRefs.push({ def, bodyEl });
    });

    // quadro de "adicionar" ao final
    const addWrap = document.createElement('div');
    addWrap.className = 'dash-widget';
    addWrap.style.gridColumn = 'span 3';
    addWrap.style.gridRow = 'span 8';
    addWrap.innerHTML = `<button type="button" class="dash-add-btn" id="dash-add-btn">
      <span class="dash-add-btn__ico">➕</span> Adicionar quadro
    </button>`;
    grid.appendChild(addWrap);

    // desenha conteúdo pós-inserção (ex.: canvas), já que precisa estar no DOM
    bodyRefs.forEach(({ def, bodyEl }) => def.after(bodyEl));

    U.qs('#dash-add-btn', container).onclick = () => openWidgetPicker(registry, layout);
    setupDragAndDrop(grid);
  }

  function buildWidgetEl(item, def) {
    const el = document.createElement('div');
    el.className = 'dash-widget';
    el.dataset.widgetId = item.id;
    el.dataset.type = item.type;
    el.style.gridColumn = `span ${item.w}`;
    el.style.gridRow = `span ${item.h}`;
    el.setAttribute('draggable', 'true');

    const isBare = item.type.startsWith('stat:'); // cartão de estatística já tem seu próprio visual
    el.innerHTML = `
      <div class="dash-widget__head">
        <span class="dash-widget__drag">⠿⠿</span>
        <button type="button" class="dash-widget__remove" title="Remover quadro" data-remove draggable="false">✕</button>
      </div>
      <div class="${isBare ? '' : 'cushion'} dash-widget__body" style="position:relative;${isBare ? 'height:100%' : ''}">
        ${def.html()}
      </div>
      <div class="dash-widget__resize" draggable="false"></div>
    `;

    if (isBare) {
      const drag = el.querySelector('.dash-widget__drag');
      drag.style.display = 'none';
      el.querySelector('.dash-widget__head').style.margin = '0 0 2px';
      el.querySelector('.dash-widget__head').style.minHeight = '0';
    }

    el.querySelector('[data-remove]').onclick = (e) => {
      e.stopPropagation();
      removeWidget(item.id);
    };

    attachResize(el, item);
    return { el, bodyEl: el.querySelector('.dash-widget__body') };
  }

  function removeWidget(id) {
    U.confirm('Remover este quadro do dashboard? Você pode adicioná-lo de volta quando quiser.', { okText: 'Remover' })
      .then(ok => {
        if (!ok) return;
        const layout = PP.Storage.dashboardLayout().filter(w => w.id !== id);
        PP.Storage.saveDashboardLayout(layout);
        PP.Router.reload();
      });
  }

  /* ---------------- Escolher e adicionar um novo quadro ---------------- */
  function openWidgetPicker(registry, currentLayout) {
    const usedTypes = new Set(currentLayout.map(w => w.type));
    const available = Object.entries(registry).filter(([type]) => !usedTypes.has(type));

    const body = available.length
      ? `<div class="widget-picker">
          ${available.map(([type, def]) => `
            <button type="button" class="widget-pick" data-type="${type}">
              <span class="widget-pick__ico">${def.ico}</span>
              <span>
                <div class="widget-pick__label">${U.esc(def.label)}</div>
                <div class="widget-pick__desc">${U.esc(def.group)}</div>
              </span>
            </button>`).join('')}
        </div>`
      : `<div class="page-head__sub" style="padding:14px 0">Todos os quadros disponíveis já estão no seu dashboard! Remova algum para trocar por outro. 🌸</div>`;

    const html = `
      <div class="modal-backdrop">
        <div class="modal">
          <div class="modal__head">
            <h3 class="modal__title">➕ Adicionar quadro</h3>
            <button type="button" class="modal__close" data-close>✕</button>
          </div>
          ${body}
        </div>
      </div>`;
    const back = PP.Clients.mountModal(html);
    back.querySelectorAll('[data-type]').forEach(btn => {
      btn.onclick = () => {
        const type = btn.dataset.type;
        const def = registry[type];
        const layout = PP.Storage.dashboardLayout();
        layout.push({ id: PP.Utils.uid('wid'), type, w: def.w, h: def.h });
        PP.Storage.saveDashboardLayout(layout);
        back.remove();
        PP.Router.reload();
      };
    });
  }

  /* ---------------- Redimensionar (arrastar canto inferior direito) ---------------- */
  function attachResize(el, item) {
    const handle = el.querySelector('.dash-widget__resize');
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const grid = el.parentElement;
      const gridRect = grid.getBoundingClientRect();
      const colPx = (gridRect.width - GAP_PX * (COLS - 1)) / COLS;
      const startX = e.clientX, startY = e.clientY;
      const startW = item.w, startH = item.h;
      el.classList.add('is-resizing');
      handle.setPointerCapture(e.pointerId);

      function onMove(ev) {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        const deltaCols = Math.round(dx / (colPx + GAP_PX));
        const deltaRows = Math.round(dy / (ROW_PX + GAP_PX));
        const newW = Math.min(COLS, Math.max(item.minW || 2, startW + deltaCols));
        const newH = Math.max(item.minH || 6, startH + deltaRows);
        el.style.gridColumn = `span ${newW}`;
        el.style.gridRow = `span ${newH}`;
        el._pendingW = newW; el._pendingH = newH;
      }
      function onUp() {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        el.classList.remove('is-resizing');
        if (el._pendingW && el._pendingH) {
          const layout = PP.Storage.dashboardLayout().map(w =>
            w.id === item.id ? Object.assign({}, w, { w: el._pendingW, h: el._pendingH }) : w);
          PP.Storage.saveDashboardLayout(layout);
        }
        PP.Router.reload();
      }
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    });
  }

  /* ---------------- Arrastar para reordenar ---------------- */
  function setupDragAndDrop(grid) {
    let draggedId = null;

    grid.querySelectorAll('.dash-widget[data-widget-id]').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        draggedId = el.dataset.widgetId;
        el.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', draggedId); } catch (err) {}
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('is-dragging');
        grid.querySelectorAll('.is-drop-target').forEach(x => x.classList.remove('is-drop-target'));
      });
      el.addEventListener('dragover', (e) => {
        if (!draggedId || el.dataset.widgetId === draggedId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        grid.querySelectorAll('.is-drop-target').forEach(x => x.classList.remove('is-drop-target'));
        el.classList.add('is-drop-target');
      });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('is-drop-target');
        const targetId = el.dataset.widgetId;
        if (!draggedId || draggedId === targetId) return;

        const layout = PP.Storage.dashboardLayout();
        const fromIdx = layout.findIndex(w => w.id === draggedId);
        const toIdx = layout.findIndex(w => w.id === targetId);
        if (fromIdx < 0 || toIdx < 0) return;
        const [moved] = layout.splice(fromIdx, 1);
        layout.splice(toIdx, 0, moved);
        PP.Storage.saveDashboardLayout(layout);
        draggedId = null;
        PP.Router.reload();
      });
    });
  }

  PP.Dashboard = { render, projectProgress };
})();
