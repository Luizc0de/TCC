// ===== VARIÁVEIS GLOBAIS =====

// Dados dos planos para o modal
const plansData = {
    // Planos de Vida
    vida: {
        name: "Seguro de Vida",
        price: "R$ 39,90",
        desc: "Proteção financeira para sua família em caso de imprevistos.",
        features: ["Indenização para beneficiários", "Cobertura 24h", "Assistência funeral inclusa"]
    },
    acidentes: {
        name: "Seguro de Acidentes Pessoais",
        price: "R$ 19,90",
        desc: "Proteção em caso de acidentes pessoais.",
        features: ["Indenização por invalidez", "Despesas médicas", "Cobertura 24h"]
    },
    doencas: {
        name: "Seguro de Doenças Graves",
        price: "R$ 49,90",
        desc: "Cobertura para câncer, infarto, AVC e outras doenças.",
        features: ["Cobertura para +10 doenças", "Indenização integral", "Isenção de carência"]
    },
    invalidez: {
        name: "Seguro de Invalidez",
        price: "R$ 29,90",
        desc: "Proteção por incapacidade permanente total ou parcial.",
        features: ["Renda mensal vitalícia", "Cobertura por acidente ou doença", "Assistência especializada"]
    },
    funeral: {
        name: "Seguro Funeral",
        price: "R$ 14,90",
        desc: "Assistência para despesas funerárias.",
        features: ["Cobertura nacional", "Assistência psicológica", "Sem carência"]
    },
    // Planos para Bens
    smartphone: {
        name: "Seguro Smartphone",
        price: "R$ 24,90",
        desc: "Proteção completa para seu celular.",
        features: ["Roubo e furto qualificado", "Danos acidentais (tela, água)", "Assistência técnica"]
    },
    automovel: {
        name: "Seguro Automóvel",
        price: "R$ 89,90",
        desc: "Proteção para seu veículo.",
        features: ["Colisão e roubo", "Danos a terceiros", "Carro reserva", "Assistência 24h"]
    },
    imovel: {
        name: "Seguro Imóvel",
        price: "R$ 49,90",
        desc: "Proteção para sua casa ou apartamento.",
        features: ["Incêndio, explosão, raio", "Roubo e furto de bens", "Danos elétricos", "Responsabilidade familiar"]
    },
    maquinarios: {
        name: "Seguro Maquinários",
        price: "R$ 119,90",
        desc: "Proteção para equipamentos industriais.",
        features: ["Quebra de máquinas", "Danos elétricos", "Perda de lucros"]
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
    }
};

// ===== FUNÇÃO TOAST =====
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== MODAL =====
function openModal(planId) {
    const plan = plansData[planId];
    if (!plan) return;

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

// ===== HEADER SCROLL EFFECT =====
function handleHeaderScroll() {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// ===== SCROLL SUAVE =====
function initSmoothScroll() {
    document.querySelectorAll('.nav-link, #heroVidaBtn, #heroBensBtn, #customPlanBtn, .insurance-footer-links a, .insurance-logo').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    // Fecha mobile nav se estiver aberto
                    const mobileNav = document.getElementById('mobileNav');
                    if (mobileNav.classList.contains('active')) {
                        mobileNav.classList.remove('active');
                    }
                }
            }
        });
    });
}

// ===== MOBILE MENU =====
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

// ===== BOTÕES DOS PLANOS =====
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
            // Evita abrir modal se clicou no botão
            if (e.target.closest('.plan-btn')) return;
            const planId = card.getAttribute('data-plan');
            openModal(planId);
        });
    });
}

// ===== PLANO PERSONALIZADO =====
function initCustomPlan() {
    const customBtn = document.getElementById('customPlanBtn');
    if (customBtn) {
        customBtn.addEventListener('click', () => {
            showToast('📋 Em breve um especialista entrará em contato para montar seu plano personalizado!');
        });
    }
}

// ===== FAQ ACORDEÃO =====
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

// ===== NEWSLETTER =====
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

// ===== MODAL BUTTON =====
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

// ===== BACK TO TOP =====
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

// ===== SCROLL REVEAL =====
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.insurance-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    revealElements.forEach(el => observer.observe(el));
}

// ===== ANIMAÇÃO DOS CARDS AO ENTRAR NA TELA =====
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
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
}

// ===== VERIFICAR ORIENTAÇÃO =====
function checkOrientation() {
    if (window.innerWidth <= 768) {
        // Mobile
        document.body.classList.add('is-mobile');
    } else {
        document.body.classList.remove('is-mobile');
    }
}

// ===== CONSOLE LOG =====
console.log('🚀 Insurance - Planos de Vida e Bens Materiais carregado com sucesso!');
console.log('📱 Site responsivo - Funciona em PC, notebook, tablet e celular');

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initMobileMenu();
    initPlanButtons();
    initCustomPlan();
    initFaq();
    initNewsletter();
    initModal();
    initBackToTop();
    initScrollReveal();
    initCardAnimation();
    checkOrientation();
    window.addEventListener('scroll', handleHeaderScroll);
    window.addEventListener('resize', checkOrientation);
    handleHeaderScroll();
});