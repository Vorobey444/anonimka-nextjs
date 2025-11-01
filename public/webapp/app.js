// Инициализация Telegram Web App с безопасными fallback методами
let tg = window.Telegram?.WebApp || {
    expand: () => {},
    setHeaderColor: () => {},
    setBackgroundColor: () => {},
    MainButton: {
        setText: () => {},
        onClick: () => {},
        show: () => {},
        hide: () => {}
    },
    BackButton: {
        onClick: () => {},
        show: () => {},
        hide: () => {}
    },
    initDataUnsafe: {
        user: null
    },
    ready: () => {},
    close: () => {}
};

// Безопасная обертка для showAlert с fallback на alert()
// Сохраняем оригинальные методы
const originalShowAlert = tg.showAlert ? tg.showAlert.bind(tg) : null;
const originalShowPopup = tg.showPopup ? tg.showPopup.bind(tg) : null;

// Безопасная обертка для showPopup с fallback на showAlert
tg.showPopup = function(params, callback) {
    // Проверяем версию и наличие метода
    const version = parseFloat(tg.version || '6.0');
    if (version >= 6.2 && originalShowPopup) {
        try {
            originalShowPopup(params, callback);
            return;
        } catch (e) {
            console.warn('showPopup failed:', e.message);
        }
    }
    
    // Fallback: используем оригинальный showAlert напрямую
    const message = params.message || params.title || 'Уведомление';
    if (originalShowAlert) {
        try {
            originalShowAlert(message, callback);
        } catch (e) {
            alert(message);
            if (callback) setTimeout(callback, 0);
        }
    } else {
        alert(message);
        if (callback) setTimeout(callback, 0);
    }
};

// Проверка, запущено ли приложение в Telegram
const isTelegramWebApp = !!window.Telegram?.WebApp?.initData;
console.log('Запущено в Telegram WebApp:', isTelegramWebApp);

if (isTelegramWebApp) {
    tg.expand();
}

// Данные формы
let formData = {};
let currentStep = 1;
const totalSteps = 7;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeTelegramWebApp();
    checkTelegramAuth(); // Проверка авторизации
    checkUserLocation();
    setupEventListeners();
    setupContactsEventListeners();
    
    // Добавляем обработчик видимости страницы
    // Если пользователь вернулся после сканирования QR
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('📱 Страница стала видимой, повторная проверка авторизации');
            // Проверяем авторизацию еще раз
            setTimeout(() => {
                checkTelegramAuth();
            }, 500);
        }
    });
    
    // Обработчик сообщений от всплывающего окна авторизации
    window.addEventListener('message', function(event) {
        // Проверяем источник сообщения
        if (event.origin !== window.location.origin) {
            return;
        }
        
        // Обработка успешной авторизации через Login Widget
        if (event.data && event.data.type === 'telegram_auth' && event.data.user) {
            console.log('✅ Получены данные авторизации от всплывающего окна:', event.data.user);
            
            // Сохраняем данные
            localStorage.setItem('telegram_user', JSON.stringify(event.data.user));
            localStorage.setItem('telegram_auth_time', Date.now().toString());
            
            // Закрываем модальное окно
            const modal = document.getElementById('telegramAuthModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Показываем уведомление
            alert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${event.data.user.first_name}!`);
            
            // Перезагружаем страницу
            location.reload();
        }
    });
});

function initializeTelegramWebApp() {
    // Настройка темы
    tg.setHeaderColor('#0a0a0f');
    tg.setBackgroundColor('#0a0a0f');
    
    // Настройка главной кнопки
    tg.MainButton.setText('Главное меню');
    tg.MainButton.onClick(() => showMainMenu());
    
    // Настройка кнопки назад
    tg.BackButton.onClick(() => handleBackButton());
    
    // Показываем предупреждение если не в Telegram
    if (!isTelegramWebApp) {
        console.warn('⚠️ Приложение запущено вне Telegram WebApp. Некоторые функции недоступны.');
        
        // Показываем уведомление через 2 секунды
        setTimeout(() => {
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 153, 0, 0.95);
                color: #000;
                padding: 15px 25px;
                border-radius: 10px;
                z-index: 10000;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(255, 153, 0, 0.3);
                max-width: 90%;
                text-align: center;
            `;
            warning.innerHTML = '⚠️ Для полного функционала откройте через Telegram бота<br><small>Функция приватных чатов будет ограничена</small>';
            document.body.appendChild(warning);
            
            // Удаляем через 7 секунд
            setTimeout(() => warning.remove(), 7000);
        }, 2000);
    }
    
    console.log('Telegram Web App initialized');
}

// Проверка авторизации через Telegram
function checkTelegramAuth() {
    console.log('🔐 Проверка авторизации...');
    console.log('isTelegramWebApp:', isTelegramWebApp);
    console.log('tg.initDataUnsafe:', tg.initDataUnsafe);
    
    // Если запущено через Telegram WebApp, авторизация автоматическая
    if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
        const userData = {
            id: tg.initDataUnsafe.user.id,
            first_name: tg.initDataUnsafe.user.first_name,
            last_name: tg.initDataUnsafe.user.last_name,
            username: tg.initDataUnsafe.user.username,
            photo_url: tg.initDataUnsafe.user.photo_url
        };
        
        // Проверяем, была ли уже авторизация
        const savedUser = localStorage.getItem('telegram_user');
        const isNewAuth = !savedUser || JSON.stringify(userData) !== savedUser;
        
        // Сохраняем в localStorage
        localStorage.setItem('telegram_user', JSON.stringify(userData));
        localStorage.setItem('telegram_auth_time', Date.now().toString());
        console.log('✅ Авторизован через Telegram WebApp:', userData);
        
        // Закрываем модальное окно если оно было открыто
        const modal = document.getElementById('telegramAuthModal');
        if (modal) {
            modal.style.display = 'none';
            console.log('✅ Модальное окно авторизации закрыто');
            
            // Если это новая авторизация (вернулись из бота), показываем уведомление
            if (isNewAuth) {
                // Даем время модальному окну закрыться
                setTimeout(() => {
                    tg.showAlert(`✅ Добро пожаловать, ${userData.first_name}!\n\nТеперь вы можете пользоваться всеми функциями приложения.`);
                }, 300);
            }
        }
        
        return true;
    }
    
    // Проверяем сохранённые данные из предыдущей сессии
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            console.log('✅ Найдена сохранённая авторизация:', userData);
            // Проверяем, не истекла ли авторизация (опционально)
            const authTime = localStorage.getItem('telegram_auth_time');
            const now = Date.now();
            // Авторизация действительна 30 дней
            if (authTime && (now - parseInt(authTime)) < 30 * 24 * 60 * 60 * 1000) {
                return true;
            }
        } catch (e) {
            console.error('Ошибка парсинга данных пользователя:', e);
            localStorage.removeItem('telegram_user');
        }
    }
    
    // Если нет авторизации - показываем модальное окно
    console.log('❌ Пользователь не авторизован, показываем модальное окно');
    showTelegramAuthModal();
    return false;
}

// Показать модальное окно авторизации
function showTelegramAuthModal() {
    console.log('📱 Показываем модальное окно авторизации');
    
    const modal = document.getElementById('telegramAuthModal');
    if (!modal) {
        console.error('❌ Модальное окно авторизации не найдено!');
        return;
    }
    
    // Блокируем весь интерфейс (делаем модальное окно обязательным)
    modal.style.display = 'flex';
    modal.style.zIndex = '99999';
    
    // Блокируем закрытие по клику вне модального окна
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.onclick = (e) => {
            e.stopPropagation();
            alert('⚠️ Для продолжения необходимо авторизоваться через Telegram');
        };
    }
    
    // Блокируем кнопку закрытия
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.preventDefault();
            alert('⚠️ Для продолжения необходимо авторизоваться через Telegram');
            return false;
        };
    }
    
    // Генерируем уникальный auth token для этой сессии
    const authToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('telegram_auth_token', authToken);
    
    console.log('🔑 Auth token сгенерирован:', authToken);
    
    // Генерируем QR-код
    generateTelegramQR(authToken);
    
    // Инициализируем Telegram Login Widget как запасной вариант
    initTelegramLoginWidget();
    
    // Проверяем авторизацию каждые 2 секунды через API сервера
    const checkInterval = setInterval(async () => {
        try {
            // Проверяем на сервере, не авторизовался ли пользователь через QR на телефоне
            const response = await fetch(`/api/auth?token=${authToken}`);
            const data = await response.json();
            
            if (data.authorized && data.user) {
                console.log('✅ Авторизация через QR получена с сервера:', data.user);
                
                // Сохраняем данные пользователя
                localStorage.setItem('telegram_user', JSON.stringify(data.user));
                localStorage.setItem('telegram_auth_time', Date.now().toString());
                localStorage.removeItem('telegram_auth_token');
                
                // Закрываем модальное окно
                clearInterval(checkInterval);
                modal.style.display = 'none';
                
                // Показываем уведомление
                tg.showAlert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${data.user.first_name}!\n\nТеперь вы можете пользоваться сайтом как с компьютера, так и с телефона.`);
                
                // Перезагружаем страницу через 1 секунду
                setTimeout(() => location.reload(), 1000);
                return;
            }
            
            // Также проверяем localStorage (на случай авторизации через Login Widget)
            const savedUser = localStorage.getItem('telegram_user');
            const authTime = localStorage.getItem('telegram_auth_time');
            
            if (savedUser && authTime) {
                const userData = JSON.parse(savedUser);
                const timeDiff = Date.now() - parseInt(authTime);
                
                // Если авторизация произошла менее 10 секунд назад
                if (timeDiff < 10000) {
                    console.log('✅ Обнаружена авторизация через Login Widget:', userData);
                    
                    // Закрываем модальное окно
                    clearInterval(checkInterval);
                    modal.style.display = 'none';
                    localStorage.removeItem('telegram_auth_token');
                    
                    // Показываем уведомление
                    tg.showAlert(`✅ Авторизация успешна!\n\nДобро пожаловать, ${userData.first_name}!`);
                    
                    // Перезагружаем страницу
                    setTimeout(() => location.reload(), 1000);
                }
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
        }
    }, 2000);
    
    // Останавливаем проверку через 10 минут
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⏰ Timeout: проверка авторизации остановлена');
    }, 600000);
}

// Генерация QR-кода для Telegram авторизации
function generateTelegramQR(authToken) {
    const qrcodeContainer = document.getElementById('qrcode');
    const qrLoading = document.getElementById('qrLoading');
    
    if (!qrcodeContainer) return;
    
    // Очищаем контейнер
    qrcodeContainer.innerHTML = '';
    
    // Показываем загрузку
    if (qrLoading) {
        qrLoading.classList.remove('hidden');
    }
    
    // Создаем deep link для Telegram бота
    // Формат: https://t.me/bot_username?start=auth_token
    const botUsername = 'anonimka_kz_bot'; // @anonimka_kz_bot
    const telegramDeepLink = `https://t.me/${botUsername}?start=${authToken}`;
    
    console.log('Генерация QR-кода для:', telegramDeepLink);
    
    // Генерируем QR-код через небольшую задержку для плавности
    setTimeout(() => {
        try {
            new QRCode(qrcodeContainer, {
                text: telegramDeepLink,
                width: 240,
                height: 240,
                colorDark: "#8338ec",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Скрываем загрузку
            if (qrLoading) {
                qrLoading.classList.add('hidden');
            }
            
            console.log('QR-код успешно сгенерирован');
        } catch (error) {
            console.error('Ошибка генерации QR-кода:', error);
            if (qrLoading) {
                qrLoading.innerHTML = '<p style="color: #ff0066;">❌ Ошибка генерации QR-кода</p>';
            }
        }
    }, 100);
}

// Закрыть модальное окно (только если пользователь авторизован)
function closeTelegramAuthModal() {
    const savedUser = localStorage.getItem('telegram_user');
    if (!savedUser) {
        alert('Для продолжения использования сайта необходимо авторизоваться через Telegram');
        return;
    }
    
    const modal = document.getElementById('telegramAuthModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Инициализация Telegram Login Widget
function initTelegramLoginWidget() {
    const container = document.getElementById('telegramLoginWidget');
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Имя бота для Telegram Login Widget
    const botUsername = 'anonimka_kz_bot'; // @anonimka_kz_bot
    
    // Создаём iframe для Telegram Login Widget
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', window.location.origin + '/webapp/auth.html');
    script.setAttribute('data-request-access', 'write');
    
    container.appendChild(script);
    
    console.log('Telegram Login Widget инициализирован для бота:', botUsername);
}

// Callback после успешной авторизации через Telegram Login Widget
window.onTelegramAuth = function(user) {
    console.log('✅ Успешная авторизация через Telegram Login Widget:', user);
    
    // Сохраняем данные пользователя
    localStorage.setItem('telegram_user', JSON.stringify(user));
    localStorage.setItem('telegram_auth_time', Date.now().toString());
    
    // Закрываем модальное окно
    const modal = document.getElementById('telegramAuthModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('✅ Модальное окно авторизации закрыто');
    }
    
    // Показываем уведомление
    alert(`✅ Вы успешно авторизованы!\n\nДобро пожаловать, ${user.first_name}!\n\nТеперь вы можете создавать объявления и получать уведомления.`);
    
    // Перезагружаем страницу для применения авторизации
    location.reload();
};

// Получить ID текущего пользователя
function getCurrentUserId() {
    // Если в Telegram WebApp
    if (isTelegramWebApp && tg.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id.toString();
    }
    
    // Если авторизован через Login Widget
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            return userData.id?.toString();
        } catch (e) {
            console.error('Ошибка получения ID пользователя:', e);
        }
    }
    
    // Fallback - временный ID
    return 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function setupEventListeners() {
    // Кнопки выбора города
    document.querySelectorAll('.city-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('filter')) {
                handleCityFilter(this.dataset.city);
            } else {
                selectCity(this.dataset.city);
            }
        });
    });

    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGender(btn.dataset.gender));
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTarget(btn.dataset.target));
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGoal(btn.dataset.goal));
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => selectBody(btn.dataset.body));
    });

    // Кастомный город
    document.getElementById('customCity').addEventListener('input', function() {
        if (this.value.trim()) {
            clearCitySelection();
            formData.city = this.value.trim();
        }
    });
}

