/**
 * Модуль работы с анкетами (ads.js)
 * 
 * Функции:
 * - Создание и публикация анкет
 * - Просмотр и фильтрация анкет
 * - Управление собственными анкетами
 * - Логика страниц с анкетами
 */

console.log('📋 [ADS] Инициализация модуля анкет');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
 */

// Состояние формы создания анкеты
let formData = {};
let currentStep = 1;
const totalSteps = 9;

// Данные для просмотра анкет
let currentAdsPage = 1;
let currentAds = [];
let totalAdsCount = 0;
let adsFilters = {
    gender: 'all',
    target: 'all',
    orientation: 'all',
    ageFrom: 18,
    ageTo: 99
};

/**
 * ===== СОЗДАНИЕ И РЕДАКТИРОВАНИЕ АНКЕТ =====
 */

/**
 * Показать форму создания анкеты
 */
function showCreateAd() {
    console.log('📝 [ADS] Открытие формы создания анкеты');
    
    // Проверяем авторизацию
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
        tg.showAlert('Требуется авторизация');
        return;
    }
    
    // Проверяем никнейм
    const nickname = localStorage.getItem('userNickname');
    if (!nickname || nickname.trim() === '') {
        tg.showAlert('Сначала выберите никнейм');
        return;
    }
    
    // Сбрасываем форму
    formData = {};
    currentStep = 1;
    
    // Показываем первый шаг
    showScreen('createAdForm');
    updateFormStep(1);
}

/**
 * Обновить шаг формы создания анкеты
 */
function updateFormStep(step) {
    console.log(`📝 [ADS] Переход на шаг ${step}/${totalSteps}`);
    
    currentStep = step;
    
    // Скрываем все шаги
    for (let i = 1; i <= totalSteps; i++) {
        const stepEl = document.getElementById(`step${i}`);
        if (stepEl) stepEl.style.display = 'none';
    }
    
    // Показываем текущий шаг
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentStepEl) currentStepEl.style.display = 'block';
    
    // Обновляем прогресс
    const progressBar = document.querySelector('.form-progress');
    if (progressBar) {
        const progress = (step / totalSteps) * 100;
        progressBar.style.width = progress + '%';
    }
    
    // Обновляем текст прогресса
    const progressText = document.querySelector('.form-step-info');
    if (progressText) {
        progressText.textContent = `Шаг ${step}/${totalSteps}`;
    }
}

/**
 * Перейти к следующему шагу формы
 */
function nextFormStep() {
    if (currentStep < totalSteps) {
        updateFormStep(currentStep + 1);
        window.scrollTo(0, 0);
    }
}

/**
 * Вернуться на предыдущий шаг
 */
function prevFormStep() {
    if (currentStep > 1) {
        updateFormStep(currentStep - 1);
        window.scrollTo(0, 0);
    }
}

/**
 * Обработка кнопки "Назад" в форме создания анкеты
 */
function handleCreateAdBack() {
    if (currentStep > 1) {
        prevFormStep();
    } else {
        // На первом шаге - спрашиваем подтверждение
        if (window.confirm && window.confirm('Вы уверены? Все введённые данные будут потеряны.')) {
            showMainMenu();
        }
    }
}

/**
 * Следующий шаг (алиас для HTML)
 */
function nextStep() {
    nextFormStep();
}

/**
 * Предыдущий шаг (алиас для HTML)
 */
function previousStep() {
    prevFormStep();
}

/**
 * Отправить анкету на сервер
 */
async function submitAd() {
    try {
        console.log('📤 [ADS] Отправка анкеты на сервер');
        
        // Проверяем авторизацию
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        
        // Собираем данные из формы
        const adData = {
            user_token: userToken,
            nickname: localStorage.getItem('userNickname'),
            gender: document.querySelector('input[name="gender"]:checked')?.value,
            my_age: document.querySelector('input[name="my_age"]')?.value,
            body_type: document.querySelector('input[name="body_type"]:checked')?.value,
            orientation: document.querySelector('input[name="orientation"]:checked')?.value,
            goal: Array.from(document.querySelectorAll('input[name="goal"]:checked'))
                .map(el => el.value),
            target: document.querySelector('input[name="target"]:checked')?.value,
            age_from: document.querySelector('input[name="age_from"]')?.value,
            age_to: document.querySelector('input[name="age_to"]')?.value,
            country: selectedCountry,
            region: selectedRegion || '',
            city: selectedCity,
            text: document.querySelector('textarea[name="description"]')?.value,
            created_at: new Date().toISOString()
        };
        
        // Валидация
        if (!adData.gender || !adData.my_age || !adData.city) {
            tg.showAlert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        if (adData.text.length < 10) {
            tg.showAlert('Описание должно содержать минимум 10 символов');
            return;
        }
        
        // Показываем загрузку
        const submitBtn = document.querySelector('.submit-ad-btn');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.textContent = '⏳ Публикация...';
            submitBtn.disabled = true;
        }
        
        // Отправляем на сервер
        const response = await fetch('/api/ads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adData)
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка: ' + (result.error.message || 'Не удалось опубликовать анкету'));
            return;
        }
        
        console.log('✅ [ADS] Анкета опубликована:', result.data);
        
        // Выполняем реферальную награду если нужно
        if (typeof processReferralReward === 'function') {
            processReferralReward();
        }
        
        // Обновляем Premium статус
        if (typeof loadPremiumStatus === 'function') {
            loadPremiumStatus();
        }
        
        tg.showAlert('🎉 Анкета опубликована!\n\nТеперь её смогут видеть другие пользователи', () => {
            showMainMenu();
        });
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка отправки анкеты:', error);
        tg.showAlert('Ошибка при публикации анкеты');
    } finally {
        const submitBtn = document.querySelector('.submit-ad-btn');
        if (submitBtn) {
            submitBtn.textContent = originalText || 'Опубликовать';
            submitBtn.disabled = false;
        }
    }
}

