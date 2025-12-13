/**
 * Модуль онбординга (onboarding.js)
 * 
 * Функции:
 * - Управление процессом первого входа
 * - Заполнение профиля
 * - Выбор пола, возраста, ориентации и целей
 * - Валидация данных профиля
 */

console.log('🎯 [ONBOARDING] Инициализация модуля онбординга');

/**
 * Глобальные переменные онбординга
 */
let onboardingStep = 1;
let onboardingData = {
    gender: null,
    age: null,
    orientation: null,
    goals: [],
    languages: []
};
let isNicknameAvailable = false;
let nicknameCheckTimeout = null;

/**
 * ===== УПРАВЛЕНИЕ ПРОЦЕССОМ ОНБОРДИНГА =====
 */

/**
 * Показать экран онбординга
 */
function showOnboardingScreen() {
    const screen = document.getElementById('onboardingScreen');
    if (!screen) {
        console.warn('⚠️ [ONBOARDING] Экран онбординга не найден');
        return;
    }
    
    screen.style.display = 'flex';
    console.log('📱 [ONBOARDING] Показан экран онбординга, шаг:', onboardingStep);
    
    updateOnboardingStep();
}

/**
 * Скрыть экран онбординга
 */
function hideOnboardingScreen() {
    const screen = document.getElementById('onboardingScreen');
    if (screen) {
        screen.style.display = 'none';
        console.log('📱 [ONBOARDING] Экран онбординга скрыт');
    }
}

/**
 * Обновить текущий шаг онбординга
 */
function updateOnboardingStep() {
    // Шаги онбординга
    const steps = {
        1: showOnboardingStep1,     // Добро пожаловать
        2: showOnboardingStep2,     // Выбор пола
        3: showOnboardingStep3,     // Выбор возраста
        4: showOnboardingStep4,     // Выбор ориентации
        5: showOnboardingStep5,     // Выбор целей
        6: showOnboardingStep6      // Выбор языков
    };
    
    if (steps[onboardingStep]) {
        steps[onboardingStep]();
    } else {
        console.log('✅ [ONBOARDING] Все шаги пройдены');
        completeOnboarding();
    }
}

/**
 * Следующий шаг онбординга
 */
function nextOnboardingStep() {
    // Валидируем текущий шаг перед переходом
    if (!validateOnboardingStep(onboardingStep)) {
        console.log('⚠️ [ONBOARDING] Шаг', onboardingStep, 'не прошел валидацию');
        tg.showAlert('Заполните все обязательные поля');
        return;
    }
    
    onboardingStep++;
    updateOnboardingStep();
}

/**
 * Предыдущий шаг онбординга
 */
function previousOnboardingStep() {
    if (onboardingStep > 1) {
        onboardingStep--;
        updateOnboardingStep();
    }
}

/**
 * Валидация текущего шага
 */
function validateOnboardingStep(step) {
    switch(step) {
        case 1: // Приветствие - всегда OK
            return true;
        case 2: // Пол
            return onboardingData.gender !== null;
        case 3: // Возраст
            return onboardingData.age !== null;
        case 4: // Ориентация
            return onboardingData.orientation !== null;
        case 5: // Цели
            return onboardingData.goals.length > 0;
        case 6: // Языки
            return onboardingData.languages.length > 0;
        default:
            return true;
    }
}

/**
 * ===== ШАГИ ОНБОРДИНГА =====
 */

/**
 * Шаг 1: Приветствие
 */
function showOnboardingStep1() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    content.innerHTML = `
        <div class="onboarding-card">
            <div class="onboarding-icon">👋</div>
            <h1>Добро пожаловать в Anonimka!</h1>
            <p>Создайте свою анонимную анкету и найдите интересных людей.</p>
            <p style="font-size: 12px; color: var(--text-gray);">Никто не узнает, кто вы — вы сами выбираете, когда и кому рассказать.</p>
        </div>
    `;
}

/**
 * Шаг 2: Выбор пола
 */
function showOnboardingStep2() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const genderOptions = [
        { value: 'male', label: '👨 Мужчина' },
        { value: 'female', label: '👩 Женщина' },
        { value: 'other', label: '🌈 Другое' }
    ];
    
    let html = `
        <div class="onboarding-card">
            <h2>Какой ваш пол?</h2>
            <div class="onboarding-options" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    genderOptions.forEach(option => {
        const isSelected = onboardingData.gender === option.value ? 'selected' : '';
        html += `
            <button 
                class="onboarding-option ${isSelected}"
                onclick="selectOnboardingGender('${option.value}')"
            >
                ${option.label}
            </button>
        `;
    });
    
    html += `</div></div>`;
    content.innerHTML = html;
}

/**
 * Выбрать пол
 */
function selectOnboardingGender(gender) {
    onboardingData.gender = gender;
    console.log('👤 [ONBOARDING] Выбран пол:', gender);
    
    // Обновляем визуально
    document.querySelectorAll('.onboarding-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.onboarding-option').classList.add('selected');
}

/**
 * Шаг 3: Выбор возраста
 */
function showOnboardingStep3() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const minAge = 18;
    const maxAge = 80;
    const currentAge = onboardingData.age || 25;
    
    content.innerHTML = `
        <div class="onboarding-card">
            <h2>Сколько вам лет?</h2>
            <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: bold; color: var(--primary); margin: 20px 0;">
                    ${currentAge}
                </div>
                <input 
                    type="range" 
                    min="${minAge}" 
                    max="${maxAge}" 
                    value="${currentAge}"
                    oninput="updateOnboardingAge(this.value)"
                    style="width: 100%; cursor: pointer;"
                />
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; color: var(--text-gray);">
                    <span>${minAge}</span>
                    <span>${maxAge}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Обновить возраст в онбординге
 */
