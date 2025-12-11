/**
 * Модуль утилит и вспомогательных функций
 */

/**
 * Функция для хеширования чувствительных данных в логах
 */
function hashSensitiveData(data) {
    if (!data) return '***';
    const str = String(data);
    if (str.length <= 6) return '***';
    return str.substring(0, 3) + '***' + str.substring(str.length - 3);
}

/**
 * Безопасный console.log для разработки
 */
const ENABLE_DEBUG_LOGS = false; // Установи false в продакшене!

function safeLog(...args) {
    if (!ENABLE_DEBUG_LOGS) return;
    
    const safeArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            const safeCopy = { ...arg };
            if (safeCopy.userId) safeCopy.userId = hashSensitiveData(safeCopy.userId);
            if (safeCopy.tg_id) safeCopy.tg_id = hashSensitiveData(safeCopy.tg_id);
            if (safeCopy.tgId) safeCopy.tgId = hashSensitiveData(safeCopy.tgId);
            if (safeCopy.chatId) safeCopy.chatId = hashSensitiveData(safeCopy.chatId);
            if (safeCopy.referrerId) safeCopy.referrerId = hashSensitiveData(safeCopy.referrerId);
            if (safeCopy.currentUserId) safeCopy.currentUserId = hashSensitiveData(safeCopy.currentUserId);
            return safeCopy;
        }
        return arg;
    });
    console.log(...safeArgs);
}

/**
 * Получить текущий ID пользователя
 */
function getCurrentUserId() {
    if (isTelegramWebApp && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        return String(window.Telegram.WebApp.initDataUnsafe.user.id);
    }
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            if (userData?.id) {
                return String(userData.id);
            }
        } catch (e) {
            console.error('Ошибка получения ID пользователя:', e);
        }
    }
    return null;
}

/**
 * Получить nickname текущего пользователя
 */
function getUserNickname() {
    const savedNickname1 = localStorage.getItem('userNickname');
    const savedNickname2 = localStorage.getItem('user_nickname');
    const savedNickname = savedNickname1 || savedNickname2;
    if (savedNickname && savedNickname !== 'null' && savedNickname !== 'undefined') {
        return savedNickname;
    }
    return 'Аноним';
}

/**
 * Получить локацию пользователя
 */
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

/**
 * Форматирование чисел (1234 -> 1.2K)
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Форматирование даты создания
 */
function formatCreatedAt(createdAt) {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU');
}

/**
 * Форматирование пола
 */
function formatGender(gender) {
    const genderMap = {
        'male': 'Мужчина',
        'мужчина': 'Мужчина',
        'female': 'Женщина',
        'девушка': 'Женщина',
        'женщина': 'Женщина',
        'пара': 'Пара'
    };
    
    const genderLower = (gender || '').toLowerCase();
    return genderMap[genderLower] || 'Не указан';
}

/**
 * Форматирование цели поиска
 */
function formatTarget(target) {
    const targetMap = {
        'male': 'Мужчину',
        'мужчину': 'Мужчину',
        'female': 'Женщину',
        'женщину': 'Женщину',
        'девушку': 'Женщину',
        'couple': 'Пару',
        'пару': 'Пару',
        'пара': 'Пару'
    };
    
    const targetLower = (target || '').toLowerCase();
    return targetMap[targetLower] || 'Партнера';
}

/**
 * Форматирование целей
 */
function formatGoals(goals) {
    if (!goals) return 'не указано';
    if (Array.isArray(goals)) {
        return goals.map(g => formatSingleGoal(g)).join(', ');
    }
    // Если это строка со значениями разделенными запятой
    const goalsArray = String(goals).split(',').map(g => g.trim());
    return goalsArray.map(g => formatSingleGoal(g)).join(', ');
}

