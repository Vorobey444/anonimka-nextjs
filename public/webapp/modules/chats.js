/**
 * Модуль чатов и мессинджинга (chats.js)
 * 
 * Функции:
 * - Загрузка и отправка сообщений
 * - Управление чатами (блокировка, удаление)
 * - Уведомления и счётчики
 * - UI для чатов
 */

console.log('💬 [CHATS] Инициализация модуля чатов');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
 */

let currentChatId = null;
let currentAdId = null;
let chatPollingInterval = null;
let myChatsPollingInterval = null;
let currentOpponentId = null;
let isUserBlocked = false;

// Переменная для ответа на сообщение
let replyToMessage = null;

/**
 * ===== ОСНОВНЫЕ ФУНКЦИИ ЧАТОВ =====
 */

/**
 * Показать список моих чатов (только загрузка данных, без переключения экрана)
 */
async function showMyChats() {
    console.log('📱 [CHATS] Загрузка моих чатов');
    
    // Проверяем никнейм перед показом чатов
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        console.warn('⚠️ [CHATS] Попытка открыть чаты без никнейма - блокируем');
        tg.showAlert('Сначала выберите никнейм');
        return;
    }
    
    // НЕ вызываем showScreen здесь - это вызовет рекурсию!
    // showScreen вызывается из меню, а showMyChats только загружает данные
    
    await loadMyChats();
    
    // Запускаем автообновление
    if (myChatsPollingInterval) clearInterval(myChatsPollingInterval);
    
    myChatsPollingInterval = setInterval(async () => {
        const myChatsScreen = document.getElementById('myChats');
        if (myChatsScreen?.classList.contains('active')) {
            console.log('🔄 [CHATS] Автообновление списка чатов...');
            await loadMyChats();
            await updateChatBadge();
        } else {
            clearInterval(myChatsPollingInterval);
            myChatsPollingInterval = null;
        }
    }, 5000); // Каждые 5 секунд
}

/**
 * Загрузить список чатов пользователя
 */
async function loadMyChats() {
    try {
        console.log('📥 [CHATS] Загрузка списка чатов');
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (!userId && !userToken) {
            console.error('❌ [CHATS] Нет авторизации');
            return;
        }
        
        // Запрашиваем активные чаты
        const acceptedResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-active',
                params: { userId: userToken || userId }
            })
        });
        const acceptedResult = await acceptedResponse.json();
        
        // Запрашиваем входящие запросы
        const pendingResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-pending',
                params: { user_token: userToken || userId }
            })
        });
        const pendingResult = await pendingResponse.json();
        
        if (acceptedResult.error || pendingResult.error) {
            console.error('❌ [CHATS] Ошибка загрузки чатов:', 
                acceptedResult.error || pendingResult.error);
            return;
        }
        
        let acceptedChats = acceptedResult.data || [];
        let pendingRequests = pendingResult.data || [];
        
        // Сортируем чаты по времени последнего сообщения
        acceptedChats.sort((a, b) => {
            const timeB = new Date(b.last_message_time || b.updated_at || b.created_at).getTime();
            const timeA = new Date(a.last_message_time || a.updated_at || a.created_at).getTime();
            return timeB - timeA;
        });
        
        console.log(`✅ [CHATS] Загружено ${acceptedChats.length} активных + ${pendingRequests.length} входящих`);
        
        // Обновляем UI
        updateChatsList(acceptedChats, pendingRequests);
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка loadMyChats:', error);
    }
}

/**
 * Обновить UI списка чатов
 */
