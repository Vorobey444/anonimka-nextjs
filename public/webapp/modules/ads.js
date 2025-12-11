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
    showScreen('createAd');
    updateFormStep(1);
    
    // Инициализируем обработчики формы
    initFormHandlers();
}

/**
 * Инициализация обработчиков для кнопок выбора в форме
 */
function initFormHandlers() {
    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.onclick = () => selectGender(btn.dataset.gender);
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.onclick = () => selectTarget(btn.dataset.target);
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.onclick = () => selectGoal(btn.dataset.goal);
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.onclick = () => selectBody(btn.dataset.body);
    });

    // Кнопки выбора ориентации
    document.querySelectorAll('[data-orientation]').forEach(btn => {
        btn.onclick = () => selectOrientation(btn.dataset.orientation);
    });
    
    console.log('✅ [ADS] Обработчики формы инициализированы');
}

/**
 * Выбор пола
 */
function selectGender(gender) {
    document.querySelectorAll('.gender-btn').forEach(btn => btn.classList.remove('selected'));
    const selected = document.querySelector(`[data-gender="${gender}"]`);
    if (selected) selected.classList.add('selected');
    formData.gender = gender;
    console.log('👤 [ADS] Выбран пол:', gender);
}

/**
 * Выбор цели поиска (кого ищет)
 */
function selectTarget(target) {
    document.querySelectorAll('.target-btn').forEach(btn => btn.classList.remove('selected'));
    const selected = document.querySelector(`[data-target="${target}"]`);
    if (selected) selected.classList.add('selected');
    formData.target = target;
    console.log('🔍 [ADS] Выбрана цель:', target);
}

/**
 * Выбор цели знакомства (множественный выбор)
 */
function selectGoal(goal) {
    const btn = document.querySelector(`[data-goal="${goal}"]`);
    if (!btn) return;
    
    // Переключаем выбор (toggle)
    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        formData.goals = (formData.goals || []).filter(g => g !== goal);
    } else {
        btn.classList.add('selected');
        formData.goals = formData.goals || [];
        formData.goals.push(goal);
    }
    
    formData.goal = (formData.goals || []).join(', ');
    console.log('🎯 [ADS] Выбранные цели:', formData.goals);
}

/**
 * Выбор телосложения
 */
function selectBody(body) {
    document.querySelectorAll('[data-body]').forEach(btn => btn.classList.remove('selected'));
    const selected = document.querySelector(`[data-body="${body}"]`);
    if (selected) {
        selected.classList.add('selected');
        formData.body = body;
        console.log('💪 [ADS] Выбрано телосложение:', body);
    }
}

/**
 * Выбор ориентации
 */
function selectOrientation(orientation) {
    document.querySelectorAll('[data-orientation]').forEach(btn => btn.classList.remove('selected'));
    const selected = document.querySelector(`[data-orientation="${orientation}"]`);
    if (selected) {
        selected.classList.add('selected');
        formData.orientation = orientation;
        console.log('🌈 [ADS] Выбрана ориентация:', orientation);
    }
}

/**
 * Обновить шаг формы создания анкеты
 */
function updateFormStep(step) {
    console.log(`📝 [ADS] Переход на шаг ${step}/${totalSteps}`);
    
    currentStep = step;
    
    // Скрываем все шаги (убираем класс active)
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    
    // Показываем текущий шаг (добавляем класс active)
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentStepEl) currentStepEl.classList.add('active');
    
    // Шаг 8 - создаём textarea динамически
    const textareaContainer = document.getElementById('textareaContainer');
    if (textareaContainer) {
        if (step === 8) {
            textareaContainer.style.display = 'block';
            
            // Удаляем старый textarea если есть
            let textarea = document.getElementById('adText');
            if (textarea) textarea.remove();
            
            // Создаём textarea динамически
            textarea = document.createElement('textarea');
            textarea.id = 'adText';
            textarea.placeholder = 'Расскажите о себе и что ищете...';
            textarea.rows = 6;
            textarea.maxLength = 500;
            
            // Применяем стили
            Object.assign(textarea.style, {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                width: '100%',
                maxWidth: '500px',
                padding: '15px',
                background: 'rgba(26, 26, 46, 0.8)',
                border: '2px solid #ff00ff',
                borderRadius: '15px',
                color: '#e0e0ff',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: '120px',
                height: 'auto',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                boxSizing: 'border-box',
                margin: '0 auto'
            });
            
            textarea.addEventListener('input', updateCharacterCount);
            textareaContainer.innerHTML = '';
            textareaContainer.appendChild(textarea);
            
            // Добавляем счетчик символов
            const counter = document.createElement('div');
            counter.id = 'charCounter';
            counter.style.marginTop = '8px';
            counter.style.textAlign = 'right';
            counter.style.fontSize = '12px';
            counter.style.color = 'var(--text-gray)';
            counter.textContent = '0/500';
            textareaContainer.appendChild(counter);
        } else {
            textareaContainer.style.display = 'none';
        }
    }
    
    // Шаг 9 - загружаем галерею фото пользователя
    if (step === 9 && typeof loadMyPhotosForStep9 === 'function') {
        loadMyPhotosForStep9();
    }
    
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
 * Обновление счетчика символов для текста анкеты
 */
