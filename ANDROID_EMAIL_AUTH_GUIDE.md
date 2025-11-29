# Android Email Authentication - Руководство по интеграции

## Обзор

Android приложение использует Email авторизацию вместо Telegram ID. Все функции работают идентично Telegram версии.

## Архитектура

```
┌─────────────────┐
│  Android App    │
│  (Email Auth)   │
└────────┬────────┘
         │
         │ 1. POST /api/auth/email (send-code)
         ▼
┌─────────────────┐
│  Vercel API     │
│  (Next.js)      │
└────────┬────────┘
         │ 2. Отправка кода на email
         ▼
┌─────────────────┐
│  Email Service  │
│  (nodemailer)   │
└─────────────────┘
         │
         │ 3. Пользователь вводит код
         ▼
┌─────────────────┐
│  Android App    │
└────────┬────────┘
         │ 4. POST /api/auth/email (verify-code)
         ▼
┌─────────────────┐
│  Vercel API     │
│  Создает user   │
│  в БД           │
└────────┬────────┘
         │ 5. Возвращает user_token
         ▼
┌─────────────────┐
│  Android App    │
│  Сохраняет      │
│  в localStorage │
└─────────────────┘
```

## API Endpoints

### 1. Отправка кода подтверждения

**Endpoint:** `POST /api/auth/email`

**Request:**
```json
{
  "action": "send-code",
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Код отправлен на email",
  "isNewUser": true  // или false, если пользователь уже существует
}
```

**Response (Error):**
```json
{
  "error": "Неверный формат email"
}
```

### 2. Проверка кода и вход

**Endpoint:** `POST /api/auth/email`

**Request:**
```json
{
  "action": "verify-code",
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "isNewUser": false,
  "user": {
    "id": 12345,
    "email": "user@example.com",
    "userToken": "abc123def456...",  // ВАЖНО: сохранить это!
    "isPremium": false,
    "premiumUntil": null,
    "premiumSource": null,
    "authMethod": "email"
  }
}
```

**Response (Error):**
```json
{
  "error": "Неверный код"
}
// или
{
  "error": "Код истек. Запросите новый код."
}
```

### 3. Проверка авторизации

**Endpoint:** `GET /api/auth/email?token={userToken}`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 12345,
    "email": "user@example.com",
    "userToken": "abc123...",
    "isPremium": false,
    "authMethod": "email",
    "lastLogin": "2025-11-29T10:00:00Z"
  }
}
```

## Интеграция в Android (Kotlin)

### 1. Layout для Email авторизации

`res/layout/activity_email_auth.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <EditText
        android:id="@+id/emailInput"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Email"
        android:inputType="textEmailAddress" />

    <Button
        android:id="@+id/sendCodeButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Отправить код" />

    <EditText
        android:id="@+id/codeInput"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Код из email"
        android:inputType="number"
        android:visibility="gone" />

    <Button
        android:id="@+id/verifyButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Войти"
        android:visibility="gone" />
</LinearLayout>
```

### 2. EmailAuthActivity.kt

```kotlin
package kz.anonimka.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class EmailAuthActivity : AppCompatActivity() {
    private lateinit var emailInput: EditText
    private lateinit var codeInput: EditText
    private lateinit var sendCodeButton: Button
    private lateinit var verifyButton: Button
    
    private var currentEmail: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_email_auth)

        emailInput = findViewById(R.id.emailInput)
        codeInput = findViewById(R.id.codeInput)
        sendCodeButton = findViewById(R.id.sendCodeButton)
        verifyButton = findViewById(R.id.verifyButton)

        sendCodeButton.setOnClickListener {
            sendVerificationCode()
        }

        verifyButton.setOnClickListener {
            verifyCode()
        }
    }

    private fun sendVerificationCode() {
        val email = emailInput.text.toString().trim()
        
        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Введите корректный email", Toast.LENGTH_SHORT).show()
            return
        }

        currentEmail = email
        sendCodeButton.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("https://anonimka.kz/api/auth/email")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val requestBody = JSONObject().apply {
                    put("action", "send-code")
                    put("email", email)
                }

                connection.outputStream.write(requestBody.toString().toByteArray())

                val responseCode = connection.responseCode
                val response = connection.inputStream.bufferedReader().readText()
                val jsonResponse = JSONObject(response)

                withContext(Dispatchers.Main) {
                    if (responseCode == 200 && jsonResponse.getBoolean("success")) {
                        showCodeInput()
                        Toast.makeText(
                            this@EmailAuthActivity,
                            "Код отправлен на $email",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        val error = jsonResponse.optString("error", "Ошибка отправки кода")
                        Toast.makeText(this@EmailAuthActivity, error, Toast.LENGTH_SHORT).show()
                        sendCodeButton.isEnabled = true
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@EmailAuthActivity,
                        "Ошибка: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                    sendCodeButton.isEnabled = true
                }
            }
        }
    }

    private fun verifyCode() {
        val code = codeInput.text.toString().trim()
        
        if (code.length != 6) {
            Toast.makeText(this, "Введите 6-значный код", Toast.LENGTH_SHORT).show()
            return
        }

        verifyButton.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("https://anonimka.kz/api/auth/email")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val requestBody = JSONObject().apply {
                    put("action", "verify-code")
                    put("email", currentEmail)
                    put("code", code)
                }

                connection.outputStream.write(requestBody.toString().toByteArray())

                val responseCode = connection.responseCode
                val response = connection.inputStream.bufferedReader().readText()
                val jsonResponse = JSONObject(response)

                withContext(Dispatchers.Main) {
                    if (responseCode == 200 && jsonResponse.getBoolean("success")) {
                        val userData = jsonResponse.getJSONObject("user")
                        val userToken = userData.getString("userToken")
                        
                        // Сохраняем userToken
                        saveUserToken(userToken, userData)
                        
                        // Переходим к MainActivity
                        val intent = Intent(this@EmailAuthActivity, MainActivity::class.java)
                        intent.putExtra("userToken", userToken)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    } else {
                        val error = jsonResponse.optString("error", "Неверный код")
                        Toast.makeText(this@EmailAuthActivity, error, Toast.LENGTH_SHORT).show()
                        verifyButton.isEnabled = true
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@EmailAuthActivity,
                        "Ошибка: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                    verifyButton.isEnabled = true
                }
            }
        }
    }

    private fun showCodeInput() {
        emailInput.visibility = View.GONE
        sendCodeButton.visibility = View.GONE
        codeInput.visibility = View.VISIBLE
        verifyButton.visibility = View.VISIBLE
    }

    private fun saveUserToken(userToken: String, userData: JSONObject) {
        val prefs = getSharedPreferences("anonimka_auth", MODE_PRIVATE)
        prefs.edit().apply {
            putString("user_token", userToken)
            putString("email", userData.getString("email"))
            putString("auth_method", "email")
            putLong("auth_time", System.currentTimeMillis())
            apply()
        }
        
        android.util.Log.d("Anonimka", "✅ Email auth successful: $userToken")
    }
}
```

### 3. Обновление MainActivity.kt

```kotlin
// Добавить в MainActivity

