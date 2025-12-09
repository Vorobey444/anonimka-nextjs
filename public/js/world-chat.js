
let currentWorldChatTab = 'world';
let worldChatAutoRefreshInterval = null;
let worldChatLastMessageTime = null;
let worldChatLoadingController = null; // Для отмены предыдущих запросов

// Показать экран Мир чата
async function showWorldChat() {
    console.log('🌍 Открытие Мир чата');
    showScreen('worldChatScreen');
    
    // Применяем сохраненный размер шрифта
    const savedSize = localStorage.getItem('worldChatFontSize') || 'medium';
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (messagesContainer) {
        messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
        messagesContainer.classList.add(`font-${savedSize}`);
    }
    
    // Обновляем кнопку размера шрифта
    const btn = document.getElementById('fontSizeBtn');
    if (btn) {
        if (savedSize === 'small') {
            btn.style.fontSize = '12px';
        } else if (savedSize === 'medium') {
            btn.style.fontSize = '14px';
        } else {
            btn.style.fontSize = '17px';
        }
    }
    
    // Загружаем сообщения
    await loadWorldChatMessages();
    
    // Прокручиваем вниз после первой загрузки
    setTimeout(() => {
        const container = document.getElementById('worldChatMessages');
        const scrollContainer = container?.parentElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, 100);
    
    // Обновляем счетчик символов
    updateWorldChatCharCount();
    
    // Запускаем автообновление каждые 3 секунды
    if (worldChatAutoRefreshInterval) {
        clearInterval(worldChatAutoRefreshInterval);
    }
    worldChatAutoRefreshInterval = setInterval(() => {
        loadWorldChatMessages(true); // silent reload
    }, 3000);
}

// Переключение размера шрифта
function toggleFontSize() {
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (!messagesContainer) return;
    
    // Получаем текущий размер из localStorage или дефолтный 'medium'
    let currentSize = localStorage.getItem('worldChatFontSize') || 'medium';
    
    // Переключаем на следующий размер
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    // Удаляем старые классы и добавляем новый
    messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
    messagesContainer.classList.add(`font-${nextSize}`);
    
    // Сохраняем в localStorage
    localStorage.setItem('worldChatFontSize', nextSize);
    
    // Обновляем текст кнопки
    const btn = document.getElementById('fontSizeBtn');
    if (btn) {
        if (nextSize === 'small') {
            btn.textContent = 'A';
            btn.style.fontSize = '12px';
        } else if (nextSize === 'medium') {
            btn.textContent = 'A';
            btn.style.fontSize = '14px';
        } else {
            btn.textContent = 'A';
            btn.style.fontSize = '17px';
        }
    }
    
    console.log('📏 Размер шрифта:', nextSize);
}

// Переключение вкладок
async function switchWorldChatTab(tab) {
    console.log('🔄 Переключение на вкладку:', tab);
    
    // Отменяем предыдущий запрос если есть
    if (worldChatLoadingController) {
        worldChatLoadingController.abort();
    }
    
    currentWorldChatTab = tab;
    
    // Сбрасываем кеш ID сообщений при переключении вкладок
    lastWorldChatMessageIds = [];
    
    // Обновляем активную кнопку
    document.querySelectorAll('.world-chat-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    // Обновляем префикс и очищаем поле при переключении на Мир или Город
    const prefixElement = document.getElementById('worldChatPrefix');
    const input = document.getElementById('worldChatInput');
    
    if (tab === 'world') {
        prefixElement.textContent = '@';
        prefixElement.style.color = '#FFD700';
        // Очищаем поле если там был никнейм для личного сообщения
        if (input.value.trim()) {
            input.value = '';
        }
    } else if (tab === 'city') {
        prefixElement.textContent = '&';
        prefixElement.style.color = '#00D9FF';
        // Очищаем поле если там был никнейм для личного сообщения
        if (input.value.trim()) {
            input.value = '';
        }
    } else if (tab === 'private') {
        prefixElement.textContent = '/';
        prefixElement.style.color = '#FF006E';
    }
    
    // Очищаем контейнер перед загрузкой новых сообщений
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="loading-placeholder">
                <div class="neon-icon pulse">💬</div>
                <p>Загрузка сообщений...</p>
            </div>
        `;
    }
    
    // Загружаем сообщения для этой вкладки
    await loadWorldChatMessages();
}

// Загрузить сообщения
async function loadWorldChatMessages(silent = false) {
    try {
        // Создаем новый AbortController для этого запроса
        worldChatLoadingController = new AbortController();
        const requestTab = currentWorldChatTab; // Сохраняем текущую вкладку
        
        const userToken = localStorage.getItem('user_token');
        const userCity = localStorage.getItem('userCity') || 'Алматы';
        
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-messages',
                params: {
                    tab: requestTab,
                    userToken: userToken,
                    userCity: userCity
                }
            }),
            signal: worldChatLoadingController.signal
        });
        
        const data = await response.json();
        
        // Проверяем что вкладка не изменилась пока грузились данные
        if (requestTab !== currentWorldChatTab) {
            console.log(`⏭️ Пропускаем рендер для ${requestTab}, текущая вкладка: ${currentWorldChatTab}`);
            return;
        }
        
        if (data.success) {
            if (!silent) {
                console.log(`✅ Загружено ${data.data.length} сообщений для вкладки ${requestTab}`);
            }
            renderWorldChatMessages(data.data);
        } else {
            console.error('❌ Ошибка загрузки сообщений:', data.error);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏹️ Запрос отменен (переключение вкладки)');
        } else {
            console.error('Ошибка загрузки сообщений:', error);
        }
    }
}

// Кэш последних ID сообщений для предотвращения моргания
let lastWorldChatMessageIds = [];

// Функция цензуры матерных слов
function censorMessage(text) {
    if (!text) return text;
    
    // Список матерных слов и их вариаций
    const badWords = [
        // Основные маты
        'блять', 'бля', 'блядь', 'блят', 'бляд',
        'хуй', 'хуя', 'хуе', 'хую', 'хуи', 'хер',
        'пизда', 'пизд', 'пиздец', 'пизде', 'пизду',
        'ебать', 'ебал', 'ебан', 'еба', 'ебу', 'ебёт', 'ебёшь', 'ебля',
        'сука', 'суки', 'суку', 'сук',
        'гандон', 'гандоны', 'гондон',
        'мудак', 'мудила', 'мудаки', 'мудло',
        'долбоеб', 'долбоёб', 'дибил', 'дебил',
        'уебок', 'уёбок', 'ублюдок', 'ублюдки',
        'говно', 'говна', 'гавно',
        'жопа', 'жопы', 'жопу', 'жоп',
        'шлюха', 'шлюхи', 'шлюху',
        'петух', 'петухи', 'пидор', 'пидр', 'педик',
        'чмо', 'чмошник',
        // Латиница
        'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy',
        // Вариации с заменой букв
        'б л я', 'б л я т ь', 'х у й', 'п и з д а',
        'сцука', 'сучка', 'сучки',
        // Казахские маты
        'қарақшы', 'жесір', 'көтек'
    ];
    
    let censored = text;
    
    // Заменяем каждое матерное слово на звездочки
    badWords.forEach(word => {
        // Создаем регулярное выражение для поиска слова (игнорируем регистр)
        const regex = new RegExp(word.split('').map(char => {
            // Экранируем спецсимволы
            const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Добавляем возможные вариации с пробелами/точками между буквами
            return escaped + '[\\s\\.\\-_]*';
        }).join(''), 'gi');
        
        censored = censored.replace(regex, (match) => {
            return '*'.repeat(Math.max(4, match.length));
        });
        
        // Также простая замена без вариаций
        const simpleRegex = new RegExp(`\\b${word}\\b`, 'gi');
        censored = censored.replace(simpleRegex, '****');
    });
    
    return censored;
}

// Отрисовка сообщений
function renderWorldChatMessages(messages) {
    const container = document.getElementById('worldChatMessages');
    
    if (!container) {
        console.error('❌ Container worldChatMessages не найден');
        return;
    }
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="loading-placeholder">
                <div class="neon-icon">💬</div>
                <p>Пока нет сообщений</p>
                <p style="font-size: 12px; color: var(--text-gray);">Будьте первым!</p>
            </div>
        `;
        lastWorldChatMessageIds = [];
        return;
    }
    
    // Проверяем, изменились ли сообщения
    const currentIds = messages.map(m => m.id);
    const idsChanged = JSON.stringify(currentIds) !== JSON.stringify(lastWorldChatMessageIds);
    
    // Если сообщения не изменились, не перерисовываем
    if (!idsChanged) {
        return;
    }
    
    // Находим новые сообщения
    const newMessageIds = currentIds.filter(id => !lastWorldChatMessageIds.includes(id));
    const hasNewMessages = newMessageIds.length > 0;
    
    lastWorldChatMessageIds = currentIds;
    
    // Проверяем, есть ли placeholder загрузки (первая загрузка)
    const hasLoadingPlaceholder = container.querySelector('.loading-placeholder');
    
    // Если есть новые сообщения И в контейнере уже есть реальные сообщения (не placeholder)
    if (hasNewMessages && container.children.length > 0 && !hasLoadingPlaceholder) {
        const newMessages = messages.filter(m => newMessageIds.includes(m.id));
        newMessages.forEach(msg => {
            const messageHtml = createWorldChatMessageHtml(msg);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = messageHtml;
            const messageElement = tempDiv.firstElementChild;
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(10px)';
            container.appendChild(messageElement);
            
            // Плавное появление
            requestAnimationFrame(() => {
                messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        });
    } else {
        // Первая загрузка или есть placeholder - перерисовываем все
        container.innerHTML = messages.map(msg => createWorldChatMessageHtml(msg)).join('');
    }
    
    // ВСЕГДА прокручиваем вниз к новым сообщениям
    requestAnimationFrame(() => {
        const scrollContainer = container.parentElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    });
    
    // Добавляем обработчики long press для никнеймов
    setupLongPressHandlers();
}

// Создать HTML для одного сообщения (вынесено в отдельную функцию)
function createWorldChatMessageHtml(msg) {
        const isPremium = msg.is_premium || msg.isPremium || false;
        const nicknameClass = `${msg.type}-type${isPremium ? ' premium' : ''}`;
        const proBadge = isPremium ? '<span class="world-chat-pro-badge">⭐</span>' : '';
        const time = formatMessageTime(msg.created_at || msg.createdAt);
        
        // Для личных сообщений показываем "кому"
        let targetInfo = '';
        if (msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
            targetInfo = ` → ${msg.target_nickname || msg.targetNickname}`;
        }
        
        // Проверяем, это свой никнейм или чужой
        const currentUserToken = localStorage.getItem('user_token');
        const userToken = msg.user_token || msg.userToken;
        const isOwnMessage = userToken === currentUserToken;
        
        // Для своих личных сообщений при клике подставляем собеседника, а не себя
        let clickableNickname = msg.nickname;
        if (isOwnMessage && msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
            clickableNickname = msg.target_nickname || msg.targetNickname;
        }
        
        // Применяем цензуру к сообщению
        let censoredMessage = censorMessage(msg.message);
        
        // Убираем префиксы @ & / из начала сообщения для отображения
        if (censoredMessage.startsWith('@') || censoredMessage.startsWith('&') || censoredMessage.startsWith('/')) {
            censoredMessage = censoredMessage.substring(1).trim();
        }
        
        return `
            <div class="world-chat-message ${msg.type}-type">
                <div class="world-chat-header">
                    <div class="world-chat-nickname ${nicknameClass}" 
                         data-nickname="${escapeHtml(msg.nickname)}"
                         data-user-token="${userToken}"
                         data-is-own="${isOwnMessage}"
                         onclick="clickWorldChatNickname('${escapeHtml(clickableNickname)}')"
                         oncontextmenu="return showWorldChatContextMenu(event, '${escapeHtml(msg.nickname)}', '${userToken}', ${isOwnMessage})">
                        ${escapeHtml(msg.nickname)}${proBadge}${targetInfo}
                    </div>
                    <div class="world-chat-time">${time}</div>
                </div>
                <div class="world-chat-text">${escapeHtml(censoredMessage)}</div>
            </div>
        `;
}

// Настройка long press для мобильных устройств
function setupLongPressHandlers() {
    const nicknames = document.querySelectorAll('.world-chat-nickname');
    
    nicknames.forEach(nickname => {
        let pressTimer;
        
        // Touch events для мобильных
        nickname.addEventListener('touchstart', function(e) {
            const nick = this.getAttribute('data-nickname');
            const token = this.getAttribute('data-user-token');
            const isOwn = this.getAttribute('data-is-own') === 'true';
            
            pressTimer = setTimeout(() => {
                // Вибрация при долгом нажатии (если поддерживается)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                showWorldChatContextMenu(e, nick, token, isOwn);
            }, 500); // 500ms для long press
        });
        
        nickname.addEventListener('touchend', function() {
            clearTimeout(pressTimer);
        });
        
        nickname.addEventListener('touchmove', function() {
            clearTimeout(pressTimer);
        });
    });
}

// Клик на никнейм - добавить в инпут для личного сообщения
function clickWorldChatNickname(nickname) {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix');
    
    // НЕ переключаемся на вкладку ЛС, остаемся где есть
    // Просто меняем префикс на / для личного сообщения
    input.value = `${nickname} `;
    prefix.textContent = '/';
    prefix.style.color = '#FF006E';
    input.focus();
}

// Отправить сообщение
async function sendWorldChatMessage() {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix').textContent;
    let message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Добавляем префикс
    message = prefix + message;
    
    // Проверяем длину (120 символов без префикса)
    if (message.length - 1 > 120) {
        tg.showAlert('Максимум 120 символов');
        return;
    }
    
    try {
        const userToken = localStorage.getItem('user_token');
        const nickname = localStorage.getItem('userNickname') || 'Аноним';
        const isPremium = userPremiumStatus.isPremium || false;
        const city = localStorage.getItem('userCity') || 'Алматы';
        
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-message',
                params: {
                    userToken: userToken,
                    nickname: nickname,
                    message: message,
                    isPremium: isPremium,
                    city: city
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Сообщение отправлено');
            input.value = '';
            updateWorldChatCharCount();
            
            // Автопереключение после отправки ЛС
            if (prefix === '/') {
                // Если были на вкладке Мир - переключаемся обратно на @ (Мир)
                if (currentWorldChatTab === 'world') {
                    console.log('🔄 Автоматическое переключение на общий чат Мир (@)');
                    await switchWorldChatTab('world');
                }
                // Если были на вкладке Город - переключаемся обратно на & (Город)
                else if (currentWorldChatTab === 'city') {
                    console.log('🔄 Автоматическое переключение на общий чат Город (&)');
                    await switchWorldChatTab('city');
                }
                // Если на вкладке ЛС - просто обновляем
                else {
                    await loadWorldChatMessages();
                }
            } else {
                // Обычное обновление сообщений для @ и &
                await loadWorldChatMessages();
            }
        } else {
            console.error('❌ Ошибка отправки:', data.error);
            
            // Если это таймаут - показываем сообщение от сервера (там правильное время)
            if (response.status === 429) {
                tg.showAlert(data.error || 'Подождите немного перед отправкой');
            } else {
                tg.showAlert(data.error || 'Ошибка отправки сообщения');
            }
        }
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        tg.showAlert('Ошибка отправки сообщения');
    }
}

// Обновление счетчика символов
function updateWorldChatCharCount() {
    const input = document.getElementById('worldChatInput');
    const counter = document.getElementById('worldChatCharCount');
    
    if (input && counter) {
        // Обновляем счетчик сразу
        const length = input.value.length;
        counter.textContent = length;
        
        if (length > 45) {
            counter.style.color = '#FF006E';
        } else {
            counter.style.color = 'var(--text-gray)';
        }
        
        // И добавляем listener для дальнейших изменений
        input.addEventListener('input', () => {
            const length = input.value.length;
            counter.textContent = length;
            
            if (length > 45) {
                counter.style.color = '#FF006E';
            } else {
                counter.style.color = 'var(--text-gray)';
            }
        });
    }
}

// Загрузить превью последнего сообщения для кнопки
async function loadWorldChatPreview() {
    try {
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-last-message'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const preview = document.getElementById('worldChatPreview');
            const msg = data.data;
            // Убираем @ из сообщения
            const cleanMessage = msg.message.replace(/^[@&\/]\s*/, '');
            preview.textContent = `${msg.nickname}: ${cleanMessage}`;
        }
    } catch (error) {
        console.error('Ошибка загрузки превью:', error);
    }
}

// Контекстное меню (ПКМ + долгое нажатие)
function showWorldChatContextMenu(event, nickname, userToken, isOwnMessage = false) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Контекстное меню для', nickname, 'isOwn:', isOwnMessage);
    
    // Создаём модальное окно с опциями
    const modal = document.createElement('div');
    modal.className = 'world-chat-context-menu';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.98);
        border: 2px solid var(--neon-cyan);
        border-radius: 16px;
        padding: 20px;
        z-index: 10000;
        min-width: 280px;
        animation: fadeIn 0.2s ease;
    `;
    
    // Если это свой никнейм - показываем специальное окно
    if (isOwnMessage) {
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan); margin-bottom: 5px;">
                    ${escapeHtml(nickname)}
                </div>
                <div style="font-size: 12px; color: var(--text-gray);">
                    Это Вы
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="closeWorldChatContextMenu()" style="
                    padding: 12px;
                    background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    Закрыть
                </button>
            </div>
        `;
    } else {
        // Обычное меню для других пользователей
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan); margin-bottom: 5px;">
                    ${escapeHtml(nickname)}
                </div>
                <div style="font-size: 12px; color: var(--text-gray);">
                    Выберите действие
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="worldChatPrivateMessage('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #FF006E, #C4005A);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    💌 Приват чат
                </button>
                <button onclick="worldChatBlockUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #555, #333);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    🚫 В ЧС
                </button>
                <button onclick="worldChatReportUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px;
                    background: linear-gradient(135deg, #FF4444, #CC0000);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    ⚠️ Пожаловаться
                </button>
                <button onclick="closeWorldChatContextMenu()" style="
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: var(--text-light);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    Отмена
                </button>
            </div>
        `;
    }
    
    // Overlay для закрытия при клике вне меню
    const overlay = document.createElement('div');
    overlay.className = 'world-chat-context-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
    `;
    overlay.onclick = closeWorldChatContextMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    return false;
}

