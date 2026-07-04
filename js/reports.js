/* =====================================================================
   Prospeceve · reports.js
   Relatórios: clientes por status, financeiro, projetos, produção,
   faturamento por forma de pagamento. Expõe window.PP.Reports.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;

  function render(container) {
    const S = PP.Storage;
    const clients = S.clients.all();
    const projects = S.projects.all();
    const payments = S.payments.all();
    const t = PP.Financial.totals();

    // clientes por status
    const byStatus = {};
    clients.forEach(c => byStatus[c.status] = (byStatus[c.status] || 0) + 1);

    // faturamento por forma de pagamento
    const byMethod = {};
    payments.forEach(p => byMethod[p.method || '—'] = (byMethod[p.method || '—'] || 0) + (Number(p.received) || 0));

    // produção: etapas concluídas x total
    let stagesDone = 0, stagesTotal = 0;
    projects.forEach(pr => { stagesTotal += pr.stages.length; stagesDone += pr.stages.filter(s => s.status === 'done').length; });

    const published = clients.filter(c => c.status === 'publicado' || c.status === 'finalizado').length;
    const lost = clients.filter(c => c.status === 'perdido').length;
    const conversion = clients.length ? Math.round((clients.filter(c => c.proposal?.accepted).length / clients.length) * 100) : 0;

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">📋 Relatórios</h1>
          <div class="page-head__sub">Uma visão geral do seu ateliê, com carinho pelos números 💐</div>
        </div>
        <div class="page-head__spacer"></div>
        <button class="pill-btn pill-btn--ghost" id="rep-print">🖨️ Imprimir</button>
      </div>

      <div class="grid grid--stats stagger">
        ${stat('green', '🧵', clients.length, 'Clientes')}
        ${stat('blue', '🚀', published, 'Publicados')}
        ${stat('pink', '💔', lost, 'Perdidos')}
        ${stat('yellow', '🎯', conversion + '%', 'Conversão')}
      </div>

      <div class="grid grid--2" style="margin-top:22px; align-items:start">
        <section class="cushion">
          <h3 class="section-title">🧵 Clientes por status</h3>
          ${Object.keys(byStatus).length ? Object.entries(byStatus)
            .sort((a, b) => b[1] - a[1])
            .map(([st, n]) => barRow(PP.Clients.statusLabel(st), n, clients.length)).join('')
            : vazio()}
        </section>

        <section class="cushion">
          <h3 class="section-title">💳 Faturamento por forma</h3>
          ${Object.keys(byMethod).length ? Object.entries(byMethod)
            .sort((a, b) => b[1] - a[1])
            .map(([m, v]) => barRow(m, v, t.received, true)).join('')
            : vazio()}
        </section>
      </div>

      <div class="grid grid--2" style="margin-top:22px; align-items:start">
        <section class="cushion">
          <h3 class="section-title">🪙 Resumo financeiro</h3>
          <div class="info-list">
            ${line('Total contratado', U.money(t.contracted))}
            ${line('Total recebido', U.money(t.received))}
            ${line('Total pendente', U.money(t.pending))}
            ${line('Lucro do mês', U.money(t.monthProfit))}
            ${line('Lucro do ano', U.money(t.yearProfit))}
          </div>
        </section>

        <section class="cushion">
          <h3 class="section-title">🌼 Produção</h3>
          <div class="info-list">
            ${line('Projetos', projects.length)}
            ${line('Etapas concluídas', `${stagesDone} de ${stagesTotal}`)}
            ${line('Progresso geral', (stagesTotal ? Math.round(stagesDone / stagesTotal * 100) : 0) + '%')}
          </div>
          <div class="pbar" style="margin-top:14px"><div class="pbar__fill" style="width:${stagesTotal ? Math.round(stagesDone / stagesTotal * 100) : 0}%"></div></div>
        </section>
      </div>
    `;

    U.qs('#rep-print', container).onclick = () => window.print();
  }

  function barRow(label, value, total, money = false) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return `<div class="progress-row">
      <span class="progress-row__label">${U.esc(label)}</span>
      <div class="pbar pbar--blue" style="flex:1"><div class="pbar__fill" style="width:${pct}%"></div></div>
      <span class="progress-row__pct">${money ? U.money(value) : value}</span>
    </div>`;
  }
  function stat(color, ico, value, label) {
    return `<div class="stat stat--${color}"><div class="stat__ico">${ico}</div>
      <div class="stat__value">${value}</div><div class="stat__label">${label}</div></div>`;
  }
  function line(l, v) { return `<div class="info-list__row"><b>${l}</b><span>${v}</span></div>`; }
  function vazio() { return `<div class="page-head__sub" style="padding:12px 0">Sem dados suficientes ainda 🌱</div>`; }

  PP.Reports = { render };
})();
