/* =====================================================================
   Prospeceve · clients.js
   Gestão de clientes: listar, filtrar, ordenar, criar, editar, excluir,
   ver ficha completa (dados, proposta, domínio, manutenção, arquivos).
   Expõe window.PP.Clients.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;

  /* Lista de status possíveis (valor interno → rótulo + classe do badge). */
  const STATUS = [
    { v: 'novo',       t: 'Novo Lead' },
    { v: 'contato',    t: 'Contato Feito' },
    { v: 'negociacao', t: 'Negociação' },
    { v: 'proposta',   t: 'Proposta Enviada' },
    { v: 'aceita',     t: 'Proposta Aceita' },
    { v: 'recusada',   t: 'Proposta Recusada' },
    { v: 'producao',   t: 'Em Produção' },
    { v: 'conteudo',   t: 'Aguardando Conteúdo' },
    { v: 'aprovacao',  t: 'Em Aprovação' },
    { v: 'publicado',  t: 'Publicado' },
    { v: 'finalizado', t: 'Finalizado' },
    { v: 'perdido',    t: 'Cliente Perdido' },
  ];
  const statusLabel = v => (STATUS.find(s => s.v === v) || { t: v }).t;
  const statusBadge = v => `<span class="status status--${v}">${statusLabel(v)}</span>`;

  /* Estado local da tela (filtros). */
  let ui = { q: '', status: '', sort: 'name' };

  function render(container) {
    const S = PP.Storage;
    let list = S.clients.all();

    // filtro por texto
    if (ui.q) {
      const q = ui.q.toLowerCase();
      list = list.filter(c => [c.name, c.company, c.phone, c.city, c.region, statusLabel(c.status)]
        .some(f => (f || '').toLowerCase().includes(q)));
    }
    // filtro por status
    if (ui.status) list = list.filter(c => c.status === ui.status);
    // ordenação
    list.sort((a, b) => {
      if (ui.sort === 'name') return (a.name || '').localeCompare(b.name || '');
      if (ui.sort === 'recent') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (ui.sort === 'value') return (b.proposal?.value || 0) - (a.proposal?.value || 0);
      return 0;
    });

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">🧵 Clientes</h1>
          <div class="page-head__sub">${S.clients.all().length} cliente(s) no seu ateliê</div>
        </div>
        <div class="page-head__spacer"></div>
        <button class="pill-btn" id="cli-new"><span>＋</span> Novo cliente</button>
      </div>

      <div class="toolbar">
        <div class="field-inline">
          <input class="input" id="cli-q" placeholder="🔍 Buscar por nome, cidade, região…" value="${U.esc(ui.q)}" style="min-width:260px">
        </div>
        <div class="field-inline">
          <select class="select" id="cli-status">
            <option value="">Todos os status</option>
            ${STATUS.map(s => `<option value="${s.v}" ${ui.status === s.v ? 'selected' : ''}>${s.t}</option>`).join('')}
          </select>
        </div>
        <div class="field-inline">
          <select class="select" id="cli-sort">
            <option value="name"   ${ui.sort === 'name' ? 'selected' : ''}>Ordenar: Nome</option>
            <option value="recent" ${ui.sort === 'recent' ? 'selected' : ''}>Ordenar: Recentes</option>
            <option value="value"  ${ui.sort === 'value' ? 'selected' : ''}>Ordenar: Valor</option>
          </select>
        </div>
      </div>

      ${list.length ? `<div class="grid grid--cards stagger" id="cli-grid">
        ${list.map(cardHTML).join('')}
      </div>` : emptyState()}
    `;

    // eventos
    U.qs('#cli-new', container).onclick = () => openForm();
    const qInput = U.qs('#cli-q', container);
    qInput.oninput = U.debounce(e => { ui.q = e.target.value; render(container); posCursor(container); }, 200);
    U.qs('#cli-status', container).onchange = e => { ui.status = e.target.value; render(container); };
    U.qs('#cli-sort', container).onchange = e => { ui.sort = e.target.value; render(container); };

    container.querySelectorAll('[data-open]').forEach(el =>
      el.onclick = () => openDetail(el.dataset.open));
    container.querySelectorAll('[data-edit]').forEach(el =>
      el.onclick = (e) => { e.stopPropagation(); openForm(el.dataset.edit); });
    container.querySelectorAll('[data-del]').forEach(el =>
      el.onclick = (e) => { e.stopPropagation(); removeClient(el.dataset.del, container); });
  }

  // mantém cursor no fim ao redigitar após re-render da busca
  function posCursor(container) {
    const el = U.qs('#cli-q', container);
    if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; }
  }

  function cardHTML(c) {
    const val = c.proposal?.value ? U.money(c.proposal.value) : '—';
    return `<article class="entity-card" data-open="${c.id}" tabindex="0">
      <div class="entity-card__top">
        <div class="entity-card__avatar">${U.initials(c.name)}</div>
        <div style="min-width:0">
          <div class="entity-card__name">${U.esc(c.name)}</div>
          <div class="entity-card__meta">${U.esc(c.company || 'Sem empresa')}</div>
        </div>
      </div>
      <div class="entity-card__row">📍 ${U.esc(c.city || '—')}${c.region ? ' · ' + U.esc(c.region) : ''}</div>
      <div class="entity-card__row">📞 ${U.esc(c.phone || '—')}</div>
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
        ${statusBadge(c.status)}
        <span class="chip">💵 ${val}</span>
      </div>
      <div class="entity-card__foot">
        <button class="mini-btn" data-edit="${c.id}">✏️ Editar</button>
        <button class="mini-btn mini-btn--danger" data-del="${c.id}">🗑️ Excluir</button>
      </div>
    </article>`;
  }

  function emptyState() {
    return `<div class="cushion cushion--flat empty">
      <span class="empty__emoji">🧵</span>
      <div class="empty__title">Nenhum cliente por aqui ainda</div>
      <p>Que tal costurar o primeiro? Clique em “Novo cliente”.</p>
      <div style="margin-top:14px"><button class="pill-btn" onclick="PP.Clients.openForm()"><span>＋</span> Novo cliente</button></div>
    </div>`;
  }

  /* ---------------- Formulário (criar / editar) ---------------- */
  function openForm(id) {
    const S = PP.Storage;
    const c = id ? S.clients.get(id) : null;
    const p = c?.proposal || {};
    const d = c?.domain || {};
    const m = c?.maintenance || {};

    const html = `
      <div class="modal-backdrop">
        <form class="modal modal--wide" id="cli-form" novalidate>
          <div class="modal__head">
            <h3 class="modal__title">${c ? '✏️ Editar cliente' : '🧵 Novo cliente'}</h3>
            <button type="button" class="modal__close" data-close aria-label="Fechar">✕</button>
          </div>

          <div class="form-grid">
            ${input('name', 'Nome *', c?.name, 'text', true)}
            ${input('company', 'Empresa', c?.company)}
            ${input('phone', 'Telefone', c?.phone)}
            ${input('whatsapp', 'WhatsApp', c?.whatsapp)}
            ${input('email', 'E-mail', c?.email, 'email')}
            ${input('instagram', 'Instagram', c?.instagram)}
            ${input('address', 'Endereço', c?.address)}
            ${input('city', 'Cidade', c?.city)}
            ${input('state', 'Estado', c?.state)}
            ${input('cep', 'CEP', c?.cep)}
            ${input('region', 'Região', c?.region)}
            ${input('currentSite', 'Site atual', c?.currentSite)}
            ${input('leadSource', 'Origem do lead', c?.leadSource)}

            <div class="form-field">
              <label for="f-status">Status</label>
              <select class="select" id="f-status" name="status">
                ${STATUS.map(s => `<option value="${s.v}" ${(c?.status || 'novo') === s.v ? 'selected' : ''}>${s.t}</option>`).join('')}
              </select>
            </div>

            ${input('firstContact', 'Primeiro contato', c?.firstContact, 'date')}
            ${input('lastContact', 'Último contato', c?.lastContact, 'date')}
            ${input('nextFollowup', 'Próximo follow-up', c?.nextFollowup, 'date')}

            <div class="form-field form-field--full">
              <label for="f-notes">Observações</label>
              <textarea class="textarea" id="f-notes" name="notes">${U.esc(c?.notes || '')}</textarea>
            </div>

            <div class="form-subtitle">📨 Proposta</div>
            ${input('p_value', 'Valor (R$)', p.value, 'number')}
            ${input('p_discount', 'Desconto (R$)', p.discount, 'number')}
            ${input('p_date', 'Data da proposta', p.date, 'date')}
            <div class="form-field">
              <label for="p-accepted">Situação da proposta</label>
              <select class="select" id="p-accepted" name="p_accepted">
                <option value="" ${p.accepted == null ? 'selected' : ''}>Aguardando</option>
                <option value="yes" ${p.accepted === true ? 'selected' : ''}>Aceita</option>
                <option value="no"  ${p.accepted === false ? 'selected' : ''}>Recusada</option>
              </select>
            </div>
            ${input('p_reason', 'Motivo (se recusada)', p.refusedReason)}
            <div class="form-field form-field--full">
              <label for="p-notes">Observações da proposta</label>
              <textarea class="textarea" id="p-notes" name="p_notes">${U.esc(p.notes || '')}</textarea>
            </div>

            <div class="form-subtitle">🌐 Domínio</div>
            ${input('d_registrar', 'Empresa (registrador)', d.registrar)}
            ${input('d_login', 'Login', d.login)}
            ${input('d_password', 'Senha', d.password, 'password')}
            ${input('d_date', 'Data de registro', d.date, 'date')}
            ${input('d_expires', 'Vencimento', d.expires, 'date')}
            <div class="form-field">
              <label>SSL / Backup</label>
              <div style="display:flex; gap:16px; align-items:center; padding-top:8px">
                <label class="chip"><input type="checkbox" name="d_ssl" ${d.ssl ? 'checked' : ''}> SSL</label>
                <label class="chip"><input type="checkbox" name="d_backup" ${d.backup ? 'checked' : ''}> Backup</label>
              </div>
            </div>

            <div class="form-subtitle">🔧 Manutenção</div>
            ${input('m_plan', 'Plano', m.plan)}
            ${input('m_monthly', 'Mensalidade (R$)', m.monthly, 'number')}
            ${input('m_next', 'Próximo pagamento', m.nextPayment, 'date')}
          </div>

          <div class="form-actions">
            <button type="button" class="pill-btn pill-btn--ghost" data-close>Cancelar</button>
            <button type="submit" class="pill-btn pill-btn--green">💾 Salvar cliente</button>
          </div>
        </form>
      </div>`;

    const back = mountModal(html);
    const form = back.querySelector('#cli-form');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const name = (f.get('name') || '').toString().trim();
      if (!name) { U.toast('Informe o nome do cliente', 'warn'); form.querySelector('#f-name')?.focus(); return; }

      const acceptedRaw = f.get('p_accepted');
      const accepted = acceptedRaw === 'yes' ? true : acceptedRaw === 'no' ? false : null;

      const data = {
        name, company: f.get('company'), phone: f.get('phone'), whatsapp: f.get('whatsapp'),
        email: f.get('email'), instagram: f.get('instagram'), address: f.get('address'),
        city: f.get('city'), state: f.get('state'), cep: f.get('cep'), region: f.get('region'),
        currentSite: f.get('currentSite'), leadSource: f.get('leadSource'), status: f.get('status'),
        firstContact: f.get('firstContact'), lastContact: f.get('lastContact'),
        nextFollowup: f.get('nextFollowup'), notes: f.get('notes'),
        proposal: {
          value: Number(f.get('p_value')) || 0, discount: Number(f.get('p_discount')) || 0,
          date: f.get('p_date'), accepted, refusedReason: f.get('p_reason'), notes: f.get('p_notes'),
        },
        domain: {
          registrar: f.get('d_registrar'), login: f.get('d_login'), password: f.get('d_password'),
          date: f.get('d_date'), expires: f.get('d_expires'),
          ssl: f.get('d_ssl') === 'on', backup: f.get('d_backup') === 'on',
        },
        maintenance: {
          plan: f.get('m_plan'), monthly: Number(f.get('m_monthly')) || 0,
          nextPayment: f.get('m_next'), tickets: c?.maintenance?.tickets || 0,
          history: c?.maintenance?.history || '',
        },
      };

      if (c) {
        PP.Storage.clients.update(c.id, data);
        PP.Storage.log(`Cliente “${name}” atualizado`, '✏️');
        U.toast('Cliente atualizado!', 'ok');
      } else {
        PP.Storage.clients.add(data);
        PP.Storage.log(`Novo cliente: “${name}”`, '🧵');
        U.toast('Cliente cadastrado!', 'ok', '🌷');
      }
      back.remove();
      PP.Notifications.refreshBadge();
      PP.Router.reload();
    });
  }

  /* ---------------- Ficha detalhada ---------------- */
  function openDetail(id) {
    const S = PP.Storage;
    const c = S.clients.get(id);
    if (!c) return;
    const p = c.proposal || {}, d = c.domain || {}, m = c.maintenance || {};
    const projects = S.projects.all().filter(x => x.clientId === id);
    const payments = S.payments.all().filter(x => x.clientId === id);
    const files = S.files.all().filter(x => x.clientId === id);

    const html = `
      <div class="modal-backdrop">
        <div class="modal modal--wide">
          <div class="modal__head">
            <div class="entity-card__avatar" style="width:52px;height:52px">${U.initials(c.name)}</div>
            <div>
              <h3 class="modal__title">${U.esc(c.name)}</h3>
              <div class="page-head__sub">${U.esc(c.company || '')} ${statusBadge(c.status)}</div>
            </div>
            <button class="modal__close" data-close>✕</button>
          </div>

          <div class="tabs" id="det-tabs">
            <button class="tab is-active" data-tab="dados">📇 Dados</button>
            <button class="tab" data-tab="proposta">📨 Proposta</button>
            <button class="tab" data-tab="dominio">🌐 Domínio</button>
            <button class="tab" data-tab="manut">🔧 Manutenção</button>
            <button class="tab" data-tab="rel">🧩 Relacionados</button>
          </div>

          <div data-panel="dados">
            <div class="info-list">
              ${row('Empresa', c.company)}
              ${row('Telefone', c.phone)}
              ${row('WhatsApp', c.whatsapp)}
              ${row('E-mail', c.email)}
              ${row('Instagram', c.instagram)}
              ${row('Endereço', c.address)}
              ${row('Cidade/UF', [c.city, c.state].filter(Boolean).join(' / '))}
              ${row('CEP', c.cep)} ${row('Região', c.region)}
              ${row('Site atual', c.currentSite)}
              ${row('Origem do lead', c.leadSource)}
              ${row('Primeiro contato', U.dateBR(c.firstContact))}
              ${row('Último contato', U.dateBR(c.lastContact))}
              ${row('Próximo follow-up', U.dateBR(c.nextFollowup))}
              ${row('Observações', c.notes)}
            </div>
          </div>

          <div data-panel="proposta" hidden>
            <div class="info-list">
              ${row('Valor', p.value ? U.money(p.value) : '—')}
              ${row('Desconto', p.discount ? U.money(p.discount) : '—')}
              ${row('Total', p.value ? U.money((p.value || 0) - (p.discount || 0)) : '—')}
              ${row('Data', U.dateBR(p.date))}
              ${row('Situação', p.accepted === true ? '✅ Aceita' : p.accepted === false ? '❌ Recusada' : '⏳ Aguardando')}
              ${row('Motivo', p.refusedReason)}
              ${row('Observações', p.notes)}
            </div>
          </div>

          <div data-panel="dominio" hidden>
            <div class="info-list">
              ${row('Registrador', d.registrar)}
              ${row('Login', d.login)}
              ${row('Senha', d.password ? '••••••••' : '—')}
              ${row('Registro', U.dateBR(d.date))}
              ${row('Vencimento', U.dateBR(d.expires))}
              ${row('SSL', d.ssl ? '✅ Sim' : '—')}
              ${row('Backup', d.backup ? '✅ Sim' : '—')}
            </div>
          </div>

          <div data-panel="manut" hidden>
            <div class="info-list">
              ${row('Plano', m.plan)}
              ${row('Mensalidade', m.monthly ? U.money(m.monthly) : '—')}
              ${row('Próximo pagamento', U.dateBR(m.nextPayment))}
              ${row('Chamados', m.tickets ?? 0)}
              ${row('Histórico', m.history)}
            </div>
          </div>

          <div data-panel="rel" hidden>
            <h4 style="margin:6px 0 10px">🌼 Projetos (${projects.length})</h4>
            ${projects.length ? projects.map(pr => `<div class="chip" style="margin:0 6px 6px 0">${U.esc(pr.name)} · ${PP.Dashboard.projectProgress(pr)}%</div>`).join('') : '<div class="page-head__sub">Nenhum projeto</div>'}
            <h4 style="margin:16px 0 10px">🪙 Pagamentos (${payments.length})</h4>
            ${payments.length ? payments.map(pg => `<div class="chip" style="margin:0 6px 6px 0">${U.money(pg.total)} · <span class="status status--${pg.status}">${pg.status}</span></div>`).join('') : '<div class="page-head__sub">Nenhum pagamento</div>'}
            <h4 style="margin:16px 0 10px">☁️ Arquivos (${files.length})</h4>
            ${files.length ? files.map(fl => `<div class="chip" style="margin:0 6px 6px 0">📄 ${U.esc(fl.name)}</div>`).join('') : '<div class="page-head__sub">Nenhum arquivo</div>'}
          </div>

          <div class="form-actions">
            <button class="pill-btn pill-btn--danger" data-del="${c.id}">🗑️ Excluir</button>
            <button class="pill-btn pill-btn--ghost" data-close>Fechar</button>
            <button class="pill-btn pill-btn--green" data-edit="${c.id}">✏️ Editar</button>
          </div>
        </div>
      </div>`;

    const back = mountModal(html);
    // troca de abas
    back.querySelectorAll('.tab').forEach(t => t.onclick = () => {
      back.querySelectorAll('.tab').forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
      back.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== t.dataset.tab);
    });
    back.querySelector('[data-edit]').onclick = () => { back.remove(); openForm(c.id); };
    back.querySelector('[data-del]').onclick = async () => {
      back.remove(); removeClient(c.id);
    };
  }

  function removeClient(id, container) {
    const c = PP.Storage.clients.get(id);
    PP.Utils.confirm(`Excluir o cliente “${c?.name}”? Projetos e pagamentos ligados a ele continuarão existindo.`, { danger: true, okText: 'Excluir' })
      .then(ok => {
        if (!ok) return;
        PP.Storage.clients.remove(id);
        PP.Storage.log(`Cliente “${c?.name}” excluído`, '🗑️');
        U.toast('Cliente excluído', 'info');
        PP.Notifications.refreshBadge();
        PP.Router.reload();
      });
  }

  /* ---------- helpers de UI ---------- */
  function input(name, label, value, type = 'text', required = false) {
    const v = value == null ? '' : value;
    return `<div class="form-field">
      <label for="f-${name}">${label}</label>
      <input class="input" id="f-${name}" name="${name}" type="${type}"
        value="${U.esc(v)}" ${required ? 'required' : ''} />
    </div>`;
  }
  function row(label, value) {
    return `<div class="info-list__row"><b>${label}</b><span>${U.esc(value || '—')}</span></div>`;
  }
  function mountModal(html) {
    const root = document.getElementById('modal-root');
    const back = U.fromHTML(html);
    root.appendChild(back);
    back.addEventListener('click', (e) => {
      if (e.target === back || e.target.closest('[data-close]')) back.remove();
    });
    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape') { back.remove(); document.removeEventListener('keydown', esc); }
    });
    return back;
  }

  PP.Clients = { render, openForm, openDetail, STATUS, statusLabel, statusBadge, mountModal };
})();