function updateCharacterCount() {
    const textarea = document.getElementById('adText');
    const counter = document.getElementById('charCounter');
    
    if (textarea && counter) {
        const currentLength = textarea.value.length;
        const maxLength = textarea.getAttribute('maxlength') || 500;
        counter.textContent = `${currentLength}/${maxLength}`;
        
        // Меняем цвет если приближаемся к лимиту
        if (currentLength >= maxLength) {
            counter.style.color = 'var(--neon-pink)';
        } else if (currentLength >= maxLength * 0.9) {
            counter.style.color = 'var(--neon-orange)';
        } else {
            counter.style.color = 'var(--text-gray)';
        }
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

// Флаг для предотвращения повторной загрузки
let isLoadingAds = false;

/**
 * Показать раздел просмотра анкет
 */
async function showBrowseAds() {
    // Предотвращаем бесконечный цикл
    if (isLoadingAds) {
        console.log('⚠️ [ADS] Загрузка уже в процессе, пропускаем');
        return;
    }
    
    console.log('🔍 [ADS] Открытие просмотра анкет');
    
    isLoadingAds = true;
    
    try {
        // НЕ вызываем showScreen здесь - это вызовет цикл!
        // showScreen вызывается из menu.js, который потом вызывает нас
        // Просто показываем экран напрямую если нужно
        const screen = document.getElementById('browseAds');
        if (screen && screen.style.display === 'none') {
            // Скрываем все экраны
            document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
            screen.style.display = 'block';
        }
        
        currentAdsPage = 1;
        
        // Применяем фильтры и загружаем анкеты
        await loadAds();
        
        // Устанавливаем UI фильтра на базе локации пользователя
        if (typeof setFilterLocationUI === 'function') {
            setFilterLocationUI();
        }
    } finally {
        isLoadingAds = false;
    }
}

// Флаг загрузки для loadAds
let isLoadingAdsRequest = false;

/**
 * Загрузить анкеты с фильтрами
 */
async function loadAds(filters = {}) {
    // Предотвращаем множественные одновременные запросы
    if (isLoadingAdsRequest) {
        console.log('⚠️ [ADS] Запрос уже выполняется, пропускаем');
        return;
    }
    
    isLoadingAdsRequest = true;
    
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
        // Получаем total из pagination если есть, иначе берём длину массива
        totalAdsCount = result.pagination?.total || result.total || currentAds.length;
        
        console.log(`✅ [ADS] Загружено ${currentAds.length} анкет, всего: ${totalAdsCount}`);
        
        // Отображаем анкеты
        displayAds(currentAds);
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка при загрузке анкет:', error);
    } finally {
        isLoadingAdsRequest = false;
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

/**
 * ===== ФИЛЬТРЫ АНКЕТ =====
 */

/**
 * Переключить панель фильтров
 */
function toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    if (!panel) return;
    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'block';
        updateFilterButtons();
    } else {
        panel.style.display = 'none';
    }
}

/**
 * Установить значение фильтра
 */
function setFilter(type, value) {
    adsFilters[type] = value;
    updateFilterButtons();
}

/**
 * Обновить активные кнопки фильтров
 */
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

/**
 * Применить фильтры
 */
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
    
    const panel = document.getElementById('filtersPanel');
    if (panel) panel.style.display = 'none';
    
    showBrowseAds();
}

/**
 * Сбросить фильтры
 */
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
    
    const panel = document.getElementById('filtersPanel');
    if (panel) panel.style.display = 'none';
    
    showBrowseAds();
}

/**
 * ===== ФУНКЦИИ ВОЗРАСТА =====
 */

/**
 * Увеличить возраст
 */
function increaseAge(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    let currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max) || 100;
    
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        return;
    }
    
    if (currentValue < maxValue) {
        input.value = currentValue + 1;
    }
}