/**
 * ===== ПРОСМОТР И ФИЛЬТРАЦИЯ АНКЕТ =====
 */

/**
 * Показать раздел просмотра анкет
 */
async function showBrowseAds() {
    console.log('🔍 [ADS] Открытие просмотра анкет');
    
    showScreen('browseAds');
    currentAdsPage = 1;
    
    // Применяем фильтры и загружаем анкеты
    await loadAds();
    
    // Устанавливаем UI фильтра на базе локации пользователя
    if (typeof setFilterLocationUI === 'function') {
        setFilterLocationUI();
    }
}

/**
 * Загрузить анкеты с фильтрами
 */
async function loadAds(filters = {}) {
    try {
        console.log('📥 [ADS] Загрузка анкет с фильтрами:', { ...adsFilters, ...filters });
        
        // Объединяем фильтры
        const finalFilters = { ...adsFilters, ...filters };
        
        // Формируем параметры запроса
        const params = new URLSearchParams({
            page: currentAdsPage,
            limit: 10,
            gender: finalFilters.gender !== 'all' ? finalFilters.gender : '',
            target: finalFilters.target !== 'all' ? finalFilters.target : '',
            orientation: finalFilters.orientation !== 'all' ? finalFilters.orientation : '',
            age_from: finalFilters.ageFrom,
            age_to: finalFilters.ageTo
        });
        
        // Если есть фильтр по стране/городу, добавляем
        if (finalFilters.country) {
            params.append('country', finalFilters.country);
        }
        if (finalFilters.city) {
            params.append('city', finalFilters.city);
        }
        
        const response = await fetch(`/api/ads?${params.toString()}`);
        const result = await response.json();
        
        if (result.error) {
            console.error('❌ [ADS] Ошибка загрузки анкет:', result.error);
            tg.showAlert('Ошибка загрузки анкет');
            return;
        }
        
        currentAds = result.ads || [];
        totalAdsCount = result.total || 0;
        
        console.log(`✅ [ADS] Загружено ${currentAds.length} анкет, всего: ${totalAdsCount}`);
        
        // Отображаем анкеты
        displayAds(currentAds);
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка при загрузке анкет:', error);
    }
}

/**
 * Отобразить анкеты в UI
 */
function displayAds(ads) {
    const container = document.getElementById('adsList');
    if (!container) return;
    
    if (ads.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="neon-icon">📭</div>
                <h3>Нет анкет</h3>
                <p>Попробуйте изменить фильтры или зайдите позже</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = ads.map(ad => `
        <div class="ad-card" onclick="showAdModal(${ad.id})">
            <div class="ad-header">
                <span class="ad-gender">${ad.gender === 'female' ? '♀️' : '♂️'}</span>
                <span class="ad-age">${ad.my_age} лет</span>
                <span class="ad-city">${ad.city}</span>
            </div>
            <div class="ad-preview">
                <p>${ad.text.substring(0, 100)}...</p>
            </div>
            <div class="ad-footer">
                <span class="ad-date">${formatCreatedAt(ad.created_at)}</span>
            </div>
        </div>
    `).join('');
    
    // Обновляем информацию о странице
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        const totalPages = Math.ceil(totalAdsCount / 10);
        pageInfo.textContent = `Страница ${currentAdsPage} из ${totalPages}`;
    }
}

/**
 * Показать модальное окно с полной информацией об анкете
 */