// Закрыть контекстное меню
function closeWorldChatContextMenu() {
    const menu = document.querySelector('.world-chat-context-menu');
    const overlay = document.querySelector('.world-chat-context-overlay');
    if (menu) menu.remove();
    if (overlay) overlay.remove();
}

// Меню для удаления сообщения
function showDeleteMessageMenu(event, messageId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('Меню удаления для сообщения:', messageId);
    
    // Создаём модальное окно
    const modal = document.createElement('div');
    modal.className = 'delete-message-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.98);
        border: 2px solid var(--neon-red);
        border-radius: 16px;
        padding: 20px;
        z-index: 10000;
        min-width: 280px;
        animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 15px; text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: var(--neon-red); margin-bottom: 5px;">
                Удалить сообщение?
            </div>
            <div style="font-size: 12px; color: var(--text-gray);">
                Сообщение будет удалено у обоих пользователей
            </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="deleteMessage(${messageId})" style="
                padding: 12px;
                background: linear-gradient(135deg, #ff4444, #cc0000);
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">
                🗑️ Удалить сообщение
            </button>
            <button onclick="closeDeleteMessageMenu()" style="
                padding: 12px;
                background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">
                Отмена
            </button>
        </div>
    `;
    
    // Оверлей
    const overlay = document.createElement('div');
    overlay.className = 'delete-message-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        animation: fadeIn 0.2s ease;
    `;
    overlay.onclick = closeDeleteMessageMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    return false;
}

// Закрыть меню удаления

// Экспортируем функции в window для доступа из React
window.showWorldChat = showWorldChat;
window.switchWorldChatTab = switchWorldChatTab;
window.sendWorldChatMessage = sendWorldChatMessage;
window.toggleFontSize = toggleFontSize;
window.showWorldChatFAQ = showWorldChatFAQ;
window.updateWorldChatCharCount = updateWorldChatCharCount;

