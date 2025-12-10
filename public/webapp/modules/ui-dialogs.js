/**
 * Модуль UI диалогов и модальных окон
 * Управляет всеми диалогами и alerts в приложении
 */

// Сохраняем оригинальные методы ПЕРЕД использованием
const originalAlert = window.alert;
const originalConfirm = window.confirm;
const originalPrompt = window.prompt;
const originalShowAlert = tg.showAlert ? tg.showAlert.bind(tg) : null;
const originalShowPopup = tg.showPopup ? tg.showPopup.bind(tg) : null;

/**
 * Функция для показа кастомного alert
 */
function showCustomAlert(message, callback) {
    const modal = document.getElementById('customAlertModal');
    const messageEl = document.getElementById('customAlertMessage');
    const btn = document.getElementById('customAlertBtn');
    
    if (modal && messageEl && btn) {
        messageEl.textContent = message;
        modal.style.display = 'flex';
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.onclick = function() {
            modal.style.display = 'none';
            if (callback) setTimeout(callback, 0);
        };
    } else {
        originalAlert.call(window, message);
        if (callback) setTimeout(callback, 0);
    }
}

/**
 * Безопасная обертка для showPopup
 */
tg.showPopup = function(params, callback) {
    const version = parseFloat(tg.version || '6.0');
    const isRealTelegram = !!(
        window.Telegram?.WebApp?.platform && 
        window.Telegram.WebApp.platform !== 'unknown' &&
        window.Telegram.WebApp.initData
    );
    
    if (isRealTelegram && version >= 6.2 && originalShowPopup) {
        try {
            originalShowPopup(params, callback);
            return;
        } catch (e) {
            console.warn('showPopup failed:', e.message);
        }
    }
    
    const message = params.message || params.title || 'Уведомление';
    showCustomAlert(message, callback);
};

/**
 * Переопределяем tg.showAlert
 */
tg.showAlert = function(message, callback) {
    const isRealTelegram = !!(
        window.Telegram?.WebApp?.platform && 
        window.Telegram.WebApp.platform !== 'unknown' &&
        window.Telegram.WebApp.initData
    );
    
    if (isRealTelegram && originalShowAlert) {
        try {
            originalShowAlert(message, callback);
            return;
        } catch (e) {
            console.warn('showAlert failed:', e.message);
        }
    }
    
    showCustomAlert(message, callback);
};

/**
 * Функция для показа кастомного confirm
 */
function showCustomConfirm(message, callback) {
    const modal = document.getElementById('customConfirmModal');
    const messageEl = document.getElementById('customConfirmMessage');
    const yesBtn = document.getElementById('customConfirmYes');
    const noBtn = document.getElementById('customConfirmNo');
    
    if (modal && messageEl && yesBtn && noBtn) {
        messageEl.textContent = message;
        modal.style.display = 'flex';
        
        modal.setAttribute('data-confirm-callback', 'pending');
        modal._confirmCallback = callback;
        
        const newYesBtn = yesBtn.cloneNode(true);
        const newNoBtn = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        noBtn.parentNode.replaceChild(newNoBtn, noBtn);
        
        newYesBtn.onclick = function() {
            modal.style.display = 'none';
            modal.removeAttribute('data-confirm-callback');
            if (callback) setTimeout(() => callback(true), 0);
        };
        
        newNoBtn.onclick = function() {
            modal.style.display = 'none';
            modal.removeAttribute('data-confirm-callback');
            if (callback) setTimeout(() => callback(false), 0);
        };
    } else {
        const result = confirm(message);
        if (callback) setTimeout(() => callback(result), 0);
    }
}

/**
 * Функция для показа кастомного prompt
 */
function showCustomPrompt(message, callback) {
    const modal = document.getElementById('customPromptModal');
    const messageEl = document.getElementById('customPromptMessage');
    const input = document.getElementById('customPromptInput');
    const okBtn = document.getElementById('customPromptOk');
    const cancelBtn = document.getElementById('customPromptCancel');
    
    if (modal && messageEl && input && okBtn && cancelBtn) {
        messageEl.textContent = message;
        input.value = '';
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
        
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newOkBtn.onclick = function() {
            const value = input.value;
            modal.style.display = 'none';
            if (callback) setTimeout(() => callback(value), 0);
        };
        
        newCancelBtn.onclick = function() {
            modal.style.display = 'none';
            if (callback) setTimeout(() => callback(null), 0);
        };
        
        input.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                newOkBtn.click();
            }
        };
    } else {
        const result = prompt(message);
        if (callback) setTimeout(() => callback(result), 0);
    }
}

/**
 * Переопределяем tg.showConfirm
 */
tg.showConfirm = function(message, callback) {
    const isRealTelegram = !!(
        window.Telegram?.WebApp?.platform && 
        window.Telegram.WebApp.platform !== 'unknown' &&
        window.Telegram.WebApp.initData
    );
    
    if (isRealTelegram && window.Telegram?.WebApp?.showConfirm) {
        try {
            window.Telegram.WebApp.showConfirm(message, callback);
            return;
        } catch (e) {
            console.warn('[CONFIRM] showConfirm failed:', e.message);
        }
    }
    
    showCustomConfirm(message, callback);
};

/**
 * Переопределяем глобальные alert, confirm, prompt
 */
if (typeof window !== 'undefined') {
    window.alert = function(message) {
        const isRealTelegram = !!(
            window.Telegram?.WebApp?.platform && 
            window.Telegram.WebApp.platform !== 'unknown' &&
            window.Telegram.WebApp.initData
        );
        
        if (isRealTelegram) {
            return originalAlert.call(window, message);
        }
        
        showCustomAlert(message);
    };
    
    window.confirm = function(message) {
        const isRealTelegram = !!(
            window.Telegram?.WebApp?.platform && 
            window.Telegram.WebApp.platform !== 'unknown' &&
            window.Telegram.WebApp.initData
        );
        
        if (isRealTelegram) {
            return originalConfirm.call(window, message);
        }
        
        return originalConfirm.call(window, message);
    };
    
    window.prompt = function(message, defaultValue) {
        const isRealTelegram = !!(
            window.Telegram?.WebApp?.platform && 
            window.Telegram.WebApp.platform !== 'unknown' &&
            window.Telegram.WebApp.initData
        );
        
        if (isRealTelegram) {
            return originalPrompt.call(window, message, defaultValue);
        }
        
        return originalPrompt.call(window, message, defaultValue);
    };
}

console.log('✅ Модуль UI диалогов инициализирован');
