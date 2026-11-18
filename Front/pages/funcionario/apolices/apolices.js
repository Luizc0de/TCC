(function () {
  'use strict';
  const { carregarPerfil, request, notice, el, date, money, badge, tipos, listaCoberturas } = window.PainelFuncionario;
  const target = document.querySelector('#sales-policies');
  const refresh = document.querySelector('#refresh-page');
  const id = new URLSearchParams(location.search).get('id');
  if (id !== null) {
    document.querySelector('#voltar').hidden = false;
    document.querySelector('#page-title').textContent = 'Detalhes da apólice';
    document.title = 'Detalhes da apólice | Vendas Insurance';
  }

  function numero(apolice) {
    return apolice.numeroApolice || 'Apólice #' + apolice.id;
  }

  function modalidade(tipo) {
    return tipo === 'ELETRONICO' ? 'Eletrônico' : tipos[tipo] || tipo;
  }

  function cartao(apolice) {
    const link = el('a', null, 'policy-card');
    link.href = 'index.html?id=' + encodeURIComponent(apolice.id);
    link.setAttribute('aria-label', 'Ver detalhes de ' + numero(apolice) + (apolice.cliente ? ' · ' + apolice.cliente : ''));
    const topo = el('div', null, 'card-top');
    topo.append(el('span', numero(apolice), 'policy-number'), badge(apolice.status));
    const valores = el('div', null, 'card-values');
    for (const [titulo, valor] of [['Valor total', money(apolice.valor)], ['Assinatura', date(apolice.data)]]) {
      const campo = el('div');
      campo.append(el('small', titulo), el('strong', valor));
      valores.append(campo);
    }
    link.append(topo, el('h2', apolice.cliente || 'Cliente não informado'),
      el('p', [tipos[apolice.bemTipo] || modalidade(apolice.tipo), apolice.bemDescricao].filter(Boolean).join(' · '), 'asset-label'),
      valores, el('span', 'Ver detalhes →', 'text-link'));
    return link;
  }

  function mostrarLista(apolices) {
    if (!Array.isArray(apolices)) throw new Error('A API retornou uma lista inválida.');
    if (!apolices.length) {
      target.replaceChildren(el('p', 'Você ainda não gerou nenhuma apólice.', 'state'));
      return;
    }
    const grid = el('div', null, 'policy-grid');
    apolices.sort((a, b) => b.id - a.id).forEach(apolice => grid.append(cartao(apolice)));
    target.replaceChildren(grid);
  }

  function informacoes(campos) {
    const lista = el('dl', null, 'info-grid');
    campos.forEach(([titulo, valor]) => {
      const campo = el('div');
      campo.append(el('dt', titulo), el('dd', valor ?? '—'));
      lista.append(campo);
    });
    return lista;
  }

  function mostrarDetalhe(apolice) {
    const resumo = el('section', null, 'panel');
    const titulo = el('div', null, 'section-header');
    titulo.append(el('h2', numero(apolice)), badge(apolice.status));
    resumo.append(titulo, informacoes([
      ['Cliente', apolice.cliente], ['Tipo de apólice', modalidade(apolice.tipo)], ['Valor total', money(apolice.valor)],
      ['Parcelas', apolice.quantidadeParcelas], ['Assinatura', date(apolice.data)], ['Vencimento', date(apolice.dataVencimento)]
    ]));

    const bem = apolice.bem;
    const produto = el('section', null, 'panel');
    produto.append(el('h2', 'Bem segurado'));
    if (bem) {
      const finalidades = { PESSOAL: 'Particular', PROFISSIONAL: 'Profissional' };
      const campos = [['Tipo de bem', tipos[bem.tipo] || bem.tipo], ['Descrição', bem.descricao],
        ['Finalidade de uso', finalidades[bem.finalidade] || bem.finalidade], ['Valor avaliado', money(bem.valorAvaliacao)], ['Marca', bem.marca]];
      const especificos = { modeloVeiculo: 'Modelo do veículo', placa: 'Placa', chassi: 'Chassi',
        dataFabricacao: 'Data de fabricação', modelo: 'Modelo', numeroSerie: 'Número de série', imei: 'IMEI' };
      for (const [chave, label] of Object.entries(especificos)) {
        if (Object.hasOwn(bem, chave)) campos.push([label, chave === 'dataFabricacao' ? date(bem[chave]) : bem[chave]]);
      }
      produto.append(informacoes(campos));
    } else {
      produto.append(el('p', 'Nenhum bem registrado nesta apólice.'));
    }
    const coberturas = el('section', null, 'panel');
    coberturas.append(el('h2', 'Coberturas'), listaCoberturas(apolice.coberturas));
    const detalhes = el('div', null, 'detail-grid');
    detalhes.append(produto, coberturas);
    target.replaceChildren(resumo, detalhes);
  }

  async function carregar() {
    refresh.disabled = true;
    target.setAttribute('aria-busy', 'true');
    notice('');
    try {
      if (!await carregarPerfil('apolices')) return;
      if (id === null) {
        mostrarLista(await request('apolices/get_all'));
      } else if (/^[1-9]\d*$/.test(id)) {
        mostrarDetalhe(await request('apolices/vendas/' + id));
      } else {
        throw new Error('Identificador de apólice inválido.');
      }
    } catch (error) {
      target.replaceChildren();
      notice(error.message, 'error');
    } finally {
      target.removeAttribute('aria-busy');
      refresh.disabled = false;
    }
  }
  refresh.addEventListener('click', carregar);
  carregar();
}());