// Навигация между экранами
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Обновляем кнопки Telegram
    updateTelegramButtons(screenId);
}

function updateTelegramButtons(screenId) {
    switch(screenId) {
        case 'mainMenu':
            tg.BackButton.hide();
            tg.MainButton.hide();
            break;
        case 'createAd':
            tg.BackButton.show();
            tg.MainButton.hide();
            break;
        case 'browseAds':
            tg.BackButton.show();
            tg.MainButton.hide();
            break;
        case 'adDetails':
            tg.BackButton.show();
            tg.MainButton.hide();
            break;
    }
}

function handleBackButton() {
    const activeScreen = document.querySelector('.screen.active').id;
    
    switch(activeScreen) {
        case 'createAd':
            showMainMenu();
            break;
        case 'browseAds':
            showMainMenu();
            break;
        case 'adDetails':
            showBrowseAds();
            break;
        default:
            showMainMenu();
    }
}

function showMainMenu() {
    showScreen('mainMenu');
    resetForm();
}

function showCreateAd() {
    if (!userLocation) {
        tg.showAlert('Сначала выберите ваш город');
        showLocationSetup();
        return;
    }
    
    showScreen('createAd');
    currentStep = 1;
    showStep(1);
    
    // Автоматически заполняем локацию из настроек пользователя
    formData.country = userLocation.country;
    formData.region = userLocation.region;
    formData.city = userLocation.city;
    
    // Отображаем локацию в форме
    updateFormLocationDisplay();
}

// Обновить отображение локации в форме
function updateFormLocationDisplay() {
    if (userLocation) {
        const locationText = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        const formLocationDisplay = document.getElementById('formLocationDisplay');
        if (formLocationDisplay) {
            formLocationDisplay.textContent = locationText;
        }
    }
}

function showBrowseAds() {
    showScreen('browseAds');
    
    // Отображаем текущую локацию
    const browseLocationDisplay = document.getElementById('browseLocationDisplay');
    if (userLocation && browseLocationDisplay) {
        const locationText = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        browseLocationDisplay.textContent = locationText;
    } else if (browseLocationDisplay) {
        browseLocationDisplay.textContent = 'Локация не установлена';
    }
    
    // Загружаем объявления по локации пользователя
    setTimeout(() => {
        if (userLocation) {
            console.log('Загружаем объявления по локации:', userLocation);
            loadAdsByLocation(userLocation.country, userLocation.region, userLocation.city);
        } else {
            console.log('Локация не установлена, показываем все объявления');
            loadAds();
        }
    }, 100);
}

// Показать мои объявления
// Показать мои объявления
function showMyAds() {
    showScreen('myAds');
    loadMyAds();
}

// Загрузить мои объявления
async function loadMyAds() {
    const myAdsList = document.getElementById('myAdsList');
    if (!myAdsList) {
        console.error('❌ Элемент myAdsList не найден!');
        return;
    }
    
    myAdsList.innerHTML = '<div class="loading">Загрузка ваших объявлений...</div>';
    
    try {
        const userId = getCurrentUserId();
        console.log('📋 Загрузка объявлений для пользователя:', userId);
        
        if (userId.startsWith('web_')) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">🔐</div>
                    <h3>Требуется авторизация</h3>
                    <p>Авторизуйтесь через Telegram чтобы видеть свои объявления</p>
                    <button class="neon-button primary" onclick="showTelegramAuthModal()">
                        Авторизоваться
                    </button>
                </div>
            `;
            return;
        }
        
        const ads = await getAllAds();
        console.log('📋 Всего объявлений:', ads.length);
        
        const myAds = ads.filter(ad => ad.tg_id === userId);
        console.log('📋 Мои объявления:', myAds.length);
        
        if (myAds.length === 0) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">📭</div>
                    <h3>У вас пока нет объявлений</h3>
                    <p>Создайте первое объявление и оно появится здесь</p>
                    <button class="neon-button primary" onclick="showCreateAd()">
                        ✏️ Создать объявление
                    </button>
                </div>
            `;
            return;
        }
        
        // Отображаем объявления с кнопками действий
        myAdsList.innerHTML = myAds.map((ad, index) => {
            const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > new Date());
            
            return `
            <div class="ad-card" data-ad-id="${ad.id}">
                ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
                <div class="ad-info">
                    <div class="ad-field">
                        <span class="icon">${ad.gender === 'male' ? '👨' : '👩'}</span>
                        <span>${ad.my_age || '?'} лет, ${ad.body_type || 'не указано'}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">🎯</span>
                        <span>${ad.goal || 'не указано'}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">📍</span>
                        <span>${locationData[ad.country]?.flag || '🌍'} ${ad.region}, ${ad.city}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">📝</span>
                        <span>${ad.text ? (ad.text.substring(0, 100) + (ad.text.length > 100 ? '...' : '')) : 'Без описания'}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">📅</span>
                        <span>${new Date(ad.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                </div>
                <div class="ad-actions">
                    <button class="delete-ad-btn" onclick="deleteMyAd(${ad.id})">
                        🗑️ Удалить
                    </button>
                    <button class="pin-ad-btn" onclick="pinMyAd(${ad.id}, ${!isPinned})">
                        ${isPinned ? '✖️ Открепить' : '📌 Закрепить (24ч)'}
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        console.log('✅ Мои объявления отображены');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки моих объявлений:', error);
        myAdsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>${error.message || 'Неизвестная ошибка'}</p>
                <button class="neon-button primary" onclick="loadMyAds()">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    }
}

// Управление шагами формы
function showStep(step) {
    console.log(`📍 Показываем шаг ${step} из ${totalSteps}`);
    
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    const stepElement = document.getElementById(`step${step}`);
    
    if (!stepElement) {
        console.error(`❌ Элемент step${step} не найден!`);
        return;
    }
    
    stepElement.classList.add('active');
    console.log(`✅ Шаг ${step} активен`, stepElement);
    
    // Показываем/скрываем контейнер textarea
    const textareaContainer = document.getElementById('textareaContainer');
    if (textareaContainer) {
        if (step === 7) {
            textareaContainer.style.display = 'block';
            console.log('✅ Показали контейнер textarea');
            
            // ЯДЕРНАЯ ОПЦИЯ: Удаляем старый textarea и создаём новый с нуля
            let textarea = document.getElementById('adText');
            if (textarea) {
                textarea.remove();
                console.log('🗑️ Удалили старый textarea');
            }
            
            // Создаём textarea динамически
            textarea = document.createElement('textarea');
            textarea.id = 'adText';
            textarea.placeholder = 'Расскажите о себе и что ищете...';
            textarea.rows = 6;
            
            // Применяем стили напрямую
            Object.assign(textarea.style, {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                width: '100%',
                maxWidth: '500px',
                padding: '15px',
                background: 'rgba(26, 26, 46, 0.8)',
                border: '2px solid #ff00ff',
                borderRadius: '15px',
                color: '#e0e0ff',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: '120px',
                height: 'auto',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: '9999',
                margin: '0 auto'
            });
            
            // Вставляем в контейнер
            textareaContainer.innerHTML = '';
            textareaContainer.appendChild(textarea);
            
            // Проверяем через небольшую задержку
            setTimeout(() => {
                const check = document.getElementById('adText');
                console.log('🔍 ДИНАМИЧЕСКИ созданный textarea:', {
                    exists: !!check,
                    display: check?.style.display,
                    visibility: check?.style.visibility,
                    computedDisplay: check ? window.getComputedStyle(check).display : 'n/a',
                    computedVisibility: check ? window.getComputedStyle(check).visibility : 'n/a',
                    offsetHeight: check?.offsetHeight,
                    offsetWidth: check?.offsetWidth,
                    clientHeight: check?.clientHeight,
                    clientWidth: check?.clientWidth
                });
            }, 100);
        } else {
            textareaContainer.style.display = 'none';
        }
    }
    
    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = step > 1 ? 'block' : 'none';
    nextBtn.style.display = step < totalSteps ? 'block' : 'none';
    submitBtn.style.display = step === totalSteps ? 'block' : 'none';
    
    console.log('🔘 Кнопки:', {
        prev: prevBtn.style.display,
        next: nextBtn.style.display,
        submit: submitBtn.style.display
    });
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// Функции для контроля возраста
function increaseAge(inputId) {
    const input = document.getElementById(inputId);
    let currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max) || 100;
    
    // Если поле пустое, устанавливаем начальное значение 18
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        validateAgeRange();
        return;
    }
    
    if (currentValue < maxValue) {
        input.value = currentValue + 1;
        validateAgeRange();
    }
}

function decreaseAge(inputId) {
    const input = document.getElementById(inputId);
    let currentValue = parseInt(input.value);
    const minValue = parseInt(input.min) || 18;
    
    // Если поле пустое, устанавливаем начальное значение 18
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        validateAgeRange();
        return;
    }
    
    if (currentValue > minValue) {
        input.value = currentValue - 1;
        validateAgeRange();
    }
}

function validateAgeRange() {
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    
    if (ageFrom && ageTo) {
        const fromValue = parseInt(ageFrom.value) || 18;
        const toValue = parseInt(ageTo.value) || 18;
        
        // Если "от" больше "до", корректируем "до"
        if (fromValue > toValue) {
            ageTo.value = fromValue;
        }
    }
}

function validateCurrentStep() {
    console.log(`🔍 Валидация шага ${currentStep}`, formData);
    
    switch(currentStep) {
        case 1: // Пол
            const hasGender = !!formData.gender;
            console.log(`Шаг 1 (Пол): ${hasGender ? '✅' : '❌'}`, formData.gender);
            return hasGender;
        case 2: // Кого ищет
            const hasTarget = !!formData.target;
            console.log(`Шаг 2 (Кого ищет): ${hasTarget ? '✅' : '❌'}`, formData.target);
            return hasTarget;
        case 3: // Цель
            const hasGoal = !!formData.goal;
            console.log(`Шаг 3 (Цель): ${hasGoal ? '✅' : '❌'}`, formData.goal);
            return hasGoal;
        case 4: // Возраст партнера
            const ageFrom = document.getElementById('ageFrom').value;
            const ageTo = document.getElementById('ageTo').value;
            if (ageFrom && ageTo) {
                formData.ageFrom = ageFrom;
                formData.ageTo = ageTo;
                console.log(`Шаг 4 (Возраст партнера): ✅ ${ageFrom}-${ageTo}`);
                return true;
            }
            console.log(`Шаг 4 (Возраст партнера): ❌`);
            return false;
        case 5: // Мой возраст
            const myAge = document.getElementById('myAge').value;
            if (myAge) {
                formData.myAge = myAge;
                console.log(`Шаг 5 (Мой возраст): ✅ ${myAge}`);
                return true;
            }
            console.log(`Шаг 5 (Мой возраст): ❌`);
            return false;
        case 6: // Телосложение
            const hasBody = !!formData.body;
            console.log(`Шаг 6 (Телосложение): ${hasBody ? '✅' : '❌'}`, formData.body);
            return hasBody;
        case 7: // Текст объявления
            const adText = document.getElementById('adText')?.value.trim();
            console.log(`Шаг 7 (Текст): textarea элемент:`, document.getElementById('adText'));
            console.log(`Шаг 7 (Текст): значение:`, adText);
            if (adText && adText.length >= 10) {
                formData.text = adText;
                console.log(`Шаг 7 (Текст): ✅ ${adText.length} символов`);
                return true;
            }
            console.log(`Шаг 7 (Текст): ❌ слишком короткий текст`);
            tg.showAlert('Пожалуйста, введите текст объявления (минимум 10 символов)');
            return false;
    }
    return false;
}

// Обработчики выбора (старые функции удалены - используется новая система локации)

function selectGender(gender) {
    document.querySelectorAll('.gender-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-gender="${gender}"]`).classList.add('selected');
    formData.gender = gender;
}

