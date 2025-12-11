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

// Текущая локация пользователя
let currentUserLocation = null;

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
function autoDetectLocation() {
    console.log('autoDetectLocation вызвана - запускаем автоопределение');
    autoDetectLocationAsync();
}

/**
 * Автоматическое определение локации (async версия)
 */
async function autoDetectLocationAsync() {
    try {
        console.log('🌍 Автоопределение локации...');
        
        let locationResult = null;
        
        // Пробуем ipinfo.io
        try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            if (data && data.country) {
                locationResult = {
                    country_code: data.country,
                    country_name: data.country,
                    region: data.region,
                    city: data.city,
                    source: 'ipinfo.io'
                };
                console.log('✅ Локация получена от ipinfo.io:', locationResult);
            }
        } catch (e) {
            console.log('⚠️ ipinfo.io недоступен');
        }
        
        // Если не сработало, пробуем ip-api.com
        if (!locationResult) {
            try {
                const response = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city');
                const data = await response.json();
                if (data && data.status === 'success') {
                    locationResult = {
                        country_code: data.countryCode,
                        country_name: data.country,
                        region: data.regionName,
                        city: data.city,
                        source: 'ip-api.com'
                    };
                    console.log('✅ Локация получена от ip-api.com:', locationResult);
                }
            } catch (e) {
                console.log('⚠️ ip-api.com недоступен');
            }
        }
        
        // Если не сработало, определяем по часовому поясу
        if (!locationResult) {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            locationResult = guessLocationByTimezone(timezone);
            if (locationResult) {
                locationResult.source = 'timezone';
                console.log('✅ Локация определена по часовому поясу:', locationResult);
            }
        }
        
        // Показываем экран подтверждения если удалось определить
        if (locationResult && locationResult.country_code) {
            const detectedLocation = processIPLocation(locationResult);
            if (detectedLocation) {
                // Устанавливаем выбранную локацию
                setupSelectedCountry = detectedLocation.country;
                setupSelectedRegion = detectedLocation.region;
                setupSelectedCity = detectedLocation.city;
                
                // Показываем экран подтверждения
                showDetectedLocationResult(detectedLocation);
                console.log('✅ Локация определена, показан экран подтверждения:', detectedLocation);
            }
        } else {
            console.log('⚠️ Не удалось автоматически определить локацию');
            showPopularLocations();
        }
    } catch (error) {
        console.error('❌ Ошибка автоопределения локации:', error);
        showPopularLocations();
    }
}

/**
 * Определение локации по часовому поясу
 */
function guessLocationByTimezone(timezone) {
    console.log('Определяем по часовому поясу:', timezone);
    
    const timezoneMap = {
        'Europe/Moscow': { country_code: 'RU', country_name: 'Россия', region: 'Москва', city: 'Москва' },
        'Europe/Samara': { country_code: 'RU', country_name: 'Россия', region: 'Самарская область', city: 'Самара' },
        'Asia/Yekaterinburg': { country_code: 'RU', country_name: 'Россия', region: 'Свердловская область', city: 'Екатеринбург' },
        'Asia/Novosibirsk': { country_code: 'RU', country_name: 'Россия', region: 'Новосибирская область', city: 'Новосибирск' },
        'Asia/Krasnoyarsk': { country_code: 'RU', country_name: 'Россия', region: 'Красноярский край', city: 'Красноярск' },
        'Asia/Irkutsk': { country_code: 'RU', country_name: 'Россия', region: 'Иркутская область', city: 'Иркутск' },
        'Asia/Vladivostok': { country_code: 'RU', country_name: 'Россия', region: 'Приморский край', city: 'Владивосток' },
        'Asia/Almaty': { country_code: 'KZ', country_name: 'Казахстан', region: 'Алматинская область', city: 'Алматы' },
        'Asia/Qyzylorda': { country_code: 'KZ', country_name: 'Казахстан', region: 'Кызылординская область', city: 'Кызылорда' },
        'Asia/Aqtobe': { country_code: 'KZ', country_name: 'Казахстан', region: 'Актюбинская область', city: 'Актобе' },
        'Asia/Oral': { country_code: 'KZ', country_name: 'Казахстан', region: 'Западно-Казахстанская область', city: 'Уральск' },
        'Europe/Minsk': { country_code: 'BY', country_name: 'Беларусь', region: 'Минск', city: 'Минск' },
        'Europe/Kiev': { country_code: 'UA', country_name: 'Украина', region: 'Киев', city: 'Киев' },
        'Europe/Kyiv': { country_code: 'UA', country_name: 'Украина', region: 'Киев', city: 'Киев' },
        'Asia/Bishkek': { country_code: 'KG', country_name: 'Кыргызстан', region: 'Бишкек', city: 'Бишкек' },
        'Asia/Dushanbe': { country_code: 'TJ', country_name: 'Таджикистан', region: 'Душанбе', city: 'Душанбе' },
        'Asia/Tashkent': { country_code: 'UZ', country_name: 'Узбекистан', region: 'Ташкент', city: 'Ташкент' },
        'Asia/Yerevan': { country_code: 'AM', country_name: 'Армения', region: 'Ереван', city: 'Ереван' },
        'Asia/Baku': { country_code: 'AZ', country_name: 'Азербайджан', region: 'Баку', city: 'Баку' },
        'Europe/Chisinau': { country_code: 'MD', country_name: 'Молдова', region: 'Кишинёв', city: 'Кишинёв' },
        'Asia/Tbilisi': { country_code: 'GE', country_name: 'Грузия', region: 'Тбилиси', city: 'Тбилиси' }
    };
    
    return timezoneMap[timezone] || null;
}

