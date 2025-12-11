// ============================================================================
// DEBUG MODULE - Панель отладки
// ============================================================================

let debugPanel = null;
let debugPanelVisible = false;

// Переключение панели отладки
function toggleDebugPanel() {
    if (debugPanelVisible) {
        hideDebugPanel();
    } else {
        showDebugPanel();
    }
}

// Показать панель отладки
function showDebugPanel() {
    if (debugPanel && debugPanel.parentNode) {
        debugPanel.style.display = 'block';
        debugPanelVisible = true;
        return;
    }
    
    debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 10px;
        width: 90%;
        max-width: 400px;
        background: rgba(0,0,0,0.95);
        color: #00ff00;
        padding: 15px;
        font-family: monospace;
        font-size: 11px;
        z-index: 100000;
        max-height: 400px;
        overflow-y: auto;
        border: 2px solid #00ff00;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
    `;
    
    updateDebugInfo();
    document.body.appendChild(debugPanel);
    debugPanelVisible = true;
}

// Скрыть панель отладки
function hideDebugPanel() {
    if (debugPanel) {
        debugPanel.style.display = 'none';
    }
    debugPanelVisible = false;
}

// Обновить информацию в панели отладки
function updateDebugInfo() {
    if (!debugPanel) return;
    
    const tg = window.Telegram?.WebApp;
    const currentUserId = window.getCurrentUserId ? window.getCurrentUserId() : 'N/A';
    const userLocation = localStorage.getItem('userLocation');
    const parsedLocation = userLocation ? JSON.parse(userLocation) : null;
    const isTelegramWebApp = window.isTelegramWebApp || false;
    const currentStep = window.currentStep || 1;
    const totalSteps = window.totalSteps || 9;
    
    const info = {
        '🔐 АВТОРИЗАЦИЯ': '━━━━━━━━━━━━━━━━',
        'isTelegramWebApp': isTelegramWebApp,
        'window.Telegram': !!window.Telegram,
        'tg exists': !!tg,
        'platform': tg?.platform || '❌ НЕТ',
        'initData length': tg?.initData?.length || 0,
        'user.id (initData)': tg?.initDataUnsafe?.user?.id || '❌ НЕТ',
        'getCurrentUserId()': currentUserId,
        'isAuthorized': !currentUserId.toString().startsWith('web_') ? '✅ ДА' : '❌ НЕТ (веб ID)',
        
        '👤 ПРОФИЛЬ': '━━━━━━━━━━━━━━━━',
        'first_name': tg?.initDataUnsafe?.user?.first_name || '❌',
        'username': tg?.initDataUnsafe?.user?.username || '❌',
        'is_premium': tg?.initDataUnsafe?.user?.is_premium ? '⭐ ДА' : '❌',
        'nickname': document.getElementById('nicknameInput')?.value || localStorage.getItem('user_nickname') || '❌ НЕТ',
        
        '📍 ЛОКАЦИЯ': '━━━━━━━━━━━━━━━━',
        'country': parsedLocation?.country || '❌ НЕТ',
        'region': parsedLocation?.region || '❌ НЕТ',
        'city': parsedLocation?.city || '❌ НЕТ',
        'location saved': userLocation ? '✅ ЕСТЬ' : '❌ НЕТ',
        
        '💾 STORAGE': '━━━━━━━━━━━━━━━━',
        'localStorage user': localStorage.getItem('telegram_user') ? '✅ ЕСТЬ' : '❌ НЕТ',
        'localStorage nickname': localStorage.getItem('user_nickname') || '❌ НЕТ',
        'CloudStorage available': tg?.CloudStorage ? '✅ ДА' : '❌ НЕТ',
        
        '🖥️ СОСТОЯНИЕ': '━━━━━━━━━━━━━━━━',
        'currentScreen': document.querySelector('.screen.active')?.id || 'unknown',
        'currentStep': currentStep + '/' + totalSteps,
        'window.currentAds': window.currentAds?.length || 0,
        
        '🔑 ДЕТАЛИ initDataUnsafe': '━━━━━━━━━━━━━━━━',
        'Full initDataUnsafe': JSON.stringify(tg?.initDataUnsafe || {}, null, 2)
    };
    
    debugPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #00ff00; padding-bottom: 10px;">
            <b style="color: #00ff00; font-size: 14px;">🐛 DEBUG PANEL</b>
            <button onclick="updateDebugInfo()" style="background: #00ff00; color: #000; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 10px; font-weight: bold;">🔄 Обновить</button>
        </div>
        ${Object.entries(info).map(([k, v]) => {
            const isSection = v === '━━━━━━━━━━━━━━━━';
            if (isSection) {
                return `<div style="margin: 15px 0 8px 0; padding-top: 8px; border-top: 1px solid #00ff00;"><b style="color:#00ff00; font-size: 12px;">${k}</b></div>`;
            }
            const valueColor = v.toString().includes('✅') ? '#0f0' : v.toString().includes('❌') ? '#f80' : v.toString().includes('⭐') ? '#ff0' : '#fff';
            return `<div style="margin-bottom: 5px; padding-left: 8px;"><span style="color:#00aaff; font-size: 10px;">${k}:</span> <span style="color: ${valueColor}; font-size: 11px;">${v}</span></div>`;
        }).join('')}
    `;
}

// Создаем кнопку Debug
function createDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debugButton';
    debugBtn.innerHTML = '🐛';
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00ff00, #00aa00);
        border: 2px solid #00ff00;
        color: #000;
        font-size: 24px;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    debugBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 0 30px rgba(0, 255, 0, 0.8)';
    });
    
    debugBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
    });
    
    debugBtn.onclick = toggleDebugPanel;
    
    document.body.appendChild(debugBtn);
    console.log('✅ Debug кнопка создана');
}

// Экспорт функций
window.toggleDebugPanel = toggleDebugPanel;
window.showDebugPanel = showDebugPanel;
window.hideDebugPanel = hideDebugPanel;
window.updateDebugInfo = updateDebugInfo;
window.createDebugButton = createDebugButton;

console.log('✅ [DEBUG] Модуль отладки инициализирован');