function selectTarget(target) {
    document.querySelectorAll('.target-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-target="${target}"]`).classList.add('selected');
    formData.target = target;
}

function selectGoal(goal) {
    document.querySelectorAll('.goal-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-goal="${goal}"]`).classList.add('selected');
    formData.goal = goal;
}

function selectBody(body) {
    document.querySelectorAll('.body-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-body="${body}"]`).classList.add('selected');
    formData.body = body;
}

// Отправка объявления
async function submitAd() {
    if (!validateCurrentStep()) {
        tg.showAlert('Заполните все поля');
        return;
    }

    try {
        // Получаем текст объявления
        const adTextElement = document.getElementById('adText');
        const adText = adTextElement ? adTextElement.value.trim() : '';
        
        if (!adText) {
            tg.showAlert('Пожалуйста, введите текст объявления');
            return;
        }

        // Подготавливаем данные для отправки в Supabase
        const adData = {
            gender: formData.gender,
            target: formData.target,
            goal: formData.goal,
            ageFrom: formData.ageFrom,
            ageTo: formData.ageTo,
            myAge: formData.myAge,
            body: formData.body,
            text: adText,
            country: formData.country || 'Россия',
            region: formData.region || '',
            city: formData.city,
            // Используем новую функцию для получения ID
            tgId: getCurrentUserId()
        };

        console.log('Отправка объявления в Supabase:', adData);
        console.log('Telegram User ID:', getCurrentUserId());


        // Показываем индикатор загрузки
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Публикуем...';
        }

        // Отправляем в Supabase через наш API
        const result = await window.SupabaseClient.createAd(adData);
        
        console.log('Объявление опубликовано:', result);

        // Показываем успех
        tg.showAlert('✅ Объявление успешно опубликовано!', () => {
            // Очищаем форму
            formData = {};
            currentStep = 1;
            showScreen('mainMenu');
        });

    } catch (error) {
        console.error('Ошибка создания объявления:', error);
        tg.showAlert('❌ Ошибка при публикации объявления: ' + error.message);
    } finally {
        // Восстанавливаем кнопку
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Опубликовать';
        }
    }
}

// Загрузка и отображение объявлений
async function loadAds(filters = {}) {
    try {
        console.log('Загрузка объявлений с фильтрами:', filters);
        
        // Показываем индикатор загрузки
        const adsList = document.getElementById('adsList');
        if (adsList) {
            adsList.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Загружаем объявления...</p>
                </div>
            `;
        }

        // Запрашиваем объявления из Supabase через API
        const ads = await window.SupabaseClient.getAds(filters);
        
        console.log('Получено объявлений:', ads.length);
        
        // Отображаем объявления
        displayAds(ads, filters.city);

    } catch (error) {
        console.error('Ошибка загрузки объявлений:', error);
        const adsList = document.getElementById('adsList');
        if (adsList) {
            adsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">⚠️</div>
                    <h3>Ошибка загрузки</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

// Вспомогательная функция для получения всех объявлений
async function getAllAds() {
    const ads = await window.SupabaseClient.getAds();
    
    // Сортируем: сначала закрепленные (и еще не истекшие), потом обычные по дате
    const now = new Date();
    return ads.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        // Если оба закреплены или оба не закреплены, сортируем по дате
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

function displayAds(ads, city = null) {
    const adsList = document.getElementById('adsList');
    
    if (!ads || ads.length === 0) {
        adsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">😔</div>
                <h3>Пока нет объявлений</h3>
                <p>Будьте первым, кто разместит объявление!</p>
            </div>
        `;
        return;
    }

    // Фильтруем по городу если задан
    let filteredAds = city ? ads.filter(ad => ad.city === city) : ads;
    
    // Сортируем: закрепленные вверху
    const now = new Date();
    filteredAds = filteredAds.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        return new Date(b.created_at) - new Date(a.created_at);
    });

    adsList.innerHTML = filteredAds.map((ad, index) => {
        // Supabase возвращает поля с подчёркиваниями (age_from, my_age и т.д.)
        const myAge = ad.my_age || ad.myAge || '?';
        const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > now);
        
        return `
        <div class="ad-card" onclick="showAdDetails(${index})">
            ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
            <div class="ad-info">
                <div class="ad-field">
                    <span class="icon">🏙</span>
                    <span class="label">Город:</span>
                    <span class="value">${ad.city}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">👤</span>
                    <span class="label">Пол:</span>
                    <span class="value">${ad.gender}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🔍</span>
                    <span class="label">Ищет:</span>
                    <span class="value">${ad.target}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🎯</span>
                    <span class="label">Цель:</span>
                    <span class="value">${ad.goal}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🎂</span>
                    <span class="label">Возраст:</span>
                    <span class="value">${myAge} лет</span>
                </div>
            </div>
            <div class="ad-text">
                "${ad.text.substring(0, 100)}${ad.text.length > 100 ? '...' : ''}"
            </div>
        </div>
    `;
    }).join('');
    
    // Сохраняем объявления для showAdDetails
    window.currentAds = filteredAds;
}

function handleCityFilter(city) {
    // Сброс выбора
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Выбор нового города
    document.querySelector(`[data-city="${city}"].filter`).classList.add('selected');

    // Запрос объявлений по городу
    tg.sendData(JSON.stringify({
        action: 'getAdsByCity',
        city: city
    }));
}

function showAdDetails(index) {
    const ad = window.currentAds?.[index];
    
    if (!ad) {
        alert('Объявление не найдено');
        return;
    }
    
    const adContent = document.getElementById('adContent');
    if (!adContent) return;
    
    // Сохраняем индекс для кнопки "Написать автору"
    window.currentAdIndex = index;
    
    const myAge = ad.my_age || ad.myAge || '?';
    const ageFrom = ad.age_from || ad.ageFrom || '?';
    const ageTo = ad.age_to || ad.ageTo || '?';
    const bodyType = ad.body_type || ad.body || '?';
    
    adContent.innerHTML = `
        <div class="ad-full">
            <div class="ad-header">
                <h3>📍 ${ad.city}</h3>
                <span class="ad-date">${new Date(ad.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            
            <div class="ad-info-grid">
                <div class="info-item">
                    <span class="icon">👤</span>
                    <div>
                        <div class="label">Пол</div>
                        <div class="value">${ad.gender}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <span class="icon">🔍</span>
                    <div>
                        <div class="label">Ищет</div>
                        <div class="value">${ad.target}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <span class="icon">🎯</span>
                    <div>
                        <div class="label">Цель</div>
                        <div class="value">${ad.goal}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <span class="icon">📅</span>
                    <div>
                        <div class="label">Возраст партнера</div>
                        <div class="value">${ageFrom} - ${ageTo} лет</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <span class="icon">🎂</span>
                    <div>
                        <div class="label">Мой возраст</div>
                        <div class="value">${myAge} лет</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <span class="icon">💪</span>
                    <div>
                        <div class="label">Телосложение</div>
                        <div class="value">${bodyType}</div>
                    </div>
                </div>
            </div>
            
            <div class="ad-description">
                <h4>💬 О себе:</h4>
                <p>${ad.text}</p>
            </div>
        </div>
    `;
    
    // Обновляем кнопку "Написать автору"
    const contactBtn = document.querySelector('#adDetails button.neon-button');
    if (contactBtn) {
        contactBtn.onclick = () => contactAuthor(index);
    }
    
    showScreen('adDetails');
}

// Написать автору объявления
async function contactAuthor(adIndex) {
    const ad = window.currentAds?.[adIndex];
    
    if (!ad) {
        alert('Объявление не найдено');
        return;
    }
    
    // Проверяем авторизацию
    const currentUserId = getCurrentUserId();
    if (currentUserId.startsWith('web_')) {
        alert('⚠️ Для отправки сообщений необходимо авторизоваться через Telegram');
        showTelegramAuthModal();
        return;
    }
    
    // Проверяем, не пытается ли пользователь написать самому себе
    if (ad.tg_id === currentUserId) {
        alert('Вы не можете отправить сообщение на своё объявление');
        return;
    }
    
    // Запрашиваем текст сообщения
    const message = prompt('Введите сообщение автору объявления:');
    
    if (!message || message.trim() === '') {
        return;
    }
    
    try {
        // Получаем имя пользователя
        const savedUser = localStorage.getItem('telegram_user');
        let senderName = 'Пользователь';
        
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                senderName = userData.first_name || 'Пользователь';
                if (userData.last_name) {
                    senderName += ' ' + userData.last_name;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // Отправляем сообщение через API
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adId: ad.id,
                senderTgId: currentUserId,
                receiverTgId: ad.tg_id,
                messageText: message.trim(),
                senderName: senderName
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Сообщение отправлено!\n\nАвтор объявления получит уведомление в Telegram боте и сможет начать с вами приватный чат.');
        } else {
            alert('❌ Ошибка при отправке сообщения: ' + (result.error || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('❌ Ошибка при отправке сообщения. Попробуйте позже.');
    }
}

// Удалить мое объявление
async function deleteMyAd(adId) {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) {
        return;
    }
    
    try {
        const deleted = await window.SupabaseClient.deleteAd(adId);
        
        if (deleted) {
            tg.showAlert('✅ Объявление успешно удалено');
            // Перезагружаем список
            loadMyAds();
        } else {
            tg.showAlert('❌ Не удалось удалить объявление');
        }
    } catch (error) {
        console.error('Error deleting ad:', error);
        tg.showAlert('❌ Ошибка при удалении объявления');
    }
}

// Закрепить/открепить мое объявление
async function pinMyAd(adId, shouldPin) {
    try {
        const pinned = await window.SupabaseClient.togglePinAd(adId, shouldPin);
        
        if (pinned) {
            if (shouldPin) {
                tg.showAlert('✅ Функция успешно оплачена и включена!\n\nВаше объявление будет закреплено поверх других на 24 часа.');
            } else {
                tg.showAlert('✅ Объявление откреплено');
            }
            // Перезагружаем список
            loadMyAds();
        } else {
            tg.showAlert('❌ Не удалось изменить статус закрепления');
        }
    } catch (error) {
        console.error('Error pinning ad:', error);
        tg.showAlert('❌ Ошибка при изменении статуса закрепления');
    }
}

// Автоопределение локации
function autoDetectLocation() {
    if (!navigator.geolocation) {
        alert('❌ Геолокация не поддерживается вашим браузером');
        return;
    }
    
    // Показываем loading
    const setupContainer = document.querySelector('.location-setup-container');
    if (setupContainer) {
        setupContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>📍 Определяем вашу локацию...</p>
                <p style="font-size: 0.9rem; opacity: 0.7;">Пожалуйста, разрешите доступ к геолокации</p>
            </div>
        `;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Координаты:', latitude, longitude);
            
            try {
                // Используем BigDataCloud API (бесплатный, без ключа)
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ru`);
                
                if (!response.ok) {
                    throw new Error('Ошибка API геокодирования');
                }
                
                const data = await response.json();
                console.log('Данные геокодирования:', data);
                
                const country = data.countryName;
                const region = data.principalSubdivision || data.locality;
                const city = data.city || data.locality;
                
                console.log('Обработанные данные:', { country, region, city });
                
                // Определяем, какая страна в нашем списке
                let detectedCountry = null;
                if (country && (country.includes('Росси') || country === 'Russia')) {
                    detectedCountry = 'russia';
                } else if (country && (country.includes('Казах') || country === 'Kazakhstan')) {
                    detectedCountry = 'kazakhstan';
                }
                
                if (detectedCountry && region && city) {
                    // Устанавливаем локацию
                    userLocation = {
                        country: detectedCountry,
                        region: region,
                        city: city
                    };
                    
                    localStorage.setItem('userLocation', JSON.stringify(userLocation));
                    
                    // Обновляем отображение
                    updateUserLocationDisplay();
                    
                    alert(`✅ Локация определена:\n${locationData[detectedCountry].flag} ${region}, ${city}`);
                    
                    // Возвращаемся в главное меню
                    setTimeout(() => showMainMenu(), 500);
                } else {
                    // Показываем то что получили
                    console.log('Не удалось определить:', { detectedCountry, region, city, rawCountry: country });
                    alert(`❌ Не удалось определить локацию.\n\nПолучены данные: ${country || 'неизвестно'}\n\nПожалуйста, выберите вручную.`);
                    // Перезагружаем экран локации
                    showLocationSetup();
                }
                
            } catch (error) {
                console.error('Ошибка геокодирования:', error);
                alert('❌ Ошибка при определении локации. Пожалуйста, выберите вручную.');
                showLocationSetup();
            }
        },
        (error) => {
            console.error('Ошибка геолокации:', error);
            let errorMsg = '❌ Не удалось получить доступ к геолокации.\n\n';
            if (error.code === 1) {
                errorMsg += 'Вы отклонили запрос на доступ к геолокации.';
            } else if (error.code === 2) {
                errorMsg += 'Геолокация недоступна.';
            } else if (error.code === 3) {
                errorMsg += 'Превышено время ожидания.';
            }
            errorMsg += '\n\nПожалуйста, выберите локацию вручную.';
            
            alert(errorMsg);
            showLocationSetup();
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

// Сброс формы
function resetForm() {
    formData = {};
    currentStep = 1;
    
    // Сброс всех выборов
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Очистка полей
    document.getElementById('customCity').value = '';
    document.getElementById('ageFrom').value = '';
    document.getElementById('ageTo').value = '';
    document.getElementById('myAge').value = '';
    document.getElementById('adText').value = '';
    
    showStep(1);
}

// Функция загрузки Email Service
async function loadEmailService() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './email-service.js';
        script.onload = () => {
            console.log('✅ Email Service загружен');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Ошибка загрузки Email Service');
            reject(new Error('Failed to load Email Service'));
        };
        document.head.appendChild(script);
    });
}