/**
 * Обработка данных IP геолокации
 */
function processIPLocation(data) {
    const countryCode = (data.country_code || data.country || '').toUpperCase();
    let regionName = data.region;
    let cityName = data.city;
    
    // Маппинг кодов стран на наши ключи
    const countryMap = {
        'RU': 'russia',
        'KZ': 'kazakhstan', 
        'BY': 'belarus',
        'UA': 'ukraine',
        'KG': 'kyrgyzstan',
        'TJ': 'tajikistan',
        'UZ': 'uzbekistan',
        'AM': 'armenia',
        'AZ': 'azerbaijan',
        'MD': 'moldova',
        'GE': 'georgia'
    };
    
    const mappedCountry = countryMap[countryCode];
    
    if (!mappedCountry || !locationData[mappedCountry]) {
        console.log('❌ Неподдерживаемая страна:', countryCode);
        return null;
    }
    
    const countryData = locationData[mappedCountry];
    
    // Ищем регион и город
    let foundRegion = null;
    let foundCity = null;
    
    // Ищем по названию города во всех регионах
    if (cityName) {
        for (const region in countryData.regions) {
            const cities = countryData.regions[region];
            const city = cities.find(c => 
                c.toLowerCase() === cityName.toLowerCase() ||
                c.toLowerCase().includes(cityName.toLowerCase()) ||
                cityName.toLowerCase().includes(c.toLowerCase())
            );
            
            if (city) {
                foundRegion = region;
                foundCity = city;
                break;
            }
        }
    }
    
    // Если не нашли, берём первый регион и город
    if (!foundRegion) {
        foundRegion = Object.keys(countryData.regions)[0];
        foundCity = countryData.regions[foundRegion][0];
    }
    
    return {
        country: mappedCountry,
        region: foundRegion,
        city: foundCity,
        detected: {
            country: data.country_name,
            region: regionName,
            city: cityName
        }
    };
}

/**
 * Показать результат определения локации
 */
function showDetectedLocationResult(detectedLocation) {
    const selectedDiv = document.querySelector('.setup-selected-location');
    const citySelection = document.querySelector('.setup-city-selection');
    
    if (!selectedDiv || !locationData[detectedLocation.country]) return;
    
    const countryData = locationData[detectedLocation.country];
    const flag = countryData.flag;
    
    // Скрываем выбор города
    if (citySelection) citySelection.style.display = 'none';
    
    // Формируем текст локации
    const locationText = detectedLocation.region === detectedLocation.city 
        ? detectedLocation.city 
        : `${detectedLocation.region}, ${detectedLocation.city}`;
    
    selectedDiv.innerHTML = `
        <div class="detected-location" style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 10px;">✨</div>
            <h3 style="color: var(--neon-cyan); margin-bottom: 15px;">Мы определили вашу локацию</h3>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
                <span style="font-size: 1.5rem;">${flag}</span>
                <span style="font-size: 1.1rem; color: #fff;">${locationText}</span>
            </div>
            <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 20px;">⚠️ Если неверно, выберите вручную ниже</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="neon-button primary" onclick="confirmDetectedLocation('${detectedLocation.country}', '${detectedLocation.region}', '${detectedLocation.city}')">
                    ✅ Да, всё верно
                </button>
                <button class="neon-button secondary" onclick="showManualLocationSetup()">
                    🎯 Выбрать вручную
                </button>
            </div>
        </div>
    `;
    
    selectedDiv.style.display = 'block';
}