function updateOnboardingAge(age) {
    onboardingData.age = parseInt(age);
    
    const display = document.querySelector('.onboarding-card div[style*="font-size: 48px"]');
    if (display) {
        display.textContent = age;
    }
    
    console.log('🎂 [ONBOARDING] Выбран возраст:', age);
}

/**
 * Шаг 4: Выбор ориентации
 */
function showOnboardingStep4() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const orientationOptions = [
        { value: 'straight', label: '💕 Гетеросексуал' },
        { value: 'gay', label: '💙 Гей' },
        { value: 'lesbian', label: '💛 Лесбиянка' },
        { value: 'bisexual', label: '💜 Бисексуал' },
        { value: 'asexual', label: '⚪ Асексуал' },
        { value: 'other', label: '🌈 Другое' }
    ];
    
    let html = `
        <div class="onboarding-card">
            <h2>Сексуальная ориентация?</h2>
            <div class="onboarding-options" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    orientationOptions.forEach(option => {
        const isSelected = onboardingData.orientation === option.value ? 'selected' : '';
        html += `
            <button 
                class="onboarding-option ${isSelected}"
                onclick="selectOnboardingOrientation('${option.value}')"
            >
                ${option.label}
            </button>
        `;
    });
    
    html += `</div></div>`;
    content.innerHTML = html;
}

/**
 * Выбрать ориентацию
 */
function selectOnboardingOrientation(orientation) {
    onboardingData.orientation = orientation;
    console.log('💕 [ONBOARDING] Выбрана ориентация:', orientation);
    
    document.querySelectorAll('.onboarding-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.onboarding-option').classList.add('selected');
}

/**
 * Шаг 5: Выбор целей
 */
function showOnboardingStep5() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const goalsOptions = [
        { value: 'dating', label: '💑 Знакомства' },
        { value: 'friendship', label: '🤝 Дружба' },
        { value: 'talking', label: '💬 Общение' },
        { value: 'fun', label: '🎉 Развлечение' },
        { value: 'advice', label: '🤔 Советы' },
        { value: 'other', label: '❓ Другое' }
    ];
    
    let html = `
        <div class="onboarding-card">
            <h2>Выберите цели (можно несколько)</h2>
            <div class="onboarding-options" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    goalsOptions.forEach(option => {
        const isSelected = onboardingData.goals.includes(option.value) ? 'selected' : '';
        html += `
            <button 
                class="onboarding-option ${isSelected}"
                onclick="toggleOnboardingGoal('${option.value}')"
            >
                ${option.label}
            </button>
        `;
    });
    
    html += `</div></div>`;
    content.innerHTML = html;
}

/**
 * Переключить выбор цели
 */
function toggleOnboardingGoal(goal) {
    const index = onboardingData.goals.indexOf(goal);
    
    if (index > -1) {
        onboardingData.goals.splice(index, 1);
    } else {
        onboardingData.goals.push(goal);
    }
    
    console.log('🎯 [ONBOARDING] Выбранные цели:', onboardingData.goals);
    
    // Обновляем визуально
    event.target.closest('.onboarding-option').classList.toggle('selected');
}

/**
 * Шаг 6: Выбор языков
 */
