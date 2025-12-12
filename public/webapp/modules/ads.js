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
 * ===== УТИЛИТЫ ДЛЯ АНКЕТ =====
 */

/**
 * Нормализация названия города
 */
function normalizeCity(cityName) {
    if (!cityName) return null;
    const normalized = cityName.trim();
    
    // Маппинг старых и новых названий
    const cityAliases = {
        'Алма-Ата': 'Алматы',
        'Алма-ата': 'Алматы',
        'алма-ата': 'Алматы',
        'Almaty': 'Алматы',
        'Ленинград': 'Санкт-Петербург',
        'Leningrad': 'Санкт-Петербург',
        'Свердловск': 'Екатеринбург'
    };
    
    return cityAliases[normalized] || normalized;
}

/**
 * Форматирование пола для отображения
 */
function formatGender(gender) {
    const genderMap = {
        'male': 'Мужчина',
        'female': 'Девушка',
        'мужчина': 'Мужчина',
        'девушка': 'Девушка',
        'пара': 'Пара'
    };
    return genderMap[gender?.toLowerCase()] || gender || 'Не указан';
}

/**
 * Форматирование цели поиска
 */
function formatTarget(target) {
    const targetMap = {
        'male': 'Мужчину',
        'female': 'Девушку',
        'any': 'Не важно',
        'мужчину': 'Мужчину',
        'девушку': 'Девушку',
        'женщину': 'Девушку'
    };
    return targetMap[target?.toLowerCase()] || target || 'Не важно';
}

/**
 * Форматирование целей общения (может быть несколько через запятую)
 */
function formatGoals(goals) {
    if (!goals) return 'Не указано';
    
    const goalMap = {
        'friendship': 'Дружба',
        'relationship': 'Отношения',
        'chat': 'Общение',
        'other': 'Другое',
        'дружба': 'Дружба',
        'отношения': 'Отношения',
        'общение': 'Общение',
        'другое': 'Другое'
    };
    
    // Если это массив
    if (Array.isArray(goals)) {
        return goals.map(g => goalMap[g?.toLowerCase()] || g).join(', ');
    }
    
    // Если это строка с запятыми
    if (typeof goals === 'string' && goals.includes(',')) {
        return goals.split(',').map(g => {
            g = g.trim();
            return goalMap[g?.toLowerCase()] || g;
        }).join(', ');
    }
    
    // Одна цель
    return goalMap[goals?.toLowerCase()] || goals;
}

/**
 * Форматирование ориентации
 */
function formatOrientation(orientation) {
    if (!orientation) return 'Не указано';
    
    const orientationMap = {
        'hetero': 'Гетеро',
        'gay': 'Гей / Лесбиянка',
        'bi': 'Би',
        'pan': 'Пансексуал',
        'ace': 'Асексуал',
        'demi': 'Демисексуал',
        'queer': 'Квир',
        'grey': 'Грейсексуал',
        'sever': 'Север'
    };
    
    return orientationMap[orientation?.toLowerCase()] || orientation;
}

/**
 * Обновить отображение локации в форме
 */
function updateFormLocationDisplay() {
    const currentUserLocation = typeof getUserLocation === 'function' ? getUserLocation() : null;
    if (currentUserLocation) {
        // Избегаем дублирования если регион = город
        const locationPart = currentUserLocation.region === currentUserLocation.city 
            ? currentUserLocation.city 
            : `${currentUserLocation.region}, ${currentUserLocation.city}`;
        
        // Получаем флаг
        let flag = '📍';
        if (typeof locationData !== 'undefined' && locationData[currentUserLocation.country]) {
            flag = locationData[currentUserLocation.country].flag;
        }
        
        const locationText = `${flag} ${locationPart}`;
        const formLocationDisplay = document.getElementById('formLocationDisplay');
        if (formLocationDisplay) {
            formLocationDisplay.textContent = locationText;
        }
    }
}

/**
 * Обработка фильтра по городу
 */
function handleCityFilter(city) {
    // Сброс выбора
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Выбор нового города
    const cityBtn = document.querySelector(`[data-city="${city}"].filter`);
    if (cityBtn) {
        cityBtn.classList.add('selected');
    }

    // Загружаем анкеты по городу
    if (typeof loadAdsByLocation === 'function') {
        const currentUserLocation = typeof getUserLocation === 'function' ? getUserLocation() : null;
        if (currentUserLocation) {
            loadAdsByLocation(currentUserLocation.country, currentUserLocation.region, city);
        }
    }
}

/**
 * Загрузить анкеты по локации (страна, регион, город)
 */
function loadAdsByLocation(country, region, city) {
    try {
        console.log('🌍 Запрос анкет по локации:', {country, region, city});
        
        // Формируем фильтры для загрузки
        const filters = {};
        if (country) filters.country = country;
        if (city) filters.city = city;
        
        console.log('🔍 Итоговые фильтры для API:', filters);
        
        // Загружаем через наш API
        if (typeof loadAds === 'function') {
            loadAds(filters);
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки анкет по локации:', error);
    }
}

/**
 * Загрузить еще анкеты (пагинация)
 */
function loadMoreAds() {
    if (window.loadingAds || !window.hasMoreAds) return;
    
    console.log('🔘 Кнопка "Загрузить еще" нажата');
    window.currentAdsPage++;
    if (typeof loadAds === 'function') {
        loadAds(window.currentFilters || {}, true);
    }
}

/**
 * Настройка infinite scroll
 */
function setupInfiniteScroll() {
    let scrollTimeout;
    const handleScroll = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const documentHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            const scrolledToBottom = (windowHeight + scrollTop) >= documentHeight - 300;
            
            if (scrolledToBottom && window.hasMoreAds && !window.loadingAds) {
                console.log('📜 Auto-scroll: загружаем следующую страницу');
                window.currentAdsPage++;
                if (typeof loadAds === 'function') {
                    loadAds(window.currentFilters || {}, true);
                }
            }
        }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
}

