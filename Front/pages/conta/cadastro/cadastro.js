(function () {
  'use strict';
  // A API e configurada em Front/config.js, independentemente de como o HTML abriu.
  const apiBase = window.INSURANCE_CONFIG?.apiBaseUrl || 'http://localhost/TCC/Back_end/index.php';
  const endpoint = new URL(apiBase);
  endpoint.searchParams.set('url', 'users_PF');
  const form = document.getElementById('register-form');
  const button = form.querySelector('[type="submit"]');
  const feedback = document.getElementById('auth-feedback');
  const name = document.getElementById('nome');
  const email = document.getElementById('email');
  const cpf = document.getElementById('cpf');
  const password = document.getElementById('senha');
  const confirmation = document.getElementById('confirmar-senha');
  let created = false;
  function message(text, success = false) {
    feedback.textContent = text;
    feedback.classList.toggle('is-success', success);
    feedback.hidden = false;
    feedback.focus();
  }
  function validCpf(value) {
    if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
    for (let length = 9; length <= 10; length++) {
      let total = 0;
      for (let i = 0; i < length; i++) total += Number(value[i]) * (length + 1 - i);
      let digit = (total * 10) % 11;
      if (digit === 10) digit = 0;
      if (digit !== Number(value[length])) return false;
    }
    return true;
  }
  [name, cpf, password, confirmation].forEach(input => input.addEventListener('input', () => {
    input.setCustomValidity('');
    confirmation.setCustomValidity('');
  }));
  cpf.addEventListener('input', () => {
    cpf.value = cpf.value.replace(/\D/g, '').slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  });
  button.disabled = false;
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (button.disabled || created) return;
    name.setCustomValidity(name.value.trim().length < 2 ? 'Informe seu nome completo.' : '');
    cpf.setCustomValidity(validCpf(cpf.value.replace(/\D/g, '')) ? '' : 'Informe um CPF v\u00e1lido.');
    confirmation.setCustomValidity(password.value === confirmation.value ? '' : 'As senhas precisam ser iguais.');
    if (!form.reportValidity()) return;
    feedback.hidden = true;
    button.disabled = true;
    button.textContent = 'Criando conta...';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: name.value.trim(), email: email.value.trim(),
          password: password.value, cpf: cpf.value.replace(/\D/g, '') }),
        signal: controller.signal, cache: 'no-store'
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const duplicate = data && typeof data.error === 'string' && /Email ou CPF j/i.test(data.error);
        throw new Error(duplicate ? 'E-mail ou CPF j\u00e1 cadastrado. Entre na sua conta.'
          : 'N\u00e3o foi poss\u00edvel cadastrar. Verifique seus dados e tente novamente.');
      }
      // O backend cria a conta antes do envio do e-mail, inclusive se o SMTP falhar.
      if (response.status !== 201 || !data || typeof data.success !== 'boolean') {
        throw new Error('N\u00e3o foi poss\u00edvel confirmar o cadastro. Tente entrar antes de cadastrar novamente.');
      }
      created = true;
      password.value = '';
      confirmation.value = '';
      form.querySelectorAll('input').forEach(input => { input.disabled = true; });
      document.getElementById('registration-login').hidden = false;
      message(data.success ? 'Conta criada com sucesso! Verifique seu e-mail e acesse sua conta.'
        : 'Conta criada, mas o e-mail n\u00e3o p\u00f4de ser enviado. Voc\u00ea j\u00e1 pode entrar com seu e-mail e senha.', true);
    } catch (error) {
      message(error.name === 'AbortError' || error instanceof TypeError
        ? 'N\u00e3o foi poss\u00edvel confirmar o cadastro. Verifique a conex\u00e3o e tente entrar antes de cadastrar novamente.' : error.message);
    } finally {
      clearTimeout(timeout);
      button.disabled = created;
      button.textContent = created ? 'Conta criada' : 'Criar conta';
      form.removeAttribute('aria-busy');
    }
  });
}());
