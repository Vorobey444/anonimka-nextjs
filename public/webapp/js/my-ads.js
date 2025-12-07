// ============= РњРћР РђРќРљР•РўР« =============

let myAds = [];

window.addEventListener('DOMContentLoaded', () => {
    loadMyAds();
});

async function loadMyAds() {
    const list = document.getElementById('myAdsList');
    list.innerHTML = '<div class="empty-state">Р—Р°РіСЂСѓР·РєР°...</div>';

    try {
        const userId = getUserId();
        if (!userId) {
            list.innerHTML = '<div class="empty-state">РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ</div>';
            return;
        }

        const data = await apiRequest(`/api/ads/my?tgId=${userId}`);

        myAds = data.ads || [];
        if (!myAds.length) {
            list.innerHTML = '<div class="empty-state">РЈ РІР°СЃ РїРѕРєР° РЅРµС‚ Р°РЅРєРµС‚</div>';
            return;
        }

        list.innerHTML = '';
        myAds.forEach(renderAdCard);
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РјРѕРёС… Р°РЅРєРµС‚:', error);
        list.innerHTML = '<div class="empty-state">РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РЅРєРµС‚С‹</div>';
    }
}

function renderAdCard(ad) {
    const list = document.getElementById('myAdsList');
    const card = document.createElement('div');
    card.className = 'profile-card neon-card';

    const genderIcon = ad.gender === 'female' ? 'рџ‘©' : ad.gender === 'male' ? 'рџ‘Ё' : 'рџ‘¤';
    const ageText = ad.age ? `${ad.age} Р»РµС‚` : '';
    const cityText = ad.city ? ad.city : '';
    const statusText = ad.active ? 'РђРєС‚РёРІРЅР°' : 'Р§РµСЂРЅРѕРІРёРє';
    const statusClass = ad.active ? 'badge success' : 'badge secondary';

    card.innerHTML = `
        <div class="profile-card-header">
            <div class="avatar-placeholder">${genderIcon}</div>
            <div class="profile-card-info">
                <div class="profile-card-title">${ad.nickname || 'РђРЅРѕРЅРёРј'}</div>
                <div class="profile-card-subtitle">${[ageText, cityText].filter(Boolean).join(' вЂў ')}</div>
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
            <button class="neon-button" onclick="editAd('${ad.id}')">вњЏпёЏ Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ</button>
            <button class="neon-button secondary" onclick="toggleAd('${ad.id}', ${ad.active ? 'true' : 'false'})">${ad.active ? 'вЏёпёЏ Р’С‹РєР»СЋС‡РёС‚СЊ' : 'в–¶пёЏ Р’РєР»СЋС‡РёС‚СЊ'}</button>
            <button class="neon-button danger" onclick="deleteAd('${ad.id}')">рџ—‘пёЏ РЈРґР°Р»РёС‚СЊ</button>
        </div>
    `;

    list.appendChild(card);
}

function createNewAd() {
    window.location.href = '/webapp/create-ad.html';
}

function editAd(adId) {
    window.location.href = `/webapp/create-ad.html?adId=${encodeURIComponent(adId)}`;
}

async function toggleAd(adId, isActive) {
    try {
        await apiRequest(`/api/ads/${adId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ active: !isActive })
        });
        await loadMyAds();
    } catch (error) {
        console.error('РћС€РёР±РєР° СЃРјРµРЅС‹ СЃС‚Р°С‚СѓСЃР° Р°РЅРєРµС‚С‹:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРјРµРЅРёС‚СЊ СЃС‚Р°С‚СѓСЃ');
    }
}

async function deleteAd(adId) {
    if (!confirm('РЈРґР°Р»РёС‚СЊ Р°РЅРєРµС‚Сѓ?')) return;
    try {
        await apiRequest(`/api/ads/${adId}`, { method: 'DELETE' });
        await loadMyAds();
    } catch (error) {
        console.error('РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ Р°РЅРєРµС‚С‹:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ Р°РЅРєРµС‚Сѓ');
    }
}

// Р­РєСЃРїРѕСЂС‚
window.createNewAd = createNewAd;
window.editAd = editAd;
window.toggleAd = toggleAd;
window.deleteAd = deleteAd;