// Инициализируем infinite scroll при загрузке
if (typeof window !== 'undefined') {
    setupInfiniteScroll();
}

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
    
    // Проверяем локацию
    const currentUserLocation = typeof getUserLocation === 'function' ? getUserLocation() : null;
    if (!currentUserLocation || !currentUserLocation.city) {
        tg.showAlert('Сначала выберите ваш город');
        if (typeof showLocationSetup === 'function') {
            showLocationSetup();
        }
        return;
    }
    
    // Сбрасываем форму
    formData = {};
    currentStep = 1;
    
    // Автоматически заполняем локацию из настроек пользователя
    formData.country = currentUserLocation.country;
    formData.region = currentUserLocation.region;
    formData.city = currentUserLocation.city;
    
    // Показываем первый шаг
    showScreen('createAd');
    updateFormStep(1);
    
    // Отображаем локацию в форме
    updateFormLocationDisplay();
    
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
    
    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.style.display = step > 1 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = step < totalSteps ? 'block' : 'none';
    if (submitBtn) submitBtn.style.display = step === totalSteps ? 'block' : 'none';
    
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
 * Показать определённый шаг формы (из backup)
 */
function showStep(step) {
    console.log(`📍 Показываем шаг ${step} из ${totalSteps}`);
    
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    const stepElement = document.getElementById(`step${step}`);
    
    if (!stepElement) {
        console.error(`❌ Элемент step${step} не найден!`);
        return;
    }
    
    stepElement.classList.add('active');
    currentStep = step;
    
    // Показываем/скрываем контейнер textarea на шаге 8
    const textareaContainer = document.getElementById('textareaContainer');
    if (textareaContainer) {
        if (step === 8) {
            textareaContainer.style.display = 'block';
        } else {
            textareaContainer.style.display = 'none';
        }
    }
    
    // Инициализируем кнопки ориентации для шага 7
    if (step === 7) {
        const orientationBtns = document.querySelectorAll('#step7 [data-orientation]');
        orientationBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function() {
                selectOrientation(this.dataset.orientation);
            });
        });
    }
    
    // Загружаем существующие фото на шаге 9
    if (step === 9 && typeof loadMyPhotosForStep9 === 'function') {
        loadMyPhotosForStep9();
    }
    
    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.style.display = step > 1 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = step < totalSteps ? 'block' : 'none';
    if (submitBtn) submitBtn.style.display = step === totalSteps ? 'block' : 'none';
}

/**
 * Сброс формы создания анкеты
 */
function resetForm() {
    formData = {};
    currentStep = 1;
    
    // Сброс всех выборов
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Очистка полей
    const customCity = document.getElementById('customCity');
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    const myAge = document.getElementById('myAge');
    const adText = document.getElementById('adText');
    
    if (customCity) customCity.value = '';
    if (ageFrom) ageFrom.value = '';
    if (ageTo) ageTo.value = '';
    if (myAge) myAge.value = '';
    if (adText) adText.value = '';
    
    showStep(1);
}

/**
 * Валидация текущего шага формы
 */
function validateCurrentStep() {
    console.log(`🔍 Валидация шага ${currentStep}`, formData);
    
    switch(currentStep) {
        case 1: // Пол
            if (!formData.gender) {
                tg.showAlert('Выберите ваш пол');
                return false;
            }
            return true;
        case 2: // Кого ищет
            if (!formData.target) {
                tg.showAlert('Выберите кого ищете');
                return false;
            }
            return true;
        case 3: // Цель
            if (!formData.goals || formData.goals.length === 0) {
                tg.showAlert('Выберите хотя бы одну цель общения');
                return false;
            }
            formData.goal = formData.goals.join(', ');
            return true;
        case 4: // Возраст партнера
            const ageFrom = document.getElementById('ageFrom')?.value;
            const ageTo = document.getElementById('ageTo')?.value;
            
            if (!ageFrom || !ageTo) {
                tg.showAlert('Укажите возраст партнера');
                return false;
            }
            
            const ageFromNum = parseInt(ageFrom);
            const ageToNum = parseInt(ageTo);
            
            if (ageFromNum < 18 || ageToNum > 99) {
                tg.showAlert('Возраст должен быть от 18 до 99 лет');
                return false;
            }
            
            if (ageFromNum > ageToNum) {
                tg.showAlert('Возраст "от" не может быть больше возраста "до"');
                return false;
            }
            
            formData.ageFrom = ageFrom;
            formData.ageTo = ageTo;
            return true;
        case 5: // Мой возраст
            const myAge = document.getElementById('myAge')?.value;
            const myAgeNum = parseInt(myAge);
            if (!myAge || isNaN(myAgeNum) || myAgeNum < 18 || myAgeNum > 99) {
                tg.showAlert('Укажите ваш возраст (18-99)');
                return false;
            }
            formData.myAge = myAge;
            return true;
        case 6: // Телосложение
            if (!formData.body) {
                tg.showAlert('Выберите телосложение');
                return false;
            }
            return true;
        case 7: // Ориентация
            if (!formData.orientation) {
                tg.showAlert('Выберите ориентацию');
                return false;
            }
            return true;
        case 8: // Текст анкеты
            const adText = document.getElementById('adText')?.value?.trim();
            if (!adText || adText.length < 10) {
                tg.showAlert(`Введите текст анкеты (минимум 10 символов)${adText ? `\\nСейчас: ${adText.length}` : ''}`);
                return false;
            }
            formData.text = adText;
            return true;
        case 9: // Фото (опционально)
            return true;
    }
    return false;
}

/**
 * Закрепить/открепить анкету
 */
