// Configuração do Loading
class LoadingManager {
    constructor() {
        this.progress = 0;
        this.totalSteps = 100;
        this.currentStep = 0;
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.tips = document.querySelectorAll('.tip');
        this.tipIndex = 0;
        
        this.messages = [
            "Inicializando sistema...",
            "Conectando com fornecedores...",
            "Localizando motoqueiros próximos...",
            "Configurando mapa de entregas...",
            "Carregando catálogo de produtos...",
            "Preparando interface do usuário...",
            "Finalizando configurações..."
        ];
        
        this.initialize();
    }
    
    initialize() {
        // Iniciar animação
        this.startLoading();
        
        // Simular carregamento de recursos
        this.simulateResourceLoading();
        
        // Gerenciar troca de dicas
        this.manageTips();
    }
    
    startLoading() {
        // Iniciar progresso
        this.updateProgress(5, this.messages[0]);
        
        // Incremento automático baseado em tempo
        const autoIncrement = setInterval(() => {
            if (this.currentStep < this.totalSteps) {
                this.currentStep += 1;
                const newProgress = Math.min(this.currentStep, this.totalSteps);
                this.updateProgress(newProgress);
                
                // Mensagens em pontos específicos
                if (newProgress === 15) this.updateMessage(this.messages[1]);
                if (newProgress === 30) this.updateMessage(this.messages[2]);
                if (newProgress === 45) this.updateMessage(this.messages[3]);
                if (newProgress === 60) this.updateMessage(this.messages[4]);
                if (newProgress === 75) this.updateMessage(this.messages[5]);
                if (newProgress === 90) this.updateMessage(this.messages[6]);
                
                // Verificar se completou
                if (newProgress >= this.totalSteps) {
                    clearInterval(autoIncrement);
                    this.completeLoading();
                }
            }
        }, 50); // 50ms por incremento
    }
    
    simulateResourceLoading() {
        // Simular carregamento de diferentes recursos
        setTimeout(() => {
            this.currentStep += 10; // Recursos básicos
        }, 300);
        
        setTimeout(() => {
            this.currentStep += 15; // Dados do usuário
        }, 800);
        
        setTimeout(() => {
            this.currentStep += 20; // Mapa e localização
        }, 1200);
        
        setTimeout(() => {
            this.currentStep += 25; // Catálogo de produtos
        }, 1800);
        
        setTimeout(() => {
            this.currentStep += 25; // Interface e assets
        }, 2500);
    }
    
    manageTips() {
        // Rotação automática de dicas
        setInterval(() => {
            this.tips.forEach(tip => tip.classList.remove('active'));
            this.tips[this.tipIndex].classList.add('active');
            this.tipIndex = (this.tipIndex + 1) % this.tips.length;
        }, 3000);
    }
    
    updateProgress(value, message = null) {
        this.progress = value;
        this.progressBar.style.width = `${value}%`;
        this.progressText.textContent = `${value}%`;
        
        if (message) {
            this.updateMessage(message);
        }
    }
    
    updateMessage(message) {
        this.loadingMessage.textContent = message;
        
        // Efeito de digitação
        this.typeEffect(message);
    }
    
    typeEffect(text) {
        let i = 0;
        const speed = 30;
        
        // Limpar efeito anterior
        clearTimeout(this.typeTimeout);
        
        const typeWriter = () => {
            if (i < text.length) {
                this.loadingMessage.textContent = text.substring(0, i + 1);
                i++;
                this.typeTimeout = setTimeout(typeWriter, speed);
            }
        };
        
        // Iniciar efeito
        this.loadingMessage.textContent = '';
        typeWriter();
    }
    
    completeLoading() {
        // Efeito final
        this.updateProgress(100, "Pronto! Redirecionando...");
        
        // Efeito visual de conclusão
        this.progressBar.style.transition = 'width 0.5s ease';
        
        // Adicionar classe de conclusão
        document.querySelector('.logo-circle').classList.add('complete');
        
        // Redirecionar para o app principal após breve delay
        setTimeout(() => {
            this.redirectToApp();
        }, 1000);
    }
    
    redirectToApp() {
        // Salvar que já carregou
        localStorage.setItem('appLoaded', 'true');
        
        // Redirecionar para o app principal
        window.location.href = 'index.html';
    }
    
    checkFirstLoad() {
        const firstLoad = !localStorage.getItem('appLoaded');
        
        if (!firstLoad) {
            // Se já carregou antes, redirecionar mais rápido
            setTimeout(() => {
                this.redirectToApp();
            }, 1500);
        }
        
        return firstLoad;
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const loadingManager = new LoadingManager();
    
    // Verificar se é o primeiro carregamento
    loadingManager.checkFirstLoad();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registrado:', registration);
            })
            .catch(error => {
                console.log('Falha no Service Worker:', error);
            });
    });
}

// Offline Detection
window.addEventListener('offline', () => {
    document.querySelector('.loading-message').textContent = 
        "Verificando conexão...";
});

window.addEventListener('online', () => {
    document.querySelector('.loading-message').textContent = 
        "Conexão restaurada! Continuando...";
});

// Prevent right-click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Prevent text selection
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
});