/**
 * Модуль локации пользователя (location.js)
 * 
 * Функции:
 * - Автоматическое определение локации (GPS, IP, часовой пояс)
 * - Выбор локации пользователем
 * - Сохранение и загрузка локации
 * - UI для работы с локацией
 */

console.log('📍 [LOCATION] Инициализация модуля локации');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ВЫБОРА ЛОКАЦИИ
 */

// Переменные для основной формы создания анкеты
let selectedCountry = null;
let selectedRegion = null;
let selectedCity = null;

// Переменные для фильтра в поиске анкет
let filterSelectedCountry = null;
let filterSelectedRegion = null;
let filterSelectedCity = null;

// Переменные для настройки локации в профиле
let setupSelectedCountry = null;
let setupSelectedRegion = null;
let setupSelectedCity = null;

/**
 * ОСНОВНЫЕ ФУНКЦИИ ЛОКАЦИИ
 */

/**
 * Получить локацию текущего пользователя
 */
function getUserLocation() {
    // Сначала проверяем память
    if (currentUserLocation) {
        return currentUserLocation;
    }
    
    // Затем проверяем localStorage
    const saved = localStorage.getItem('userLocation');
    if (saved) {
        try {
            const location = JSON.parse(saved);
            currentUserLocation = location;
            return location;
        } catch (e) {
            console.warn('⚠️ [LOCATION] Ошибка парсинга сохранённой локации:', e);
        }
    }
    
    // Если ничего не нашли
    return null;
}

/**
 * Сохранить локацию пользователя
 */
