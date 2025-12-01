/**
 * Firebase Cloud Messaging utility для отправки push уведомлений
 * Используется для уведомления email пользователей о новых сообщениях
 */

import admin from 'firebase-admin';

// Инициализация Firebase Admin SDK (только один раз)
if (!admin.apps.length) {
  try {
    // Credentials из environment variables
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not configured, push notifications disabled');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

interface PushNotificationData {
  title: string;
  body: string;
  chatId: string;
  senderNickname?: string;
}

/**
 * Отправить push уведомление на устройство
 */
export async function sendPushNotification(
  fcmToken: string,
  data: PushNotificationData
): Promise<boolean> {
  if (!admin.apps.length) {
    console.warn('[FCM] Firebase not initialized, skipping push');
    return false;
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: data.title,
        body: data.body,
      },
      data: {
        chatId: data.chatId,
        senderNickname: data.senderNickname || 'Аноним',
        type: 'new_message',
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'chat_messages',
          sound: 'default',
          priority: 'high' as const,
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('[FCM] ✅ Push notification sent:', response);
    return true;
  } catch (error: any) {
    console.error('[FCM] ❌ Push notification error:', error);
    
    // Если токен невалидный - он будет удален автоматически
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log('[FCM] Invalid token detected, should be removed from DB');
    }
    
    return false;
  }
}

/**
 * Отправить push уведомление о новом сообщении
 */
export async function sendNewMessagePush(
  fcmToken: string,
  chatId: string,
  senderNickname: string,
  messagePreview: string
): Promise<boolean> {
  const title = `💬 Новое сообщение от ${senderNickname}`;
  const body = messagePreview.length > 100 
    ? messagePreview.substring(0, 100) + '...' 
    : messagePreview;

  return sendPushNotification(fcmToken, {
    title,
    body,
    chatId,
    senderNickname,
  });
}
