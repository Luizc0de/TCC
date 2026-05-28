// Dados dos planos
const planosInfo = {
    vida: {
        titulo: "Seguro de Vida",
        descricao: "Proteção financeira para sua família em caso de imprevistos. Cobertura completa 24h."
    },
    saude: {
        titulo: "Seguro de Saúde",
        descricao: "Rede credenciada com os melhores hospitais e clínicas. Atendimento de qualidade."
    },
    acidentes: {
        titulo: "Seguro de Acidentes",
        descricao: "Cobertura para despesas médicas e indenização em caso de acidentes pessoais."
    },
    previdencia: {
        titulo: "Previdência",
        descricao: "Planeje seu futuro com segurança. Invista hoje para colher amanhã."
    }
};

// Elementos do DOM
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalCloseBtn = document.querySelector('.modal-close');
const modalBtn = document.querySelector('.modal-btn');
const toast = document.getElementById('toast');

// Função para mostrar toast
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Função para abrir modal
function openModal(planId) {
    const plano = planosInfo[planId];
    if (plano) {
        modalTitle.textContent = plano.titulo;
        modalDescription.textContent = plano.descricao;
        modal.style.display = 'flex';
    }
}

// Função para fechar modal
function closeModal() {
    modal.style.display = 'none';
}

// Eventos dos botões "Ver planos"
document.querySelectorAll('.btn-planos').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const planId = btn.getAttribute('data-plan');
        openModal(planId);
    });
});

// Eventos dos cards (clique no card inteiro)
document.querySelectorAll('.insurance-card').forEach(card => {
    card.addEventListener('click', () => {
        const planId = card.getAttribute('data-plan');
        openModal(planId);
    });
});

// Fechar modal
modalCloseBtn.addEventListener('click', closeModal);
modalBtn.addEventListener('click', closeModal);

// Fechar modal clicando fora
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Animação de entrada dos cards (fade-in)
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.insurance-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    console.log('🚀 Site de seguros carregado com sucesso!');
});

// Efeito hover nos cards já está no CSS, mas podemos adicionar um console.log interativo
document.querySelectorAll('.insurance-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        const plano = card.querySelector('h3').textContent;
        console.log(`👀 Usuário olhou para: ${plano}`);
    });
});