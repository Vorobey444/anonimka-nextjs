// Простая отправка email в стиле whish.online
// Пересылает письмо через Vercel API, а если недоступно — через FormSubmit

(function() {
  const FORM_SUBMIT_URL = 'https://formsubmit.co/ajax/vorobey469@yandex.ru';
  const BACKEND_URL = '/api/send-email'; // Работает на Vercel

  function isValidEmail(email) {
    return /.+@.+\..+/.test(email);
  }

  async function sendViaBackend({ senderEmail, subject, message }) {
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail, subject, message })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt}`);
      }
      return await res.json();
    } catch (e) {
      console.warn('Backend email failed, will fallback to FormSubmit:', e);
      return null;
    }
  }

  async function sendViaFormSubmit({ senderEmail, subject, message }) {
    try {
      const formData = new FormData();
      formData.append('email', senderEmail || 'anon@anonimka.online');
      formData.append('subject', subject || 'Обращение через anonimka.online');
      formData.append('message', message || '');

      const res = await fetch(FORM_SUBMIT_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`FormSubmit ${res.status}: ${txt}`);
      }

      return { success: true, provider: 'formsubmit' };
    } catch (e) {
      console.error('FormSubmit failed:', e);
      return { success: false, error: e.message };
    }
  }

  // Главная функция, доступная глобально
  window.sendEmailWhishStyle = async function({ senderEmail, subject, message }) {
    if (!message || (message + '').trim().length < 3) {
      return { success: false, error: 'Message too short' };
    }
    if (senderEmail && !isValidEmail(senderEmail)) {
      return { success: false, error: 'Invalid sender email' };
    }

    // 1) Пытаемся через наш API (Vercel Nodemailer)
    const apiResult = await sendViaBackend({ senderEmail, subject, message });
    if (apiResult && apiResult.success) return apiResult;

    // 2) Fallback — FormSubmit к ящику vorobey469@yandex.ru
    return await sendViaFormSubmit({ senderEmail, subject, message });
  };
})();
