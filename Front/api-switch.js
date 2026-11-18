// Seletor de ambiente da API (local x producao) usado nas telas de entrar e cadastro.
(function () {
  'use strict';
  const config = window.INSURANCE_CONFIG;
  const host = document.querySelector('[data-api-switch]');
  if (!config || !host) return;

  const style = document.createElement('style');
  style.textContent = '.api-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 18px;padding:10px 14px;border:1px solid #e5eaf3;border-radius:14px;background:#f7f9fc;font-size:.85rem;color:#6f809e}' +
    '.api-switch-label{font-weight:600;color:#0a173e}' +
    '.api-switch-options{display:inline-flex;padding:3px;border-radius:999px;background:#e5eaf3}' +
    '.api-switch-options button{border:0;border-radius:999px;padding:6px 14px;background:transparent;color:#6f809e;font:inherit;font-weight:600;cursor:pointer}' +
    '.api-switch-options button[aria-pressed="true"]{background:#2459eb;color:#fff}' +
    '.api-switch-options button:focus-visible{outline:2px solid #51c6db;outline-offset:2px}';
  document.head.appendChild(style);

  host.classList.add('api-switch');
  host.innerHTML = '<span class="api-switch-label">API</span><div class="api-switch-options" role="group" aria-label="Ambiente da API"></div>';
  const group = host.querySelector('.api-switch-options');
  const labels = { local: 'Local', production: 'Produção' };
  const buttons = Object.keys(labels).map(function (mode) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mode = mode;
    button.textContent = labels[mode];
    button.addEventListener('click', function () {
      config.setApiMode(mode);
      render();
    });
    group.appendChild(button);
    return button;
  });

  function render() {
    const active = config.apiMode;
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === active));
    });
    host.title = config.apiBaseUrl;
  }

  render();
})();
