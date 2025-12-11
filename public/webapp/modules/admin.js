// ============================================================================
// ADMIN MODULE - Админ-панель
// ============================================================================

let isAdminUser = false;

// Форматирование даты и времени
function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', { hour12: false });
}

// Переключение вкладок админ-панели
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tab;
        btn.classList.toggle('active', isActive);
    });
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.toggle('active', section.id.toLowerCase().includes(tab));
    });

    // Загружаем данные под выбранную вкладку
    if (tab === 'overview') {
        loadAdminOverview();
    } else if (tab === 'ads') {
        loadAdminAds();
    } else if (tab === 'chats') {
        loadAdminChats();
    } else if (tab === 'users') {
        loadAdminUsers();
    }
}

// Запрос к админ API
async function fetchAdminData(action, params = {}) {
    const adminToken = localStorage.getItem('user_token');
    if (!adminToken) {
        throw new Error('Не найден user_token для запроса администратора');
    }

    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params, adminToken })
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Ошибка админ-запроса');
    }
    return data;
}

// Показать админ-панель
function showAdminPanel() {
    console.log('[ADMIN PANEL] showAdminPanel вызвана');
    
    if (!isAdminUser) {
        console.warn('[ADMIN PANEL] Доступ запрещен: isAdminUser = false');
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('Требуются права администратора');
        } else {
            alert('Требуются права администратора');
        }
        return;
    }

    console.log('[ADMIN PANEL] Доступ разрешен, открываем панель');
    
    if (typeof closeHamburgerMenu === 'function') {
        closeHamburgerMenu();
    }
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            if (s.id !== 'adminPanel') {
                s.style.display = 'none';
            }
        });
        panel.style.display = 'block';
        panel.classList.add('active');
    }
    
    if (typeof showScreen === 'function') {
        showScreen('adminPanel');
    }
    
    switchAdminTab('overview');
}

// Загрузка обзора админки
async function loadAdminOverview() {
    console.log('[ADMIN PANEL] loadAdminOverview начата');
    const grid = document.getElementById('adminOverviewGrid');
    if (!grid) {
        console.error('[ADMIN PANEL] adminOverviewGrid не найден!');
        return;
    }
    
    grid.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const res = await fetchAdminData('get-overview');
        const stats = res.data || {};
        const cards = [
            { label: 'Пользователи', value: stats.users },
            { label: 'Анкеты', value: stats.ads },
            { label: 'Приватные чаты', value: stats.chats },
            { label: 'В бане', value: stats.bannedUsers },
            { label: 'Заблокированные анкеты', value: stats.blockedAds }
        ];
        grid.innerHTML = cards.map(card => `
            <div class="admin-card">
                <div class="label">${card.label}</div>
                <div class="value">${card.value ?? 0}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error('[ADMIN PANEL] Ошибка загрузки обзора:', err);
        grid.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Загрузка списка анкет
async function loadAdminAds() {
    const list = document.getElementById('adminAdsList');
    if (!list) return;
    list.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const res = await fetchAdminData('get-ads');
        const ads = res.data || [];
        
        if (ads.length === 0) {
            list.innerHTML = '<div class="admin-empty">Анкет нет</div>';
            return;
        }
        
        list.innerHTML = ads.map(ad => {
            const status = ad.is_blocked ? `<span class="admin-pill warn">Блок до ${formatDateTime(ad.blocked_until) || '—'}</span>` : '<span class="admin-pill ok">Активно</span>';
            const reason = ad.blocked_reason ? `<div class="admin-hint">Причина: ${ad.blocked_reason}</div>` : '';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>#${ad.id} • ${ad.city || 'Город?'} ${ad.country ? '(' + ad.country + ')' : ''}</strong>
                        <span>Ник: ${ad.display_nickname || '—'}</span>
                        <span>Токен: ${ad.user_token ? ad.user_token.substring(0, 12) + '…' : '—'}</span>
                        <span>Создано: ${formatDateTime(ad.created_at)}</span>
                        ${status}
                        ${reason}
                    </div>
                    <div class="actions">
                        ${ad.is_blocked ? 
                            `<button class="neon-button" onclick="unblockAdFromAdmin(${ad.id})">Разблокировать</button>` :
                            `<button class="neon-button primary" onclick="blockAdFromAdmin(${ad.id})">Заблокировать</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('[ADMIN] Ошибка загрузки анкет:', err);
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Загрузка списка чатов
async function loadAdminChats() {
    const list = document.getElementById('adminChatsList');
    if (!list) return;
    list.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const res = await fetchAdminData('get-chats');
        const chats = res.data || [];
        
        if (chats.length === 0) {
            list.innerHTML = '<div class="admin-empty">Чатов нет</div>';
            return;
        }
        
        list.innerHTML = chats.map(chat => {
            const blockPill = chat.blocked_by_token ? `<span class="admin-pill warn">Заблокирован</span>` : '';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>Чат #${chat.id} • Ad ${chat.ad_id || '—'}</strong>
                        <span>U1: ${chat.user_token_1 ? chat.user_token_1.substring(0, 12) + '…' : '—'} (${chat.user1_nickname || '—'})</span>
                        <span>U2: ${chat.user_token_2 ? chat.user_token_2.substring(0, 12) + '…' : '—'} (${chat.user2_nickname || '—'})</span>
                        <span>Создан: ${formatDateTime(chat.created_at)}</span>
                        <span>Последнее: ${formatDateTime(chat.last_message_at)}</span>
                        ${blockPill}
                        <span class="admin-hint">${chat.last_message ? 'Последнее сообщение: ' + chat.last_message : 'Сообщений нет'}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('[ADMIN] Ошибка загрузки чатов:', err);
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Загрузка списка пользователей
async function loadAdminUsers() {
    const list = document.getElementById('adminUsersList');
    const searchInput = document.getElementById('adminUserSearch');
    if (!list) return;
    list.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const search = searchInput ? searchInput.value.trim() : '';
        const res = await fetchAdminData('get-users', { search });
        const users = res.data || [];
        
        if (users.length === 0) {
            list.innerHTML = '<div class="admin-empty">Пользователи не найдены</div>';
            return;
        }
        
        list.innerHTML = users.map(user => {
            const status = user.is_banned ? `<span class="admin-pill warn">Бан ${user.banned_until ? formatDateTime(user.banned_until) : 'бессрочно'}</span>` : '<span class="admin-pill ok">Активен</span>';
            return `
                <div class="admin-row">
                    <div class="meta">
                        <strong>${user.display_nickname || 'Без никнейма'}</strong>
                        <span>TG: ${user.id || '—'} | Token: ${user.user_token ? user.user_token.substring(0, 12) + '…' : '—'}</span>
                        <span>Email: ${user.email || '—'}</span>
                        <span>Создан: ${formatDateTime(user.created_at)}</span>
                        ${status}
                        ${user.ban_reason ? `<span class="admin-hint">${user.ban_reason}</span>` : ''}
                    </div>
                    <div class="actions">
                        ${user.is_banned ?
                            `<button class="neon-button" onclick="unbanUserFromAdmin('${user.user_token}')">Снять бан</button>` :
                            `<button class="neon-button primary" onclick="banUserFromAdmin('${user.user_token}')">Забанить</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('[ADMIN] Ошибка загрузки пользователей:', err);
        list.innerHTML = `<div class="admin-empty">Ошибка: ${err.message}</div>`;
    }
}

// Забанить пользователя
async function banUserFromAdmin(userToken) {
    const reason = prompt('Причина блокировки?', 'Нарушение правил');
    if (reason === null) return;
    const hoursInput = prompt('Длительность бана в часах (пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    
    try {
        await fetchAdminData('ban-user', { userToken, reason, durationHours });
        loadAdminUsers();
    } catch (err) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert(err.message);
        } else {
            alert(err.message);
        }
    }
}

// Снять бан с пользователя
async function unbanUserFromAdmin(userToken) {
    if (!confirm('Снять бан с пользователя?')) return;
    
    try {
        await fetchAdminData('unban-user', { userToken });
        loadAdminUsers();
    } catch (err) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert(err.message);
        } else {
            alert(err.message);
        }
    }
}

// Заблокировать анкету
async function blockAdFromAdmin(adId) {
    const reason = prompt('Причина блокировки анкеты?', 'Модерация');
    if (reason === null) return;
    const hoursInput = prompt('Длительность блокировки (часов, пусто = бессрочно)');
    const durationHours = hoursInput && hoursInput.trim() !== '' ? Number(hoursInput) : null;
    
    try {
        await fetchAdminData('block-ad', { adId, reason, durationHours });
        loadAdminAds();
    } catch (err) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert(err.message);
        } else {
            alert(err.message);
        }
    }
}

// Разблокировать анкету
async function unblockAdFromAdmin(adId) {
    if (!confirm('Разблокировать анкету?')) return;
    
    try {
        await fetchAdminData('unblock-ad', { adId });
        loadAdminAds();
    } catch (err) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert(err.message);
        } else {
            alert(err.message);
        }
    }
}

