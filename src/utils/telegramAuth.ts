/**
 * Система авторизации через Telegram
 * Портировано из WORK/public/webapp/app.js
 */

export const BOT_USERNAME = 'anonimka_kz_bot';

/**
 * Генерирует QR-код для авторизации через Telegram
 */
export async function generateTelegramQR(authToken: string) {
  const qrcodeContainer = document.getElementById('qrcode');
  const qrLoading = document.getElementById('qrLoading');

  if (!qrcodeContainer) return;

  // Очищаем контейнер
  qrcodeContainer.innerHTML = '';

  // Показываем загрузку
  if (qrLoading) {
    qrLoading.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Генерируем QR-код...</p>
    `;
    qrLoading.classList.remove('hidden');
  }

  // Создаем deep link для Telegram бота
  const telegramDeepLink = `https://t.me/${BOT_USERNAME}?start=${authToken}`;

  console.log('🔍 Генерация QR-кода для:', telegramDeepLink);

  // Загружаем QRCode.js если нужно
  if (typeof (window as any).QRCode === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    script.onload = () => {
      createQRCode(qrcodeContainer, telegramDeepLink, qrLoading);
    };
    document.head.appendChild(script);
  } else {
    createQRCode(qrcodeContainer, telegramDeepLink, qrLoading);
  }
}

function createQRCode(
  container: HTMLElement,
  text: string,
  qrLoading: HTMLElement | null
) {
  try {
    setTimeout(() => {
      new (window as any).QRCode(container, {
        text: text,
        width: 256,
        height: 256,
        colorDark: '#8338ec',
        colorLight: '#ffffff',
        correctLevel: (window as any).QRCode.CorrectLevel.H,
      });

      // Скрываем загрузку
      if (qrLoading) {
        qrLoading.classList.add('hidden');
      }

      console.log('✅ QR-код успешно сгенерирован');
    }, 100);
  } catch (error) {
    console.error('❌ Ошибка генерации QR-кода:', error);
    if (qrLoading) {
      qrLoading.innerHTML = '<p style="color: #ff0066;">❌ Ошибка генерации QR-кода</p>';
    }
  }
}

/**
 * Настраивает Deep Link для авторизации через Telegram
 */
export function setupTelegramDeepLink(authToken: string) {
  const deepLinkButton = document.getElementById('telegramDeepLink') as HTMLAnchorElement | null;
  const loginWidgetContainer = document.getElementById('loginWidgetContainer');
  const loginWidgetDivider = document.getElementById('loginWidgetDivider');

  if (!deepLinkButton) return;

  // Определяем находимся ли мы в Android приложении
  const isAndroidApp =
    navigator.userAgent.includes('wv') ||
    navigator.userAgent.includes('Android') ||
    window.location.protocol === 'file:';

  // Если в Android приложении - добавляем параметр для возврата
  const startParam = isAndroidApp ? `${authToken}_app` : authToken;

  // Используем tg://resolve для открытия приложения Telegram сразу
  const telegramDeepLink = `tg://resolve?domain=${BOT_USERNAME}&start=${startParam}`;

  console.log('🔗 Deep link установлен:', telegramDeepLink);

  deepLinkButton.href = telegramDeepLink;

  // Добавляем обработчик клика для принудительного открытия
  deepLinkButton.onclick = function (e) {
    e.preventDefault();
    console.log(
      '🔗 Открываем Telegram...',
      telegramDeepLink
    );

    // Внутри Telegram WebApp используем родной метод
    try {
      if (
        typeof (window as any).Telegram !== 'undefined' &&
        (window as any).Telegram?.WebApp?.openTelegramLink
      ) {
        (window as any).Telegram.WebApp.openTelegramLink(telegramDeepLink);
        return false;
      }
    } catch (err) {
      console.error('❌ Ошибка openTelegramLink:', err);
    }

    // Если это Android-приложение (WebView), открываем напрямую
    if (isAndroidApp) {
      window.location.href = telegramDeepLink;
      return false;
    }

    // Браузерный fallback: принудительный переход
    window.location.href = telegramDeepLink;
    return false;
  };

  if (loginWidgetContainer) {
    loginWidgetContainer.style.display = 'block';
  }
  if (loginWidgetDivider) {
    loginWidgetDivider.style.display = 'flex';
  }

  console.log('✅ Deep link установлен на кнопку');
}

/**
 * Запускает проверку авторизации с сервера
 */
export function startAuthCheckPolling(
  authToken: string,
  onSuccess: (user: any) => void,
  onTimeout: () => void
) {
  const checkInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/auth?token=${authToken}`);
      const data = await response.json();

      if (data.authorized && data.user) {
        console.log('✅ Авторизация получена с сервера:', data.user);

        // Сохраняем данные пользователя
        localStorage.setItem('telegram_user', JSON.stringify(data.user));
        localStorage.setItem('telegram_auth_time', Date.now().toString());
        localStorage.removeItem('telegram_auth_token');

        // Останавливаем проверку
        clearInterval(checkInterval);

        // Вызываем callback успеха
        onSuccess(data.user);
        return;
      }

      // Также проверяем localStorage (на случай авторизации через Login Widget)
      const savedUser = localStorage.getItem('telegram_user');
      const authTime = localStorage.getItem('telegram_auth_time');

      if (savedUser && authTime) {
        const userData = JSON.parse(savedUser);
        const timeDiff = Date.now() - parseInt(authTime);

        // Если авторизация произошла менее 10 секунд назад
        if (timeDiff < 10000) {
          console.log('✅ Обнаружена авторизация через Login Widget');

          clearInterval(checkInterval);
          localStorage.removeItem('telegram_auth_token');

          onSuccess(userData);
          return;
        }
      }
    } catch (error) {
      console.error('❌ Ошибка проверки авторизации:', error);
    }
  }, 2000);

  // Останавливаем проверку через 10 минут
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('⏰ Timeout: проверка авторизации остановлена');
    onTimeout();
  }, 600000);

  return checkInterval;
}

/**
 * Инициализирует Telegram Login Widget
 */
export function initTelegramLoginWidget() {
  const container = document.getElementById('loginWidgetContainer');
  if (!container) return;

  // Очищаем контейнер
  container.innerHTML = '';

  // Создаём script для Telegram Login Widget
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', BOT_USERNAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-auth-url', window.location.origin + '/webapp/auth.html');
  script.setAttribute('data-request-access', 'write');

  container.appendChild(script);

  console.log('🔐 Telegram Login Widget инициализирован для бота:', BOT_USERNAME);
}

/**
 * Обрабатывает успешную авторизацию через Telegram
 */
export function handleTelegramAuthSuccess(user: any, onSuccess: (user: any) => void) {
  console.log('✅ Успешная авторизация через Telegram:', user);

  // Сохраняем данные пользователя
  localStorage.setItem('telegram_user', JSON.stringify(user));
  localStorage.setItem('telegram_auth_time', Date.now().toString());
  localStorage.removeItem('telegram_auth_token');

  onSuccess(user);
}
