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

  // Экспортируем функции в глобальную область
  window.SupabaseClient = { getAds, createAd, sendEmail };
  
  console.log('✅ Supabase Client инициализирован');
})();