function updateChatsList(acceptedChats, pendingRequests) {
    const activeChats = document.getElementById('activeChats');
    const chatRequests = document.getElementById('chatRequests');
    const activeCount = document.getElementById('activeChatsCount');
    const requestsCount = document.getElementById('requestsCount');
    
    if (activeCount) activeCount.textContent = acceptedChats.length;
    if (requestsCount) requestsCount.textContent = pendingRequests.length;
    
    // Отображаем активные чаты
    if (activeChats) {
        if (acceptedChats.length === 0) {
            activeChats.innerHTML = `
                <div class="empty-state">
                    <h3>Нет открытых чатов</h3>
                    <p>Начните общение через анкету</p>
                </div>
            `;
        } else {
            activeChats.innerHTML = acceptedChats.map(chat => `
                <div class="chat-card" onclick="openChat('${chat.id}')">
                    <div class="chat-header">
                        <span>Чат #${chat.id}</span>
                        <span>${formatChatTime(chat.last_message_time)}</span>
                    </div>
                    <div class="chat-preview">${chat.last_message || 'Нажмите для открытия'}</div>
                </div>
            `).join('');
        }
    }
    
    // Отображаем входящие запросы
    if (chatRequests) {
        if (pendingRequests.length === 0) {
            chatRequests.innerHTML = `
                <div class="empty-state">
                    <h3>Нет входящих запросов</h3>
                    <p>Запросы на чаты появятся здесь</p>
                </div>
            `;
        } else {
            chatRequests.innerHTML = pendingRequests.map(chat => `
                <div class="chat-request-card">
                    <div class="request-header">Чат #${chat.id}</div>
                    <div class="request-message">${chat.last_message || 'Хочет начать диалог'}</div>
                    <div class="request-actions">
                        <button onclick="acceptChatRequest('${chat.id}')">✅ Принять</button>
                        <button onclick="rejectChatRequest('${chat.id}')">❌ Отклонить</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

/**
 * Открыть чат
 */
async function openChat(chatId) {
    console.log('💬 [CHATS] Открытие чата:', chatId);
    
    currentChatId = chatId;
    showScreen('chatView');
    
    try {
        const userId = getCurrentUserId();
        
        // Отмечаем пользователя как активного
        await markUserActive(userId, chatId);
        
        // Загружаем информацию о чате и сообщения
        await loadChatMessages(chatId);
        
        // Проверяем статус блокировки
        await checkBlockStatus(chatId);
        
        // Запускаем автообновление сообщений
        startChatPolling(chatId, userId);
        
        // Помечаем сообщения как прочитанные
        await markMessagesAsRead(chatId);
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка открытия чата:', error);
        tg.showAlert('Ошибка при открытии чата');
        showMyChats();
    }
}

/**
 * Загрузить сообщения чата
 */
async function loadChatMessages(chatId, silent = false) {
    try {
        console.log('📥 [CHATS] Загрузка сообщений чата:', chatId);
        
        const messagesContainer = document.getElementById('chatMessages');
        
        if (!silent && messagesContainer) {
            messagesContainer.innerHTML = '<p>Загрузка...</p>';
        }
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-messages',
                params: { chatId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('❌ [CHATS] Ошибка загрузки сообщений:', result.error);
            if (messagesContainer) {
                messagesContainer.innerHTML = '<p>Ошибка загрузки сообщений</p>';
            }
            return;
        }
        
        const messages = result.data || [];
        console.log(`✅ [CHATS] Загружено ${messages.length} сообщений`);
        
        // Отображаем сообщения
        if (messagesContainer) {
            const myUserId = getCurrentUserId();
            
            messagesContainer.innerHTML = messages.map(msg => {
                const isMine = msg.sender_token === myUserId || msg.sender_id === myUserId;
                const time = formatMessageTime(msg.created_at);
                
                return `
                    <div class="message ${isMine ? 'sent' : 'received'}" 
                         data-message-id="${msg.id}"
                         data-is-mine="${isMine}">
                        ${!isMine ? `<div class="message-nickname">${msg.sender_nickname || 'Собеседник'}</div>` : ''}
                        <div class="message-text">${escapeHtml(msg.message)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
            }).join('');
            
            // Скроллим вниз
            const scrollContainer = document.querySelector('.chat-messages-container');
            if (scrollContainer) {
                setTimeout(() => {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                }, 100);
            }
        }
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка при загрузке сообщений:', error);
    }
}