async function saveUserLocation(country, region, city) {
    try {
        console.log('📍 [LOCATION] Сохранение локации:', { country, region, city });
        
        // Формируем объект локации
        currentUserLocation = { country, region, city };
        
        // Сохраняем в localStorage
        localStorage.setItem('userLocation', JSON.stringify(currentUserLocation));
        
        // Пытаемся сохранить на сервер через Telegram CloudStorage
        if (tg?.CloudStorage) {
            try {
                await new Promise((resolve, reject) => {
                    tg.CloudStorage.setItem('userLocation', JSON.stringify(currentUserLocation), (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log('✅ [LOCATION] Локация сохранена в CloudStorage');
            } catch (e) {
                console.warn('⚠️ [LOCATION] CloudStorage недоступен, только localStorage:', e);
            }
        }
        
        console.log('✅ [LOCATION] Локация сохранена');
        return true;
        
    } catch (error) {
        console.error('❌ [LOCATION] Ошибка сохранения локации:', error);
        return false;
    }
}

/**
 * Автоматическое определение локации пользователя
 */
async function autoDetectLocation() {
    try {
        console.log('🌍 [LOCATION] Начало автоопределения локации');
        
        // Сначала проверяем GPS
        if (navigator.geolocation) {
            console.log('📡 [LOCATION] Попытка получить GPS...');
            
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        enableHighAccuracy: false
                    });
                });
                
                console.log('✅ [LOCATION] GPS получен:', {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                
                // Используем GPS координаты для определения города через обратное геокодирование
                // (если есть API для этого на сервере)
                return;
            } catch (e) {
                console.warn('⚠️ [LOCATION] GPS недоступен:', e.message);
            }
        }
        
        // Fallback: определяем по IP
        console.log('🌐 [LOCATION] Определение по IP...');
        
        try {
            const response = await fetch('/api/detect-location');
            const data = await response.json();
            
            if (data.error) {
                console.warn('⚠️ [LOCATION] Ошибка определения по IP:', data.error);
                return;
            }
            
            const { country, region, city, timezone } = data.data || {};
            
            if (country) {
                console.log('✅ [LOCATION] Локация определена по IP:', { country, region, city });
                
                // Сохраняем определённую локацию
                await saveUserLocation(country, region || '', city || '');
                return true;
            }
        } catch (e) {
            console.error('❌ [LOCATION] Ошибка определения по IP:', e);
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ [LOCATION] Критическая ошибка автоопределения локации:', error);
        return false;
    }
}

/**
 * Показать UI для проверки/выбора локации
 */
function showAutoLocationDetection() {
    const modal = document.getElementById('autoLocationModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('📍 [LOCATION] Показано окно проверки локации');
    }
}

function closeAutoLocationDetection() {
    const modal = document.getElementById('autoLocationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Проверить и установить локацию при загрузке
 */
async function checkUserLocation() {
    try {
        console.log('🔍 [LOCATION] Проверка локации пользователя');
        
        const userLocation = getUserLocation();
        
        if (userLocation && userLocation.country && userLocation.city) {
            console.log('✅ [LOCATION] Локация уже установлена:', userLocation);
            return true;
        }
        
        // Если локации нет, пытаемся определить автоматически
        console.log('⚠️ [LOCATION] Локация не найдена, автоопределение...');
        
        const detected = await autoDetectLocation();
        
        if (detected) {
            console.log('✅ [LOCATION] Локация автоопределена');
        } else {
            console.log('⚠️ [LOCATION] Не удалось автоопределить локацию, показываем окно выбора');
            showAutoLocationDetection();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [LOCATION] Ошибка проверки локации:', error);
        return false;
    }
}

/**
 * ===== ФУНКЦИИ ВЫБОРА ЛОКАЦИИ =====
 */

/**
 * Выбор страны (основная форма создания анкеты)
 */
function selectCountry(countryCode) {
    selectedCountry = countryCode;
    selectedRegion = null;
    selectedCity = null;
    
    // Обновляем активные кнопки стран
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-country="${countryCode}"]`)?.classList.add('active');
    
    // Показываем выбор региона
    const regionSection = document.querySelector('.region-selection');
    if (regionSection) {
        regionSection.style.display = 'block';
        setTimeout(() => {
            regionSection.style.opacity = '1';
        }, 50);
    }
    
    console.log('📍 [LOCATION] Выбрана страна:', countryCode);
}

/**
 * Обработка ввода региона
 */
function handleRegionInput(value) {
    if (!selectedCountry || !locationData) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const regions = Object.keys(locationData[selectedCountry]?.regions || {});
    const filtered = regions.filter(region => 
        region.toLowerCase().startsWith(value.toLowerCase())
    );
    
    showRegionSuggestions(filtered);
}

/**
 * Показать все регионы
 */
function showAllRegions() {
    if (!selectedCountry || !locationData) return;
    
    const regions = Object.keys(locationData[selectedCountry]?.regions || {});
    showRegionSuggestions(regions);
}

/**
 * Показать предложения регионов
 */
function showRegionSuggestions(regions) {
    const container = document.querySelector('.region-suggestions');
    if (!container) return;
    
    if (regions.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = regions.map(region => `
        <div class="suggestion-item" onclick="selectRegion('${region}')">
            ${region}
        </div>
    `).join('');
    
    container.classList.add('active');
}

/**
 * Выбор региона
 */
function selectRegion(regionName) {
    selectedRegion = regionName;
    selectedCity = null;
    
    document.querySelector('.region-input')?.value !== undefined && 
        (document.querySelector('.region-input').value = regionName);
    
    hideAllSuggestions();
    
    // Показываем выбор города
    const citySection = document.querySelector('.city-selection');
    if (citySection) {
        citySection.style.display = 'block';
        setTimeout(() => {
            citySection.style.opacity = '1';
        }, 50);
    }
    
    console.log('📍 [LOCATION] Выбран регион:', regionName);
}

/**
 * Обработка ввода города
 */
function handleCityInput(value) {
    if (!selectedCountry || !selectedRegion || !locationData) return;
    
    if (!value.trim()) {
        hideAllSuggestions();
        return;
    }
    
    const cities = locationData[selectedCountry]?.regions?.[selectedRegion] || [];
    const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
    );
    
    showCitySuggestions(filtered);
}

/**
 * Показать все города
 */
function showAllCities() {
    if (!selectedCountry || !selectedRegion || !locationData) return;
    
    const cities = locationData[selectedCountry]?.regions?.[selectedRegion] || [];
    showCitySuggestions(cities);
}

/**
 * Показать предложения городов
 */
function showCitySuggestions(cities) {
    const container = document.querySelector('.city-suggestions');
    if (!container) return;
    
    if (cities.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectCity('${city}')">
            ${city}
        </div>
    `).join('');
    
    container.classList.add('active');
}

/**
 * Выбор города
 */
function selectCity(cityName) {
    selectedCity = cityName;
    
    document.querySelector('.city-input')?.value !== undefined && 
        (document.querySelector('.city-input').value = cityName);
    
    hideAllSuggestions();
    
    // Показываем выбранную локацию
    showSelectedLocation();
    
    console.log('📍 [LOCATION] Выбран город:', cityName, 'Полная локация:', {
        country: selectedCountry,
        region: selectedRegion,
        city: selectedCity
    });
}

/**
 * Показать выбранную локацию
 */
function showSelectedLocation() {
    const selectedDiv = document.querySelector('.selected-location');
    const locText = document.querySelector('.location-text');
    
    if (selectedDiv && locText && selectedCountry && selectedCity && locationData) {
        const countryFlag = locationData[selectedCountry]?.flag || '🌍';
        const fullLocation = `${countryFlag} ${selectedRegion || ''}, ${selectedCity}`;
        locText.textContent = fullLocation;
        
        selectedDiv.style.display = 'block';
        setTimeout(() => {
            selectedDiv.style.opacity = '1';
        }, 50);
    }
}

/**
 * Сброс выбора локации
 */
function resetLocationSelection() {
    selectedCountry = null;
    selectedRegion = null;
    selectedCity = null;
    
    // Сбрасываем UI
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.region-input, .city-input').forEach(input => {
        input.value = '';
    });
    
    document.querySelectorAll('.region-selection, .city-selection, .selected-location')
        .forEach(el => el.style.display = 'none');
    
    hideAllSuggestions();
    
    console.log('📍 [LOCATION] Выбор локации сброшен');
}

/**
 * Скрыть все подсказки
 */
function hideAllSuggestions() {
    document.querySelectorAll('.region-suggestions, .city-suggestions, .filter-region-suggestions, .filter-city-suggestions, .setup-region-suggestions, .setup-city-suggestions')
        .forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
        });
}

