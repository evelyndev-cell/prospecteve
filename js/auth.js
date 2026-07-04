/* =====================================================================
   Prospeceve · auth.js
   Proteção simples por usuário/senha (client-side). Expõe window.PP.Auth.

   ⚠️ Aviso importante: como este é um app 100% estático rodando no seu
   próprio navegador (sem servidor), esta senha fica gravada no próprio
   código-fonte do arquivo HTML. Ela impede que alguém abra o app "sem
   querer" ou por cima do seu ombro, mas NÃO é uma segurança de verdade —
   qualquer pessoa com acesso ao arquivo pode ler o código e descobrir a
   senha. Não é indicado para proteger dados realmente sensíveis.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};

  const CREDENTIALS = { username: 'evedev', password: 'prospeccao0' };
  const SESSION_KEY = 'prospeceve.session';

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === 'ok' ||
           localStorage.getItem(SESSION_KEY) === 'ok';
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  }

  /** Mostra a tela de login e chama onSuccess() quando autenticar. */
  function showLogin(onSuccess) {
    const screen = document.getElementById('login-screen');
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');
    if (!screen || !form) { onSuccess(); return; }

    screen.hidden = false;
    document.getElementById('login-user').focus();

    form.addEventListener('submit', function handler(e) {
      e.preventDefault();
      const user = form.username.value.trim();
      const pass = form.password.value;
      const remember = document.getElementById('login-remember').checked;

      if (user === CREDENTIALS.username && pass === CREDENTIALS.password) {
        (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, 'ok');
        form.removeEventListener('submit', handler);
        screen.classList.add('is-hidden');
        setTimeout(() => { screen.hidden = true; screen.remove(); }, 550);
        onSuccess();
      } else {
        errorBox.hidden = false;
        form.password.value = '';
        form.password.focus();
        const card = form; // sacode a caixa pra dar feedback visual
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = 'shake .4s ease';
      }
    });
  }

  PP.Auth = { isLoggedIn, logout, showLogin };
})();