/**
 * Показать популярные локации при неудаче автоопределения
 */
function showPopularLocations() {
    const selectedDiv = document.querySelector('.setup-selected-location');
    const citySelection = document.querySelector('.setup-city-selection');
    
    if (!selectedDiv) return;
    
    if (citySelection) citySelection.style.display = 'none';
    
    selectedDiv.innerHTML = `
        <div class="popular-locations" style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 10px;">🌍</div>
            <h3 style="color: var(--neon-cyan); margin-bottom: 15px;">Выберите ваш город</h3>
            <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 15px;">Не удалось определить автоматически</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <button class="neon-button secondary" onclick="selectPopularLocation('russia', 'Москва', 'Москва')" style="font-size: 0.9rem;">
                    🇷🇺 Москва
                </button>
                <button class="neon-button secondary" onclick="selectPopularLocation('russia', 'Санкт-Петербург', 'Санкт-Петербург')" style="font-size: 0.9rem;">
                    🇷🇺 СПб
                </button>
                <button class="neon-button secondary" onclick="selectPopularLocation('kazakhstan', 'Алматинская область', 'Алматы')" style="font-size: 0.9rem;">
                    🇰🇿 Алматы
                </button>
                <button class="neon-button secondary" onclick="selectPopularLocation('kazakhstan', 'Астана', 'Астана')" style="font-size: 0.9rem;">
                    🇰🇿 Астана
                </button>
            </div>
            
            <button class="neon-button primary" onclick="showManualLocationSetup()" style="width: 100%;">
                🎯 Выбрать другой город
            </button>
        </div>
    `;
    
    selectedDiv.style.display = 'block';
}

/**
 * Выбор популярной локации
 */
function selectPopularLocation(country, region, city) {
    console.log('Выбрана популярная локация:', {country, region, city});
    confirmDetectedLocation(country, region, city);
}

/**
 * Подтвердить определённую локацию
 */
async function confirmDetectedLocation(country, region, city) {
    console.log('📍 Подтверждение локации:', { country, region, city });
    
    setupSelectedCountry = country;
    setupSelectedRegion = region;
    setupSelectedCity = city;
    
    await saveUserLocation(country, region, city);
    updateLocationDisplay();
    
    if (typeof showMainMenu === 'function') {
        showMainMenu();
    }
}

/**
 * Показать ручной выбор локации
 */
function showManualLocationSetup() {
    const selectedDiv = document.querySelector('.setup-selected-location');
    if (selectedDiv) selectedDiv.style.display = 'none';
    
    // Сбрасываем выбор
    setupSelectedCountry = null;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    console.log('📍 Показан ручной выбор локации');
}

/**
 * Обработка отсутствия локации
 */
function handleNoLocation(hasNickname) {
    console.log('📍 Сохраненной локации нет');
    if (hasNickname) {
        console.log('Никнейм есть, но локация потерялась - запускаем автоопределение');
        showAutoLocationDetection();
    } else {
        console.log('Ждём установки никнейма, автоопределение будет после');
        if (typeof checkOnboardingStatus === 'function') {
            checkOnboardingStatus();
        }
    }
}

/**
 * Определение локации по GPS
 */