function showOnboardingStep6() {
    const content = document.querySelector('[data-onboarding-content]');
    if (!content) return;
    
    const languageOptions = [
        { value: 'russian', label: '🇷🇺 Русский' },
        { value: 'english', label: '🇬🇧 English' },
        { value: 'kazakh', label: '🇰🇿 Қазақша' },
        { value: 'turkish', label: '🇹🇷 Türkçe' },
        { value: 'arabic', label: '🇦🇪 العربية' }
    ];
    
    let html = `
        <div class="onboarding-card">
            <h2>На каких языках вы говорите?</h2>
            <div class="onboarding-options" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    languageOptions.forEach(option => {
        const isSelected = onboardingData.languages.includes(option.value) ? 'selected' : '';
        html += `
            <button 
                class="onboarding-option ${isSelected}"
                onclick="toggleOnboardingLanguage('${option.value}')"
            >
                ${option.label}
            </button>
        `;
    });
    
    html += `</div></div>`;
    content.innerHTML = html;
}

/**
 * Переключить выбор языка
 */
function toggleOnboardingLanguage(language) {
    const index = onboardingData.languages.indexOf(language);
    
    if (index > -1) {
        onboardingData.languages.splice(index, 1);
    } else {
        onboardingData.languages.push(language);
    }
    
    console.log('🗣️ [ONBOARDING] Выбранные языки:', onboardingData.languages);
    
    // Обновляем визуально
    event.target.closest('.onboarding-option').classList.toggle('selected');
}

/**
 * ===== СТАТУС НИКНЕЙМА =====
 */

/**
 * Проверка доступности никнейма
 */
async function checkNicknameAvailability(nickname) {
    // Если никнейм пустой - сбрасываем
    if (!nickname || nickname.length < 1) {
        isNicknameAvailable = false;
        showNicknameStatus('', '');
        updateContinueButton();
        return;
    }
    
    // Показываем статус проверки
    showNicknameStatus('checking', '⏳ Проверяем...');
    
    try {
        const response = await fetch(`/api/nickname?nickname=${encodeURIComponent(nickname)}`);
        const data = await response.json();
        
        if (data.available) {
            isNicknameAvailable = true;
            showNicknameStatus('available', '✅ Доступен');
        } else {
            isNicknameAvailable = false;
            showNicknameStatus('taken', '❌ Уже занят');
        }
        
        updateContinueButton();
    } catch (error) {
        console.error('Ошибка проверки никнейма:', error);
        isNicknameAvailable = false;
        showNicknameStatus('error', '❌ Ошибка проверки');
        updateContinueButton();
    }
}

/**
 * Показать статус проверки никнейма
 */
function showNicknameStatus(type, message) {
    const statusEl = document.getElementById('nicknameStatus');
    if (!statusEl) return;
    
    statusEl.className = 'nickname-status';
    if (type) {
        statusEl.classList.add(type);
        statusEl.textContent = message;
    } else {
        statusEl.textContent = '';
    }
}

/**
 * Обновить состояние кнопки "Готово"
 */
function updateContinueButton() {
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const continueBtn = document.getElementById('onboardingContinue');
    const statusEl = document.getElementById('nicknameStatus');
    
    if (!continueBtn) return;
    
    const nickname = nicknameInput?.value.trim() || '';
    const agreed = agreeCheckbox?.checked || false;
    const nicknameAvailable = statusEl?.classList.contains('available');
    
    // Никнейм от 1 символа + доступен + чекбокс нажат
    const canContinue = nickname.length >= 1 && nicknameAvailable && agreed;
    
    continueBtn.disabled = !canContinue;
    continueBtn.textContent = canContinue ? '✅ Готово' : '⏳ Заполните данные...';
    continueBtn.style.opacity = canContinue ? '1' : '0.5';
}

/**
 * ===== ЗАВЕРШЕНИЕ ОНБОРДИНГА =====
 */

/**
 * Завершить онбординг и сохранить профиль
 */
async function completeOnboarding() {
    console.log('✅ [ONBOARDING] Завершение онбординга');
    
    // Получаем никнейм и проверяем чекбокс
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const continueBtn = document.getElementById('onboardingContinue');
    
    const nickname = nicknameInput?.value.trim() || '';
    const agreed = agreeCheckbox?.checked || false;
    
    // Проверяем условия
    if (!nickname || nickname.length < 1) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Введите никнейм');
        } else {
            alert('Введите никнейм');
        }
        return;
    }
    
    if (!isNicknameAvailable) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Этот никнейм уже занят');
        } else {
            alert('Этот никнейм уже занят');
        }
        return;
    }
    
    if (!agreed) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Примите условия использования');
        } else {
            alert('Примите условия использования');
        }
        return;
    }
    
    // Блокируем кнопку
    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.textContent = '⏳ Сохраняем...';
    }
    
    try {
        const userToken = localStorage.getItem('user_token');
        const savedUser = localStorage.getItem('telegram_user');
        const tgId = savedUser ? JSON.parse(savedUser)?.id : null;
        const userId = userToken || (tgId ? String(tgId) : null);
        
        if (!userId) {
            console.error('❌ [ONBOARDING] Токен не найден');
            if (typeof tg !== 'undefined' && tg.showAlert) {
                tg.showAlert('Ошибка: пользователь не авторизован');
            } else {
                alert('Ошибка: пользователь не авторизован');
            }
            updateContinueButton();
            return;
        }
        
        // Сначала сохраняем никнейм
        console.log('📝 [ONBOARDING] Сохраняем никнейм:', nickname);
        const nicknameResponse = await fetch('/api/nickname', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_token: userId,
                nickname: nickname
            })
        });
        
        const nicknameData = await nicknameResponse.json();
        
        if (!nicknameData.success) {
            console.error('❌ [ONBOARDING] Ошибка сохранения никнейма:', nicknameData.message);
            if (typeof tg !== 'undefined' && tg.showAlert) {
                tg.showAlert(nicknameData.message || 'Ошибка сохранения никнейма');
            } else {
                alert(nicknameData.message || 'Ошибка сохранения никнейма');
            }
            updateContinueButton();
            return;
        }
        
        console.log('✅ [ONBOARDING] Никнейм сохранен');
        
        // Сохраняем никнейм локально
        localStorage.setItem('userNickname', nickname);
        localStorage.setItem('user_nickname', nickname);
        
        // Определяем и сохраняем местоположение
        await detectAndSaveLocation(userToken);
        
        // Сохраняем данные локально
        localStorage.setItem('onboardingCompleted', 'true');
        
        // Обработка реферальной награды если нужна
        if (typeof processReferralReward === 'function') {
            await processReferralReward();
        }
        
        // Закрываем онбординг
        hideOnboardingScreen();
        
        // Инициализируем меню
        if (typeof initializeMenuModule === 'function') {
            initializeMenuModule();
        }
        
        // Показываем главный экран
        if (typeof goToHome === 'function') {
            goToHome();
        } else if (typeof showMainMenu === 'function') {
            showMainMenu();
        }
        
    } catch (error) {
        console.error('❌ [ONBOARDING] Ошибка завершения:', error);
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Ошибка при завершении регистрации');
        } else {
            alert('Ошибка при завершении регистрации');
        }
        updateContinueButton();
    }
}

/**
 * Определение и сохранение местоположения пользователя
 * Приоритет: GPS → IP → Timezone
 */
async function detectAndSaveLocation(userToken) {
    console.log('📍 [LOCATION] Начинаем определение местоположения...');
    
    let locationData = null;
    
    // 1. Пробуем GPS (Geolocation API)
    try {
        locationData = await getLocationByGPS();
        if (locationData) {
            console.log('✅ [LOCATION] Получено по GPS:', locationData);
        }
    } catch (e) {
        console.log('⚠️ [LOCATION] GPS недоступен:', e.message);
    }
    
    // 2. Если GPS не сработал - пробуем по IP
    if (!locationData) {
        try {
            locationData = await getLocationByIP();
            if (locationData) {
                console.log('✅ [LOCATION] Получено по IP:', locationData);
            }
        } catch (e) {
            console.log('⚠️ [LOCATION] IP геолокация недоступна:', e.message);
        }
    }
    
    // 3. Если IP не сработал - определяем по часовому поясу
    if (!locationData) {
        try {
            locationData = getLocationByTimezone();
            if (locationData) {
                console.log('✅ [LOCATION] Получено по часовому поясу:', locationData);
            }
        } catch (e) {
            console.log('⚠️ [LOCATION] Timezone определение не удалось:', e.message);
        }
    }
    
    // 4. Если ничего не определилось - ставим по умолчанию
    if (!locationData) {
        locationData = { country: 'KZ', city: 'Алматы', region: null };
        console.log('⚠️ [LOCATION] Используем значение по умолчанию:', locationData);
    }
    
    // Сохраняем локально (все форматы для совместимости)
    localStorage.setItem('userCountry', locationData.country);
    localStorage.setItem('userCity', locationData.city);
    if (locationData.region) {
        localStorage.setItem('userRegion', locationData.region);
    }
    // Сохраняем как JSON объект для location.js
    localStorage.setItem('userLocation', JSON.stringify(locationData));
    
    // Обновляем глобальную переменную в модуле location.js
    if (typeof window.currentUserLocation !== 'undefined') {
        window.currentUserLocation = locationData;
    }
    // Также пробуем установить напрямую (если переменная глобальная)
    try {
        currentUserLocation = locationData;
    } catch (e) {
        // Переменная не в глобальной области - игнорируем
    }
    
    // Обновляем отображение локации сразу (до запроса на сервер)
    if (typeof updateLocationDisplay === 'function') {
        updateLocationDisplay();
    }
    
    // Сохраняем на сервер
    try {
        const response = await fetch('/api/users/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userToken: userToken,
                country: locationData.country,
                region: locationData.region,
                city: locationData.city
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('✅ [LOCATION] Локация сохранена в БД');
            // Обновляем отображение локации в главном меню
            if (typeof updateLocationDisplay === 'function') {
                updateLocationDisplay();
            }
        } else {
            console.error('❌ [LOCATION] Ошибка сохранения:', result.error);
        }
    } catch (error) {
        console.error('❌ [LOCATION] Ошибка запроса:', error);
    }
}

/**
 * Получить локацию по GPS
 */
function getLocationByGPS() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation не поддерживается'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log('📍 [GPS] Координаты:', latitude, longitude);
                    
                    // Реверс-геокодинг через бесплатный API
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`
                    );
                    const data = await response.json();
                    
                    if (data && data.address) {
                        const country = data.address.country_code?.toUpperCase() || 'KZ';
                        const city = data.address.city || data.address.town || data.address.village || data.address.state || 'Неизвестно';
                        const region = data.address.state || null;
                        
                        resolve({ country, city, region });
                    } else {
                        reject(new Error('Не удалось определить адрес'));
                    }
                } catch (e) {
                    reject(e);
                }
            },
            (error) => {
                reject(new Error('GPS отклонен: ' + error.message));
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    });
}

