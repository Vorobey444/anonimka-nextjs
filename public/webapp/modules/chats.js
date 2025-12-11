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
    const userId = localStorage.getItem('user_token') || getCurrentUserId();
    
    if (activeCount) activeCount.textContent = acceptedChats.length;
    if (requestsCount) requestsCount.textContent = pendingRequests.length;
    
    // Отображаем активные чаты
    if (activeChats) {
        if (acceptedChats.length === 0) {
            activeChats.innerHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">💬</div>
                    <h3>Нет открытых чатов</h3>
                    <p>Принятые чаты появятся здесь</p>
                </div>
            `;
        } else {
            activeChats.innerHTML = acceptedChats.map(chat => {
                const lastMessageTime = chat.last_message_time ? formatChatTime(chat.last_message_time) : (chat.updated_at ? formatChatTime(chat.updated_at) : '');
                const lastMessage = chat.last_message || 'Нажмите для открытия чата';
                const lastMessagePreview = lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage;
                const unreadCount = parseInt(chat.unread_count) || 0;
                const unreadBadge = unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : '';
                
                // Проверяем блокировку
                let blockStatus = '';
                const hasBlockedBy = !!chat.blocked_by;
                const hasBlockedByToken = !!chat.blocked_by_token;
                if (hasBlockedBy || hasBlockedByToken) {
                    const isBlockedByMe = (hasBlockedBy && String(chat.blocked_by) == String(userId))
                        || (hasBlockedByToken && String(chat.blocked_by_token) === String(userId));
                    if (isBlockedByMe) {
                        blockStatus = '<span style="color: var(--neon-orange); font-size: 0.8rem;">🚫 (Чат заблокирован вами)</span>';
                    } else {
                        blockStatus = '<span style="color: var(--neon-pink); font-size: 0.8rem;">🚫 (Вы заблокированы)</span>';
                    }
                }
                
                return `
                    <div class="chat-card" onclick="openChat('${chat.id}')">
                        <div class="chat-card-header">
                            <span class="chat-ad-id">💬 Чат #${chat.id || 'N/A'}</span>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                ${unreadBadge}
                                <span class="chat-time">${lastMessageTime}</span>
                            </div>
                        </div>
                        <div class="chat-preview">
                            ${blockStatus || lastMessagePreview}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Отображаем входящие запросы
    if (chatRequests) {
        if (pendingRequests.length === 0) {
            chatRequests.innerHTML = `
                <div class="empty-chats">
                    <div class="neon-icon">📨</div>
                    <h3>Нет новых запросов</h3>
                    <p>Запросы на чаты от других пользователей появятся здесь</p>
                </div>
            `;
        } else {
            chatRequests.innerHTML = pendingRequests.map(chat => {
                const requestTime = chat.created_at ? formatChatTime(chat.created_at) : '';
                const senderName = chat.sender_nickname || 'Собеседник';
                
                let messageText = chat.last_message_text || chat.message || 'Хочет начать диалог';
                if (messageText.length > 80) {
                    messageText = messageText.substring(0, 77) + '...';
                }
                
                // PRO статус отправителя
                const isPremium = chat.sender_is_premium && 
                                 (!chat.sender_premium_until || new Date(chat.sender_premium_until) > new Date());
                const proBadge = isPremium ? '<span class="pro-badge">⭐</span>' : '';
                
                return `
                    <div class="chat-request-card ${isPremium ? 'pro-request' : ''}">
                        <div class="request-header">
                            <span class="request-ad-id">📨 Чат #${chat.id || 'N/A'} ${proBadge}</span>
                            <span class="request-time">${requestTime}</span>
                        </div>
                        <div class="request-message">
                            <strong>${typeof escapeHtml === 'function' ? escapeHtml(senderName) : senderName}</strong><br>
                            "${typeof escapeHtml === 'function' ? escapeHtml(messageText) : messageText}"
                        </div>
                        <div class="request-actions">
                            <button class="request-btn request-btn-accept" onclick="acceptChatRequest('${chat.id}')">
                                ✅ Создать приватный чат
                            </button>
                            <button class="request-btn request-btn-reject" onclick="rejectChatRequest('${chat.id}')">
                                ❌ Отклонить
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
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
        // Используем user_token как основной идентификатор
        const userToken = localStorage.getItem('user_token');
        const userId = userToken || getCurrentUserId();
        
        if (!userId) {
            console.warn('⚠️ [CHATS] userId не найден');
        }
        
        // Отмечаем пользователя как активного (если есть userId)
        if (userId) {
            await markUserActive(userId, chatId);
        }
        
        // Загружаем информацию о чате и сообщения
        await loadChatMessages(chatId);
        
        // Проверяем статус блокировки
        await checkBlockStatus(chatId);
        
        // Запускаем автообновление сообщений
        if (userId) {
            startChatPolling(chatId, userId);
        }
        
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
        const scrollContainer = document.querySelector('.chat-messages-container');
        
        if (!silent && messagesContainer) {
            messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 20px;">Загрузка сообщений...</p>';
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
            if (!silent && messagesContainer) {
                messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Ошибка загрузки сообщений</p>';
            }
            return;
        }
        
        const messages = result.data || [];
        console.log(`✅ [CHATS] Загружено ${messages.length} сообщений`);
        
        if (messages.length === 0) {
            if (messagesContainer) {
                messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">Нет сообщений. Начните диалог!</p>';
            }
            return;
        }
        
        // Получаем user_token для сравнения
        let myUserId = localStorage.getItem('user_token');
        if (!myUserId || myUserId === 'null' || myUserId === 'undefined') {
            myUserId = getCurrentUserId();
        }
        
        // Проверяем, нужно ли обновлять
        if (silent && messagesContainer) {
            const currentMessagesCount = messagesContainer.querySelectorAll('.message').length;
            if (currentMessagesCount === messages.length) {
                return; // Нет новых сообщений
            }
        }
        
        // Сохраняем позицию скролла для silent режима
        const wasAtBottom = silent && scrollContainer ? 
            (scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 50) : 
            true;
        
        // Сохраняем никнейм оппонента
        const firstOpponentMessage = messages.find(msg => msg.sender_token != myUserId);
        if (firstOpponentMessage && firstOpponentMessage.sender_nickname) {
            window.currentOpponentNickname = firstOpponentMessage.sender_nickname;
        }
        
        if (messagesContainer) {
            messagesContainer.innerHTML = messages.map(msg => {
                const isMine = msg.sender_token == myUserId;
                const messageClass = isMine ? 'sent' : 'received';
                const time = formatMessageTime(msg.created_at);
                
                // Индикатор ответа
                let replyIndicatorHtml = '';
                if (msg.reply_to_message_id) {
                    const originalMsg = messages.find(m => m.id == msg.reply_to_message_id);
                    const replyToNickname = originalMsg?.sender_nickname || 'Собеседник';
                    const replyToText = originalMsg?.message || '📸 Фото';
                    const replyPreviewText = replyToText.length > 30 ? replyToText.substring(0, 30) + '...' : replyToText;
                    
                    replyIndicatorHtml = `
                        <div class="message-reply-indicator" onclick="scrollToMessage(${msg.reply_to_message_id})">
                            <div class="reply-indicator-line"></div>
                            <div class="reply-indicator-content">
                                <div class="reply-indicator-nickname">${escapeHtml(replyToNickname)}</div>
                                <div class="reply-indicator-text">${escapeHtml(replyPreviewText)}</div>
                            </div>
                        </div>
                    `;
                }
                
                // Никнейм для входящих
                let nicknameHtml = '';
                if (!isMine) {
                    const nickname = msg.sender_nickname || 'Собеседник';
                    nicknameHtml = `<div class="message-nickname">${escapeHtml(nickname)}</div>`;
                }
                
                // Фото/видео
                let photoHtml = '';
                if (msg.photo_url) {
                    const isVideo = msg.photo_url.includes('.mp4') || msg.photo_url.includes('.mov') || msg.photo_url.includes('video');
                    
                    if (isVideo) {
                        photoHtml = `<video src="${escapeHtml(msg.photo_url)}" class="message-photo" controls playsinline controlslist="nodownload" disablePictureInPicture></video>`;
                    } else {
                        photoHtml = `<div class="message-photo-secure" style="background-image: url('${escapeHtml(msg.photo_url)}');" onclick="showPhotoModal('${escapeHtml(msg.photo_url)}')"></div>`;
                    }
                }
                
                // Текст сообщения
                let messageTextHtml = '';
                if (msg.message) {
                    messageTextHtml = `<div class="message-text">${escapeHtml(msg.message)}</div>`;
                }
                
                // Статусы доставки
                let statusIcon = '';
                if (isMine) {
                    if (msg.read) {
                        statusIcon = '<span class="message-status read">✓✓</span>';
                    } else if (msg.delivered) {
                        statusIcon = '<span class="message-status delivered">✓✓</span>';
                    } else {
                        statusIcon = '<span class="message-status sent">✓</span>';
                    }
                }
                
                const nickname = msg.sender_nickname || 'Собеседник';
                
                // Реакции
                let reactionHtml = '';
                if (msg.reactions && msg.reactions.length > 0) {
                    const topReaction = msg.reactions[0];
                    reactionHtml = `
                        <div class="message-reaction" data-message-id="${msg.id}">
                            <span class="message-reaction-emoji">${topReaction.emoji}</span>
                            ${topReaction.count > 1 ? `<span class="message-reaction-count">${topReaction.count}</span>` : ''}
                        </div>
                    `;
                }
                
                return `
                    <div class="message ${messageClass}" 
                         data-message-id="${msg.id}" 
                         data-nickname="${escapeHtml(nickname)}"
                         data-is-mine="${isMine}">
                        ${replyIndicatorHtml}
                        ${nicknameHtml}
                        ${photoHtml}
                        ${messageTextHtml}
                        <div class="message-time">${time} ${statusIcon}</div>
                        ${reactionHtml}
                    </div>
                `;
            }).join('');
            
            // Обработчики реакций
            if (typeof setupMessageReactions === 'function') {
                setupMessageReactions();
            }
            
            // Обработчики свайпов
            if (typeof setupMessageSwipeHandlers === 'function') {
                setupMessageSwipeHandlers();
            }
        }
        
        // Скроллим вниз
        if (scrollContainer && (!silent || wasAtBottom)) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 100);
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
        
        const userToken = localStorage.getItem('user_token');
        
        if (!userToken || !chatId) {
            console.warn('⚠️ [CHATS] Нет userToken или chatId для проверки блокировки');
            return;
        }
        
        // Сначала получаем информацию о чате чтобы узнать токен оппонента
        const chatResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-chat-info',
                params: { chatId }
            })
        });
        
        const chatResult = await chatResponse.json();
        
        if (chatResult.error || !chatResult.data) {
            console.warn('⚠️ [CHATS] Не удалось получить информацию о чате');
            return;
        }
        
        const chat = chatResult.data;
        
        // Определяем токен оппонента
        const opponentToken = chat.user_token_1 === userToken ? chat.user_token_2 : chat.user_token_1;
        
        if (!opponentToken) {
            console.warn('⚠️ [CHATS] Не удалось определить токен оппонента');
            return;
        }
        
        // Проверяем блокировку между двумя пользователями
        const response = await fetch('/api/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-block-status',
                params: { 
                    user1_token: userToken, 
                    user2_token: opponentToken 
                }
            })
        });
        
        const result = await response.json();
        
        if (result.data?.isBlocked) {
            isUserBlocked = result.data.blockedByCurrentUser;
            showBlockWarning(true, isUserBlocked ? 'self' : 'other');
        } else {
            isUserBlocked = false;
            showBlockWarning(false);
        }
        
    } catch (error) {
        console.error('❌ [CHATS] Ошибка проверки блокировки:', error);
    }
}

/**
 * Заблокировать/разблокировать пользователя
 */
async function toggleBlockUser() {
    console.log('🚫 [toggleBlockUser] Начало блокировки/разблокировки');
    
    const menu = document.getElementById('chatMenu');
    if (menu) menu.style.display = 'none';
    
    // Если идентификаторы не установлены, получаем из чата
    if (!currentOpponentId && !window.currentOpponentToken) {
        console.log('⚠️ [toggleBlockUser] Идентификаторы не найдены, получаем из чата...');
        
        if (!currentChatId) {
            tg.showAlert('Ошибка: ID собеседника не найден');
            return;
        }
        
        try {
            let userId = localStorage.getItem('user_token');
            if (!userId || userId === 'null') {
                userId = getCurrentUserId();
            }
            
            const response = await fetch('/api/neon-chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get-active',
                    params: { userId }
                })
            });
            const result = await response.json();
            
            if (result.error || !result.data) {
                tg.showAlert('Ошибка загрузки информации о чате');
                return;
            }
            
            const chat = result.data.find(c => c.id == currentChatId);
            
            if (!chat) {
                tg.showAlert('Чат не найден');
                return;
            }
            
            if (chat.opponent_token) {
                window.currentOpponentToken = chat.opponent_token;
                currentOpponentId = chat.opponent_token;
                window.currentOpponentNickname = chat.opponent_nickname || null;
            } else {
                tg.showAlert('Ошибка: не удалось определить собеседника');
                return;
            }
            
        } catch (error) {
            console.error('❌ [toggleBlockUser] Ошибка:', error);
            tg.showAlert('Ошибка загрузки информации о чате');
            return;
        }
    }
    
    const action = isUserBlocked ? 'unblock-user' : 'block-user';
    const confirmText = isUserBlocked 
        ? 'Разблокировать собеседника?' 
        : 'Заблокировать собеседника? Он не сможет отправлять вам сообщения.';
    
    tg.showConfirm(confirmText, async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const blockerToken = localStorage.getItem('user_token') || getCurrentUserId();
            const targetToken = window.currentOpponentToken || currentOpponentId;
            
            console.log('📤 [toggleBlockUser] Отправляем запрос:', { action, blockerToken: blockerToken?.substring(0, 16), targetToken: targetToken?.substring(0, 16) });
            
            const response = await fetch('/api/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    params: { 
                        blocker_token: blockerToken, 
                        blocked_token: targetToken,
                        blocked_nickname: window.currentOpponentNickname || null,
                        chat_id: currentChatId || null
                    }
                })
            });
            
            const result = await response.json();
            console.log('📥 [toggleBlockUser] Ответ:', result);
            
            if (result.error) {
                tg.showAlert('Ошибка: ' + (result.error.message || 'Неизвестная ошибка'));
                return;
            }
            
            isUserBlocked = !isUserBlocked;
            
            const blockMenuText = document.getElementById('blockMenuText');
            if (blockMenuText) {
                blockMenuText.textContent = isUserBlocked ? '✅ Разблокировать собеседника' : '🚫 Заблокировать собеседника';
            }
            
            updateBlockUI();
            tg.showAlert(isUserBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
            
            if (!isUserBlocked && currentChatId) {
                setTimeout(() => checkBlockStatus(currentChatId), 500);
            }
            
        } catch (error) {
            console.error('❌ [toggleBlockUser] Ошибка:', error);
            tg.showAlert('Ошибка при выполнении действия');
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
        '⚠️ Чат будет удален у обеих сторон. Все сообщения будут потеряны. Продолжить?',
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

/**
 * ==================== ОТВЕТ НА СООБЩЕНИЕ ====================
 */

/**
 * Ответить на сообщение
 */
function replyToMsg(messageId, nickname, messageText) {
    replyToMessage = { id: messageId, nickname, text: messageText };
    
    // Показываем превью
    const replyPreview = document.getElementById('replyPreview');
    const replyToNickname = document.getElementById('replyToNickname');
    const replyToText = document.getElementById('replyToText');
    
    if (replyToNickname) {
        replyToNickname.textContent = nickname;
    }
    if (replyToText) {
        replyToText.textContent = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;
    }
    if (replyPreview) {
        replyPreview.style.display = 'flex';
    }
    
    // Фокусируем поле ввода
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.focus();
}

/**
 * Скролл к сообщению и подсветка
 */
function scrollToMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl) return;
    
    // Скроллим к сообщению
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Добавляем класс для подсветки
    messageEl.classList.add('highlight');
    
    // Убираем подсветку через 1 секунду
    setTimeout(() => {
        messageEl.classList.remove('highlight');
    }, 1000);
}

/**
 * Применить сохраненный размер шрифта при загрузке чата
 */
function applyChatFontSize() {
    const savedSize = localStorage.getItem('chatFontSize') || 'medium';
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.classList.remove('font-small', 'font-medium', 'font-large');
        messagesContainer.classList.add(`font-${savedSize}`);
    }
    
    // Обновляем кнопку
    const btn = document.getElementById('chatFontSizeBtn');
    if (btn) {
        if (savedSize === 'small') {
            btn.style.fontSize = '14px';
        } else if (savedSize === 'medium') {
            btn.style.fontSize = '18px';
        } else {
            btn.style.fontSize = '22px';
        }
    }
}

window.replyToMsg = replyToMsg;
window.scrollToMessage = scrollToMessage;
window.applyChatFontSize = applyChatFontSize;

/**
 * Показать меню удаления сообщения
 */
function showDeleteMessageMenu(event, messageId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('Меню удаления для сообщения:', messageId);
    
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
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 15px; text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: var(--neon-red);">Удалить сообщение?</div>
            <div style="font-size: 12px; color: var(--text-gray);">Сообщение будет удалено у обоих</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="deleteMessage(${messageId})" style="
                padding: 12px; background: linear-gradient(135deg, #ff4444, #cc0000);
                border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
            ">🗑️ Удалить</button>
            <button onclick="closeDeleteMessageMenu()" style="
                padding: 12px; background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                border: none; border-radius: 10px; color: white; font-size: 14px; cursor: pointer;
            ">Отмена</button>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.className = 'delete-message-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7); z-index: 9999;
    `;
    overlay.onclick = closeDeleteMessageMenu;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

/**
 * Настройка long press для удаления своих сообщений
 */
function setupMessageLongPress() {
    const messages = document.querySelectorAll('.message[data-is-mine="true"]');
    
    messages.forEach(msg => {
        let pressTimer = null;
        let touchMoved = false;
        
        const startLongPress = (e) => {
            touchMoved = false;
            const messageId = msg.getAttribute('data-message-id');
            
            pressTimer = setTimeout(() => {
                if (!touchMoved && messageId) {
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    showDeleteMessageMenu(e, messageId);
                }
            }, 500);
        };
        
        const cancelLongPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };
        
        const handleTouchMove = () => {
            touchMoved = true;
            cancelLongPress();
        };
        
        msg.addEventListener('touchstart', startLongPress, { passive: true });
        msg.addEventListener('touchend', cancelLongPress, { passive: true });
        msg.addEventListener('touchmove', handleTouchMove, { passive: true });
        msg.addEventListener('mousedown', startLongPress);
        msg.addEventListener('mouseup', cancelLongPress);
        msg.addEventListener('mouseleave', cancelLongPress);
    });
}

/**
 * Пометить сообщения как доставленные
 */
async function markMessagesAsDelivered() {
    try {
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
        if (!userId || userId.startsWith('web_')) return;
        
        const response = await fetch('/api/neon-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-delivered',
                params: { userId }
            })
        });
        const result = await response.json();
        
        if (!result.error) {
            console.log('✅ Сообщения помечены как доставленные');
        }
    } catch (error) {
        console.error('Ошибка markMessagesAsDelivered:', error);
    }
}

/**
 * Отметить пользователя как неактивного
 */
async function markUserInactive(userId) {
    try {
        await fetch('/api/user-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'mark-inactive',
                params: { userId }
            })
        });
        console.log('👋 Пользователь неактивен');
    } catch (error) {
        console.error('Ошибка markUserInactive:', error);
    }
}

window.showDeleteMessageMenu = showDeleteMessageMenu;
window.setupMessageLongPress = setupMessageLongPress;
window.markMessagesAsDelivered = markMessagesAsDelivered;
window.markUserInactive = markUserInactive;

console.log('✅ [CHATS] Модуль чатов инициализирован');
