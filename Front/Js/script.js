// ============================================
// TELA DE CARREGAMENTO + TRANSIÇÃO ENTRE PÁGINAS
// ============================================

const loadingScreen = document.getElementById('loading-screen');

function showLoading() {
    if (loadingScreen) {
        loadingScreen.classList.add('active');
    }
}

function hideLoading() {
    if (loadingScreen) {
        loadingScreen.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
    document.body.classList.add('loaded');
});

// ============================================
// REDIRECIONAMENTO PARA PÁGINAS .HTML
// ============================================

document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    
    if (link) {
        const href = link.getAttribute('href');
        
        // Se for link para .html, redireciona com loading
        if (href && href.endsWith('.html') && !href.includes('#')) {
            e.preventDefault();
            showLoading();
            setTimeout(() => {
                window.location.href = href;
            }, 500);
        }
    }
});

// ============================================
// DADOS DOS PLANOS
// ============================================

const plansData = {
    // ========== PLANOS DA HOME ==========
    vida: {
        name: "Seguro de Vida",
        price: "R$ 39,90",
        desc: "Líder absoluto com 48% do mercado.",
        features: ["Indenização para beneficiários", "Cobertura 24h", "Assistência funeral inclusa"]
    },
    automovel: {
        name: "Seguro Automóvel",
        price: "R$ 89,90",
        desc: "Mercado de R$ 65 bilhões.",
        features: ["Colisão e roubo", "Danos a terceiros", "Carro reserva", "Assistência 24h"]
    },
    prestamista: {
        name: "Seguro Prestamista",
        price: "R$ 24,90",
        desc: "27% do mercado. Protege financiamentos.",
        features: ["Quitação de financiamento", "Proteção para empréstimos", "Cobertura por invalidez"]
    },
    imovel: {
        name: "Seguro Residencial",
        price: "R$ 49,90",
        desc: "Crescimento de 26%.",
        features: ["Incêndio, explosão, raio", "Roubo e furto de bens", "Danos elétricos", "Responsabilidade familiar"]
    },
    acidentes: {
        name: "Acidentes Pessoais",
        price: "R$ 19,90",
        desc: "12% do mercado. Proteção diária.",
        features: ["Indenização por invalidez", "Despesas médicas", "Cobertura 24h"]
    },
    celular: {
        name: "Seguro Celular",
        price: "R$ 24,90",
        desc: "R$ 2,5 bilhões/ano.",
        features: ["Roubo e furto qualificado", "Danos acidentais", "Assistência técnica"]
    },
    doencas: {
        name: "Doenças Graves",
        price: "R$ 49,90",
        desc: "Crescimento de 19,7%.",
        features: ["Câncer, infarto, AVC", "Indenização integral", "Isenção de carência"]
    },
    garantia: {
        name: "Garantia Estendida",
        price: "R$ 14,90",
        desc: "R$ 3 bilhões em 2025.",
        features: ["Extensão de garantia", "Danos elétricos", "Assistência técnica"]
    },
    invalidez: {
        name: "Seguro Invalidez",
        price: "R$ 29,90",
        desc: "Proteção por incapacidade permanente.",
        features: ["Renda mensal vitalícia", "Cobertura por acidente ou doença", "Assistência especializada"]
    },
    funeral: {
        name: "Seguro Funeral",
        price: "R$ 14,90",
        desc: "Assistência para despesas funerárias.",
        features: ["Cobertura nacional", "Assistência psicológica", "Sem carência"]
    },
    maquinarios: {
        name: "Seguro Maquinários",
        price: "R$ 119,90",
        desc: "Proteção para equipamentos industriais.",
        features: ["Quebra de máquinas", "Danos elétricos", "Perda de lucros", "Assistência técnica especializada"]
    },
    eletronicos: {
        name: "Seguro Eletrônicos",
        price: "R$ 34,90",
        desc: "Proteção para notebooks, tablets e TVs.",
        features: ["Roubo e furto", "Danos acidentais", "Assistência técnica"]
    },
    pet: {
        name: "Seguro Pet",
        price: "R$ 29,90",
        desc: "Proteção para seu melhor amigo.",
        features: ["Consultas e exames", "Cirurgias e internações", "Assistência 24h"]
    },

    // ========== PLANOS SEGURO DE VIDA ==========
    'vida-basico': {
        name: "Plano Básico - Seguro de Vida",
        price: "R$ 29,90",
        desc: "Ideal para quem busca proteção essencial.",
        features: ["2 beneficiários", "Cobertura de R$ 50.000", "Assistência funeral", "Suporte 24h"]
    },
    'vida-plus': {
        name: "Plano Plus - Seguro de Vida",
        price: "R$ 59,90",
        desc: "O mais escolhido pelos nossos clientes.",
        features: ["4 beneficiários", "Cobertura de R$ 120.000", "Assistência funeral", "Telemedicina", "Suporte prioritário"]
    },
    'vida-premium': {
        name: "Plano Premium - Seguro de Vida",
        price: "R$ 99,90",
        desc: "Proteção total para sua família.",
        features: ["6 beneficiários", "Cobertura de R$ 250.000", "Assistência funeral", "Telemedicina", "Check-up anual", "Atendimento vip"]
    },

    // ========== PLANOS PRESTAMISTA ==========
    'prestamista-basico': {
        name: "Plano Essencial - Prestamista",
        price: "R$ 19,90",
        desc: "Proteção básica para suas dívidas.",
        features: ["Quitação de financiamento", "Cobertura por morte", "Assistência funeral"]
    },
    'prestamista-plus': {
        name: "Plano Completo - Prestamista",
        price: "R$ 39,90",
        desc: "Proteção completa para sua família.",
        features: ["Quitação de financiamento", "Cobertura por morte", "Invalidez total/permanente", "Assistência funeral", "Suporte psicológico"]
    },
    'prestamista-premium': {
        name: "Plano Família - Prestamista",
        price: "R$ 59,90",
        desc: "Proteção total para você e sua família.",
        features: ["Quitação de financiamento", "Cobertura por morte", "Invalidez total/permanente", "Assistência funeral", "Suporte psicológico", "Cobertura para o cônjuge"]
    },

    // ========== PLANOS ACIDENTES ==========
    'acidentes-basico': {
        name: "Plano Individual - Acidentes",
        price: "R$ 14,90",
        desc: "Proteção essencial para você.",
        features: ["Cobertura de R$ 25.000", "Despesas médicas", "Cobertura 24h"]
    },
    'acidentes-plus': {
        name: "Plano Família - Acidentes",
        price: "R$ 29,90",
        desc: "Proteção para você e sua família.",
        features: ["Cobertura de R$ 50.000", "Despesas médicas", "Cobertura 24h", "Cônjuge incluso", "Assistência funeral"]
    },
    'acidentes-premium': {
        name: "Plano Completo - Acidentes",
        price: "R$ 49,90",
        desc: "Proteção total para você e sua família.",
        features: ["Cobertura de R$ 100.000", "Despesas médicas", "Cobertura 24h", "Cônjuge e filhos", "Assistência funeral", "Suporte psicológico"]
    },

    // ========== PLANOS DOENÇAS GRAVES ==========
    'doencas-basico': {
        name: "Plano Essencial - Doenças Graves",
        price: "R$ 29,90",
        desc: "Proteção básica para as principais doenças.",
        features: ["Cobertura de R$ 30.000", "Câncer, infarto, AVC", "Isenção de carência"]
    },
    'doencas-plus': {
        name: "Plano Completo - Doenças Graves",
        price: "R$ 59,90",
        desc: "Proteção completa para sua família.",
        features: ["Cobertura de R$ 70.000", "+10 doenças cobertas", "Isenção de carência", "Cônjuge incluso", "Telemedicina"]
    },
    'doencas-premium': {
        name: "Plano Família - Doenças Graves",
        price: "R$ 89,90",
        desc: "Proteção total para você e sua família.",
        features: ["Cobertura de R$ 120.000", "+15 doenças cobertas", "Isenção de carência", "Cônjuge e filhos", "Telemedicina", "Check-up anual"]
    },

    // ========== PLANOS INVALIDEZ ==========
    'invalidez-basico': {
        name: "Plano Essencial - Invalidez",
        price: "R$ 19,90",
        desc: "Proteção básica para invalidez.",
        features: ["Renda de R$ 1.500/mês", "Cobertura por acidente", "Assistência 24h"]
    },
    'invalidez-plus': {
        name: "Plano Completo - Invalidez",
        price: "R$ 39,90",
        desc: "Proteção completa para sua família.",
        features: ["Renda de R$ 3.500/mês", "Cobertura por acidente ou doença", "Assistência 24h", "Reabilitação profissional", "Suporte psicológico"]
    },
    'invalidez-premium': {
        name: "Plano Família - Invalidez",
        price: "R$ 59,90",
        desc: "Proteção total para você e sua família.",
        features: ["Renda de R$ 6.000/mês", "Cobertura por acidente ou doença", "Assistência 24h", "Reabilitação profissional", "Suporte psicológico", "Cônjuge e filhos"]
    },

    // ========== PLANOS FUNERAL ==========
    'funeral-basico': {
        name: "Plano Essencial - Funeral",
        price: "R$ 9,90",
        desc: "Proteção básica para despesas funerárias.",
        features: ["Cobertura de R$ 5.000", "Cobertura nacional", "Sem carência"]
    },
    'funeral-plus': {
        name: "Plano Completo - Funeral",
        price: "R$ 19,90",
        desc: "Proteção completa para sua família.",
        features: ["Cobertura de R$ 10.000", "Cobertura nacional", "Sem carência", "Assistência psicológica", "Serviço de translado"]
    },
    'funeral-premium': {
        name: "Plano Família - Funeral",
        price: "R$ 29,90",
        desc: "Proteção total para toda a família.",
        features: ["Cobertura de R$ 20.000", "Cobertura nacional", "Sem carência", "Assistência psicológica", "Serviço de translado", "Cônjuge e filhos"]
    }
};

