// Клиент Supabase для работы с объявлениями через Next.js API

(function() {
  // Функция для получения объявлений
  async function getAds(filters = {}) {
    console.log('getAds(): загрузка объявлений', filters);
    
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
        console.log('Получено объявлений:', data.ads.length);
        return data.ads;
      } else {
        throw new Error(data.error || 'Ошибка загрузки объявлений');
      }
    } catch (error) {
      console.error('Ошибка getAds:', error);
      throw error;
    }
  }

  // Функция для создания объявления
  async function createAd(adData) {
    console.log('createAd(): создание объявления', adData);
    
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
        console.log('Объявление создано:', data.ad);
        return data.ad;
      } else {
        throw new Error(data.error || 'Ошибка создания объявления');
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

  // Функция для удаления объявления
  async function deleteAd(adId) {
    console.log('deleteAd(): удаление объявления', adId);
    
    try {
      // Получаем Telegram ID пользователя
      const tgId = tg.initDataUnsafe?.user?.id;
      
      console.log('deleteAd(): tgId =', tgId);
      
      if (!tgId) {
        const errorMsg = 'Не удалось получить ваш Telegram ID. Откройте приложение через бота.';
        console.error('deleteAd():', errorMsg);
        throw new Error(errorMsg);
      }
      
      const url = `/api/ads?id=${adId}&tgId=${tgId}`;
      console.log('deleteAd(): запрос к', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('deleteAd(): response status =', response.status);
      
      const data = await response.json();
      console.log('deleteAd(): response data =', data);
      
      if (data.success) {
        console.log('deleteAd(): объявление успешно удалено:', adId);
        return true;
      } else {
        const errorMsg = data.error || 'Ошибка удаления объявления';
        console.error('deleteAd(): ошибка от сервера:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('deleteAd(): критическая ошибка:', error);
      throw error;
    }
  }

  // Функция для закрепления/откrepления объявления
  async function togglePinAd(adId, shouldPin) {
    console.log('togglePinAd(): изменение статуса закрепления', adId, shouldPin);
    
    try {
      // Получаем Telegram ID пользователя
      const tgId = tg.initDataUnsafe?.user?.id;
      
      console.log('togglePinAd(): tgId =', tgId);
      
      if (!tgId) {
        const errorMsg = 'Не удалось получить ваш Telegram ID. Откройте приложение через бота.';
        console.error('togglePinAd():', errorMsg);
        throw new Error(errorMsg);
      }
      
      const requestBody = {
        id: adId,
        tgId: tgId,
        is_pinned: shouldPin,
        pinned_until: shouldPin ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
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