async function detectLocationByGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log('❌ GPS недоступен в этом браузере');
            resolve(null);
            return;
        }
        
        console.log('🛰️ Запрашиваем GPS координаты...');
        
        const timeoutId = setTimeout(() => {
            console.log('⏱️ GPS таймаут (15 секунд)');
            resolve(null);
        }, 15000);
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                clearTimeout(timeoutId);
                const { latitude, longitude } = position.coords;
                console.log(`📍 GPS координаты получены: ${latitude}, ${longitude}`);
                
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`,
                        {
                            headers: {
                                'User-Agent': 'Anonimka-App/1.0'
                            }
                        }
                    );
                    const data = await response.json();
                    console.log('🗺️ Геокодирование ответ:', data);
                    
                    if (data && data.address) {
                        const locationData = {
                            country_code: data.address.country_code?.toUpperCase(),
                            country_name: data.address.country,
                            region: data.address.state || data.address.region,
                            city: data.address.city || data.address.town || data.address.village,
                            source: 'gps'
                        };
                        console.log('✅ GPS локация определена:', locationData);
                        resolve(locationData);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error('❌ Ошибка геокодирования GPS:', error);
                    resolve(null);
                }
            },
            (error) => {
                clearTimeout(timeoutId);
                console.log(`❌ GPS ошибка: ${error.message}`);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 300000
            }
        );
    });
}

/**
 * Определение локации по IP
 */
async function detectLocationByIP() {
    const detectionText = document.querySelector('.detection-text');
    console.log('detectLocationByIP вызвана');
    
    if (!detectionText) {
        console.error('Элемент .detection-text не найден!');
        showPopularLocations();
        return;
    }
    
    try {
        console.log('Начинаем определение локации...');
        
        detectionText.textContent = 'Сканируем цифровой след';
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Сначала пробуем GPS
        detectionText.textContent = 'Проверяем GPS';
        let locationData = await detectLocationByGPS();
        
        if (locationData) {
            console.log('✅ Используем GPS локацию:', locationData);
        } else {
            console.log('⚠️ GPS недоступен, используем IP определение');
            
            detectionText.textContent = 'Анализируем сетевые маршруты';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            detectionText.textContent = 'Определяем геолокацию';
        }
        
        // Если GPS не сработал - используем IP
        if (!locationData) {
            // ipinfo.io
            try {
                console.log('🌐 Пробуем ipinfo.io...');
                const response1 = await fetch('https://ipinfo.io/json');
                const data1 = await response1.json();
                console.log('📍 Ответ от ipinfo.io:', data1);
                
                if (data1 && data1.country) {
                    locationData = {
                        country_code: data1.country,
                        country_name: data1.country,
                        region: data1.region,
                        city: data1.city,
                        source: 'ipinfo.io'
                    };
                }
            } catch (e) {
                console.log('❌ ipinfo.io недоступен:', e);
            }
            
            // ip-api.com
            if (!locationData) {
                try {
                    console.log('🌐 Пробуем ip-api.com...');
                    const response2 = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,timezone');
                    const data2 = await response2.json();
                    console.log('📍 Ответ от ip-api.com:', data2);
                    
                    if (data2 && data2.status === 'success') {
                        locationData = {
                            country_code: data2.countryCode,
                            country_name: data2.country,
                            region: data2.regionName,
                            city: data2.city,
                            source: 'ip-api.com'
                        };
                    }
                } catch (e) {
                    console.log('❌ ip-api.com недоступен:', e);
                }
            }
            
            // Fallback: часовой пояс
            if (!locationData) {
                try {
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    console.log('⏰ Часовой пояс:', timezone);
                    
                    locationData = guessLocationByTimezone(timezone);
                    if (locationData) {
                        locationData.source = 'timezone';
                    }
                } catch (e) {
                    console.log('❌ Определение по часовому поясу не сработало:', e);
                }
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (locationData && locationData.country_code) {
            detectionText.textContent = 'Сопоставляем с базой данных';
            await new Promise(resolve => setTimeout(resolve, 600));
            
            detectionText.textContent = 'Почти готово';
            await new Promise(resolve => setTimeout(resolve, 400));
            
            const detectedLocation = processIPLocation(locationData);
            if (detectedLocation) {
                showDetectedLocationResult(detectedLocation);
                return;
            }
        }
        
        showPopularLocations();
        
    } catch (error) {
        console.error('Ошибка определения локации по IP:', error);
        showPopularLocations();
    }
}

/**
 * Отобразить текущую локацию пользователя
 */
function displayUserLocation() {
    const location = getUserLocation();
    if (location && location.city) {
        console.log('📍 Текущая локация:', location.country, location.region, location.city);
        updateLocationDisplay();
    } else {
        console.log('📍 Локация не установлена');
    }
}

/**
 * Сбросить и переопределить локацию
 */
function resetAndDetectLocation() {
    console.log('🔄 Сброс и переопределение локации...');
    
    // Сбрасываем сохраненную локацию
    localStorage.removeItem('user_location');
    
    if (typeof currentUserLocation !== 'undefined') {
        currentUserLocation = null;
    }
    
    // Запускаем автоопределение
    autoDetectLocation();
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
 * Сброс выбора локации для фильтра
 */
function resetFilterLocationSelection() {
    filterSelectedCountry = null;
    filterSelectedRegion = null;
    filterSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.filter-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода
    const regionInput = document.querySelector('.filter-region-input');
    const cityInput = document.querySelector('.filter-city-input');
    if (regionInput) regionInput.value = '';
    if (cityInput) cityInput.value = '';
    
    // Скрываем все секции кроме выбора страны
    const regionSection = document.querySelector('.filter-region-selection');
    const citySection = document.querySelector('.filter-city-selection');
    const selectedLocation = document.querySelector('.filter-selected-location');
    
    if (regionSection) regionSection.style.display = 'none';
    if (citySection) citySection.style.display = 'none';
    if (selectedLocation) selectedLocation.style.display = 'none';
    
    hideAllSuggestions();
    
    // Загружаем все анкеты
    if (typeof loadAds === 'function') {
        loadAds();
    }
    
    console.log('📍 [LOCATION] Выбор локации фильтра сброшен');
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

/**
 * ===== ФУНКЦИИ ДЛЯ НАСТРОЙКИ ЛОКАЦИИ (SETUP) =====
 */

/**
 * Выбор страны в настройке
 */
function selectSetupCountry(countryCode) {
    setupSelectedCountry = countryCode;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Обновляем кнопки
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-country="${countryCode}"].setup-country`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Пропускаем выбор региона, сразу показываем города
    // Собираем все города из всех регионов страны
    const allCities = [];
    if (locationData && locationData[countryCode] && locationData[countryCode].regions) {
        const regions = locationData[countryCode].regions;
        Object.keys(regions).forEach(regionName => {
            allCities.push(...regions[regionName]);
        });
    }
    
    // Показываем выбор города с анимацией
    const citySection = document.querySelector('.setup-city-selection');
    if (citySection) {
        citySection.style.display = 'block';
        setTimeout(() => {
            citySection.style.opacity = '1';
        }, 50);
    }
    
    // Скрываем остальные секции
    const selectedLocation = document.querySelector('.setup-selected-location');
    if (selectedLocation) {
        selectedLocation.style.display = 'none';
    }
    
    // Очищаем поле города
    const cityInput = document.querySelector('.setup-city-input');
    if (cityInput) cityInput.value = '';
    
    // Сохраняем список всех городов для фильтрации
    window.setupAllCities = allCities;
    
    console.log('📍 [LOCATION] Выбрана страна для настройки:', locationData[countryCode]?.name);
    console.log('📍 [LOCATION] Доступно городов:', allCities.length);
    
    // Показываем все доступные города
    setTimeout(() => {
        showAllSetupCities();
    }, 100);
}