async function showAdModal(adId) {
    if (!adId || adId === 'N/A') {
        tg.showAlert('Анкета не найдена');
        return;
    }
    
    const modal = document.getElementById('adModal');
    const modalBody = document.getElementById('adModalBody');
    
    if (!modal || !modalBody) {
        console.error('❌ [ADS] Модальное окно не найдено');
        return;
    }
    
    // Показываем модалку с загрузкой
    modal.style.display = 'flex';
    modalBody.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Загрузка...</p>
    `;
    
    try {
        // Загружаем данные анкеты
        const response = await fetch(`/api/ads?id=${adId}`);
        const result = await response.json();
        
        const ad = result.ads?.[0];
        if (!ad) {
            throw new Error('Анкета не найдена');
        }
        
        // Форматируем данные
        const genderFormatted = formatGender(ad.gender);
        const targetFormatted = formatTarget(ad.target);
        const goalsFormatted = formatGoals(ad.goal);
        
        // Отображаем информацию
        modalBody.innerHTML = `
            <div class="ad-detail" style="max-width: 400px;">
                <h2>${genderFormatted}, ${ad.my_age} лет</h2>
                <div class="ad-info">
                    <div><strong>Телосложение:</strong> ${ad.body_type}</div>
                    <div><strong>Ищу:</strong> ${targetFormatted}</div>
                    <div><strong>Цель:</strong> ${goalsFormatted}</div>
                    <div><strong>Город:</strong> ${ad.city}</div>
                </div>
                <div class="ad-description">
                    <p>${ad.text}</p>
                </div>
                <button class="neon-button" onclick="contactAuthor(${ad.id}, '${ad.user_token}')">
                    💬 Написать сообщение
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка загрузки анкеты:', error);
        modalBody.innerHTML = `
            <div class="error-state">
                <h3>Ошибка</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * Закрыть модальное окно анкеты
 */
function closeAdModal() {
    const modal = document.getElementById('adModal');
    if (modal) modal.style.display = 'none';
}

/**
 * ===== УПРАВЛЕНИЕ СОБСТВЕННЫМИ АНКЕТАМИ =====
 */

/**
 * Показать мои анкеты
 */
async function showMyAds() {
    console.log('📋 [ADS] Открытие моих анкет');
    
    showScreen('myAds');
    
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        
        const response = await fetch(`/api/ads?user_token=${userToken}`);
        const result = await response.json();
        
        const myAds = result.ads || [];
        const container = document.getElementById('myAdsList');
        
        if (!container) return;
        
        if (myAds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>У вас нет анкет</h3>
                    <button class="neon-button" onclick="showCreateAd()">
                        ➕ Создать анкету
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = myAds.map(ad => `
            <div class="my-ad-card">
                <div class="ad-header">
                    <span>${ad.my_age} лет, ${ad.city}</span>
                    <span>${formatCreatedAt(ad.created_at)}</span>
                </div>
                <div class="ad-preview">
                    <p>${ad.text.substring(0, 80)}...</p>
                </div>
                <div class="ad-actions">
                    <button class="action-btn edit" onclick="editAd(${ad.id})">✏️ Редактировать</button>
                    <button class="action-btn delete" onclick="deleteMyAd(${ad.id})">🗑️ Удалить</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка загрузки моих анкет:', error);
    }
}

/**
 * Удалить мою анкету
 */
async function deleteMyAd(adId) {
    tg.showConfirm('Удалить анкету?', async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const userToken = localStorage.getItem('user_token');
            
            const response = await fetch(`/api/ads/${adId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_token: userToken })
            });
            
            const result = await response.json();
            
            if (result.error) {
                tg.showAlert('Ошибка удаления анкеты');
                return;
            }
            
            tg.showAlert('✅ Анкета удалена');
            showMyAds(); // Перезагружаем список
            
        } catch (error) {
            console.error('❌ [ADS] Ошибка удаления анкеты:', error);
            tg.showAlert('Ошибка');
        }
    });
}

/**
 * ===== ОБЩИЕ ФУНКЦИИ =====
 */

/**
 * Связаться с автором анкеты
 */
async function contactAuthor(adId, authorToken) {
    console.log('💬 [ADS] Создание чата с автором анкеты');
    
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        
        // Закрываем модалку анкеты
        closeAdModal();
        
        // Создаём или открываем чат с автором
        const response = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'request-chat',
                params: {
                    user_token: userToken,
                    author_token: authorToken,
                    ad_id: adId,
                    message: 'Хочу начать диалог'
                }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка: ' + result.error.message);
            return;
        }
        
        tg.showAlert('✅ Запрос на чат отправлен!\n\nИди в раздел "Мои чаты" для просмотра ответа');
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка создания чата:', error);
        tg.showAlert('Ошибка при создании чата');
    }
}

/**
 * Перейти на следующую страницу анкет
 */
function nextAdsPage() {
    const totalPages = Math.ceil(totalAdsCount / 10);
    if (currentAdsPage < totalPages) {
        currentAdsPage++;
        loadAds();
        window.scrollTo(0, 0);
    }
}

/**
 * Вернуться на предыдущую страницу анкет
 */
function prevAdsPage() {
    if (currentAdsPage > 1) {
        currentAdsPage--;
        loadAds();
        window.scrollTo(0, 0);
    }
}

console.log('✅ [ADS] Модуль анкет инициализирован');
