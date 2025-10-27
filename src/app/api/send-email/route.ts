import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    console.log("[EMAIL API] Получен запрос на отправку письма");
    
    const { senderEmail, subject, message } = await req.json();
    
    console.log("[EMAIL API] Данные:", {
      senderEmail,
      subject: subject || "Сообщение с anonimka.online",
      messageLength: message?.length
    });
    
    // Валидация
    if (!senderEmail || !message) {
      console.log("[EMAIL API] Ошибка: отсутствует email или message");
      return NextResponse.json(
        { success: false, error: "Требуются поля email и message" },
        { status: 400 }
      );
    }

    // Получаем SMTP настройки из переменных окружения
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SUPPORT_TO } = process.env;
    
    console.log("[EMAIL API] SMTP настройки:", {
      SMTP_HOST: !!SMTP_HOST,
      SMTP_PORT: !!SMTP_PORT, 
      SMTP_USER: !!SMTP_USER,
      SMTP_PASS: !!SMTP_PASS,
      SUPPORT_TO
    });

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.error("[EMAIL API] Не настроены SMTP переменные");
      return NextResponse.json(
        { success: false, error: "SMTP настройки не сконфигурированы" },
        { status: 500 }
      );
    }

    // Создаем transporter для nodemailer (точно как в whish.online)
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true для 465, false для других портов
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Формируем содержимое письма
    const emailContent = `
От: ${senderEmail}
Тема: ${subject || 'Сообщение с anonimka.online'}
Время отправки: ${new Date().toLocaleString('ru-RU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric', 
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})}

═══════════════════════════════════
СООБЩЕНИЕ:
═══════════════════════════════════

${message}

═══════════════════════════════════
Это письмо отправлено с сайта anonimka.online
Для ответа клиенту используйте адрес: ${senderEmail}
    `;

    // Настройки письма
    const mailOptions = {
      from: `"Anonimka.Online" <${SMTP_USER}>`,
      to: SUPPORT_TO || "vorobey469@yandex.ru",
      subject: `[ANONIMKA] ${subject || 'Новое сообщение'}`,
      replyTo: senderEmail,
      text: emailContent,
    };

    console.log("[EMAIL API] Отправляем письмо...");
    
    // Отправляем письмо
    const result = await transporter.sendMail(mailOptions);
    
    console.log("[EMAIL API] Письмо успешно отправлено:", result.messageId);
    
    return NextResponse.json({
      success: true,
      message: "Письмо успешно отправлено! Мы свяжемся с вами в ближайшее время.",
      messageId: result.messageId
    });

  } catch (error: any) {
    console.error("[EMAIL API] Ошибка при отправке письма:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Ошибка при отправке письма",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Обработка OPTIONS запросов для CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}