/**
 * Отправить сообщение
 */
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const messageText = input?.value?.trim();
    
    if (!messageText || !currentChatId) return;
    
    try {
        console.log('📤 [CHATS] Отправка сообщения в чат:', currentChatId);
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        const nickname = getUserNickname();
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-message',
                params: {
                    chatId: currentChatId,
                    senderId: userToken || userId,
                    messageText: messageText,
                    senderNickname: nickname,
                    skipNotification: false
                }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('❌ [CHATS] Ошибка отправки сообщения:', result.error);
            
            if (result.error.message === 'Chat is blocked') {
                tg.showAlert('Чат заблокирован');
            }
            return;
        }
        
        console.log('✅ [CHATS] Сообщение отправлено');
        
        // Очищаем поле ввода
        if (input) input.value = '';
        
        // Перезагружаем сообщения
        await loadChatMessages(currentChatId);
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка при отправке сообщения:', error);
        tg.showAlert('Ошибка при отправке сообщения');
    }
}

/**
 * Принять запрос на чат
 */
async function acceptChatRequest(chatId) {
    try {
        console.log('✅ [CHATS] Принятие запроса на чат:', chatId);
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'accept',
                params: { chatId, userId: userToken || userId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка при принятии запроса');
            return;
        }
        
        tg.showAlert('✅ Чат создан!');
        await loadMyChats();
        await updateChatBadge();
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка acceptChatRequest:', error);
    }
}

/**
 * Отклонить запрос на чат
 */
async function rejectChatRequest(chatId) {
    try {
        console.log('❌ [CHATS] Отклонение запроса на чат:', chatId);
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'reject',
                params: { chatId, userId: userToken || userId }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка при отклонении запроса');
            return;
        }
        
        tg.showAlert('✅ Запрос отклонён');
        await loadMyChats();
        await updateChatBadge();
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка rejectChatRequest:', error);
    }
}

/**
 * Помечение сообщений как прочитанных
 */
async function markMessagesAsRead(chatId) {
    try {
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-read',
                params: { chatId, userId: userToken || userId }
            })
        });
        
        await updateChatBadge();
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка markMessagesAsRead:', error);
    }
}

/**
 * Отметить пользователя как активного в чате
 */
async function markUserActive(userId, chatId) {
    try {
        await fetch('/api/user-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-active',
                params: { userId, chatId }
            })
        });
    } catch (error) {
        console.error('⚠️ [CHATS] Ошибка markUserActive:', error);
    }
}

/**
 * Запустить автообновление сообщений в чате
 */
function startChatPolling(chatId, userId) {
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    
    chatPollingInterval = setInterval(async () => {
        if (currentChatId === chatId) {
            await loadChatMessages(chatId, true); // silent режим
            await markUserActive(userId, chatId);
        } else {
            clearInterval(chatPollingInterval);
            chatPollingInterval = null;
        }
    }, 3000); // Каждые 3 секунды
}

/**
 * Проверить статус блокировки чата
 */
async function checkBlockStatus(chatId) {
    try {
        console.log('🔍 [CHATS] Проверка статуса блокировки');
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        const response = await fetch('/api/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-block-status',
                params: { chatId, userId: userToken || userId }
            })
        });
        
        const result = await response.json();
        
        if (result.data?.isBlocked) {
            isUserBlocked = result.data.blockedByCurrentUser;
            showBlockWarning(true, isUserBlocked ? 'self' : 'other');
        }
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка проверки блокировки:', error);
    }
}

/**
 * Заблокировать/разблокировать пользователя
 */
async function toggleBlockUser() {
    if (!currentChatId) return;
    
    const action = isUserBlocked ? 'unblock-user' : 'block-user';
    const confirmText = isUserBlocked 
        ? 'Разблокировать?' 
        : 'Заблокировать собеседника?';
    
    tg.showConfirm(confirmText, async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const userToken = localStorage.getItem('user_token');
            
            const response = await fetch('/api/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    params: { 
                        chatId: currentChatId,
                        user_token: userToken
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                tg.showAlert('Ошибка');
                return;
            }
            
            isUserBlocked = !isUserBlocked;
            updateBlockUI();
            tg.showAlert(isUserBlocked ? '✅ Заблокирован' : '✅ Разблокирован');
            
        } catch (error) {
            console.error('❌ [CHATS] Ошибка блокировки:', error);
        }
    });
}

