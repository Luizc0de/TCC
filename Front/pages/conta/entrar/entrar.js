(function () {
  'use strict';
  // A API e configurada em Front/config.js, independentemente de como o HTML abriu.
  // Lido a cada envio para respeitar o ambiente escolhido no seletor.
  function loginEndpoint() {
    const endpoint = new URL(window.INSURANCE_CONFIG?.apiBaseUrl || 'http://localhost/TCC/Back_end/index.php');
    endpoint.searchParams.set('url', 'auth/login');
    return endpoint;
  }
  const form = document.getElementById('login-form');
  const button = form.querySelector('[type="submit"]');
  const feedback = document.getElementById('auth-feedback');
  const email = document.getElementById('email');
  const password = document.getElementById('senha');
  const sessionKey = 'insurance.authToken';
  if (new URLSearchParams(location.search).get('cadastro') === 'sucesso') {
    document.getElementById('registration-notice').hidden = false;
  }
  function message(text) {
    feedback.textContent = text;
    feedback.hidden = false;
    feedback.focus();
  }
  button.disabled = false;
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    feedback.hidden = true;
    button.disabled = true;
    button.textContent = 'Entrando...';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(loginEndpoint(), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), password: password.value }),
        signal: controller.signal, cache: 'no-store'
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(response.status === 400 || response.status === 401
          ? 'E-mail ou senha inv\u00e1lidos.' : 'N\u00e3o foi poss\u00edvel entrar. Tente novamente mais tarde.');
      }
      if (!data || typeof data.token !== 'string' || !data.token.trim()) {
        throw new Error('A API n\u00e3o retornou um token de acesso v\u00e1lido.');
      }
      try { sessionStorage.setItem(sessionKey, data.token); }
      catch { throw new Error('Permita o armazenamento da sess\u00e3o neste navegador para entrar.'); }
      password.value = '';
      const funcionario = Array.isArray(data.roles) && data.roles.includes('funcionario');
      location.assign(funcionario ? '../../funcionario/home/index.html' : '../../cliente/home/index.html');
    } catch (error) {
      message(error.name === 'AbortError' ? 'O servidor demorou para responder. Tente novamente.'
        : error instanceof TypeError ? 'N\u00e3o foi poss\u00edvel conectar \u00e0 API. Verifique o Apache e o MySQL no XAMPP.' : error.message);
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = 'Entrar';
      form.removeAttribute('aria-busy');
    }
  });
}());
