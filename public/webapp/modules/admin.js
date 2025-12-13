// ============================================================================
// ADMIN MODULE - Админ-панель с расширенным функционалом
// ============================================================================

let isAdminUser = false;
let currentAdminView = 'overview';
let selectedUserToken = null;
let selectedChatId = null;

// Форматирование даты и времени
function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', { hour12: false });
}

// Короткий формат даты
function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'сейчас';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' мин';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' ч';
    return d.toLocaleDateString('ru-RU');
}

// Запрос к админ API
async function fetchAdminData(action, params = {}) {
    const adminToken = localStorage.getItem('user_token');
    if (!adminToken) {
        throw new Error('Не найден user_token');
    }

    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params, adminToken })
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Ошибка запроса');
    }
    return data;
}

// Переключение вкладок админ-панели
function switchAdminTab(tab) {
    console.log('[ADMIN] switchAdminTab:', tab);
    currentAdminView = tab;
    
    // Обновляем стили табов
    document.querySelectorAll('.admin-tab').forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tab;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            btn.style.background = 'var(--neon-cyan)';
            btn.style.color = '#000';
            btn.style.border = 'none';
        } else {
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.color = '#fff';
            btn.style.border = '1px solid rgba(255,255,255,0.2)';
        }
    });
    
    // Скрываем все секции
    document.querySelectorAll('#adminScreen .admin-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Показываем нужную секцию
    const sectionMap = {
        'overview': 'adminSectionOverview',
        'users': 'adminSectionUsers',
        'ads': 'adminSectionAds',
        'chats': 'adminSectionChats'
    };
    
    const sectionId = sectionMap[tab];
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        section.classList.add('active');
    }

    // Загружаем данные
    if (tab === 'overview') loadAdminOverview();
    else if (tab === 'users') loadAdminUsers();
    else if (tab === 'ads') loadAdminAds();
    else if (tab === 'chats') loadAdminChats();
}

// Показать админ-панель
function showAdminPanel() {
    console.log('[ADMIN] showAdminPanel, isAdminUser:', isAdminUser);
    
    if (!isAdminUser) {
        alert('Требуются права администратора');
        return;
    }

    if (typeof closeHamburgerMenu === 'function') {
        closeHamburgerMenu();
    }
    
    const panel = document.getElementById('adminScreen');
    if (panel) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.classList.add('active');
        
        switchAdminTab('overview');
    }
}