/**
 * Получить локацию по IP
 */
async function getLocationByIP() {
    // Пробуем несколько бесплатных сервисов
    const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/?lang=ru'
    ];
    
    for (const url of services) {
        try {
            const response = await fetch(url, { timeout: 5000 });
            const data = await response.json();
            
            if (data) {
                // ipapi.co формат
                if (data.country_code) {
                    return {
                        country: data.country_code,
                        city: data.city || 'Неизвестно',
                        region: data.region || null
                    };
                }
                // ip-api.com формат
                if (data.countryCode) {
                    return {
                        country: data.countryCode,
                        city: data.city || 'Неизвестно',
                        region: data.regionName || null
                    };
                }
            }
        } catch (e) {
            console.log('⚠️ [IP] Сервис недоступен:', url);
        }
    }
    
    return null;
}

/**
 * Получить локацию по часовому поясу
 */
function getLocationByTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('🕐 [TIMEZONE]:', timezone);
    
    // Маппинг часовых поясов на локации
    const timezoneMap = {
        'Asia/Almaty': { country: 'KZ', city: 'Алматы', region: 'Алматы' },
        'Asia/Qyzylorda': { country: 'KZ', city: 'Кызылорда', region: 'Кызылординская область' },
        'Asia/Aqtobe': { country: 'KZ', city: 'Актобе', region: 'Актюбинская область' },
        'Asia/Aqtau': { country: 'KZ', city: 'Актау', region: 'Мангистауская область' },
        'Asia/Atyrau': { country: 'KZ', city: 'Атырау', region: 'Атырауская область' },
        'Asia/Oral': { country: 'KZ', city: 'Уральск', region: 'Западно-Казахстанская область' },
        'Europe/Moscow': { country: 'RU', city: 'Москва', region: 'Москва' },
        'Europe/Kiev': { country: 'UA', city: 'Киев', region: 'Киев' },
        'Europe/Minsk': { country: 'BY', city: 'Минск', region: 'Минск' },
        'Asia/Tashkent': { country: 'UZ', city: 'Ташкент', region: 'Ташкент' },
        'Asia/Bishkek': { country: 'KG', city: 'Бишкек', region: 'Чуйская область' },
        'Asia/Dushanbe': { country: 'TJ', city: 'Душанбе', region: 'Душанбе' },
        'Asia/Ashgabat': { country: 'TM', city: 'Ашхабад', region: 'Ашхабад' },
        'Asia/Baku': { country: 'AZ', city: 'Баку', region: 'Баку' },
        'Asia/Yerevan': { country: 'AM', city: 'Ереван', region: 'Ереван' },
        'Asia/Tbilisi': { country: 'GE', city: 'Тбилиси', region: 'Тбилиси' }
    };
    
    if (timezoneMap[timezone]) {
        return timezoneMap[timezone];
    }
    
    // Если точного совпадения нет - определяем по префиксу
    if (timezone.startsWith('Asia/')) {
        return { country: 'KZ', city: 'Алматы', region: null };
    }
    if (timezone.startsWith('Europe/')) {
        return { country: 'RU', city: 'Москва', region: null };
    }
    
    return null;
}

