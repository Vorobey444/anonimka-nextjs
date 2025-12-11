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
 * Форматирование времени для списка чатов
 */
function formatChatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/**
 * Форматирование времени для сообщений
 */
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Экранирование HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

/**
 * Открыть email composer для связи с поддержкой
 */
function openEmailComposer() {
    console.log('openEmailComposer вызвана');
    const recipient = 'aleksey@vorobey444.ru';
    const subject = encodeURIComponent('Обращение через anonimka.online');
    const body = encodeURIComponent(`Здравствуйте!\n\nПишу вам через анонимную доску анкет anonimka.online\n\n[Опишите вашу проблему или вопрос]\n\nС уважением,\n[Ваше имя]`);
    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
}

/**
 * Открыть Telegram чат с поддержкой
 */
function openSupportTelegramChat() {
    console.log('openSupportTelegramChat вызвана');
    
    const telegramUrl = 'https://t.me/Vorobey_444';
    
    // Пробуем открыть через Telegram Web App API
    if (tg && tg.openTelegramLink) {
        console.log('Используем tg.openTelegramLink');
        tg.openTelegramLink(telegramUrl);
    } else if (tg && tg.openLink) {
        console.log('Используем tg.openLink');
        tg.openLink(telegramUrl);
    } else {
        console.log('Используем window.open как fallback');
        // Fallback - обычная ссылка
        window.open(telegramUrl, '_blank');
    }
}

// Экспорт функций для onclick
window.hashSensitiveData = hashSensitiveData;
window.safeLog = safeLog;
window.getCurrentUserId = getCurrentUserId;
window.getUserNickname = getUserNickname;
window.getUserLocation = getUserLocation;
window.formatNumber = formatNumber;
window.formatChatTime = formatChatTime;
window.formatMessageTime = formatMessageTime;
window.escapeHtml = escapeHtml;
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
window.openEmailComposer = openEmailComposer;
window.openSupportTelegramChat = openSupportTelegramChat;

/**
 * Функция для расчета времени до полуночи (обновления лимитов) - АЛМАТЫ UTC+5
 */
function getTimeUntilMidnight() {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // Конвертируем в Алматы время (UTC+5)
    const almatyHours = (utcHours + 5) % 24;
    
    // Считаем время до полуночи Алматы
    const hoursUntilMidnight = (24 - almatyHours - 1);
    const minutesUntilMidnight = (60 - utcMinutes);
    
    const hours = minutesUntilMidnight === 60 ? hoursUntilMidnight + 1 : hoursUntilMidnight;
    const minutes = minutesUntilMidnight === 60 ? 0 : minutesUntilMidnight;
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else {
        return `${minutes}м`;
    }
}

/**
 * Возвращает правильную форму слова в зависимости от числа
 * @param {number} number - число
 * @param {string} one - форма для 1 (анкета)
 * @param {string} few - форма для 2-4 (анкеты)
 * @param {string} many - форма для 5+ (анкет)
 */
function getPluralForm(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

/**
 * Копировать данные письма в буфер обмена
 */
function copyEmailData(senderEmail, subject, message) {
    const emailText = `На: aleksey@vorobey444.ru
От: ${senderEmail}
Тема: ${subject}

${message}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(emailText).then(() => {
            showEmailStatus('success', '✅ Данные письма скопированы в буфер обмена');
        });
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = emailText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showEmailStatus('success', '✅ Данные письма скопированы в буфер обмена');
    }
}

/**
 * Открыть почтовый клиент вручную
 */
function openManualMailto(senderEmail, subject, message) {
    const mailtoData = {
        senderEmail,
        subject,
        message
    };
    
    sendEmailViaMailto(mailtoData).then(result => {
        if (result.success) {
            showEmailStatus('success', result.message);
        } else {
            showEmailStatus('error', result.error);
        }
    });
}

/**
 * Показать статус отправки email
 */
function showEmailStatus(type, message) {
    const statusDiv = document.getElementById('emailStatus');
    if (!statusDiv) return;
    
    statusDiv.className = `email-status ${type}`;
    
    if (type === 'loading') {
        statusDiv.innerHTML = `<div class="loading-spinner"></div>${message}`;
    } else {
        statusDiv.innerHTML = message;
    }
    
    statusDiv.style.display = 'block';
    
    // Автоматически скрываем сообщение через 5 секунд (кроме ошибок)
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

window.getTimeUntilMidnight = getTimeUntilMidnight;
window.getPluralForm = getPluralForm;
window.copyEmailData = copyEmailData;
window.openManualMailto = openManualMailto;
window.showEmailStatus = showEmailStatus;

// Настройка обработчика формы email
let emailFormHandlersInitialized = false;

function setupEmailFormHandlers() {
    const contactForm = document.getElementById('contactForm');
    
    console.log('setupEmailFormHandlers вызвана');
    console.log('contactForm найдена:', !!contactForm);
    
    if (contactForm) {
        contactForm.addEventListener('submit', window.handleEmailSubmit);
        console.log('Обработчик submit добавлен к форме');
        emailFormHandlersInitialized = true;
    }
}

// Настройка обработчиков событий для контактов
function setupContactsEventListeners() {
    console.log('Настройка обработчиков контактов');
    
    // Добавляем обработчики событий для Telegram контакта
    const telegramContact = document.querySelector('.contact-item[onclick*="openTelegramChat"]');
    
    if (telegramContact) {
        console.log('Найден элемент telegram контакта, добавляем обработчик');
        telegramContact.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Клик по telegram контакту');
            openTelegramChat();
        });
    }
}

// Показать опцию ручной отправки email
function showManualEmailOption(emailData) {
    const statusDiv = document.getElementById('emailStatus');
    if (!statusDiv) return;
    
    statusDiv.className = 'email-status error';
    statusDiv.innerHTML = `
        📋 <strong>Данные для ручной отправки:</strong>
        <br><br>
        <strong>На:</strong> aleksey@vorobey444.ru<br>
        <strong>От:</strong> ${emailData.senderEmail}<br>
        <strong>Тема:</strong> ${emailData.subject}<br>
        <strong>Сообщение:</strong><br>
        ${emailData.message.replace(/\n/g, '<br>')}
        <br><br>
        <button class="neon-button secondary" onclick="copyEmailData('${emailData.senderEmail}', '${emailData.subject.replace(/'/g, "\\'")}', '${emailData.message.replace(/'/g, "\\'")}')">
            📋 Копировать данные
        </button>
        <button class="neon-button primary" onclick="openManualMailto('${emailData.senderEmail}', '${emailData.subject.replace(/'/g, "\\'")}', '${emailData.message.replace(/'/g, "\\'")}')">
            📧 Открыть почту
        </button>
    `;
}

window.setupEmailFormHandlers = setupEmailFormHandlers;
window.setupContactsEventListeners = setupContactsEventListeners;
window.showManualEmailOption = showManualEmailOption;

console.log('✅ Модуль утилит инициализирован');
