/* =====================================================================
   Prospeceve · utils.js
   Funções utilitárias reutilizáveis. Tudo exposto em window.PP.Utils.
   ===================================================================== */
(function () {
  'use strict';
  window.PP = window.PP || {};

  const Utils = {
    /** Gera um id único curto. */
    uid(prefix = 'id') {
      return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },

    /** Escapa HTML para evitar quebra de layout / injeção ao renderizar strings. */
    esc(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    /** Formata número como moeda brasileira. */
    money(value) {
      const n = Number(value) || 0;
      return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    /** Converte ISO (yyyy-mm-dd) para dd/mm/aaaa. Retorna '—' se vazio. */
    dateBR(iso) {
      if (!iso) return '—';
      const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
      if (isNaN(d)) return '—';
      return d.toLocaleDateString('pt-BR');
    },

    /** Data de hoje em ISO (yyyy-mm-dd). */
    today() {
      return new Date().toISOString().slice(0, 10);
    },

    /** Diferença em dias entre hoje e uma data ISO (positivo = futuro). */
    daysUntil(iso) {
      if (!iso) return null;
      const d = new Date(iso + 'T00:00:00');
      const now = new Date(); now.setHours(0, 0, 0, 0);
      return Math.round((d - now) / 86400000);
    },

    /** Iniciais de um nome para avatar. */
    initials(name) {
      if (!name) return '??';
      const parts = name.trim().split(/\s+/);
      return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
    },

    /** Cria elemento a partir de string HTML e retorna o primeiro nó. */
    fromHTML(html) {
      const t = document.createElement('template');
      t.innerHTML = html.trim();
      return t.content.firstElementChild;
    },

    /** Atalho para querySelector. */
    qs(sel, root = document) { return root.querySelector(sel); },
    qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); },

    /** Debounce simples (para a busca instantânea). */
    debounce(fn, wait = 220) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    /** Toast de feedback. tipo: ok | info | warn | error */
    toast(message, type = 'ok', emoji) {
      const root = document.getElementById('toast-root');
      if (!root) return;
      const ico = emoji || ({ ok: '✅', info: '💬', warn: '⚠️', error: '❌' }[type] || '✨');
      const el = Utils.fromHTML(
        `<div class="toast toast--${type}"><span>${ico}</span><span>${Utils.esc(message)}</span></div>`
      );
      root.appendChild(el);
      setTimeout(() => {
        el.classList.add('is-out');
        el.addEventListener('animationend', () => el.remove());
      }, 2600);
    },

    /** Confirmação fofa (Promise<boolean>) via modal. */
    confirm(message, { okText = 'Sim', cancelText = 'Cancelar', danger = false } = {}) {
      return new Promise((resolve) => {
        const root = document.getElementById('modal-root');
        const back = Utils.fromHTML(`
          <div class="modal-backdrop">
            <div class="modal" style="max-width:420px" role="alertdialog" aria-modal="true">
              <div class="modal__head"><h3 class="modal__title">🌸 Confirmação</h3></div>
              <p style="margin:0 0 8px">${Utils.esc(message)}</p>
              <div class="form-actions">
                <button class="pill-btn pill-btn--ghost" data-act="cancel">${Utils.esc(cancelText)}</button>
                <button class="pill-btn ${danger ? 'pill-btn--danger' : ''}" data-act="ok">${Utils.esc(okText)}</button>
              </div>
            </div>
          </div>`);
        root.appendChild(back);
        const done = (val) => { back.remove(); resolve(val); };
        back.addEventListener('click', (e) => {
          if (e.target === back) done(false);
          const act = e.target.closest('[data-act]')?.dataset.act;
          if (act === 'ok') done(true);
          if (act === 'cancel') done(false);
        });
      });
    },

    /** Efeito ripple ao clicar em botões-pílula. */
    attachRipples(root = document) {
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('.pill-btn');
        if (!btn) return;
        const r = document.createElement('span');
        r.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        r.style.width = r.style.height = size + 'px';
        r.style.left = (e.clientX - rect.left - size / 2) + 'px';
        r.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(r);
        r.addEventListener('animationend', () => r.remove());
      });
    },
  };

  PP.Utils = Utils;
})();
