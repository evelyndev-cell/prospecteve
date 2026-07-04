/* =====================================================================
   Prospeceve · app.js
   Ponto de entrada. Cuida da tela de carregamento, da barra superior,
   do tema, da busca global e liga tudo ao roteador.
   Expõe window.PP.App.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};
  const U = PP.Utils;

  /* ---------- Tela de carregamento ---------- */
  function runLoading(done) {
    const screen = document.getElementById('loading-screen');
    const fill = document.getElementById('loading-bar-fill');
    const percent = document.getElementById('loading-percent');
    let p = 0;

    const tick = () => {
      p += Math.random() * 18 + 6;
      if (p >= 100) p = 100;
      fill.style.width = p + '%';
      percent.textContent = Math.floor(p) + '%';
      if (p < 100) {
        setTimeout(tick, 180 + Math.random() * 160);
      } else {
        setTimeout(() => {
          screen.classList.add('is-hidden');
          setTimeout(() => { screen.remove(); done(); }, 600);
        }, 350);
      }
    };
    setTimeout(tick, 300);
  }

  /* ---------- Tema ---------- */
  function setTheme(theme) {
    document.body.classList.toggle('theme-dark', theme === 'dark');
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    PP.Storage.saveSettings({ theme });
  }
  function toggleTheme() {
    const cur = PP.Storage.settings().theme === 'dark' ? 'light' : 'dark';
    setTheme(cur);
  }

  const ACCENTS = ['green', 'pink', 'blue', 'lilac'];
  function setAccentTheme(accent) {
    if (!ACCENTS.includes(accent)) accent = 'green';
    ACCENTS.forEach(a => document.body.classList.remove('theme-accent-' + a));
    if (accent !== 'green') document.body.classList.add('theme-accent-' + accent);
    PP.Storage.saveSettings({ accentTheme: accent });
  }

  /* ---------- Perfil no topo ---------- */
  function refreshProfile() {
    const s = PP.Storage.settings();
    const avatar = document.getElementById('profile-avatar');
    const name = document.getElementById('profile-name');
    if (avatar) avatar.textContent = U.initials(s.userName || 'Você');
    if (name) name.textContent = s.userName || 'Você';
  }

  /* ---------- Busca global ---------- */
  function setupSearch() {
    const input = document.getElementById('global-search');
    const box = document.getElementById('search-results');
    if (!input) return;

    const run = U.debounce(() => {
      const q = input.value.trim().toLowerCase();
      if (!q) { box.hidden = true; box.innerHTML = ''; return; }

      const S = PP.Storage;
      const results = [];
      S.clients.all().forEach(c => {
        if ([c.name, c.company, c.phone, c.city, c.region].some(f => (f || '').toLowerCase().includes(q)))
          results.push({ ico: '🧵', label: c.name, sub: c.company || c.city || '', action: () => PP.Clients.openDetail(c.id) });
      });
      S.projects.all().forEach(pr => {
        if ((pr.name || '').toLowerCase().includes(q))
          results.push({ ico: '🌼', label: pr.name, sub: 'Projeto', action: () => PP.Projects.openDetail(pr.id) });
      });

      if (!results.length) {
        box.innerHTML = `<div class="search__result">🔍 <span>Nada encontrado para “${U.esc(q)}”</span></div>`;
      } else {
        box.innerHTML = results.slice(0, 8).map((r, i) => `
          <div class="search__result" data-i="${i}">
            <span>${r.ico}</span><span>${U.esc(r.label)}</span><small>${U.esc(r.sub)}</small>
          </div>`).join('');
        box.querySelectorAll('[data-i]').forEach(el => el.onclick = () => {
          results[Number(el.dataset.i)].action();
          box.hidden = true; input.value = '';
        });
      }
      box.hidden = false;
    }, 200);

    input.addEventListener('input', run);
    // fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search')) box.hidden = true;
    });
  }

  /* ---------- Notificações ---------- */
  function setupNotifications() {
    const btn = document.getElementById('btn-notifications');
    const panel = document.getElementById('notif-panel');
    btn.onclick = (e) => {
      e.stopPropagation();
      const willOpen = panel.hidden;
      if (willOpen) PP.Notifications.renderPanel();
      panel.hidden = !willOpen;
    };
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notif-panel') && !e.target.closest('#btn-notifications')) panel.hidden = true;
    });
  }

  /* ---------- Menu mobile ---------- */
  function setupMobileMenu() {
    const app = document.getElementById('app');
    const overlay = document.getElementById('overlay');
    document.getElementById('menu-toggle').onclick = () => {
      const open = app.classList.toggle('sidebar-open');
      overlay.hidden = !open;
    };
    overlay.onclick = () => { app.classList.remove('sidebar-open'); overlay.hidden = true; };
  }

  /* ---------- Menu compacto (recolher/expandir no desktop) ---------- */
  function setupSidebarCollapse() {
    const app = document.getElementById('app');
    const btn = document.getElementById('sidebar-collapse-btn');
    if (!btn) return;
    btn.onclick = () => {
      const compact = app.classList.toggle('sidebar-compact');
      btn.textContent = compact ? '»' : '«';
      btn.title = compact ? 'Expandir menu' : 'Recolher menu';
      PP.Storage.saveSettings({ sidebarCompact: compact });
    };
  }

  /* ---------- Boot ---------- */
  function boot() {
    PP.Storage.load();
    const s = PP.Storage.settings();

    // aplica tema salvo
    document.body.classList.toggle('theme-dark', s.theme === 'dark');
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) themeBtn.textContent = s.theme === 'dark' ? '☀️' : '🌙';
    if (s.accentTheme && s.accentTheme !== 'green') {
      document.body.classList.add('theme-accent-' + s.accentTheme);
    }
    if (s.sidebarCompact) {
      document.getElementById('app').classList.add('sidebar-compact');
      const collapseBtn = document.getElementById('sidebar-collapse-btn');
      if (collapseBtn) { collapseBtn.textContent = '»'; collapseBtn.title = 'Expandir menu'; }
    }

    refreshProfile();
    U.attachRipples(document);

    // topo
    document.getElementById('btn-theme').onclick = toggleTheme;
    document.getElementById('btn-new-client').onclick = () => PP.Clients.openForm();
    document.getElementById('btn-profile').onclick = () => PP.Router.go('configuracoes');
    setupSearch();
    setupNotifications();
    setupMobileMenu();
    setupSidebarCollapse();

    // rota inicial
    if (!location.hash) location.hash = '#/dashboard';
    PP.Router.start();
    PP.Notifications.refreshBadge();
  }

  function init() {
    PP.Storage.load();

    const startAfterLogin = () => {
      document.getElementById('loading-screen').hidden = false;
      runLoading(() => {
        document.getElementById('app').hidden = false;
        boot();
      });
    };

    if (PP.Auth.isLoggedIn()) {
      document.getElementById('login-screen')?.remove();
      startAfterLogin();
    } else {
      PP.Auth.showLogin(startAfterLogin);
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  PP.App = { setTheme, toggleTheme, refreshProfile, setAccentTheme };
})();