/**
 * Показать/скрыть предупреждение о блокировке
 */
function showBlockWarning(show, type = 'other') {
    const warning = document.getElementById('blockWarning');
    const messageInput = document.getElementById('messageInput');
    
    if (!warning) return;
    
    if (show) {
        const text = type === 'self' 
            ? '🚫 Вы заблокировали этого собеседника' 
            : '⚠️ Собеседник внес вас в черный список';
        
        warning.textContent = text;
        warning.style.display = 'block';
        
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Сообщения заблокированы';
        }
    } else {
        warning.style.display = 'none';
        
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = 'Введите сообщение...';
        }
    }
}

/**
 * Обновить UI блокировки
 */
function updateBlockUI() {
    showBlockWarning(isUserBlocked, isUserBlocked ? 'self' : 'other');
}

/**
 * Удалить чат
 */
async function deleteChat() {
    if (!currentChatId) return;
    
    tg.showConfirm('Удалить чат и всю историю?', async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const userToken = localStorage.getItem('user_token');
            
            const response = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete-chat',
                    params: { chatId: currentChatId, userId: userToken }
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                tg.showAlert('Ошибка удаления чата');
                return;
            }
            
            tg.showAlert('✅ Чат удален');
            showMyChats();
            
        } catch (error) {
            console.error('❌ [CHATS] Ошибка удаления чата:', error);
        }
    });
}

/**
 * Обновить счётчик чатов на кнопке
 */
async function updateChatBadge() {
    try {
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (!userId && !userToken) return;
        
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'count-requests',
                params: { userId: userToken || userId }
            })
        });
        
        const result = await response.json();
        const badge = document.getElementById('chatBadge');
        
        if (result.data?.count > 0 && badge) {
            badge.textContent = result.data.count;
            badge.style.display = 'inline';
        } else if (badge) {
            badge.style.display = 'none';
        }
        
    } catch (error) {
        console.error('⚠️ [CHATS] Ошибка updateChatBadge:', error);
    }
}

/**
 * Переключение вкладок чатов (active/requests)
 */
function switchChatTab(tab) {
    console.log('💬 [CHATS] Переключение вкладки:', tab);
    
    // Переключаем активную кнопку
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        const targetBtn = event.target.closest('.tab-btn');
        if (targetBtn) targetBtn.classList.add('active');
    }
    
    // Переключаем контент
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'active') {
        const activeTab = document.getElementById('activeChatsTab');
        if (activeTab) activeTab.classList.add('active');
    } else if (tab === 'requests') {
        const requestsTab = document.getElementById('requestsTab');
        if (requestsTab) requestsTab.classList.add('active');
    }
}

/**
 * Отмена ответа на сообщение
 */
function cancelReply() {
    replyToMessage = null;
    const preview = document.getElementById('replyPreview');
    if (preview) preview.style.display = 'none';
}

/**
 * Переключение размера шрифта в чате
 */
function toggleChatFontSize() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    let currentSize = localStorage.getItem('chatFontSize') || 'medium';
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    
    messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
    messagesContainer.classList.add(`font-${nextSize}`);
    localStorage.setItem('chatFontSize', nextSize);
    
    const btn = document.getElementById('chatFontSizeBtn');
    if (btn) {
        btn.style.fontSize = nextSize === 'small' ? '14px' : nextSize === 'medium' ? '18px' : '22px';
    }
}

/**
 * Переключение меню чата
 */