// ============================================
// FUNÇÕES DO SITE
// ============================================

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function openModal(planId) {
    const plan = plansData[planId];
    if (!plan) {
        console.warn('Plano não encontrado:', planId);
        return;
    }

    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDesc = document.getElementById('modalDesc');
    const modalFeatures = document.getElementById('modalFeatures');

    modalTitle.textContent = plan.name;
    modalPrice.innerHTML = `${plan.price}<span>/mês</span>`;
    modalDesc.textContent = plan.desc;
    
    modalFeatures.innerHTML = '';
    plan.features.forEach(feature => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${feature}`;
        modalFeatures.appendChild(li);
    });

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function handleHeaderScroll() {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

function initSmoothScroll() {
    document.querySelectorAll('.nav-link, .insurance-logo, .insurance-footer-links a, .dropdown-link, .insurance-hero-buttons a, #customPlanBtn').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    const mobileNav = document.getElementById('mobileNav');
                    if (mobileNav.classList.contains('active')) {
                        mobileNav.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }
            }
        });
    });
}

function initMobileMenu() {
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    const closeBtn = document.getElementById('closeMobileBtn');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    mobileNav.addEventListener('click', (e) => {
        if (e.target === mobileNav) {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

function initPlanButtons() {
    const planBtns = document.querySelectorAll('.plan-btn');
    const cards = document.querySelectorAll('.insurance-plan-card');
    
    planBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.insurance-plan-card');
            const planId = card.getAttribute('data-plan');
            openModal(planId);
        });
    });
    
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.plan-btn')) return;
            const planId = card.getAttribute('data-plan');
            openModal(planId);
        });
    });
}

function initDropdownLinks() {
    const dropdownLinks = document.querySelectorAll('.dropdown-link');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Se for link para .html, o evento global cuida do redirecionamento
            if (href && href.endsWith('.html')) {
                return;
            }
            
            e.preventDefault();
            const planId = this.getAttribute('data-plano');
            
            if (planId && plansData[planId]) {
                openModal(planId);
            } else {
                const planosSection = document.getElementById('planos');
                if (planosSection) {
                    const offsetTop = planosSection.offsetTop - 80;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            }
        });
    });
}

function initCustomPlan() {
    const customBtn = document.getElementById('customPlanBtn');
    if (customBtn) {
        customBtn.addEventListener('click', () => {
            showToast('📋 Em breve um especialista entrará em contato!');
        });
    }
}

function initFaq() {
    const faqItems = document.querySelectorAll('.insurance-faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.insurance-faq-question');
        const answer = item.querySelector('.insurance-faq-answer');
        const answerInner = item.querySelector('.insurance-faq-answer-inner');
        
        answer.style.maxHeight = '0';
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.insurance-faq-answer');
                    otherAnswer.style.maxHeight = '0';
                }
            });
            
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answerInner.scrollHeight + 40 + 'px';
            } else {
                item.classList.remove('active');
                answer.style.maxHeight = '0';
            }
        });
    });
}

function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailRegex.test(email)) {
                showToast('❌ Por favor, insira um e-mail válido.');
                return;
            }
            
            showToast('✅ E-mail cadastrado com sucesso!');
            form.reset();
        });
    }
}

function initModal() {
    const closeBtn = document.getElementById('modalClose');
    const modalBtn = document.getElementById('modalBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (modalBtn) {
        modalBtn.addEventListener('click', () => {
            showToast('✅ Plano selecionado com sucesso!');
            closeModal();
        });
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
}

function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 600) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.insurance-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    revealElements.forEach(el => observer.observe(el));
}

function initCardAnimation() {
    const cards = document.querySelectorAll('.insurance-plan-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
}

function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                const errorMsg = document.getElementById('errorMessage');
                if (errorMsg) {
                    errorMsg.textContent = 'Por favor, preencha todos os campos.';
                    errorMsg.style.display = 'block';
                    setTimeout(() => { errorMsg.style.display = 'none'; }, 3000);
                }
                return;
            }
            
            alert('Login realizado com sucesso!');
            window.location.href = 'index.html';
        });
    }
}

function initCadastro() {
    const cadastroForm = document.getElementById('cadastroForm');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            }
        });
    }
    
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                e.target.value = value;
            }
        });
    }
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    if (toggleConfirmPassword && confirmInput) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    if (passwordInput && strengthFill && strengthText) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            
            if (password.length >= 6) strength++;
            if (password.length >= 10) strength++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^a-zA-Z0-9]/.test(password)) strength++;
            
            let percentage = (strength / 5) * 100;
            strengthFill.style.width = percentage + '%';
            
            if (percentage <= 20) {
                strengthFill.style.background = '#dc2626';
                strengthText.textContent = 'Muito fraca';
                strengthText.style.color = '#dc2626';
            } else if (percentage <= 40) {
                strengthFill.style.background = '#f97316';
                strengthText.textContent = 'Fraca';
                strengthText.style.color = '#f97316';
            } else if (percentage <= 60) {
                strengthFill.style.background = '#eab308';
                strengthText.textContent = 'Média';
                strengthText.style.color = '#eab308';
            } else if (percentage <= 80) {
                strengthFill.style.background = '#22c55e';
                strengthText.textContent = 'Forte';
                strengthText.style.color = '#22c55e';
            } else {
                strengthFill.style.background = '#16a34a';
                strengthText.textContent = 'Muito forte';
                strengthText.style.color = '#16a34a';
            }
        });
    }
    
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nome = document.getElementById('nome').value.trim();
            const cpf = document.getElementById('cpf').value.trim();
            const telefone = document.getElementById('telefone').value.trim();
            const nascimento = document.getElementById('nascimento').value;
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!nome || !cpf || !telefone || !nascimento || !email || !password) {
                const errorMsg = document.getElementById('errorMessage');
                if (errorMsg) {
                    errorMsg.textContent = 'Por favor, preencha todos os campos.';
                    errorMsg.style.display = 'block';
                    setTimeout(() => { errorMsg.style.display = 'none'; }, 3000);
                }
                return;
            }
            
            if (password !== confirmPassword) {
                const errorMsg = document.getElementById('errorMessage');
                if (errorMsg) {
                    errorMsg.textContent = 'As senhas não conferem.';
                    errorMsg.style.display = 'block';
                    setTimeout(() => { errorMsg.style.display = 'none'; }, 3000);
                }
                return;
            }
            
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
                successMsg.style.display = 'block';
            }
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initMobileMenu();
    initBackToTop();
    initScrollReveal();
    window.addEventListener('scroll', handleHeaderScroll);
    handleHeaderScroll();
    
    if (document.getElementById('planos')) {
        initPlanButtons();
        initDropdownLinks();
        initCustomPlan();
        initFaq();
        initNewsletter();
        initModal();
        initCardAnimation();
    }
    
    if (document.getElementById('loginForm')) {
        initLogin();
    }
    
    if (document.getElementById('cadastroForm')) {
        initCadastro();
    }
    
    console.log('🚀 Insurance - Site carregado com sucesso!');
});