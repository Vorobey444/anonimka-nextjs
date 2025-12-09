// ============= MENU.JS - Menu & Navigation System =============

// Hamburger меню функции
window.toggleHamburgerMenu = function() {
  const overlay = document.getElementById('hamburgerMenuOverlay');
  if (overlay) {
    overlay.classList.toggle('active');
  }
};

window.closeHamburgerMenu = function() {
  const overlay = document.getElementById('hamburgerMenuOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
};

window.closeHamburgerAndGoHome = function() {
  closeHamburgerMenu();
  showMainMenu();
};

// Закрытие меню при клике вне меню
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hamburgerMenuOverlay');
    const menu = overlay?.querySelector('.hamburger-menu');
    const hamburgerBtn = document.querySelector('.hamburger-menu');

    if (overlay && menu) {
      document.addEventListener('click', (e) => {
        if (overlay.classList.contains('active') &&
          !menu.contains(e.target) &&
          !hamburgerBtn?.contains(e.target)) {
          closeHamburgerMenu();
        }
      });
    }
  });
}

// Функции навигации по меню
window.goToHome = function() {
  closeHamburgerMenu();
  showMainMenu();
};

window.showContacts = function() {
  closeHamburgerMenu();
  showScreen('contacts');
};

window.showRules = function() {
  closeHamburgerMenu();
  showScreen('rules');
};

window.showPrivacy = function() {
  closeHamburgerMenu();
  showScreen('privacy');
};

window.showAbout = function() {
  closeHamburgerMenu();
  showScreen('about');
};

// Email формы
let emailFormHandlersInitialized = false;

window.showEmailForm = function() {
  showScreen('emailForm');
  const senderEmail = document.getElementById('senderEmail');
  const emailSubject = document.getElementById('emailSubject');
  const emailMessage = document.getElementById('emailMessage');
  const emailStatus = document.getElementById('emailStatus');

  if (senderEmail) senderEmail.value = '';
  if (emailSubject) emailSubject.value = 'Обращение через anonimka.online';
  if (emailMessage) emailMessage.value = '';
  if (emailStatus) emailStatus.style.display = 'none';

  if (!emailFormHandlersInitialized) {
    setTimeout(() => {
      setupEmailFormHandlers();
    }, 100);
  }
};

function setupEmailFormHandlers() {
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', handleEmailSubmit);
    emailFormHandlersInitialized = true;
  }
}

window.openEmailComposer = function() {
  const recipient = 'support@anonimka.online';
  const subject = encodeURIComponent('Обращение через anonimka.online');
  const body = encodeURIComponent('Здравствуйте!\n\nПишу вам через anonimka.online\n\n[Ваше сообщение]');
  const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
  window.open(mailtoLink, '_blank');
};

window.showEmailStatus = function(type, message) {
  const statusElement = document.getElementById('emailStatus');
  if (!statusElement) return;

  statusElement.style.display = 'block';
  statusElement.className = `email-status email-status-${type}`;
  statusElement.textContent = message;

  if (type === 'success') {
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 3000);
  }
};

window.openTelegramChat = function() {
  const telegramUrl = 'https://t.me/Vorobey_444';

  if (typeof tg !== 'undefined' && tg && tg.openTelegramLink) {
    tg.openTelegramLink(telegramUrl);
  } else if (typeof tg !== 'undefined' && tg && tg.openLink) {
    tg.openLink(telegramUrl);
  } else {
    window.open(telegramUrl, '_blank');
  }
};

window.handleEmailSubmit = async function(event) {
  if (event) event.preventDefault();

  const senderEmail = document.getElementById('senderEmail');
  const subject = document.getElementById('emailSubject');
  const message = document.getElementById('emailMessage');
  const sendBtn = document.getElementById('sendEmailBtn');

  if (!senderEmail || !subject || !message) {
    return;
  }

  const emailValue = senderEmail.value.trim();
  const subjectValue = subject.value.trim();
  const messageValue = message.value.trim();

  if (!emailValue || !messageValue) {
    showEmailStatus('error', '❌ Пожалуйста, заполните все поля');
    return;
  }

  if (messageValue.length < 3) {
    showEmailStatus('error', '❌ Сообщение должно быть минимум 3 символа');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailValue)) {
    showEmailStatus('error', '❌ Некорректный email');
    return;
  }

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳ Отправка...';
  }

  showEmailStatus('loading', '⏳ Отправляем письмо...');

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderEmail: emailValue,
        subject: subjectValue,
        message: messageValue
      })
    });

    if (response.ok) {
      showEmailStatus('success', '✅ Письмо отправлено!');
      if (senderEmail) senderEmail.value = '';
      if (subject) subject.value = 'Обращение через anonimka.online';
      if (message) message.value = '';

      setTimeout(() => {
        closeHamburgerMenu();
        showMainMenu();
      }, 3000);
    } else {
      showEmailStatus('error', '❌ Ошибка при отправке');
    }

  } catch (error) {
    console.error('Ошибка:', error);
    showEmailStatus('error', '❌ Ошибка: ' + error.message);

  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = '📤 Отправить письмо';
    }
  }
};
