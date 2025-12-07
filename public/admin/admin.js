// Admin Panel JavaScript

const API_BASE = '/api';
let currentTab = 'overview';
let adminToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get admin token from localStorage or prompt
    adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
        adminToken = prompt('Введите ваш user_token (токен администратора):');
        if (adminToken) {
            localStorage.setItem('admin_token', adminToken);
        } else {
            alert('Токен не указан. Доступ к админ-панели ограничен.');
            return;
        }
    }

    // Verify admin access
    verifyAdmin();
    
    // Load overview data
    loadOverview();
});

// Verify admin access
async function verifyAdmin() {
    try {
        const response = await fetch(`${API_BASE}/users?action=check-admin&userToken=${adminToken}`);
        const data = await response.json();
        
        if (!data.is_admin) {
            alert('У вас нет прав администратора!');
            localStorage.removeItem('admin_token');
            location.reload();
        }
    } catch (error) {
        console.error('Error verifying admin:', error);
        showError('Ошибка проверки прав администратора');
    }
}

// Switch tabs
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Load data for tab
    switch(tabName) {
        case 'overview':
            loadOverview();
            break;
        case 'ads':
            loadAds();
            break;
        case 'chats':
            loadChats();
            break;
        case 'users':
            // Users tab requires search
            break;
        case 'notify':
            // Notify tab is form only
            break;
    }
}

// Load Overview
async function loadOverview() {
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-overview',
                adminToken
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load overview');
        }
        
        const data = result.data;
        
        // Update header stats
        document.getElementById('headerUsers').textContent = data.users || 0;
        document.getElementById('headerAds').textContent = data.ads || 0;
        
        // Get 24h online from analytics
        const analyticsResponse = await fetch(`${API_BASE}/analytics?metric=all`);
        const analyticsData = await analyticsResponse.json();
        document.getElementById('headerOnline').textContent = analyticsData.unique_last_24h || 0;
        
        // Display stats grid
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-label">👥 Всего пользователей</div>
                <div class="stat-card-value">${data.users || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">📝 Активных анкет</div>
                <div class="stat-card-value">${data.ads || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">💬 Приватных чатов</div>
                <div class="stat-card-value">${data.chats || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">🚫 Забанено</div>
                <div class="stat-card-value">${data.bannedUsers || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">🔒 Заблокировано анкет</div>
                <div class="stat-card-value">${data.blockedAds || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">🔥 Онлайн 24ч</div>
                <div class="stat-card-value">${analyticsData.unique_last_24h || 0}</div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading overview:', error);
        showError('Ошибка загрузки обзора: ' + error.message);
    }
}

// Load Ads
async function loadAds() {
    const container = document.getElementById('adsContent');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка анкет...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-ads',
                adminToken,
                params: { limit: 50 }
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load ads');
        }
        
        const ads = result.data || [];
        
        if (ads.length === 0) {
            container.innerHTML = '<div class="loading">Нет анкет</div>';
            return;
        }
        
        const tableHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Пол</th>
                        <th>Город</th>
                        <th>Текст</th>
                        <th>Создано</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${ads.map(ad => `
                        <tr>
                            <td>${ad.id}</td>
                            <td>${ad.gender === 'male' ? '👨 М' : '👩 Ж'}</td>
                            <td>${ad.city || '-'}</td>
                            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${ad.text?.substring(0, 100) || '-'}
                            </td>
                            <td>${new Date(ad.created_at).toLocaleDateString('ru')}</td>
                            <td>
                                ${ad.is_pinned ? '<span class="badge badge-info">📌 Закреплено</span> ' : ''}
                                ${ad.is_blocked ? '<span class="badge badge-error">🚫 Заблокировано</span>' : '<span class="badge badge-success">✅ Активно</span>'}
                            </td>
                            <td>
                                <div class="actions">
                                    ${!ad.is_blocked ? 
                                        `<button class="btn btn-danger" onclick="blockAd(${ad.id})">🚫 Заблокировать</button>` :
                                        `<button class="btn btn-success" onclick="unblockAd(${ad.id})">✅ Разблокировать</button>`
                                    }
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error loading ads:', error);
        container.innerHTML = `<div class="error">Ошибка загрузки анкет: ${error.message}</div>`;
    }
}

// Load Chats
async function loadChats() {
    const container = document.getElementById('chatsContent');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка чатов...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-chats',
                adminToken,
                params: { limit: 50 }
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load chats');
        }
        
        const chats = result.data || [];
        
        if (chats.length === 0) {
            container.innerHTML = '<div class="loading">Нет чатов</div>';
            return;
        }
        
        const tableHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ad ID</th>
                        <th>Пользователи</th>
                        <th>Статус</th>
                        <th>Последнее сообщение</th>
                        <th>Создан</th>
                    </tr>
                </thead>
                <tbody>
                    ${chats.map(chat => `
                        <tr>
                            <td>${chat.id}</td>
                            <td>${chat.ad_id || '-'}</td>
                            <td style="font-size: 0.85rem; color: var(--text-secondary);">
                                ${chat.user_token_1?.substring(0, 12)}...<br>
                                ${chat.user_token_2?.substring(0, 12)}...
                            </td>
                            <td>
                                ${chat.accepted ? 
                                    '<span class="badge badge-success">✅ Принят</span>' : 
                                    '<span class="badge badge-warning">⏳ Ожидает</span>'}
                                ${chat.blocked_by ? 
                                    '<br><span class="badge badge-error">🚫 Заблокирован</span>' : ''}
                            </td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${chat.last_message || '-'}
                            </td>
                            <td>${new Date(chat.created_at).toLocaleDateString('ru')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error loading chats:', error);
        container.innerHTML = `<div class="error">Ошибка загрузки чатов: ${error.message}</div>`;
    }
}

// Search Users
async function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.trim();
    const container = document.getElementById('usersContent');
    
    if (!searchTerm) {
        container.innerHTML = '<div class="error">Введите user_token или email для поиска</div>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Поиск пользователей...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-users',
                adminToken,
                params: { 
                    search: searchTerm,
                    limit: 20
                }
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to search users');
        }
        
        const users = result.data || [];
        
        if (users.length === 0) {
            container.innerHTML = '<div class="loading">Пользователи не найдены</div>';
            return;
        }
        
        const tableHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Никнейм</th>
                        <th>Email</th>
                        <th>Статус</th>
                        <th>Создан</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id || '-'}</td>
                            <td>${user.display_nickname || '-'}</td>
                            <td>${user.email || '-'}</td>
                            <td>
                                ${user.is_admin ? '<span class="badge badge-info">👑 Админ</span> ' : ''}
                                ${user.is_banned ? 
                                    `<span class="badge badge-error">🚫 Забанен${user.banned_until ? ' до ' + new Date(user.banned_until).toLocaleDateString('ru') : ''}</span>` : 
                                    '<span class="badge badge-success">✅ Активен</span>'}
                            </td>
                            <td>${new Date(user.created_at).toLocaleDateString('ru')}</td>
                            <td>
                                <div class="actions">
                                    ${!user.is_banned && !user.is_admin ?
                                        `<button class="btn btn-danger" onclick="quickBan('${user.user_token}')">🚫 Бан</button>` :
                                        user.is_banned ?
                                        `<button class="btn btn-success" onclick="unbanUser('${user.user_token}')">✅ Разбанить</button>` :
                                        '<span style="color: var(--text-secondary); font-size: 0.85rem;">Админ</span>'
                                    }
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error searching users:', error);
        container.innerHTML = `<div class="error">Ошибка поиска: ${error.message}</div>`;
    }
}

// Block Ad
async function blockAd(adId) {
    const reason = prompt('Причина блокировки анкеты:');
    if (!reason) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'block-ad',
                adminToken,
                params: { adId, reason }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Анкета заблокирована');
            loadAds();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error blocking ad:', error);
        showError('Ошибка блокировки: ' + error.message);
    }
}