// Обработка данных от бота
tg.onEvent('web_app_data_received', function(data) {
    try {
        const response = JSON.parse(data);
        
        switch(response.action) {
            case 'adsLoaded':
                displayAds(response.ads);
                break;
            case 'cityAdsLoaded':
                displayAds(response.ads, response.city);
                break;
            case 'adCreated':
                tg.showAlert('Объявление создано!');
                showMainMenu();
                break;
            default:
                console.log('Unknown response:', response);
        }
    } catch (error) {
        console.error('Error parsing bot data:', error);
    }
});

// Данные локаций
const locationData = {
    russia: {
        name: 'Россия',
        flag: '🇷🇺',
        regions: {
            'Москва': ['Москва'],
            'Санкт-Петербург': ['Санкт-Петербург'],
            'Московская область': ['Балашиха', 'Подольск', 'Химки', 'Королёв', 'Мытищи', 'Люберцы', 'Красногорск', 'Электросталь', 'Коломна', 'Одинцово'],
            'Ленинградская область': ['Гатчина', 'Выборг', 'Сосновый Бор', 'Тихвин', 'Кириши', 'Волхов'],
            'Новосибирская область': ['Новосибирск', 'Бердск', 'Искитим', 'Куйбышев', 'Обь'],
            'Свердловская область': ['Екатеринбург', 'Нижний Тагил', 'Каменск-Уральский', 'Первоуральск', 'Серов'],
            'Татарстан': ['Казань', 'Набережные Челны', 'Нижнекамск', 'Альметьевск', 'Зеленодольск'],
            'Краснодарский край': ['Краснодар', 'Сочи', 'Новороссийск', 'Армавир', 'Геленджик'],
            'Ростовская область': ['Ростов-на-Дону', 'Таганрог', 'Шахты', 'Новочеркасск', 'Волгодонск'],
            'Челябинская область': ['Челябинск', 'Магнитогорск', 'Златоуст', 'Миасс', 'Копейск'],
            'Нижегородская область': ['Нижний Новгород', 'Дзержинск', 'Арзамас', 'Саров', 'Бор'],
            'Калининградская область': ['Калининград', 'Советск', 'Черняховск', 'Балтийск'],
            'Калужская область': ['Калуга', 'Обнинск', 'Людиново'],
            'Курская область': ['Курск', 'Железногорск', 'Курчатов'],
            'Кемеровская область': ['Кемерово', 'Новокузнецк', 'Прокопьевск', 'Междуреченск'],
            'Кировская область': ['Киров', 'Кирово-Чепецк', 'Вятские Поляны'],
            'Костромская область': ['Кострома', 'Буй', 'Нерехта']
        }
    },
    kazakhstan: {
        name: 'Казахстан',
        flag: '🇰🇿',
        regions: {
            'Алматинская область': ['Алматы', 'Талдыкорган', 'Капчагай', 'Текели', 'Жаркент'],
            'Нур-Султан': ['Нур-Султан (Астана)'],
            'Шымкент': ['Шымкент'],
            'Актюбинская область': ['Актобе', 'Хромтау', 'Алга', 'Темир'],
            'Атырауская область': ['Атырау', 'Кульсары', 'Жылыой'],
            'Западно-Казахстанская область': ['Уральск', 'Аксай', 'Казталовка'],
            'Карагандинская область': ['Караганда', 'Темиртау', 'Жезказган', 'Балхаш'],
            'Костанайская область': ['Костанай', 'Рудный', 'Житикара', 'Лисаковск'],
            'Мангистауская область': ['Актау', 'Жанаозен', 'Бейнеу'],
            'Павлодарская область': ['Павлодар', 'Экибастуз', 'Аксу'],
            'Северо-Казахстанская область': ['Петропавловск', 'Булаево', 'Тайынша'],
            'Восточно-Казахстанская область': ['Усть-Каменогорск', 'Семей', 'Риддер', 'Зыряновск'],
            'Жамбылская область': ['Тараз', 'Жанатас', 'Каратау', 'Шу'],
            'Кызылординская область': ['Кызылорда', 'Байконур', 'Арал']
        }
    }
};

// Переменные для системы локации
let selectedCountry = null;
let selectedRegion = null;
let selectedCity = null;

// Переменные для настройки локации
let setupSelectedCountry = null;
let setupSelectedRegion = null;
let setupSelectedCity = null;

// Сохраненная локация пользователя
let userLocation = null;

// Переменные для фильтра в просмотре объявлений
let filterSelectedCountry = null;
let filterSelectedRegion = null;
let filterSelectedCity = null;

// Проверка сохраненной локации пользователя
function checkUserLocation() {
    console.log('checkUserLocation вызвана');
    // Попробуем получить локацию из Telegram Web App Storage
    try {
        if (tg.CloudStorage) {
            console.log('Используем Telegram Cloud Storage');
            tg.CloudStorage.getItem('userLocation', function(err, value) {
                console.log('CloudStorage результат:', {err, value});
                if (!err && value) {
                    userLocation = JSON.parse(value);
                    console.log('Найдена сохраненная локация:', userLocation);
                    displayUserLocation();
                    showMainMenu();
                } else {
                    console.log('Сохраненной локации нет, запускаем автоопределение');
                    // Автоматически определяем по IP
                    showAutoLocationDetection();
                }
            });
        } else {
            console.log('Используем localStorage');
            // Fallback - используем localStorage
            const savedLocation = localStorage.getItem('userLocation');
            console.log('localStorage результат:', savedLocation);
            if (savedLocation) {
                userLocation = JSON.parse(savedLocation);
                console.log('Найдена сохраненная локация в localStorage:', userLocation);
                displayUserLocation();
                showMainMenu();
            } else {
                console.log('Сохраненной локации нет, запускаем автоопределение');
                // Автоматически определяем по IP
                showAutoLocationDetection();
            }
        }
    } catch (error) {
        console.error('Ошибка при получении локации:', error);
        showAutoLocationDetection();
    }
}