// ===================== ОБЗОР =====================
async function loadAdminOverview() {
    const grid = document.getElementById('adminOverviewGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Загрузка...</div>';
    
    try {
        const res = await fetchAdminData('get-overview');
        const s = res.data || {};
        
        grid.innerHTML = `
            <div class="admin-card" style="background: rgba(0,217,255,0.1); border: 1px solid var(--neon-cyan);">
                <div class="value" style="color: var(--neon-cyan);">${s.users || 0}</div>
                <div class="label">Пользователей</div>
            </div>
            <div class="admin-card" style="background: rgba(0,255,136,0.1); border: 1px solid var(--neon-green);">
                <div class="value" style="color: var(--neon-green);">${s.ads || 0}</div>
                <div class="label">Анкет</div>
            </div>
            <div class="admin-card" style="background: rgba(138,43,226,0.1); border: 1px solid #9b59b6;">
                <div class="value" style="color: #9b59b6;">${s.chats || 0}</div>
                <div class="label">Чатов</div>
            </div>
            <div class="admin-card" style="background: rgba(255,107,107,0.1); border: 1px solid #ff6b6b;">
                <div class="value" style="color: #ff6b6b;">${s.bannedUsers || 0}</div>
                <div class="label">В бане</div>
            </div>
            <div class="admin-card" style="background: rgba(255,165,0,0.1); border: 1px solid orange;">
                <div class="value" style="color: orange;">${s.blockedAds || 0}</div>
                <div class="label">Заблок. анкет</div>
            </div>
        `;
    } catch (err) {
        grid.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// ===================== ПОЛЬЗОВАТЕЛИ =====================
async function loadAdminUsers() {
    const list = document.getElementById('adminUsersList');
    if (!list) return;
    
    const searchInput = document.getElementById('adminUserSearch');
    const search = searchInput ? searchInput.value.trim() : '';
    
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Загрузка...</div>';
    
    try {
        const res = await fetchAdminData('get-users', { search, limit: 100 });
        const users = res.data || [];
        
        if (users.length === 0) {
            list.innerHTML = '<div class="admin-empty">Пользователи не найдены</div>';
            return;
        }
        
        list.innerHTML = users.map(u => {
            const banned = u.is_banned ? `<span class="admin-pill warn">БАН ${u.banned_until ? 'до ' + formatDateShort(u.banned_until) : '∞'}</span>` : '';
            const admin = u.is_admin ? `<span class="admin-pill" style="background:rgba(255,215,0,0.2);color:gold;">ADMIN</span>` : '';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>${u.display_nickname || 'Без ника'} ${admin} ${banned}</strong>
                        <span>TG ID: ${u.id || '—'}</span>
                        <span>Token: <code style="font-size:0.7rem;color:#888;">${u.user_token?.substring(0,20) || '—'}...</code></span>
                        <span>Email: ${u.email || '—'}</span>
                        <span>Создан: ${formatDateShort(u.created_at)}</span>
                        ${u.ban_reason ? `<span class="admin-hint">Причина: ${u.ban_reason}</span>` : ''}
                    </div>
                    <div class="actions">
                        <button class="neon-button small" onclick="viewUserChats('${u.user_token}')">💬 Чаты</button>
                        ${u.is_banned 
                            ? `<button class="neon-button small" onclick="unbanUser('${u.user_token}')">✅ Разбан</button>`
                            : `<button class="neon-button small danger" onclick="banUser('${u.user_token}')">🚫 Бан</button>`
                        }
                        <button class="neon-button small" onclick="sendNotificationToUser('${u.user_token}')">📢 Сообщение</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Бан пользователя
async function banUser(userToken) {
    const reason = prompt('Причина бана:', 'Нарушение правил');
    if (reason === null) return;
    
    const hours = prompt('На сколько часов? (пусто = навсегда)', '');
    const durationHours = hours && hours.trim() ? parseInt(hours) : null;
    
    try {
        await fetchAdminData('ban-user', { userToken, reason, durationHours });
        alert('Пользователь забанен');
        loadAdminUsers();
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

// Разбан пользователя
async function unbanUser(userToken) {
    if (!confirm('Снять бан?')) return;
    
    try {
        await fetchAdminData('unban-user', { userToken });
        alert('Бан снят');
        loadAdminUsers();
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

// Отправить сообщение пользователю
async function sendNotificationToUser(userToken) {
    const message = prompt('Сообщение пользователю:');
    if (!message) return;
    
    try {
        const res = await fetchAdminData('notify-user', { 
            userToken, 
            title: 'Сообщение от админа',
            message 
        });
        alert(`Отправлено! TG: ${res.data?.telegramSent ? 'да' : 'нет'}, Push: ${res.data?.pushSent ? 'да' : 'нет'}`);
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

// Просмотр чатов пользователя
async function viewUserChats(userToken) {
    selectedUserToken = userToken;
    
    const list = document.getElementById('adminUsersList');
    if (!list) return;
    
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Загрузка чатов...</div>';
    
    try {
        const res = await fetchAdminData('get-user-chats', { userToken });
        const chats = res.data || [];
        
        let html = `
            <div style="margin-bottom:1rem;">
                <button class="neon-button small" onclick="loadAdminUsers()">← Назад к списку</button>
                <span style="margin-left:1rem;color:var(--text-muted);">Чаты пользователя (${chats.length})</span>
            </div>
        `;
        
        if (chats.length === 0) {
            html += '<div class="admin-empty">Чатов нет</div>';
        } else {
            html += chats.map(c => {
                const isUser1 = c.user_token_1 === userToken;
                const partnerNick = isUser1 ? c.user2_nickname : c.user1_nickname;
                return `
                    <div class="admin-row">
                        <div class="meta">
                            <strong>💬 Чат #${c.id} с ${partnerNick || 'Аноним'}</strong>
                            <span>Сообщений: ${c.message_count || 0}</span>
                            <span>Последнее: ${formatDateShort(c.last_message_at)}</span>
                            ${c.last_message ? `<span class="admin-hint">"${c.last_message.substring(0, 50)}${c.last_message.length > 50 ? '...' : ''}"</span>` : ''}
                        </div>
                        <div class="actions">
                            <button class="neon-button small" onclick="viewChatMessages(${c.id})">📖 Читать</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        list.innerHTML = html;
    } catch (err) {
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Просмотр сообщений чата
async function viewChatMessages(chatId) {
    selectedChatId = chatId;
    
    const list = document.getElementById('adminUsersList') || document.getElementById('adminChatsList');
    if (!list) return;
    
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Загрузка сообщений...</div>';
    
    try {
        const res = await fetchAdminData('get-chat-messages', { chatId });
        const messages = res.data || [];
        
        let html = `
            <div style="margin-bottom:1rem;">
                <button class="neon-button small" onclick="${selectedUserToken ? `viewUserChats('${selectedUserToken}')` : 'loadAdminChats()'}">← Назад</button>
                <span style="margin-left:1rem;color:var(--text-muted);">Чат #${chatId} (${messages.length} сообщений)</span>
            </div>
            <div style="max-height:400px;overflow-y:auto;background:rgba(0,0,0,0.3);border-radius:8px;padding:0.5rem;">
        `;
        
        if (messages.length === 0) {
            html += '<div class="admin-empty">Сообщений нет</div>';
        } else {
            html += messages.map(m => `
                <div style="padding:0.5rem;margin-bottom:0.5rem;background:rgba(255,255,255,0.05);border-radius:6px;border-left:3px solid ${m.sender_token === selectedUserToken ? 'var(--neon-cyan)' : 'var(--neon-pink)'};">
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.3rem;">
                        <strong style="color:${m.sender_token === selectedUserToken ? 'var(--neon-cyan)' : 'var(--neon-pink)'};">${m.sender_nickname || 'Аноним'}</strong>
                        • ${formatDateTime(m.created_at)}
                        <button onclick="deleteMessage(${m.id})" style="float:right;background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:0.7rem;">🗑️</button>
                    </div>
                    <div style="color:#fff;word-break:break-word;">${escapeHtml(m.message)}</div>
                </div>
            `).join('');
        }
        
        html += '</div>';
        list.innerHTML = html;
    } catch (err) {
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Удалить сообщение
async function deleteMessage(messageId) {
    if (!confirm('Удалить сообщение?')) return;
    
    try {
        await fetchAdminData('delete-message', { messageId });
        viewChatMessages(selectedChatId);
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

// ===================== АНКЕТЫ =====================
async function loadAdminAds() {
    const list = document.getElementById('adminAdsList');
    if (!list) return;
    
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Загрузка...</div>';
    
    try {
        const res = await fetchAdminData('get-ads', { limit: 100 });
        const ads = res.data || [];
        
        if (ads.length === 0) {
            list.innerHTML = '<div class="admin-empty">Анкет нет</div>';
            return;
        }
        
        list.innerHTML = ads.map(ad => {
            const blocked = ad.is_blocked ? `<span class="admin-pill warn">ЗАБЛОК</span>` : '';
            const pinned = ad.is_pinned ? `<span class="admin-pill" style="background:rgba(255,215,0,0.2);color:gold;">📌</span>` : '';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>#${ad.id} ${ad.display_nickname || 'Аноним'} ${pinned} ${blocked}</strong>
                        <span>📍 ${ad.city || '?'}, ${ad.country || '?'}</span>
                        <span>👤 ${ad.gender || '?'} ищет ${ad.target || '?'} для ${ad.goal || '?'}</span>
                        <span>Создано: ${formatDateShort(ad.created_at)}</span>
                        ${ad.blocked_reason ? `<span class="admin-hint">Причина: ${ad.blocked_reason}</span>` : ''}
                    </div>
                    <div class="actions">
                        ${ad.is_blocked 
                            ? `<button class="neon-button small" onclick="unblockAd(${ad.id})">✅ Разблок</button>`
                            : `<button class="neon-button small danger" onclick="blockAd(${ad.id})">🚫 Заблок</button>`
                        }
                        <button class="neon-button small danger" onclick="deleteAd(${ad.id})">🗑️ Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Блокировка анкеты
async function blockAd(adId) {
    const reason = prompt('Причина блокировки:', 'Нарушение правил');
    if (reason === null) return;
    
    try {
        await fetchAdminData('block-ad', { adId, reason });
        loadAdminAds();
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

// Разблокировка анкеты
async function unblockAd(adId) {
    if (!confirm('Разблокировать анкету?')) return;
    
    try {
        await fetchAdminData('unblock-ad', { adId });
        loadAdminAds();
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

// Удаление анкеты
async function deleteAd(adId) {
    if (!confirm('УДАЛИТЬ анкету #' + adId + '? Это удалит все связанные чаты!')) return;
    if (!confirm('Вы уверены? Это действие необратимо!')) return;
    
    try {
        await fetchAdminData('delete-ad', { adId });
        loadAdminAds();
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

// ===================== ЧАТЫ =====================
async function loadAdminChats() {
    const list = document.getElementById('adminChatsList');
    if (!list) return;
    
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Загрузка...</div>';
    
    try {
        const res = await fetchAdminData('get-chats', { limit: 100 });
        const chats = res.data || [];
        
        if (chats.length === 0) {
            list.innerHTML = '<div class="admin-empty">Чатов нет</div>';
            return;
        }
        
        list.innerHTML = chats.map(c => {
            const blocked = c.blocked_by_token ? `<span class="admin-pill warn">🚫</span>` : '';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>💬 #${c.id} ${blocked}</strong>
                        <span>👤 ${c.user1_nickname || 'Аноним'} ↔ ${c.user2_nickname || 'Аноним'}</span>
                        <span>Анкета: #${c.ad_id || '—'}</span>
                        <span>Создан: ${formatDateShort(c.created_at)} | Последнее: ${formatDateShort(c.last_message_at)}</span>
                        ${c.last_message ? `<span class="admin-hint">"${c.last_message.substring(0, 60)}${c.last_message.length > 60 ? '...' : ''}"</span>` : ''}
                    </div>
                    <div class="actions">
                        <button class="neon-button small" onclick="selectedUserToken=null;viewChatMessages(${c.id})">📖 Читать</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Экранирование HTML
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Установить статус администратора
function setAdminStatus(status) {
    isAdminUser = status;
    console.log('[ADMIN] isAdminUser:', isAdminUser);
}

// Отправка уведомления из формы
async function sendAdminNotification() {
    const tokenInput = document.getElementById('adminNotifyToken');
    const titleInput = document.getElementById('adminNotifyTitle');
    const msgInput = document.getElementById('adminNotifyMessage');
    const statusEl = document.getElementById('adminNotifyStatus');
    if (!tokenInput || !msgInput) return;
    
    if (statusEl) statusEl.textContent = 'Отправляем...';
    
    try {
        const res = await fetchAdminData('notify-user', {
            userToken: tokenInput.value.trim(),
            title: titleInput?.value?.trim() || 'Уведомление',
            message: msgInput.value.trim()
        });
        if (statusEl) statusEl.textContent = `✅ TG: ${res.data?.telegramSent ? 'да' : 'нет'}, Push: ${res.data?.pushSent ? 'да' : 'нет'}`;
        tokenInput.value = '';
        if (titleInput) titleInput.value = '';
        msgInput.value = '';
    } catch (err) {
        if (statusEl) statusEl.textContent = `❌ ${err.message}`;
    }
}

// Экспорт всех функций
window.isAdminUser = isAdminUser;
window.setAdminStatus = setAdminStatus;
window.switchAdminTab = switchAdminTab;
window.showAdminPanel = showAdminPanel;
window.loadAdminOverview = loadAdminOverview;
window.loadAdminUsers = loadAdminUsers;
window.loadAdminAds = loadAdminAds;
window.loadAdminChats = loadAdminChats;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.blockAd = blockAd;
window.unblockAd = unblockAd;
window.deleteAd = deleteAd;
window.viewUserChats = viewUserChats;
window.viewChatMessages = viewChatMessages;
window.deleteMessage = deleteMessage;
window.sendNotificationToUser = sendNotificationToUser;
window.sendAdminNotification = sendAdminNotification;
window.fetchAdminData = fetchAdminData;

console.log('✅ [ADMIN] Модуль админ-панели v2 инициализирован');
console.log('[ADMIN] Экспортированные функции:', Object.keys(window).filter(k => k.includes('Admin') || k.includes('admin') || ['switchAdminTab', 'banUser', 'blockAd', 'deleteAd', 'sendNotification'].includes(k)));