function formatSingleGoal(goal) {
    const goalMap = {
        'dating': 'Знакомство',
        'знакомство': 'Знакомство',
        'friendship': 'Дружба',
        'дружба': 'Дружба',
        'communication': 'Общение',
        'общение': 'Общение',
        'relationship': 'Отношения',
        'отношения': 'Отношения',
        'fun': 'Веселье',
        'веселье': 'Веселье',
        'intimate': 'Интимное',
        'интимное': 'Интимное'
    };
    
    const goalLower = String(goal || '').trim().toLowerCase();
    return goalMap[goalLower] || goal;
}

/**
 * Форматирование ориентации
 */
function formatOrientation(orientation) {
    const orientationMap = {
        'heterosexual': 'Гетеросексуальная',
        'гетеросексуальная': 'Гетеросексуальная',
        'homosexual': 'Гомосексуальная',
        'гомосексуальная': 'Гомосексуальная',
        'bisexual': 'Бисексуальная',
        'бисексуальная': 'Бисексуальная',
        'asexual': 'Асексуальная',
        'асексуальная': 'Асексуальная'
    };
    
    const orientationLower = (orientation || '').toLowerCase();
    return orientationMap[orientationLower] || orientation || 'не указана';
}

/**
 * Утилита для генерации числового ID из строки
 */
String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

/**
 * Конвертация HEIC в JPEG на клиенте через Canvas
 */
async function convertHeicToJpeg(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            try {
                // Создаём canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Конвертируем в JPEG Blob
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    
                    if (!blob) {
                        reject(new Error('Не удалось конвертировать изображение'));
                        return;
                    }
                    
                    // Создаём новый File объект
                    const newFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    resolve(newFile);
                }, 'image/jpeg', 0.85);
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Не удалось загрузить изображение для конвертации'));
        };
        
        img.src = url;
    });
}

/**
 * Загрузка фото в Telegram и получение file_id
 */
async function uploadPhotoToTelegram(file, userId) {
    try {
        let fileToUpload = file;
        
        // HEIC нужно конвертировать на клиенте, т.к. некоторые файлы проблемные
        const isHeic = file.type === 'image/heic' || 
                       file.type === 'image/heif' || 
                       (file.type === 'application/octet-stream' && file.name.toLowerCase().endsWith('.heic')) ||
                       file.name.toLowerCase().endsWith('.heic') ||
                       file.name.toLowerCase().endsWith('.heif');
        
        if (isHeic) {
            console.log('🔄 HEIC обнаружен, конвертируем в JPEG на клиенте...');
            try {
                fileToUpload = await convertHeicToJpeg(file);
                console.log('✅ HEIC → JPEG:', fileToUpload.size, 'bytes');
            } catch (heicError) {
                console.error('❌ Ошибка конвертации HEIC на клиенте:', heicError);
                // Продолжаем отправку на сервер - там есть fallback
                console.log('🔄 Отправляем HEIC на сервер для конвертации...');
            }
        }
        
        const formData = new FormData();
        formData.append('photo', fileToUpload);
        formData.append('userId', userId);
        
        console.log('📤 Отправка файла:', {
            name: fileToUpload.name,
            type: fileToUpload.type,
            size: fileToUpload.size,
            wasHeic: isHeic
        });
        
        const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData
        });
        
        console.log('📨 Response status:', response.status);
        
        // Проверяем что ответ валидный JSON
        const contentType = response.headers.get('content-type');
        console.log('📨 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Не JSON ответ от upload-photo:', text.substring(0, 500));
            throw new Error('Ошибка загрузки. Попробуйте другое фото или уменьшите размер.');
        }
        
        const result = await response.json();
        console.log('📨 Upload result:', result);
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        return result.data;
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        throw error;
    }
}

/**
 * Загрузить Email Service
 */
async function loadEmailService() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './email-service.js';
        script.onload = () => {
            console.log('✅ Email Service загружен');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Ошибка загрузки Email Service');
            reject(new Error('Failed to load Email Service'));
        };
        document.head.appendChild(script);
    });
}

