(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const apiBase = window.INSURANCE_CONFIG?.apiBaseUrl || 'http://localhost/TCC/Back_end/index.php';
  const sessionKey = 'insurance.authToken';
  const setores = {
    vendas: ['Vendas', 'Cadastre uma apólice e acompanhe a decisão da análise de risco.'],
    analise_risco: ['Análise de risco', 'Consulte os dados do bem e decida sobre as apólices em análise.'],
    rh: ['Recursos humanos', 'Cadastre funcionários e defina o setor de acesso.'],
    financeiro: ['Financeiro', 'Acompanhe os valores, vencimentos e pagamentos das parcelas.'],
    atendimento: ['Atendimento', 'Consulte as ocorrências das apólices sob sua responsabilidade.']
  };
  const tipos = { VEICULO: 'Automóvel', NOTEBOOK: 'Notebook', TELEFONE: 'Celular' };
  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const policyForm = $('#policy-form');
  let permitidos = [];
  let setorAtual;
  let versao = 0;

  function signOut() {
    try { sessionStorage.removeItem(sessionKey); sessionStorage.removeItem('insurance.pendingInstallment'); } catch {}
    location.replace('../../conta/entrar/index.html');
  }
  $('[data-logout]').addEventListener('click', signOut);

  async function request(route, method = 'GET', payload) {
    let token;
    try { token = sessionStorage.getItem(sessionKey); } catch {}
    if (!token) { signOut(); throw new Error('Entre novamente para continuar.'); }
    const url = new URL(apiBase);
    url.searchParams.set('url', route);
    const headers = { Accept: 'application/json', Authorization: 'Bearer ' + token };
    if (payload) headers['Content-Type'] = 'application/json';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload), signal: controller.signal, cache: 'no-store' });
      if (res.status === 401) { signOut(); throw new Error('Sua sessão expirou.'); }
      const data = await res.json().catch(() => null);
      if (!res.ok || data === null) {
        const error = new Error(data?.error || 'Não foi possível concluir a solicitação.');
        error.status = res.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('O servidor demorou para responder. Atualize o painel para conferir a situação.');
      if (error instanceof TypeError) throw new Error('Não foi possível conectar à API.');
      throw error;
    } finally { clearTimeout(timeout); }
  }

  function notice(text, type = '') {
    const target = $('#page-feedback');
    target.textContent = text;
    target.className = 'status-message ' + type;
    target.hidden = !text;
    if (text) target.scrollIntoView({ block: 'nearest' });
  }
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function date(value) {
    return value ? value.slice(0, 10).split('-').reverse().join('/') : '—';
  }
  function money(value) { return value == null ? '—' : moeda.format(value); }
  function badge(value) {
    const status = { EM_ANALISE: 'Em análise', APROVADA: 'Aprovada', RECUSADA: 'Recusada',
      PAGA: 'Paga', ABERTA: 'Em aberto', PENDENTE: 'Pendente' };
    const color = ['APROVADA', 'ATIVA', 'PAGA'].includes(value) ? 'green'
      : ['RECUSADA', 'CANCELADA'].includes(value) ? 'red' : 'blue';
    return el('span', status[value] || String(value || '—').replaceAll('_', ' ').toLowerCase(), 'badge ' + color);
  }
  function tabela(target, headers, rows, empty) {
    if (!rows.length) { target.replaceChildren(el('p', empty, 'state')); return; }
    const table = el('table');
    const head = table.createTHead().insertRow();
    headers.forEach(label => { const th = el('th', label); th.scope = 'col'; head.append(th); });
    const body = table.createTBody();
    rows.forEach(values => {
      const row = body.insertRow();
      values.forEach(value => row.insertCell().append(value ?? '—'));
    });
    target.replaceChildren(table);
  }
  function risco(lista) {
    const target = $('#risk-queue');
    target.replaceChildren();
    if (!lista.length) { target.append(el('p', 'Nenhuma apólice aguardando análise.', 'state')); return; }
    lista.forEach(item => {
      const card = el('article', null, 'panel');
      const header = el('div', null, 'section-header');
      header.append(el('h2', item.numeroApolice || 'Apólice #' + item.id), badge(item.status));
      const details = el('details');
      details.append(el('summary', 'Examinar apólice'));
      const info = el('dl', null, 'info-grid');
      const campos = [
        ['Cliente', item.cliente], ['Bem', tipos[item.bemTipo]], ['Descrição', item.bemDescricao],
        ['Finalidade', item.finalidade], ['Valor avaliado', money(item.valorAvaliacao)], ['Prêmio total', money(item.valor)],
        ['Parcelas', item.quantidadeParcelas], ['Assinatura', date(item.data)], ['Vencimento', date(item.dataVencimento)],
        ['Marca', item.marca], ['Modelo', item.modeloVeiculo || item.modelo], ['Placa', item.placa],
        ['Chassi', item.chassi], ['Fabricação', item.dataFabricacao && date(item.dataFabricacao)],
        ['Número de série', item.numeroSerie], ['IMEI', item.imei]
      ];
      campos.forEach(([label, value]) => {
        if (value == null || value === '') return;
        const field = el('div');
        field.append(el('dt', label), el('dd', value));
        info.append(field);
      });
      const actions = el('div', null, 'actions');
      for (const [label, status, style] of [['Aprovar', 'APROVADA', 'primary'], ['Recusar', 'RECUSADA', 'outline']]) {
        const button = el('button', label, 'button button-' + style);
        button.type = 'button';
        button.addEventListener('click', async () => {
          actions.querySelectorAll('button').forEach(control => { control.disabled = true; });
          try {
            const result = await request('apolices/analisar/' + item.id, 'PUT', { status });
            card.remove();
            if (!target.children.length) risco([]);
            notice([result.message, result.avisoStripe].filter(Boolean).join(' '), 'success');
          } catch (error) {
            if (error.status === 404 || error.status === 409) await carregarSetor();
            notice(error.message, 'error');
          } finally { actions.querySelectorAll('button').forEach(control => { control.disabled = false; }); }
        });
        actions.append(button);
      }
      details.append(info, actions);
      card.append(header, el('p', [item.cliente, tipos[item.bemTipo], money(item.valor)].filter(Boolean).join(' · ')), details);
      target.append(card);
    });
  }
  async function listar(route, target, render, atual) {
    target.setAttribute('aria-busy', 'true');
    try {
      const data = await request(route);
      if (atual !== versao) return;
      if (!Array.isArray(data)) throw new Error('A API retornou uma lista inválida.');
      render(data);
    } catch (error) {
      if (atual === versao) {
        if (target.tagName === 'SELECT') target.replaceChildren(new Option('Lista de clientes indisponível', ''));
        else target.replaceChildren(el('p', error.message + ' Use Atualizar para tentar novamente.', 'status-message error'));
        if (target.tagName === 'SELECT') notice(error.message, 'error');
      }
    } finally { if (atual === versao) target.removeAttribute('aria-busy'); }
  }
  async function carregarSetor() {
    const atual = ++versao;
    if (setorAtual === 'analise_risco') {
      await listar('apolices/em_analise', $('#risk-queue'), risco, atual);
    } else if (setorAtual === 'vendas') {
      const cliente = $('#cliente');
      await Promise.all([
        listar('getclientes', cliente, items => {
          const anterior = cliente.value;
          cliente.replaceChildren(new Option(items.length ? 'Selecione um cliente' : 'Nenhum cliente cadastrado', ''));
          items.forEach(item => cliente.add(new Option(item.name + ' · ' + item.email, item.id)));
          cliente.value = anterior;
        }, atual),
        listar('apolices/get_all', $('#sales-policies'), items => tabela($('#sales-policies'),
          ['Apólice', 'Cliente', 'Valor total', 'Situação'], items.map(p => [p.numeroApolice, p.cliente, money(p.valor), badge(p.status)]),
          'Você ainda não enviou apólices.'), atual)
      ]);
    } else if (setorAtual === 'financeiro') {
      await listar('parcelas/get_all', $('#finance-list'), items => tabela($('#finance-list'),
        ['Apólice', 'Parcela', 'Vencimento', 'Valor', 'Situação'], items.map(p =>
          [p.numeroApolice, p.numeroParcela, date(p.dataVencimento), money(p.valorCentavos / 100), badge(p.status)]),
        'Nenhuma parcela disponível.'), atual);
    } else if (setorAtual === 'atendimento') {
      await listar('sinistros/get_all', $('#claims-list'), items => tabela($('#claims-list'),
        ['Apólice', 'Abertura', 'Ocorrência', 'Situação'], items.map(s =>
          [s.numeroApolice, date(s.dataAbertura), s.descricao, badge(s.status)]), 'Nenhum sinistro vinculado.'), atual);
    }
  }

  function mostrarSetor() {
    const hash = location.hash.slice(1);
    setorAtual = permitidos.includes(hash) ? hash : permitidos[0];
    Object.keys(setores).forEach(key => { document.getElementById(key).hidden = key !== setorAtual; });
    document.querySelectorAll('[data-setores] a').forEach(link => {
      if (link.hash === '#' + setorAtual) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    $('.mobile-navigation').open = false;
    notice('');
    if (!setorAtual) {
      $('#page-description').textContent = 'Nenhum setor habilitado nesta sessão. Entre novamente ou consulte o RH.';
      return;
    }
    $('#page-title').textContent = setores[setorAtual][0];
    $('#page-description').textContent = setores[setorAtual][1];
    carregarSetor();
  }
  async function iniciar() {
    try {
      const perfil = await request('profile');
      if (!perfil.roles?.includes('funcionario')) { location.replace('../../cliente/home/index.html'); return; }
      $('#employee-name').textContent = perfil.nome;
      $('#initials').textContent = perfil.nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
      permitidos = Object.keys(setores).filter(key => perfil.roles.includes(key));
      document.querySelectorAll('[data-setores]').forEach(nav => {
        nav.replaceChildren();
        permitidos.forEach(key => { const link = el('a', setores[key][0]); link.href = '#' + key; nav.append(link); });
      });
      mostrarSetor();
    } catch (error) { notice(error.message, 'error'); }
  }
  function camposDoBem() {
    const tipo = $('#tipo').value;
    $('#marca').required = tipo === 'VEICULO';
    document.querySelectorAll('[data-bem]').forEach(field => {
      field.hidden = !field.dataset.bem.split(' ').includes(tipo);
      field.querySelector('input').disabled = field.hidden;
    });
  }
  $('#tipo').addEventListener('change', camposDoBem);
  camposDoBem();
  async function enviar(event, route, payload) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type=submit]');
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    try {
      const result = await request(route, 'POST', payload(Object.fromEntries(new FormData(form))));
      form.reset();
      if (form === policyForm) { camposDoBem(); await carregarSetor(); }
      notice([result.numeroApolice, result.message].filter(Boolean).join(' · '), 'success');
    } catch (error) { notice(error.message, 'error'); }
    finally { button.disabled = false; }
  }
  policyForm.addEventListener('submit', event => enviar(event, 'apolice', fields => {
    const { idCliente, valorTotal, quantidadeParcelas, diaVencimento, dataEmissao, dataVencimento, prazo, ...bem } = fields;
    return { idCliente, valorTotal, quantidadeParcelas, diaVencimento, dataEmissao, dataVencimento,
      tipoApolice: bem.tipo === 'TELEFONE' ? 'ELETRONICO' : bem.tipo, FirstParcelNow: Number(prazo) === 0,
      daysfromfirstparcel: Number(prazo), bem: Object.fromEntries(Object.entries(bem).filter(([, value]) => value !== '')) };
  }));
  $('#employee-form').addEventListener('submit', event => enviar(event, 'funcionario', data => data));
  $('#refresh-page').addEventListener('click', () => { if (setorAtual) carregarSetor(); else iniciar(); });
  window.addEventListener('hashchange', mostrarSetor);
  iniciar();
}());
