/**
 * Модуль реферальной программы (referral.js)
 * 
 * Функции:
 * - Обработка реферальных ссылок
 * - Выдача награды за рефералов
 * - Управление реферальными данными
 * - UI для рефералки
 */

console.log('🎁 [REFERRAL] Инициализация модуля реферальной программы');

/**
 * ===== ОБРАБОТКА РЕФЕРАЛЬНОЙ ССЫЛКИ =====
 */

/**
 * Обработать реферальную ссылку при запуске
 */
async function handleReferralLink() {
    try {
        console.log('🔗 [REFERRAL] Проверка реферальной ссылки');
        
        // Проверяем start_param из Telegram WebApp
        let startParam = tg?.initDataUnsafe?.start_param;
        
        if (!startParam) {
            // Проверяем URL параметр ?ref=
            const urlParams = new URLSearchParams(window.location.search);
            const refParam = urlParams.get('ref');
            
            if (refParam) {
                console.log('📲 [REFERRAL] Найден web-переход ?ref=', refParam);
                localStorage.setItem('pending_referral', refParam);
                localStorage.setItem('pending_referral_timestamp', Date.now().toString());
                
                // Автоматический редирект в Telegram
                const botUsername = 'anonimka_kz_bot';
                const telegramLink = `https://t.me/${botUsername}?startapp=ref_${refParam}`;
                
                // Показываем сообщение и редиректим
                tg.showAlert('Переход в Telegram...', () => {
                    window.location.href = telegramLink;
                });
                return;
            }
        } else if (startParam.startsWith('ref_')) {
            console.log('🎁 [REFERRAL] Обнаружена реферальная ссылка из Telegram');
        }
        
        if (!startParam || !startParam.startsWith('ref_')) {
            console.log('ℹ️ [REFERRAL] Реферальный параметр не найден');
            return;
        }
        
        // Извлекаем ID реферера
        const referrerId = startParam.replace('ref_', '');
        console.log('🔍 [REFERRAL] ID реферера:', referrerId.substring(0, 16) + '...');
        
        // Получаем текущего пользователя
        const userToken = localStorage.getItem('user_token');
        const userId = getCurrentUserId();
        
        // Если токена нет, сохраняем реферера на потом
        if (!userToken || userToken === 'null') {
            console.log('⏳ [REFERRAL] Токен не создан, сохраняем реферера для последующей обработки');
            localStorage.setItem('pending_referral', referrerId);
            return;
        }
        
        // Регистрируем реферала
        console.log('📝 [REFERRAL] Регистрация реферала');
        
        const response = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrer_token: referrerId,
                new_user_token: userToken
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ [REFERRAL] Реферал зарегистрирован');
            localStorage.setItem('referral_processed', 'true');
            localStorage.setItem('referrer_token', referrerId);
        } else {
            console.log('ℹ️ [REFERRAL] Реферал не зарегистрирован:', data.message);
        }
        
    } catch (error) {
        console.error('❌ [REFERRAL] Ошибка обработки реферальной ссылки:', error);
    }
}

/**
 * Завершить реферальный процесс после создания анкеты
 */
async function finalizePendingReferral() {
    try {
        console.log('🏁 [REFERRAL] Завершение ожидающего реферала');
        
        const referrerId = localStorage.getItem('pending_referral');
        const userToken = localStorage.getItem('user_token');
        
        if (!referrerId || !userToken) {
            console.log('ℹ️ [REFERRAL] Нечего завершать');
            return;
        }
        
        // Регистрируем реферала
        const response = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrer_token: referrerId,
                new_user_token: userToken
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ [REFERRAL] Реферал завершен');
            localStorage.setItem('referral_processed', 'true');
            localStorage.setItem('referrer_token', referrerId);
            localStorage.removeItem('pending_referral');
        }
        
    } catch (error) {
        console.error('❌ [REFERRAL] Ошибка завершения реферала:', error);
    }
}

/**
 * Обработать награду реферера за новую анкету
 */
