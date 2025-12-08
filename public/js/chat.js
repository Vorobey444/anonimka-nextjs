// ============= CHAT.JS - Переписка =============

let currentChatId = null;
let messages = [];

function openChatView(chatId) {
    currentChatId = chatId;
    showScreen('chatView');
    loadChatMessages(chatId);
}

async function loadChatMessages(chatId) {
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch(`/api/chat/messages?chat_id=${chatId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_token: userToken })
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки сообщений');
        
        const data = await response.json();
        
        if (data.success) {
            messages = data.messages || [];
            renderChatMessages();
        }
        
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
    }
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = '<p class="no-messages">Пока нет сообщений</p>';
        return;
    }
    
    container.innerHTML = '';
    
    messages.forEach(msg => {
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${msg.is_my_message ? 'my-message' : 'their-message'}`;
        msgEl.innerHTML = `
            <div class="message-author">${msg.nickname || 'Аноним'}</div>
            <div class="message-text">${msg.text}</div>
            <div class="message-time">${new Date(msg.created_at).toLocaleTimeString()}</div>
        `;
        container.appendChild(msgEl);
    });
    
    // Скролл вниз
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || !input.value.trim()) return;
    
    const messageText = input.value.trim();
    
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_token: userToken,
                chat_id: currentChatId,
                text: messageText
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            await loadChatMessages(currentChatId);
        } else {
            alert('Ошибка отправки сообщения: ' + (data.error || 'Неизвестная ошибка'));
        }
        
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        alert('Ошибка соединения с сервером');
    }
}

function toggleChatMenu() {
    const menu = document.getElementById('chatMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

async function toggleBlockUser() {
    if (!confirm('Заблокировать этого пользователя?')) return;
    
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/chat/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_token: userToken,
                chat_id: currentChatId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Пользователь заблокирован');
            window.location.href = '/chats';
        } else {
            alert('Ошибка блокировки');
        }
        
    } catch (error) {
        console.error('Ошибка блокировки:', error);
    }
}

async function confirmDeleteChat() {
    if (!confirm('Удалить этот чат?')) return;
    
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/chat/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_token: userToken,
                chat_id: currentChatId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Чат удален');
            window.location.href = '/chats';
        } else {
            alert('Ошибка удаления');
        }
        
    } catch (error) {
        console.error('Ошибка удаления чата:', error);
    }
}

function toggleChatFontSize() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const currentSize = localStorage.getItem('chat_font_size') || 'normal';
    const newSize = currentSize === 'normal' ? 'large' : 'normal';
    
    localStorage.setItem('chat_font_size', newSize);
    container.classList.toggle('large-font', newSize === 'large');
}

function cancelReply() {
    const replyPreview = document.getElementById('replyPreview');
    if (replyPreview) {
        replyPreview.style.display = 'none';
    }
}

function handlePhotoSelect(event) {
    // TODO: Реализовать загрузку фото
    console.log('Photo selected:', event.target.files[0]);
}

function showPhotoSourceMenu() {
    const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    if (hasCamera) {
        // Показываем выбор: камера или галерея
        if (confirm('Открыть камеру? (Отмена = выбрать из галереи)')) {
            document.getElementById('cameraInput')?.click();
        } else {
            document.getElementById('photoInput')?.click();
        }
    } else {
        // Только галерея
        document.getElementById('photoInput')?.click();
    }
}

function removePhoto() {
    const preview = document.getElementById('photoPreview');
    if (preview) {
        preview.style.display = 'none';
    }
}

// Автообновление сообщений
let chatUpdateInterval = null;

function startChatAutoUpdate() {
    if (chatUpdateInterval) clearInterval(chatUpdateInterval);
    chatUpdateInterval = setInterval(() => {
        if (currentChatId) {
            loadChatMessages(currentChatId);
        }
    }, 3000);
}

function stopChatAutoUpdate() {
    if (chatUpdateInterval) {
        clearInterval(chatUpdateInterval);
        chatUpdateInterval = null;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Получаем chat_id из URL если есть
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('id');
    
    if (chatId) {
        openChatView(chatId);
        startChatAutoUpdate();
    }
});

// Экспорт
window.openChatView = openChatView;
window.loadChatMessages = loadChatMessages;
window.sendMessage = sendMessage;
window.toggleChatMenu = toggleChatMenu;
window.toggleBlockUser = toggleBlockUser;
window.confirmDeleteChat = confirmDeleteChat;
window.toggleChatFontSize = toggleChatFontSize;
window.cancelReply = cancelReply;
window.handlePhotoSelect = handlePhotoSelect;
window.showPhotoSourceMenu = showPhotoSourceMenu;
window.removePhoto = removePhoto;
window.showMyChats = () => window.location.href = '/chats';
