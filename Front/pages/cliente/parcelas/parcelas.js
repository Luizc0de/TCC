(function () {

  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icons = {"shield":"<path d=\"M12 3 3 6.5v5c0 4.5 4 8 9 10 5-2 9-5.5 9-10v-5L12 3Z\"/><path d=\"m8 12 3 3 5-6\"/>","home":"<path d=\"m3 10 9-7 9 7v11h-7v-7h-4v7H3V10Z\"/>","document":"<path d=\"M14 2H5v20h14V7l-5-5Zm0 0v5h5M8 12h8m-8 4h8\"/>","wallet":"<path d=\"M21 8H4a2 2 0 0 1 0-4h14v4M3 6v14h18V8m0 4h-6v5h6\"/>","claim":"<path d=\"m12 3 10 18H2L12 3Z\"/><path d=\"M12 9v5m0 3v.01\"/>","user":"<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 22v-3a8 8 0 0 1 16 0v3\"/>","exit":"<path d=\"M9 3H3v18h6m4-9h9m-4-4 4 4-4 4\"/>","arrow":"<path d=\"M4 12h16m-6-6 6 6-6 6\"/>","refresh":"<path d=\"M20 8a9 9 0 1 0 1 8M20 3v6h-6\"/>","car":"<path d=\"m5 8 2-5h10l2 5M4 18v3m16-3v3M3 10l1-2h16l1 2v8H3v-8ZM6 13h2m8 0h2\"/>","phone":"<rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2\"/><path d=\"M10 18h4\"/>","laptop":"<path d=\"M4 16V4h16v12M2 19h20l-2 2H4l-2-2Z\"/>","check":"<path d=\"m5 12 4 4L19 6\"/>","clock":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 6v6l4 3\"/>","image":"<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"8\" cy=\"8\" r=\"2\"/><path d=\"m3 17 5-5 4 4 4-6 5 7\"/>","menu":"<path d=\"M4 6h16M4 12h16M4 18h16\"/>"};
  const icon = name => '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || icons.shield) + '</svg>';
  const root = new URL('../../../', document.currentScript.src);
  const pageUrl = (page, query = {}) => {
    const url = new URL('pages/cliente/' + page + '/index.html', root);
    Object.entries(query).forEach(([key,value]) => { if (value != null && value !== '') url.searchParams.set(key, value); });
    return url.href;
  };
  const apiEndpoint = new URL(window.INSURANCE_CONFIG?.apiBaseUrl || 'http://localhost/TCC/Back_end/index.php');
  const loginUrl = new URL('pages/conta/entrar/index.html', root);
  const sessionKey = 'insurance.authToken';
  function session() { try { return sessionStorage.getItem(sessionKey); } catch { return null; } }
  function signOut() {
    try { sessionStorage.removeItem(sessionKey); sessionStorage.removeItem('insurance.pendingInstallment'); } catch {}
    location.replace(loginUrl.href);
  }
  if (!session()) { signOut(); return; }
  document.querySelectorAll('[data-logout]').forEach(button => button.addEventListener('click', signOut));
  async function request(route, options = {}) {
    const token = session();
    if (!token) { signOut(); throw new Error('Entre novamente para continuar.'); }
    const url = new URL(apiEndpoint);
    url.searchParams.set('url', route);
    Object.entries(options.query || {}).forEach(([key,value]) => { if (value != null && value !== '') url.searchParams.set(key, value); });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 25000);
    try {
      const headers = { Accept: options.blob ? 'image/jpeg,image/png,image/webp' : 'application/json', Authorization: 'Bearer ' + token };
      const body = options.body instanceof FormData ? options.body : options.body === undefined ? undefined : JSON.stringify(options.body);
      if (body !== undefined && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const response = await fetch(url, { method: options.method || 'GET', headers, body, signal: controller.signal, cache: 'no-store' });
      if (response.status === 401) { signOut(); throw new Error('Sua sessão expirou. Entre novamente.'); }
      if (options.blob && response.ok) {
        const blob = await response.blob();
        if (!['image/jpeg','image/png','image/webp'].includes(blob.type)) throw new Error('A imagem recebida está em um formato inválido.');
        return blob;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const safeMessage = response.status < 500 && typeof data?.error === 'string' ? data.error : 'Não foi possível concluir a solicitação. Tente novamente.';
        const error = new Error(safeMessage);
        error.status = response.status;
        throw error;
      }
      if (data === null) throw new Error('A API não retornou uma resposta válida. Confira a URL em Front/config.js.');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('O servidor demorou para responder. Tente novamente.');
      if (error instanceof TypeError) throw new Error('Não foi possível conectar à API. Verifique sua conexão e tente novamente.');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  function list(data) { if (!Array.isArray(data)) throw new Error('A API retornou uma lista em formato inválido.'); return data; }
  const numericId = value => /^\d+$/.test(String(value)) && Number(value) > 0 ? String(value) : '';
  const upper = value => String(value ?? '').toUpperCase();
  const money = value => value !== null && value !== '' && Number.isFinite(Number(value)) ? Number(value).toLocaleString('pt-BR', {style:'currency',currency:'BRL'}) : 'Não informado';
  const cents = value => money(Number(value) / 100);
  function date(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    return match ? match[3] + '/' + match[2] + '/' + match[1] : 'Não informada';
  }
  function today() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  }
  const labels = {ATIVA:'Ativa',PAGA:'Paga',ABERTA:'Em aberto',PENDENTE:'Pendente',CANCELADA:'Cancelada',ENCERRADA:'Encerrada',ABERTO:'Aberto',EM_ANALISE:'Em análise',AGUARDANDO_DADOS:'Aguardando dados',APROVADA:'Aprovada',RECUSADA:'Recusada',SOLICITADA:'Solicitada',INADIMPLENTE:'Inadimplente',SUSPENSA:'Suspensa'};
  function badge(value) {
    const status = upper(value);
    const color = ['ATIVA','PAGA','APROVADA'].includes(status) ? 'green' : ['CANCELADA','ENCERRADA','RECUSADA','INADIMPLENTE','SUSPENSA'].includes(status) ? 'red' : ['ABERTA','PENDENTE','AGUARDANDO_DADOS'].includes(status) ? 'amber' : 'blue';
    return '<span class="badge ' + color + '">' + esc(labels[status] || value || 'Não informado') + '</span>';
  }
  function kind(policy) {
    const value = upper(policy.bemTipo || policy.bem?.tipo || policy.tipo);
    return ({VEICULO:['Automóvel','car'],TELEFONE:['Celular','phone'],NOTEBOOK:['Notebook','laptop'],ELETRONICO:['Eletrônicos','laptop'],IMOVEL:['Residencial','home'],VIDA:['Vida','shield'],MAQUINARIO:['Maquinário','shield']})[value] || ['Seguro','shield'];
  }
  function state(target, title, text, retry) {
    target.innerHTML = '<div class="state"><span class="product-symbol">' + icon('shield') + '</span><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (retry ? '<button type="button" class="button button-outline">Tentar novamente</button>' : '') + '</div>';
    if (retry) target.querySelector('button').addEventListener('click', retry);
  }
  function loading(target) { state(target,'Carregando suas informações','Só um instante. Estamos consultando seus dados.'); }
  function fail(target, error, retry) { state(target,'Não foi possível carregar',error.message,retry); }
  function notice(text, type = '') {
    const target = $('#page-feedback');
    target.textContent = text;
    target.className = 'status-message ' + type;
    target.hidden = false;
  }
  const profilePromise = request('profile').then(profile => {
    const name = typeof profile.nome === 'string' ? profile.nome.trim() : 'Cliente';
    document.querySelectorAll('[data-client-name]').forEach(node => { node.textContent = name || 'Cliente'; });
    document.querySelectorAll('[data-client-firstname]').forEach(node => { node.textContent = name.split(/\s+/)[0] || 'Cliente'; });
    document.querySelectorAll('[data-client-initials]').forEach(node => { node.textContent = name.split(/\s+/).slice(0,2).map(word => word[0] || '').join('').toUpperCase() || 'C'; });
    return profile;
  }).catch(error => { notice('Seu perfil não pôde ser carregado. ' + error.message, 'error'); return null; });
  async function policies() {
    const data = list(await request('apolices/get_all'));
    if (data.some(policy => !policy.numeroApolice)) {
      const installments = list(await request('parcelas/get_all'));
      data.forEach(policy => { if (!policy.numeroApolice) policy.numeroApolice = installments.find(item => String(item.idApolice) === String(policy.id))?.numeroApolice || ''; });
    }
    return data;
  }
  function policyCard(policy) {
    const [label, symbol] = kind(policy);
    const number = policy.numeroApolice;
    return '<article class="policy-card"><div class="card-top"><span class="product-symbol">' + icon(symbol) + '</span>' + badge(policy.status) + '</div><h3>Seguro ' + esc(label) + '</h3><p class="asset-label">' + esc(policy.bemDescricao || policy.bemMarca || 'Proteção para o que é seu.') + '</p><div class="policy-number">' + esc(number || 'Apólice #' + policy.id) + '</div><div class="card-values"><div><small>Valor total</small><strong>' + esc(money(policy.valor)) + '</strong></div><div><small>Assinatura</small><strong>' + esc(date(policy.data)) + '</strong></div></div>' + (number ? '<a class="text-link" href="' + esc(pageUrl('apolices/detalhes',{numero:number})) + '">Ver minha apólice ' + icon('arrow') + '</a>' : '<small>Detalhes indisponíveis no momento.</small>') + '</article>';
  }
  function payable(item) { return ['ABERTA','PENDENTE'].includes(upper(item.status)) && !['CANCELADA','ENCERRADA'].includes(upper(item.statusApolice)); }
  function overdue(item) { return payable(item) && /^\d{4}-\d{2}-\d{2}$/.test(item.dataVencimento) && item.dataVencimento < today(); }
  let reloadPage = async () => {};
  const syncing = new Set();
  async function syncInstallment(id) {
    if (!numericId(id) || syncing.has(String(id))) return;
    syncing.add(String(id));
    try {
      const result = await request('parcelas/atualizar_pagamento/' + id, {method:'POST'});
      if (upper(result.status) === 'PAGA') {
        try { sessionStorage.removeItem('insurance.pendingInstallment'); } catch {}
        notice('Pagamento confirmado. Sua parcela está paga.', 'success');
      } else {
        if (upper(result.status) === 'CANCELADA') { try { sessionStorage.removeItem('insurance.pendingInstallment'); } catch {} }
        notice('Consulta concluída: ' + (labels[upper(result.status)] || result.status) + '. Se você acabou de pagar, aguarde a confirmação e atualize novamente.');
      }
      await reloadPage();
    } catch (error) { notice(error.message, 'error'); }
    finally { syncing.delete(String(id)); }
  }
  document.addEventListener('click', async event => {
    const sync = event.target.closest('[data-sync]');
    if (sync && !sync.disabled) {
      sync.disabled = true;
      try { await syncInstallment(sync.dataset.sync); } finally { if (sync.isConnected) sync.disabled = false; }
    }
    const button = event.target.closest('[data-pay]');
    if (!button || button.disabled) return;
    const id = numericId(button.dataset.pay);
    if (!id) return;
    button.disabled = true;
    button.textContent = 'Abrindo...';
    try {
      const result = await request('parcelas/pagar/' + id, {method:'POST'});
      if (upper(result.parcela?.status) === 'PAGA') { await reloadPage(); notice('Esta parcela já está paga.','success'); return; }
      let paymentUrl;
      try { paymentUrl = new URL(result.linkPagamento); } catch { throw new Error('O link de pagamento está indisponível. Tente novamente.'); }
      if (paymentUrl.protocol !== 'https:' || !(paymentUrl.hostname === 'stripe.com' || paymentUrl.hostname.endsWith('.stripe.com'))) throw new Error('A API não retornou um link válido de pagamento do Stripe.');
      try { sessionStorage.setItem('insurance.pendingInstallment',id); } catch {}
      location.assign(result.linkPagamento);
    } catch (error) {
      if (error.status === 409) await reloadPage();
      notice(error.message,'error');
    } finally {
      if (button.isConnected) { button.disabled = false; button.textContent = 'Pagar no Stripe'; }
    }
  });
  function checkReturn() {
    if (!session()) return signOut();
    let pending;
    try { pending = sessionStorage.getItem('insurance.pendingInstallment'); } catch {}
    if (pending && numericId(pending)) syncInstallment(pending);
  }
  window.addEventListener('pageshow', checkReturn);
  window.addEventListener('focus', checkReturn);

  const target = $('#installments-list');
  let items = [];
  let firstLoad = true;
  const requestedPolicy = numericId(new URLSearchParams(location.search).get('idApolice'));
  function render() {
    const status = $('#installment-status').value;
    const policyId = $('#installment-policy').value;
    const filtered = items.filter(item => (!policyId || String(item.idApolice) === policyId) && (status === 'pending' ? ['ABERTA','PENDENTE'].includes(upper(item.status)) : !status || upper(item.status) === status));
    if (!filtered.length) { state(target,items.length ? 'Nenhuma parcela nesta seleção' : 'Nenhuma parcela por aqui',items.length ? 'Altere os filtros para consultar os outros pagamentos.' : 'Quando houver parcelas vinculadas à sua conta, elas aparecerão aqui.'); return; }
    target.innerHTML = '<section class="panel table-panel"><div class="table-scroll"><table><caption class="skip-table-caption">Suas parcelas e opções de pagamento</caption><thead><tr><th>Apólice / parcela</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ações</th></tr></thead><tbody>' + filtered.map(item => {
      const id = numericId(item.idParcela);
      const canPay = payable(item) && id;
      return '<tr><td><strong>' + esc(item.numeroApolice || 'Apólice #' + item.idApolice) + '</strong><small>Parcela ' + esc(item.numeroParcela) + '</small></td><td>' + date(item.dataVencimento) + (overdue(item) ? '<small class="late-label">Em atraso</small>' : '') + '</td><td><strong>' + esc(cents(item.valorCentavos)) + '</strong></td><td>' + badge(item.status) + '</td><td><div class="actions">' + (canPay ? '<button class="button button-primary button-small" type="button" data-pay="' + id + '">Pagar no Stripe</button><button class="button button-outline button-small" type="button" data-sync="' + id + '">Atualizar pagamento</button>' : '<span class="policy-number">' + (upper(item.status) === 'PAGA' ? 'Pagamento confirmado' : 'Pagamento indisponível') + '</span>') + '</div></td></tr>';
    }).join('') + '</tbody></table></div></section>';
  }
  async function load() {
    loading(target);
    try {
      items = list(await request('parcelas/get_all')).sort((a,b) => String(a.dataVencimento || '').localeCompare(String(b.dataVencimento || '')));
      const pending = items.filter(payable);
      $('#balance').textContent = cents(pending.reduce((sum,item) => sum + Number(item.valorCentavos || 0),0));
      $('#due-count').textContent = String(pending.length);
      $('#overdue-count').textContent = String(items.filter(overdue).length);
      $('#paid-amount').textContent = cents(items.filter(item => upper(item.status) === 'PAGA').reduce((sum,item) => sum + Number(item.valorCentavos || 0),0));
      const select = $('#installment-policy');
      const selected = firstLoad ? requestedPolicy : select.value;
      firstLoad = false;
      const policyMap = new Map(items.filter(item => numericId(item.idApolice)).map(item => [String(item.idApolice),item.numeroApolice || 'Apólice #' + item.idApolice]));
      select.replaceChildren(new Option('Todas as apólices',''));
      policyMap.forEach((label,id) => select.add(new Option(label,id)));
      select.value = policyMap.has(selected) ? selected : '';
      render();
    } catch(error) { fail(target,error,load); }
  }
  $('#installment-status').addEventListener('change',render);
  $('#installment-policy').addEventListener('change',render);
  $('#refresh-page').addEventListener('click',load);
  reloadPage = load;
  load();

}());
