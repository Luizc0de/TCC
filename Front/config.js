// Endpoints completos da API (incluindo index.php). O ambiente ativo e escolhido
// pelo seletor das telas de entrar/cadastro e fica salvo em localStorage.
(function () {
  'use strict';
  const modeKey = 'insurance.apiMode';
  const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const localUrl = isLocalHost && location.pathname.startsWith('/TCC/Front/')
    ? new URL('../Back_end/index.php', document.currentScript.src).href
    : 'http://localhost/TCC/Back_end/index.php';
  const urls = Object.freeze({
    local: localUrl,
    production: 'https://api.insurance.dev.br/index.php'
  });

  function getMode() {
    let mode = null;
    try { mode = localStorage.getItem(modeKey); } catch (error) { /* armazenamento indisponivel */ }
    if (mode in urls) return mode;
    return isLocalHost ? 'local' : 'production';
  }

  function setMode(mode) {
    if (!(mode in urls)) return;
    try { localStorage.setItem(modeKey, mode); } catch (error) { /* armazenamento indisponivel */ }
  }

  window.INSURANCE_CONFIG = Object.freeze({
    urls,
    get apiMode() { return getMode(); },
    get apiBaseUrl() { return urls[getMode()]; },
    setApiMode: setMode
  });
})();