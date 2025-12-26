// App Data
const products = [
    {
        id: 1,
        name: "Carvão Vegetal 3kg",
        description: "Carvão de eucalipto premium",
        price: 12.90,
        category: "vegetal",
        badge: "Mais Vendido"
    },
    {
        id: 2,
        name: "Carvão Mineral 5kg",
        description: "Alto poder calorífico",
        price: 24.90,
        category: "mineral",
        badge: "Novidade"
    },
    {
        id: 3,
        name: "Carvão Embalado 10kg",
        description: "Pacote família econômico",
        price: 39.90,
        category: "embalado",
        badge: "Economia"
    },
    {
        id: 4,
        name: "Acendedor Líquido",
        description: "500ml - Acende rápido",
        price: 8.50,
        category: "acessorios"
    },
    {
        id: 5,
        name: "Carvão para Churrasco",
        description: "Especial para churrasqueira",
        price: 18.90,
        category: "vegetal"
    },
    {
        id: 6,
        name: "Lenha de Eucalipto",
        description: "Pacote 15kg",
        price: 32.90,
        category: "vegetal"
    }
];

let cart = [];
let deferredPrompt = null;

// DOM Elements
const cartBtn = document.getElementById('cartBtn');
const closeCart = document.getElementById('closeCart');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const productsGrid = document.getElementById('productsGrid');
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');
const dismissInstall = document.getElementById('dismissInstall');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCart();
    setupEventListeners();
    checkInstallPrompt();
});

// Load Products
function loadProducts() {
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card fade-in';
        productCard.innerHTML = `
            <div class="product-image">
                <i class="fas fa-fire"></i>
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                    <button class="add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Cart Functions
function loadCart() {
    const savedCart = localStorage.getItem('carvaoCarrinho');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

function saveCart() {
    localStorage.setItem('carvaoCarrinho', JSON.stringify(cart));
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    updateCart();
    showNotification(`${product.name} adicionado ao carrinho!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCart();
        }
    }
}

function updateCart() {
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update items display
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <i class="fas fa-fire"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `R$ ${total.toFixed(2)}`;
}

// Setup Event Listeners
function setupEventListeners() {
    // Cart toggle
    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    });
    
    closeCart.addEventListener('click', closeCartSidebar);
    cartOverlay.addEventListener('click', closeCartSidebar);
    
    // Checkout
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Adicione produtos ao carrinho primeiro!');
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        showNotification(`Pedido confirmado! Total: R$ ${total.toFixed(2)}`);
        cart = [];
        saveCart();
        updateCart();
        closeCartSidebar();
    });
    
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
        
        // Update products grid with filtered results
        productsGrid.innerHTML = '';
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card fade-in';
            productCard.innerHTML = `
                <div class="product-image">
                    <i class="fas fa-fire"></i>
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                </div>
                <div class="product-info">
                    <h4 class="product-title">${product.name}</h4>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <button class="add-to-cart" onclick="addToCart(${product.id})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
    });
    
    // Category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.querySelector('span').textContent.toLowerCase();
            showNotification(`Mostrando produtos de: ${category}`);
        });
    });
    
    // Banner button
    document.querySelector('.banner .btn-primary').addEventListener('click', () => {
        showNotification('Pedido rápido iniciado!');
    });
    
    // Offer button
    document.querySelector('.offer-card .btn-primary').addEventListener('click', () => {
        addToCart(3); // Add package to cart
    });
}

function closeCartSidebar() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
}

// Notification System
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: var(--primary-color);
        color: var(--text-color);
        padding: 15px 25px;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        z-index: 2000;
        transition: transform 0.3s ease;
        max-width: 90%;
        text-align: center;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// PWA Install Prompt
function checkInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install prompt after 5 seconds
        setTimeout(() => {
            if (deferredPrompt && !isAppInstalled()) {
                installPrompt.classList.add('show');
            }
        }, 5000);
    });
    
    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        installPrompt.classList.remove('show');
        showNotification('App instalado com sucesso!');
    });
}

function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
}

// Install button handler
installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA');
    } else {
        console.log('Usuário recusou instalar o PWA');
    }
    
    deferredPrompt = null;
    installPrompt.classList.remove('show');
});

// Dismiss install prompt
dismissInstall.addEventListener('click', () => {
    installPrompt.classList.remove('show');
    // Don't show again for 7 days
    localStorage.setItem('installPromptDismissed', Date.now());
});

// Offline Detection
window.addEventListener('online', () => {
    showNotification('Conexão restaurada!');
});

window.addEventListener('offline', () => {
    showNotification('Você está offline. Algumas funcionalidades podem estar limitadas.');
});

// Add to Home Screen
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        // Registration was successful
        console.log('ServiceWorker ready');
    });
}

// Vibration Feedback
function vibrate() {
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

// Update addToCart to include vibration
const originalAddToCart = addToCart;
addToCart = function(productId) {
    vibrate();
    originalAddToCart(productId);
};