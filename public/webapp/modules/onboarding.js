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
 * ===== ЗАВЕРШЕНИЕ ОНБОРДИНГА =====
 */

/**
 * Завершить онбординг и сохранить профиль
 */
async function completeOnboarding() {
    console.log('✅ [ONBOARDING] Завершение онбординга');
    console.log('📊 [ONBOARDING] Данные профиля:', onboardingData);
    
    try {
        const userToken = localStorage.getItem('user_token');
        
        if (!userToken) {
            console.error('❌ [ONBOARDING] Токен не найден');
            tg.showAlert('Ошибка: пользователь не авторизирован');
            return;
        }
        
        // Отправляем профиль на сервер
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_token: userToken,
                gender: onboardingData.gender,
                age: onboardingData.age,
                orientation: onboardingData.orientation,
                goals: onboardingData.goals,
                languages: onboardingData.languages
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ [ONBOARDING] Профиль сохранен');
            
            // Сохраняем данные локально
            localStorage.setItem('onboardingCompleted', 'true');
            localStorage.setItem('userProfile', JSON.stringify(onboardingData));
            
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
            }
            
        } else {
            console.error('❌ [ONBOARDING] Ошибка сохранения:', data.message);
            tg.showAlert('Ошибка при сохранении профиля');
        }
        
    } catch (error) {
        console.error('❌ [ONBOARDING] Ошибка завершения:', error);
        tg.showAlert('Ошибка при завершении регистрации');
    }
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
    
    // Если есть никнейм и токен - онбординг не нужен
    if (hasNickname && hasUserToken && hasNickname !== 'null' && hasNickname !== 'undefined') {
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

console.log('✅ [ONBOARDING] Модуль онбординга загружен');
