(function () {
  'use strict';
  // A API e configurada em Front/config.js, independentemente de como o HTML abriu.
  const apiBase = window.INSURANCE_CONFIG?.apiBaseUrl || 'http://localhost/TCC/Back_end/index.php';
  const endpoint = new URL(apiBase);
  endpoint.searchParams.set('url', 'profile');
  const sessionKey = 'insurance.authToken';
  const feedback = document.getElementById('profile-feedback');
  const retry = document.getElementById('profile-retry');
  function signOut(event) {
    if (event) event.preventDefault();
    try { sessionStorage.removeItem(sessionKey); } catch { /* A sessao ja esta indisponivel. */ }
    location.replace('../entrar/index.html');
  }
  document.getElementById('logout-button').addEventListener('click', signOut);
  async function loadProfile() {
    let token;
    try { token = sessionStorage.getItem(sessionKey); } catch { return signOut(); }
    if (!token) return signOut();
    feedback.hidden = true;
    retry.hidden = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
        cache: 'no-store', signal: controller.signal
      });
      if (response.status === 401 || response.status === 403) return signOut();
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data.nome !== 'string' || typeof data.email !== 'string') {
        throw new Error('Profile unavailable');
      }
      document.querySelector('[data-profile-firstname]').textContent = data.nome.trim().split(/\s+/)[0];
      document.querySelector('[data-profile-name]').textContent = data.nome;
      document.getElementById('profile-email').textContent = data.email;
      document.getElementById('profile-avatar').textContent = data.nome.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
      document.getElementById('profile-name-input').value = data.nome;
      document.getElementById('profile-email-input').value = data.email;
    } catch {
      feedback.textContent = 'N\u00e3o foi poss\u00edvel carregar seu perfil. Tente novamente.';
      feedback.hidden = false;
      retry.hidden = false;
    } finally { clearTimeout(timeout); }
  }
  retry.addEventListener('click', loadProfile);
  loadProfile();
}());
