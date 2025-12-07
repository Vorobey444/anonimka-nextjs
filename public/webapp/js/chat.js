// ============= РћРљРќРћ Р§РђРўРђ =============

let chatId = null;
let isSending = false;

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    chatId = params.get('chatId');
    if (!chatId) {
        alert('Р§Р°С‚ РЅРµ РЅР°Р№РґРµРЅ');
        window.location.href = '/webapp/chats.html';
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
            titleEl.textContent = data.chat.other_nickname || 'Р§Р°С‚';
        }
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё С‡Р°С‚Р°:', error);
    }
}

async function loadMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '<div class="empty-state">Р—Р°РіСЂСѓР·РєР°...</div>';

    try {
        const data = await apiRequest(`/api/chats/${chatId}/messages`);
        const messages = data.messages || [];
        renderMessages(messages);
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃРѕРѕР±С‰РµРЅРёР№:', error);
        container.innerHTML = '<div class="empty-state">РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРѕРѕР±С‰РµРЅРёСЏ</div>';
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messages');
    container.innerHTML = '';

    if (!messages.length) {
        container.innerHTML = '<div class="empty-state">РЎРѕРѕР±С‰РµРЅРёР№ РїРѕРєР° РЅРµС‚</div>';
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
        console.error('РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ');
    } finally {
        isSending = false;
        setSendState(false);
    }
}

function setSendState(isSending) {
    const btn = document.getElementById('sendBtn');
    if (!btn) return;
    btn.disabled = isSending;
    btn.textContent = isSending ? '...' : 'вћ¤';
}

// РџСЂРѕСЃС‚Р°СЏ СЌРєСЂР°РЅРёР·Р°С†РёСЏ HTML
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[ch]));
}

// Р­РєСЃРїРѕСЂС‚
window.sendMessage = sendMessage;

