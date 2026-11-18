// Altere apenas esta URL ao trocar a API local pela API de producao.
// Informe o endpoint completo, incluindo index.php quando necessario.
window.INSURANCE_CONFIG = Object.freeze({
  apiBaseUrl: ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) && location.pathname.startsWith('/TCC/Front/')
    ? new URL('../Back_end/index.php', document.currentScript.src).href
    : 'http://localhost/TCC/Back_end/index.php'
});
//http://localhost/TCC/Back_end/index.php https://api.insurance.dev.br/index.php