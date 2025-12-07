// ============= РџР РћРЎРњРћРўР  РђРќРљР•Рў =============

let currentPage = 1;
const pageSize = 20;
let isLoading = false;

const state = {
    gender: '',
    ageFrom: '',
    ageTo: '',
    city: '',
    search: ''
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Browse page loaded');
    initFilters();
    loadAds();

    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
});

function initFilters() {
    document.getElementById('genderFilter').addEventListener('change', (e) => state.gender = e.target.value);
    document.getElementById('ageFrom').addEventListener('input', (e) => state.ageFrom = e.target.value);
    document.getElementById('ageTo').addEventListener('input', (e) => state.ageTo = e.target.value);
    document.getElementById('cityFilter').addEventListener('input', (e) => state.city = e.target.value.trim());
    document.getElementById('searchFilter').addEventListener('input', (e) => state.search = e.target.value.trim());
}

async function applyFilters() {
    currentPage = 1;
    await loadAds();
}

async function resetFilters() {
    state.gender = '';
    state.ageFrom = '';
    state.ageTo = '';
    state.city = '';
    state.search = '';

    document.getElementById('genderFilter').value = '';
    document.getElementById('ageFrom').value = '';
    document.getElementById('ageTo').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('searchFilter').value = '';

    currentPage = 1;
    await loadAds();
}

async function changePage(delta) {
    currentPage = Math.max(1, currentPage + delta);
    await loadAds();
}

async function loadAds() {
    if (isLoading) return;
    isLoading = true;
    const list = document.getElementById('adsList');
    list.innerHTML = '<div class="empty-state">Р—Р°РіСЂСѓР·РєР° Р°РЅРєРµС‚...</div>';

    try {
        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('limit', pageSize);
        if (state.gender) params.append('gender', state.gender);
        if (state.ageFrom) params.append('ageFrom', state.ageFrom);
        if (state.ageTo) params.append('ageTo', state.ageTo);
        if (state.city) params.append('city', state.city);
        if (state.search) params.append('search', state.search);

        const data = await apiRequest(`/api/ads?${params.toString()}`);

        renderAds(data.ads || []);
        updatePagination(data.total || 0);
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р°РЅРєРµС‚:', error);
        list.innerHTML = '<div class="empty-state">РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РЅРєРµС‚С‹</div>';
    } finally {
        isLoading = false;
    }
}

function renderAds(ads) {
    const list = document.getElementById('adsList');

    if (!ads.length) {
        list.innerHTML = '<div class="empty-state">РђРЅРєРµС‚ РЅРµ РЅР°Р№РґРµРЅРѕ</div>';
        return;
    }

    list.innerHTML = '';

    ads.forEach(ad => {
        const card = document.createElement('div');
        card.className = 'profile-card neon-card';

        const genderIcon = ad.gender === 'female' ? 'рџ‘©' : ad.gender === 'male' ? 'рџ‘Ё' : 'рџ‘¤';
        const ageText = ad.age ? `${ad.age} Р»РµС‚` : '';
        const cityText = ad.city ? ad.city : '';
        const badges = [];
        if (ad.premium) badges.push('<span class="badge premium">PRO</span>');
        if (ad.status === 'online') badges.push('<span class="badge online">online</span>');

        card.innerHTML = `
            <div class="profile-card-header">
                <div class="avatar-placeholder">${genderIcon}</div>
                <div class="profile-card-info">
                    <div class="profile-card-title">${ad.nickname || 'РђРЅРѕРЅРёРј'}</div>
                    <div class="profile-card-subtitle">${[ageText, cityText].filter(Boolean).join(' вЂў ')}</div>
                </div>
                <div class="profile-card-badges">${badges.join(' ')}</div>
            </div>
            <div class="profile-card-body">
                <p>${(ad.about || '').slice(0, 160)}</p>
                ${ad.interests ? `<div class="tag-list">${ad.interests.map(i => `<span class="tag">${i}</span>`).join('')}</div>` : ''}
            </div>
            <div class="profile-card-footer">
                <button class="neon-button" onclick="openChat('${ad.id}')">рџ’¬ РќР°РїРёСЃР°С‚СЊ</button>
                <button class="neon-button secondary" onclick="openAd('${ad.id}')">рџ‘ЃпёЏ РЎРјРѕС‚СЂРµС‚СЊ</button>
            </div>
        `;

        list.appendChild(card);
    });
}

function updatePagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `РЎС‚СЂ. ${currentPage} / ${totalPages}`;
}

function openChat(adId) {
    window.location.href = `/webapp/chat.html?adId=${encodeURIComponent(adId)}`;
}

function openAd(adId) {
    alert('Р”РµС‚Р°Р»СЊРЅР°СЏ РєР°СЂС‚РѕС‡РєР° РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ');
}

// Р­РєСЃРїРѕСЂС‚ РІ window
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;

