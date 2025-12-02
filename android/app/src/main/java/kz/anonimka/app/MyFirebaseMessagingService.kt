package kz.anonimka.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Firebase Cloud Messaging Service для обработки Push-уведомлений
 */
class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCM_Service"
        private const val CHANNEL_ID = "chat_messages"
        private const val CHANNEL_NAME = "Сообщения чатов"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    /**
     * Вызывается когда приложение получает новый FCM токен
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "🔑 Новый FCM токен: ${token.take(20)}...")
        
        // Сохраняем токен локально
        val prefs = getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("fcm_token", token).apply()
        
        // Отправляем токен на сервер
        sendTokenToServer(token)
    }

    /**
     * Вызывается когда приложение получает новое уведомление
     */
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        
        Log.d(TAG, "📩 Получено уведомление от: ${message.from}")
        
        // Получаем данные из уведомления
        val notification = message.notification
        val data = message.data
        
        val title = notification?.title ?: data["title"] ?: "Новое сообщение"
        val body = notification?.body ?: data["body"] ?: ""
        val chatId = data["chatId"]
        val senderNickname = data["senderNickname"] ?: "Аноним"
        
        Log.d(TAG, "💬 Заголовок: $title")
        Log.d(TAG, "📝 Текст: $body")
        Log.d(TAG, "🆔 Chat ID: $chatId")
        
        // Показываем локальное уведомление
        showNotification(title, body, chatId)
    }

    /**
     * Создает канал уведомлений (требуется для Android 8.0+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Уведомления о новых сообщениях в чатах"
                enableVibration(true)
                enableLights(true)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
            
            Log.d(TAG, "✅ Notification channel created: $CHANNEL_ID")
        }
    }

    /**
     * Показывает локальное уведомление
     */
    private fun showNotification(title: String, body: String, chatId: String?) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Intent для открытия чата при клике на уведомление
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("openChat", chatId)
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Создаем уведомление
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification) // Нужна иконка
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()
        
        // Генерируем уникальный ID для уведомления
        val notificationId = chatId?.hashCode() ?: System.currentTimeMillis().toInt()
        
        notificationManager.notify(notificationId, notification)
        Log.d(TAG, "🔔 Уведомление показано: $notificationId")
    }

    /**
     * Отправляет FCM токен на сервер
     */
    private fun sendTokenToServer(token: String) {
        val prefs = getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
        val userToken = prefs.getString("user_token", null)
        
        if (userToken.isNullOrEmpty()) {
            Log.w(TAG, "⚠️ user_token не найден, FCM токен не отправлен на сервер")
            return
        }
        
        Log.d(TAG, "📤 Отправка FCM токена на сервер...")
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("https://anonimka.kz/api/fcm-token")
                val connection = url.openConnection() as HttpURLConnection
                
                connection.apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                    
                    val json = JSONObject().apply {
                        put("action", "register")
                        put("userToken", userToken)
                        put("fcmToken", token)
                    }
                    
                    outputStream.use { os ->
                        os.write(json.toString().toByteArray())
                    }
                    
                    val responseCode = connection.responseCode
                    if (responseCode == 200) {
                        Log.d(TAG, "✅ FCM токен успешно отправлен на сервер")
                    } else {
                        Log.e(TAG, "❌ Ошибка отправки FCM токена: $responseCode")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Ошибка при отправке FCM токена: ${e.message}", e)
            }
        }
    }
}