async function processReferralReward() {
    try {
        console.log('🎁 [REFERRAL] Проверка реферальной награды');
        
        // Защита: награда выдаётся один раз
        if (localStorage.getItem('referral_reward_processed') === 'true') {
            console.log('ℹ️ [REFERRAL] Награда уже была выдана');
            return;
        }
        
        const referrerToken = localStorage.getItem('referrer_token');
        const userToken = localStorage.getItem('user_token');
        
        if (!referrerToken) {
            console.log('ℹ️ [REFERRAL] Нет реферера - пользователь пришел органично');
            return;
        }
        
        // Защита от самореферала
        if (referrerToken === userToken) {
            console.log('❌ [REFERRAL] Попытка самореферала - игнорируем');
            localStorage.setItem('referral_reward_processed', 'true');
            localStorage.removeItem('referrer_token');
            return;
        }
        
        console.log('🎉 [REFERRAL] Выдача PRO реферу');
        
        // Выдаём награду реферу
        const response = await fetch('/api/referrals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                new_user_token: referrerToken
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ [REFERRAL] PRO выдан реферу до:', data.expiresAt);
            localStorage.setItem('referral_reward_processed', 'true');
            localStorage.removeItem('referrer_token');
        } else {
            console.log('ℹ️ [REFERRAL] Награда уже была выдана ранее');
            localStorage.setItem('referral_reward_processed', 'true');
        }
        
    } catch (error) {
        console.error('❌ [REFERRAL] Ошибка выдачи награды:', error);
    }
}

/**
 * ===== UI ФУНКЦИИ =====
 */

/**
 * Показать модальное окно реферальной программы
 */
function showReferralModal() {
    const modal = document.getElementById('referralModal');
    if (!modal) return;
    
    const referralLinkEl = document.getElementById('referralLink');
    const userToken = localStorage.getItem('user_token');
    
    modal.style.display = 'flex';
    
    if (!userToken || userToken === 'null') {
        if (referralLinkEl) {
            referralLinkEl.textContent = 'Сначала создайте анкету — мы дадим вам реферальную ссылку';
        }
        return;
    }
    
    // Формируем веб-ссылку
    const webLink = `https://anonimka.kz/webapp?ref=${userToken}`;
    
    if (referralLinkEl) {
        referralLinkEl.innerHTML = `
            <span style="word-break: break-all; font-size: 12px; color: var(--text-gray);">${webLink}</span>
        `;
    }
    
    window.currentReferralLink = webLink;
}

/**
 * Закрыть модальное окно рефералки
 */
function closeReferralModal() {
    const modal = document.getElementById('referralModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Скопировать реферальную ссылку
 */
async function copyReferralLink() {
    const link = window.currentReferralLink;
    
    if (!link) {
        tg.showAlert('Ссылка не готова');
        return;
    }
    
    // Тексты для реферальной ссылки
    const referralTexts = [
        "Хотите кому-то понравиться, но без неловких взглядов?\nЗдесь никому не нужно быть красивым.\nТолько честным. Анонимно.\n\n",
        "Один клик — и Вы в мире, где никто не знает, кто Вы.\nЗайдите. Напишите. Проверьте, кто ответит.\n\n",
        "Никаких подписок, никаких лиц.\nТолько Вы и чужое сообщение, которое задело.\n\n",
        "Зайдите просто из любопытства.\nВсе с этого начинают.\nА потом остаются.\n\n"
    ];
    
    const randomText = referralTexts[Math.floor(Math.random() * referralTexts.length)];
    const textToCopy = randomText + link;
    
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(textToCopy);
            tg.showAlert('✅ Ссылка с текстом скопирована!');
        } else {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            tg.showAlert('✅ Ссылка с текстом скопирована!');
        }
    } catch (error) {
        console.error('❌ [REFERRAL] Ошибка копирования:', error);
        tg.showAlert('Ошибка при копировании');
    }
}

/**
 * Поделиться реферальной ссылкой
 */
function shareReferralLink() {
    const link = window.currentReferralLink;
    
    if (!link) {
        tg.showAlert('Ссылка не готова');
        return;
    }
    
    // Пытаемся использовать Web Share API
    if (navigator.share) {
        navigator.share({
            title: 'Anonimka - Анонимные знакомства',
            text: 'Присоединяйтесь к анонимной доске знакомств!',
            url: link
        }).catch(err => console.log('Share отменён:', err));
    } else {
        // Fallback: копируем и показываем сообщение
        navigator.clipboard.writeText(link);
        tg.showAlert('✅ Ссылка скопирована!\n\nПоделитесь ей с друзьями в любом мессенджере.');
    }
}

// Экспорт функций для onclick
window.handleReferralLink = handleReferralLink;
window.finalizePendingReferral = finalizePendingReferral;
window.processReferralReward = processReferralReward;
window.showReferralModal = showReferralModal;
window.closeReferralModal = closeReferralModal;
window.copyReferralLink = copyReferralLink;
window.shareReferralLink = shareReferralLink;

console.log('✅ [REFERRAL] Модуль реферальной программы инициализирован');
