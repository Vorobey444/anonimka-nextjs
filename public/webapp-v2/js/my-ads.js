// ============= МОИ АНКЕТЫ =============

let myAds = [];

window.addEventListener('DOMContentLoaded', () => {
    loadMyAds();
});

async function loadMyAds() {
    const list = document.getElementById('myAdsList');
    list.innerHTML = '<div class="empty-state">Загрузка...</div>';

    try {
        const userId = getUserId();
        if (!userId) {
            list.innerHTML = '<div class="empty-state">Требуется авторизация</div>';
            return;
        }

        const data = await apiRequest(`/api/ads/my?tgId=${userId}`);

        myAds = data.ads || [];
        if (!myAds.length) {
            list.innerHTML = '<div class="empty-state">У вас пока нет анкет</div>';
            return;
        }

        list.innerHTML = '';
        myAds.forEach(renderAdCard);
    } catch (error) {
        console.error('Ошибка загрузки моих анкет:', error);
        list.innerHTML = '<div class="empty-state">Не удалось загрузить анкеты</div>';
    }
}

function renderAdCard(ad) {
    const list = document.getElementById('myAdsList');
    const card = document.createElement('div');
    card.className = 'profile-card neon-card';

    const genderIcon = ad.gender === 'female' ? '👩' : ad.gender === 'male' ? '👨' : '👤';
    const ageText = ad.age ? `${ad.age} лет` : '';
    const cityText = ad.city ? ad.city : '';
    const statusText = ad.active ? 'Активна' : 'Черновик';
    const statusClass = ad.active ? 'badge success' : 'badge secondary';

    card.innerHTML = `
        <div class="profile-card-header">
            <div class="avatar-placeholder">${genderIcon}</div>
            <div class="profile-card-info">
                <div class="profile-card-title">${ad.nickname || 'Аноним'}</div>
                <div class="profile-card-subtitle">${[ageText, cityText].filter(Boolean).join(' • ')}</div>
            </div>
            <div class="profile-card-badges">
                <span class="${statusClass}">${statusText}</span>
                ${ad.premium ? '<span class="badge premium">PRO</span>' : ''}
            </div>
        </div>
        <div class="profile-card-body">
            <p>${(ad.about || '').slice(0, 200)}</p>
            ${ad.interests ? `<div class="tag-list">${ad.interests.map(i => `<span class="tag">${i}</span>`).join('')}</div>` : ''}
        </div>
        <div class="profile-card-footer">
            <button class="neon-button" onclick="editAd('${ad.id}')">✏️ Редактировать</button>
            <button class="neon-button secondary" onclick="toggleAd('${ad.id}', ${ad.active ? 'true' : 'false'})">${ad.active ? '⏸️ Выключить' : '▶️ Включить'}</button>
            <button class="neon-button danger" onclick="deleteAd('${ad.id}')">🗑️ Удалить</button>
        </div>
    `;

    list.appendChild(card);
}

function createNewAd() {
    window.location.href = '/webapp-v2/create-ad.html';
}

function editAd(adId) {
    window.location.href = `/webapp-v2/create-ad.html?adId=${encodeURIComponent(adId)}`;
}

async function toggleAd(adId, isActive) {
    try {
        await apiRequest(`/api/ads/${adId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ active: !isActive })
        });
        await loadMyAds();
    } catch (error) {
        console.error('Ошибка смены статуса анкеты:', error);
        alert('Не удалось сменить статус');
    }
}

async function deleteAd(adId) {
    if (!confirm('Удалить анкету?')) return;
    try {
        await apiRequest(`/api/ads/${adId}`, { method: 'DELETE' });
        await loadMyAds();
    } catch (error) {
        console.error('Ошибка удаления анкеты:', error);
        alert('Не удалось удалить анкету');
    }
}

// Экспорт
window.createNewAd = createNewAd;
window.editAd = editAd;
window.toggleAd = toggleAd;
window.deleteAd = deleteAd;
