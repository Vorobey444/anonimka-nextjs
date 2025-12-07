// ============= ОКНО ЧАТА =============

let chatId = null;
let isSending = false;

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    chatId = params.get('chatId');
    if (!chatId) {
        alert('Чат не найден');
        window.location.href = '/webapp-v2/chats.html';
        return;
    }

    loadChat();
    loadMessages();
    setupSendOnEnter();
});

async function loadChat() {
    try {
        const data = await apiRequest(`/api/chats/${chatId}`);
        const titleEl = document.getElementById('chatTitle');
        if (data.chat && titleEl) {
            titleEl.textContent = data.chat.other_nickname || 'Чат';
        }
    } catch (error) {
        console.error('Ошибка загрузки чата:', error);
    }
}

async function loadMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '<div class="empty-state">Загрузка...</div>';

    try {
        const data = await apiRequest(`/api/chats/${chatId}/messages`);
        const messages = data.messages || [];
        renderMessages(messages);
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        container.innerHTML = '<div class="empty-state">Не удалось загрузить сообщения</div>';
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messages');
    container.innerHTML = '';

    if (!messages.length) {
        container.innerHTML = '<div class="empty-state">Сообщений пока нет</div>';
        return;
    }

    const userId = getUserId();

    messages.forEach(msg => {
        const bubble = document.createElement('div');
        const isMine = msg.sender_id?.toString() === userId?.toString();
        bubble.className = `chat-bubble ${isMine ? 'me' : 'them'}`;
        bubble.innerHTML = `
            <div class="chat-text">${escapeHtml(msg.text || '')}</div>
            <div class="chat-meta">${formatDate(msg.created_at || msg.time)}</div>
        `;
        container.appendChild(bubble);
    });

    container.scrollTop = container.scrollHeight;
}

function setupSendOnEnter() {
    const input = document.getElementById('messageInput');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    });
}

async function sendMessage(event) {
    if (event) event.preventDefault();
    if (isSending) return;

    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    isSending = true;
    setSendState(true);

    try {
        await apiRequest('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ chatId, text })
        });
        input.value = '';
        await loadMessages();
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        alert('Не удалось отправить сообщение');
    } finally {
        isSending = false;
        setSendState(false);
    }
}

function setSendState(isSending) {
    const btn = document.getElementById('sendBtn');
    if (!btn) return;
    btn.disabled = isSending;
    btn.textContent = isSending ? '...' : '➤';
}

// Простая экранизация HTML
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[ch]));
}

// Экспорт
window.sendMessage = sendMessage;
