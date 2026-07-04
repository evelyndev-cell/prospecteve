/* =====================================================================
   Prospeceve · notifications.js
   Calcula alertas a partir dos dados e renderiza o painel de sino.
   Expõe window.PP.Notifications.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const { daysUntil, dateBR, esc } = PP.Utils;

  /** Gera a lista de notificações a partir do estado atual. */
  function compute() {
    const S = PP.Storage;
    const alerts = [];

    // Pagamentos atrasados ou pendentes com data próxima
    S.payments.all().forEach(p => {
      const client = S.clients.get(p.clientId);
      const nome = client ? client.name : 'Cliente';
      if (p.status === 'atrasado') {
        alerts.push({ ico: '⏰', level: 'error', title: 'Pagamento atrasado',
          text: `${nome} · ${PP.Utils.money((p.total || 0) - (p.received || 0))} em aberto` });
      } else if (p.status === 'pendente') {
        const restante = (p.total || 0) - (p.received || 0);
        if (restante > 0) alerts.push({ ico: '🪙', level: 'warn', title: 'Pagamento pendente',
          text: `${nome} · ${PP.Utils.money(restante)} a receber` });
      }
    });

    // Follow-ups e renovações a partir dos clientes
    S.clients.all().forEach(c => {
      const d = daysUntil(c.nextFollowup);
      if (d !== null && d >= 0 && d <= 5) {
        alerts.push({ ico: '🌸', level: 'info', title: 'Follow-up próximo',
          text: `${c.name} · ${d === 0 ? 'hoje' : 'em ' + d + ' dia(s)'} (${dateBR(c.nextFollowup)})` });
      }
      // Domínio vencendo
      const dv = daysUntil(c.domain?.expires);
      if (dv !== null && dv >= 0 && dv <= 30) {
        alerts.push({ ico: '🌐', level: 'warn', title: 'Domínio vencendo',
          text: `${c.company || c.name} · vence em ${dv} dia(s)` });
      }
      // Manutenção
      const dm = daysUntil(c.maintenance?.nextPayment);
      if (dm !== null && dm >= 0 && dm <= 5 && c.maintenance?.monthly) {
        alerts.push({ ico: '🔧', level: 'info', title: 'Mensalidade de manutenção',
          text: `${c.name} · ${PP.Utils.money(c.maintenance.monthly)} em ${dm} dia(s)` });
      }
    });

    // Entregas próximas (etapa de Publicação de projetos em andamento)
    S.projects.all().forEach(pr => {
      const pending = pr.stages.filter(s => s.status !== 'done').length;
      if (pending > 0 && pending <= 2) {
        const client = S.clients.get(pr.clientId);
        alerts.push({ ico: '📦', level: 'info', title: 'Entrega próxima',
          text: `${pr.name}${client ? ' · ' + client.name : ''} · ${pending} etapa(s) restante(s)` });
      }
    });

    return alerts;
  }

  /** Atualiza o badge do sino. */
  function refreshBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const n = compute().length;
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  /** Monta o HTML do painel. */
  function renderPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const list = compute();
    if (!list.length) {
      panel.innerHTML = `<h4>🔔 Notificações</h4><div class="notif-empty">Tudo em dia por aqui! 🌷</div>`;
      return;
    }
    panel.innerHTML = `<h4>🔔 Notificações (${list.length})</h4>` + list.map(a => `
      <div class="notif-item">
        <span class="notif-item__ico">${a.ico}</span>
        <div class="notif-item__txt"><b>${esc(a.title)}</b><small>${esc(a.text)}</small></div>
      </div>`).join('');
  }

  PP.Notifications = { compute, refreshBadge, renderPanel };
})();