// Unblock Ad
async function unblockAd(adId) {
    if (!confirm('Разблокировать анкету?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'unblock-ad',
                adminToken,
                params: { adId }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Анкета разблокирована');
            loadAds();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error unblocking ad:', error);
        showError('Ошибка разблокировки: ' + error.message);
    }
}

// Ban User
async function banUser() {
    const userToken = document.getElementById('banUserToken').value.trim();
    const duration = parseInt(document.getElementById('banDuration').value) || 0;
    const reason = document.getElementById('banReason').value.trim();
    
    if (!userToken) {
        showError('Укажите user_token');
        return;
    }
    
    if (!reason) {
        showError('Укажите причину бана');
        return;
    }
    
    if (!confirm(`Забанить пользователя ${duration > 0 ? `на ${duration} часов` : 'навсегда'}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'ban-user',
                adminToken,
                params: {
                    userToken,
                    durationHours: duration || null,
                    reason
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Пользователь забанен');
            document.getElementById('banUserToken').value = '';
            document.getElementById('banReason').value = '';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error banning user:', error);
        showError('Ошибка бана: ' + error.message);
    }
}

// Quick Ban (from search results)
async function quickBan(userToken) {
    document.getElementById('banUserToken').value = userToken;
    switchTab('users');
    document.querySelector('.tab[onclick*="users"]').click();
}

// Unban User
async function unbanUser(userToken) {
    if (!confirm('Разбанить пользователя?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'unban-user',
                adminToken,
                params: { userToken }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Пользователь разбанен');
            searchUsers();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        showError('Ошибка разбана: ' + error.message);
    }
}

// Send Notification
async function sendNotification() {
    const userToken = document.getElementById('notifyToken').value.trim();
    const title = document.getElementById('notifyTitle').value.trim();
    const message = document.getElementById('notifyMessage').value.trim();
    
    if (!userToken || !message) {
        showError('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'notify-user',
                adminToken,
                params: {
                    userToken,
                    title,
                    message
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Уведомление отправлено');
            document.getElementById('notifyMessage').value = '';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        showError('Ошибка отправки: ' + error.message);
    }
}

// Show Error
function showError(message) {
    // Create and show error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '10000';
    errorDiv.style.maxWidth = '400px';
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show Success
function showSuccess(message) {
    // Create and show success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '10000';
    successDiv.style.maxWidth = '400px';
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}
