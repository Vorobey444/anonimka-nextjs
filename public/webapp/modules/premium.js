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

/**
 * ===== ПОКУПКА И ОПЛАТА =====
 */

// Глобальные переменные для покупки
let selectedPremiumMonths = 1;
let selectedPremiumPrice = { stars: 0, discount: 0 };

/**
 * Показать модальное окно покупки Stars
 */
function showStarsPurchaseModal() {
    const modal = document.getElementById('starsPurchaseModal');
    if (modal) {
        modal.style.display = 'flex';
        const slider = document.getElementById('premiumSlider');
        if (slider) {
            slider.value = 1;
            updatePremiumPricing(1);
        }
    }
}

/**
 * Закрыть модальное окно покупки Stars
 */
function closeStarsPurchaseModal() {
    const modal = document.getElementById('starsPurchaseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Обновить цену при движении слайдера
 */
async function updatePremiumPricing(months) {
    selectedPremiumMonths = parseInt(months);
    
    try {
        const response = await fetch(`/api/premium/calculate?months=${months}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Ошибка расчёта цены:', data.error);
            return;
        }
        
        selectedPremiumPrice = {
            stars: data.stars,
            discount: data.discount
        };
        
        const durationLabel = document.getElementById('premiumDurationLabel');
        const priceLabel = document.getElementById('premiumPrice');
        const discountLabel = document.getElementById('premiumDiscount');
        
        const monthWord = months == 1 ? 'месяц' : (months >= 2 && months <= 4) ? 'месяца' : 'месяцев';
        
        if (durationLabel) durationLabel.textContent = `${months} ${monthWord}`;
        if (priceLabel) priceLabel.textContent = `${data.stars} ⭐`;
        
        if (discountLabel) {
            if (data.discount > 0) {
                discountLabel.textContent = `🔥 Скидка ${data.discount}%`;
                discountLabel.style.display = 'block';
            } else {
                discountLabel.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка обновления цены:', error);
    }
}

/**
 * Покупка PRO с выбранным сроком
 */
async function buyPremiumWithDuration() {
    try {
        const isTelegramWebApp = window.Telegram?.WebApp?.platform !== 'unknown' && !!window.Telegram?.WebApp?.initData;
        
        if (!isTelegramWebApp) {
            tg.showAlert('💳 Покупка доступна только в Telegram!\\n\\nОткройте приложение через @anonimka_kz_bot');
            return;
        }
        
        const userId = getCurrentUserId();
        if (!userId || userId.startsWith('web_')) {
            tg.showAlert('Необходима авторизация через Telegram');
            return;
        }
        
        closeStarsPurchaseModal();
        closePremiumModal();
        
        const monthWord = selectedPremiumMonths === 1 ? 'месяц' : 
                         (selectedPremiumMonths >= 2 && selectedPremiumMonths <= 4) ? 'месяца' : 'месяцев';
        
        let confirmText = `💳 Покупка PRO подписки\\n\\n` +
                         `⏱️ Срок: ${selectedPremiumMonths} ${monthWord}\\n` +
                         `💰 Стоимость: ${selectedPremiumPrice.stars} Stars`;
        
        if (selectedPremiumPrice.discount > 0) {
            confirmText += `\\n🔥 Скидка: ${selectedPremiumPrice.discount}%`;
        }
        
        confirmText += '\\n\\n✨ Что входит:\\n• 3 анкеты/день\\n• Безлимит фото\\n• Закрепление 3×1ч/день\\n• Значок PRO\\n\\nОткрыть бота для оплаты?';
        
        tg.showConfirm(confirmText, (confirmed) => {
            if (confirmed) {
                const startParam = `buy_premium_${selectedPremiumMonths}m`;
                try {
                    tg.close();
                    const botUrl = `https://t.me/anonimka_kz_bot?start=${startParam}`;
                    if (tg.openTelegramLink) {
                        tg.openTelegramLink(botUrl);
                    } else {
                        window.open(botUrl, '_blank');
                    }
                } catch (error) {
                    window.location.href = `https://t.me/anonimka_kz_bot?start=${startParam}`;
                }
            }
        });
    } catch (error) {
        console.error('Ошибка покупки PRO:', error);
        tg.showAlert('Ошибка при переходе к оплате. Попробуйте позже.');
    }
}

/**
 * Выбрать тарифный план
 */
async function selectPlan(plan) {
    if (plan === 'free' && userPremiumStatus.isPremium) {
        tg.showAlert('Переход на FREE недоступен: FREE включается автоматически когда заканчивается PRO');
    }
}

/**
 * Активировать Premium (с кринжовыми диалогами)
 */