/**
 * Отправка письма на бэкенд
 */
async function sendEmailToBackend(emailData) {
    try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        console.log('Текущий хост:', window.location.hostname);
        console.log('Это localhost?', isLocalhost);
        
        // Для локального тестирования используем Yandex Email сервер
        if (isLocalhost) {
            const backendUrl = 'http://localhost:5000/send-email';
            console.log('📧 Отправляем через Yandex SMTP сервер:', backendUrl);
            
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
                console.error('❌ Ошибка HTTP:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Детали ошибки:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Успешная отправка через Yandex:', result);
            return result;
        }
        
        // Для продакшена используем простую отправку
        console.log('📧 Продакшен: отправляем...');
        
        if (typeof window.sendEmailWhishStyle === 'undefined') {
            console.log('Загружаем Email Service...');
            await loadEmailService();
        }

        return window.sendEmailWhishStyle(emailData);
    } catch (error) {
        console.log('Бэкенд недоступен, используем альтернативный способ');
        console.error('Ошибка при отправке на бэкенд:', error);
        
        return await sendEmailViaTelegram(emailData);
    }
}

/**
 * Альтернативная отправка через Telegram бота или mailto
 */
async function sendEmailViaTelegram(emailData) {
    try {
        if (typeof tg !== 'undefined' && tg && tg.sendData) {
            console.log('Отправляем через Telegram Web App');
            tg.sendData(JSON.stringify({
                action: 'sendEmail',
                data: {
                    senderEmail: emailData.senderEmail,
                    subject: emailData.subject,
                    message: emailData.message
                }
            }));
            
            return {
                success: true,
                message: 'Сообщение отправлено через Telegram бота'
            };
        } else {
            console.log('Telegram Web App недоступен, используем mailto');
            return sendEmailViaMailto(emailData);
        }
    } catch (error) {
        console.error('Ошибка Telegram отправки:', error);
        return sendEmailViaMailto(emailData);
    }
}

/**
 * Отправка через стандартный mailto
 */
async function sendEmailViaMailto(emailData) {
    try {
        const subject = encodeURIComponent(`[anonimka.online] ${emailData.subject}`);
        const body = encodeURIComponent(`От: ${emailData.senderEmail}
Сообщение с сайта anonimka.online

${emailData.message}

---
Пожалуйста, отвечайте на адрес: ${emailData.senderEmail}
Время отправки: ${new Date().toLocaleString('ru-RU')}`);

        const mailtoLink = `mailto:aleksey@vorobey444.ru?subject=${subject}&body=${body}`;
        
        window.open(mailtoLink, '_blank');
        
        return {
            success: true,
            message: 'Открыт почтовый клиент для отправки.'
        };
    } catch (error) {
        console.error('Ошибка mailto:', error);
        return {
            success: false,
            error: 'Не удалось открыть почтовый клиент.'
        };
    }
}

// Экспорт функций для onclick
window.hashSensitiveData = hashSensitiveData;
window.safeLog = safeLog;
window.getCurrentUserId = getCurrentUserId;
window.getUserNickname = getUserNickname;
window.getUserLocation = getUserLocation;
window.formatNumber = formatNumber;
window.formatCreatedAt = formatCreatedAt;
window.formatGender = formatGender;
window.formatTarget = formatTarget;
window.formatGoals = formatGoals;
window.formatSingleGoal = formatSingleGoal;
window.formatOrientation = formatOrientation;
window.convertHeicToJpeg = convertHeicToJpeg;
window.uploadPhotoToTelegram = uploadPhotoToTelegram;
window.loadEmailService = loadEmailService;
window.sendEmailToBackend = sendEmailToBackend;
window.sendEmailViaTelegram = sendEmailViaTelegram;
window.sendEmailViaMailto = sendEmailViaMailto;

console.log('✅ Модуль утилит инициализирован');