// Определение локации по IP
async function detectLocationByIP() {
    const detectionText = document.querySelector('.detection-text');
    console.log('detectLocationByIP вызвана');
    console.log('detectionText элемент найден:', !!detectionText);
    
    if (!detectionText) {
        console.error('Элемент .detection-text не найден!');
        showPopularLocations();
        return;
    }
    
    try {
        console.log('Начинаем определение локации по IP...');
        
        // Обновляем текст анимации с красивыми фразами
        detectionText.textContent = 'Сканируем цифровой след';
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        detectionText.textContent = 'Анализируем сетевые маршруты';
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Пробуем несколько вариантов API
        detectionText.textContent = 'Определяем геолокацию';
        let locationData = null;
        
        // Вариант 1: ipinfo.io (часто работает без CORS)
        try {
            const response1 = await fetch('https://ipinfo.io/json');
            const data1 = await response1.json();
            if (data1 && data1.country) {
                locationData = {
                    country_code: data1.country,
                    country_name: data1.country,
                    region: data1.region,
                    city: data1.city
                };
            }
        } catch (e) {
            console.log('ipinfo.io недоступен:', e);
        }
        
        // Вариант 2: Если первый не сработал, пробуем другой
        if (!locationData) {
            try {
                const response2 = await fetch('https://api.ipify.org?format=json');
                const ipData = await response2.json();
                console.log('IP адрес:', ipData.ip);
                
                // Простое определение по часовому поясу
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                console.log('Часовой пояс:', timezone);
                
                locationData = guessLocationByTimezone(timezone);
            } catch (e) {
                console.log('Второй вариант не сработал:', e);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Данные геолокации:', locationData);
        
        if (locationData && locationData.country_code) {
            detectionText.textContent = 'Сопоставляем с базой данных';
            await new Promise(resolve => setTimeout(resolve, 600));
            
            detectionText.textContent = 'Почти готово';
            await new Promise(resolve => setTimeout(resolve, 400));
            
            const detectedLocation = processIPLocation(locationData);
            if (detectedLocation) {
                showDetectedLocationResult(detectedLocation);
                return;
            }
        }
        
        // Если все варианты не сработали - показываем популярные варианты
        showPopularLocations();
        
    } catch (error) {
        console.error('Ошибка определения локации по IP:', error);
        showPopularLocations();
    }
}

// Определение локации по часовому поясу
function guessLocationByTimezone(timezone) {
    console.log('Определяем по часовому поясу:', timezone);
    
    // Популярные города России и Казахстана
    const timezoneMap = {
        'Europe/Moscow': { country_code: 'RU', country_name: 'Россия', region: 'Москва', city: 'Москва' },
        'Europe/Samara': { country_code: 'RU', country_name: 'Россия', region: 'Самарская область', city: 'Самара' },
        'Asia/Yekaterinburg': { country_code: 'RU', country_name: 'Россия', region: 'Свердловская область', city: 'Екатеринбург' },
        'Asia/Novosibirsk': { country_code: 'RU', country_name: 'Россия', region: 'Новосибирская область', city: 'Новосибирск' },
        'Asia/Krasnoyarsk': { country_code: 'RU', country_name: 'Россия', region: 'Красноярский край', city: 'Красноярск' },
        'Asia/Irkutsk': { country_code: 'RU', country_name: 'Россия', region: 'Иркутская область', city: 'Иркутск' },
        'Asia/Vladivostok': { country_code: 'RU', country_name: 'Россия', region: 'Приморский край', city: 'Владивосток' },
        'Asia/Almaty': { country_code: 'KZ', country_name: 'Казахстан', region: 'Алматинская область', city: 'Алматы' },
        'Asia/Qyzylorda': { country_code: 'KZ', country_name: 'Казахстан', region: 'Кызылординская область', city: 'Кызылорда' },
        'Asia/Aqtobe': { country_code: 'KZ', country_name: 'Казахстан', region: 'Актюбинская область', city: 'Актобе' }
    };
    
    return timezoneMap[timezone] || null;
}

// Показать популярные локации для выбора
function showPopularLocations() {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Показываем популярные варианты
    resultDiv.innerHTML = `
        <div class="popular-locations">
            <div class="info-icon">🌍</div>
            <h3>Выберите ваш регион</h3>
            <p>Не удалось автоматически определить местоположение.<br>Выберите один из популярных вариантов:</p>
            
            <div class="popular-options">
                <button class="location-option russia" onclick="selectPopularLocation('russia', 'Москва', 'Москва')">
                    <span class="flag">🇷🇺</span>
                    <div class="location-details">
                        <strong>Россия</strong>
                        <span>Москва</span>
                    </div>
                </button>
                
                <button class="location-option russia" onclick="selectPopularLocation('russia', 'Санкт-Петербург', 'Санкт-Петербург')">
                    <span class="flag">🇷🇺</span>
                    <div class="location-details">
                        <strong>Россия</strong>
                        <span>Санкт-Петербург</span>
                    </div>
                </button>
                
                <button class="location-option kazakhstan" onclick="selectPopularLocation('kazakhstan', 'Алматинская область', 'Алматы')">
                    <span class="flag">🇰🇿</span>
                    <div class="location-details">
                        <strong>Казахстан</strong>
                        <span>Алматы</span>
                    </div>
                </button>
                
                <button class="location-option kazakhstan" onclick="selectPopularLocation('kazakhstan', 'Нур-Султан', 'Нур-Султан (Астана)')">
                    <span class="flag">🇰🇿</span>
                    <div class="location-details">
                        <strong>Казахстан</strong>
                        <span>Нур-Султан</span>
                    </div>
                </button>
            </div>
            
            <div class="manual-choice">
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Выбрать другую локацию
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Выбор популярной локации
function selectPopularLocation(country, region, city) {
    console.log('Выбрана популярная локация:', {country, region, city});
    confirmDetectedLocation(country, region, city);
}

// Обработка данных IP геолокации
function processIPLocation(data) {
    const countryCode = (data.country_code || data.country || '').toLowerCase();
    const regionName = data.region;
    const cityName = data.city;
    
    console.log('Обработка локации:', {countryCode, regionName, cityName});
    
    // Проверяем поддерживаемые страны
    let mappedCountry = null;
    if (countryCode === 'ru' || countryCode === 'russia') {
        mappedCountry = 'russia';
    } else if (countryCode === 'kz' || countryCode === 'kazakhstan') {
        mappedCountry = 'kazakhstan';
    }
    
    if (!mappedCountry) {
        console.log('Страна не поддерживается:', countryCode);
        return null;
    }
    
    // Пытаемся найти регион и город в наших данных
    const countryData = locationData[mappedCountry];
    let foundRegion = null;
    let foundCity = null;
    
    // Поиск региона
    if (regionName) {
        for (const region in countryData.regions) {
            if (region.toLowerCase().includes(regionName.toLowerCase()) || 
                regionName.toLowerCase().includes(region.toLowerCase())) {
                foundRegion = region;
                break;
            }
        }
    }
    
    // Поиск города
    if (cityName && foundRegion) {
        const cities = countryData.regions[foundRegion];
        foundCity = cities.find(city => 
            city.toLowerCase().includes(cityName.toLowerCase()) ||
            cityName.toLowerCase().includes(city.toLowerCase())
        );
    }
    
    // Если город не найден в определенном регионе, ищем по всем регионам
    if (cityName && !foundCity) {
        for (const region in countryData.regions) {
            const cities = countryData.regions[region];
            const city = cities.find(city => 
                city.toLowerCase().includes(cityName.toLowerCase()) ||
                cityName.toLowerCase().includes(city.toLowerCase())
            );
            if (city) {
                foundRegion = region;
                foundCity = city;
                break;
            }
        }
    }
    
    // Возвращаем найденную локацию или базовую для страны
    return {
        country: mappedCountry,
        region: foundRegion || Object.keys(countryData.regions)[0],
        city: foundCity || countryData.regions[foundRegion || Object.keys(countryData.regions)[0]][0],
        detected: {
            country: data.country_name,
            region: regionName,
            city: cityName
        }
    };
}

// Показать результат определения локации
function showDetectedLocationResult(detectedLocation) {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    const countryFlag = locationData[detectedLocation.country].flag;
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Показываем результат
    resultDiv.innerHTML = `
        <div class="detected-location">
            <div class="success-icon">✨</div>
            <h3>Мы правильно определили ваше местоположение?</h3>
            <div class="location-info">
                <span class="location-flag">${countryFlag}</span>
                <span class="location-text">${detectedLocation.region}, ${detectedLocation.city}</span>
            </div>
            <p class="detection-note">Определено по IP-адресу: ${detectedLocation.detected.country}${detectedLocation.detected.region ? ', ' + detectedLocation.detected.region : ''}${detectedLocation.detected.city ? ', ' + detectedLocation.detected.city : ''}</p>
            <div class="location-actions">
                <button class="confirm-btn" onclick="confirmDetectedLocation('${detectedLocation.country}', '${detectedLocation.region}', '${detectedLocation.city}')">
                    ✅ Да, всё верно
                </button>
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Нет, выбрать другую
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Показать ошибку определения IP
function showIPDetectionError() {
    const animationDiv = document.querySelector('.detection-animation');
    const resultDiv = document.querySelector('.detection-result');
    
    // Скрываем анимацию
    animationDiv.style.display = 'none';
    
    // Показываем ошибку
    resultDiv.innerHTML = `
        <div class="detection-error">
            <div class="error-icon">😔</div>
            <h3>Не удалось определить местоположение</h3>
            <p>Возможно, ваша страна не поддерживается или есть проблемы с подключением к интернету</p>
            <div class="location-actions">
                <button class="manual-btn" onclick="showManualLocationSetup()">
                    🎯 Выбрать вручную
                </button>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Подтвердить определенную локацию
function confirmDetectedLocation(country, region, city) {
    console.log('Подтверждение автоматической локации:', {country, region, city});
    saveUserLocation(country, region, city);
    displayUserLocation();
    updateFormLocationDisplay();
    showMainMenu();
}

// Сбросить сохраненную локацию и запустить автоопределение
function resetAndDetectLocation() {
    console.log('Сброс локации и запуск автоопределения');
    
    // Очищаем сохраненные данные
    try {
        if (tg.CloudStorage) {
            tg.CloudStorage.removeItem('userLocation', function(err) {
                if (err) {
                    console.error('Ошибка удаления из CloudStorage:', err);
                } else {
                    console.log('Локация удалена из CloudStorage');
                }
            });
        }
        localStorage.removeItem('userLocation');
        console.log('Локация удалена из localStorage');
    } catch (error) {
        console.error('Ошибка очистки данных:', error);
    }
    
    // Сбрасываем переменную
    userLocation = null;
    
    // Запускаем автоопределение
    showAutoLocationDetection();
}

// Отображение текущей локации пользователя
function displayUserLocation() {
    if (userLocation) {
        const locationText = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        const locationDisplay = document.getElementById('userLocationDisplay');
        if (locationDisplay) {
            locationDisplay.textContent = locationText;
        }
        console.log('Текущая локация пользователя:', locationText);
    }
}

// Сохранение локации пользователя
function saveUserLocation(country, region, city) {
    userLocation = {
        country: country,
        region: region,
        city: city,
        timestamp: Date.now()
    };
    
    try {
        if (tg.CloudStorage) {
            tg.CloudStorage.setItem('userLocation', JSON.stringify(userLocation), function(err) {
                if (!err) {
                    console.log('Локация сохранена в Telegram Cloud Storage');
                } else {
                    console.error('Ошибка сохранения в Cloud Storage:', err);
                    localStorage.setItem('userLocation', JSON.stringify(userLocation));
                }
            });
        } else {
            localStorage.setItem('userLocation', JSON.stringify(userLocation));
            console.log('Локация сохранена в localStorage');
        }
    } catch (error) {
        console.error('Ошибка сохранения локации:', error);
    }
}

// Показать экран автоматического определения локации
function showAutoLocationDetection() {
    console.log('Показываем экран автоматического определения локации');
    showScreen('autoLocationDetection');
    // Запускаем определение через небольшую задержку для показа анимации
    setTimeout(() => {
        console.log('Запускаем определение локации по IP');
        detectLocationByIP();
    }, 1000);
}

// Показать экран ручной настройки локации
function showManualLocationSetup() {
    showScreen('locationSetup');
    resetSetupLocation();
}

// Показать экран настройки локации (старая функция для совместимости)
function showLocationSetup() {
    showManualLocationSetup();
}

// Сохранить локацию и перейти к главному меню
function saveLocationAndContinue() {
    if (setupSelectedCountry && setupSelectedRegion && setupSelectedCity) {
        saveUserLocation(setupSelectedCountry, setupSelectedRegion, setupSelectedCity);
        displayUserLocation();
        updateFormLocationDisplay();
        showMainMenu();
    } else {
        tg.showAlert('Пожалуйста, выберите страну, регион и город');
    }
}

// Инициализация системы локации
function initLocationSelector() {
    // Обработчики для кнопок стран (форма создания)
    document.querySelectorAll('.form-country:not(.filter-country)').forEach(btn => {
        btn.addEventListener('click', function() {
            selectCountry(this.dataset.country);
        });
    });
    
    // Обработчики для кнопок стран (фильтр просмотра)
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.addEventListener('click', function() {
            selectFilterCountry(this.dataset.country);
        });
    });
    
    // Обработчики для экрана настройки локации
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.addEventListener('click', function() {
            selectSetupCountry(this.dataset.country);
        });
    });

    // Обработчики для полей ввода регионов и городов (форма создания)
    const regionInput = document.querySelector('.form-region-input:not(.filter-region-input)');
    const cityInput = document.querySelector('.form-city-input:not(.filter-city-input)');
    
    if (regionInput) {
        regionInput.addEventListener('input', function() {
            handleRegionInput(this.value);
        });
        
        regionInput.addEventListener('keyup', function() {
            handleRegionInput(this.value);
        });
        
        regionInput.addEventListener('focus', function() {
            showAllRegions();
        });
        
        regionInput.addEventListener('click', function() {
            showAllRegions();
        });
    }
    
    if (cityInput) {
        cityInput.addEventListener('input', function() {
            handleCityInput(this.value);
        });
        
        cityInput.addEventListener('keyup', function() {
            handleCityInput(this.value);
        });
        
        cityInput.addEventListener('focus', function() {
            if (selectedRegion) {
                showAllCities();
            }
        });
        
        cityInput.addEventListener('click', function() {
            if (selectedRegion) {
                showAllCities();
            }
        });
    }
    
    // Обработчики для полей ввода фильтра
    const filterRegionInput = document.querySelector('.filter-region-input');
    const filterCityInput = document.querySelector('.filter-city-input');
    
    if (filterRegionInput) {
        filterRegionInput.addEventListener('input', function() {
            handleFilterRegionInput(this.value);
        });
        
        filterRegionInput.addEventListener('keyup', function() {
            handleFilterRegionInput(this.value);
        });
        
        filterRegionInput.addEventListener('focus', function() {
            showAllFilterRegions();
        });
        
        filterRegionInput.addEventListener('click', function() {
            showAllFilterRegions();
        });
    }
    
    if (filterCityInput) {
        filterCityInput.addEventListener('input', function() {
            handleFilterCityInput(this.value);
        });
        
        filterCityInput.addEventListener('keyup', function() {
            handleFilterCityInput(this.value);
        });
        
        filterCityInput.addEventListener('focus', function() {
            if (filterSelectedRegion) {
                showAllFilterCities();
            }
        });
        
        filterCityInput.addEventListener('click', function() {
            if (filterSelectedRegion) {
                showAllFilterCities();
            }
        });
    }
    
    // Обработчики для полей настройки локации
    const setupRegionInput = document.querySelector('.setup-region-input');
    const setupCityInput = document.querySelector('.setup-city-input');
    
    console.log('Настройка обработчиков для настройки локации');
    console.log('setupRegionInput найден:', !!setupRegionInput);
    console.log('setupCityInput найден:', !!setupCityInput);
    
    if (setupRegionInput) {
        setupRegionInput.addEventListener('input', function() {
            console.log('input событие на регион в настройке:', this.value);
            handleSetupRegionInput(this.value);
        });
        
        setupRegionInput.addEventListener('keyup', function() {
            handleSetupRegionInput(this.value);
        });
        
        setupRegionInput.addEventListener('focus', function() {
            // Всегда показываем все регионы при фокусе, независимо от содержимого
            showAllSetupRegions();
        });
        
        setupRegionInput.addEventListener('click', function() {
            showAllSetupRegions();
        });
    }
    
    if (setupCityInput) {
        setupCityInput.addEventListener('input', function() {
            console.log('input событие на город в настройке:', this.value);
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('keyup', function() {
            console.log('keyup событие на город в настройке:', this.value);
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('focus', function() {
            console.log('focus событие на город в настройке');
            if (setupSelectedRegion) {
                // Задержка чтобы избежать конфликта с hideAllSuggestions
                setTimeout(() => {
                    showAllSetupCities();
                }, 50);
            } else {
                console.log('Регион не выбран, не показываем города');
            }
        });
        
        setupCityInput.addEventListener('click', function(e) {
            console.log('click событие на город в настройке');
            e.stopPropagation(); // Останавливаем всплытие события
            if (setupSelectedRegion) {
                setTimeout(() => {
                    showAllSetupCities();
                }, 50);
            }
        });
        
        setupCityInput.addEventListener('mousedown', function(e) {
            console.log('mousedown событие на город в настройке');
            e.stopPropagation(); // Останавливаем всплытие события
        });
    }
    
    // Кнопка сброса локации (форма)
    const resetBtn = document.querySelector('.reset-form-location:not(.reset-filter-location)');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetLocationSelection);
    }
    
    // Кнопка сброса локации (фильтр)
    const resetFilterBtn = document.querySelector('.reset-filter-location');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilterLocationSelection);
    }
    
    // Кнопка сброса настройки локации
    const resetSetupBtn = document.querySelector('.reset-setup-location');
    if (resetSetupBtn) {
        resetSetupBtn.addEventListener('click', resetSetupLocation);
    }

    // Скрытие списков при клике вне их
    document.addEventListener('click', function(e) {
        // Не скрываем если клик по полю ввода или списку предложений
        if (!e.target.closest('.search-container') && !e.target.classList.contains('setup-region-input') && !e.target.classList.contains('setup-city-input')) {
            hideAllSuggestions();
        }
    });
}

// Выбор страны
function selectCountry(countryCode) {
    selectedCountry = countryCode;
    selectedRegion = null;
    selectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.form-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"]`).classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.form-region-selection');
    regionSection.style.display = 'block';
    setTimeout(() => {
        regionSection.style.opacity = '1';
    }, 50);
    
    // Скрываем остальные секции
    document.querySelector('.form-city-selection').style.display = 'none';
    document.querySelector('.form-selected-location').style.display = 'none';
    
    // Очищаем поля
    document.querySelector('.form-region-input').value = '';
    document.querySelector('.form-city-input').value = '';
    
    console.log('Выбрана страна:', locationData[countryCode].name);
}

// Обработка ввода региона
function handleRegionInput(value) {
    if (!selectedCountry) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[selectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showRegionSuggestions(filtered);
}

// Показать все регионы
function showAllRegions() {
    if (!selectedCountry) return;
    
    const regions = Object.keys(locationData[selectedCountry].regions);
    showRegionSuggestions(regions);
}

// Показать предложения регионов
function showRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.form-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор региона
function selectRegion(regionName) {
    selectedRegion = regionName;
    selectedCity = null;
    
    document.querySelector('.form-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.form-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    document.querySelector('.form-city-input').value = '';
    document.querySelector('.form-city-input').focus();
    
    console.log('Выбран регион:', regionName);
}

// Обработка ввода города
function handleCityInput(value) {
    if (!selectedCountry || !selectedRegion) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[selectedCountry].regions[selectedRegion];
    const filtered = cities.filter(city => 
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showCitySuggestions(filtered);
}

// Показать все города
function showAllCities() {
    if (!selectedCountry || !selectedRegion) return;
    
    const cities = locationData[selectedCountry].regions[selectedRegion];
    showCitySuggestions(cities);
}

// Показать предложения городов
function showCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.form-city-suggestions');
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор города
function selectCity(cityName) {
    selectedCity = cityName;
    
    document.querySelector('.form-city-input').value = cityName;
    hideAllSuggestions();
    
    // Обновляем данные формы
    formData.country = selectedCountry;
    formData.region = selectedRegion;
    formData.city = cityName;
    
    // Показываем выбранную локацию
    showSelectedLocation();
    
    console.log('Выбран город:', cityName);
    console.log('Полная локация:', `${locationData[selectedCountry].name}, ${selectedRegion}, ${cityName}`);
}

// Показать выбранную локацию
function showSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.form-selected-location');
    const locationText = document.querySelector('.form-location-text');
    
    const fullLocation = `${locationData[selectedCountry].flag} ${selectedRegion}, ${selectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    document.querySelector('.form-region-selection').style.display = 'none';
    document.querySelector('.form-city-selection').style.display = 'none';
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Сброс выбора локации
function resetLocationSelection() {
    selectedCountry = null;
    selectedRegion = null;
    selectedCity = null;
    
    // Очищаем данные формы
    delete formData.country;
    delete formData.region;
    delete formData.city;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.form-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода (с проверкой существования)
    const regionInput = document.querySelector('.form-region-input');
    const cityInput = document.querySelector('.form-city-input');
    if (regionInput) regionInput.value = '';
    if (cityInput) cityInput.value = '';
    
    // Скрываем все секции кроме выбора страны (с проверкой существования)
    const regionSection = document.querySelector('.form-region-selection');
    const citySection = document.querySelector('.form-city-selection');
    const selectedSection = document.querySelector('.form-selected-location');
    if (regionSection) regionSection.style.display = 'none';
    if (citySection) citySection.style.display = 'none';
    if (selectedSection) selectedSection.style.display = 'none';
    
    hideAllSuggestions();
    
    console.log('Выбор локации сброшен');
}

// Скрыть все списки предложений
function hideAllSuggestions() {
    document.querySelectorAll('.suggestions-list').forEach(list => {
        list.classList.remove('active');
        list.style.display = 'none';
        list.innerHTML = '';
    });
}

// Скрыть все списки кроме указанного
function hideOtherSuggestions(keepClass) {
    document.querySelectorAll('.suggestions-list').forEach(list => {
        if (!list.classList.contains(keepClass)) {
            list.classList.remove('active');
            list.style.display = 'none';
            list.innerHTML = '';
        }
    });
}

// Обновляем обработчики событий
function setupEventListeners() {
    // Инициализируем систему локации
    initLocationSelector();
    
    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGender(btn.dataset.gender));
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTarget(btn.dataset.target));
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGoal(btn.dataset.goal));
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => selectBody(btn.dataset.body));
    });

    // Фильтры в просмотре объявлений
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.addEventListener('click', function() {
            handleCityFilter(this.dataset.city);
        });
    });
}

// Обновляем валидацию первого шага
function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            // Первый шаг - выбор пола
            return formData.gender;
        case 2:
            return formData.target;
        case 3:
            return formData.goal;
        case 4:
            const ageFrom = document.getElementById('ageFrom').value;
            const ageTo = document.getElementById('ageTo').value;
            if (ageFrom && ageTo) {
                formData.ageFrom = ageFrom;
                formData.ageTo = ageTo;
                return true;
            }
            return false;
        case 5:
            const myAge = document.getElementById('myAge').value;
            if (myAge) {
                formData.myAge = myAge;
                return true;
            }
            return false;
        case 6:
            return formData.body;
        case 7:
            const adText = document.getElementById('adText').value.trim();
            if (adText) {
                formData.text = adText;
                return true;
            }
            return false;
    }
    return false;
}

// Обновляем сброс формы
function resetForm() {
    formData = {};
    currentStep = 1;
    
    // Сброс системы локации
    resetLocationSelection();
    
    // Сброс всех выборов
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Очистка полей
    document.getElementById('ageFrom').value = '';
    document.getElementById('ageTo').value = '';
    document.getElementById('myAge').value = '';
    document.getElementById('adText').value = '';
    
    showStep(1);
}

// === ФУНКЦИИ ДЛЯ ФИЛЬТРА В ПРОСМОТРЕ ОБЪЯВЛЕНИЙ ===

// Выбор страны для фильтра
function selectFilterCountry(countryCode) {
    filterSelectedCountry = countryCode;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"].filter-country`).classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.filter-region-selection');
    regionSection.style.display = 'block';
    setTimeout(() => {
        regionSection.style.opacity = '1';
    }, 50);
    
    // Скрываем остальные секции
    document.querySelector('.filter-city-selection').style.display = 'none';
    document.querySelector('.filter-selected-location').style.display = 'none';
    
    // Очищаем поля
    document.querySelector('.filter-region-input').value = '';
    document.querySelector('.filter-city-input').value = '';
    
    console.log('Выбрана страна для фильтра:', locationData[countryCode].name);
}

// Обработка ввода региона для фильтра
function handleFilterRegionInput(value) {
    if (!filterSelectedCountry) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[filterSelectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showFilterRegionSuggestions(filtered);
}

// Показать все регионы для фильтра
function showAllFilterRegions() {
    if (!filterSelectedCountry) return;
    
    const regions = Object.keys(locationData[filterSelectedCountry].regions);
    showFilterRegionSuggestions(regions);
}

// Показать предложения регионов для фильтра
function showFilterRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.filter-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectFilterRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('active');
}

// Выбор региона для фильтра
function selectFilterRegion(regionName) {
    filterSelectedRegion = regionName;
    filterSelectedCity = null;
    
    document.querySelector('.filter-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.filter-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    document.querySelector('.filter-city-input').value = '';
    document.querySelector('.filter-city-input').focus();
    
    console.log('Выбран регион для фильтра:', regionName);
}

// Обработка ввода города для фильтра
function handleFilterCityInput(value) {
    if (!filterSelectedCountry || !filterSelectedRegion) return;
    
    // Если поле пустое, скрываем предложения
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[filterSelectedCountry].regions[filterSelectedRegion];
    const filtered = cities.filter(city => 
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showFilterCitySuggestions(filtered);
}

// Показать все города для фильтра
function showAllFilterCities() {
    if (!filterSelectedCountry || !filterSelectedRegion) return;
    
    const cities = locationData[filterSelectedCountry].regions[filterSelectedRegion];
    showFilterCitySuggestions(cities);
}

// Показать предложения городов для фильтра
function showFilterCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.filter-city-suggestions');
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectFilterCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('active');
}

// Выбор города для фильтра
function selectFilterCity(cityName) {
    filterSelectedCity = cityName;
    
    document.querySelector('.filter-city-input').value = cityName;
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showFilterSelectedLocation();
    
    // Загружаем объявления по выбранной локации
    loadAdsByLocation(filterSelectedCountry, filterSelectedRegion, cityName);
    
    console.log('Выбран город для фильтра:', cityName);
    console.log('Полная локация фильтра:', `${locationData[filterSelectedCountry].name}, ${filterSelectedRegion}, ${cityName}`);
}

// Показать выбранную локацию для фильтра
function showFilterSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.filter-selected-location');
    const locationText = document.querySelector('.filter-location-text');
    
    const fullLocation = `${locationData[filterSelectedCountry].flag} ${filterSelectedRegion}, ${filterSelectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    document.querySelector('.filter-region-selection').style.display = 'none';
    document.querySelector('.filter-city-selection').style.display = 'none';
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Установка UI фильтра на основе локации пользователя
function setFilterLocationUI() {
    if (!userLocation) {
        console.log('setFilterLocationUI: локация пользователя не установлена');
        return;
    }
    
    console.log('setFilterLocationUI: устанавливаем UI для локации', userLocation);
    
    // Устанавливаем активную кнопку страны
    const countryButtons = document.querySelectorAll('.filter-country');
    console.log('Найдено кнопок стран для фильтра:', countryButtons.length);
    
    countryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.country === userLocation.country) {
            btn.classList.add('active');
            console.log('Активирована кнопка страны:', btn.dataset.country);
        }
    });
    
    // Заполняем поля ввода
    const regionInput = document.querySelector('.filter-region-input');
    const cityInput = document.querySelector('.filter-city-input');
    
    console.log('regionInput найден:', !!regionInput);
    console.log('cityInput найден:', !!cityInput);
    
    if (regionInput) regionInput.value = userLocation.region;
    if (cityInput) cityInput.value = userLocation.city;
    
    // Показываем все секции как заполненные
    const regionSection = document.querySelector('.filter-region-selection');
    const citySection = document.querySelector('.filter-city-selection');
    const selectedLocationDiv = document.querySelector('.filter-selected-location');
    const locationText = document.querySelector('.filter-location-text');
    
    console.log('Секции найдены:', {
        regionSection: !!regionSection,
        citySection: !!citySection,
        selectedLocationDiv: !!selectedLocationDiv,
        locationText: !!locationText
    });
    
    if (regionSection) {
        regionSection.style.display = 'block';
        regionSection.style.opacity = '1';
    }
    
    if (citySection) {
        citySection.style.display = 'block';
        citySection.style.opacity = '1';
    }
    
    if (selectedLocationDiv && locationText) {
        const fullLocation = `${locationData[userLocation.country].flag} ${userLocation.region}, ${userLocation.city}`;
        locationText.textContent = fullLocation;
        selectedLocationDiv.style.display = 'block';
        selectedLocationDiv.style.opacity = '1';
        console.log('Установлен текст локации:', fullLocation);
    }
    
    console.log('UI фильтра установлен на локацию пользователя:', userLocation);
}

// Сброс выбора локации для фильтра
function resetFilterLocationSelection() {
    filterSelectedCountry = null;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода
    document.querySelector('.filter-region-input').value = '';
    document.querySelector('.filter-city-input').value = '';
    
    // Скрываем все секции кроме выбора страны
    document.querySelector('.filter-region-selection').style.display = 'none';
    document.querySelector('.filter-city-selection').style.display = 'none';
    document.querySelector('.filter-selected-location').style.display = 'none';
    
    hideAllSuggestions();
    
    // Загружаем все объявления
    loadAds();
    
    console.log('Выбор локации фильтра сброшен');
}

// Загрузка объявлений по локации
function loadAdsByLocation(country, region, city) {
    try {
        console.log('Запрос объявлений по локации:', {country, region, city});
        
        // Формируем фильтры для загрузки
        const filters = {};
        if (country) filters.country = country;
        if (city) filters.city = city;
        
        // Загружаем через наш API
        loadAds(filters);
        
    } catch (error) {
        console.error('Ошибка загрузки объявлений по локации:', error);
    }
}

// === ФУНКЦИИ ДЛЯ НАСТРОЙКИ ЛОКАЦИИ ===

// Выбор страны в настройке
function selectSetupCountry(countryCode) {
    setupSelectedCountry = countryCode;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"].setup-country`).classList.add('active');
    
    // Показываем выбор региона с анимацией
    const regionSection = document.querySelector('.setup-region-selection');
    regionSection.style.display = 'block';
    setTimeout(() => {
        regionSection.style.opacity = '1';
    }, 50);
    
    // Скрываем остальные секции
    document.querySelector('.setup-city-selection').style.display = 'none';
    document.querySelector('.setup-selected-location').style.display = 'none';
    
    // Очищаем поля
    document.querySelector('.setup-region-input').value = '';
    document.querySelector('.setup-city-input').value = '';
    
    console.log('Выбрана страна для настройки:', locationData[countryCode].name);
}

// Обработка ввода региона в настройке
function handleSetupRegionInput(value) {
    if (!setupSelectedCountry) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[setupSelectedCountry].regions);
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showSetupRegionSuggestions(filtered);
}

// Показать все регионы в настройке
function showAllSetupRegions() {
    if (!setupSelectedCountry) return;
    
    const regions = Object.keys(locationData[setupSelectedCountry].regions);
    showSetupRegionSuggestions(regions);
}

// Показать предложения регионов в настройке
function showSetupRegionSuggestions(regions) {
    const suggestionsContainer = document.querySelector('.setup-region-suggestions');
    
    if (regions.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    suggestionsContainer.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectSetupRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
}

// Выбор региона в настройке
function selectSetupRegion(regionName) {
    setupSelectedRegion = regionName;
    setupSelectedCity = null;
    
    document.querySelector('.setup-region-input').value = regionName;
    hideAllSuggestions();
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.setup-city-selection');
    citySection.style.display = 'block';
    setTimeout(() => {
        citySection.style.opacity = '1';
    }, 50);
    
    // Очищаем поле города
    const cityInput = document.querySelector('.setup-city-input');
    cityInput.value = '';
    
    console.log('Выбран регион в настройке:', regionName);
    console.log('Доступные города:', locationData[setupSelectedCountry].regions[regionName]);
    
    // Показываем все доступные города для выбранного региона
    setTimeout(() => {
        showAllSetupCities();
    }, 100);
}

// Обработка ввода города в настройке
function handleSetupCityInput(value) {
    console.log('handleSetupCityInput вызвана со значением:', value);
    console.log('setupSelectedCountry:', setupSelectedCountry);
    console.log('setupSelectedRegion:', setupSelectedRegion);
    
    if (!setupSelectedCountry || !setupSelectedRegion) {
        console.log('Страна или регион не выбраны, выходим');
        return;
    }
    
    if (!value.trim()) {
        console.log('Пустое значение, скрываем предложения');
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[setupSelectedCountry].regions[setupSelectedRegion];
    console.log('Доступные города:', cities);
    
    const filtered = cities.filter(city => 
        city.toLowerCase().startsWith(value.toLowerCase())
    );
    console.log('Отфильтрованные города:', filtered);
    
    showSetupCitySuggestions(filtered);
}

// Показать все города в настройке
function showAllSetupCities() {
    console.log('showAllSetupCities вызвана');
    console.log('setupSelectedCountry:', setupSelectedCountry);
    console.log('setupSelectedRegion:', setupSelectedRegion);
    
    if (!setupSelectedCountry || !setupSelectedRegion) {
        console.log('Страна или регион не выбраны, не показываем города');
        return;
    }
    
    const cities = locationData[setupSelectedCountry].regions[setupSelectedRegion];
    console.log('Города для региона', setupSelectedRegion, ':', cities);
    
    // Принудительно скрываем другие списки перед показом нового
    hideOtherSuggestions('setup-city-suggestions');
    showSetupCitySuggestions(cities);
}

// Показать предложения городов в настройке
function showSetupCitySuggestions(cities) {
    const suggestionsContainer = document.querySelector('.setup-city-suggestions');
    
    console.log('showSetupCitySuggestions вызвана с городами:', cities);
    console.log('Контейнер найден:', suggestionsContainer);
    
    if (!suggestionsContainer) {
        console.error('Контейнер для предложений городов не найден!');
        return;
    }
    
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.classList.remove('active');
        return;
    }
    
    // Очищаем и заполняем контент
    suggestionsContainer.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectSetupCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    // Принудительно показываем
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.classList.add('active');
    
    // Дополнительная проверка что элемент видим
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(suggestionsContainer);
        console.log('Стиль display после показа:', computedStyle.display);
        console.log('Класс active есть:', suggestionsContainer.classList.contains('active'));
    }, 10);
    console.log('Список городов отображен, HTML:', suggestionsContainer.innerHTML);
}