function toggleChatMenu() {
    const menu = document.getElementById('chatMenu');
    if (!menu) return;
    if (menu.style.display === 'none' || !menu.style.display) {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

/**
 * Подтверждение удаления чата
 */
function confirmDeleteChat() {
    const menu = document.getElementById('chatMenu');
    if (menu) menu.style.display = 'none';
    
    tg.showConfirm(
        '⚠️ Чат будет удален у обеих сторон.\\n\\nВсе сообщения будут потеряны.\\n\\nПродолжить?',
        async (confirmed) => {
            if (confirmed) {
                await deleteChat();
            }
        }
    );
}

/**
 * Открыть чат в Telegram
 */
function openTelegramChat() {
    const username = localStorage.getItem('opponentTelegramUsername');
    if (username) {
        const url = `https://t.me/${username}`;
        if (tg && tg.openTelegramLink) {
            tg.openTelegramLink(url);
        } else {
            window.open(url, '_blank');
        }
    } else {
        tg.showAlert('Telegram собеседника недоступен');
    }
}

/**
 * ===== ФУНКЦИИ РЕАКЦИЙ НА СООБЩЕНИЯ =====
 */

/**
 * Настройка обработчиков свайпа для сообщений
 */
function setupMessageSwipeHandlers() {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(msg => {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;
        let hasMoved = false;
        
        const handleStart = (e) => {
            startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            currentX = startX;
            isDragging = true;
            hasMoved = false;
            msg.style.transition = 'none';
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            
            currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            const diffX = currentX - startX;
            const diffY = Math.abs(currentY - startY);
            
            const isMine = msg.getAttribute('data-is-mine') === 'true';
            
            // Свайп влево (для всех) - ответить
            if (diffX < 0 && diffX > -150) {
                msg.style.transform = `translateX(${diffX}px)`;
                if (Math.abs(diffX) > 5) {
                    hasMoved = true;
                }
            }
            // Свайп вправо (только свои) - удалить
            else if (diffX > 0 && diffX < 150 && isMine) {
                msg.style.transform = `translateX(${diffX}px)`;
                if (Math.abs(diffX) > 5) {
                    hasMoved = true;
                }
            }
        };
        
        const handleEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = currentX - startX;
            msg.style.transition = 'transform 0.2s ease';
            msg.style.transform = '';
            
            const isMine = msg.getAttribute('data-is-mine') === 'true';
            
            // Свайп влево (-100px) И было движение - показываем ответ
            if (diff < -100 && hasMoved) {
                const messageId = msg.getAttribute('data-message-id');
                const nickname = msg.getAttribute('data-nickname');
                const messageText = msg.querySelector('.message-text')?.textContent || '';
                
                if (messageId && nickname) {
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    if (typeof replyToMsg === 'function') {
                        replyToMsg(messageId, nickname, messageText);
                    }
                }
            }
            // Свайп вправо (60px) И своё сообщение И было движение - удалить
            else if (diff > 60 && isMine && hasMoved) {
                const messageId = msg.getAttribute('data-message-id');
                if (messageId) {
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    if (typeof showDeleteMessageMenu === 'function') {
                        showDeleteMessageMenu(null, parseInt(messageId));
                    }
                }
            }
            
            hasMoved = false;
        };
        
        // Touch events
        msg.addEventListener('touchstart', handleStart, { passive: true });
        msg.addEventListener('touchmove', handleMove, { passive: true });
        msg.addEventListener('touchend', handleEnd, { passive: true });
        
        // Mouse events для десктопа
        msg.addEventListener('mousedown', handleStart);
        msg.addEventListener('mousemove', handleMove);
        msg.addEventListener('mouseup', handleEnd);
        msg.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                msg.style.transition = 'transform 0.2s ease';
                msg.style.transform = '';
            }
        });
    });
}

/**
 * Настройка реакций на сообщения
 */