async function activatePremium() {
    try {
        // Блокируем прямую активацию: только реферал - КРИНЖОВЫЙ ДИАЛОГ
        if (!userPremiumStatus.isPremium) {
            // Первое предупреждение - провокация
            tg.showConfirm(
                '🤔 ТЫ действительно хочешь PRO, БРО?',
                (confirmed) => {
                    if (confirmed) {
                        // Кринжовая отмазка
                        const messages = [
                            '😂 Ну тогда пригласите друга!\n\n📲 Ваша реферальная ссылка ждёт в разделе "Реферальная программа"',
                            '🤣 Ахаха! Думали будет кнопка "Купить"?\n\nНЕТ! Только через друга! 💪\n\nРеферальная ссылка уже готова для Вас 👆',
                            '😏 Хитрый план не прокатил!\n\nPRO = приглашение друга, вот и вся магия ✨\n\nБерите ссылку и зовите друзей! 🔥',
                            '🎭 Сюрприз! Халявы нет!\n\nНо есть БЕСПЛАТНЫЙ PRO через реферала!\n\nДруг создаёт анкету → Вы получаете PRO 🎁',
                            '💡 А Вы шустрый! Но не прокатит 😎\n\nPRO дают за друзей, а не за кнопки!\n\nВперёд приглашать! 🚀',
                            '🎪 Добро пожаловать в реферальный цирк!\n\nБилет = 1 друг = 1 месяц PRO 🎟️\n\nЛови ссылку и вперёд! 🤡',
                            '🧠 200 IQ ход! Но мы Вас раскусили 🕵️\n\nЗахотели халяву? Приведите друзей!\n\nТак работают легенды 💪',
                            '⚡️ PLOT TWIST!\n\nДенег не надо, друзей надо! 🤝\n\nРеферальная программа — Ваш ключ к PRO! 🗝️'
                        ];
                        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                        
                        // Проверяем, использовал ли уже 7-часовой триал
                        const trial7hUsed = userPremiumStatus.trial7h_used || false;
                        
                        if (!trial7hUsed) {
                            // Предлагаем 7 часов PRO (только один раз)
                            tg.showAlert(randomMsg + '\n\n🎃 Но могу дать Вам троллинг-TRIAL: 7 часов PRO. Хотите?', () => {
                                tg.showConfirm('🔥 Врубить 7 часов PRO сейчас? Потом всё исчезнет как карета в 00:00!', (trialConfirm) => {
                                    if (trialConfirm) {
                                        activatePremiumTrial7h();
                                    } else {
                                        if (typeof showReferralModal === 'function') showReferralModal();
                                    }
                                });
                            });
                        } else {
                            // Триал уже использован - только реферал
                            const usedTrialMessages = [
                                '😏 Вы уже использовали триал, помните?\n\nТеперь только реферал работает!',
                                '🤷‍♂️ 7 часов уже было, больше не дам!\n\nХотите PRO? Зовите друга!',
                                '🎭 Второй раз фокус не сработает!\n\nРеферальная программа — Ваш единственный путь!',
                                '😎 Триал был разовой акцией!\n\nТеперь только друзья дают PRO!'
                            ];
                            const randomUsedMsg = usedTrialMessages[Math.floor(Math.random() * usedTrialMessages.length)];
                            tg.showAlert(randomMsg + '\n\n' + randomUsedMsg, () => {
                                if (typeof showReferralModal === 'function') showReferralModal();
                            });
                        }
                    } else {
                        // Если отказался - кринжовая подначка
                        const rejectMessages = [
                            '😢 Эх, а я уже обрадовался...\n\nНу ладно, FREE тоже норм! 💪',
                            '🤷‍♂️ Передумал? Бывает!\n\nБесплатная версия тоже огонь 🔥',
                            '😅 Понял, не сегодня!\n\nКогда будешь готов - мы тут 👍',
                            '🙃 Испугался ответственности?\n\nДруг не кусается, обещаем! 😄',
                            '💭 Раздумал стать легендой?\n\nНу ок, FREE версия тоже топ! 🎯',
                            '🤔 Философски подошёл к вопросу...\n\nУважаю! Возвращайся когда созреешь 🧘',
                            '😎 Независимый выбор!\n\nFREE воины тоже достойны уважения 🛡️'
                        ];
                        const randomReject = rejectMessages[Math.floor(Math.random() * rejectMessages.length)];
                        tg.showAlert(randomReject);
                    }
                }
            );
            return;
        }
        
        const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
        if (!userId || userId.startsWith('web_')) {
            tg.showAlert('Необходима авторизация через Telegram');
            return;
        }
        
        console.log('🔄 Активация/деактивация Premium, текущий статус:', userPremiumStatus.isPremium);
        
        // Проверяем текущий статус
        if (userPremiumStatus.isPremium) {
            // Уже на PRO - понижаем до FREE сразу
            console.log('⬇️ Понижение до FREE...');
            
            const response = await fetch('/api/premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle-premium',
                    params: { userId }
                })
            });
            
            const result = await response.json();
            
            console.log('📥 Ответ сервера (понижение):', result);
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            // Обновляем локальный статус
            userPremiumStatus.isPremium = false;
            userPremiumStatus.premiumUntil = null;
            
            // Перезагружаем лимиты с сервера
            await loadPremiumStatus();
            
            tg.showAlert('Вы вернулись на FREE тариф');
            
            setTimeout(() => closePremiumModal(), 1000);
            return;
        }
        
        // Показываем загрузку
        const btn = document.getElementById('activatePremiumBtn');
        const originalText = btn ? btn.textContent : '';
        if (btn) {
            btn.textContent = '⏳ Обработка...';
            btn.disabled = true;
        }
        
        console.log('⬆️ Повышение до PRO...');
        
        // Переключаем статус (для теста)
        const response = await fetch('/api/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'toggle-premium',
                params: { userId }
            })
        });
        
        const result = await response.json();
        
        console.log('📥 Ответ сервера (повышение):', result);
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        // Перезагружаем полный статус с сервера
        await loadPremiumStatus();
        
        // Показываем уведомление
        if (userPremiumStatus.isPremium) {
            tg.showAlert('🎉 Поздравляем! PRO активирован на 30 дней!\n\nТеперь доступны:\n✅ Безлимит фото\n✅ До 3 анкет в день\n✅ Закрепление 3 раза в день');
        } else {
            tg.showAlert('Вы вернулись на FREE тариф\n\nДоступны базовые функции');
        }
        
        // Закрываем модалку через 1 секунду
        setTimeout(() => {
            closePremiumModal();
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка активации Premium:', error);
        tg.showAlert('Ошибка: ' + error.message);
        
        // Возвращаем кнопку
        const btn = document.getElementById('activatePremiumBtn');
        if (btn) {
            btn.textContent = 'Оформить PRO';
            btn.disabled = false;
        }
    }
}

