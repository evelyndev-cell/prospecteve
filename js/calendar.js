/* =====================================================================
   Prospeceve · calendar.js
   Calendário mensal navegável. Junta em cada dia:
   pagamentos, entregas de projeto, follow-ups e renovações de domínio.
   Expõe window.PP.Calendar.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;
  const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  let cursor = new Date(); cursor.setDate(1);

  /* Constrói um mapa { 'yyyy-mm-dd': [ {type,label} ] }. */
  function buildEvents() {
    const S = PP.Storage;
    const ev = {};
    const push = (iso, type, label) => {
      if (!iso) return;
      const key = iso.slice(0, 10);
      (ev[key] = ev[key] || []).push({ type, label });
    };

    S.payments.all().forEach(p => {
      const c = S.clients.get(p.clientId);
      push(p.date, 'pay', `💵 ${c?.name || 'Pagamento'} · ${U.money(p.total)}`);
    });
    S.clients.all().forEach(c => {
      push(c.nextFollowup, 'fup', `🌸 Follow-up · ${c.name}`);
      if (c.domain?.expires) push(c.domain.expires, 'del', `🌐 Renovação · ${c.company || c.name}`);
      if (c.maintenance?.nextPayment) push(c.maintenance.nextPayment, 'pay', `🔧 Manutenção · ${c.name}`);
    });
    S.projects.all().forEach(pr => {
      const pub = pr.stages.find(s => s.name === 'Publicação');
      if (pub?.date) push(pub.date, 'del', `📦 Entrega · ${pr.name}`);
    });
    return ev;
  }

  function render(container) {
    const events = buildEvents();
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayISO = U.today();

    const cells = [];
    // dias do mês anterior para preencher
    const prevDays = new Date(y, m, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) cells.push({ out: true, day: prevDays - i, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ out: false, day: d, iso });
    }
    while (cells.length % 7 !== 0) cells.push({ out: true, day: cells.length, iso: null });

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">📅 Calendário</h1>
          <div class="page-head__sub">Pagamentos, entregas, reuniões, follow-ups e renovações</div>
        </div>
      </div>

      <section class="cushion">
        <div class="cal-head">
          <button class="icon-btn" id="cal-prev" aria-label="Mês anterior">‹</button>
          <h3 style="font-size:20px; min-width:190px; text-align:center">${MONTHS[m]} ${y}</h3>
          <button class="icon-btn" id="cal-next" aria-label="Próximo mês">›</button>
          <div class="page-head__spacer"></div>
          <button class="pill-btn pill-btn--ghost pill-btn--sm" id="cal-today">Hoje</button>
        </div>

        <div class="cal-grid" style="margin-bottom:8px">
          ${DOW.map(d => `<div class="cal-dow">${d}</div>`).join('')}
        </div>
        <div class="cal-grid">
          ${cells.map(c => {
            const list = c.iso ? (events[c.iso] || []) : [];
            const isToday = c.iso === todayISO;
            return `<div class="cal-cell ${c.out ? 'is-out' : ''} ${isToday ? 'is-today' : ''}">
              <span class="cal-cell__num">${c.day}</span>
              ${list.slice(0, 3).map(e => `<span class="cal-event cal-event--${e.type}" title="${U.esc(e.label)}">${U.esc(e.label)}</span>`).join('')}
              ${list.length > 3 ? `<span class="page-head__sub" style="font-size:10px">+${list.length - 3} mais</span>` : ''}
            </div>`;
          }).join('')}
        </div>

        <div style="display:flex; gap:14px; flex-wrap:wrap; margin-top:16px; font-size:12px">
          <span class="chip cal-event--pay">💵 Pagamentos</span>
          <span class="chip cal-event--del">📦 Entregas / renovações</span>
          <span class="chip cal-event--fup">🌸 Follow-ups</span>
        </div>
      </section>
    `;

    U.qs('#cal-prev', container).onclick = () => { cursor.setMonth(cursor.getMonth() - 1); render(container); };
    U.qs('#cal-next', container).onclick = () => { cursor.setMonth(cursor.getMonth() + 1); render(container); };
    U.qs('#cal-today', container).onclick = () => { cursor = new Date(); cursor.setDate(1); render(container); };
  }

  PP.Calendar = { render };
})();
