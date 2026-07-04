/* =====================================================================
   Prospeceve · files.js
   Arquivos: registro de logos, fotos, textos e documentos por cliente.
   Guarda metadados (nome, tipo, tamanho, data) no LocalStorage.
   Expõe window.PP.Files.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;
  const KINDS = ['Logo', 'Fotos', 'Textos', 'Contrato', 'Documento', 'Outro'];

  function render(container) {
    const S = PP.Storage;
    const files = S.files.all().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">☁️ Arquivos</h1>
          <div class="page-head__sub">Guarde referências de logos, fotos e documentos de cada cliente</div>
        </div>
        <div class="page-head__spacer"></div>
        <button class="pill-btn" id="file-new"><span>＋</span> Registrar arquivo</button>
      </div>

      ${files.length ? `<div class="grid grid--cards stagger">
        ${files.map(cardHTML).join('')}
      </div>` : `<div class="cushion cushion--flat empty">
        <span class="empty__emoji">☁️</span>
        <div class="empty__title">Nenhum arquivo registrado</div>
        <p>Registre aqui os arquivos que você recebe dos clientes.</p>
        <div style="margin-top:14px"><button class="pill-btn" onclick="PP.Files.openForm()"><span>＋</span> Registrar arquivo</button></div>
      </div>`}
    `;

    U.qs('#file-new', container).onclick = () => openForm();
    container.querySelectorAll('[data-del]').forEach(el => el.onclick = () => removeFile(el.dataset.del));
  }

  function cardHTML(f) {
    const client = PP.Storage.clients.get(f.clientId);
    const ico = ({ Logo: '🎨', Fotos: '📷', Textos: '📝', Contrato: '📄', Documento: '📁' }[f.kind]) || '📎';
    return `<article class="entity-card">
      <div class="entity-card__top">
        <div class="entity-card__avatar" style="background:linear-gradient(180deg,#d5f0ff,#81d4fa);color:#0c4f6b">${ico}</div>
        <div style="min-width:0">
          <div class="entity-card__name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(f.name)}</div>
          <div class="entity-card__meta">${U.esc(f.kind || 'Arquivo')} · ${U.esc(f.size || '')}</div>
        </div>
      </div>
      <div class="entity-card__row">🧵 ${U.esc(client?.name || 'Sem cliente')}</div>
      <div class="entity-card__row">🗓️ ${U.dateBR(f.date)}</div>
      <div class="entity-card__foot">
        <button class="mini-btn mini-btn--danger" data-del="${f.id}">🗑️ Remover</button>
      </div>
    </article>`;
  }

  function openForm() {
    const S = PP.Storage;
    const clients = S.clients.all();
    const html = `
      <div class="modal-backdrop">
        <form class="modal" id="file-form">
          <div class="modal__head">
            <h3 class="modal__title">☁️ Registrar arquivo</h3>
            <button type="button" class="modal__close" data-close>✕</button>
          </div>
          <div class="form-grid">
            <div class="form-field form-field--full">
              <label for="fl-client">Cliente</label>
              <select class="select" id="fl-client" name="clientId">
                <option value="">— Sem cliente —</option>
                ${clients.map(c => `<option value="${c.id}">${U.esc(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-field form-field--full">
              <label for="fl-name">Nome do arquivo *</label>
              <input class="input" id="fl-name" name="name" placeholder="ex.: logo-cliente.png" required>
            </div>
            <div class="form-field">
              <label for="fl-kind">Tipo</label>
              <select class="select" id="fl-kind" name="kind">
                ${KINDS.map(k => `<option>${k}</option>`).join('')}
              </select>
            </div>
            <div class="form-field">
              <label for="fl-size">Tamanho</label>
              <input class="input" id="fl-size" name="size" placeholder="ex.: 84 KB">
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="pill-btn pill-btn--ghost" data-close>Cancelar</button>
            <button type="submit" class="pill-btn pill-btn--green">💾 Registrar</button>
          </div>
        </form>
      </div>`;
    const back = PP.Clients.mountModal(html);
    back.querySelector('#file-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const name = (f.get('name') || '').toString().trim();
      if (!name) { U.toast('Informe o nome do arquivo', 'warn'); return; }
      S.files.add({ clientId: f.get('clientId') || null, name, kind: f.get('kind'),
        size: f.get('size'), date: U.today() });
      S.log(`Arquivo registrado: ${name}`, '☁️');
      U.toast('Arquivo registrado!', 'ok', '☁️');
      back.remove();
      PP.Router.reload();
    });
  }

  function removeFile(id) {
    U.confirm('Remover este arquivo do registro?', { danger: true, okText: 'Remover' }).then(ok => {
      if (!ok) return;
      PP.Storage.files.remove(id);
      U.toast('Arquivo removido', 'info');
      PP.Router.reload();
    });
  }

  PP.Files = { render, openForm };
})();