/**
 * Проверить, нужен ли онбординг
 */
function checkOnboarding() {
    // Проверяем localStorage
    const isCompleted = localStorage.getItem('onboardingCompleted') === 'true';
    
    // Также проверяем наличие никнейма - если есть, значит уже зарегистрирован
    const hasNickname = localStorage.getItem('userNickname') || localStorage.getItem('user_nickname');
    const hasUserToken = localStorage.getItem('user_token');
    const hasTelegramUser = localStorage.getItem('telegram_user');
    
    // Если есть никнейм и (токен ИЛИ telegram_user) - онбординг не нужен
    if (hasNickname && (hasUserToken || hasTelegramUser) && hasNickname !== 'null' && hasNickname !== 'undefined') {
        console.log('✅ [ONBOARDING] Никнейм найден, онбординг не нужен:', hasNickname);
        // Синхронизируем флаг
        localStorage.setItem('onboardingCompleted', 'true');
        return false;
    }
    
    if (isCompleted) {
        console.log('✅ [ONBOARDING] Онбординг уже пройден (по флагу)');
        return false;
    }
    
    console.log('📱 [ONBOARDING] Онбординг требуется');
    onboardingStep = 1;
    showOnboardingScreen();
    return true;
}

/**
 * Показать экран редактирования никнейма
 */
