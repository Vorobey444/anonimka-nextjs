/**
 * Модуль Premium функционала (premium.js)
 * 
 * Функции:
 * - Загрузка и управление Premium статусом
 * - Показ и управление тарифами
 * - Проверка лимитов и ограничений
 * - Триал и реферальные награды
 */

console.log('💎 [PREMIUM] Инициализация модуля Premium');

/**
 * ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
 */

let userPremiumStatus = {
    isPremium: false,
    country: 'KZ',
    limits: null
};

/**
 * ===== ОСНОВНЫЕ ФУНКЦИИ =====
 */

/**
 * Загрузить Premium статус пользователя
 */
async function loadPremiumStatus() {
    try {
        console.log('💎 [PREMIUM] Загрузка Premium статуса');
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (!userId && !userToken) {
            console.log('⚠️ [PREMIUM] Пользователь не авторизован');
            return;
        }
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-user-status',
                params: userId ? { userId } : { userToken }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('❌ [PREMIUM] Ошибка загрузки статуса:', result.error);
            return;
        }
        
        userPremiumStatus = result.data;
        
        console.log('✅ [PREMIUM] Статус загружен:', {
            isPremium: userPremiumStatus.isPremium,
            premiumUntil: userPremiumStatus.premiumUntil
        });
        
        updatePremiumUI();
        updateAdLimitBadge();
        
    } catch (error) {
        console.error('❌ [PREMIUM] Ошибка loadPremiumStatus:', error);
    }
}

/**
 * Показать модальное окно тарифов
 */
async function showPremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (!modal) {
        console.error('❌ [PREMIUM] Модальное окно не найдено');
        return;
    }
    
    modal.style.display = 'flex';
    
    // Обновляем статус
    await loadPremiumStatus();
    updatePremiumModalButtons();
    updateCurrentSubscriptionInfo();
}

/**
 * Закрыть модальное окно тарифов
 */
function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Обновить UI переключателя Premium
 */
function updatePremiumUI() {
    const freeBtn = document.getElementById('freeBtn');
    const proBtn = document.getElementById('proBtn');
    
    if (!freeBtn || !proBtn) return;
    
    // Сбрасываем классы
    freeBtn.classList.remove('active', 'free');
    proBtn.classList.remove('active', 'pro');
    
    if (userPremiumStatus.isPremium) {
        proBtn.classList.add('active', 'pro');
        if (userPremiumStatus.premiumUntil) {
            const date = new Date(userPremiumStatus.premiumUntil);
            const formatted = date.toLocaleDateString('ru-RU');
            proBtn.title = `PRO до ${formatted}`;
        }
    } else {
        freeBtn.classList.add('active', 'free');
    }
}

/**
 * Обновить счётчик лимита анкет
 */
function updateAdLimitBadge() {
    const badge = document.getElementById('adLimitBadge');
    
    if (!badge || !userPremiumStatus.limits) return;
    
    const adsLimit = userPremiumStatus.limits.ads;
    const used = adsLimit?.used || 0;
    const max = adsLimit?.max || 1;
    const remaining = adsLimit?.remaining || 0;
    
    if (remaining === 0) {
        badge.innerHTML = `${used}/${max} 🚫<br><span style="font-size: 0.7em;">Лимит исчерпан</span>`;
        badge.className = 'limit-badge danger';
        badge.style.display = 'block';
    } else {
        badge.textContent = `${used}/${max}`;
        badge.className = 'limit-badge';
        badge.style.display = 'block';
    }
    
    badge.title = `Использовано: ${used} / ${max}. Осталось: ${remaining}`;
}

/**
 * Обновить кнопки в модальном окне
 */
function updatePremiumModalButtons() {
    const buyBtn = document.getElementById('buyPremiumBtn');
    const referralBtn = document.getElementById('referralBtn');
    const trialBtn = document.getElementById('trialBtn');
    const freeBtn = document.querySelector('.pricing-card:not(.featured) .pricing-btn');
    
    if (!userPremiumStatus.isPremium) {
        // Пользователь FREE - показываем кнопки покупки
        if (freeBtn) {
            freeBtn.textContent = 'Текущий план (FREE)';
            freeBtn.disabled = true;
        }
        
        // Проверяем если это email пользователь
        const emailUser = isEmailUser();
        
        if (emailUser) {
            // Email пользователи не видят Stars и Referral
            if (buyBtn) buyBtn.style.display = 'none';
            if (referralBtn) referralBtn.style.display = 'none';
        } else {
            // Telegram пользователи видят все
            if (buyBtn) buyBtn.style.display = 'block';
            if (referralBtn) referralBtn.style.display = 'block';
        }
        
        // Trial показываем только если не использован
        if (trialBtn) {
            trialBtn.style.display = (userPremiumStatus.trial7h_used ? 'none' : 'block');
        }
    } else {
        // Пользователь PRO - скрываем все кнопки покупки
        if (freeBtn) {
            freeBtn.textContent = '✅ У вас PRO подписка';
            freeBtn.disabled = true;
        }
        if (buyBtn) buyBtn.style.display = 'none';
        if (referralBtn) referralBtn.style.display = 'none';
        if (trialBtn) trialBtn.style.display = 'none';
    }
}

