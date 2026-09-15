// ============================================
// INSURANCE - SCRIPT.JS (INTEGRADO COM BACK PHP)
// ============================================

var API_URL = '/TCC/Back_end';
var STRIPE_PK = 'pk_test_51UE6CAEZGG4JlGFzxprQb00jMktYAeQ2iHa0QcdDm42dBJg3OjjNcOOoPlZcll5FiCSAGNYnPDt6qy5rD0PtsZgw00Ym32s6TE';

// ============================================
// LOADING SCREEN
// ============================================
setTimeout(function() {
    var loading = document.getElementById('loading-screen');
    if (loading) loading.style.display = 'none';
}, 500);

// ============================================
// MENU MOBILE
// ============================================
var menuToggle = document.getElementById('menuToggle');
var mobileMenu = document.getElementById('mobileMenu');
var mobileMenuClose = document.getElementById('mobileMenuClose');

function abrirMenuMobile() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (menuToggle) menuToggle.querySelector('i').className = 'fa-solid fa-xmark';
}
function fecharMenuMobile() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
    if (menuToggle) menuToggle.querySelector('i').className = 'fa-solid fa-bars';
}

if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() {
        if (mobileMenu.classList.contains('active')) fecharMenuMobile();
        else abrirMenuMobile();
    });
    mobileMenu.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', fecharMenuMobile);
    });
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', fecharMenuMobile);
}

// ============================================
// HEADER SCROLL
// ============================================
window.addEventListener('scroll', function() {
    var header = document.getElementById('header');
    if (header) {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    }
});

// ============================================
// BACK TO TOP
// ============================================
var backToTop = document.getElementById('backToTop');
if (backToTop) {
    window.addEventListener('scroll', function() {
        if (window.scrollY > 600) backToTop.classList.add('show');
        else backToTop.classList.remove('show');
    });
    backToTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// HELPERS DE API
// ============================================
function apiFetch(endpoint, options) {
    options = options || {};
    options.credentials = 'include';
    options.headers = options.headers || {};
    if (!options.headers['Content-Type'] && options.body) {
        options.headers['Content-Type'] = 'application/json';
    }
    return fetch(API_URL + endpoint, options).then(function(r) {
        return r.json().catch(function() {
            return { ok: false, erro: 'Resposta inválida do servidor.' };
        });
    });
}

// ============================================
// MASCARAR CPF
// ============================================
function mascararCpf(cpf) {
    if (!cpf) return '—';
    var nums = String(cpf).replace(/\D/g, '');
    if (nums.length < 3) return '—';
    return nums.substring(0, 3) + '.***.***-**';
}

// ============================================
// MOSTRAR / OCULTAR SENHA
// ============================================
function toggleSenha(id, el) {
    var input = document.getElementById(id);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        el.classList.remove('fa-eye');
        el.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        el.classList.remove('fa-eye-slash');
        el.classList.add('fa-eye');
    }
}