function showNicknameEditorScreen() {
    if (typeof closeHamburgerMenu === 'function') closeHamburgerMenu();
    if (typeof showScreen === 'function') showScreen('nicknameEditScreen');
    
    const currentNicknameDisplay = document.getElementById('currentNicknameDisplay');
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    const savedNickname = localStorage.getItem('userNickname') || localStorage.getItem('user_nickname') || 'Аноним';
    
    console.log('📝 [ONBOARDING] Показываем редактор никнейма, текущий:', savedNickname);
    
    if (currentNicknameDisplay) {
        currentNicknameDisplay.textContent = savedNickname;
    }
    
    if (nicknameInputPage) {
        nicknameInputPage.value = savedNickname;
        setTimeout(() => nicknameInputPage.focus(), 300);
    }
    
    // Показываем подсказку для пользователей с автоматическим никнеймом
    const anonymousUserHint = document.getElementById('anonymousUserHint');
    if (anonymousUserHint) {
        const isAnonymousNickname = savedNickname.startsWith('Аноним');
        anonymousUserHint.style.display = isAnonymousNickname ? 'block' : 'none';
    }
    
    updateTelegramNameButton();
}

/**
 * Обновить текст кнопки с именем из Telegram
 */
function updateTelegramNameButton() {
    let telegramName = 'Аноним';
    
    if (typeof isTelegramWebApp !== 'undefined' && isTelegramWebApp && tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        telegramName = user.first_name || user.username || 'Аноним';
    } else {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                telegramName = user.first_name || user.username || 'Аноним';
            } catch (e) {
                console.error('Ошибка парсинга данных пользователя:', e);
            }
        }
    }
}

/**
 * Сохранить никнейм со страницы редактирования
 */
async function saveNicknamePage() {
    const nicknameInputPage = document.getElementById('nicknameInputPage');
    
    if (!nicknameInputPage) return;
    
    let nickname = nicknameInputPage.value.trim();
    
    if (!nickname) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('❌ Никнейм не может быть пустым');
        } else {
            alert('❌ Никнейм не может быть пустым');
        }
        return;
    }
    
    // Получаем tgId или используем фиктивный для email пользователей
    let tgIdAuth = null;
    const userToken = localStorage.getItem('user_token');
    const authMethod = localStorage.getItem('auth_method');
    const isAndroid = navigator.userAgent.includes('Android');
    
    if (authMethod === 'email' || (isAndroid && userToken)) {
        tgIdAuth = 99999999;
        console.log('📱 [ONBOARDING] Email/Android user, using fake tgId');
    } else if (typeof isTelegramWebApp !== 'undefined' && isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        tgIdAuth = Number(window.Telegram.WebApp.initDataUnsafe.user.id);
    } else {
        const savedUserJson = localStorage.getItem('telegram_user');
        if (savedUserJson) {
            try {
                const u = JSON.parse(savedUserJson);
                if (u?.id) tgIdAuth = Number(u.id);
            } catch (e) {}
        }
    }

    if (!tgIdAuth) {
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('❌ Не удалось получить данные авторизации');
        } else {
            alert('❌ Не удалось получить данные авторизации');
        }
        return;
    }

    try {
        const payload = { 
            tgId: tgIdAuth, 
            nickname: nickname 
        };
        
        if (userToken) {
            payload.userToken = userToken;
        }
        
        const response = await fetch('/api/nickname', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            let errorMessage = result.error || 'Неизвестная ошибка';
            
            if (result.code === 'NICKNAME_LOCKED_FREE') {
                errorMessage = '🔒 Вы уже использовали бесплатную смену никнейма.\n\n💎 Обновитесь до PRO чтобы менять никнейм неограниченно (раз в сутки)!';
            } else if (result.code === 'NICKNAME_COOLDOWN') {
                const hours = result.hoursRemaining || 24;
                errorMessage = `⏳ PRO пользователи могут менять никнейм раз в 24 часа.\n\nПопробуйте через ${hours} ч.`;
            } else if (result.code === 'NICKNAME_TAKEN') {
                errorMessage = '❌ Этот никнейм уже занят. Выберите другой.';
            } else if (result.code === 'INVALID_NICKNAME') {
                errorMessage = '❌ Никнейм может содержать только буквы (рус/eng), цифры, _ и -\n\nПробелы запрещены!';
            }

            if (typeof tg !== 'undefined' && tg?.showAlert) {
                tg.showAlert(errorMessage);
            } else {
                alert(errorMessage);
            }
            return;
        }

        // Успешно сохранено
        localStorage.setItem('user_nickname', nickname);
        localStorage.setItem('userNickname', nickname);
        console.log('✅ [ONBOARDING] Никнейм сохранён:', nickname);

        // Обновляем nickname во всех анкетах
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;

        if (userId || userToken || tgIdAuth) {
            try {
                const adsPayload = {
                    action: 'update-all-nicknames',
                    nickname: nickname
                };
                if (userToken && userToken !== 'null' && userToken !== 'undefined') {
                    adsPayload.userToken = userToken;
                }
                if (typeof tgIdAuth === 'number' && Number.isFinite(tgIdAuth)) {
                    adsPayload.tgId = tgIdAuth;
                } else if (userId && !isNaN(Number(userId))) {
                    adsPayload.tgId = Number(userId);
                }

                const adsResponse = await fetch('/api/ads', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(adsPayload)
                });
                const adsResult = await adsResponse.json();
                if (adsResult.success) {
                    console.log('✅ [ONBOARDING] Никнейм обновлен в анкетах:', adsResult.count);
                }
            } catch (error) {
                console.error('[ONBOARDING] Ошибка обновления никнейма в анкетах:', error);
            }
        }
        
        // Показываем уведомление и возвращаемся на главную
        if (typeof tg !== 'undefined' && tg?.showPopup) {
            tg.showPopup({
                title: '✅ Сохранено',
                message: `Ваш ${result.isFirstTime ? '' : 'новый '}псевдоним: "${nickname}"`,
                buttons: [{ type: 'ok' }]
            });
        }
        
        setTimeout(() => {
            if (typeof showMainMenu === 'function') showMainMenu();
        }, 300);
    } catch (error) {
        console.error('[ONBOARDING] Ошибка сохранения никнейма:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('❌ Ошибка сохранения никнейма');
        } else {
            alert('❌ Ошибка сохранения никнейма');
        }
    }
}

