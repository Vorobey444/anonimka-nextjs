// ============= BROWSE.JS - Просмотр анкет =============

// Глобальные переменные для пагинации
window.currentAdsPage = 1;
window.allLoadedAds = [];
window.hasMoreAds = true;
window.loadingAds = false;
window.currentFilters = {};

// Фильтры анкет
let adsFilters = {
    gender: 'all',
    target: 'all',
    orientation: 'all',
    ageFrom: 18,
    ageTo: 99
};

// Текущая локация пользователя
let currentUserLocation = null;

// Данные локаций (упрощенная версия)
const locationData = {
    russia: { name: 'Россия', flag: '🇷🇺' },
    kazakhstan: { name: 'Казахстан', flag: '🇰🇿' },
    belarus: { name: 'Беларусь', flag: '🇧🇾' },
    ukraine: { name: 'Украина', flag: '🇺🇦' }
};

// Показать страницу просмотра анкет
function showBrowseAds() {
    showScreen('browseAds');
    
    // Загружаем локацию из localStorage
    const savedLocation = localStorage.getItem('user_location');
    if (savedLocation) {
        try {
            currentUserLocation = JSON.parse(savedLocation);
        } catch (e) {
            console.error('Ошибка парсинга локации:', e);
        }
    }
    
    // Отображаем текущую локацию
    const browseLocationDisplay = document.getElementById('browseLocationDisplay');
    if (currentUserLocation && browseLocationDisplay) {
        const locationPart = currentUserLocation.region === currentUserLocation.city 
            ? currentUserLocation.city 
            : `${currentUserLocation.region}, ${currentUserLocation.city}`;
        const locationText = `${locationData[currentUserLocation.country]?.flag || '🌍'} ${locationPart}`;
        browseLocationDisplay.textContent = locationText;
    } else if (browseLocationDisplay) {
        browseLocationDisplay.textContent = 'Локация не установлена';
    }
    
    // Загружаем анкеты
    setTimeout(() => {
        if (currentUserLocation) {
            loadAdsByLocation(currentUserLocation.country, currentUserLocation.region, currentUserLocation.city);
        } else {
            loadAds();
        }
    }, 100);
}

// Загрузить анкеты
async function loadAds(filters = {}, append = false) {
    if (window.loadingAds) return;
    
    if (!append) {
        window.currentAdsPage = 1;
        window.allLoadedAds = [];
        window.hasMoreAds = true;
        window.currentFilters = filters;
    }
    
    try {
        window.loadingAds = true;
        
        const adsList = document.getElementById('adsList');
        if (adsList && !append) {
            adsList.innerHTML = '<div class="loading-spinner"></div><p>Загружаем анкеты...</p>';
        }

        const params = new URLSearchParams({
            page: window.currentAdsPage.toString(),
            limit: '20'
        });
        
        if (filters.country) params.append('country', filters.country);
        if (filters.city) params.append('city', filters.city);
        if (filters.gender && filters.gender !== 'all') params.append('gender', filters.gender);
        if (filters.target && filters.target !== 'all') params.append('target', filters.target);
        
        const response = await fetch(`/api/ads?${params}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        const ads = result.ads || [];
        
        if (append) {
            window.allLoadedAds.push(...ads);
        } else {
            window.allLoadedAds = ads;
        }
        
        window.hasMoreAds = result.pagination?.hasMore || false;
        
        renderAds(append);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки анкет:', error);
        const adsList = document.getElementById('adsList');
        if (adsList) {
            adsList.innerHTML = '<p class="error-message">Ошибка загрузки анкет</p>';
        }
    } finally {
        window.loadingAds = false;
    }
}

// Загрузить анкеты по локации
async function loadAdsByLocation(country, region, city) {
    const filters = { country, region, city, ...adsFilters };
    await loadAds(filters);
}

// Отрисовать анкеты
function renderAds(append = false) {
    const adsList = document.getElementById('adsList');
    if (!adsList) return;
    
    if (!append) {
        adsList.innerHTML = '';
    }
    
    if (window.allLoadedAds.length === 0) {
        adsList.innerHTML = '<p class="no-ads">Анкет не найдено</p>';
        return;
    }
    
    window.allLoadedAds.forEach(ad => {
        const adCard = createAdCard(ad);
        adsList.appendChild(adCard);
    });
}

// Создать карточку анкеты
function createAdCard(ad) {
    const card = document.createElement('div');
    card.className = 'ad-card';
    card.innerHTML = `
        <div class="ad-header">
            <span class="ad-gender">${ad.gender || 'Не указано'}</span>
            <span class="ad-age">${ad.age || '?'} лет</span>
        </div>
        <div class="ad-body">
            <p class="ad-text">${ad.text || 'Без описания'}</p>
        </div>
        <div class="ad-footer">
            <span class="ad-location">📍 ${ad.city || 'Не указано'}</span>
            <button class="ad-contact-btn" onclick="window.openChat('${ad.id}')">💬 Написать</button>
        </div>
    `;
    return card;
}

// Фильтры
function toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        updateFilterButtons();
    } else {
        panel.style.display = 'none';
    }
}

function setFilter(type, value) {
    adsFilters[type] = value;
    updateFilterButtons();
}

function updateFilterButtons() {
    document.querySelectorAll('[data-filter-type="gender"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.gender);
    });
    document.querySelectorAll('[data-filter-type="target"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.target);
    });
    document.querySelectorAll('[data-filter-type="orientation"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === adsFilters.orientation);
    });
}

function applyFilters() {
    const ageFromInput = document.getElementById('ageFrom');
    const ageToInput = document.getElementById('ageTo');
    
    if (ageFromInput && ageToInput) {
        adsFilters.ageFrom = parseInt(ageFromInput.value) || 18;
        adsFilters.ageTo = parseInt(ageToInput.value) || 99;
    }
    
    let activeCount = 0;
    if (adsFilters.gender !== 'all') activeCount++;
    if (adsFilters.target !== 'all') activeCount++;
    if (adsFilters.orientation !== 'all') activeCount++;
    if (adsFilters.ageFrom !== 18 || adsFilters.ageTo !== 99) activeCount++;
    
    const badge = document.getElementById('filterBadge');
    if (badge) {
        badge.textContent = activeCount > 0 ? activeCount : '';
        badge.style.display = activeCount > 0 ? 'inline' : 'none';
    }
    
    document.getElementById('filtersPanel').style.display = 'none';
    showBrowseAds();
}

function resetFilters() {
    adsFilters = {
        gender: 'all',
        target: 'all',
        orientation: 'all',
        ageFrom: 18,
        ageTo: 99
    };
    
    const ageFromInput = document.getElementById('ageFrom');
    const ageToInput = document.getElementById('ageTo');
    if (ageFromInput) ageFromInput.value = 18;
    if (ageToInput) ageToInput.value = 99;
    
    updateFilterButtons();
    
    const badge = document.getElementById('filterBadge');
    if (badge) {
        badge.textContent = '';
        badge.style.display = 'none';
    }
    
    document.getElementById('filtersPanel').style.display = 'none';
    showBrowseAds();
}

function showLocationSetup() {
    window.location.href = '/location-setup';
}

// Экспорт функций
window.showBrowseAds = showBrowseAds;
window.loadAds = loadAds;
window.loadAdsByLocation = loadAdsByLocation;
window.toggleFilters = toggleFilters;
window.setFilter = setFilter;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.showLocationSetup = showLocationSetup;