/**
 * Сброс настройки локации
 */
function resetSetupLocation() {
    setupSelectedCountry = null;
    setupSelectedRegion = null;
    setupSelectedCity = null;
    
    // Сбрасываем кнопки стран
    document.querySelectorAll('.setup-country').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Очищаем поля ввода (с проверкой на существование)
    const cityInput = document.querySelector('.setup-city-input');
    if (cityInput) cityInput.value = '';
    
    // Скрываем все секции кроме выбора страны (с проверкой на существование)
    const citySection = document.querySelector('.setup-city-selection');
    const selectedLocation = document.querySelector('.setup-selected-location');
    
    if (citySection) citySection.style.display = 'none';
    if (selectedLocation) selectedLocation.style.display = 'none';
    
    hideAllSuggestions();
    
    console.log('📍 [LOCATION] Настройка локации сброшена');
}

/**
 * Обработка ввода города в настройке
 */
function handleSetupCityInput(value) {
    console.log('📍 [LOCATION] handleSetupCityInput вызвана:', value);
    console.log('📍 [LOCATION] setupSelectedCountry:', setupSelectedCountry);
    
    if (!setupSelectedCountry) {
        console.log('📍 [LOCATION] Страна не выбрана, выходим');
        return;
    }
    
    if (!value.trim()) {
        console.log('📍 [LOCATION] Пустое значение, скрываем предложения');
        hideAllSuggestions();
        return;
    }
    
    // Получаем все города для выбранной страны
    const allCities = getAllCitiesForCountry(setupSelectedCountry);
    console.log('📍 [LOCATION] Всего городов:', allCities.length);
    
    const filtered = allCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
    );
    console.log('📍 [LOCATION] Отфильтрованных:', filtered.length);
    
    showSetupCitySuggestions(filtered);
}

