// ============= MY-ADS.JS - Мои анкеты =============

function showMyAds() {
    showScreen('myAds');
    loadMyAds();
}

async function loadMyAds() {
    const myAdsList = document.getElementById('myAdsList');
    if (!myAdsList) return;
    
    myAdsList.innerHTML = '<div class="loading-spinner"></div><p>Загрузка ваших анкет...</p>';
    
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">🔐</div>
                    <h3>Требуется авторизация</h3>
                    <p>Авторизуйтесь чтобы видеть свои анкеты</p>
                </div>
            `;
            return;
        }
        
        const response = await fetch('/api/ads/my-ads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_token: userToken })
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки анкет');
        
        const data = await response.json();
        
        if (data.success) {
            const ads = data.ads || [];
            renderMyAds(ads);
        } else {
            throw new Error(data.error || 'Ошибка загрузки');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки моих анкет:', error);
        myAdsList.innerHTML = '<p class="error-message">Ошибка загрузки анкет</p>';
    }
}

function renderMyAds(ads) {
    const myAdsList = document.getElementById('myAdsList');
    if (!myAdsList) return;
    
    if (ads.length === 0) {
        myAdsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">📋</div>
                <h3>У вас пока нет анкет</h3>
                <p>Создайте свою первую анкету</p>
                <button class="neon-button primary" onclick="window.location.href='/create'">
                    Создать анкету
                </button>
            </div>
        `;
        return;
    }
    
    myAdsList.innerHTML = '';
    
    ads.forEach(ad => {
        const adCard = document.createElement('div');
        adCard.className = 'my-ad-card';
        adCard.innerHTML = `
            <div class="ad-header">
                <span class="ad-gender">${ad.gender || 'Не указано'}</span>
                <span class="ad-age">${ad.age || '?'} лет</span>
                <span class="ad-status ${ad.active ? 'active' : 'inactive'}">
                    ${ad.active ? '✅ Активна' : '⏸️ Неактивна'}
                </span>
            </div>
            <div class="ad-body">
                <p class="ad-text">${ad.text || 'Без описания'}</p>
            </div>
            <div class="ad-footer">
                <span class="ad-location">📍 ${ad.city || 'Не указано'}</span>
                <div class="ad-actions">
                    <button class="ad-edit-btn" onclick="editAd('${ad.id}')">✏️</button>
                    <button class="ad-delete-btn" onclick="deleteAd('${ad.id}')">🗑️</button>
                </div>
            </div>
        `;
        myAdsList.appendChild(adCard);
    });
}

async function editAd(adId) {
    // Перенаправляем на страницу редактирования
    window.location.href = `/create?edit=${adId}`;
}

async function deleteAd(adId) {
    if (!confirm('Вы уверены что хотите удалить анкету?')) return;
    
    try {
        const userToken = localStorage.getItem('user_token');
        const response = await fetch('/api/ads/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_token: userToken, ad_id: adId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Анкета удалена');
            loadMyAds();
        } else {
            alert('Ошибка удаления: ' + (data.error || 'Неизвестная ошибка'));
        }
        
    } catch (error) {
        console.error('Ошибка удаления анкеты:', error);
        alert('Ошибка соединения с сервером');
    }
}

window.showMyAds = showMyAds;
window.loadMyAds = loadMyAds;
window.editAd = editAd;
window.deleteAd = deleteAd;
