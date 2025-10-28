// Упрощённый клиент Supabase (если будет нужен позже)
// Сейчас не используется напрямую, оставлен как заглушка для совместимости

(function() {
  const SUPABASE_URL = window.SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

  async function getAds() {
    console.log('getAds(): заглушка — вернём пустой список');
    return [];
  }

  async function createAd(ad) {
    console.log('createAd(): заглушка — просто логируем', ad);
    return { id: Date.now(), ...ad };
  }

  async function sendEmail(payload) {
    console.log('sendEmail(): заглушка — используйте /api/send-email');
    return { success: true };
  }

  window.SupabaseClient = { getAds, createAd, sendEmail };
})();
