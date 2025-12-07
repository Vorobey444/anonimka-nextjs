// ============= РњРР  Р§РђРў =============

let isSendingWorld = false;
let worldChatTimer = null;

window.addEventListener('DOMContentLoaded', () => {
    loadWorldMessages();
    setupWorldSendOnEnter();
    startWorldAutoReload();
});

function startWorldAutoReload() {
    if (worldChatTimer) clearInterval(worldChatTimer);
    worldChatTimer = setInterval(loadWorldMessages, 10000);
}

async function loadWorldMessages() {
    const container = document.getElementById('worldMessages');
    container.innerHTML = '<div class="empty-state">Р—Р°РіСЂСѓР·РєР°...</div>';
    try {
        const data = await apiRequest('/api/world-chat/messages');
        const messages = data.messages || [];
        renderWorldMessages(messages);
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РјРёСЂ-С‡Р°С‚Р°:', error);
        container.innerHTML = '<div class="empty-state">РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРѕРѕР±С‰РµРЅРёСЏ</div>';
    }
}

function renderWorldMessages(messages) {
    const container = document.getElementById('worldMessages');
    container.innerHTML = '';

    if (!messages.length) {
        container.innerHTML = '<div class="empty-state">РџРѕРєР° РЅРµС‚ СЃРѕРѕР±С‰РµРЅРёР№</div>';
        return;
    }

    messages.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble them';
        const genderIcon = msg.gender === 'male' ? 'рџ‘Ё' : msg.gender === 'female' ? 'рџ‘©' : 'рџ§‘';
        bubble.innerHTML = `
            <div class="chat-text">${genderIcon} ${escapeHtml(msg.text || '')}</div>
            <div class="chat-meta">${formatDate(msg.created_at || msg.time)}</div>
        `;
        container.appendChild(bubble);
    });

    container.scrollTop = container.scrollHeight;
}

function setupWorldSendOnEnter() {
    const input = document.getElementById('worldMessageInput');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendWorldMessage(e);
        }
    });
}

async function sendWorldMessage(event) {
    if (event) event.preventDefault();
    if (isSendingWorld) return;

    const input = document.getElementById('worldMessageInput');
    const text = input.value.trim();
    if (!text) return;

    isSendingWorld = true;
    setWorldSendState(true);
    try {
        await apiRequest('/api/world-chat/messages', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        input.value = '';
        await loadWorldMessages();
    } catch (error) {
        console.error('РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё РІ РјРёСЂ-С‡Р°С‚:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ');
    } finally {
        isSendingWorld = false;
        setWorldSendState(false);
    }
}

function setWorldSendState(isSending) {
    const btn = document.getElementById('worldSendBtn');
    if (!btn) return;
    btn.disabled = isSending;
    btn.textContent = isSending ? '...' : 'вћ¤';
}

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
window.sendWorldMessage = sendWorldMessage;