// ============================================
// VERIFICAÇÃO DE LOGIN
// ============================================
function verificarLogin() {
    var headerButtons = document.getElementById('headerButtons');
    var btnCriarConta = document.getElementById('btnCriarConta');
    if (!headerButtons) return;

    apiFetch('/api/sessao', { method: 'GET' })
        .then(function(data) {
            if (!data.ok || !data.usuario) {
                if (btnCriarConta) btnCriarConta.style.display = '';
                return;
            }

            var u = data.usuario;
            var nome = u.nome || u.name || 'Usuário';
            var primeiroNome = nome.trim().split(' ')[0];
            var avatar = u.foto || 'images/default-avatar.png';

            if (btnCriarConta) btnCriarConta.style.display = 'none';

            headerButtons.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-btn" onclick="toggleUserMenu(event)">
                        <img src="${avatar}" class="user-avatar" alt="Avatar">
                        Olá, ${primeiroNome} <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <a href="perfil.html"><i class="fa-solid fa-user"></i> Ver Perfil</a>
                        <a href="apolices.html"><i class="fa-solid fa-file-contract"></i> Minhas Apólices</a>
                        <a href="mudar-email.html"><i class="fa-solid fa-envelope"></i> Mudar Email</a>
                        <a href="mudar-senha.html"><i class="fa-solid fa-lock"></i> Mudar Senha</a>
                        <a href="mudar-foto.html"><i class="fa-solid fa-camera"></i> Mudar Foto</a>
                        <div class="divider"></div>
                        <a href="#" class="danger" onclick="deletarConta(event)"><i class="fa-solid fa-trash"></i> Deletar Conta</a>
                        <a href="#" onclick="logout(event)"><i class="fa-solid fa-sign-out"></i> Sair</a>
                    </div>
                </div>
            `;
        })
        .catch(function() {});
}

function toggleUserMenu(event) {
    event.stopPropagation();
    var dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

document.addEventListener('click', function() {
    var dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.remove('active');
});

function logout(event) {
    event.preventDefault();
    if (!confirm('Tem certeza que deseja sair da sua conta?')) return;

    apiFetch('/api/logout', { method: 'POST' })
        .then(function() { window.location.href = 'index.html'; })
        .catch(function() { window.location.href = 'index.html'; });
}

verificarLogin();

// ============================================
// PROTEÇÃO DE PÁGINAS
// ============================================
var PAGINAS_PROTEGIDAS = ['perfil.html', 'mudar-email.html', 'mudar-senha.html', 'mudar-foto.html', 'pagamento.html', 'apolices.html'];

function protegerPagina() {
    var nomePagina = window.location.pathname.split('/').pop();
    if (PAGINAS_PROTEGIDAS.indexOf(nomePagina) === -1) return;

    apiFetch('/api/sessao', { method: 'GET' })
        .then(function(data) {
            if (!data.ok) {
                sessionStorage.setItem('redirectAfterLogin', nomePagina);
                window.location.href = 'login.html';
            }
        })
        .catch(function() { window.location.href = 'login.html'; });
}

protegerPagina();

// ============================================
// REDIRECIONAR SE JÁ LOGADO
// ============================================
function redirecionarSeLogado() {
    var nomePagina = window.location.pathname.split('/').pop();
    var paginasAuth = ['login.html', 'cadastro.html'];
    if (paginasAuth.indexOf(nomePagina) === -1) return;

    apiFetch('/api/sessao', { method: 'GET' })
        .then(function(data) {
            if (data.ok) window.location.href = 'index.html';
        })
        .catch(function() {});
}

redirecionarSeLogado();

// ============================================
// VALIDAÇÕES (CPF)
// ============================================
function validarCpf(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    var soma = 0, resto, i;
    for (i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    soma = 0;
    for (i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[10])) return false;

    return true;
}

var cpfInput = document.getElementById('cpf');
if (cpfInput) {
    cpfInput.addEventListener('input', function() {
        var v = cpfInput.value.replace(/\D/g, '');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        cpfInput.value = v;
    });
}

// ============================================
// MEDIDOR DE FORÇA DE SENHA
// ============================================
function forcaSenha(senha) {
    if (!senha) return { nivel: 0, label: '' };
    var pontos = 0;
    if (senha.length >= 6) pontos++;
    if (senha.length >= 10) pontos++;
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
    if (/\d/.test(senha)) pontos++;
    if (/[^A-Za-z0-9]/.test(senha)) pontos++;

    if (pontos <= 2) return { nivel: 1, label: 'Fraca' };
    if (pontos <= 4) return { nivel: 2, label: 'Média' };
    return { nivel: 3, label: 'Forte' };
}

function criarMedidorSenha(input) {
    if (!input) return;
    var meter = document.createElement('div');
    meter.className = 'senha-meter nivel-0';
    meter.innerHTML =
        '<div class="senha-meter-bars">' +
        '<span class="bar"></span><span class="bar"></span><span class="bar"></span>' +
        '</div>' +
        '<span class="senha-meter-label"></span>';
    input.parentNode.insertBefore(meter, input.nextSibling);

    function atualizar() {
        var r = forcaSenha(input.value);
        var bars = meter.querySelectorAll('.bar');
        var label = meter.querySelector('.senha-meter-label');
        bars.forEach(function(b, i) {
            b.classList.toggle('active', i < r.nivel);
        });
        meter.className = 'senha-meter nivel-' + r.nivel;
        label.textContent = r.label;
    }
    input.addEventListener('input', atualizar);
    atualizar();
}

// ============================================
// LOGIN
// ============================================
var loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var email = document.getElementById('email').value.trim().toLowerCase();
        var senha = document.getElementById('password').value;
        var errorMsg = document.getElementById('errorMessage');
        var successMsg = document.getElementById('successMessage');

        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        if (!email || !senha) {
            errorMsg.textContent = 'Preencha todos os campos!';
            errorMsg.style.display = 'block';
            return;
        }

        apiFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email: email, senha: senha })
        })
        .then(function(data) {
            if (!data.ok) {
                errorMsg.textContent = data.erro || 'E-mail ou senha incorretos!';
                errorMsg.style.display = 'block';
                return;
            }

            successMsg.textContent = 'Login realizado com sucesso! Redirecionando...';
            successMsg.style.display = 'block';

            setTimeout(function() {
                var destino = sessionStorage.getItem('redirectAfterLogin');
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = destino || 'index.html';
            }, 1200);
        })
        .catch(function() {
            errorMsg.textContent = 'Erro ao conectar com o servidor!';
            errorMsg.style.display = 'block';
        });
    });
}

// ============================================
// CADASTRO
// ============================================
var cadastroForm = document.getElementById('cadastroForm');

if (cadastroForm) {
    criarMedidorSenha(document.getElementById('password'));

    cadastroForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var nome = document.getElementById('nome').value.trim();
        var email = document.getElementById('email').value.trim().toLowerCase();
        var cpf = document.getElementById('cpf').value.trim();
        var senha = document.getElementById('password').value;
        var confirmSenha = document.getElementById('confirmPassword').value;
        var errorMsg = document.getElementById('errorMessage');
        var successMsg = document.getElementById('successMessage');

        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        if (!nome || !email || !cpf || !senha || !confirmSenha) {
            errorMsg.textContent = 'Preencha todos os campos!';
            errorMsg.style.display = 'block';
            return;
        }

        if (!validarCpf(cpf)) {
            errorMsg.textContent = 'CPF inválido! Verifique os números digitados.';
            errorMsg.style.display = 'block';
            return;
        }

        if (senha.length < 6) {
            errorMsg.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            errorMsg.style.display = 'block';
            return;
        }

        if (senha !== confirmSenha) {
            errorMsg.textContent = 'As senhas não conferem!';
            errorMsg.style.display = 'block';
            return;
        }

        apiFetch('/api/cadastro', {
            method: 'POST',
            body: JSON.stringify({
                nome: nome,
                email: email,
                cpf: cpf.replace(/\D/g, ''),
                senha: senha
            })
        })
        .then(function(data) {
            if (!data.ok) {
                errorMsg.textContent = data.erro || 'Erro ao cadastrar!';
                errorMsg.style.display = 'block';
                return;
            }

            successMsg.textContent = 'Conta criada com sucesso! Redirecionando...';
            successMsg.style.display = 'block';

            setTimeout(function() { window.location.href = 'index.html'; }, 1500);
        })
        .catch(function() {
            errorMsg.textContent = 'Erro ao conectar com o servidor!';
            errorMsg.style.display = 'block';
        });
    });
}

// ============================================
// PERFIL
// ============================================
var infoNome = document.getElementById('infoNome');

if (infoNome) {
    apiFetch('/api/sessao', { method: 'GET' })
        .then(function(data) {
            if (!data.ok || !data.usuario) {
                window.location.href = 'login.html';
                return;
            }
            var u = data.usuario;
            var nome = u.nome || u.name || '';

            var avatarImg = document.getElementById('avatarImg');
            var nomeCompleto = document.getElementById('nomeCompleto');
            var emailUsuario = document.getElementById('emailUsuario');
            var infoEmail = document.getElementById('infoEmail');
            var infoCpf = document.getElementById('infoCpf');

            if (avatarImg) avatarImg.src = u.foto || 'images/default-avatar.png';
            if (nomeCompleto) nomeCompleto.textContent = nome;
            if (emailUsuario) emailUsuario.textContent = u.email;
            if (infoNome) infoNome.textContent = nome;
            if (infoEmail) infoEmail.textContent = u.email;
            if (infoCpf) infoCpf.textContent = mascararCpf(u.cpf);
        })
        .catch(function() { window.location.href = 'login.html'; });
}

// ============================================
// DELETAR CONTA
// ============================================
function deletarConta(event) {
    event.preventDefault();
    if (!confirm('Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.')) return;

    apiFetch('/api/deletar-conta', { method: 'POST' })
        .then(function() { window.location.href = 'index.html'; })
        .catch(function() { window.location.href = 'index.html'; });
}

// ============================================
// SIMULADOR DE SEGUROS
// ============================================
var tipoSeguro = document.getElementById('tipoSeguro');
var coberturas = document.querySelectorAll('.cobertura');
var valorTotal = document.getElementById('valorTotal');
var mensagem = document.getElementById('mensagem');
var btnContratar = document.getElementById('btnContratar');

if (tipoSeguro && btnContratar) {
    var valoresBase = {
        vida: 39.90, prestamista: 24.90, acidentes: 19.90, doencas: 49.90,
        invalidez: 29.90, funeral: 14.90, automovel: 89.90, residencial: 49.90,
        celular: 24.90, garantia: 14.90, maquinarios: 119.90, eletronicos: 34.90
    };

    function calcularValor() {
        var tipo = tipoSeguro.value;
        if (tipo === '0') {
            valorTotal.innerHTML = 'R$ 0,00<span>/mês</span>';
            return;
        }
        var valor = valoresBase[tipo] || 0;
        coberturas.forEach(function(checkbox) {
            if (checkbox.checked) valor += parseFloat(checkbox.value);
        });
        valorTotal.innerHTML = 'R$ ' + valor.toFixed(2).replace('.', ',') + '<span>/mês</span>';
    }

    tipoSeguro.addEventListener('change', calcularValor);
    coberturas.forEach(function(checkbox) {
        checkbox.addEventListener('change', calcularValor);
    });

    function getQueryParam(nome) {
        return new URLSearchParams(window.location.search).get(nome);
    }

    var tipoInicial = getQueryParam('tipo');
    if (tipoInicial && valoresBase[tipoInicial]) {
        tipoSeguro.value = tipoInicial;
        calcularValor();
    }

    function salvarPlano() {
        var tipo = tipoSeguro.value;
        var coberturasSelecionadas = [];
        var valorFinal = 0;

        if (tipo !== '0') valorFinal = valoresBase[tipo] || 0;

        coberturas.forEach(function(checkbox) {
            if (checkbox.checked) {
                coberturasSelecionadas.push(checkbox.parentElement.querySelector('span').textContent);
                valorFinal += parseFloat(checkbox.value);
            }
        });

        sessionStorage.setItem('planoSimulado', JSON.stringify({
            tipo: tipo,
            valor: valorFinal.toFixed(2),
            coberturas: coberturasSelecionadas
        }));
    }

    btnContratar.addEventListener('click', function() {
        var tipo = tipoSeguro.value;

        if (tipo === '0') {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'Selecione um tipo de seguro!';
            mensagem.style.display = 'block';
            return;
        }

        salvarPlano();

        apiFetch('/api/sessao', { method: 'GET' })
            .then(function(data) {
                if (!data.ok) {
                    mensagem.className = 'mensagem erro';
                    mensagem.textContent = 'Faça login ou cadastre-se para contratar!';
                    mensagem.style.display = 'block';
                    setTimeout(function() { window.location.href = 'cadastro.html'; }, 2000);
                    return;
                }
                window.location.href = 'pagamento.html';
            })
            .catch(function() {
                mensagem.className = 'mensagem erro';
                mensagem.textContent = 'Erro ao conectar com o servidor!';
                mensagem.style.display = 'block';
            });
    });
}

// ============================================
// PAGAMENTO
// ============================================
(function() {
    var btnPagar = document.getElementById('btnPagar');
    if (!btnPagar) return;

    var plano = {};
    try {
        plano = JSON.parse(sessionStorage.getItem('planoSimulado') || '{}');
    } catch (e) {}

    if (plano.tipo) {
        var resumoSeguro = document.getElementById('resumoSeguro');
        var resumoValor = document.getElementById('resumoValor');
        if (resumoSeguro) resumoSeguro.textContent = plano.tipo;
        if (resumoValor) resumoValor.textContent = 'R$ ' + plano.valor;
    }

    var formaSelecionada = 'pix';
    var areaCartao = document.getElementById('areaCartao');
    var areaBoleto = document.getElementById('areaBoleto');

    window.selecionarForma = function(forma, el) {
        formaSelecionada = forma;
        var cards = document.querySelectorAll('.forma-card');
        cards.forEach(function(c) {
            c.classList.remove('active');
            c.style.background = '#f8fafc';
            c.style.borderColor = '#e2e8f0';
        });
        el.classList.add('active');
        el.style.background = '#eff6ff';
        el.style.borderColor = '#1d4ed8';

        if (areaCartao) areaCartao.style.display = 'none';
        if (areaBoleto) areaBoleto.style.display = 'none';
        var areaPix = document.getElementById('areaPix');
        if (areaPix) areaPix.style.display = 'none';

        if (forma === 'cartao' && areaCartao) areaCartao.style.display = 'block';
        if (forma === 'boleto' && areaBoleto) {
            areaBoleto.style.display = 'block';
            gerarBoletoVisual();
        }
        if (forma === 'pix') gerarPixVisual();
    };

    var formaCards = document.querySelectorAll('.forma-card');
    formaCards.forEach(function(card) {
        card.addEventListener('click', function() {
            window.selecionarForma(this.getAttribute('data-forma'), this);
        });
    });

    function gerarPixVisual() {
        var areaPix = document.getElementById('areaPix');

        if (!areaPix) {
            var main = document.querySelector('main > div');
            areaPix = document.createElement('div');
            areaPix.id = 'areaPix';
            areaPix.style.cssText = 'margin-bottom:20px;';
            if (areaCartao && areaCartao.parentNode) {
                areaCartao.parentNode.insertBefore(areaPix, areaCartao);
            } else if (main) {
                main.appendChild(areaPix);
            }
        }

        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var codigo = '00020126';
        for (var i = 0; i < 80; i++) {
            codigo += chars[Math.floor(Math.random() * chars.length)];
        }

        var qrSvg = '<svg viewBox="0 0 200 200" style="width:200px; height:200px; margin:0 auto; display:block;">';
        qrSvg += '<rect width="200" height="200" fill="white"/>';
        qrSvg += '<rect x="10" y="10" width="50" height="50" fill="#06143a"/>';
        qrSvg += '<rect x="20" y="20" width="30" height="30" fill="white"/>';
        qrSvg += '<rect x="25" y="25" width="20" height="20" fill="#06143a"/>';
        qrSvg += '<rect x="140" y="10" width="50" height="50" fill="#06143a"/>';
        qrSvg += '<rect x="150" y="20" width="30" height="30" fill="white"/>';
        qrSvg += '<rect x="155" y="25" width="20" height="20" fill="#06143a"/>';
        qrSvg += '<rect x="10" y="140" width="50" height="50" fill="#06143a"/>';
        qrSvg += '<rect x="20" y="150" width="30" height="30" fill="white"/>';
        qrSvg += '<rect x="25" y="155" width="20" height="20" fill="#06143a"/>';
        for (var j = 0; j < 80; j++) {
            var x = 70 + Math.floor(Math.random() * 12) * 10;
            var y = 70 + Math.floor(Math.random() * 12) * 10;
            if (Math.random() > 0.5) {
                qrSvg += '<rect x="' + x + '" y="' + y + '" width="10" height="10" fill="#06143a"/>';
            }
        }
        for (var k = 0; k < 60; k++) {
            var x2 = Math.floor(Math.random() * 18) * 10 + 10;
            var y2 = Math.floor(Math.random() * 4) * 10 + 70;
            if (Math.random() > 0.5) {
                qrSvg += '<rect x="' + x2 + '" y="' + y2 + '" width="10" height="10" fill="#06143a"/>';
            }
        }
        qrSvg += '</svg>';

        areaPix.innerHTML = `
            <label style="display:block; font-weight:700; color:#06143a; margin-bottom:8px;">QR Code PIX</label>
            <div style="background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center;">
                ${qrSvg}
                <p style="color:#64748b; font-size:0.85rem; margin:15px 0 8px;">Ou copie o código abaixo:</p>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="text" readonly value="${codigo}" id="pixCodigo"
                           style="flex:1; padding:10px 12px; border:2px solid #e2e8f0; border-radius:8px; font-family:monospace; font-size:0.7rem; background:white;">
                    <button type="button" onclick="copiarPix()"
                            style="padding:10px 14px; border-radius:8px; background:#1d4ed8; color:white; border:none; cursor:pointer; font-weight:700;">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                </div>
                <p style="color:#64748b; font-size:0.8rem; margin-top:12px;">
                    <i class="fa-solid fa-circle-info"></i> Escaneie o QR Code ou copie o código no app do seu banco.
                </p>
                <button type="button" onclick="confirmarPix()"
                        style="margin-top:15px; width:100%; padding:12px; border-radius:10px; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; cursor:pointer; font-weight:700;">
                    <i class="fa-solid fa-check"></i> Já paguei
                </button>
            </div>
        `;
        areaPix.style.display = 'block';
    }

    window.copiarPix = function() {
        var input = document.getElementById('pixCodigo');
        if (!input) return;
        input.select();
        navigator.clipboard.writeText(input.value).then(function() {
            var mensagemEl = document.getElementById('mensagem');
            mensagemEl.className = 'mensagem sucesso';
            mensagemEl.textContent = 'Código PIX copiado!';
            mensagemEl.style.display = 'block';
            setTimeout(function() { mensagemEl.style.display = 'none'; }, 2000);
        });
    };

    window.confirmarPix = function() {
        var mensagemEl = document.getElementById('mensagem');

        apiFetch('/api/pagamento', {
            method: 'POST',
            body: JSON.stringify({
                tipo: plano.tipo,
                valor: parseFloat(plano.valor),
                metodo: 'pix',
                coberturas: plano.coberturas
            })
        })
        .then(function(data) {
            if (!data.ok) {
                mensagemEl.className = 'mensagem erro';
                mensagemEl.textContent = data.erro || 'Erro ao confirmar PIX.';
                mensagemEl.style.display = 'block';
                return;
            }
            mensagemEl.className = 'mensagem sucesso';
            mensagemEl.textContent = 'PIX confirmado! Verifique seu e-mail. Redirecionando...';
            mensagemEl.style.display = 'block';
            sessionStorage.removeItem('planoSimulado');
            setTimeout(function() { window.location.href = 'apolices.html'; }, 3000);
        })
        .catch(function() {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Erro ao conectar com o servidor!';
            mensagemEl.style.display = 'block';
        });
    };

    function gerarBoletoVisual() {
        var linhaInput = document.getElementById('boletoLinha');
        var svgBarras = document.getElementById('boletoCodigoBarras');
        var vencEl = document.getElementById('boletoVencimento');
        var valorEl = document.getElementById('boletoValor');
        if (!linhaInput) return;

        var n = function(len) {
            var s = '';
            for (var i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
            return s;
        };
        var linha = n(5)+'.'+n(5)+' '+n(5)+'.'+n(6)+' '+n(5)+'.'+n(6)+' '+n(1)+' '+n(14);
        linhaInput.value = linha;

        var venc = new Date();
        venc.setDate(venc.getDate() + 3);
        vencEl.textContent = venc.toLocaleDateString('pt-BR');
        valorEl.textContent = 'R$ ' + (plano.valor || '0,00');

        if (svgBarras) {
            var barras = '';
            var x = 0;
            while (x < 1000) {
                var largura = Math.random() > 0.5 ? 2 : 4;
                barras += '<rect x="' + x + '" y="0" width="' + largura + '" height="70" fill="#06143a"/>';
                x += largura + (Math.random() > 0.5 ? 2 : 4);
            }
            svgBarras.setAttribute('viewBox', '0 0 ' + x + ' 70');
            svgBarras.setAttribute('preserveAspectRatio', 'none');
            svgBarras.innerHTML = barras;
        }
    }

    window.copiarLinhaBoleto = function() {
        var linhaInput = document.getElementById('boletoLinha');
        if (!linhaInput) return;
        linhaInput.select();
        navigator.clipboard.writeText(linhaInput.value).then(function() {
            var mensagemEl = document.getElementById('mensagem');
            mensagemEl.className = 'mensagem sucesso';
            mensagemEl.textContent = 'Linha digitável copiada!';
            mensagemEl.style.display = 'block';
            setTimeout(function() { mensagemEl.style.display = 'none'; }, 2000);
        });
    };

    var stripe = null;
    var cardElement = null;

    if (typeof Stripe !== 'undefined' && typeof STRIPE_PK !== 'undefined' && STRIPE_PK.indexOf('SUA_CHAVE') === -1) {
        stripe = Stripe(STRIPE_PK);
        var elements = stripe.elements();
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#06143a',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    '::placeholder': { color: '#94a3b8' }
                }
            }
        });
        var cardEl = document.getElementById('card-element');
        if (cardEl) {
            cardElement.mount('#card-element');
            cardElement.on('change', function(event) {
                var displayError = document.getElementById('card-errors');
                if (displayError) displayError.textContent = event.error ? event.error.message : '';
            });
        }
    }

    function pagarComCartao(valor, tipoSeguro) {
        var mensagemEl = document.getElementById('mensagem');

        if (!stripe || !cardElement) {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Stripe não inicializado.';
            mensagemEl.style.display = 'block';
            return;
        }

        apiFetch('/api/pagamento/stripe', {
            method: 'POST',
            body: JSON.stringify({ valor: valor, tipo: tipoSeguro })
        })
        .then(function(resp) {
            if (!resp.ok) {
                mensagemEl.className = 'mensagem erro';
                mensagemEl.textContent = resp.erro || 'Erro ao iniciar pagamento.';
                mensagemEl.style.display = 'block';
                return;
            }

            stripe.confirmCardPayment(resp.client_secret, {
                payment_method: { card: cardElement }
            }).then(function(result) {
                if (result.error) {
                    mensagemEl.className = 'mensagem erro';
                    mensagemEl.textContent = result.error.message;
                    mensagemEl.style.display = 'block';
                    return;
                }

                if (result.paymentIntent.status === 'succeeded') {
                    apiFetch('/api/pagamento', {
                        method: 'POST',
                        body: JSON.stringify({
                            tipo: tipoSeguro,
                            valor: valor,
                            metodo: 'cartao',
                            coberturas: plano.coberturas || []
                        })
                    })
                    .then(function() {
                        mensagemEl.className = 'mensagem sucesso';
                        mensagemEl.textContent = 'Pagamento aprovado! Verifique seu e-mail.';
                        mensagemEl.style.display = 'block';
                        sessionStorage.removeItem('planoSimulado');
                        setTimeout(function() { window.location.href = 'apolices.html'; }, 3000);
                    })
                    .catch(function() {
                        mensagemEl.className = 'mensagem sucesso';
                        mensagemEl.textContent = 'Pagamento aprovado!';
                        mensagemEl.style.display = 'block';
                        setTimeout(function() { window.location.href = 'apolices.html'; }, 3000);
                    });
                }
            });
        })
        .catch(function() {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Erro ao conectar com o servidor!';
            mensagemEl.style.display = 'block';
        });
    }

    btnPagar.addEventListener('click', function() {
        var mensagemEl = document.getElementById('mensagem');

        if (!plano.tipo) {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Nenhum plano selecionado!';
            mensagemEl.style.display = 'block';
            return;
        }

        if (formaSelecionada === 'cartao') {
            pagarComCartao(parseFloat(plano.valor), plano.tipo);
            return;
        }

        if (formaSelecionada === 'boleto') {
            apiFetch('/api/pagamento', {
                method: 'POST',
                body: JSON.stringify({
                    tipo: plano.tipo,
                    valor: parseFloat(plano.valor),
                    metodo: 'boleto',
                    coberturas: plano.coberturas
                })
            })
            .then(function(data) {
                if (!data.ok) {
                    mensagemEl.className = 'mensagem erro';
                    mensagemEl.textContent = data.erro || 'Erro ao gerar boleto.';
                    mensagemEl.style.display = 'block';
                    return;
                }
                mensagemEl.className = 'mensagem sucesso';
                mensagemEl.textContent = 'Boleto enviado para o seu e-mail!';
                mensagemEl.style.display = 'block';
                sessionStorage.removeItem('planoSimulado');
                setTimeout(function() { window.location.href = 'apolices.html'; }, 4000);
            })
            .catch(function() {
                mensagemEl.className = 'mensagem erro';
                mensagemEl.textContent = 'Erro ao conectar com o servidor!';
                mensagemEl.style.display = 'block';
            });
            return;
        }

        gerarPixVisual();
    });

    gerarPixVisual();
})();

// ============================================
// PÁGINA DE APÓLICES
// ============================================
(function() {
    var lista = document.getElementById('listaApolices');
    if (!lista) return;

    apiFetch('/api/pagamentos', { method: 'GET' })
        .then(function(data) {
            if (!data.ok) {
                window.location.href = 'login.html';
                return;
            }

            var apolices = data.pagamentos || [];

            if (apolices.length === 0) {
                lista.innerHTML = `
                    <div style="background:white; border-radius:20px; padding:50px 30px; text-align:center; box-shadow:0 15px 40px rgba(0,0,0,0.15);">
                        <i class="fa-solid fa-file-circle-xmark" style="font-size:3rem; color:#cbd5e1; margin-bottom:20px;"></i>
                        <h3 style="color:#06143a; font-size:1.3rem; margin-bottom:10px;">Nenhuma apólice encontrada</h3>
                        <p style="color:#64748b; margin-bottom:25px;">Você ainda não contratou nenhum seguro.</p>
                        <a href="simulador1.html" class="btn btn-primary">
                            <i class="fa-solid fa-calculator"></i> Fazer simulação
                        </a>
                    </div>
                `;
                return;
            }

            var nomesTipo = {
                vida: 'Seguro de Vida',
                prestamista: 'Seguro Prestamista',
                acidentes: 'Acidentes Pessoais',
                doencas: 'Doenças Graves',
                invalidez: 'Seguro Invalidez',
                funeral: 'Seguro Funeral',
                automovel: 'Seguro Automóvel',
                residencial: 'Seguro Residencial',
                celular: 'Seguro Celular',
                garantia: 'Garantia Estendida',
                maquinarios: 'Seguro Maquinários',
                eletronicos: 'Seguro Eletrônicos'
            };

            var icones = {
                vida: 'fa-heart',
                prestamista: 'fa-hand-holding-dollar',
                acidentes: 'fa-user-shield',
                doencas: 'fa-heart-pulse',
                invalidez: 'fa-wheelchair',
                funeral: 'fa-dove',
                automovel: 'fa-car',
                residencial: 'fa-house-chimney',
                celular: 'fa-mobile-screen-button',
                garantia: 'fa-shield-halved',
                maquinarios: 'fa-gear',
                eletronicos: 'fa-laptop'
            };

            lista.innerHTML = '';

            apolices.forEach(function(a) {
                var tipo = a.tipo_apolice || 'seguro';
                var nome = nomesTipo[tipo] || tipo;
                var icone = icones[tipo] || 'fa-shield-halved';
                var valor = parseFloat(a.valor_parcela || 0).toFixed(2).replace('.', ',');
                var dataAssinatura = a.data_assinatura ? new Date(a.data_assinatura).toLocaleDateString('pt-BR') : '—';
                var dataVenc = a.data_vencimento ? new Date(a.data_vencimento).toLocaleDateString('pt-BR') : '—';

                var status = (a.status_pagamento || '').toLowerCase();
                var statusCor = '#f59e0b';
                var statusTexto = 'Pendente';
                if (status === 'paga') { statusCor = '#10b981'; statusTexto = 'Paga'; }
                if (status === 'atrasada') { statusCor = '#ef4444'; statusTexto = 'Atrasada'; }
                if (status === 'cancelada') { statusCor = '#64748b'; statusTexto = 'Cancelada'; }

                var statusApolice = (a.status_apolice || '').toLowerCase();
                var apoliceCor = '#10b981';
                if (statusApolice === 'cancelada') apoliceCor = '#64748b';
                if (statusApolice === 'inadimplente') apoliceCor = '#ef4444';

                var card = document.createElement('div');
                card.style.cssText = 'background:white; border-radius:20px; padding:25px; box-shadow:0 15px 40px rgba(0,0,0,0.15); display:flex; align-items:center; gap:20px; transition:transform 0.3s;';
                card.onmouseover = function() { this.style.transform = 'translateY(-4px)'; };
                card.onmouseout = function() { this.style.transform = 'translateY(0)'; };

                card.innerHTML = `
                    <div style="width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg,#1d4ed8,#3b82f6); display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; flex-shrink:0;">
                        <i class="fa-solid ${icone}"></i>
                    </div>
                    <div style="flex:1;">
                        <h3 style="color:#06143a; font-size:1.1rem; margin-bottom:5px;">${nome}</h3>
                        <div style="display:flex; flex-wrap:wrap; gap:15px; font-size:0.85rem; color:#64748b; margin-top:8px;">
                            <span><strong style="color:#06143a;">Valor:</strong> R$ ${valor}</span>
                            <span><strong style="color:#06143a;">Assinatura:</strong> ${dataAssinatura}</span>
                            <span><strong style="color:#06143a;">Vencimento:</strong> ${dataVenc}</span>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <span style="display:inline-block; padding:6px 14px; border-radius:50px; background:${statusCor}20; color:${statusCor}; font-weight:700; font-size:0.8rem;">
                            ${statusTexto}
                        </span>
                        <div style="margin-top:8px; font-size:0.75rem; color:${apoliceCor}; font-weight:700; text-transform:uppercase;">
                            ${statusApolice}
                        </div>
                    </div>
                `;

                lista.appendChild(card);
            });
        })
        .catch(function() {
            lista.innerHTML = `
                <div style="background:white; border-radius:20px; padding:40px; text-align:center;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem; color:#ef4444; margin-bottom:15px;"></i>
                    <p style="color:#06143a; font-weight:700;">Erro ao carregar apólices.</p>
                    <p style="color:#64748b; font-size:0.9rem;">Tente novamente mais tarde.</p>
                </div>
            `;
        });
})();

// ============================================
// RECUPERAR SENHA
// ============================================
var recuperarForm = document.getElementById('recuperarForm');

if (recuperarForm) {
    recuperarForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var email = document.getElementById('email').value.trim().toLowerCase();
        var errorMsg = document.getElementById('errorMessage');
        var successMsg = document.getElementById('successMessage');

        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        if (!email) {
            errorMsg.textContent = 'Digite seu e-mail.';
            errorMsg.style.display = 'block';
            return;
        }

        apiFetch('/api/recuperar-senha', {
            method: 'POST',
            body: JSON.stringify({ email: email })
        })
        .then(function(data) {
            if (!data.ok) {
                errorMsg.textContent = data.erro || 'Erro ao solicitar recuperação.';
                errorMsg.style.display = 'block';
                return;
            }

            sessionStorage.setItem('emailRecuperacao', email);
            successMsg.textContent = 'Código enviado! Redirecionando...';
            successMsg.style.display = 'block';

            setTimeout(function() { window.location.href = 'verificar-codigo.html'; }, 2000);
        })
        .catch(function() {
            errorMsg.textContent = 'Erro ao conectar com o servidor!';
            errorMsg.style.display = 'block';
        });
    });
}

// ============================================
// VERIFICAR CÓDIGO
// ============================================
var verificarForm = document.getElementById('verificarForm');

if (verificarForm) {
    var emailRec = sessionStorage.getItem('emailRecuperacao');
    var emailExibido = document.getElementById('emailExibido');
    if (emailRec && emailExibido) emailExibido.textContent = emailRec;

    verificarForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var codigo = document.getElementById('codigo').value.trim();
        var email = sessionStorage.getItem('emailRecuperacao');
        var errorMsg = document.getElementById('errorMessage');
        var successMsg = document.getElementById('successMessage');

        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        if (!email) {
            errorMsg.textContent = 'Sessão expirada. Reinicie a recuperação.';
            errorMsg.style.display = 'block';
            setTimeout(function() { window.location.href = 'recuperar-senha.html'; }, 2000);
            return;
        }

        if (!codigo) {
            errorMsg.textContent = 'Digite o código.';
            errorMsg.style.display = 'block';
            return;
        }

        apiFetch('/api/verificar-codigo', {
            method: 'POST',
            body: JSON.stringify({ email: email, codigo: codigo })
        })
        .then(function(data) {
            if (!data.ok) {
                errorMsg.textContent = data.erro || 'Código inválido!';
                errorMsg.style.display = 'block';
                return;
            }

            sessionStorage.setItem('codigoRecuperacao', codigo);
            successMsg.textContent = 'Código verificado!';
            successMsg.style.display = 'block';

            setTimeout(function() { window.location.href = 'nova-senha.html'; }, 2000);
        })
        .catch(function() {
            errorMsg.textContent = 'Erro ao conectar com o servidor!';
            errorMsg.style.display = 'block';
        });
    });
}

// ============================================
// NOVA SENHA
// ============================================
var novaSenhaForm = document.getElementById('novaSenhaForm');

if (novaSenhaForm) {
    var emailRecuperacao = sessionStorage.getItem('emailRecuperacao');
    var emailExibidoNS = document.getElementById('emailExibido');
    if (emailRecuperacao && emailExibidoNS) emailExibidoNS.textContent = emailRecuperacao;

    criarMedidorSenha(document.getElementById('novaSenha'));

    novaSenhaForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var novaSenha = document.getElementById('novaSenha').value;
        var confirmarSenha = document.getElementById('confirmarSenha').value;
        var errorMsg = document.getElementById('errorMessage');
        var successMsg = document.getElementById('successMessage');

        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        if (!emailRecuperacao) {
            errorMsg.textContent = 'Sessão expirada. Reinicie a recuperação.';
            errorMsg.style.display = 'block';
            setTimeout(function() { window.location.href = 'recuperar-senha.html'; }, 2000);
            return;
        }

        if (novaSenha.length < 6) {
            errorMsg.textContent = 'Mínimo 6 caracteres.';
            errorMsg.style.display = 'block';
            return;
        }

        if (novaSenha !== confirmarSenha) {
            errorMsg.textContent = 'As senhas não conferem!';
            errorMsg.style.display = 'block';
            return;
        }

        var codigo = sessionStorage.getItem('codigoRecuperacao');

        apiFetch('/api/nova-senha', {
            method: 'POST',
            body: JSON.stringify({
                email: emailRecuperacao,
                codigo: codigo,
                nova_senha: novaSenha
            })
        })
        .then(function(data) {
            if (!data.ok) {
                errorMsg.textContent = data.erro || 'Erro ao alterar a senha.';
                errorMsg.style.display = 'block';
                return;
            }

            sessionStorage.removeItem('emailRecuperacao');
            sessionStorage.removeItem('codigoRecuperacao');

            successMsg.textContent = 'Senha alterada com sucesso!';
            successMsg.style.display = 'block';

            setTimeout(function() { window.location.href = 'login.html'; }, 2000);
        })
        .catch(function() {
            errorMsg.textContent = 'Erro ao conectar com o servidor!';
            errorMsg.style.display = 'block';
        });
    });
}

// ============================================
// MUDAR EMAIL
// ============================================
var mudarEmailForm = document.getElementById('mudarEmailForm');

if (mudarEmailForm) {
    mudarEmailForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var novoEmail = document.getElementById('novoEmail').value.trim().toLowerCase();
        var senhaAtual = document.getElementById('senhaAtual').value;
        var mensagemEl = document.getElementById('mensagem');

        if (!novoEmail || !senhaAtual) {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Preencha todos os campos!';
            mensagemEl.style.display = 'block';
            return;
        }

        apiFetch('/api/mudar-email', {
            method: 'POST',
            body: JSON.stringify({ email: novoEmail, senha: senhaAtual })
        })
        .then(function(data) {
            if (!data.ok) {
                mensagemEl.className = 'mensagem erro';
                mensagemEl.textContent = data.erro || 'Erro ao alterar e-mail.';
                mensagemEl.style.display = 'block';
                return;
            }

            mensagemEl.className = 'mensagem sucesso';
            mensagemEl.textContent = 'E-mail atualizado com sucesso! Redirecionando...';
            mensagemEl.style.display = 'block';

            setTimeout(function() { window.location.href = 'perfil.html'; }, 1500);
        })
        .catch(function() {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Erro ao conectar com o servidor!';
            mensagemEl.style.display = 'block';
        });
    });
}

// ============================================
// MUDAR SENHA
// ============================================
var mudarSenhaForm = document.getElementById('mudarSenhaForm');

if (mudarSenhaForm) {
    criarMedidorSenha(document.getElementById('novaSenha'));

    mudarSenhaForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var senhaAtual = document.getElementById('senhaAtual').value;
        var novaSenha = document.getElementById('novaSenha').value;
        var confirmarSenha = document.getElementById('confirmarSenha').value;
        var mensagemEl = document.getElementById('mensagem');

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Preencha todos os campos!';
            mensagemEl.style.display = 'block';
            return;
        }

        if (novaSenha === senhaAtual) {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'A nova senha deve ser diferente da senha atual.';
            mensagemEl.style.display = 'block';
            return;
        }

        if (novaSenha.length < 6) {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'A nova senha deve ter no mínimo 6 caracteres.';
            mensagemEl.style.display = 'block';
            return;
        }

        if (novaSenha !== confirmarSenha) {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'As senhas não conferem!';
            mensagemEl.style.display = 'block';
            return;
        }

        apiFetch('/api/mudar-senha', {
            method: 'POST',
            body: JSON.stringify({ atual: senhaAtual, nova: novaSenha })
        })
        .then(function(data) {
            if (!data.ok) {
                mensagemEl.className = 'mensagem erro';
                mensagemEl.textContent = data.erro || 'Erro ao trocar a senha.';
                mensagemEl.style.display = 'block';
                return;
            }

            mensagemEl.className = 'mensagem sucesso';
            mensagemEl.textContent = 'Senha atualizada com sucesso! Redirecionando...';
            mensagemEl.style.display = 'block';

            setTimeout(function() { window.location.href = 'perfil.html'; }, 1500);
        })
        .catch(function() {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Erro ao conectar com o servidor!';
            mensagemEl.style.display = 'block';
        });
    });
}

// ============================================
// COMPRESSÃO DA FOTO
// ============================================
function comprimirImagem(file, callback) {
    var reader = new FileReader();
    reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
            var MAX = 512;
            var width = img.width;
            var height = img.height;
            if (width > height && width > MAX) {
                height = Math.round((height * MAX) / width);
                width = MAX;
            } else if (height > MAX) {
                width = Math.round((width * MAX) / height);
                height = MAX;
            }
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = function() { callback(ev.target.result); };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

// ============================================
// MUDAR FOTO
// ============================================
var mudarFotoForm = document.getElementById('mudarFotoForm');

if (mudarFotoForm) {
    var fotoInput = document.getElementById('fotoInput');
    var fotoPreview = document.getElementById('fotoPreview');
    var fotoComprimida = '';

    apiFetch('/api/sessao', { method: 'GET' })
        .then(function(data) {
            if (!data.ok || !data.usuario) {
                window.location.href = 'login.html';
                return;
            }
            if (data.usuario.foto && fotoPreview) fotoPreview.src = data.usuario.foto;
        })
        .catch(function() { window.location.href = 'login.html'; });

    if (fotoInput) {
        fotoInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                comprimirImagem(file, function(dataUrl) {
                    fotoComprimida = dataUrl;
                    if (fotoPreview) fotoPreview.src = dataUrl;
                });
            }
        });
    }

    mudarFotoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var mensagemEl = document.getElementById('mensagem');

        if (!fotoInput.files[0]) {
            mensagemEl.className = 'mensagem erro';
            mensagemEl.textContent = 'Selecione uma foto!';
            mensagemEl.style.display = 'block';
            return;
        }

        var salvar = function(dataUrl) {
            apiFetch('/api/mudar-foto', {
                method: 'POST',
                body: JSON.stringify({ foto: dataUrl })
            })
            .then(function(data) {
                if (!data.ok) {
                    mensagemEl.className = 'mensagem erro';
                    mensagemEl.textContent = data.erro || 'Erro ao salvar foto.';
                    mensagemEl.style.display = 'block';
                    return;
                }
                mensagemEl.className = 'mensagem sucesso';
                mensagemEl.textContent = 'Foto atualizada com sucesso!';
                mensagemEl.style.display = 'block';
            })
            .catch(function() {
                mensagemEl.className = 'mensagem erro';
                mensagemEl.textContent = 'Erro ao conectar com o servidor!';
                mensagemEl.style.display = 'block';
            });
        };

        if (fotoComprimida) salvar(fotoComprimida);
        else comprimirImagem(fotoInput.files[0], salvar);
    });
}

// ============================================
// MENU MOBILE (design system)
// ============================================
var hamburgerBtn = document.getElementById('hamburgerBtn');
var mobileNav = document.getElementById('mobileNav');
var closeMobileBtn = document.getElementById('closeMobileBtn');
var navOverlay = document.getElementById('navOverlay');

function abrirMobileNav() {
    if (mobileNav) mobileNav.classList.add('active');
    if (navOverlay) navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function fecharMobileNav() {
    if (mobileNav) mobileNav.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener('click', function() {
        if (mobileNav.classList.contains('active')) fecharMobileNav();
        else abrirMobileNav();
    });
    if (closeMobileBtn) closeMobileBtn.addEventListener('click', fecharMobileNav);
    if (navOverlay) navOverlay.addEventListener('click', fecharMobileNav);
    mobileNav.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', fecharMobileNav);
    });
}

// ============================================
// MODAL / FAQ / NEWSLETTER
// ============================================
var modalOverlay = document.getElementById('modalOverlay');
var modalClose = document.getElementById('modalClose');
var modalBtn = document.getElementById('modalBtn');

function abrirModal(plan) {
    var title = document.getElementById('modalTitle');
    var price = document.getElementById('modalPrice');
    var desc = document.getElementById('modalDesc');
    var features = document.getElementById('modalFeatures');
    if (title) title.textContent = plan.name;
    if (price) price.textContent = plan.price;
    if (desc) desc.textContent = plan.desc;
    if (features) {
        features.innerHTML = '';
        plan.features.forEach(function(f) {
            var li = document.createElement('li');
            li.textContent = '✓ ' + f;
            features.appendChild(li);
        });
    }
    if (modalOverlay) modalOverlay.classList.add('active');
}

document.querySelectorAll('.plan-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var card = btn.closest('.insurance-plan-card');
        if (!card) return;
        var name = card.querySelector('.insurance-plan-name').textContent;
        var price = card.querySelector('.insurance-plan-price').textContent;
        var descEl = card.querySelector('.insurance-plan-desc');
        var desc = descEl ? descEl.textContent : '';
        var features = [];
        card.querySelectorAll('.insurance-plan-features li').forEach(function(li) {
            features.push(li.textContent.trim());
        });
        abrirModal({ name: name, price: price, desc: desc, features: features });
    });
});

if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', function() {
        modalOverlay.classList.remove('active');
    });
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });
}

if (modalBtn) {
    modalBtn.addEventListener('click', function() {
        if (modalOverlay) modalOverlay.classList.remove('active');
        var toast = document.getElementById('toast');
        if (toast) {
            toast.classList.add('show');
            setTimeout(function() { toast.classList.remove('show'); }, 3000);
        }
    });
}

document.querySelectorAll('.insurance-faq-item').forEach(function(item) {
    var question = item.querySelector('.insurance-faq-question');
    if (!question) return;
    question.addEventListener('click', function() {
        var isActive = item.classList.contains('active');
        document.querySelectorAll('.insurance-faq-item').forEach(function(it) {
            it.classList.remove('active');
            var answers = it.querySelectorAll('.insurance-faq-answer');
            answers.forEach(function(a) { a.style.maxHeight = '0px'; });
        });
        if (!isActive) {
            item.classList.add('active');
            var answer = item.querySelector('.insurance-faq-answer');
            if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
});

var newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = '✅ Cadastro realizado com sucesso!';
            toast.classList.add('show');
            setTimeout(function() { toast.classList.remove('show'); }, 3000);
        }
        newsletterForm.reset();
    });
}

console.log('✅ Insurance - Script carregado (API: ' + API_URL + ')');