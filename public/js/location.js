// Геолокация пользователя
let currentUserLocation = null;

// Получить локацию пользователя из localStorage
function getUserLocation() {
    const locationStr = localStorage.getItem('userLocation');
    console.log('📍 localStorage.userLocation:', locationStr);
    if (locationStr === 'null' || locationStr === 'undefined') {
        console.warn('⚠️ userLocation содержит строку null/undefined, очищаем');
        localStorage.removeItem('userLocation');
        return null;
    }
    if (locationStr) {
        try {
            const parsed = JSON.parse(locationStr);
            console.log('📍 Parsed location:', parsed);
            if (!parsed || typeof parsed !== 'object') return null;
            const normalized = {
                country: parsed.country || null,
                region: parsed.region || null,
                city: parsed.city || null,
                timestamp: parsed.timestamp || Date.now()
            };
            return normalized;
        } catch (e) {
            console.error('Ошибка парсинга userLocation:', e);
            localStorage.removeItem('userLocation');
            return null;
        }
    }
    console.log('⚠️ userLocation не найден в localStorage');
    return null;
}

// Определение локации по GPS
async function detectLocationByGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log('❌ GPS недоступен в этом браузере');
            resolve(null);
            return;
        }

        console.log('🛰️ Запрашиваем GPS координаты...');

        // Увеличиваем таймаут до 15 секунд для первого определения GPS
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
                    // Обратное геокодирование через Nominatim API
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
                timeout: 15000, // Увеличиваем до 15 секунд
                maximumAge: 300000 // Кешируем на 5 минут
            }
        );
    });
}

// Определение локации по IP через несколько API
async function detectLocationByIP() {
    console.log('🌐 Запуск определения локации по IP...');

    try {
        // Сначала пробуем GPS
        console.log('🛰️ Пробуем GPS...');
        let locationData = await detectLocationByGPS();

        if (locationData) {
            console.log('✅ Используем GPS локацию:', locationData);
            return {
                country: locationData.country_name,
                region: locationData.region,
                city: locationData.city
            };
        }

        // Если GPS не сработал, используем IP
        console.log('⚠️ GPS недоступен, используем IP определение');

        // Пробуем ipapi.co
        try {
            console.log('📡 Пробуем ipapi.co...');
            const response = await fetch('https://ipapi.co/json/', {
                headers: { 'User-Agent': 'Anonimka-App/1.0' }
            });
            const data = await response.json();
            
            if (data && data.city) {
                console.log('✅ ipapi.co ответ:', data);
                return {
                    country: data.country_name,
                    region: data.region,
                    city: data.city
                };
            }
        } catch (error) {
            console.error('❌ ipapi.co ошибка:', error);
        }

        // Пробуем ip-api.com
        try {
            console.log('📡 Пробуем ip-api.com...');
            const response = await fetch('http://ip-api.com/json/?lang=ru', {
                headers: { 'User-Agent': 'Anonimka-App/1.0' }
            });
            const data = await response.json();
            
            if (data && data.status === 'success') {
                console.log('✅ ip-api.com ответ:', data);
                return {
                    country: data.country,
                    region: data.regionName,
                    city: data.city
                };
            }
        } catch (error) {
            console.error('❌ ip-api.com ошибка:', error);
        }

        // Если ничего не сработало
        console.warn('⚠️ Не удалось определить локацию автоматически');
        return null;

    } catch (error) {
        console.error('❌ Ошибка определения локации:', error);
        return null;
    }
}

// Сохранение локации пользователя
async function saveUserLocation(country, region, city) {
    currentUserLocation = {
        country: country,
        region: region,
        city: city,
        timestamp: Date.now()
    };

    // Update individual localStorage items for city filtering
    localStorage.setItem('userCountry', country || '');
    localStorage.setItem('userRegion', region || '');
    localStorage.setItem('userCity', city || '');
    localStorage.setItem('userLocation', JSON.stringify(currentUserLocation));

    console.log('📍 Локация сохранена:', currentUserLocation);

    // Сохраняем локацию в БД через API
    try {
        const userToken = localStorage.getItem('user_token');

        if (userToken) {
            console.log('📍 Сохраняем локацию в БД:', { country, region, city });

            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userToken: userToken,
                    location: { country, region, city }
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('✅ Локация сохранена в БД');
            } else {
                console.warn('⚠️ Ошибка сохранения локации в БД:', result.error);
            }
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения локации в БД:', error);
    }

    // Fallback: сохраняем в Telegram Cloud Storage
    try {
        if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp?.CloudStorage) {
            window.Telegram.WebApp.CloudStorage.setItem('userLocation', JSON.stringify(currentUserLocation), function(err) {
                if (!err) {
                    console.log('📦 Локация дублирована в Telegram Cloud Storage');
                } else {
                    console.error('Ошибка сохранения в Cloud Storage:', err);
                }
            });
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения в Cloud Storage:', error);
    }
}

// Экспорт функций в window для использования в других скриптах
if (typeof window !== 'undefined') {
    window.getUserLocation = getUserLocation;
    window.detectLocationByGPS = detectLocationByGPS;
    window.detectLocationByIP = detectLocationByIP;
    window.saveUserLocation = saveUserLocation;
}