// Выбор города в настройке
function selectSetupCity(cityName) {
    setupSelectedCity = cityName;
    
    document.querySelector('.setup-city-input').value = cityName;
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showSetupSelectedLocation();
    
    console.log('Выбран город в настройке:', cityName);
}

// Показать выбранную локацию в настройке
function showSetupSelectedLocation() {
    const selectedLocationDiv = document.querySelector('.setup-selected-location');
    const locationText = document.querySelector('.setup-location-text');
    
    const fullLocation = `${locationData[setupSelectedCountry].flag} ${setupSelectedRegion}, ${setupSelectedCity}`;
    locationText.textContent = fullLocation;
    
    // Скрываем секции выбора
    document.querySelector('.setup-region-selection').style.display = 'none';
    document.querySelector('.setup-city-selection').style.display = 'none';
    
    // Показываем выбранную локацию с анимацией
    selectedLocationDiv.style.display = 'block';
    setTimeout(() => {
        selectedLocationDiv.style.opacity = '1';
    }, 50);
}

// Сброс настройки локации
function resetSetupLocation() {
    setupSelectedCountry = null;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода
    document.querySelector('.setup-region-input').value = '';
    document.querySelector('.setup-city-input').value = '';
    
    // Скрываем все секции кроме выбора страны
    document.querySelector('.setup-region-selection').style.display = 'none';
    document.querySelector('.setup-city-selection').style.display = 'none';
    document.querySelector('.setup-selected-location').style.display = 'none';
    
    hideAllSuggestions();
    
    console.log('Настройка локации сброшена');
}

