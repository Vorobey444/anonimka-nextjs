// ============= CORE.JS - Базовые функции =============
// Этот файл содержит общие функции которые используются на всех страницах

console.log('✅ core.js loading...');

// Инициализация Telegram Web App
let tg = window.Telegram?.WebApp || {
    expand: () => {},
    setHeaderColor: () => {},
    setBackgroundColor: () => {},
    MainButton: { setText: () => {}, onClick: () => {}, show: () => {}, hide: () => {} },
    BackButton: { onClick: () => {}, show: () => {}, hide: () => {} },
    initDataUnsafe: { user: null },
    ready: () => {},
    close: () => {},
    showAlert: (message) => alert(message)
};

// Функция переключения экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
        console.error('Screen not found:', screenId);
        return;
    }
    targetScreen.classList.add('active');
    
    const premiumToggle = document.getElementById('premiumToggle');
    if (premiumToggle) {
        premiumToggle.style.display = (screenId === 'mainMenu') ? 'flex' : 'none';
    }
}

// API запросы
async function apiRequest(endpoint, options = {}) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Экспортируем функции в глобальную область
window.showScreen = showScreen;
window.apiRequest = apiRequest;
window.tg = tg;

console.log('✅ core.js loaded successfully');