async function pinMyAd(adId, shouldPin) {
    try {
        // Если закрепляем - проверяем лимит
        if (shouldPin && typeof userPremiumStatus !== 'undefined') {
            if (userPremiumStatus.limits && userPremiumStatus.limits.pin) {
                const pinLimit = userPremiumStatus.limits.pin;
                if (!pinLimit.canUse) {
                    if (userPremiumStatus.isPremium) {
                        tg.showAlert('Вы уже использовали 3 закрепления сегодня');
                    } else {
                        tg.showConfirm(
                            'Закрепление доступно раз в 3 дня для FREE.\\nОформите PRO для 3 закреплений в день!',
                            (confirmed) => {
                                if (confirmed && typeof showPremiumModal === 'function') showPremiumModal();
                            }
                        );
                    }
                    return;
                }
            }
        }
        
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        
        const pinnedUntil = shouldPin ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null;
        
        const response = await fetch('/api/ads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: adId,
                user_token: userToken,
                is_pinned: shouldPin,
                pinned_until: pinnedUntil
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        if (result.success) {
            if (shouldPin) {
                if (typeof loadPremiumStatus === 'function') await loadPremiumStatus();
                tg.showAlert('✅ Анкета закреплена на 1 час!');
            } else {
                tg.showAlert('✅ Анкета откреплена');
            }
            if (typeof loadMyAds === 'function') loadMyAds();
        }
    } catch (error) {
        console.error('Ошибка закрепления:', error);
        tg.showAlert('❌ Ошибка: ' + (error.message || 'Не удалось изменить закрепление'));
    }
}

/**
 * Перейти к следующему шагу формы
 */
function nextFormStep() {
    if (validateCurrentStep() && currentStep < totalSteps) {
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
function showBrowseAds() {
    console.log('🔍 [ADS] Открытие просмотра анкет');
    
    showScreen('browseAds');
    
    // Отображаем текущую локацию
    const browseLocationDisplay = document.getElementById('browseLocationDisplay');
    const userLoc = typeof getUserLocation === 'function' ? getUserLocation() : null;
    
    if (userLoc && browseLocationDisplay) {
        // Избегаем дублирования если регион = город
        const locationPart = userLoc.region === userLoc.city 
            ? userLoc.city 
            : `${userLoc.region}, ${userLoc.city}`;
        const locationText = locationData ? `${locationData[userLoc.country]?.flag || ''} ${locationPart}` : locationPart;
        browseLocationDisplay.textContent = locationText;
    } else if (browseLocationDisplay) {
        browseLocationDisplay.textContent = 'Локация не установлена';
    }
    
    // Загружаем анкеты по локации пользователя
    setTimeout(() => {
        if (userLoc) {
            console.log('📍 [ADS] Загружаем анкеты по локации:', userLoc);
            loadAdsByLocation(userLoc.country, userLoc.region, userLoc.city);
        } else {
            console.log('📍 [ADS] Локация не установлена, показываем все анкеты');
            loadAds();
        }
        
        // Устанавливаем UI фильтра на базе локации пользователя
        if (typeof setFilterLocationUI === 'function') {
            setFilterLocationUI();
        }
    }, 100);
}

// Глобальные переменные для пагинации
window.loadingAds = false;
window.allLoadedAds = [];
window.currentFilters = {};
window.totalAds = 0;
window.hasMoreAds = true;
window.currentAdsPage = 1;

/**
 * Загрузить анкеты с фильтрами
 */
async function loadAds(filters = {}, append = false) {
    // Предотвращаем множественные одновременные запросы
    if (window.loadingAds) {
        console.log('⚠️ [ADS] Запрос уже выполняется, пропускаем');
        return;
    }
    
    if (!append) {
        window.currentAdsPage = 1;
        window.allLoadedAds = [];
        window.hasMoreAds = true;
        window.currentFilters = filters;
    }
    
    window.loadingAds = true;
    
    try {
        console.log('📥 [ADS] Загрузка анкет:', { page: window.currentAdsPage, filters, append });
        
        // По умолчанию включаем компактный режим
        if (window.localStorage.getItem('ads_compact') === null) {
            window.localStorage.setItem('ads_compact', '1');
        }
        
        const adsList = document.getElementById('adsList');
        if (adsList && !append) {
            const compact = window.localStorage.getItem('ads_compact') === '1';
            adsList.classList.toggle('compact', compact);
            adsList.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Загружаем анкеты${compact ? ' (компактно)' : ''}...</p>
            `;
        }
        
        // Объединяем фильтры
        const finalFilters = { ...adsFilters, ...filters };
        
        // Формируем параметры запроса - 20 анкет за раз
        const params = new URLSearchParams({
            page: window.currentAdsPage.toString(),
            limit: '20'
        });
        
        // Если есть фильтр по стране/городу, добавляем
        if (finalFilters.country) {
            params.append('country', finalFilters.country);
        }
        if (finalFilters.city) {
            params.append('city', finalFilters.city);
        }
        
        const apiUrl = `/api/ads?${params.toString()}`;
        console.log('🌐 API запрос:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const ads = result.ads || [];
        const pagination = result.pagination;
        
        console.log('✅ Получено анкет:', ads.length, 'Пагинация:', pagination);
        
        if (append) {
            window.allLoadedAds.push(...ads);
        } else {
            window.allLoadedAds = ads;
        }
        
        // Сохраняем общее количество анкет
        if (pagination && pagination.total) {
            window.totalAds = pagination.total;
        }
        
        // Если пагинации нет, считаем что это все анкеты
        window.hasMoreAds = pagination ? (pagination.hasMore || false) : false;
        
        console.log('🔢 Состояние:', { 
            totalLoaded: window.allLoadedAds.length, 
            hasMore: window.hasMoreAds,
            currentPage: window.currentAdsPage
        });
        
    } catch (error) {
        console.error('❌ [ADS] Ошибка при загрузке анкет:', error);
        const adsList = document.getElementById('adsList');
        if (adsList && !append) {
            adsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">⚠️</div>
                    <h3>Ошибка загрузки</h3>
                    <p>${error.message}</p>
                    <button class="neon-button" onclick="loadAds()">🔄 Повторить</button>
                </div>
            `;
        }
    } finally {
        window.loadingAds = false;
        
        // Отображаем анкеты ПОСЛЕ сброса loadingAds
        const cityFilter = filters.city || (window.currentFilters && window.currentFilters.city);
        displayAds(window.allLoadedAds, cityFilter);
    }
}

/**
 * Отобразить анкеты в UI
 */
function displayAds(ads, city = null) {
    const adsList = document.getElementById('adsList');
    if (!adsList) return;
    
    console.log('📊 [ADS] displayAds вызвана с', ads.length, 'анкетами');
    
    if (!ads || ads.length === 0) {
        adsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">😔</div>
                <h3>Пока нет анкет</h3>
                <p>Будьте первым, кто разместит анкету!</p>
            </div>
        `;
        return;
    }

    // Нормализуем название города для фильтрации
    const normalizedFilterCity = typeof normalizeCity === 'function' ? normalizeCity(city) : city;
    
    // Фильтруем по городу если задан
    let filteredAds = normalizedFilterCity ? ads.filter(ad => {
        const normalizedAdCity = typeof normalizeCity === 'function' ? normalizeCity(ad.city) : ad.city;
        return normalizedAdCity === normalizedFilterCity;
    }) : ads;
    
    // Применяем фильтры
    filteredAds = filteredAds.filter(ad => {
        // Фильтр по полу
        if (adsFilters.gender !== 'all') {
            const genderLower = ad.gender?.toLowerCase();
            if (adsFilters.gender === 'male' && genderLower !== 'male' && genderLower !== 'мужчина') {
                return false;
            }
            if (adsFilters.gender === 'female' && genderLower !== 'female' && genderLower !== 'девушка') {
                return false;
            }
            if (adsFilters.gender === 'couple' && genderLower !== 'пара') {
                return false;
            }
        }
        
        // Фильтр по цели поиска
        if (adsFilters.target !== 'all') {
            const targetLower = ad.target?.toLowerCase();
            if (adsFilters.target === 'male' && targetLower !== 'male' && targetLower !== 'мужчину') {
                return false;
            }
            if (adsFilters.target === 'female' && targetLower !== 'female' && targetLower !== 'женщину' && targetLower !== 'девушку') {
                return false;
            }
            if (adsFilters.target === 'couple' && targetLower !== 'couple' && targetLower !== 'пару' && targetLower !== 'пара') {
                return false;
            }
        }
        
        // Фильтр по ориентации
        if (adsFilters.orientation !== 'all') {
            const orientationLower = ad.orientation?.toLowerCase();
            if (orientationLower !== adsFilters.orientation) {
                return false;
            }
        }
        
        // Фильтр по возрасту
        const age = parseInt(ad.my_age || ad.myAge);
        if (!isNaN(age)) {
            if (age < adsFilters.ageFrom || age > adsFilters.ageTo) {
                return false;
            }
        }
        
        return true;
    });
    
    // Если после фильтрации ничего не осталось
    if (filteredAds.length === 0) {
        adsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">🔍</div>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить фильтры</p>
                <button class="neon-button" onclick="resetFilters()">Сбросить фильтры</button>
            </div>
        `;
        return;
    }
    
    // Сортируем: закрепленные вверху
    const now = new Date();
    filteredAds = filteredAds.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const compact = window.localStorage.getItem('ads_compact') === '1';
    if (compact) {
        adsList.classList.add('compact');
    } else {
        adsList.classList.remove('compact');
    }

    let adsHTML = filteredAds.map((ad, index) => {
        const myAge = ad.my_age || ad.myAge || '?';
        const ageFrom = ad.age_from || ad.ageFrom || '?';
        const ageTo = ad.age_to || ad.ageTo || '?';
        const nickname = ad.display_nickname || 'Аноним';
        const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > now);
        
        // Маппинг телосложения
        const bodyLabels = {
            slim: 'Худощавое', athletic: 'Спортивное', average: 'Среднее', curvy: 'Полное',
            'Стройное': 'Стройное', 'Обычное': 'Обычное', 'Плотное': 'Плотное', 'Спортивное': 'Спортивное', 'Другое': 'Другое'
        };
        const bodyType = ad.body_type ? (bodyLabels[ad.body_type] || ad.body_type) : null;
        
        // PRO статус
        const isPremium = ad.is_premium && (!ad.premium_until || new Date(ad.premium_until) > now);
        const premiumClass = isPremium ? 'premium-ad' : '';
        const premiumBadge = isPremium ? ' <span class="pro-badge">⭐</span>' : '';
        
        // Функция получения URL фото
        const photoUrl = (url) => typeof getPhotoUrl === 'function' ? getPhotoUrl(url, 'small') : url;
        
        return `
        <div class="ad-card ${compact ? 'compact' : ''} ${premiumClass}" onclick="showAdDetails(${index})">
            ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
            ${ad.photo_urls && ad.photo_urls.length > 0 ? `
            <div class="ad-photo-thumbnails" style="display: grid; grid-template-columns: repeat(${Math.min(ad.photo_urls.length, 3)}, 1fr); gap: 4px; margin-bottom: 12px;">
                ${ad.photo_urls.slice(0, 3).map((pUrl, photoIdx) => `
                    <div style="aspect-ratio: 1; overflow: hidden; border-radius: 8px; background: linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(46, 46, 66, 0.6) 100%); position: relative;">
                        <img 
                            src="${photoUrl(pUrl)}" 
                            alt="Фото ${photoIdx + 1}" 
                            loading="lazy"
                            style="width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s ease;"
                            onload="this.style.opacity='1'"
                            onerror="this.style.opacity='0.3'; this.alt='❌'">
                    </div>
                `).join('')}
            </div>
            ` : ''}
            <div class="ad-header">
                <h3>👤 ${nickname}${premiumBadge}</h3>
                <div class="created-at"><span class="icon">⏰</span> <span class="value">${formatCreatedAt(ad.created_at)}</span></div>
            </div>
            <div class="ad-info">
                ${compact ? `
                <div class="ad-field"><span class="icon">🏙</span>${ad.city}</div>
                <div class="ad-field"><span class="icon">👤</span>${formatGender(ad.gender)}</div>
                <div class="ad-field"><span class="icon">🔍</span>${formatTarget(ad.target)}</div>
                <div class="ad-field"><span class="icon">🎯</span>${formatGoals(ad.goal)}</div>
                <div class="ad-field"><span class="icon">🎂</span>${myAge}л</div>
                <div class="ad-field"><span class="icon">📅</span>${ageFrom}-${ageTo}</div>
                ${bodyType ? `<div class="ad-field"><span class="icon">💪</span>${bodyType}</div>` : ''}
                ${ad.orientation ? `<div class="ad-field"><span class="icon">💗</span>${formatOrientation(ad.orientation)}</div>` : ''}
                ` : `
                <div class="ad-field">
                    <span class="icon">🏙</span>
                    <span class="label">Город:</span>
                    <span class="value">${ad.city}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">👤</span>
                    <span class="label">Пол:</span>
                    <span class="value">${formatGender(ad.gender)}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🔍</span>
                    <span class="label">Ищет:</span>
                    <span class="value">${formatTarget(ad.target)}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🎯</span>
                    <span class="label">Цель:</span>
                    <span class="value">${formatGoals(ad.goal)}</span>
                </div>
                <div class="ad-field">
                    <span class="icon">🎂</span>
                    <span class="label">Мой возраст:</span>
                    <span class="value">${myAge} лет</span>
                </div>
                <div class="ad-field">
                    <span class="icon">📅</span>
                    <span class="label">Возраст партнера:</span>
                    <span class="value">${ageFrom} - ${ageTo} лет</span>
                </div>
                ${bodyType ? `
                <div class="ad-field">
                    <span class="icon">💪</span>
                    <span class="label">Телосложение:</span>
                    <span class="value">${bodyType}</span>
                </div>
                ` : ''}
                ${ad.orientation ? `
                <div class="ad-field">
                    <span class="icon">💗</span>
                    <span class="label">Ориентация:</span>
                    <span class="value">${formatOrientation(ad.orientation)}</span>
                </div>
                ` : ''}
                `}
            </div>
            <div class="ad-text">"${compact ? ad.text.substring(0, 120) : ad.text.substring(0, 100)}${ad.text.length > (compact ? 120 : 100) ? '...' : ''}"</div>
        </div>
    `;
    }).join('');
    
    // Добавляем кнопку загрузки
    if (window.loadingAds) {
        adsHTML += `
            <div id="loadingMore" style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <div class="loading-spinner"></div>
                <p style="margin-top: 10px;">Загружаем еще анкеты...</p>
            </div>
        `;
    } else if (window.hasMoreAds) {
        adsHTML += `
            <div id="loadingMore" style="text-align: center; padding: 20px;">
                <button class="neon-button" onclick="loadMoreAds()" style="width: auto; padding: 12px 24px;">
                    📜 Загрузить еще (${window.allLoadedAds?.length || 0} из ${window.totalAds || '?'})
                </button>
            </div>
        `;
    } else if (!window.hasMoreAds && window.allLoadedAds?.length > 0) {
        adsHTML += `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary); opacity: 0.5;">
                <p style="margin: 0;">✅ Все анкеты загружены (${window.allLoadedAds.length})</p>
            </div>
        `;
    }
    
    adsList.innerHTML = adsHTML;
    
    // Сохраняем анкеты для showAdDetails
    window.currentAds = filteredAds;
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
 * Показать детали анкеты (из списка)
 */
function showAdDetails(index) {
    console.log('🔍 [ADS] showAdDetails вызвана с index:', index);
    console.log('🔍 [ADS] window.currentAds:', window.currentAds?.length, 'анкет');
    
    const ad = window.currentAds?.[index];
    
    if (!ad) {
        console.error('❌ [ADS] Анкета не найдена по индексу:', index);
        tg.showAlert('Анкета не найдена');
        return;
    }
    
    console.log('✅ [ADS] Анкета найдена:', ad.id, ad.display_nickname);
    
    const adContent = document.getElementById('adContent');
    if (!adContent) {
        console.error('❌ [ADS] Элемент adContent не найден!');
        return;
    }
    
    window.currentAdIndex = index;
    window.currentPhotoIndex = 0;
    window.currentAdPhotos = ad.photo_urls || [];
    
    const myAge = ad.my_age || ad.myAge || '?';
    const ageFrom = ad.age_from || ad.ageFrom || '?';
    const ageTo = ad.age_to || ad.ageTo || '?';
    
    const bodyLabels = {
        slim: 'Худощавое', athletic: 'Спортивное', average: 'Среднее', curvy: 'Полное',
        'Стройное': 'Стройное', 'Обычное': 'Обычное', 'Плотное': 'Плотное', 'Спортивное': 'Спортивное', 'Другое': 'Другое'
    };
    const bodyType = ad.body_type ? (bodyLabels[ad.body_type] || ad.body_type) : '?';
    const nickname = ad.display_nickname || 'Аноним';
    
    adContent.innerHTML = `
        <div class="ad-details-card">
            <div class="ad-details-header">
                <div class="ad-location">
                    <span class="location-icon">📍</span>
                    <span class="location-text">${ad.city}</span>
                </div>
                <div class="ad-date-badge">${new Date(ad.created_at).toLocaleDateString('ru-RU')}</div>
            </div>
            
            ${ad.photo_urls && ad.photo_urls.length > 0 ? `
            <div class="ad-details-photos">
                <div class="ad-main-photo" id="adMainPhotoContainer" style="position: relative; touch-action: pan-y; width: 100%; height: 400px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #2e2e42 100%); border-radius: 12px; overflow: hidden;">
                    <img id="adMainPhoto" 
                        src="${getPhotoUrl(ad.photo_urls[0], 'medium')}" 
                        alt="Фото анкеты" 
                        loading="eager"
                        data-full-url="${getPhotoUrl(ad.photo_urls[0], 'large')}"
                        style="width: 100%; height: 100%; object-fit: contain; cursor: pointer; opacity: 0; transition: opacity 0.3s ease;" 
                        onload="this.style.opacity='1'"
                        onerror="this.style.opacity='0.3'"
                        onclick="openPhotoFullscreen(this.dataset.fullUrl || this.src)">
                    ${ad.photo_urls.length > 1 ? `
                    <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); padding: 5px 12px; border-radius: 20px; color: white; font-size: 0.8rem;">
                        <span id="photoCounter">1 / ${ad.photo_urls.length}</span>
                    </div>
                    ` : ''}
                </div>
                ${ad.photo_urls.length > 1 ? `
                <div class="ad-photo-gallery">
                    ${ad.photo_urls.map((photoUrl, photoIndex) => `
                        <div class="ad-photo-thumbnail-small" onclick="event.stopPropagation(); switchAdPhoto(${photoIndex})" style="background: linear-gradient(135deg, #1a1a2e 0%, #2e2e42 100%);">
                            <img src="${getPhotoUrl(photoUrl, 'small')}" alt="Photo ${photoIndex + 1}" 
                                loading="lazy" style="width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s ease;"
                                onload="this.style.opacity='1'" onerror="this.style.opacity='0.3'">
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="ad-author-info">
                <div class="author-avatar">👤</div>
                <div class="author-details">
                    <div class="author-name">${nickname}</div>
                    <div class="author-params">${ad.gender}, ${myAge} лет, ${bodyType}</div>
                </div>
            </div>
            
            <div class="ad-search-info">
                <div class="search-title">🔍 Ищет:</div>
                <div class="search-params">
                    <div class="param-item"><span class="param-icon">👥</span><span>${formatTarget(ad.target)}, ${ageFrom}-${ageTo} лет</span></div>
                    <div class="param-item"><span class="param-icon">🎯</span><span>${formatGoals(ad.goal)}</span></div>
                    ${ad.orientation ? `<div class="param-item"><span class="param-icon">💗</span><span>${formatOrientation(ad.orientation)}</span></div>` : ''}
                </div>
            </div>
            
            ${ad.text ? `
            <div class="ad-description-box">
                <div class="description-title">💬 О себе:</div>
                <div class="description-text">${ad.text}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    console.log('✅ [ADS] Контент adContent заполнен, длина:', adContent.innerHTML.length);
    
    // Обновляем кнопку "Написать автору"
    const contactBtn = document.querySelector('#adDetails button.neon-button');
    if (contactBtn) {
        contactBtn.onclick = () => contactAuthor(index);
    }
    
    showScreen('adDetails');
    
    if (ad.photo_urls && ad.photo_urls.length > 1) {
        setupAdPhotoSwipe();
    }
}

/**
 * Переключение фото в анкете
 */
function switchAdPhoto(photoIndex, direction = 0) {
    if (!window.currentAdPhotos || photoIndex >= window.currentAdPhotos.length) return;
    window.currentPhotoIndex = photoIndex;
    const img = document.getElementById('adMainPhoto');
    const counter = document.getElementById('photoCounter');
    
    if (img) {
        const slideDirection = direction > 0 ? 'translateX(-100%)' : direction < 0 ? 'translateX(100%)' : 'translateX(0)';
        img.style.transition = 'transform 0.3s ease-out, opacity 0.2s ease-out';
        img.style.transform = slideDirection;
        img.style.opacity = '0';
        
        setTimeout(() => {
            img.src = getPhotoUrl(window.currentAdPhotos[photoIndex], 'medium');
            img.dataset.fullUrl = getPhotoUrl(window.currentAdPhotos[photoIndex], 'large');
            
            const enterDirection = direction > 0 ? 'translateX(100%)' : direction < 0 ? 'translateX(-100%)' : 'translateX(0)';
            img.style.transition = 'none';
            img.style.transform = enterDirection;
            
            setTimeout(() => {
                img.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                img.style.transform = 'translateX(0)';
                img.style.opacity = '1';
            }, 10);
        }, 150);
    }
    
    if (counter) counter.textContent = `${photoIndex + 1} / ${window.currentAdPhotos.length}`;
}

/**
 * Настройка свайпа для фото анкеты
 */
function setupAdPhotoSwipe() {
    const container = document.getElementById('adMainPhotoContainer');
    if (!container) return;
    
    let startX = 0;
    let isDragging = false;
    
    const handleStart = (e) => {
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        isDragging = true;
    };
    
    const handleEnd = (e) => {
        if (!isDragging) return;
        const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                const nextIndex = (window.currentPhotoIndex + 1) % window.currentAdPhotos.length;
                switchAdPhoto(nextIndex, 1);
            } else {
                const prevIndex = (window.currentPhotoIndex - 1 + window.currentAdPhotos.length) % window.currentAdPhotos.length;
                switchAdPhoto(prevIndex, -1);
            }
        }
        isDragging = false;
    };
    
    container.addEventListener('touchstart', handleStart, { passive: true });
    container.addEventListener('touchend', handleEnd, { passive: true });
    container.addEventListener('mousedown', handleStart);
    container.addEventListener('mouseup', handleEnd);
}

/**
 * Открыть фото в полноэкранном режиме
 */
function openPhotoFullscreen(photoUrl) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.95); z-index: 10000;
        display: flex; align-items: center; justify-content: center; cursor: zoom-out;
    `;
    
    const img = document.createElement('img');
    img.src = photoUrl;
    img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
    
    overlay.appendChild(img);
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

/**
 * Получить URL фото с размером
 */
function getPhotoUrl(url, size = 'medium') {
    if (!url) return '';
    // Если это наш прокси URL - возвращаем как есть
    if (url.startsWith('/api/')) return url;
    return url;
}

/**
 * Переключение компактного режима списка анкет
 */
function toggleAdsCompact() {
    const current = window.localStorage.getItem('ads_compact') === '1';
    window.localStorage.setItem('ads_compact', current ? '0' : '1');
    loadAds(adsFilters);
}

/**
 * ===== УПРАВЛЕНИЕ СОБСТВЕННЫМИ АНКЕТАМИ =====
 */

/**
 * Показать мои анкеты
 */
function showMyAds() {
    console.log('📋 [ADS] Открытие моих анкет');
    showScreen('myAds');
    loadMyAds();
}

/**
 * Загрузить мои анкеты (фильтрация по user_token как в монолите)
 */
async function loadMyAds() {
    console.log('📋 [ADS] Загрузка моих анкет');
    
    const myAdsList = document.getElementById('myAdsList');
    if (!myAdsList) {
        console.error('❌ Элемент myAdsList не найден!');
        return;
    }
    
    myAdsList.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Загрузка ваших анкет...</p>
    `;
    
    try {
        const userToken = localStorage.getItem('user_token');
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
        
        if (!userToken && !userId) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">🔐</div>
                    <h3>Требуется авторизация</h3>
                    <p>Авторизуйтесь чтобы видеть свои анкеты</p>
                </div>
            `;
            return;
        }
        
        // Получаем ВСЕ анкеты (как в монолите)
        const response = await fetch('/api/ads');
        const result = await response.json();
        const allAds = result.ads || [];
        
        console.log('📋 Всего анкет:', allAds.length);
        
        // Фильтруем по user_token (как в монолите)
        let myAds = [];
        if (userToken) {
            myAds = allAds.filter(ad => ad.user_token === userToken);
        } else if (userId) {
            myAds = allAds.filter(ad => String(ad.tg_id) === String(userId));
        }
        
        console.log('📋 Мои анкеты:', myAds.length);
        
        if (myAds.length === 0) {
            myAdsList.innerHTML = `
                <div class="no-ads">
                    <div class="neon-icon">📭</div>
                    <h3>У вас пока нет анкет</h3>
                    <p>Создайте первую анкету и она появится здесь</p>
                    <button class="neon-button primary" onclick="showCreateAd()">
                        ✏️ Создать анкету
                    </button>
                </div>
            `;
            return;
        }
        
        // Отображаем анкеты с кнопками действий
        myAdsList.innerHTML = myAds.map(ad => {
            const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > new Date());
            const ageFrom = ad.age_from || ad.ageFrom || '?';
            const ageTo = ad.age_to || ad.ageTo || '?';
            const nickname = ad.display_nickname || 'Аноним';
            
            const bodyLabels = {
                slim: 'Худощавое', athletic: 'Спортивное', average: 'Среднее', curvy: 'Полное',
                'Стройное': 'Стройное', 'Обычное': 'Обычное', 'Плотное': 'Плотное', 'Спортивное': 'Спортивное', 'Другое': 'Другое'
            };
            const bodyType = ad.body_type ? (bodyLabels[ad.body_type] || ad.body_type) : 'не указано';
            
            const authorGender = typeof formatGender === 'function' ? formatGender(ad.gender) : ad.gender;
            const genderLower = ad.gender?.toLowerCase();
            let authorIcon = '♀️';
            if (genderLower === 'male' || genderLower === 'мужчина') authorIcon = '♂️';
            else if (genderLower === 'пара') authorIcon = '👫';
            
            const targetText = typeof formatTarget === 'function' ? formatTarget(ad.target) : ad.target;
            const targetLower = ad.target?.toLowerCase();
            let targetIcon = '👤';
            if (targetLower === 'male' || targetLower === 'мужчину') targetIcon = '♂️';
            else if (targetLower === 'female' || targetLower === 'женщину' || targetLower === 'девушку') targetIcon = '♀️';
            else if (targetLower === 'couple' || targetLower === 'пару') targetIcon = '♂️♀️';
            
            const flag = (typeof locationData !== 'undefined' && locationData[ad.country]) ? locationData[ad.country].flag : '🌍';
            const cityText = ad.region === ad.city ? ad.city : `${ad.region}, ${ad.city}`;
            
            return `
            <div class="ad-card" data-ad-id="${ad.id}">
                ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
                <div class="ad-header">
                    <h3>${authorIcon} ${authorGender}, ${ad.my_age || '?'} лет</h3>
                    <div class="created-at"><span class="icon">⏰</span> ${typeof formatCreatedAt === 'function' ? formatCreatedAt(ad.created_at) : ad.created_at}</div>
                </div>
                <div class="ad-info">
                    <div class="ad-field"><span class="icon">💪</span> <strong>Телосложение:</strong> ${bodyType}</div>
                    ${ad.orientation ? `<div class="ad-field"><span class="icon">💗</span> <strong>Ориентация:</strong> ${typeof formatOrientation === 'function' ? formatOrientation(ad.orientation) : ad.orientation}</div>` : ''}
                    <div class="ad-field"><span class="icon">🎯</span> <strong>Цель:</strong> ${typeof formatGoals === 'function' ? formatGoals(ad.goal) : ad.goal}</div>
                    <div class="ad-field"><span class="icon">${targetIcon}</span> <strong>Ищу:</strong> ${targetText}, ${ageFrom}-${ageTo} лет</div>
                    <div class="ad-field"><span class="icon">📍</span> ${flag} ${cityText}</div>
                    ${ad.text ? `<div class="ad-field full-width"><span class="icon">💬</span> <strong>О себе:</strong> ${ad.text}</div>` : ''}
                </div>
                <div class="ad-actions">
                    <button class="delete-ad-btn" onclick="deleteMyAd(${ad.id})">🗑️ Удалить</button>
                    <button class="pin-ad-btn" onclick="pinMyAd(${ad.id}, ${!isPinned})">${isPinned ? '✖️ Открепить' : '📌 Закрепить (1ч)'}</button>
                </div>
            </div>
        `;
        }).join('');
        
        console.log('✅ Мои анкеты отображены');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки моих анкет:', error);
        myAdsList.innerHTML = `
            <div class="no-ads">
                <div class="neon-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>${error.message || 'Неизвестная ошибка'}</p>
                <button class="neon-button primary" onclick="loadMyAds()">🔄 Попробовать снова</button>
            </div>
        `;
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
 * Вспомогательная функция для отправки сообщения автору
 */
async function sendContactMessage(ad, authorToken, currentUserToken, message) {
    try {
        // Проверяем, существует ли уже чат
        const checkResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-existing',
                params: { user1_token: currentUserToken, user2_token: authorToken, adId: ad.id }
            })
        });

        const checkResult = await checkResponse.json();

        if (checkResult.error) {
            console.error('Error checking existing chat:', checkResult.error);
            tg.showAlert('❌ Ошибка при проверке чата. Попробуйте позже.');
            return;
        }

        const existingChat = checkResult.data;

        if (existingChat) {
            if (existingChat.blocked_by) {
                tg.showAlert('❌ Чат заблокирован');
                return;
            }
            if (existingChat.accepted) {
                tg.showAlert('✅ Чат уже существует! Откройте раздел "Мои чаты"');
                return;
            } else {
                tg.showAlert('✅ Запрос уже отправлен! Ожидайте ответа от автора.');
                return;
            }
        }

        // Создаем новый запрос на чат
        const createResponse = await fetch('/api/neon-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                params: { 
                    user1_token: currentUserToken, 
                    user2_token: authorToken, 
                    adId: ad.id,
                    message: message.trim()
                }
            })
        });

        const createResult = await createResponse.json();

        if (createResult.error) {
            console.error('Error creating chat request:', createResult.error);
            
            // Специальная обработка для лимита запросов
            if (createResult.error.message === 'LIMIT_REACHED') {
                tg.showConfirm(
                    '⚠️ Анкета перегружена запросами\n\n' +
                    'Эта анкета уже получила максимум запросов.\n\n' +
                    'Хотите получить PRO и написать автору в любом случае?',
                    (confirmed) => {
                        if (confirmed && typeof showPremiumModal === 'function') {
                            showPremiumModal();
                        }
                    }
                );
            } else {
                tg.showAlert('❌ Ошибка при создании запроса на чат: ' + createResult.error.message);
            }
            return;
        }

        if (createResult.data) {
            // Отправляем уведомление в Telegram
            try {
                await fetch('/api/send-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receiverToken: authorToken,
                        receiverTgId: ad.tg_id,
                        adId: ad.id,
                        messageText: message.trim()
                    })
                });
            } catch (notifyError) {
                console.warn('Notification failed:', notifyError);
            }

            tg.showAlert('✅ Запрос на чат отправлен!\n\nАвтор анкеты получит уведомление.');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        tg.showAlert('❌ Ошибка при отправке сообщения. Попробуйте позже.');
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
window.showStep = showStep;
window.resetForm = resetForm;
window.validateCurrentStep = validateCurrentStep;
window.pinMyAd = pinMyAd;
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
window.showAdDetails = showAdDetails;
window.switchAdPhoto = switchAdPhoto;
window.setupAdPhotoSwipe = setupAdPhotoSwipe;
window.openPhotoFullscreen = openPhotoFullscreen;
window.getPhotoUrl = getPhotoUrl;
window.toggleAdsCompact = toggleAdsCompact;
window.normalizeCity = normalizeCity;
window.updateFormLocationDisplay = updateFormLocationDisplay;
window.handleCityFilter = handleCityFilter;
window.loadAdsByLocation = loadAdsByLocation;
window.loadMoreAds = loadMoreAds;
window.setupInfiniteScroll = setupInfiniteScroll;
window.sendContactMessage = sendContactMessage;
window.showMyAds = showMyAds;
window.loadMyAds = showMyAds;
window.formatGender = formatGender;
window.formatTarget = formatTarget;
window.formatGoals = formatGoals;
window.formatOrientation = formatOrientation;
window.getAllAds = getAllAds;
window.performDeleteAd = performDeleteAd;
window.validateAgeRange = validateAgeRange;
window.validateAgeRangeWithMessage = validateAgeRangeWithMessage;