/**
 * Обновить информацию о текущей подписке
 */
function updateCurrentSubscriptionInfo() {
    const infoBlock = document.getElementById('currentSubscriptionInfo');
    const detailsDiv = document.getElementById('subscriptionDetails');
    
    if (!infoBlock || !detailsDiv) return;
    
    if (userPremiumStatus.isPremium) {
        const premiumSource = userPremiumStatus.premiumSource || 'paid';
        let subscriptionType = '⭐ PRO подписка';
        
        if (premiumSource === 'female_bonus') {
            subscriptionType = '💝 Бонус для девушек';
        } else if (premiumSource === 'trial') {
            subscriptionType = '🎁 Пробный период';
        } else if (premiumSource === 'referral') {
            subscriptionType = '🎉 Реферальная программа';
        }
        
        let details = subscriptionType;
        
        if (userPremiumStatus.premiumUntil) {
            const until = new Date(userPremiumStatus.premiumUntil);
            const formatted = until.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Вычисляем оставшееся время
            const diff = until.getTime() - Date.now();
            if (diff > 0) {
                const days = Math.floor(diff / (1000*60*60*24));
                const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
                details += `<br>📅 До: ${formatted}<br>⏱️ Осталось: ${days}д ${hours}ч`;
            }
        }
        
        detailsDiv.innerHTML = details;
        infoBlock.style.display = 'block';
    } else {
        infoBlock.style.display = 'none';
    }
}

/**
 * ===== ТРИАЛ И НАГРАДЫ =====
 */

/**
 * Активировать 7-часовой триал
 */
async function activatePremiumTrial7h() {
    try {
        console.log('🎁 [PREMIUM] Активация 7h триала');
        
        const userId = getCurrentUserId();
        const userToken = localStorage.getItem('user_token');
        
        if (!userId && !userToken) {
            tg.showAlert('Требуется авторизация');
            return;
        }
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'toggle-premium',
                params: { 
                    userId: userToken || userId,
                    trial7h: true
                }
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            tg.showAlert('Ошибка активации триала');
            return;
        }
        
        await loadPremiumStatus();
        userPremiumStatus.trial7h_used = true;
        
        const until = new Date(result.data.premiumUntil);
        const timeStr = until.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        tg.showAlert(`🎉 7 часов PRO активированы!\n\nДо: ${timeStr}\n\nПосле этого вернёшься в FREE. Пригласи друга для месяца PRO!`, () => {
            closePremiumModal();
        });
        
    } catch (error) {
        console.error('❌ [PREMIUM] Ошибка активации триала:', error);
    }
}

/**
 * ===== ФУНКЦИИ ЛИМИТОВ =====
 */

/**
 * Проверить лимит фото
 */
async function checkPhotoLimit() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return { canSend: false };
        
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check-photo-limit',
                params: { userId }
            })
        });
        
        const result = await response.json();
        
        if (result.data?.canSend === false) {
            return {
                canSend: false,
                reason: `Лимит фото исчерпан!\n\nFREE: 5 фото\nПро: безлимит\n\nОформите PRO для безлимита!`
            };
        }
        
        return { canSend: true };
        
    } catch (error) {
        console.error('❌ [PREMIUM] Ошибка проверки лимита фото:', error);
        return { canSend: true };
    }
}

/**
 * Проверить является ли пользователь email пользователем
 */
function isEmailUser() {
    const userToken = localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('user_email');
    
    // Если есть email в localStorage
    if (userEmail) return true;
    
    // Если длинный токен и нет короткого ID
    if (userToken && userToken.length > 20 && (!userId || userId.length > 15)) {
        return true;
    }
    
    return false;
}

console.log('✅ [PREMIUM] Модуль Premium инициализирован');