/**
 * Показать все города для настройки
 */
function showAllSetupCities() {
    console.log('📍 [LOCATION] showAllSetupCities вызвана');
    console.log('📍 [LOCATION] setupSelectedCountry:', setupSelectedCountry);
    
    if (!setupSelectedCountry) {
        console.log('📍 [LOCATION] Страна не выбрана, не показываем города');
        return;
    }
    
    const cities = getAllCitiesForCountry(setupSelectedCountry);
    console.log('📍 [LOCATION] Всего городов:', cities.length);
    
    showSetupCitySuggestions(cities.slice(0, 50)); // Показываем первые 50
}

/**
 * Получить все города для страны
 */
function getAllCitiesForCountry(countryCode) {
    if (!locationData || !locationData[countryCode]) {
        console.warn('📍 [LOCATION] Данные для страны не найдены:', countryCode);
        return [];
    }
    
    const regions = locationData[countryCode].regions;
    let allCities = [];
    
    for (const regionName in regions) {
        allCities = allCities.concat(regions[regionName]);
    }
    
    return allCities;
}

/**
 * Показать предложения городов в настройке
 */
function showSetupCitySuggestions(cities) {
    const container = document.querySelector('.setup-city-suggestions');
    
    console.log('📍 [LOCATION] showSetupCitySuggestions:', cities.length, 'городов');
    console.log('📍 [LOCATION] Контейнер найден:', !!container);
    
    if (!container) {
        console.error('📍 [LOCATION] Контейнер .setup-city-suggestions не найден!');
        return;
    }
    
    if (cities.length === 0) {
        container.style.display = 'none';
        container.classList.remove('active');
        return;
    }
    
    container.innerHTML = cities.map(city => `
        <div class="suggestion-item" onclick="selectSetupCity('${city.replace(/'/g, "\\'")}')">
            ${city}
        </div>
    `).join('');
    
    container.style.display = 'block';
    container.classList.add('active');
    
    console.log('📍 [LOCATION] Список городов отображен');
}

/**
 * Выбор города в настройке
 */
function selectSetupCity(cityName) {
    console.log('📍 [LOCATION] selectSetupCity:', cityName);
    
    setupSelectedCity = cityName;
    
    // Находим регион для этого города
    if (locationData && locationData[setupSelectedCountry]) {
        const regions = locationData[setupSelectedCountry].regions;
        for (const regionName in regions) {
            if (regions[regionName].includes(cityName)) {
                setupSelectedRegion = regionName;
                break;
            }
        }
    }
    
    // Устанавливаем значение в поле ввода
    const cityInput = document.querySelector('.setup-city-input');
    if (cityInput) {
        cityInput.value = cityName;
    }
    
    hideAllSuggestions();
    
    // Показываем выбранную локацию и кнопку сохранения
    showSetupSelectedLocation();
    
    console.log('📍 [LOCATION] Выбран город:', cityName, 'Регион:', setupSelectedRegion);
}

/**
 * Показать выбранную локацию в настройке
 */
function showSetupSelectedLocation() {
    const selectedDiv = document.querySelector('.setup-selected-location');
    
    if (selectedDiv && setupSelectedCountry && setupSelectedCity && locationData) {
        const countryData = locationData[setupSelectedCountry];
        const flag = countryData?.flag || '🌍';
        const countryName = countryData?.name || setupSelectedCountry;
        
        selectedDiv.innerHTML = `
            <div class="selected-location-info">
                <span class="location-flag">${flag}</span>
                <span class="location-text">${countryName}, ${setupSelectedRegion || ''}, ${setupSelectedCity}</span>
            </div>
            <button class="neon-button primary" onclick="saveSetupLocation()">
                ✓ Сохранить
            </button>
        `;
        selectedDiv.style.display = 'block';
    }
}

/**
 * Сохранить локацию из настройки
 */
async function saveSetupLocation() {
    if (!setupSelectedCountry || !setupSelectedCity) {
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert('Пожалуйста, выберите страну и город');
        } else {
            alert('Пожалуйста, выберите страну и город');
        }
        return;
    }
    
    console.log('📍 [LOCATION] Сохранение локации из настройки:', {
        country: setupSelectedCountry,
        region: setupSelectedRegion,
        city: setupSelectedCity
    });
    
    await saveUserLocation(setupSelectedCountry, setupSelectedRegion || '', setupSelectedCity);
    
    // Обновляем отображение локации в шапке
    updateLocationDisplay();
    
    // Переходим на главный экран
    if (typeof showMainMenu === 'function') {
        showMainMenu();
    }
}

