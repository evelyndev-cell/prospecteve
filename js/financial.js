/* =====================================================================
   Prospeceve · financial.js
   Controle financeiro: pagamentos, parcelas, formas de pagamento e
   totais automáticos (recebido, pendente, lucro mensal e anual).
   Expõe window.PP.Financial.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;
  const METHODS = ['PIX', 'Cartão', 'Dinheiro', 'Transferência', 'Boleto'];
  const PAY_STATUS = [
    { v: 'pago', t: 'Pago' }, { v: 'pendente', t: 'Pendente' }, { v: 'atrasado', t: 'Atrasado' },
  ];

  function totals() {
    const list = PP.Storage.payments.all();
    const contracted = list.reduce((s, p) => s + (Number(p.total) || 0), 0);
    const received = list.reduce((s, p) => s + (Number(p.received) || 0), 0);
    const pending = contracted - received;

    const now = new Date();
    const ym = now.toISOString().slice(0, 7);
    const y = String(now.getFullYear());
    const monthProfit = list.filter(p => (p.date || '').slice(0, 7) === ym)
      .reduce((s, p) => s + (Number(p.received) || 0), 0);
    const yearProfit = list.filter(p => (p.date || '').slice(0, 4) === y)
      .reduce((s, p) => s + (Number(p.received) || 0), 0);

    return { contracted, received, pending, monthProfit, yearProfit };
  }

  function render(container) {
    const S = PP.Storage;
    const payments = S.payments.all().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const t = totals();

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">🪙 Financeiro</h1>
          <div class="page-head__sub">Entradas, parcelas e o quanto seu ateliê rendeu 💛</div>
        </div>
        <div class="page-head__spacer"></div>
        <button class="pill-btn" id="pay-new"><span>＋</span> Novo pagamento</button>
      </div>

      <div class="grid grid--stats stagger">
        ${stat('green', '🪙', U.money(t.received), 'Total recebido')}
        ${stat('pink', '⏳', U.money(t.pending), 'Total pendente')}
        ${stat('yellow', '📅', U.money(t.monthProfit), 'Lucro do mês')}
        ${stat('blue', '📆', U.money(t.yearProfit), 'Lucro do ano')}
      </div>

      <section class="cushion" style="margin-top:22px">
        <h3 class="section-title">💳 Pagamentos <span class="count-pill">${payments.length}</span></h3>
        ${payments.length ? `<div class="table-wrap"><table class="p-table">
          <thead><tr>
            <th>Cliente</th><th>Total</th><th>Recebido</th><th>Restante</th>
            <th>Forma</th><th>Parcelas</th><th>Status</th><th>Data</th><th></th>
          </tr></thead>
          <tbody>
            ${payments.map(rowHTML).join('')}
          </tbody>
        </table></div>` : `<div class="empty"><span class="empty__emoji">🪙</span>
          <div class="empty__title">Nenhum pagamento registrado</div>
          <p>Registre entradas e parcelas para acompanhar o financeiro.</p></div>`}
      </section>
    `;

    U.qs('#pay-new', container).onclick = () => openForm();
    container.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => openForm(el.dataset.edit));
    container.querySelectorAll('[data-del]').forEach(el => el.onclick = () => removePayment(el.dataset.del));
  }

  function stat(color, ico, value, label) {
    return `<div class="stat stat--${color}"><div class="stat__ico">${ico}</div>
      <div class="stat__value">${value}</div><div class="stat__label">${label}</div></div>`;
  }

  function rowHTML(p) {
    const client = PP.Storage.clients.get(p.clientId);
    const rest = (Number(p.total) || 0) - (Number(p.received) || 0);
    return `<tr>
      <td><b>${U.esc(client?.name || '—')}</b></td>
      <td>${U.money(p.total)}</td>
      <td>${U.money(p.received)}</td>
      <td>${U.money(rest)}</td>
      <td><span class="chip">${U.esc(p.method || '—')}</span></td>
      <td>${p.installments || 1}x</td>
      <td><span class="status status--${p.status}">${statusLabel(p.status)}</span></td>
      <td>${U.dateBR(p.date)}</td>
      <td><div class="row-actions">
        <button class="mini-btn" data-edit="${p.id}">✏️</button>
        <button class="mini-btn mini-btn--danger" data-del="${p.id}">🗑️</button>
      </div></td>
    </tr>`;
  }
  const statusLabel = v => (PAY_STATUS.find(s => s.v === v) || { t: v }).t;

  function openForm(id) {
    const S = PP.Storage;
    const p = id ? S.payments.get(id) : null;
    const clients = S.clients.all();
    const projects = S.projects.all();

    const html = `
      <div class="modal-backdrop">
        <form class="modal" id="pay-form">
          <div class="modal__head">
            <h3 class="modal__title">${p ? '✏️ Editar pagamento' : '🪙 Novo pagamento'}</h3>
            <button type="button" class="modal__close" data-close>✕</button>
          </div>
          <div class="form-grid">
            <div class="form-field form-field--full">
              <label for="pay-client">Cliente *</label>
              <select class="select" id="pay-client" name="clientId" required>
                <option value="">— Selecione —</option>
                ${clients.map(c => `<option value="${c.id}" ${p?.clientId === c.id ? 'selected' : ''}>${U.esc(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-field form-field--full">
              <label for="pay-project">Projeto (opcional)</label>
              <select class="select" id="pay-project" name="projectId">
                <option value="">— Nenhum —</option>
                ${projects.map(pr => `<option value="${pr.id}" ${p?.projectId === pr.id ? 'selected' : ''}>${U.esc(pr.name)}</option>`).join('')}
              </select>
            </div>
            ${num('total', 'Valor total (R$)', p?.total)}
            ${num('entry', 'Entrada (R$)', p?.entry)}
            ${num('received', 'Já recebido (R$)', p?.received)}
            ${num('installments', 'Parcelas', p?.installments || 1)}
            <div class="form-field">
              <label for="pay-method">Forma de pagamento</label>
              <select class="select" id="pay-method" name="method">
                ${METHODS.map(m => `<option ${p?.method === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div class="form-field">
              <label for="pay-status">Status</label>
              <select class="select" id="pay-status" name="status">
                ${PAY_STATUS.map(s => `<option value="${s.v}" ${(p?.status || 'pendente') === s.v ? 'selected' : ''}>${s.t}</option>`).join('')}
              </select>
            </div>
            <div class="form-field">
              <label for="pay-date">Data</label>
              <input class="input" id="pay-date" name="date" type="date" value="${U.esc(p?.date || U.today())}">
            </div>
            <div class="form-field form-field--full">
              <label for="pay-notes">Observações</label>
              <textarea class="textarea" id="pay-notes" name="notes">${U.esc(p?.notes || '')}</textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="pill-btn pill-btn--ghost" data-close>Cancelar</button>
            <button type="submit" class="pill-btn pill-btn--green">💾 Salvar</button>
          </div>
        </form>
      </div>`;

    const back = PP.Clients.mountModal(html);
    back.querySelector('#pay-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      if (!f.get('clientId')) { U.toast('Escolha o cliente', 'warn'); return; }
      const data = {
        clientId: f.get('clientId'), projectId: f.get('projectId') || null,
        total: Number(f.get('total')) || 0, entry: Number(f.get('entry')) || 0,
        received: Number(f.get('received')) || 0, installments: Number(f.get('installments')) || 1,
        method: f.get('method'), status: f.get('status'), date: f.get('date'), notes: f.get('notes'),
      };
      const client = S.clients.get(data.clientId);
      if (p) { S.payments.update(p.id, data); U.toast('Pagamento atualizado!', 'ok'); }
      else {
        S.payments.add(data);
        S.log(`Pagamento registrado · ${client?.name || ''} · ${U.money(data.total)}`, '🪙');
        U.toast('Pagamento registrado!', 'ok', '💛');
      }
      back.remove();
      PP.Notifications.refreshBadge();
      PP.Router.reload();
    });
  }

  function num(name, label, value) {
    return `<div class="form-field"><label for="pay-${name}">${label}</label>
      <input class="input" id="pay-${name}" name="${name}" type="number" min="0" step="0.01" value="${value ?? ''}"></div>`;
  }

  function removePayment(id) {
    U.confirm('Excluir este pagamento?', { danger: true, okText: 'Excluir' }).then(ok => {
      if (!ok) return;
      PP.Storage.payments.remove(id);
      PP.Storage.log('Pagamento excluído', '🗑️');
      U.toast('Pagamento excluído', 'info');
      PP.Notifications.refreshBadge();
      PP.Router.reload();
    });
  }

  PP.Financial = { render, openForm, totals };
})();