/**
 * Получить все анкеты (сортированные)
 */
async function getAllAds() {
    const response = await fetch('/api/ads', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const ads = result.ads || [];
    
    // Сортируем: сначала закрепленные, потом по дате
    const now = new Date();
    return ads.sort((a, b) => {
        const aPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
        const bPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

/**
 * Удаление анкеты
 */
async function performDeleteAd(adId) {
    try {
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
        const userToken = localStorage.getItem('user_token');

        if ((!userId || userId.startsWith('web_')) && !userToken) {
            tg.showAlert('❌ Требуется авторизация через Telegram');
            return;
        }

        const response = await fetch('/api/ads', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: adId,
                tgId: (userId && !userId.startsWith('web_')) ? userId : undefined,
                userToken: userToken || undefined
            })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message || result.error || 'Ошибка сервера');
        }

        if (result.success) {
            tg.showAlert('🗑️ Анкета удалена!');
            if (typeof loadMyAds === 'function') loadMyAds();
            if (typeof loadPremiumStatus === 'function') await loadPremiumStatus();
        } else {
            tg.showAlert('❌ Не удалось удалить анкету');
        }
    } catch (error) {
        console.error('Error deleting ad:', error);
        tg.showAlert('❌ Ошибка при удалении анкеты');
    }
}

/**
 * Валидация диапазона возраста (автокоррекция)
 */
function validateAgeRange() {
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    
    if (ageFrom && ageTo) {
        let fromValue = parseInt(ageFrom.value);
        let toValue = parseInt(ageTo.value);
        
        if (ageFrom.value && !isNaN(fromValue)) {
            if (fromValue < 18) { ageFrom.value = 18; fromValue = 18; }
            if (fromValue > 99) { ageFrom.value = 99; fromValue = 99; }
        }
        
        if (ageTo.value && !isNaN(toValue)) {
            if (toValue < 18) { ageTo.value = 18; toValue = 18; }
            if (toValue > 99) { ageTo.value = 99; toValue = 99; }
        }
        
        if (ageFrom.value && ageTo.value && !isNaN(fromValue) && !isNaN(toValue)) {
            if (fromValue > toValue) ageTo.value = fromValue;
        }
    }
}

/**
 * Валидация диапазона возраста с сообщением об ошибке
 */
function validateAgeRangeWithMessage() {
    const ageFrom = document.getElementById('ageFrom');
    const ageTo = document.getElementById('ageTo');
    
    const fromValue = parseInt(ageFrom?.value);
    const toValue = parseInt(ageTo?.value);
    
    if (!fromValue || isNaN(fromValue) || !toValue || isNaN(toValue)) {
        tg.showAlert('❌ Укажите возраст партнера');
        return false;
    }
    
    if (fromValue < 18 || fromValue > 99 || toValue < 18 || toValue > 99) {
        tg.showAlert('❌ Возраст должен быть от 18 до 99 лет');
        return false;
    }
    
    if (fromValue > toValue) {
        tg.showAlert('❌ Возраст "От" не может быть больше "До"');
        return false;
    }
    
    return true;
}

/**
 * Настройка обработчиков событий для формы создания анкеты
 */
function setupEventListeners() {
    // Инициализируем систему локации
    if (typeof initLocationSelector === 'function') {
        initLocationSelector();
    }
    
    // Кнопки выбора пола
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof selectGender === 'function') {
                selectGender(btn.dataset.gender);
            }
        });
    });

    // Кнопки выбора цели поиска
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof selectTarget === 'function') {
                selectTarget(btn.dataset.target);
            }
        });
    });

    // Кнопки выбора цели знакомства
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof selectGoal === 'function') {
                selectGoal(btn.dataset.goal);
            }
        });
    });

    // Кнопки выбора телосложения
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof selectBody === 'function') {
                selectBody(btn.dataset.body);
            }
        });
    });

    // Фильтры в просмотре анкет
    document.querySelectorAll('.city-btn.filter').forEach(btn => {
        btn.addEventListener('click', function() {
            if (typeof handleCityFilter === 'function') {
                handleCityFilter(this.dataset.city);
            }
        });
    });
    
    console.log('✅ [ADS] setupEventListeners выполнен');
}

window.setupEventListeners = setupEventListeners;

console.log('✅ [ADS] Модуль анкет инициализирован');