// Проверка авторизации при старте
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Проверяем сохраненную авторизацию
    val prefs = getSharedPreferences("anonimka_auth", MODE_PRIVATE)
    val userToken = prefs.getString("user_token", null)
    val authMethod = prefs.getString("auth_method", "telegram")
    
    if (userToken == null) {
        // Нет авторизации - перенаправляем на EmailAuthActivity
        val intent = Intent(this, EmailAuthActivity::class.java)
        startActivity(intent)
        finish()
        return
    }
    
    // Есть токен - загружаем WebView
    setContentView(R.layout.activity_main)
    
    webView = findViewById(R.id.webView)
    setupWebView(userToken)
}

private fun setupWebView(userToken: String) {
    // JavaScript interface для передачи токена в WebApp
    webView.addJavascriptInterface(object {
        @android.webkit.JavascriptInterface
        fun getUserToken(): String {
            return userToken
        }
        
        @android.webkit.JavascriptInterface
        fun getAuthMethod(): String {
            val prefs = getSharedPreferences("anonimka_auth", MODE_PRIVATE)
            return prefs.getString("auth_method", "telegram") ?: "telegram"
        }
    }, "AndroidAuth")
    
    // Настройка WebView
    webView.settings.apply {
        javaScriptEnabled = true
        domStorageEnabled = true
        databaseEnabled = true
    }
    
    webView.webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            
            // Инжектим userToken в localStorage
            webView.evaluateJavascript("""
                (function() {
                    try {
                        localStorage.setItem('user_token', '${userToken}');
                        localStorage.setItem('auth_method', 'email');
                        console.log('✅ User token injected from Android');
                    } catch(e) {
                        console.error('❌ Error injecting token:', e);
                    }
                })();
            """.trimIndent(), null)
        }
    }
    
    webView.loadUrl("https://anonimka.kz/webapp")
}
```

## Frontend Integration (webapp)

### Определение типа авторизации

`public/webapp/app.js`:
```javascript
// Проверка типа авторизации
function detectAuthMethod() {
    // Android app передает через AndroidAuth интерфейс
    if (typeof AndroidAuth !== 'undefined') {
        const authMethod = AndroidAuth.getAuthMethod();
        if (authMethod === 'email') {
            const userToken = AndroidAuth.getUserToken();
            localStorage.setItem('user_token', userToken);
            localStorage.setItem('auth_method', 'email');
            return { method: 'email', token: userToken };
        }
    }
    
    // Telegram WebApp
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser && tgUser.id) {
        return { method: 'telegram', id: tgUser.id };
    }
    
    // Проверяем localStorage
    const savedToken = localStorage.getItem('user_token');
    const savedMethod = localStorage.getItem('auth_method');
    if (savedToken && savedMethod) {
        return { method: savedMethod, token: savedToken };
    }
    
    return { method: 'unknown' };
}

// Использование
const auth = detectAuthMethod();

if (auth.method === 'email') {
    // Email пользователь
    currentUserToken = auth.token;
    // Все операции через userToken
} else if (auth.method === 'telegram') {
    // Telegram пользователь
    currentUserToken = generateUserToken(auth.id);
}
```

## Тестирование

### 1. Отправка кода

```bash
curl -X POST https://anonimka.kz/api/auth/email \
  -H "Content-Type: application/json" \
  -d '{"action":"send-code","email":"test@example.com"}'
```

### 2. Проверка кода

```bash
curl -X POST https://anonimka.kz/api/auth/email \
  -H "Content-Type: application/json" \
  -d '{"action":"verify-code","email":"test@example.com","code":"123456"}'
```

### 3. Проверка токена

```bash
curl "https://anonimka.kz/api/auth/email?token=abc123def456..."
```

## Важные моменты

1. **userToken** - основной идентификатор, храните его безопасно
2. **Нет паролей** - только одноразовые коды на email
3. **Коды живут 10 минут** - успейте ввести
4. **Email уникален** - один email = один аккаунт
5. **Все функции идентичны** - создание анкет, чаты, премиум - все работает

## Следующие шаги

- [ ] Создать EmailAuthActivity
- [ ] Обновить MainActivity для инжекции userToken
- [ ] Обновить frontend для определения auth_method
- [ ] Протестировать создание анкеты
- [ ] Протестировать чаты
- [ ] Протестировать premium функции
