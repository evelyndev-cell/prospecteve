/* =====================================================================
   Prospeceve · settings.js
   Configurações: nome, empresa, tema, backup (exportar/importar) e
   reset/limpeza dos dados. Expõe window.PP.Settings.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;

  function accentSwatch(key, color, label, current) {
    const active = (current || 'green') === key;
    return `<button type="button" class="accent-swatch ${active ? 'is-active' : ''}" data-accent="${key}"
        style="--swatch-color:${color}" title="${label}">
      <span class="accent-swatch__dot"></span> ${label}
    </button>`;
  }

  function render(container) {
    const s = PP.Storage.settings();

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">⚙️ Configurações</h1>
          <div class="page-head__sub">Ajuste seu ateliê do jeitinho que você gosta 🌷</div>
        </div>
      </div>

      <div class="grid grid--2" style="align-items:start">
        <section class="cushion">
          <h3 class="section-title">🧸 Perfil</h3>
          <div class="form-grid">
            <div class="form-field form-field--full">
              <label for="set-name">Seu nome</label>
              <input class="input" id="set-name" value="${U.esc(s.userName || '')}">
            </div>
            <div class="form-field form-field--full">
              <label for="set-company">Nome do ateliê / empresa</label>
              <input class="input" id="set-company" value="${U.esc(s.company || '')}">
            </div>
          </div>
          <div class="form-actions" style="justify-content:flex-start">
            <button class="pill-btn pill-btn--green" id="set-save">💾 Salvar perfil</button>
          </div>
        </section>

        <section class="cushion">
          <h3 class="section-title">🎨 Aparência</h3>
          <p class="page-head__sub" style="margin-bottom:12px">Escolha entre o céu de dia e o céu de anoitecer.</p>
          <div style="display:flex; gap:10px; flex-wrap:wrap">
            <button class="pill-btn ${s.theme !== 'dark' ? '' : 'pill-btn--ghost'}" data-theme="light">☀️ Claro</button>
            <button class="pill-btn ${s.theme === 'dark' ? '' : 'pill-btn--ghost'}" data-theme="dark">🌙 Escuro</button>
          </div>

          <p class="page-head__sub" style="margin:18px 0 10px">Cor de destaque do menu e dos botões:</p>
          <div style="display:flex; gap:10px; flex-wrap:wrap">
            ${accentSwatch('green', '#93c85a', 'Verde', s.accentTheme)}
            ${accentSwatch('pink', '#f7b3cf', 'Rosa', s.accentTheme)}
            ${accentSwatch('blue', '#8fd4f5', 'Azul', s.accentTheme)}
            ${accentSwatch('lilac', '#d3b6f0', 'Lilás', s.accentTheme)}
          </div>
        </section>
      </div>

      <section class="cushion" style="margin-top:22px">
        <h3 class="section-title">🔒 Segurança</h3>
        <p class="page-head__sub" style="margin-bottom:14px">
          Seu ateliê fica protegido por usuário e senha neste navegador. Ao sair, será
          necessário entrar novamente para acessar seus dados.</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <button class="pill-btn pill-btn--ghost" id="set-logout">🚪 Sair da conta</button>
        </div>
      </section>

      <section class="cushion" style="margin-top:22px">
        <h3 class="section-title">💾 Backup dos dados</h3>
        <p class="page-head__sub" style="margin-bottom:14px">
          Seus dados ficam salvos apenas neste navegador (LocalStorage). Faça backup de vez em quando 🌼</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <button class="pill-btn pill-btn--blue" id="set-export">⬇️ Exportar backup (.json)</button>
          <button class="pill-btn pill-btn--ghost" id="set-import">⬆️ Importar backup</button>
          <input type="file" id="set-file" accept="application/json" hidden>
        </div>
      </section>

      <section class="cushion" style="margin-top:22px">
        <h3 class="section-title">🧹 Zona delicada</h3>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <button class="pill-btn pill-btn--ghost" id="set-seed">🌱 Recarregar dados de exemplo</button>
          <button class="pill-btn pill-btn--danger" id="set-wipe">🗑️ Apagar tudo</button>
        </div>
      </section>
    `;

    // salvar perfil
    U.qs('#set-save', container).onclick = () => {
      PP.Storage.saveSettings({
        userName: U.qs('#set-name', container).value.trim() || 'Você',
        company: U.qs('#set-company', container).value.trim(),
      });
      U.toast('Perfil salvo!', 'ok', '🧸');
      PP.App.refreshProfile();
    };

    // tema claro/escuro
    container.querySelectorAll('[data-theme]').forEach(btn => btn.onclick = () => {
      PP.App.setTheme(btn.dataset.theme);
      render(container);
    });

    // cor de destaque (accent)
    container.querySelectorAll('[data-accent]').forEach(btn => btn.onclick = () => {
      PP.App.setAccentTheme(btn.dataset.accent);
      render(container);
    });

    // sair
    U.qs('#set-logout', container).onclick = () => {
      U.confirm('Sair do Prospeceve? Você vai precisar entrar de novo com usuário e senha.', { okText: 'Sair' })
        .then(ok => { if (ok) PP.Auth.logout(); });
    };

    // exportar
    U.qs('#set-export', container).onclick = () => {
      const blob = new Blob([PP.Storage.export()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `prospeceve-backup-${U.today()}.json`;
      a.click(); URL.revokeObjectURL(url);
      U.toast('Backup exportado!', 'ok', '⬇️');
    };

    // importar
    const fileInput = U.qs('#set-file', container);
    U.qs('#set-import', container).onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (PP.Storage.import(reader.result)) {
          U.toast('Backup importado!', 'ok', '⬆️');
          PP.App.refreshProfile(); PP.Notifications.refreshBadge(); PP.Router.reload();
        } else U.toast('Arquivo de backup inválido', 'error');
      };
      reader.readAsText(file);
    };

    // recarregar exemplo
    U.qs('#set-seed', container).onclick = () => {
      U.confirm('Isto substitui seus dados atuais pelos dados de exemplo. Continuar?', { danger: true, okText: 'Recarregar' })
        .then(ok => { if (!ok) return; PP.Storage.reset(); afterReset(); });
    };

    // apagar tudo
    U.qs('#set-wipe', container).onclick = () => {
      U.confirm('Isto apaga TODOS os seus clientes, projetos e pagamentos. Esta ação não pode ser desfeita. Continuar?', { danger: true, okText: 'Apagar tudo' })
        .then(ok => { if (!ok) return; PP.Storage.wipe(); afterReset(); });
    };

    function afterReset() {
      U.toast('Dados atualizados', 'info');
      PP.App.refreshProfile(); PP.Notifications.refreshBadge();
      location.hash = '#/dashboard'; PP.Router.reload();
    }
  }

  PP.Settings = { render };
})();
