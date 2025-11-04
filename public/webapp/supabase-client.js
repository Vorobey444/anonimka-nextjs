// Клиент Supabase для работы с анкетыми и чатами через Next.js API

(function() {
  // Настройки Supabase (публичные ключи)
  const SUPABASE_URL = 'https://vcxknlntcvcdowdohblr.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeGtubG50Y3ZjZG93ZG9oYmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1NDk3NjMsImV4cCI6MjA0NjEyNTc2M30.TcBhgBh9DQ5PzbcSl2eWxHxJBwBVnlv_JmR9Bfin-P8';
  
  // Создаём Supabase клиент
  const supabase = window.supabase?.createClient ? 
    window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) :
    {
      from: (table) => ({
        select: () => ({ data: null, error: new Error('Supabase SDK не загружен') }),
        insert: () => ({ data: null, error: new Error('Supabase SDK не загружен') }),
        update: () => ({ data: null, error: new Error('Supabase SDK не загружен') }),
        delete: () => ({ data: null, error: new Error('Supabase SDK не загружен') })
      })
    };
  
  // Экспортируем supabase в глобальную область для использования в app.js
  window.supabase = supabase;
  console.log('✅ Supabase client доступен:', !!window.supabase);
  
  // Функция для получения анкет
  async function getAds(filters = {}) {
    console.log('getAds(): загрузка анкет', filters);
    
    try {
      // Формируем query параметры
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.country) params.append('country', filters.country);
      
      const url = `/api/ads${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Запрос к API:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        console.log('Получено анкет:', data.ads.length);
        return data.ads;
      } else {
        throw new Error(data.error || 'Ошибка загрузки анкет');
      }
    } catch (error) {
      console.error('Ошибка getAds:', error);
      throw error;
    }
  }

  // Функция для создания анкеты
  async function createAd(adData) {
    console.log('createAd(): создание анкеты', adData);
    
    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('анкету создано:', data.ad);
        return data.ad;
      } else {
        throw new Error(data.error || 'Ошибка создания анкеты');
      }
    } catch (error) {
      console.error('Ошибка createAd:', error);
      throw error;
    }
  }

  // Функция отправки email (заглушка, используйте /api/send-email)
  async function sendEmail(payload) {
    console.log('sendEmail(): используйте /api/send-email');
    return { success: true };
  }

  // Функция для удаления анкеты
  async function deleteAd(adId) {
    console.log('deleteAd(): удаление анкеты', adId);
    
    try {
      // Получаем Telegram ID пользователя из WebApp или localStorage
      let tgId = tg.initDataUnsafe?.user?.id;
      
      // Если не нашли в WebApp, пробуем localStorage (для QR/Login Widget авторизации)
      if (!tgId) {
        const userData = localStorage.getItem('telegram_user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            tgId = user.id;
            console.log('deleteAd(): tgId получен из localStorage =', tgId);
          } catch (e) {
            console.error('deleteAd(): ошибка парсинга localStorage:', e);
          }
        }
      } else {
        console.log('deleteAd(): tgId получен из WebApp =', tgId);
      }
      
      if (!tgId) {
        const errorMsg = 'Не удалось получить ваш Telegram ID. Откройте приложение через бота.';
        console.error('deleteAd():', errorMsg);
        throw new Error(errorMsg);
      }
      
      const url = `/api/ads`;
      const requestBody = {
        id: adId,
        tgId: tgId
      };
      
      console.log('deleteAd(): запрос к', url);
      console.log('deleteAd(): тело запроса:', requestBody);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('deleteAd(): response status =', response.status);
      
      const data = await response.json();
      console.log('deleteAd(): response data =', data);
      
      if (data.success) {
        console.log('deleteAd(): анкету успешно удалено:', adId);
        return true;
      } else {
        const errorMsg = data.error || 'Ошибка удаления анкеты';
        console.error('deleteAd(): ошибка от сервера:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('deleteAd(): критическая ошибка:', error);
      throw error;
    }
  }

  // Функция для закрепления/откrepления анкеты
  async function togglePinAd(adId, shouldPin) {
    console.log('togglePinAd(): изменение статуса закрепления', adId, shouldPin);
    
    try {
      // Получаем Telegram ID пользователя из WebApp или localStorage
      let tgId = tg.initDataUnsafe?.user?.id;
      
      // Если не нашли в WebApp, пробуем localStorage (для QR/Login Widget авторизации)
      if (!tgId) {
        const userData = localStorage.getItem('telegram_user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            tgId = user.id;
            console.log('togglePinAd(): tgId получен из localStorage =', tgId);
          } catch (e) {
            console.error('togglePinAd(): ошибка парсинга localStorage:', e);
          }
        }
      } else {
        console.log('togglePinAd(): tgId получен из WebApp =', tgId);
      }
      
      if (!tgId) {
        const errorMsg = 'Не удалось получить ваш Telegram ID. Откройте приложение через бота.';
        console.error('togglePinAd():', errorMsg);
        throw new Error(errorMsg);
      }
      
      const requestBody = {
        id: adId,
        tgId: tgId,
        is_pinned: shouldPin,
        pinned_until: shouldPin ? new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString() : null // 1 час для тестирования
      };
      
      console.log('togglePinAd(): request body =', requestBody);
      
      const response = await fetch(`/api/ads`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('togglePinAd(): response status =', response.status);
      
      const data = await response.json();
      console.log('togglePinAd(): response data =', data);
      
      if (data.success) {
        console.log('togglePinAd(): статус закрепления изменен:', data.ad);
        return true;
      } else {
        const errorMsg = data.error || 'Ошибка изменения статуса';
        console.error('togglePinAd(): ошибка от сервера:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('togglePinAd(): критическая ошибка:', error);
      throw error;
    }
  }

  // Экспортируем функции в глобальную область
  window.SupabaseClient = { getAds, createAd, sendEmail, deleteAd, togglePinAd };
  
  console.log('✅ Supabase Client инициализирован');
})();