function setupMessageReactions() {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(msg => {
        const isMine = msg.getAttribute('data-is-mine') === 'true';
        
        let clickTimeout = null;
        let clickCount = 0;
        let longPressTimer = null;
        let longPressStarted = false;
        
        // Обработчик двойного клика
        const handleClick = (e) => {
            if (e.target.closest('.message-photo, .message-photo-secure, video, button, .message-reply-indicator, .message-reaction')) {
                return;
            }
            
            if (isMine) return;
            
            if (longPressStarted) {
                longPressStarted = false;
                return;
            }
            
            clickCount++;
            
            if (clickCount === 1) {
                clickTimeout = setTimeout(() => {
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                clearTimeout(clickTimeout);
                clickCount = 0;
                addReaction(msg, '❤️');
            }
        };
        
        // Долгое нажатие - показываем меню реакций
        const handleLongPressStart = (e) => {
            if (e.target.closest('.message-photo, .message-photo-secure, video, button, .message-reply-indicator, .message-reaction')) {
                return;
            }
            
            if (isMine) return;
            
            const coords = e.touches ? e.touches[0] : e;
            longPressTimer = setTimeout(() => {
                longPressStarted = true;
                showReactionPicker(msg, coords);
            }, 500);
        };
        
        const handleLongPressEnd = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            setTimeout(() => {
                longPressStarted = false;
            }, 100);
        };
        
        const handleLongPressMove = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };
        
        msg.addEventListener('click', handleClick);
        msg.addEventListener('touchstart', handleLongPressStart, { passive: true });
        msg.addEventListener('touchend', handleLongPressEnd);
        msg.addEventListener('touchmove', handleLongPressMove);
        msg.addEventListener('mousedown', handleLongPressStart);
        msg.addEventListener('mouseup', handleLongPressEnd);
        msg.addEventListener('mousemove', handleLongPressMove);
    });
}

/**
 * Показать меню выбора реакций
 */
function showReactionPicker(messageElement, event) {
    closeReactionPicker();
    
    const reactions = ['❤️', '👍', '😂', '🔥', '👎', '😠'];
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    picker.id = 'reactionPicker';
    
    reactions.forEach(emoji => {
        const option = document.createElement('div');
        option.className = 'reaction-option';
        option.textContent = emoji;
        option.onclick = () => {
            addReaction(messageElement, emoji);
            closeReactionPicker();
        };
        picker.appendChild(option);
    });
    
    document.body.appendChild(picker);
    
    picker.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, { passive: true });
    
    picker.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, { passive: true });
    
    const rect = messageElement.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    
    let left = rect.left + rect.width / 2 - pickerRect.width / 2;
    let top = rect.top - pickerRect.height - 10;
    
    if (left < 10) left = 10;
    if (left + pickerRect.width > window.innerWidth - 10) {
        left = window.innerWidth - pickerRect.width - 10;
    }
    if (top < 10) {
        top = rect.bottom + 10;
    }
    
    picker.style.left = left + 'px';
    picker.style.top = top + 'px';
    
    setTimeout(() => {
        document.addEventListener('click', closeReactionPickerOnClickOutside);
    }, 100);
}

/**
 * Закрыть меню реакций
 */
function closeReactionPicker() {
    const picker = document.getElementById('reactionPicker');
    if (picker) {
        picker.remove();
        document.removeEventListener('click', closeReactionPickerOnClickOutside);
    }
}

function closeReactionPickerOnClickOutside(e) {
    const picker = document.getElementById('reactionPicker');
    if (picker && !picker.contains(e.target)) {
        closeReactionPicker();
    }
}

/**
 * Добавить реакцию на сообщение
 */
async function addReaction(messageElement, emoji) {
    const messageId = messageElement.dataset.messageId;
    
    if (!messageId) {
        console.error('Message ID not found');
        return;
    }
    
    try {
        showReactionOnMessage(messageElement, emoji);
        
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/reactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_id: messageId,
                emoji: emoji,
                user_token: userToken
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to add reaction');
        }
        
        const data = await response.json();
        console.log('✅ Реакция добавлена:', data);
        
    } catch (error) {
        console.error('❌ Ошибка добавления реакции:', error);
        removeReactionFromMessage(messageElement);
    }
}

/**
 * Показать реакцию на сообщении
 */