/**
 * Уменьшить возраст
 */
function decreaseAge(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    let currentValue = parseInt(input.value);
    const minValue = parseInt(input.min) || 18;
    
    if (isNaN(currentValue) || !input.value) {
        input.value = 18;
        return;
    }
    
    if (currentValue > minValue) {
        input.value = currentValue - 1;
    }
}

/**
 * ===== ФУНКЦИИ ЖАЛОБ =====
 */

let currentReportData = {
    reportedUserId: null,
    reportedNickname: null,
    reportType: null,
    relatedAdId: null,
    reason: null
};

/**
 * Пожаловаться на анкету
 */
function reportAd() {
    const ad = window.currentAds?.[window.currentAdIndex];
    if (!ad) {
        tg.showAlert('Анкета не найдена');
        return;
    }
    
    const reportedUserId = ad.user_id || null;
    if (!reportedUserId) {
        tg.showAlert('Не удалось определить автора анкеты');
        return;
    }
    
    currentReportData = {
        reportedUserId: reportedUserId,
        reportedNickname: ad.display_nickname || 'Аноним',
        reportType: 'ad',
        relatedAdId: ad.id,
        reason: null
    };
    
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'flex';
}

/**
 * Закрыть модальное окно жалобы
 */
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'none';
    
    const details = document.getElementById('reportDetailsSection');
    if (details) details.style.display = 'none';
    
    const desc = document.getElementById('reportDescription');
    if (desc) desc.value = '';
    
    document.querySelectorAll('.report-reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    currentReportData.reason = null;
}

/**
 * Выбрать причину жалобы
 */
function selectReportReason(reason) {
    currentReportData.reason = reason;
    
    document.querySelectorAll('.report-reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    if (event && event.target) {
        const btn = event.target.closest('.report-reason-btn');
        if (btn) btn.classList.add('selected');
    }
    
    const details = document.getElementById('reportDetailsSection');
    if (details) details.style.display = 'block';
}

/**
 * Отправить жалобу
 */
async function submitReport() {
    if (!currentReportData.reason) {
        tg.showAlert('Выберите причину жалобы');
        return;
    }
    
    const currentUserId = tg?.initDataUnsafe?.user?.id || localStorage.getItem('user_id');
    
    if (!currentUserId || !currentReportData.reportedUserId) {
        tg.showAlert('Ошибка: не удалось определить пользователей');
        return;
    }
    
    const description = document.getElementById('reportDescription')?.value?.trim();
    
    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reporterId: parseInt(currentUserId),
                reportedUserId: parseInt(currentReportData.reportedUserId),
                reportType: currentReportData.reportType,
                reason: currentReportData.reason,
                description: description || null,
                relatedAdId: currentReportData.relatedAdId || null,
                relatedMessageId: null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            tg.showAlert('✅ Жалоба отправлена. Администрация рассмотрит её в ближайшее время.');
            closeReportModal();
        } else {
            tg.showAlert(data.error || 'Ошибка при отправке жалобы');
        }
    } catch (error) {
        console.error('Ошибка отправки жалобы:', error);
        tg.showAlert('Ошибка при отправке жалобы');
    }
}

// Экспорт функций в глобальную область
window.showCreateAd = showCreateAd;
window.showBrowseAds = showBrowseAds;
window.showMyAds = showMyAds;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.submitAd = submitAd;
window.closeAdModal = closeAdModal;
window.showAdModal = showAdModal;
window.contactAuthor = contactAuthor;
window.deleteMyAd = deleteMyAd;
window.loadAds = loadAds;
window.nextAdsPage = nextAdsPage;
window.prevAdsPage = prevAdsPage;
window.handleCreateAdBack = handleCreateAdBack;
window.nextFormStep = nextFormStep;
window.prevFormStep = prevFormStep;
window.updateFormStep = updateFormStep;
window.displayAds = displayAds;
window.toggleFilters = toggleFilters;
window.setFilter = setFilter;
window.updateFilterButtons = updateFilterButtons;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.increaseAge = increaseAge;
window.decreaseAge = decreaseAge;
window.reportAd = reportAd;
window.closeReportModal = closeReportModal;
window.selectReportReason = selectReportReason;
window.submitReport = submitReport;
window.initFormHandlers = initFormHandlers;
window.selectGender = selectGender;
window.selectTarget = selectTarget;
window.selectGoal = selectGoal;
window.selectBody = selectBody;
window.selectOrientation = selectOrientation;
window.updateCharacterCount = updateCharacterCount;

console.log('✅ [ADS] Модуль анкет инициализирован');