// Отправить уведомление пользователю
async function sendAdminNotification() {
    const tokenInput = document.getElementById('adminNotifyToken');
    const titleInput = document.getElementById('adminNotifyTitle');
    const msgInput = document.getElementById('adminNotifyMessage');
    const statusEl = document.getElementById('adminNotifyStatus');
    if (!tokenInput || !titleInput || !msgInput || !statusEl) return;
    
    statusEl.textContent = 'Отправляем...';
    
    try {
        const res = await fetchAdminData('notify-user', {
            userToken: tokenInput.value.trim(),
            title: titleInput.value.trim() || 'Уведомление',
            message: msgInput.value.trim()
        });
        statusEl.textContent = `Готово. Telegram: ${res.data?.telegramSent ? 'да' : 'нет'}, Push: ${res.data?.pushSent ? 'да' : 'нет'}`;
    } catch (err) {
        statusEl.textContent = `Ошибка: ${err.message}`;
    }
}

// Установить статус администратора
function setAdminStatus(status) {
    isAdminUser = status;
    console.log('[ADMIN] isAdminUser установлен:', isAdminUser);
}

// Экспорт функций
window.isAdminUser = isAdminUser;
window.setAdminStatus = setAdminStatus;
window.switchAdminTab = switchAdminTab;
window.fetchAdminData = fetchAdminData;
window.showAdminPanel = showAdminPanel;
window.loadAdminOverview = loadAdminOverview;
window.loadAdminAds = loadAdminAds;
window.loadAdminChats = loadAdminChats;
window.loadAdminUsers = loadAdminUsers;
window.banUserFromAdmin = banUserFromAdmin;
window.unbanUserFromAdmin = unbanUserFromAdmin;
window.blockAdFromAdmin = blockAdFromAdmin;
window.unblockAdFromAdmin = unblockAdFromAdmin;
window.sendAdminNotification = sendAdminNotification;

console.log('✅ [ADMIN] Модуль админ-панели инициализирован');