// Отладочные функции
window.debugApp = {
    formData: () => console.log(formData),
    currentStep: () => console.log(currentStep),
    tg: () => console.log(tg),
    locationData: () => console.log(locationData),
    selectedLocation: () => console.log({selectedCountry, selectedRegion, selectedCity}),
    filterLocation: () => console.log({filterSelectedCountry, filterSelectedRegion, filterSelectedCity}),
    setupLocation: () => console.log({setupSelectedCountry, setupSelectedRegion, setupSelectedCity}),
    userLocation: () => console.log(userLocation),
    checkStorage: () => {
        const localData = localStorage.getItem('userLocation');
        console.log('localStorage userLocation:', localData);
        if (tg.CloudStorage) {
            tg.CloudStorage.getItem('userLocation', (err, value) => {
                console.log('CloudStorage userLocation:', {err, value});
            });
        }
    },
    clearUserLocation: () => {
        if (tg.CloudStorage) {
            tg.CloudStorage.removeItem('userLocation');
        }
        localStorage.removeItem('userLocation');
        userLocation = null;
        showAutoLocationDetection();
    },
    forceAutoDetection: () => {
        showAutoLocationDetection();
    }
};

// =============== ГАМБУРГЕР МЕНЮ ===============

function toggleHamburgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    overlay.classList.toggle('active');
}

function closeHamburgerMenu() {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    overlay.classList.remove('active');
}

// Закрытие меню при клике на overlay
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeHamburgerMenu();
        }
    });
});

// Функции навигации по меню
function goToHome() {
    closeHamburgerMenu();
    showMainMenu();
    updateActiveMenuItem('home');
}

function showContacts() {
    closeHamburgerMenu();
    showScreen('contacts');
    updateActiveMenuItem('contacts');
}

// Флаг для отслеживания инициализации обработчиков формы
let emailFormHandlersInitialized = false;

function showEmailForm() {
    showScreen('emailForm');
    // Очищаем форму при открытии
    document.getElementById('senderEmail').value = '';
    document.getElementById('emailSubject').value = 'Обращение через anonimka.online';
    document.getElementById('emailMessage').value = '';
    document.getElementById('emailStatus').style.display = 'none';
    
    // Показываем подсказку
    showEmailStatus('loading', '💡 Заполните форму ниже. Письмо будет отправлено через защищённый сервер anonimka.online');
    
    // Инициализируем обработчики только один раз
    if (!emailFormHandlersInitialized) {
        setTimeout(() => {
            setupEmailFormHandlers();
        }, 100);
    }
}

// Отдельная функция для настройки обработчиков формы (вызывается только один раз)
function setupEmailFormHandlers() {
    const contactForm = document.getElementById('contactForm');
    
    console.log('setupEmailFormHandlers вызвана');
    console.log('contactForm найдена:', !!contactForm);
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleEmailSubmit);
        console.log('Обработчик submit добавлен к форме');
        emailFormHandlersInitialized = true;
    }
}

