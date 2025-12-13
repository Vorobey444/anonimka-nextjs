/**
 * Модуль Мир чата (world-chat.js)
 * 
 * Функции:
 * - Глобальный чат всех пользователей
 * - Городской чат
 * - Личные сообщения через мир чат
 * - Блокировка пользователей
 */

console.log('🌍 [WORLD-CHAT] Инициализация модуля мирового чата');

// Глобальные переменные
let currentWorldChatTab = 'world';
let worldChatAutoRefreshInterval = null;
let worldChatLoadingController = null;
let lastWorldChatMessageIds = [];

/**
 * Показать экран Мир чата
 */
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

/**
 * Переключение размера шрифта
 */
function toggleFontSize() {
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (!messagesContainer) return;
    
    let currentSize = localStorage.getItem('worldChatFontSize') || 'medium';
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
    messagesContainer.classList.add(`font-${nextSize}`);
    
    localStorage.setItem('worldChatFontSize', nextSize);
    
    const btn = document.getElementById('fontSizeBtn');
    if (btn) {
        btn.style.fontSize = nextSize === 'small' ? '12px' : nextSize === 'medium' ? '14px' : '17px';
    }
    
    console.log('📏 Размер шрифта:', nextSize);
}

/**
 * Переключение вкладок
 */
async function switchWorldChatTab(tab) {
    console.log('🔄 Переключение на вкладку:', tab);
    
    if (worldChatLoadingController) {
        worldChatLoadingController.abort();
    }
    
    currentWorldChatTab = tab;
    lastWorldChatMessageIds = [];
    
    document.querySelectorAll('.world-chat-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`)?.classList.add('active');
    
    const prefixElement = document.getElementById('worldChatPrefix');
    const input = document.getElementById('worldChatInput');
    
    if (tab === 'world') {
        prefixElement.textContent = '@';
        prefixElement.style.color = '#FFD700';
        if (input.value.trim()) input.value = '';
    } else if (tab === 'city') {
        prefixElement.textContent = '&';
        prefixElement.style.color = '#00D9FF';
        if (input.value.trim()) input.value = '';
    } else if (tab === 'private') {
        prefixElement.textContent = '/';
        prefixElement.style.color = '#FF006E';
    }
    
    const messagesContainer = document.querySelector('.world-chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="loading-placeholder">
                <div class="neon-icon pulse">💬</div>
                <p>Загрузка сообщений...</p>
            </div>
        `;
    }
    
    await loadWorldChatMessages();
}

/**
 * Загрузить сообщения
 */
async function loadWorldChatMessages(silent = false) {
    try {
        worldChatLoadingController = new AbortController();
        const requestTab = currentWorldChatTab;
        
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
        
        if (requestTab !== currentWorldChatTab) {
            console.log(`⏭️ Пропускаем рендер для ${requestTab}`);
            return;
        }
        
        if (data.success) {
            if (!silent) {
                console.log(`✅ Загружено ${data.data.length} сообщений`);
            }
            renderWorldChatMessages(data.data);
        } else {
            console.error('❌ Ошибка загрузки сообщений:', data.error);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏹️ Запрос отменен');
        } else {
            console.error('Ошибка загрузки сообщений:', error);
        }
    }
}

/**
 * Функция цензуры матерных слов
 */
function censorMessage(text) {
    if (!text) return text;
    
    const badWords = [
        'блять', 'бля', 'блядь', 'блят', 'бляд',
        'хуй', 'хуя', 'хуе', 'хую', 'хуи', 'хер',
        'пизда', 'пизд', 'пиздец', 'пизде', 'пизду',
        'ебать', 'ебал', 'ебан', 'еба', 'ебу', 'ебёт',
        'сука', 'суки', 'суку', 'сук',
        'гандон', 'гондон', 'мудак', 'мудила',
        'долбоеб', 'дебил', 'уебок', 'ублюдок',
        'говно', 'говна', 'гавно',
        'шлюха', 'шлюхи', 'пидор', 'педик',
        'fuck', 'shit', 'bitch', 'dick', 'pussy'
    ];
    
    let censored = text;
    
    badWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        censored = censored.replace(regex, '****');
    });
    
    return censored;
}

/**
 * Escape HTML для предотвращения XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Форматирование времени сообщения
 */
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'сейчас';
    if (diffMins < 60) return `${diffMins} мин`;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
}

/**
 * Отрисовка сообщений
 */
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
    
    const currentIds = messages.map(m => m.id);
    const idsChanged = JSON.stringify(currentIds) !== JSON.stringify(lastWorldChatMessageIds);
    
    if (!idsChanged) return;
    
    const newMessageIds = currentIds.filter(id => !lastWorldChatMessageIds.includes(id));
    const hasNewMessages = newMessageIds.length > 0;
    
    lastWorldChatMessageIds = currentIds;
    
    const hasLoadingPlaceholder = container.querySelector('.loading-placeholder');
    
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
            
            requestAnimationFrame(() => {
                messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        });
    } else {
        container.innerHTML = messages.map(msg => createWorldChatMessageHtml(msg)).join('');
    }
    
    requestAnimationFrame(() => {
        const scrollContainer = container.parentElement;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    });
    
    setupLongPressHandlers();
}

/**
 * Создать HTML для одного сообщения
 */
function createWorldChatMessageHtml(msg) {
    const isPremium = msg.is_premium || msg.isPremium || false;
    const nicknameClass = `${msg.type}-type${isPremium ? ' premium' : ''}`;
    const proБадge = isPremium ? '<span class="world-chat-pro-badge">⭐</span>' : '';
    const time = formatMessageTime(msg.created_at || msg.createdAt);
    
    let targetInfo = '';
    if (msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
        targetInfo = ` → ${msg.target_nickname || msg.targetNickname}`;
    }
    
    const currentUserToken = localStorage.getItem('user_token');
    const userToken = msg.user_token || msg.userToken;
    const isOwnMessage = userToken === currentUserToken;
    
    let clickableNickname = msg.nickname;
    if (isOwnMessage && msg.type === 'private' && (msg.target_nickname || msg.targetNickname)) {
        clickableNickname = msg.target_nickname || msg.targetNickname;
    }
    
    let censoredMessage = censorMessage(msg.message);
    
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
                    ${escapeHtml(msg.nickname)}${proБадge}${targetInfo}
                </div>
                <div class="world-chat-time">${time}</div>
            </div>
            <div class="world-chat-text">${escapeHtml(censoredMessage)}</div>
        </div>
    `;
}

/**
 * Настройка long press для мобильных устройств
 */
function setupLongPressHandlers() {
    const nicknames = document.querySelectorAll('.world-chat-nickname');
    
    nicknames.forEach(nickname => {
        let pressTimer;
        
        nickname.addEventListener('touchstart', function(e) {
            const nick = this.getAttribute('data-nickname');
            const token = this.getAttribute('data-user-token');
            const isOwn = this.getAttribute('data-is-own') === 'true';
            
            pressTimer = setTimeout(() => {
                if (navigator.vibrate) navigator.vibrate(50);
                showWorldChatContextMenu(e, nick, token, isOwn);
            }, 500);
        });
        
        nickname.addEventListener('touchend', function() {
            clearTimeout(pressTimer);
        });
        
        nickname.addEventListener('touchmove', function() {
            clearTimeout(pressTimer);
        });
    });
}

/**
 * Клик на никнейм - добавить в инпут для личного сообщения
 */
function clickWorldChatNickname(nickname) {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix');
    
    input.value = `${nickname} `;
    prefix.textContent = '/';
    prefix.style.color = '#FF006E';
    input.focus();
}

/**
 * Отправить сообщение
 */
async function sendWorldChatMessage() {
    const input = document.getElementById('worldChatInput');
    const prefix = document.getElementById('worldChatPrefix').textContent;
    let message = input.value.trim();
    
    if (!message) return;
    
    message = prefix + message;
    
    if (message.length - 1 > 120) {
        tg.showAlert('Максимум 120 символов');
        return;
    }
    
    try {
        const userToken = localStorage.getItem('user_token');
        const savedUser = localStorage.getItem('telegram_user');
        const tgId = savedUser ? JSON.parse(savedUser)?.id : null;
        const userId = userToken || (tgId ? String(tgId) : null);
        
        const nickname = localStorage.getItem('userNickname') || 'Аноним';
        const isPremium = typeof userPremiumStatus !== 'undefined' ? userPremiumStatus.isPremium : false;
        const city = localStorage.getItem('userCity') || 'Алматы';
        
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-message',
                params: {
                    userToken: userId,
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
            
            if (prefix === '/') {
                if (currentWorldChatTab === 'world') {
                    await switchWorldChatTab('world');
                } else if (currentWorldChatTab === 'city') {
                    await switchWorldChatTab('city');
                } else {
                    await loadWorldChatMessages();
                }
            } else {
                await loadWorldChatMessages();
            }
        } else {
            console.error('❌ Ошибка отправки:', data.error);
            tg.showAlert(data.error || 'Ошибка отправки сообщения');
        }
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        tg.showAlert('Ошибка отправки сообщения');
    }
}

/**
 * Обновление счетчика символов
 */
function updateWorldChatCharCount() {
    const input = document.getElementById('worldChatInput');
    const counter = document.getElementById('worldChatCharCount');
    
    if (input && counter) {
        const length = input.value.length;
        counter.textContent = length;
        counter.style.color = length > 45 ? '#FF006E' : 'var(--text-gray)';
        
        input.removeEventListener('input', handleWorldChatInput);
        input.addEventListener('input', handleWorldChatInput);
    }
}

function handleWorldChatInput() {
    const input = document.getElementById('worldChatInput');
    const counter = document.getElementById('worldChatCharCount');
    if (input && counter) {
        const length = input.value.length;
        counter.textContent = length;
        counter.style.color = length > 45 ? '#FF006E' : 'var(--text-gray)';
    }
}

/**
 * Загрузить превью последнего сообщения для кнопки
 */
async function loadWorldChatPreview() {
    try {
        const response = await fetch('/api/world-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get-last-message' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const preview = document.getElementById('worldChatPreview');
            const msg = data.data;
            const cleanMessage = msg.message.replace(/^[@&\/]\s*/, '');
            if (preview) preview.textContent = `${msg.nickname}: ${cleanMessage}`;
        }
    } catch (error) {
        console.error('Ошибка загрузки превью:', error);
    }
}

/**
 * Контекстное меню
 */
function showWorldChatContextMenu(event, nickname, userToken, isOwnMessage = false) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Контекстное меню для', nickname, 'isOwn:', isOwnMessage);
    
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
    
    if (isOwnMessage) {
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan);">${escapeHtml(nickname)}</div>
                <div style="font-size: 12px; color: var(--text-gray);">Это Вы</div>
            </div>
            <button onclick="closeWorldChatContextMenu()" style="
                width: 100%; padding: 12px;
                background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
            ">Закрыть</button>
        `;
    } else {
        modal.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--neon-cyan);">${escapeHtml(nickname)}</div>
                <div style="font-size: 12px; color: var(--text-gray);">Выберите действие</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="worldChatPrivateMessage('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px; background: linear-gradient(135deg, #FF006E, #C4005A);
                    border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
                ">💌 Приват чат</button>
                <button onclick="worldChatBlockUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px; background: linear-gradient(135deg, #555, #333);
                    border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
                ">🚫 В ЧС</button>
                <button onclick="worldChatReportUser('${escapeHtml(nickname)}', '${userToken}')" style="
                    padding: 12px; background: linear-gradient(135deg, #FF4444, #CC0000);
                    border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
                ">⚠️ Пожаловаться</button>
                <button onclick="closeWorldChatContextMenu()" style="
                    padding: 12px; background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px;
                    color: var(--text-light); font-size: 14px; cursor: pointer;
                ">Отмена</button>
            </div>
        `;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'world-chat-context-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7); z-index: 9999;
    `;
    overlay.onclick = closeWorldChatContextMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    return false;
}

/**
 * Закрыть контекстное меню
 */
function closeWorldChatContextMenu() {
    const menu = document.querySelector('.world-chat-context-menu');
    const overlay = document.querySelector('.world-chat-context-overlay');
    if (menu) menu.remove();
    if (overlay) overlay.remove();
}

/**
 * Приват чат через контекстное меню
 */
async function worldChatPrivateMessage(nickname, userToken) {
    closeWorldChatContextMenu();
    
    const currentUserToken = localStorage.getItem('user_token');
    if (!currentUserToken) {
        tg.showAlert('⚠️ Сначала авторизуйтесь');
        return;
    }
    
    if (currentUserToken === userToken) {
        tg.showAlert('Вы не можете отправить сообщение самому себе');
        return;
    }
    
    try {
        const blockCheckResponse = await fetch('/api/user-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'is-blocked',
                params: { blockerToken: userToken, blockedToken: currentUserToken }
            })
        });
        
        const blockCheckData = await blockCheckResponse.json();
        
        if (blockCheckData.success && blockCheckData.isBlocked) {
            tg.showAlert('Вы не можете создать чат с этим пользователем');
            return;
        }
    } catch (error) {
        console.error('Ошибка проверки блокировки:', error);
    }
    
    showCustomPrompt(`Введите сообщение для ${nickname}:`, async (message) => {
        if (!message || message.trim() === '') return;
        
        try {
            await createWorldChatPrivateChat(nickname, userToken, currentUserToken, message);
        } catch (error) {
            console.error('Ошибка создания чата:', error);
            tg.showAlert('❌ Ошибка при создании чата');
        }
    });
}

/**
 * Создать приватный чат из Мир чата
 */
async function createWorldChatPrivateChat(nickname, targetUserToken, senderUserToken, message) {
    try {
        const checkResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-existing-by-tokens',
                params: { user1_token: senderUserToken, user2_token: targetUserToken }
            })
        });
        
        const checkData = await checkResponse.json();
        
        if (checkData.data) {
            const sendResponse = await fetch('/api/neon-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send-message',
                    params: {
                        chatId: checkData.data.id,
                        senderId: senderUserToken,
                        messageText: message,
                        senderNickname: localStorage.getItem('userNickname') || 'Аноним',
                        skipNotification: false
                    }
                })
            });
            
            const sendData = await sendResponse.json();
            if (sendData.error) throw new Error(sendData.error.message);
            
            tg.showAlert(`✅ Сообщение отправлено ${nickname}!`);
        } else {
            const createResponse = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create-direct',
                    params: {
                        user1_token: senderUserToken,
                        user2_token: targetUserToken,
                        message: message,
                        senderNickname: localStorage.getItem('userNickname') || 'Аноним',
                        senderToken: senderUserToken
                    }
                })
            });
            
            const createData = await createResponse.json();
            if (createData.error) throw new Error(createData.error.message);
            
            tg.showAlert(`✅ Приватный чат с ${nickname} создан!`);
        }
        
        if (typeof updateChatBadge === 'function') {
            await updateChatBadge();
        }
    } catch (error) {
        console.error('Ошибка при создании приватного чата:', error);
        throw error;
    }
}

/**
 * Добавить в ЧС
 */
async function worldChatBlockUser(nickname, blockedUserToken) {
    closeWorldChatContextMenu();
    
    const confirmed = confirm(`Добавить ${nickname} в черный список?`);
    if (!confirmed) return;
    
    try {
        const currentUserToken = localStorage.getItem('user_token');
        
        const response = await fetch('/api/user-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'block-user',
                params: {
                    blockerToken: currentUserToken,
                    blockedToken: blockedUserToken,
                    blockedNickname: nickname
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            tg.showAlert(`${nickname} добавлен в ЧС`);
            await loadWorldChatMessages();
        } else {
            tg.showAlert(data.error || 'Ошибка при блокировке');
        }
    } catch (error) {
        console.error('Ошибка блокировки:', error);
        tg.showAlert('Ошибка при блокировке пользователя');
    }
}

/**
 * Пожаловаться на пользователя
 */
async function worldChatReportUser(nickname, userToken) {
    closeWorldChatContextMenu();
    
    const reason = prompt(`Причина жалобы на ${nickname}:`);
    if (!reason) return;
    
    tg.showAlert(`Жалоба на ${nickname} отправлена`);
    console.log('Жалоба на пользователя:', nickname, userToken, reason);
}

/**
 * Показать FAQ
 */
function showWorldChatFAQ() {
    const faqModal = document.getElementById('worldChatFAQ');
    if (faqModal) faqModal.style.display = 'flex';
}

function closeWorldChatFAQ() {
    const faqModal = document.getElementById('worldChatFAQ');
    if (faqModal) faqModal.style.display = 'none';
}

// Остановить автообновление при выходе
window.addEventListener('beforeunload', () => {
    if (worldChatAutoRefreshInterval) {
        clearInterval(worldChatAutoRefreshInterval);
    }
});

// Экспорт функций для onclick
window.showWorldChat = showWorldChat;
window.toggleFontSize = toggleFontSize;
window.switchWorldChatTab = switchWorldChatTab;
window.loadWorldChatMessages = loadWorldChatMessages;
window.sendWorldChatMessage = sendWorldChatMessage;
window.updateWorldChatCharCount = updateWorldChatCharCount;
window.handleWorldChatInput = handleWorldChatInput;
window.loadWorldChatPreview = loadWorldChatPreview;
window.showWorldChatContextMenu = showWorldChatContextMenu;
window.closeWorldChatContextMenu = closeWorldChatContextMenu;
window.worldChatPrivateMessage = worldChatPrivateMessage;
window.worldChatBlockUser = worldChatBlockUser;
window.worldChatReportUser = worldChatReportUser;
window.showWorldChatFAQ = showWorldChatFAQ;
window.closeWorldChatFAQ = closeWorldChatFAQ;
window.clickWorldChatNickname = clickWorldChatNickname;

// Пожаловаться на пользователя из Мир чата
async function reportUserFromWorldChat(nickname, userToken) {
    closeWorldChatContextMenu();
    
    try {
        // Получаем user_id через user_token из API
        const response = await fetch(`/api/users/by-token?token=${userToken}`);
        const data = await response.json();
        
        if (!data.success || !data.userId) {
            tg.showAlert('Не удалось определить пользователя');
            return;
        }
        
        if (typeof window.currentReportData !== 'undefined') {
            window.currentReportData = {
                reportedUserId: data.userId,
                reportedNickname: nickname,
                reportType: 'message',
                relatedAdId: null,
                reason: null
            };
        }
        
        const reportModal = document.getElementById('reportModal');
        if (reportModal) {
            reportModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Ошибка получения user_id:', error);
        tg.showAlert('Не удалось определить пользователя');
    }
}

window.reportUserFromWorldChat = reportUserFromWorldChat;

console.log('✅ [WORLD-CHAT] Модуль мирового чата инициализирован');