/**
 * Обновить отображение локации в UI
 */
function updateLocationDisplay() {
    const locationDisplay = document.getElementById('userLocationDisplay');
    if (locationDisplay && currentUserLocation) {
        const flag = locationData?.[currentUserLocation.country]?.flag || '📍';
        locationDisplay.textContent = `${flag} ${currentUserLocation.city || 'Не указан'}`;
    }
}

/**
 * Инициализация обработчиков для поля ввода города
 */
function initSetupCityInputHandlers() {
    const setupCityInput = document.querySelector('.setup-city-input');
    
    console.log('📍 [LOCATION] Инициализация обработчиков для setup-city-input');
    console.log('📍 [LOCATION] setupCityInput найден:', !!setupCityInput);
    
    if (setupCityInput) {
        setupCityInput.addEventListener('input', function() {
            console.log('📍 [LOCATION] input событие:', this.value);
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('keyup', function() {
            handleSetupCityInput(this.value);
        });
        
        setupCityInput.addEventListener('focus', function() {
            console.log('📍 [LOCATION] focus событие на город');
            if (setupSelectedCountry) {
                setTimeout(() => showAllSetupCities(), 50);
            }
        });
        
        setupCityInput.addEventListener('click', function(e) {
            e.stopPropagation();
            if (setupSelectedCountry) {
                setTimeout(() => showAllSetupCities(), 50);
            }
        });
        
        console.log('✅ [LOCATION] Обработчики для setup-city-input установлены');
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
            
            // Инициализируем обработчики для поля ввода города (если ещё не были)
            initSetupCityInputHandlers();
            
            // Фокус на поле ввода города
            const cityInput = document.querySelector('.setup-city-input');
            if (cityInput) {
                setTimeout(() => {
                    cityInput.focus();
                    // Показываем все города сразу
                    showAllSetupCities();
                }, 100);
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
    
    // Скрытие списков при клике вне них
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container') && 
            !e.target.classList.contains('setup-city-input') &&
            !e.target.classList.contains('suggestion-item')) {
            hideAllSuggestions();
        }
    });
    
    // Инициализируем обработчики для поля города
    initSetupCityInputHandlers();
    
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
window.handleSetupCityInput = handleSetupCityInput;
window.showSetupCitySuggestions = showSetupCitySuggestions;
window.selectSetupCity = selectSetupCity;
window.showAllSetupCities = showAllSetupCities;
window.selectSetupCountry = selectSetupCountry;
window.resetSetupLocation = resetSetupLocation;
window.saveSetupLocation = saveSetupLocation;
window.autoDetectLocation = autoDetectLocation;
window.autoDetectLocationAsync = autoDetectLocationAsync;
window.guessLocationByTimezone = guessLocationByTimezone;
window.processIPLocation = processIPLocation;
window.showDetectedLocationResult = showDetectedLocationResult;
window.showPopularLocations = showPopularLocations;
window.selectPopularLocation = selectPopularLocation;
window.confirmDetectedLocation = confirmDetectedLocation;
window.updateLocationDisplay = updateLocationDisplay;
window.showAutoLocationDetection = showAutoLocationDetection;
window.showManualLocationSetup = showManualLocationSetup;
window.resetFilterLocationSelection = resetFilterLocationSelection;
window.handleNoLocation = handleNoLocation;
window.detectLocationByGPS = detectLocationByGPS;
window.detectLocationByIP = detectLocationByIP;
window.displayUserLocation = displayUserLocation;
window.resetAndDetectLocation = resetAndDetectLocation;

// Инициализация при загрузке модуля
(function initLocationOnLoad() {
    // Загружаем сохранённую локацию из localStorage
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
        try {
            currentUserLocation = JSON.parse(savedLocation);
            console.log('📍 [LOCATION] Загружена сохранённая локация:', currentUserLocation);
        } catch (e) {
            console.warn('⚠️ [LOCATION] Ошибка загрузки сохранённой локации');
        }
    }
    
    // Обновляем отображение после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateLocationDisplay);
    } else {
        setTimeout(updateLocationDisplay, 100);
    }
})();

console.log('✅ [LOCATION] Модуль локации инициализирован');