/**
 * Покупка Premium через Telegram (перенаправляет на buyPremiumWithDuration)
 */
async function buyPremiumViaTelegram() {
    // Перенаправляем на новую функцию
    await buyPremiumWithDuration();
}

/**
 * Показать заглушку для оплаты долларом
 */
function showDollarPaymentComingSoon() {
    const message = '💵 Оплата за 1$ скоро будет доступна!\\n\\n' +
                   '🔜 Мы подключаем платежную систему\\n' +
                   '💳 Принимаем карты всех стран\\n' +
                   '🌍 Быстрая оплата без комиссий\\n\\n' +
                   '⏰ Следите за обновлениями!';
    
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

/**
 * Показать предложение триала
 */
function showTrialOffer() {
    if (userPremiumStatus.isPremium) {
        if (tg && tg.showAlert) tg.showAlert('Уже активен PRO, триал недоступен.');
        return;
    }
    const pitch = '🎃 Могу дать Вам 7 часов PRO.' +
                  '\\n📢 До 3 анкет' +
                  '\\n📸 Безлимит фото' +
                  '\\n📌 3 закрепления' +
                  '\\n\\nВключить сейчас?';
    if (tg && tg.showConfirm) {
        tg.showConfirm(pitch, (ok) => {
            if (ok) activatePremiumTrial7h();
        });
    } else {
        if (confirm(pitch.replace(/\\n/g,'\\n'))) activatePremiumTrial7h();
    }
}

// Экспортируем функции в глобальную область для вызова из HTML onclick
window.showPremiumModal = showPremiumModal;
window.closePremiumModal = closePremiumModal;
window.loadPremiumStatus = loadPremiumStatus;
window.updatePremiumUI = updatePremiumUI;
window.updateAdLimitBadge = updateAdLimitBadge;
window.updatePremiumModalButtons = updatePremiumModalButtons;
window.updateCurrentSubscriptionInfo = updateCurrentSubscriptionInfo;
window.activatePremiumTrial7h = activatePremiumTrial7h;
window.checkPhotoLimit = checkPhotoLimit;
window.isEmailUser = isEmailUser;
window.showStarsPurchaseModal = showStarsPurchaseModal;
window.closeStarsPurchaseModal = closeStarsPurchaseModal;
window.updatePremiumPricing = updatePremiumPricing;
window.buyPremiumWithDuration = buyPremiumWithDuration;
window.selectPlan = selectPlan;
window.showDollarPaymentComingSoon = showDollarPaymentComingSoon;
window.showTrialOffer = showTrialOffer;
window.activatePremium = activatePremium;
window.buyPremiumViaTelegram = buyPremiumViaTelegram;

console.log('✅ [PREMIUM] Модуль Premium инициализирован');
