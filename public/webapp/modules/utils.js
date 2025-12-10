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

console.log('✅ Модуль утилит инициализирован');
