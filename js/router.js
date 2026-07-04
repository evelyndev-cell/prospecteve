/* =====================================================================
   Prospeceve · router.js
   Roteador SPA por hash (#/rota). Renderiza o módulo certo no #app-content
   sem recarregar a página. Expõe window.PP.Router.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};

  const routes = {
    dashboard:     () => PP.Dashboard,
    clientes:      () => PP.Clients,
    projetos:      () => PP.Projects,
    financeiro:    () => PP.Financial,
    calendario:    () => PP.Calendar,
    relatorios:    () => PP.Reports,
    arquivos:      () => PP.Files,
    configuracoes: () => PP.Settings,
  };

  function current() {
    const hash = (location.hash || '#/dashboard').replace(/^#\//, '');
    return routes[hash] ? hash : 'dashboard';
  }

  function handle() {
    const name = current();
    const content = document.getElementById('app-content');
    if (!content) return;

    // marca o item ativo no menu
    document.querySelectorAll('.nav-item').forEach(a =>
      a.classList.toggle('is-active', a.dataset.route === name));

    // renderiza com uma animação de entrada
    content.classList.remove('fade-in'); void content.offsetWidth; content.classList.add('fade-in');
    const mod = routes[name]();
    try {
      mod.render(content);
    } catch (e) {
      console.error('Erro ao renderizar a rota', name, e);
      content.innerHTML = `<div class="cushion empty"><span class="empty__emoji">😿</span>
        <div class="empty__title">Algo tropeçou nas costuras…</div>
        <p>${PP.Utils.esc(e.message)}</p></div>`;
    }

    // fecha o menu no mobile e rola ao topo
    document.getElementById('app')?.classList.remove('sidebar-open');
    document.getElementById('overlay')?.setAttribute('hidden', '');
    content.scrollTop = 0;

    // atualiza notificações
    PP.Notifications.refreshBadge();
  }

  const Router = {
    start() { window.addEventListener('hashchange', handle); handle(); },
    /** Re-renderiza a rota atual (após criar/editar/excluir algo). */
    reload() { handle(); },
    go(name) { location.hash = '#/' + name; },
    current,
  };

  PP.Router = Router;
})();