function showReactionOnMessage(messageElement, emoji, count = 1) {
    const existingReaction = messageElement.querySelector('.message-reaction');
    if (existingReaction) {
        existingReaction.remove();
    }
    
    const messageId = messageElement.getAttribute('data-message-id');
    const reaction = document.createElement('div');
    reaction.className = 'message-reaction';
    reaction.setAttribute('data-message-id', messageId);
    reaction.innerHTML = `
        <span class="message-reaction-emoji">${emoji}</span>
        ${count > 1 ? `<span class="message-reaction-count">${count}</span>` : ''}
    `;
    
    const removeHandler = async (e) => {
        e.stopPropagation();
        
        try {
            const response = await fetch('/api/reactions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Token': window.userToken
                },
                body: JSON.stringify({
                    message_id: parseInt(messageId),
                    emoji: emoji
                })
            });
            
            if (response.ok) {
                reaction.remove();
            }
        } catch (error) {
            console.error('Ошибка удаления реакции:', error);
        }
    };
    
    reaction.addEventListener('click', removeHandler);
    messageElement.appendChild(reaction);
}

/**
 * Убрать реакцию с сообщения
 */
function removeReactionFromMessage(messageElement) {
    const reaction = messageElement.querySelector('.message-reaction');
    if (reaction) {
        reaction.remove();
    }
}

// Экспорт функций в глобальную область
window.switchChatTab = switchChatTab;
window.showMyChats = showMyChats;
window.loadMyChats = loadMyChats;
window.updateChatBadge = updateChatBadge;
window.sendMessage = sendMessage;
window.openChat = openChat;
window.loadChatMessages = loadChatMessages;
window.acceptChatRequest = acceptChatRequest;
window.rejectChatRequest = rejectChatRequest;
window.markMessagesAsRead = markMessagesAsRead;
window.toggleBlockUser = toggleBlockUser;
window.showBlockWarning = showBlockWarning;
window.updateBlockUI = updateBlockUI;
window.deleteChat = deleteChat;
window.updateChatsList = updateChatsList;
window.checkBlockStatus = checkBlockStatus;
window.cancelReply = cancelReply;
window.toggleChatFontSize = toggleChatFontSize;
window.toggleChatMenu = toggleChatMenu;
window.confirmDeleteChat = confirmDeleteChat;
window.openTelegramChat = openTelegramChat;
window.setupMessageSwipeHandlers = setupMessageSwipeHandlers;
window.setupMessageReactions = setupMessageReactions;
window.showReactionPicker = showReactionPicker;
window.closeReactionPicker = closeReactionPicker;
window.addReaction = addReaction;
window.showReactionOnMessage = showReactionOnMessage;
window.removeReactionFromMessage = removeReactionFromMessage;

/**
 * Закрыть меню удаления сообщения
 */
function closeDeleteMessageMenu() {
    const menu = document.querySelector('.delete-message-modal');
    const overlay = document.querySelector('.delete-message-overlay');
    if (menu) menu.remove();
    if (overlay) overlay.remove();
}

/**
 * Удалить сообщение
 */
async function deleteMessage(messageId) {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            if (typeof tg !== 'undefined' && tg?.showAlert) {
                tg.showAlert('⚠️ Ошибка авторизации');
            }
            return;
        }
        
        console.log('🗑️ [CHATS] Удаление сообщения:', messageId);
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete-message',
                messageId: messageId,
                userToken: userToken
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            if (typeof tg !== 'undefined' && tg?.showAlert) {
                tg.showAlert('❌ ' + data.error);
            }
            return;
        }
        
        console.log('✅ [CHATS] Сообщение удалено');
        closeDeleteMessageMenu();
        
        // Перезагружаем сообщения
        if (currentChatId && typeof loadChatMessages === 'function') {
            await loadChatMessages(currentChatId);
        }
        
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('✅ Сообщение удалено');
        }
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка удаления:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('❌ Ошибка при удалении сообщения');
        }
    }
}

window.closeDeleteMessageMenu = closeDeleteMessageMenu;
window.deleteMessage = deleteMessage;

console.log('✅ [CHATS] Модуль чатов инициализирован');