/**
 * Показать редактор никнейма (старая версия)
 */
function showNicknameEditor() {
    showNicknameEditorScreen();
}

/**
 * Сохранить никнейм (старая версия)
 */
function saveNickname() {
    saveNicknamePage();
}

// Экспорт функций для onclick
window.showOnboardingScreen = showOnboardingScreen;
window.hideOnboardingScreen = hideOnboardingScreen;
window.updateOnboardingStep = updateOnboardingStep;
window.nextOnboardingStep = nextOnboardingStep;
window.previousOnboardingStep = previousOnboardingStep;
window.validateOnboardingStep = validateOnboardingStep;
window.showOnboardingStep1 = showOnboardingStep1;
window.showOnboardingStep2 = showOnboardingStep2;
window.selectOnboardingGender = selectOnboardingGender;
window.showOnboardingStep3 = showOnboardingStep3;
window.updateOnboardingAge = updateOnboardingAge;
window.showOnboardingStep4 = showOnboardingStep4;
window.selectOnboardingOrientation = selectOnboardingOrientation;
window.showOnboardingStep5 = showOnboardingStep5;
window.toggleOnboardingGoal = toggleOnboardingGoal;
window.showOnboardingStep6 = showOnboardingStep6;
window.toggleOnboardingLanguage = toggleOnboardingLanguage;
window.completeOnboarding = completeOnboarding;
window.checkOnboarding = checkOnboarding;
window.checkNicknameAvailability = checkNicknameAvailability;
window.showNicknameStatus = showNicknameStatus;
window.updateContinueButton = updateContinueButton;
window.showNicknameEditorScreen = showNicknameEditorScreen;
window.updateTelegramNameButton = updateTelegramNameButton;
window.saveNicknamePage = saveNicknamePage;
window.showNicknameEditor = showNicknameEditor;
window.saveNickname = saveNickname;
window.cancelNicknameEdit = cancelNicknameEdit;
window.useDefaultNickname = useDefaultNickname;
window.useDefaultNicknameMain = useDefaultNicknameMain;
window.checkOnboardingStatus = checkOnboardingStatus;

/**
 * Отменить редактирование никнейма
 */
function cancelNicknameEdit() {
    if (typeof showMainMenu === 'function') showMainMenu();
}

/**
 * Использовать имя из Telegram (старая версия для совместимости)
 */
function useDefaultNickname() {
    let telegramName = 'Аноним';
    
    if (typeof isTelegramWebApp !== 'undefined' && isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        telegramName = user.first_name || user.username || 'Аноним';
    } else {
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                telegramName = user.first_name || user.username || 'Аноним';
            } catch (e) {
                console.error('Ошибка парсинга данных пользователя:', e);
            }
        }
    }
    
    const nicknameInput = document.getElementById('nicknameInput');
    if (nicknameInput) {
        nicknameInput.value = telegramName;
        localStorage.setItem('user_nickname', telegramName);
    }
}

/**
 * Использовать имя из Telegram на главной странице
 */
function useDefaultNicknameMain() {
    useDefaultNickname();
}

/**
 * Проверка статуса онбординга пользователя
 */
