// ============================================
// INSURANCE - SCRIPT.JS COMPLETO
// ============================================

// ============================================
// LOADING SCREEN
// ============================================
setTimeout(function() {
    var loading = document.getElementById('loading-screen');
    if (loading) {
        loading.style.display = 'none';
    }
}, 500);

// ============================================
// MENU MOBILE
// ============================================
var menuToggle = document.getElementById('menuToggle');
var mobileMenu = document.getElementById('mobileMenu');
if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
    });
}

// ============================================
// HEADER SCROLL
// ============================================
window.addEventListener('scroll', function() {
    var header = document.getElementById('header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// ============================================
// BACK TO TOP
// ============================================
var backToTop = document.getElementById('backToTop');
if (backToTop) {
    window.addEventListener('scroll', function() {
        if (window.scrollY > 600) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    backToTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// VERIFICAÇÃO DE LOGIN
// ============================================
function verificarLogin() {
    var token = localStorage.getItem('token');
    var user = localStorage.getItem('user');
    var headerButtons = document.getElementById('headerButtons');
    var btnCriarConta = document.getElementById('btnCriarConta');

    // Esconde o botão "Criar conta" quando o usuário já está logado
    if (btnCriarConta) {
        btnCriarConta.style.display = (token && user) ? 'none' : '';
    }
    
    if (token && user && headerButtons) {
        var userData = JSON.parse(user);
        var primeiroNome = userData.nome ? userData.nome.split(' ')[0] : 'Usuário';
        var avatar = userData.foto || 'images/default-avatar.png';

        headerButtons.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-btn" onclick="toggleUserMenu(event)">
                    <img src="${avatar}" class="user-avatar" alt="Avatar">
                    Olá, ${primeiroNome} <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <a href="perfil.html"><i class="fa-solid fa-user"></i> Ver Perfil</a>
                    <a href="mudar-email.html"><i class="fa-solid fa-envelope"></i> Mudar Email</a>
                    <a href="mudar-senha.html"><i class="fa-solid fa-lock"></i> Mudar Senha</a>
                    <a href="mudar-foto.html"><i class="fa-solid fa-camera"></i> Mudar Foto</a>
                    <div class="divider"></div>
                    <a href="#" class="danger" onclick="deletarConta(event)"><i class="fa-solid fa-trash"></i> Deletar Conta</a>
                    <a href="#" onclick="logout(event)"><i class="fa-solid fa-sign-out"></i> Sair</a>
                </div>
            </div>
        `;
    }
}

function toggleUserMenu(event) {
    event.stopPropagation();
    var dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

document.addEventListener('click', function() {
    var dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
});

function logout(event) {
    event.preventDefault();
    if (!confirm('Tem certeza que deseja sair da sua conta?')) {
        return;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

verificarLogin();

// ============================================
// AUTENTICAÇÃO E GERENCIAMENTO DE USUÁRIOS (CRUD)
// ============================================
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem('users') || '[]');
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function isAutenticado() {
    return !!(localStorage.getItem('token') && localStorage.getItem('user'));
}

function getCurrentUser() {
    if (!isAutenticado()) return null;
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        return null;
    }
}

function atualizarUsuario(usuarioAtualizado) {
    localStorage.setItem('user', JSON.stringify(usuarioAtualizado));
    var users = getUsers();
    users = users.map(function(u) {
        return u.id === usuarioAtualizado.id ? usuarioAtualizado : u;
    });
    saveUsers(users);
}

// ============================================
// VALIDAÇÕES (CPF e CELULAR)
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

function validarCelular(cel) {
    var d = cel.replace(/\D/g, '');
    if (d.length < 10 || d.length > 11) return false;
    if (d[0] === '0') return false;
    return true;
}

// Máscara de CPF
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

// Máscara de celular (fixo com 10 dígitos ou celular com 11)
var celularInput = document.getElementById('celular');
if (celularInput) {
    celularInput.addEventListener('input', function() {
        var v = celularInput.value.replace(/\D/g, '').slice(0, 11);
        var r = '';
        if (v.length > 0) r = '(' + v.slice(0, 2);
        if (v.length > 2) r += ') ' + v.slice(2, 7);
        if (v.length > 7) r += '-' + v.slice(7);
        if (v.length === 10) r = '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
        celularInput.value = r;
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

// Páginas que exigem autenticação
var PAGINAS_PROTEGIDAS = ['perfil.html', 'mudar-email.html', 'mudar-senha.html', 'mudar-foto.html', 'pagamento.html'];

function protegerPagina() {
    var nomePagina = window.location.pathname.split('/').pop();
    if (PAGINAS_PROTEGIDAS.indexOf(nomePagina) !== -1 && !isAutenticado()) {
        localStorage.setItem('redirectAfterLogin', nomePagina);
        window.location.href = 'login.html';
    }
}

protegerPagina();

// ============================================
// REDIRECIONAR SE JÁ LOGADO
// Quem já está autenticado não precisa acessar login/cadastro
// ============================================
function redirecionarSeLogado() {
    if (!isAutenticado()) return;
    var nomePagina = window.location.pathname.split('/').pop();
    var paginasAuth = ['login.html', 'cadastro.html'];
    if (paginasAuth.indexOf(nomePagina) !== -1) {
        window.location.href = 'index.html';
    }
}

redirecionarSeLogado();

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

        if (!email || !senha) {
            errorMsg.textContent = 'Preencha todos os campos!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        var users = getUsers();
        var user = users.find(function(u) { return u.email.toLowerCase() === email; });

        if (!user) {
            errorMsg.textContent = 'E-mail não cadastrado!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        if (user.senha !== senha) {
            errorMsg.textContent = 'Senha incorreta!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        localStorage.setItem('token', user.id);
        localStorage.setItem('user', JSON.stringify(user));

        errorMsg.style.display = 'none';
        successMsg.textContent = 'Login realizado com sucesso! Redirecionando...';
        successMsg.style.display = 'block';

        setTimeout(function() {
            var destino = localStorage.getItem('redirectAfterLogin');
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = destino || 'index.html';
        }, 1500);
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
        var celular = document.getElementById('celular') ? document.getElementById('celular').value.trim() : '';
        var senha = document.getElementById('password').value;
        var confirmSenha = document.getElementById('confirmPassword').value;
        var errorMsg = document.getElementById('errorMessage');
        var successMsg = document.getElementById('successMessage');

        if (!nome || !email || !cpf || !celular || !senha || !confirmSenha) {
            errorMsg.textContent = 'Preencha todos os campos!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        if (!validarCpf(cpf)) {
            errorMsg.textContent = 'CPF inválido! Verifique os números digitados.';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        if (!validarCelular(celular)) {
            errorMsg.textContent = 'Número de celular inválido! Use o formato (DD) 9XXXX-XXXX.';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        if (senha.length < 6) {
            errorMsg.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        if (senha !== confirmSenha) {
            errorMsg.textContent = 'As senhas não conferem!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        var users = getUsers();

        if (users.some(function(u) { return u.email.toLowerCase() === email; })) {
            errorMsg.textContent = 'Este e-mail já está cadastrado!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        var cpfLimpo = cpf.replace(/\D/g, '');
        if (users.some(function(u) { return u.cpf === cpfLimpo; })) {
            errorMsg.textContent = 'Este CPF já está cadastrado!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        var novoUsuario = {
            id: 'u' + Date.now(),
            nome: nome,
            email: email,
            cpf: cpfLimpo,
            celular: celular.replace(/\D/g, ''),
            senha: senha,
            foto: ''
        };

        users.push(novoUsuario);
        saveUsers(users);

        localStorage.setItem('token', novoUsuario.id);
        localStorage.setItem('user', JSON.stringify(novoUsuario));

        errorMsg.style.display = 'none';
        successMsg.textContent = 'Conta criada com sucesso! Redirecionando...';
        successMsg.style.display = 'block';

        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1500);
    });
}

// ============================================
// PERFIL
// ============================================
var infoNome = document.getElementById('infoNome');

if (infoNome) {
    var usuarioPerfil = getCurrentUser();
    if (usuarioPerfil) {
        var avatarImg = document.getElementById('avatarImg');
        var nomeCompleto = document.getElementById('nomeCompleto');
        var emailUsuario = document.getElementById('emailUsuario');
        var infoEmail = document.getElementById('infoEmail');
        var infoCpf = document.getElementById('infoCpf');

        if (avatarImg) avatarImg.src = usuarioPerfil.foto || 'images/default-avatar.png';
        if (nomeCompleto) nomeCompleto.textContent = usuarioPerfil.nome;
        if (emailUsuario) emailUsuario.textContent = usuarioPerfil.email;
        if (infoNome) infoNome.textContent = usuarioPerfil.nome;
        if (infoEmail) infoEmail.textContent = usuarioPerfil.email;
        if (infoCpf) infoCpf.textContent = usuarioPerfil.cpf;
    }
}

// ============================================
// DELETAR CONTA
// ============================================
function deletarConta(event) {
    event.preventDefault();
    var user = getCurrentUser();
    if (!user) return;

    if (!confirm('Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.')) {
        return;
    }

    var users = getUsers();
    users = users.filter(function(u) { return u.id !== user.id; });
    saveUsers(users);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
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
        vida: 39.90,
        prestamista: 24.90,
        acidentes: 19.90,
        doencas: 49.90,
        invalidez: 29.90,
        funeral: 14.90,
        automovel: 89.90,
        residencial: 49.90,
        celular: 24.90,
        garantia: 14.90,
        maquinarios: 119.90,
        eletronicos: 34.90
    };

    function calcularValor() {
        var tipo = tipoSeguro.value;
        
        if (tipo === '0') {
            valorTotal.innerHTML = 'R$ 0,00<span>/mês</span>';
            return;
        }

        var valor = valoresBase[tipo] || 0;

        coberturas.forEach(function(checkbox) {
            if (checkbox.checked) {
                valor += parseFloat(checkbox.value);
            }
        });

        valorTotal.innerHTML = 'R$ ' + valor.toFixed(2).replace('.', ',') + '<span>/mês</span>';
    }

    tipoSeguro.addEventListener('change', calcularValor);
    coberturas.forEach(function(checkbox) {
        checkbox.addEventListener('change', calcularValor);
    });

    // Pré-seleciona o tipo de seguro vindo da URL (ex: simulador1.html?tipo=automovel)
    function getQueryParam(nome) {
        var params = new URLSearchParams(window.location.search);
        return params.get(nome);
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

        if (tipo !== '0') {
            valorFinal = valoresBase[tipo] || 0;
        }

        coberturas.forEach(function(checkbox) {
            if (checkbox.checked) {
                coberturasSelecionadas.push(checkbox.parentElement.querySelector('span').textContent);
                valorFinal += parseFloat(checkbox.value);
            }
        });

        var plano = {
            tipo: tipo,
            valor: valorFinal.toFixed(2),
            coberturas: coberturasSelecionadas
        };

        localStorage.setItem('planoSimulado', JSON.stringify(plano));
    }

    btnContratar.addEventListener('click', function() {
        var token = localStorage.getItem('token');
        var tipo = tipoSeguro.value;

        if (tipo === '0') {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'Selecione um tipo de seguro!';
            mensagem.style.display = 'block';
            return;
        }

        salvarPlano();

        if (!token) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'Faça login ou cadastre-se para contratar!';
            mensagem.style.display = 'block';
            
            setTimeout(function() {
                window.location.href = 'cadastro.html';
            }, 2000);
            return;
        }

        window.location.href = 'pagamento.html';
    });
}

// ============================================
// PAGAMENTO
// ============================================
var btnPagar = document.getElementById('btnPagar');

if (btnPagar) {
    var plano = JSON.parse(localStorage.getItem('planoSimulado') || '{}');
    var user = JSON.parse(localStorage.getItem('user') || '{}');

    if (plano.tipo) {
        var resumoSeguro = document.getElementById('resumoSeguro');
        var resumoValor = document.getElementById('resumoValor');
        if (resumoSeguro) resumoSeguro.textContent = plano.tipo;
        if (resumoValor) resumoValor.textContent = 'R$ ' + plano.valor;
    }

    var formaSelecionada = 'pix';
    var formaCards = document.querySelectorAll('.forma-card');
    
    formaCards.forEach(function(card) {
        card.addEventListener('click', function() {
            formaCards.forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            formaSelecionada = this.getAttribute('data-forma');
        });
    });

    btnPagar.addEventListener('click', function() {
        var mensagemPag = document.getElementById('mensagem');

        if (!user.email) {
            mensagemPag.className = 'mensagem erro';
            mensagemPag.textContent = 'Faça login para continuar!';
            mensagemPag.style.display = 'block';
            return;
        }

        mensagemPag.className = 'mensagem sucesso';
        mensagemPag.textContent = 'Pagamento registrado! Redirecionando...';
        mensagemPag.style.display = 'block';
        
        localStorage.removeItem('planoSimulado');
        
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 2000);
    });
}

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

        if (!email) {
            errorMsg.textContent = 'Digite seu e-mail.';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        var users = getUsers();
        if (!users.some(function(u) { return u.email.toLowerCase() === email; })) {
            errorMsg.textContent = 'E-mail não cadastrado!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        var codigo = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem('emailRecuperacao', email);
        localStorage.setItem('codigoRecuperacao', codigo);
        console.log('Código de recuperação (simulado): ' + codigo);

        errorMsg.style.display = 'none';
        successMsg.textContent = 'Código enviado! Redirecionando...';
        successMsg.style.display = 'block';
        
        setTimeout(function() {
            window.location.href = 'verificar-codigo.html';
        }, 2000);
    });
}

// ============================================
// VERIFICAR CÓDIGO
// ============================================
var verificarForm = document.getElementById('verificarForm');

if (verificarForm) {
    var emailRec = localStorage.getItem('emailRecuperacao');
    var emailExibido = document.getElementById('emailExibido');
    if (emailRec && emailExibido) emailExibido.textContent = emailRec;

    verificarForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var codigo = document.getElementById('codigo').value.trim();
        var email = localStorage.getItem('emailRecuperacao');
        var codigoCorreto = localStorage.getItem('codigoRecuperacao');
        var errorMsg = document.getElementById('errorMessage');
        var successMsg = document.getElementById('successMessage');

        if (!email) {
            errorMsg.textContent = 'Sessão expirada. Reinicie a recuperação.';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            setTimeout(function() { window.location.href = 'recuperar-senha.html'; }, 2000);
            return;
        }

        if (!codigo) {
            errorMsg.textContent = 'Digite o código.';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        if (codigo !== codigoCorreto) {
            errorMsg.textContent = 'Código inválido!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        errorMsg.style.display = 'none';
        successMsg.textContent = 'Código verificado!';
        successMsg.style.display = 'block';
        
        setTimeout(function() {
            window.location.href = 'nova-senha.html';
        }, 2000);
    });
}

// ============================================
// NOVA SENHA
// ============================================
var novaSenhaForm = document.getElementById('novaSenhaForm');

if (novaSenhaForm) {
    var emailRecuperacao = localStorage.getItem('emailRecuperacao');
    var emailExibido = document.getElementById('emailExibido');
    if (emailRecuperacao && emailExibido) {
        emailExibido.textContent = emailRecuperacao;
    }

    criarMedidorSenha(document.getElementById('novaSenha'));

    novaSenhaForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var novaSenha = document.getElementById('novaSenha').value;
        var confirmarSenha = document.getElementById('confirmarSenha').value;
        var errorMsg = document.getElementById('errorMessage');
        var successMsg = document.getElementById('successMessage');

        if (!emailRecuperacao) {
            errorMsg.textContent = 'Sessão expirada. Reinicie a recuperação.';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            setTimeout(function() { window.location.href = 'recuperar-senha.html'; }, 2000);
            return;
        }

        if (novaSenha.length < 6) {
            errorMsg.textContent = 'Mínimo 6 caracteres.';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        if (novaSenha !== confirmarSenha) {
            errorMsg.textContent = 'As senhas não conferem!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        var users = getUsers();
        var usuario = users.find(function(u) { return u.email.toLowerCase() === emailRecuperacao.toLowerCase(); });

        if (!usuario) {
            errorMsg.textContent = 'Usuário não encontrado!';
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        usuario.senha = novaSenha;
        saveUsers(users);

        localStorage.removeItem('emailRecuperacao');
        localStorage.removeItem('codigoRecuperacao');

        errorMsg.style.display = 'none';
        successMsg.textContent = 'Senha alterada com sucesso!';
        successMsg.style.display = 'block';

        setTimeout(function() {
            window.location.href = 'login.html';
        }, 2000);
    });
}

// ============================================
// MUDAR EMAIL
// ============================================
var mudarEmailForm = document.getElementById('mudarEmailForm');

if (mudarEmailForm) {
    var emailNovoPendente = null;
    var codigoEmailPendente = null;

    mudarEmailForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        var novoEmail = document.getElementById('novoEmail').value.trim().toLowerCase();
        var senhaAtual = document.getElementById('senhaAtual').value;
        var user = getCurrentUser();
        var mensagem = document.getElementById('mensagem');

        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        if (!novoEmail || !senhaAtual) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'Preencha todos os campos!';
            mensagem.style.display = 'block';
            return;
        }

        if (user.senha !== senhaAtual) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'Senha atual incorreta!';
            mensagem.style.display = 'block';
            return;
        }

        var users = getUsers();
        if (users.some(function(u) { return u.email.toLowerCase() === novoEmail && u.id !== user.id; })) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'Este e-mail já está em uso!';
            mensagem.style.display = 'block';
            return;
        }

        emailNovoPendente = novoEmail;
        codigoEmailPendente = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('[CONFIRMAÇÃO] Código para alterar e-mail: ' + codigoEmailPendente);

        mensagem.className = 'mensagem sucesso';
        mensagem.textContent = 'Código de confirmação enviado para ' + user.email + '!';
        mensagem.style.display = 'block';

        document.getElementById('etapaDados').style.display = 'none';
        document.getElementById('etapaCodigo').style.display = 'block';
    });

    var confirmarEmailForm = document.getElementById('confirmarCodigoForm');
    var voltarEditarEmail = document.getElementById('btnVoltarEditar');

    if (voltarEditarEmail) {
        voltarEditarEmail.addEventListener('click', function() {
            document.getElementById('etapaCodigo').style.display = 'none';
            document.getElementById('etapaDados').style.display = 'block';
            document.getElementById('mensagem').style.display = 'none';
        });
    }

    if (confirmarEmailForm) {
        confirmarEmailForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var codigo = document.getElementById('codigoConfirmacao').value.trim();
            var user = getCurrentUser();
            var mensagem = document.getElementById('mensagem');

            if (!codigo) {
                mensagem.className = 'mensagem erro';
                mensagem.textContent = 'Digite o código de confirmação!';
                mensagem.style.display = 'block';
                return;
            }

            if (codigo !== codigoEmailPendente) {
                mensagem.className = 'mensagem erro';
                mensagem.textContent = 'Código inválido!';
                mensagem.style.display = 'block';
                return;
            }

            user.email = emailNovoPendente;
            atualizarUsuario(user);

            mensagem.className = 'mensagem sucesso';
            mensagem.textContent = 'E-mail atualizado com sucesso! Redirecionando...';
            mensagem.style.display = 'block';

            setTimeout(function() {
                window.location.href = 'perfil.html';
            }, 1500);
        });
    }
}

// ============================================
// MUDAR SENHA
// ============================================
var mudarSenhaForm = document.getElementById('mudarSenhaForm');

if (mudarSenhaForm) {
    criarMedidorSenha(document.getElementById('novaSenha'));

    var novaSenhaPendente = null;
    var codigoSenhaPendente = null;

    mudarSenhaForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var senhaAtual = document.getElementById('senhaAtual').value;
        var novaSenha = document.getElementById('novaSenha').value;
        var confirmarSenha = document.getElementById('confirmarSenha').value;
        var user = getCurrentUser();
        var mensagem = document.getElementById('mensagem');

        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'Preencha todos os campos!';
            mensagem.style.display = 'block';
            return;
        }

        if (user.senha !== senhaAtual) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'Senha atual incorreta!';
            mensagem.style.display = 'block';
            return;
        }

        if (novaSenha === senhaAtual) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'A nova senha deve ser diferente da senha atual.';
            mensagem.style.display = 'block';
            return;
        }

        if (novaSenha.length < 6) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'A nova senha deve ter no mínimo 6 caracteres.';
            mensagem.style.display = 'block';
            return;
        }

        if (novaSenha !== confirmarSenha) {
            mensagem.className = 'mensagem erro';
            mensagem.textContent = 'As senhas não conferem!';
            mensagem.style.display = 'block';
            return;
        }

        novaSenhaPendente = novaSenha;
        codigoSenhaPendente = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('[CONFIRMAÇÃO] Código para alterar senha: ' + codigoSenhaPendente);

        mensagem.className = 'mensagem sucesso';
        mensagem.textContent = 'Código de confirmação enviado para ' + user.email + '!';
        mensagem.style.display = 'block';

        document.getElementById('etapaDados').style.display = 'none';
        document.getElementById('etapaCodigo').style.display = 'block';
    });

    var confirmarSenhaForm = document.getElementById('confirmarCodigoForm');
    var voltarEditarSenha = document.getElementById('btnVoltarEditar');

    if (voltarEditarSenha) {
        voltarEditarSenha.addEventListener('click', function() {
            document.getElementById('etapaCodigo').style.display = 'none';
            document.getElementById('etapaDados').style.display = 'block';
            document.getElementById('mensagem').style.display = 'none';
        });
    }

    if (confirmarSenhaForm) {
        confirmarSenhaForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var codigo = document.getElementById('codigoConfirmacao').value.trim();
            var user = getCurrentUser();
            var mensagem = document.getElementById('mensagem');

            if (!codigo) {
                mensagem.className = 'mensagem erro';
                mensagem.textContent = 'Digite o código de confirmação!';
                mensagem.style.display = 'block';
                return;
            }

            if (codigo !== codigoSenhaPendente) {
                mensagem.className = 'mensagem erro';
                mensagem.textContent = 'Código inválido!';
                mensagem.style.display = 'block';
                return;
            }

            user.senha = novaSenhaPendente;
            atualizarUsuario(user);

            mensagem.className = 'mensagem sucesso';
            mensagem.textContent = 'Senha atualizada com sucesso! Redirecionando...';
            mensagem.style.display = 'block';

            setTimeout(function() {
                window.location.href = 'perfil.html';
            }, 1500);
        });
    }
}

// ============================================
// COMPRESSÃO DA FOTO DE PERFIL
// Redimensiona e comprime a imagem antes de salvar,
// evitando estourar o limite do localStorage.
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

            // Fundo branco para evitar fundo preto em PNGs transparentes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            callback(canvas.toDataURL('image/jpeg', 0.85));
        };

        img.onerror = function() {
            // Se não for possível processar, mantém o arquivo original
            callback(ev.target.result);
        };

        img.src = ev.target.result;
    };

    reader.readAsDataURL(file);
}

// ============================================
// MUDAR FOTO
// ============================================
var mudarFotoForm = document.getElementById('mudarFotoForm');

if (mudarFotoForm) {
    var user = getCurrentUser();

    if (!user) {
        window.location.href = 'login.html';
    } else {
        var fotoInput = document.getElementById('fotoInput');
        var fotoPreview = document.getElementById('fotoPreview');
        var fotoComprimida = '';

        if (user.foto && fotoPreview) {
            fotoPreview.src = user.foto;
        }

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

        mudarFotoForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const file = fotoInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('foto', file);

            const resp = await fetch('http://localhost/TCC/Back_end/index.php?url=user/foto', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token // seu JWT
                },
                body: formData // NÃO defina Content-Type manualmente, o browser define o boundary
            });

            const data = await resp.json();
        });
    }
}

console.log('✅ Insurance - Script carregado!');