function showRules() {
    closeHamburgerMenu();
    showScreen('rules');
    updateActiveMenuItem('rules');
}

function showPrivacy() {
    closeHamburgerMenu();
    showScreen('privacy');
    updateActiveMenuItem('privacy');
}

function showAbout() {
    closeHamburgerMenu();
    showScreen('about');
    updateActiveMenuItem('about');
}

function updateActiveMenuItem(activeId) {
    // Убираем активный класс со всех элементов
    document.querySelectorAll('.hamburger-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем активный класс к нужному элементу
    const activeItem = document.querySelector(`.hamburger-item[onclick*="${activeId}"], .hamburger-item[onclick="goToHome()"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Функции для контактов
function openEmailComposer() {
    console.log('openEmailComposer вызвана');
    const recipient = 'aleksey@vorobey444.ru';
    const subject = encodeURIComponent('Обращение через anonimka.online');
    const body = encodeURIComponent(`Здравствуйте!\n\nПишу вам через анонимную доску объявлений anonimka.online\n\n[Опишите вашу проблему или вопрос]\n\nС уважением,\n[Ваше имя]`);
    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
}

function openTelegramChat() {
    console.log('openTelegramChat вызвана');
    
    const telegramUrl = 'https://t.me/Vorobey_444';
    
    // Пробуем открыть через Telegram Web App API
    if (tg && tg.openTelegramLink) {
        console.log('Используем tg.openTelegramLink');
        tg.openTelegramLink(telegramUrl);
    } else if (tg && tg.openLink) {
        console.log('Используем tg.openLink');
        tg.openLink(telegramUrl);
    } else {
        console.log('Используем window.open как fallback');
        // Fallback - обычная ссылка
        window.open(telegramUrl, '_blank');
    }
}

// Настройка обработчиков событий для контактов
function setupContactsEventListeners() {
    console.log('Настройка обработчиков контактов');
    
    // НЕ добавляем обработчики формы здесь - они добавляются в setupEmailFormHandlers
    // который вызывается из showEmailForm()
    
    // Добавляем обработчики событий для Telegram контакта
    const telegramContact = document.querySelector('.contact-item[onclick*="openTelegramChat"]');
    
    if (telegramContact) {
        console.log('Найден элемент telegram контакта, добавляем обработчик');
        telegramContact.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Клик по telegram контакту');
            openTelegramChat();
        });
    }
}

// Обработчик отправки письма - ГЛОБАЛЬНАЯ ФУНКЦИЯ
window.handleEmailSubmit = async function(event) {
    if (event) event.preventDefault();
    console.log('🚀 handleEmailSubmit вызвана - РАБОТАЕТ!');
    
    const senderEmail = document.getElementById('senderEmail');
    const subject = document.getElementById('emailSubject');
    const message = document.getElementById('emailMessage');
    const sendBtn = document.getElementById('sendEmailBtn');
    
    console.log('Элементы формы:', {
        senderEmail: !!senderEmail,
        subject: !!subject, 
        message: !!message,
        sendBtn: !!sendBtn
    });
    
    if (!senderEmail || !subject || !message) {
        console.error('❌ Не найдены элементы формы!');
        alert('Ошибка: элементы формы не найдены');
        return;
    }
    
    const emailValue = senderEmail.value.trim();
    const subjectValue = subject.value.trim();
    const messageValue = message.value.trim();
    
    console.log('Значения полей:', { emailValue, subjectValue, messageValue });
    
    // Валидация
    if (!emailValue || !messageValue) {
        console.log('❌ Валидация не прошла: пустые поля');
        showEmailStatus('error', '❌ Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (messageValue.length < 3) {
        console.log('❌ Валидация не прошла: короткое сообщение');
        showEmailStatus('error', '❌ Сообщение должно содержать минимум 3 символа');
        return;
    }
    
    console.log('✅ Валидация прошла успешно');
    
    // Подготавливаем данные письма заранее (нужно и для fallback в catch)
    const emailData = {
        senderEmail: (senderEmail?.value || '').trim(),
        subject: (subject?.value || 'Обращение через anonimka.online').trim() || 'Обращение через anonimka.online',
        message: (message?.value || '').trim()
    };

    // Показываем загрузку
    showEmailStatus('loading', '📤 Отправляем письмо...');
    if (sendBtn) sendBtn.disabled = true;
    
    try {
        // Обновим данные из проверенных полей (для надёжности)
        emailData.senderEmail = emailValue;
        emailData.subject = subjectValue || emailData.subject;
        emailData.message = messageValue;

        console.log('📧 Пытаемся отправить через бэкенд...');
        
        // Сначала пытаемся отправить через бэкенд
        const result = await sendEmailToBackend(emailData);
        
        // Если бэкенд сработал успешно
        if (result && result.success) {
            console.log('✅ Письмо отправлено через бэкенд!');
            showEmailStatus('success', '✅ Письмо успешно отправлено!');
            
            // Очищаем форму
            document.getElementById('senderEmail').value = '';
            document.getElementById('emailSubject').value = 'Обращение через anonimka.online';
            document.getElementById('emailMessage').value = '';
            
            return; // Выходим из функции, не переходя к mailto
        }
        
        // Если бэкенд не сработал, fallback не нужен для localhost
        // (ошибка будет обработана в catch блоке)
        
    } catch (error) {
        console.error('❌ Ошибка при отправке через бэкенд:', error);
        
        // Fallback: открываем mailto
        console.log('📧 Переходим к mailto fallback...');
        
        const subject_encoded = encodeURIComponent(`[anonimka.online] ${emailData.subject}`);
        const body_encoded = encodeURIComponent(`От: ${emailData.senderEmail}
Сообщение с сайта anonimka.online

${emailData.message}

---
Пожалуйста, отвечайте на адрес: ${emailData.senderEmail}
Время отправки: ${new Date().toLocaleString('ru-RU')}`);

        const mailtoLink = `mailto:aleksey@vorobey444.ru?subject=${subject_encoded}&body=${body_encoded}`;
        
        console.log('📧 Mailto ссылка создана:', mailtoLink);
        
        // Открываем почтовый клиент
        window.open(mailtoLink, '_blank');
        
        showEmailStatus('success', '✅ Почтовый клиент открыт! Если письмо не открылось, данные для ручной отправки ниже:');
        
        // Показываем данные для ручной отправки
        setTimeout(() => {
            showManualEmailOption(emailData);
        }, 2000);
    } finally {
        if (sendBtn) sendBtn.disabled = false;
    }
};
// Показать опцию ручной отправки
function showManualEmailOption(emailData) {
    const statusDiv = document.getElementById('emailStatus');
    statusDiv.className = 'email-status error';
    statusDiv.innerHTML = `
        📋 <strong>Данные для ручной отправки:</strong>
        <br><br>
        <strong>На:</strong> aleksey@vorobey444.ru<br>
        <strong>От:</strong> ${emailData.senderEmail}<br>
        <strong>Тема:</strong> ${emailData.subject}<br>
        <strong>Сообщение:</strong><br>
        ${emailData.message.replace(/\n/g, '<br>')}
        <br><br>
        <button class="neon-button secondary" onclick="copyEmailData('${emailData.senderEmail}', '${emailData.subject.replace(/'/g, "\\'")}', '${emailData.message.replace(/'/g, "\\'")}')">
            📋 Копировать данные
        </button>
        <button class="neon-button primary" onclick="openManualMailto('${emailData.senderEmail}', '${emailData.subject.replace(/'/g, "\\'")}', '${emailData.message.replace(/'/g, "\\'")}')">
            📧 Открыть почту
        </button>
    `;
}

// Копировать данные письма
function copyEmailData(senderEmail, subject, message) {
    const emailText = `На: aleksey@vorobey444.ru
От: ${senderEmail}
Тема: ${subject}

${message}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(emailText).then(() => {
            showEmailStatus('success', '✅ Данные письма скопированы в буфер обмена');
        });
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = emailText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showEmailStatus('success', '✅ Данные письма скопированы в буфер обмена');
    }
}

// Открыть почтовый клиент вручную
function openManualMailto(senderEmail, subject, message) {
    const mailtoData = {
        senderEmail,
        subject,
        message
    };
    
    sendEmailViaMailto(mailtoData).then(result => {
        if (result.success) {
            showEmailStatus('success', result.message);
        } else {
            showEmailStatus('error', result.error);
        }
    });
}

// Глобальные функции для использования в onclick
window.copyEmailData = copyEmailData;
window.openManualMailto = openManualMailto;

// Показать статус отправки
function showEmailStatus(type, message) {
    const statusDiv = document.getElementById('emailStatus');
    statusDiv.className = `email-status ${type}`;
    
    if (type === 'loading') {
        statusDiv.innerHTML = `<div class="loading-spinner"></div>${message}`;
    } else {
        statusDiv.innerHTML = message;
    }
    
    statusDiv.style.display = 'block';
    
    // Автоматически скрываем сообщение через 5 секунд (кроме ошибок)
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Отправка письма на бэкенд
async function sendEmailToBackend(emailData) {
    try {
        // Определяем URL бэкенда
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        console.log('Текущий хост:', window.location.hostname);
        console.log('Это localhost?', isLocalhost);
        
        // Для локального тестирования используем Yandex Email сервер
        if (isLocalhost) {
            const backendUrl = 'http://localhost:5000/send-email';
            console.log('📧 Отправляем через Yandex SMTP сервер:', backendUrl);
            console.log('📨 Данные письма:', emailData);
            
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
                console.error('❌ Ошибка HTTP:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Детали ошибки:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Успешная отправка через Yandex:', result);
            return result;
        }
        
        // Для продакшена используем простую отправку как в whish.online
        console.log('📧 Продакшен: отправляем как в whish.online - просто и надёжно...');
        
        // Загружаем простую функцию email
        if (typeof window.sendEmailWhishStyle === 'undefined') {
            console.log('Загружаем Email Service...');
            await loadEmailService();
        }

        // Используем простую функцию отправки
        return window.sendEmailWhishStyle(emailData);
    } catch (error) {
        console.log('Бэкенд недоступен, используем альтернативный способ');
        console.error('Ошибка при отправке на бэкенд:', error);
        
        // Если бэкенд недоступен, используем Telegram Bot API
        return await sendEmailViaTelegram(emailData);
    }
}

// Альтернативная отправка через Telegram бота или mailto
async function sendEmailViaTelegram(emailData) {
    try {
        // Сначала пробуем через Telegram Web App
        if (tg && tg.sendData) {
            console.log('Отправляем через Telegram Web App');
            tg.sendData(JSON.stringify({
                action: 'sendEmail',
                data: {
                    senderEmail: emailData.senderEmail,
                    subject: emailData.subject,
                    message: emailData.message
                }
            }));
            
            return {
                success: true,
                message: 'Сообщение отправлено через Telegram бота'
            };
        } else {
            console.log('Telegram Web App недоступен, используем mailto');
            // Используем стандартный mailto как последний вариант
            return sendEmailViaMailto(emailData);
        }
    } catch (error) {
        console.error('Ошибка Telegram отправки:', error);
        return sendEmailViaMailto(emailData);
    }
}

// Отправка через стандартный mailto
async function sendEmailViaMailto(emailData) {
    try {
        const subject = encodeURIComponent(`[anonimka.online] ${emailData.subject}`);
        const body = encodeURIComponent(`От: ${emailData.senderEmail}
Сообщение с сайта anonimka.online

${emailData.message}

---
Пожалуйста, отвечайте на адрес: ${emailData.senderEmail}
Время отправки: ${new Date().toLocaleString('ru-RU')}`);

        const mailtoLink = `mailto:aleksey@vorobey444.ru?subject=${subject}&body=${body}`;
        
        // Открываем почтовый клиент
        window.open(mailtoLink, '_blank');
        
        return {
            success: true,
            message: 'Открыт почтовый клиент для отправки. Если письмо не открылось автоматически, скопируйте данные и отправьте вручную.'
        };
    } catch (error) {
        console.error('Ошибка mailto:', error);
        return {
            success: false,
            error: 'Не удалось открыть почтовый клиент. Отправьте письмо вручную на aleksey@vorobey444.ru'
        };
    }
}
