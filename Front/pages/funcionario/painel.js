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
    atendimento: ['Atendimento', 'Consulte os sinistros e analise os pedidos de indenização.']
  };
  const tipos = { VEICULO: 'Automóvel', NOTEBOOK: 'Notebook', TELEFONE: 'Celular' };
  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function signOut() {
    try { sessionStorage.removeItem(sessionKey); sessionStorage.removeItem('insurance.pendingInstallment'); } catch {}
    location.replace('../../conta/entrar/index.html');
  }
  $('[data-logout]').addEventListener('click', signOut);

  async function request(route, method = 'GET', payload, accept = 'application/json') {
    let token;
    try { token = sessionStorage.getItem(sessionKey); } catch {}
    if (!token) { signOut(); throw new Error('Entre novamente para continuar.'); }
    const url = new URL(apiBase);
    url.searchParams.set('url', route);
    const headers = { Accept: accept, Authorization: 'Bearer ' + token };
    if (payload) headers['Content-Type'] = 'application/json';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload), signal: controller.signal, cache: 'no-store' });
      if (res.status === 401) { signOut(); throw new Error('Sua sessão expirou.'); }
      if (res.ok && accept === 'image/*') {
        if (!/^image\/(jpeg|png|webp)$/i.test(res.headers.get('Content-Type')?.split(';')[0] || '')) {
          throw new Error('A API retornou uma imagem inválida.');
        }
        return await res.blob();
      }
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
    const status = { SOLICITADA: 'Solicitada', EM_ANALISE: 'Em análise', AGUARDANDO_DADOS: 'Aguardando dados',
      ABERTO: 'Aberto', APROVADO: 'Indenização aprovada', NEGADO: 'Indenização negada',
      APROVADA: 'Aprovada', RECUSADA: 'Recusada', ATIVA: 'Ativa', INADIMPLENTE: 'Inadimplente',
      SUSPENSA: 'Suspensa', CANCELADA: 'Cancelada', ENCERRADA: 'Encerrada', PAGA: 'Paga', ABERTA: 'Em aberto', PENDENTE: 'Pendente' };
    const color = ['APROVADO', 'APROVADA', 'ATIVA', 'PAGA'].includes(value) ? 'green'
      : ['NEGADO', 'RECUSADA', 'CANCELADA', 'SUSPENSA', 'ENCERRADA', 'INADIMPLENTE'].includes(value) ? 'red'
      : ['ABERTO', 'ABERTA', 'PENDENTE', 'AGUARDANDO_DADOS'].includes(value) ? 'amber' : 'blue';
    return el('span', status[value] || String(value || '—').replaceAll('_', ' ').toLowerCase(), 'badge ' + color);
  }
  function listaCoberturas(coberturas) {
    if (!Array.isArray(coberturas) || !coberturas.length) {
      return coberturas === null ? 'Registro de coberturas ilegível.' : 'Nenhuma cobertura registrada.';
    }
    const lista = el('ul', null, 'coverage-list');
    coberturas.forEach(cobertura => lista.append(el('li', cobertura.descricao)));
    return lista;
  }

  async function carregarPerfil(pagina) {
    const perfil = await request('profile');
    if (!perfil.roles?.includes('funcionario')) { location.replace('../../cliente/home/index.html'); return null; }
    const permitidos = Object.keys(setores).filter(key => perfil.roles.includes(key));
    if (pagina === 'apolices' && !permitidos.includes('vendas')) {
      location.replace('../home/index.html');
      return null;
    }
    $('#employee-name').textContent = perfil.nome;
    $('#initials').textContent = perfil.nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    document.querySelectorAll('[data-setores]').forEach(nav => {
      nav.replaceChildren();
      permitidos.forEach(key => {
        const link = el('a', setores[key][0]);
        link.href = (pagina === 'home' ? '' : '../home/index.html') + '#' + key;
        nav.append(link);
        if (key === 'vendas') {
          const apolices = el('a', 'Minhas apólices');
          apolices.href = '../apolices/index.html';
          if (pagina === 'apolices') apolices.setAttribute('aria-current', 'page');
          nav.append(apolices);
        }
      });
    });
    return permitidos;
  }

  window.PainelFuncionario = { setores, tipos, request, notice, el, date, money, badge, listaCoberturas, carregarPerfil };
}());
