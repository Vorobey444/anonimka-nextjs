// Тестовый скрипт для проверки API
const testEmailAPI = async () => {
  console.log('🧪 Тестируем Email API...');
  
  const testData = {
    senderEmail: 'test@example.com',
    subject: 'Тест API Anonimka.Online',
    message: `Тестовое сообщение отправленное в ${new Date().toLocaleString('ru-RU')}

Это автоматический тест email API системы Anonimka.Online.

Система использует:
- Next.js API Routes  
- Nodemailer с Yandex SMTP
- Те же настройки что и whish.online
- Vercel Serverless Functions

Отправитель: wish.online@yandex.kz
Получатель: vorobey469@yandex.ru`
  };

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ УСПЕХ! Email API работает:', result);
      console.log('📧 MessageId:', result.messageId);
      console.log('💌 Сообщение:', result.message);
    } else {
      console.error('❌ ОШИБКА API:', result);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ СЕТЕВАЯ ОШИБКА:', error);
    return { success: false, error: error.message };
  }
};

// Запускаем тест
console.log('🚀 Anonimka.Online Email API Tester');
console.log('===================================');
testEmailAPI();