async function checkOnboardingStatus() {
    console.log('checkOnboardingStatus вызвана');
    try {
        // Проверяем, не открыто ли уже модальное окно никнейма
        const nicknameModal = document.getElementById('requiredNicknameModal');
        if (nicknameModal && nicknameModal.style.display === 'flex') {
            console.log('⚠️ Модальное окно никнейма уже открыто');
            return;
        }
        
        // Сначала проверяем локальное хранилище
        const localNickname = localStorage.getItem('userNickname');
        if (localNickname && localNickname.trim() !== '') {
            console.log('✅ Никнейм найден в localStorage:', localNickname);
            
            // Проверяем есть ли локация
            const userLocation = localStorage.getItem('userLocation');
            if (!userLocation) {
                console.log('⚠️ Локация не найдена, предлагаем выбрать');
                // Показываем главное меню, а затем экран выбора локации
                if (typeof showMainMenu === 'function') showMainMenu();
                setTimeout(() => {
                    if (typeof showLocationSetup === 'function') {
                        showLocationSetup();
                    } else if (typeof showScreen === 'function') {
                        showScreen('locationSetup');
                    }
                }, 500);
                return;
            }
            
            if (typeof showMainMenu === 'function') showMainMenu();
            return;
        }
        
        // Получаем tgId или userToken
        let tgId = null;
        let userToken = localStorage.getItem('user_token');
        
        if (typeof isTelegramWebApp !== 'undefined' && isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            tgId = window.Telegram.WebApp.initDataUnsafe.user.id;
        } else {
            try {
                const savedUser = localStorage.getItem('telegram_user');
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    tgId = user.id;
                }
            } catch (e) {}
        }
        
        if (!tgId && !userToken) {
            console.log('⚠️ Нет ни tgId ни userToken - показываем модалку авторизации');
            // Показываем модалку авторизации через Telegram
            if (typeof showTelegramAuthModal === 'function') {
                setTimeout(() => showTelegramAuthModal(), 100);
            }
            return;
        }
        
        // Проверяем никнейм в БД
        let url = '/api/users?';
        if (tgId) url += `tgId=${tgId}`;
        else if (userToken) url += `userToken=${userToken}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const nickname = data.displayNickname || data.nickname;
        
        if (nickname && nickname.trim() !== '') {
            localStorage.setItem('userNickname', nickname);
            localStorage.setItem('user_nickname', nickname);
            console.log('✅ Никнейм из БД:', nickname);
            
            // Проверяем локацию из БД
            if (data.location) {
                localStorage.setItem('userLocation', JSON.stringify(data.location));
                console.log('✅ Локация из БД:', data.location);
            }
            
            // Проверяем есть ли локация
            const userLocation = localStorage.getItem('userLocation');
            if (!userLocation) {
                console.log('⚠️ Локация не найдена, предлагаем выбрать');
                if (typeof showMainMenu === 'function') showMainMenu();
                setTimeout(() => {
                    if (typeof showLocationSetup === 'function') {
                        showLocationSetup();
                    } else if (typeof showScreen === 'function') {
                        showScreen('locationSetup');
                    }
                }, 500);
                return;
            }
            
            if (typeof showMainMenu === 'function') showMainMenu();
        } else {
            console.log('⚠️ У пользователя нет никнейма');
            if (typeof showOnboardingScreen === 'function') showOnboardingScreen();
        }
    } catch (error) {
        console.error('❌ Ошибка checkOnboardingStatus:', error);
        if (typeof showOnboardingScreen === 'function') showOnboardingScreen();
    }
}

/**
 * Инициализация обработчиков событий для онбординга
 */
function initOnboardingEventListeners() {
    console.log('🎯 [ONBOARDING] Инициализация обработчиков событий');
    
    // Обработчик ввода никнейма
    const nicknameInput = document.getElementById('onboardingNicknameInput');
    if (nicknameInput) {
        nicknameInput.addEventListener('input', function() {
            const nickname = this.value.trim();
            
            // Очищаем предыдущий таймер
            if (nicknameCheckTimeout) {
                clearTimeout(nicknameCheckTimeout);
            }
            
            // Если пустое поле - сбрасываем
            if (!nickname || nickname.length < 1) {
                isNicknameAvailable = false;
                showNicknameStatus('', '');
                updateContinueButton();
                return;
            }
            
            // Debounce: проверяем через 300мс после последнего ввода
            nicknameCheckTimeout = setTimeout(() => {
                checkNicknameAvailability(nickname);
            }, 300);
        });
        console.log('✅ [ONBOARDING] Обработчик никнейма установлен');
    }
    
    // Обработчик чекбокса
    const agreeCheckbox = document.getElementById('agreeTerms');
    if (agreeCheckbox) {
        agreeCheckbox.addEventListener('change', function() {
            updateContinueButton();
        });
        console.log('✅ [ONBOARDING] Обработчик чекбокса установлен');
    }
    
    // Начальное состояние кнопки
    updateContinueButton();
}

// Запускаем инициализацию при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnboardingEventListeners);
} else {
    // DOM уже загружен
    setTimeout(initOnboardingEventListeners, 100);
}

console.log('✅ [ONBOARDING] Модуль онбординга загружен');
