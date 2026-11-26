(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const solicitar = $('#recovery-form');
  const verificar = $('#code-form');
  const redefinir = $('#password-form');
  const feedback = $('#recovery-feedback');
  const reenviar = $('#resend');
  const endpoint = new URL(window.INSURANCE_CONFIG.apiBaseUrl);
  let conta, token, intervalo;
  let proximoEnvio = 0;
  let ocupado = false;

  function aviso(texto) {
    feedback.textContent = texto;
    feedback.hidden = !texto;
  }
  function etapa(form, titulo, descricao) {
    [solicitar, verificar, redefinir].forEach(item => { item.hidden = item !== form; });
    $('#recovery-title').textContent = titulo;
    $('#recovery-description').textContent = descricao;
    aviso('');
    if (form !== verificar) clearInterval(intervalo);
    const foco = form ? form.querySelector('input') : $('.auth-switch a');
    foco.focus();
  }
  function atualizarReenvio() {
    const segundos = Math.max(0, Math.ceil((proximoEnvio - Date.now()) / 1000));
    reenviar.disabled = ocupado || segundos > 0;
    reenviar.textContent = segundos ? 'Reenviar código em ' + segundos + ' s' : 'Reenviar código';
    if (!segundos) clearInterval(intervalo);
  }
  async function api(acao, dados) {
    const url = new URL(endpoint);
    url.searchParams.set('url', 'auth/recuperar-senha/' + acao);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const resposta = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(dados), cache: 'no-store', signal: controller.signal });
      const data = await resposta.json().catch(() => null);
      if (!resposta.ok || !data) {
        const erro = new Error(data?.error || 'Não foi possível concluir a solicitação. Tente novamente.');
        erro.status = resposta.status;
        throw erro;
      }
      return data;
    } finally { clearTimeout(timer); }
  }
  async function executar(form, acao) {
    if (ocupado) return;
    ocupado = true;
    form.setAttribute('aria-busy', 'true');
    const botoes = form.querySelectorAll('button');
    botoes.forEach(botao => { botao.disabled = true; });
    aviso('');
    try {
      await acao();
    } catch (erro) {
      aviso(erro.name === 'AbortError' ? 'O servidor demorou para responder. Tente novamente.'
        : erro instanceof TypeError ? 'Não foi possível conectar à API.' : erro.message);
    } finally {
      ocupado = false;
      form.removeAttribute('aria-busy');
      botoes.forEach(botao => { botao.disabled = false; });
      atualizarReenvio();
    }
  }
  async function pedirCodigo() {
    await api('solicitar', conta);
    proximoEnvio = Date.now() + 60000;
    verificar.reset();
    etapa(verificar, 'Confira seu e-mail', 'Se ' + conta.email + ' estiver cadastrado nesse tipo de conta, você receberá um código válido por 10 minutos. Verifique também a pasta de spam.');
    clearInterval(intervalo);
    atualizarReenvio();
    intervalo = setInterval(atualizarReenvio, 1000);
  }
  function voltarAoInicio() {
    token = null;
    verificar.reset();
    redefinir.reset();
    etapa(solicitar, 'Recuperar acesso', 'Informe o e-mail cadastrado para receber seu código.');
  }
  solicitar.querySelector('button').disabled = false;
  solicitar.addEventListener('submit', event => {
    event.preventDefault();
    executar(solicitar, async () => {
      conta = { email: $('#email').value.trim(), tipoConta: $('#tipo-conta').value };
      await pedirCodigo();
    });
  });
  reenviar.addEventListener('click', () => executar(verificar, pedirCodigo));
  $('#change-account').addEventListener('click', voltarAoInicio);
  verificar.addEventListener('submit', event => {
    event.preventDefault();
    executar(verificar, async () => {
      const data = await api('verificar', { ...conta, codigo: $('#codigo').value });
      if (!/^[0-9a-f]{64}$/.test(data.token || '')) throw new Error('Não foi possível validar o código.');
      token = data.token;
      verificar.reset();
      etapa(redefinir, 'Crie sua nova senha', 'Escolha a senha que você usará para entrar na conta.');
    });
  });
  redefinir.addEventListener('submit', event => {
    event.preventDefault();
    executar(redefinir, async () => {
      const senha = $('#nova-senha').value;
      if (senha !== $('#confirmacao').value) {
        $('#confirmacao').focus();
        throw new Error('As senhas precisam ser iguais.');
      }
      try {
        const data = await api('redefinir', { token, password: senha });
        token = null;
        redefinir.reset();
        etapa(null, 'Senha alterada', data.message);
      } catch (erro) {
        if (erro.status === 403) voltarAoInicio();
        throw erro;
      }
    });
  });
  window.addEventListener('pageshow', event => { if (event.persisted) voltarAoInicio(); });
}());
