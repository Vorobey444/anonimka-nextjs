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
 * Показать список моих чатов
 */
async function showMyChats() {
    console.log('📱 [CHATS] Открытие моих чатов');
    
    // Проверяем никнейм перед показом чатов
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        console.warn('⚠️ [CHATS] Попытка открыть чаты без никнейма - блокируем');
        tg.showAlert('Сначала выберите никнейм');
        return;
    }
    
    showScreen('myChats');
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

console.log('✅ [CHATS] Модуль чатов инициализирован');
