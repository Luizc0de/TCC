(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const { setores, tipos, request, notice, el, date, money, badge, listaCoberturas, carregarPerfil } = window.PainelFuncionario;
  const policyForm = $('#policy-form');
  const coverageOptions = $('#coverage-options');
  let catalogo;
  let permitidos = [];
  let setorAtual;
  let versao = 0;

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
      const coberturas = el('div', null, 'full');
      const descricoes = el('dd');
      descricoes.append(listaCoberturas(item.coberturas));
      coberturas.append(el('dt', 'Coberturas selecionadas'), descricoes);
      info.append(coberturas);
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
  function imagemDoSinistro(id) {
    const details = el('details');
    const feedback = el('p');
    const imagem = el('img', null, 'claim-image');
    imagem.alt = 'Imagem do sinistro #' + id;
    imagem.hidden = true;
    details.append(el('summary', 'Imagem da ocorrência'), feedback, imagem);
    let carregando = false;
    details.addEventListener('toggle', async () => {
      if (!details.open || carregando || !imagem.hidden) return;
      carregando = true;
      feedback.textContent = 'Carregando imagem…';
      try {
        const blob = await request('sinistros/imagem/' + id, 'GET', undefined, 'image/*');
        if (!details.isConnected) return;
        const url = URL.createObjectURL(blob);
        try {
          imagem.src = url;
          await imagem.decode();
          imagem.hidden = false;
          feedback.textContent = '';
        } finally { URL.revokeObjectURL(url); }
      } catch (error) {
        feedback.textContent = error.name === 'EncodingError' ? 'Não foi possível exibir a imagem.' : error.message;
      } finally { carregando = false; }
    });
    return details;
  }

  function sinistros(lista) {
    const target = $('#claims-list');
    target.replaceChildren();
    if (!lista.length) { target.append(el('p', 'Nenhum sinistro registrado.', 'state')); return; }
    lista.forEach(item => {
      const card = el('article', null, 'claim-card');
      const header = el('div', null, 'card-top');
      const titulo = el('div');
      titulo.append(el('h3', 'Sinistro #' + item.idSinistro), el('span', item.numeroApolice || 'Apólice #' + item.idApolice, 'policy-number'));
      header.append(titulo, badge(item.status));
      card.append(header, el('div', [item.cliente, date(item.dataAbertura)].filter(Boolean).join(' · '), 'claim-meta'),
        el('p', item.descricao), imagemDoSinistro(item.idSinistro));
      if (item.status === 'ABERTO') {
        const actions = el('div', null, 'actions');
        for (const [label, status, style] of [['Aprovar indenização', 'APROVADO', 'primary'], ['Negar indenização', 'NEGADO', 'outline']]) {
          const button = el('button', label, 'button button-' + style);
          button.type = 'button';
          button.addEventListener('click', async () => {
            actions.querySelectorAll('button').forEach(control => { control.disabled = true; });
            try {
              const result = await request('sinistros/analisar/' + item.idSinistro, 'PUT', { status });
              if (setorAtual !== 'atendimento') return;
              notice(result.message, 'success');
              await carregarSetor();
            } catch (error) {
              if (setorAtual !== 'atendimento') return;
              notice(error.message, 'error');
              if (error.status === 404 || error.status === 409) await carregarSetor();
            } finally { actions.querySelectorAll('button').forEach(control => { control.disabled = false; }); }
          });
          actions.append(button);
        }
        card.append(actions);
      }
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
        carregarCatalogo(atual),
        listar('getclientes', cliente, items => {
          const anterior = cliente.value;
          cliente.replaceChildren(new Option(items.length ? 'Selecione um cliente' : 'Nenhum cliente cadastrado', ''));
          items.forEach(item => cliente.add(new Option(item.name + ' · ' + item.email, item.id)));
          cliente.value = anterior;
        }, atual)
      ]);
    } else if (setorAtual === 'financeiro') {
      await listar('parcelas/get_all', $('#finance-list'), items => tabela($('#finance-list'),
        ['Apólice', 'Parcela', 'Vencimento', 'Valor', 'Situação'], items.map(p =>
          [p.numeroApolice, p.numeroParcela, date(p.dataVencimento), money(p.valorCentavos / 100), badge(p.status)]),
        'Nenhuma parcela disponível.'), atual);
    } else if (setorAtual === 'atendimento') {
      await listar('sinistros/get_all', $('#claims-list'), sinistros, atual);
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
      const setoresDoPerfil = await carregarPerfil('home');
      if (!setoresDoPerfil) return;
      permitidos = setoresDoPerfil;
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
    mostrarCoberturas();
  }

  function validarCoberturas() {
    const primeiro = coverageOptions.querySelector('input');
    if (primeiro) primeiro.setCustomValidity(coverageOptions.querySelector(':checked') ? '' : 'Selecione pelo menos uma cobertura.');
  }
  function mostrarCoberturas(preservar = false) {
    const produto = catalogo?.[$('#tipo').value];
    if (!produto) return;
    const marcadas = new Set(preservar ? new FormData(policyForm).getAll('coberturas') : []);
    coverageOptions.replaceChildren();
    $('#coverage-product').textContent = produto.modalidade + ' · Selecione uma ou mais coberturas.';
    const grupos = [['Coberturas comuns', produto.comuns]];
    if ($('#finalidade').value === 'PROFISSIONAL') grupos.push(['Adicionais de uso profissional', produto.profissionais]);
    grupos.forEach(([titulo, opcoes]) => {
      const grupo = el('fieldset', null, 'claim-fieldset coverage-group');
      grupo.append(el('legend', titulo));
      Object.entries(opcoes).forEach(([codigo, descricao]) => {
        const label = el('label', null, 'coverage-option');
        const input = el('input');
        input.type = 'checkbox';
        input.name = 'coberturas';
        input.value = codigo;
        input.checked = marcadas.has(codigo);
        label.append(input, descricao);
        grupo.append(label);
      });
      coverageOptions.append(grupo);
    });
    validarCoberturas();
  }
  async function carregarCatalogo(atual) {
    if (catalogo) return;
    try {
      const dados = await request('apolices/coberturas');
      if (atual !== versao) return;
      for (const tipo of Object.keys(tipos)) {
        if (!dados[tipo]?.modalidade || !dados[tipo]?.comuns || !dados[tipo]?.profissionais) throw new Error('Catálogo de coberturas inválido.');
      }
      catalogo = dados;
      mostrarCoberturas();
      policyForm.querySelector('[type=submit]').disabled = false;
    } catch (error) {
      if (atual === versao) $('#coverage-product').textContent = error.message + ' Use Atualizar para carregar as coberturas.';
    }
  }
  coverageOptions.addEventListener('change', validarCoberturas);
  $('#finalidade').addEventListener('change', () => mostrarCoberturas(true));
  $('#tipo').addEventListener('change', camposDoBem);
  camposDoBem();
  async function enviar(event, route, payload) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type=submit]');
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    try {
      const result = await request(route, 'POST', payload(new FormData(form)));
      form.reset();
      if (form === policyForm) { camposDoBem(); await carregarSetor(); }
      notice([result.numeroApolice, result.message].filter(Boolean).join(' · '), 'success');
    } catch (error) { notice(error.message, 'error'); }
    finally { button.disabled = false; }
  }
  policyForm.addEventListener('submit', event => enviar(event, 'apolice', dados => {
    const coberturas = dados.getAll('coberturas');
    dados.delete('coberturas');
    const { idCliente, valorTotal, quantidadeParcelas, diaVencimento, dataEmissao, dataVencimento, prazo, ...bem } = Object.fromEntries(dados);
    return { idCliente, valorTotal, quantidadeParcelas, diaVencimento, dataEmissao, dataVencimento, coberturas,
      tipoApolice: bem.tipo === 'TELEFONE' ? 'ELETRONICO' : bem.tipo, FirstParcelNow: Number(prazo) === 0,
      daysfromfirstparcel: Number(prazo), bem: Object.fromEntries(Object.entries(bem).filter(([, value]) => value !== '')) };
  }));
  $('#employee-form').addEventListener('submit', event => enviar(event, 'funcionario', dados => Object.fromEntries(dados)));
  $('#refresh-page').addEventListener('click', () => { if (setorAtual) carregarSetor(); else iniciar(); });
  window.addEventListener('hashchange', mostrarSetor);
  iniciar();
}());