/**
 * Скрыть другие списки подсказок
 */
function hideOtherSuggestions(currentContainerId) {
    document.querySelectorAll('.region-suggestions, .city-suggestions, .filter-region-suggestions, .filter-city-suggestions, .setup-region-suggestions, .setup-city-suggestions')
        .forEach(el => {
            if (el.className !== currentContainerId) {
                el.style.display = 'none';
                el.classList.remove('active');
            }
        });
}

/**
 * Показать экран выбора локации (ручной или авто)
 */
function showLocationChoiceScreen() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const locationChoiceScreen = document.getElementById('locationChoiceScreen');
    if (locationChoiceScreen) {
        locationChoiceScreen.classList.add('active');
        locationChoiceScreen.style.display = 'flex';
    }
    
    // Закрываем бургер-меню если открыто
    if (typeof closeBurgerMenu === 'function') {
        closeBurgerMenu();
    }
}

/**
 * Показать настройку локации (ручной ввод)
 */
function showManualLocationSetup() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const manualLocationScreen = document.getElementById('manualLocationScreen');
    if (manualLocationScreen) {
        manualLocationScreen.classList.add('active');
        manualLocationScreen.style.display = 'flex';
    }
}

/**
 * Показать настройку локации (общий экран)
 */
function showLocationSetup() {
    showLocationChoiceScreen();
}

/**
 * Сохранить локацию и продолжить
 */
function saveLocationAndContinue() {
    if (!selectedCountry || !selectedCity) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Пожалуйста, выберите страну и город');
        } else {
            alert('Пожалуйста, выберите страну и город');
        }
        return;
    }
    
    // Сохраняем локацию
    const locationData = {
        country: selectedCountry,
        region: selectedRegion || '',
        city: selectedCity,
        timestamp: Date.now()
    };
    
    localStorage.setItem('userLocation', JSON.stringify(locationData));
    console.log('📍 [LOCATION] Локация сохранена:', locationData);
    
    // Переходим на главный экран
    if (typeof showMainMenu === 'function') {
        showMainMenu();
    }
}

// Инициализация обработчиков кликов для кнопок стран
function initLocationHandlers() {
    console.log('📍 [LOCATION] Инициализация обработчиков кнопок стран');
    
    // Обработчики для кнопок выбора страны (setup-country)
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.addEventListener('click', function() {
            const country = this.dataset.country;
            console.log('📍 [LOCATION] Клик по стране:', country);
            
            // Убираем active с других кнопок
            document.querySelectorAll('.setup-country').forEach(b => b.classList.remove('active'));
            // Добавляем active на текущую
            this.classList.add('active');
            
            // Сохраняем выбор
            setupSelectedCountry = country;
            selectedCountry = country;
            
            // Показываем выбор города (не региона!)
            const citySection = document.querySelector('.setup-city-selection');
            if (citySection) {
                citySection.style.display = 'block';
                console.log('📍 [LOCATION] Показана секция выбора города');
            } else {
                console.warn('⚠️ [LOCATION] Секция .setup-city-selection не найдена');
            }
            
            // Фокус на поле ввода города
            const cityInput = document.querySelector('.setup-city-input');
            if (cityInput) {
                setTimeout(() => cityInput.focus(), 100);
            }
        });
    });
    
    // Обработчики для кнопок в форме создания анкеты
    document.querySelectorAll('.form-country').forEach(btn => {
        btn.addEventListener('click', function() {
            const country = this.dataset.country;
            console.log('📍 [LOCATION] Клик по стране (форма):', country);
            
            document.querySelectorAll('.form-country').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            selectedCountry = country;
            
            const regionSection = document.querySelector('.region-selection');
            if (regionSection) {
                regionSection.style.display = 'block';
            }
            
            if (typeof loadRegionsForCountry === 'function') {
                loadRegionsForCountry(country, 'form');
            }
        });
    });
    
    // Обработчики для кнопок в фильтре
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.addEventListener('click', function() {
            const country = this.dataset.country;
            console.log('📍 [LOCATION] Клик по стране (фильтр):', country);
            
            document.querySelectorAll('.filter-country').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            filterSelectedCountry = country;
            
            const regionSection = document.querySelector('.filter-region-selection');
            if (regionSection) {
                regionSection.style.display = 'block';
            }
            
            if (typeof loadRegionsForCountry === 'function') {
                loadRegionsForCountry(country, 'filter');
            }
        });
    });
    
    console.log('✅ [LOCATION] Обработчики кнопок стран инициализированы');
}

// Запускаем инициализацию при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocationHandlers);
} else {
    initLocationHandlers();
}

// Экспортируем функции в глобальную область
window.initLocationHandlers = initLocationHandlers;
window.selectCountry = selectCountry;
window.selectRegion = selectRegion;
window.selectCity = selectCity;
window.saveUserLocation = saveUserLocation;
window.getUserLocation = getUserLocation;
window.showLocationSetup = showLocationSetup;
window.showLocationChoiceScreen = showLocationChoiceScreen;
window.saveLocationAndContinue = saveLocationAndContinue;

console.log('✅ [LOCATION] Модуль локации инициализирован');
