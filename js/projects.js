/* =====================================================================
   Prospeceve · projects.js
   Projetos: lista, criação/edição, timeline de etapas, checklist.
   Expõe window.PP.Projects.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;
  const STAGE_STATUS = { todo: 'A fazer', doing: 'Em andamento', done: 'Concluído' };

  function render(container) {
    const S = PP.Storage;
    const projects = S.projects.all();

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">🌼 Projetos</h1>
          <div class="page-head__sub">${projects.length} projeto(s) em produção</div>
        </div>
        <div class="page-head__spacer"></div>
        <button class="pill-btn" id="prj-new"><span>＋</span> Novo projeto</button>
      </div>

      ${projects.length ? `<div class="grid grid--cards stagger">
        ${projects.map(cardHTML).join('')}
      </div>` : `<div class="cushion cushion--flat empty">
        <span class="empty__emoji">🌼</span>
        <div class="empty__title">Nenhum projeto ainda</div>
        <p>Crie um projeto e acompanhe cada etapa com carinho.</p>
        <div style="margin-top:14px"><button class="pill-btn" onclick="PP.Projects.openForm()"><span>＋</span> Novo projeto</button></div>
      </div>`}
    `;

    U.qs('#prj-new', container).onclick = () => openForm();
    container.querySelectorAll('[data-open]').forEach(el => el.onclick = () => openDetail(el.dataset.open));
    container.querySelectorAll('[data-edit]').forEach(el => el.onclick = e => { e.stopPropagation(); openForm(el.dataset.edit); });
    container.querySelectorAll('[data-del]').forEach(el => el.onclick = e => { e.stopPropagation(); removeProject(el.dataset.del); });
  }

  function progress(pr) { return PP.Dashboard.projectProgress(pr); }

  function cardHTML(pr) {
    const client = PP.Storage.clients.get(pr.clientId);
    const pct = progress(pr);
    const doneStages = pr.stages.filter(s => s.status === 'done').length;
    const checkDone = pr.checklist.filter(c => c.done).length;
    return `<article class="entity-card" data-open="${pr.id}" tabindex="0">
      <div class="entity-card__top">
        <div class="entity-card__avatar" style="background:linear-gradient(180deg,#ffe27a,#f4c430);color:#6a4b00">🌼</div>
        <div style="min-width:0">
          <div class="entity-card__name">${U.esc(pr.name)}</div>
          <div class="entity-card__meta">${client ? U.esc(client.name) : 'Sem cliente'}</div>
        </div>
      </div>
      <div class="entity-card__row">🧩 ${doneStages}/${pr.stages.length} etapas · ✅ ${checkDone}/${pr.checklist.length} checklist</div>
      <div class="entity-card__foot" style="flex-direction:column; align-items:stretch; gap:8px">
        <div style="display:flex; align-items:center; gap:8px">
          <div class="pbar" style="flex:1"><div class="pbar__fill" style="width:${pct}%"></div></div>
          <b>${pct}%</b>
        </div>
        <div style="display:flex; gap:8px">
          <button class="mini-btn" data-edit="${pr.id}">✏️ Editar</button>
          <button class="mini-btn mini-btn--danger" data-del="${pr.id}">🗑️ Excluir</button>
        </div>
      </div>
    </article>`;
  }

  /* ---------------- Criar / editar (dados básicos) ---------------- */
  function openForm(id) {
    const S = PP.Storage;
    const pr = id ? S.projects.get(id) : null;
    const clients = S.clients.all();

    const html = `
      <div class="modal-backdrop">
        <form class="modal" id="prj-form">
          <div class="modal__head">
            <h3 class="modal__title">${pr ? '✏️ Editar projeto' : '🌼 Novo projeto'}</h3>
            <button type="button" class="modal__close" data-close>✕</button>
          </div>
          <div class="form-grid">
            <div class="form-field form-field--full">
              <label for="pr-name">Nome do projeto *</label>
              <input class="input" id="pr-name" name="name" value="${U.esc(pr?.name || '')}" required>
            </div>
            <div class="form-field form-field--full">
              <label for="pr-client">Cliente</label>
              <select class="select" id="pr-client" name="clientId">
                <option value="">— Sem cliente —</option>
                ${clients.map(c => `<option value="${c.id}" ${pr?.clientId === c.id ? 'selected' : ''}>${U.esc(c.name)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="pill-btn pill-btn--ghost" data-close>Cancelar</button>
            <button type="submit" class="pill-btn pill-btn--green">💾 Salvar</button>
          </div>
        </form>
      </div>`;

    const back = PP.Clients.mountModal(html);
    back.querySelector('#prj-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const name = (f.get('name') || '').toString().trim();
      if (!name) { U.toast('Dê um nome ao projeto', 'warn'); return; }
      const clientId = f.get('clientId') || null;

      if (pr) {
        S.projects.update(pr.id, { name, clientId });
        U.toast('Projeto atualizado!', 'ok');
      } else {
        S.projects.add({ name, clientId, stages: S.defaultStages(), checklist: S.defaultChecklist() });
        S.log(`Novo projeto: “${name}”`, '🌼');
        U.toast('Projeto criado!', 'ok', '🌼');
      }
      back.remove();
      PP.Router.reload();
    });
  }

  /* ---------------- Detalhe: timeline + checklist ---------------- */
  function openDetail(id) {
    const S = PP.Storage;
    const pr = S.projects.get(id);
    if (!pr) return;
    const client = S.clients.get(pr.clientId);

    const html = `
      <div class="modal-backdrop">
        <div class="modal modal--wide">
          <div class="modal__head">
            <div class="entity-card__avatar" style="width:52px;height:52px;background:linear-gradient(180deg,#ffe27a,#f4c430);color:#6a4b00">🌼</div>
            <div>
              <h3 class="modal__title">${U.esc(pr.name)}</h3>
              <div class="page-head__sub">${client ? U.esc(client.name) : 'Sem cliente'} · <b id="pr-pct">${progress(pr)}%</b> concluído</div>
            </div>
            <button class="modal__close" data-close>✕</button>
          </div>

          <div class="pbar pbar--yellow" style="margin-bottom:18px"><div class="pbar__fill" id="pr-bar" style="width:${progress(pr)}%"></div></div>

          <h4 class="section-title">🧩 Etapas do projeto</h4>
          <div class="timeline" id="tl">
            ${pr.stages.map((s, i) => stageHTML(s, i)).join('')}
          </div>

          <h4 class="section-title" style="margin-top:20px">✅ Checklist de publicação</h4>
          <div class="check-grid" id="cl">
            ${pr.checklist.map((c, i) => `
              <div class="check-item ${c.done ? 'is-done' : ''}" data-check="${i}">
                <span class="check-box">${c.done ? '✓' : ''}</span>
                <span>${U.esc(c.name)}</span>
              </div>`).join('')}
          </div>

          <div class="form-actions">
            <button class="pill-btn pill-btn--danger" data-del="${pr.id}">🗑️ Excluir</button>
            <button class="pill-btn pill-btn--ghost" data-close>Fechar</button>
          </div>
        </div>
      </div>`;

    const back = PP.Clients.mountModal(html);

    // clique numa etapa avança o status (todo → doing → done → todo)
    back.querySelectorAll('[data-stage]').forEach(el => el.onclick = () => {
      const i = Number(el.dataset.stage);
      const order = ['todo', 'doing', 'done'];
      const cur = pr.stages[i].status;
      const next = order[(order.indexOf(cur) + 1) % order.length];
      pr.stages[i].status = next;
      pr.stages[i].progress = next === 'done' ? 100 : next === 'doing' ? 50 : 0;
      pr.stages[i].date = next === 'done' ? U.today() : pr.stages[i].date;
      S.projects.update(pr.id, { stages: pr.stages });
      // re-render da etapa e da barra
      el.outerHTML = stageHTML(pr.stages[i], i);
      rebind(back, pr);
      updateBar(back, pr);
      if (next === 'done') S.log(`Etapa “${pr.stages[i].name}” concluída em “${pr.name}”`, '✅');
    });

    // checklist toggle
    back.querySelectorAll('[data-check]').forEach(el => el.onclick = () => {
      const i = Number(el.dataset.check);
      pr.checklist[i].done = !pr.checklist[i].done;
      S.projects.update(pr.id, { checklist: pr.checklist });
      el.classList.toggle('is-done', pr.checklist[i].done);
      el.querySelector('.check-box').textContent = pr.checklist[i].done ? '✓' : '';
    });

    back.querySelector('[data-del]').onclick = () => { back.remove(); removeProject(pr.id); };
  }

  function stageHTML(s, i) {
    const cls = s.status === 'done' ? 'is-done' : s.status === 'doing' ? 'is-doing' : '';
    const dot = s.status === 'done' ? '✓' : s.status === 'doing' ? '…' : '○';
    return `<div class="tl-step ${cls}" data-stage="${i}" role="button" tabindex="0" title="Clique para avançar o status">
      <span class="tl-step__dot">${dot}</span>
      <div>
        <div class="tl-step__name">${U.esc(s.name)}</div>
        <div class="tl-step__meta">${STAGE_STATUS[s.status]}${s.date ? ' · ' + U.dateBR(s.date) : ''}</div>
      </div>
      <span class="chip">${s.progress || 0}%</span>
    </div>`;
  }

  // re-liga o handler da etapa recém-substituída
  function rebind(back, pr) {
    const S = PP.Storage;
    back.querySelectorAll('[data-stage]').forEach(el => {
      if (el._bound) return;
      el._bound = true;
      el.onclick = () => {
        const i = Number(el.dataset.stage);
        const order = ['todo', 'doing', 'done'];
        const next = order[(order.indexOf(pr.stages[i].status) + 1) % order.length];
        pr.stages[i].status = next;
        pr.stages[i].progress = next === 'done' ? 100 : next === 'doing' ? 50 : 0;
        pr.stages[i].date = next === 'done' ? U.today() : pr.stages[i].date;
        S.projects.update(pr.id, { stages: pr.stages });
        el.outerHTML = stageHTML(pr.stages[i], i);
        rebind(back, pr); updateBar(back, pr);
      };
    });
  }

  function updateBar(back, pr) {
    const pct = progress(pr);
    const bar = back.querySelector('#pr-bar'); const lbl = back.querySelector('#pr-pct');
    if (bar) bar.style.width = pct + '%';
    if (lbl) lbl.textContent = pct + '%';
  }

  function removeProject(id) {
    const pr = PP.Storage.projects.get(id);
    U.confirm(`Excluir o projeto “${pr?.name}”?`, { danger: true, okText: 'Excluir' }).then(ok => {
      if (!ok) return;
      PP.Storage.projects.remove(id);
      PP.Storage.log(`Projeto “${pr?.name}” excluído`, '🗑️');
      U.toast('Projeto excluído', 'info');
      PP.Router.reload();
    });
  }

  PP.Projects = { render, openForm, openDetail };
})();
