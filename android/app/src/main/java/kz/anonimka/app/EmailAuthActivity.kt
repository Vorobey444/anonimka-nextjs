package kz.anonimka.app

import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class EmailAuthActivity : AppCompatActivity() {
    private lateinit var emailInput: EditText
    private lateinit var emailInputCard: View
    private lateinit var codeInput: EditText
    private lateinit var codeInputCard: View
    private lateinit var sendCodeButton: Button
    private lateinit var verifyButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var titleText: TextView
    private lateinit var subtitleText: TextView
    private lateinit var rootLayout: View
    
    private var currentEmail: String = ""
    private val API_BASE_URL = "https://anonimka.kz"
    
    // Используем тот же EncryptedSharedPreferences что и MainActivity
    private val authPrefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(this)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            
            EncryptedSharedPreferences.create(
                this,
                "anonimka_auth_secure",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            android.util.Log.e("EmailAuth", "Failed to create EncryptedSharedPreferences: ${e.message}")
            getSharedPreferences("anonimka_auth", MODE_PRIVATE)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Проверяем, авторизован ли уже пользователь
        if (isUserLoggedIn()) {
            android.util.Log.d("EmailAuth", "✅ Пользователь уже авторизован, переходим в MainActivity")
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        setContentView(R.layout.activity_email_auth)

        rootLayout = findViewById(R.id.root_layout_email_auth)
        emailInput = findViewById(R.id.emailInput)
        emailInputCard = findViewById(R.id.emailInputCard)
        codeInput = findViewById(R.id.codeInput)
        codeInputCard = findViewById(R.id.codeInputCard)
        sendCodeButton = findViewById(R.id.sendCodeButton)
        verifyButton = findViewById(R.id.verifyButton)
        progressBar = findViewById(R.id.progressBar)
        titleText = findViewById(R.id.titleText)
        subtitleText = findViewById(R.id.subtitleText)

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            windowInsets
        }

        sendCodeButton.setOnClickListener {
            sendVerificationCode()
        }

        verifyButton.setOnClickListener {
            verifyCode()
        }

        // Google Sign-In button
        findViewById<View>(R.id.googleSignInButton).setOnClickListener {
            startActivity(Intent(this, GoogleAuthActivity::class.java))
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
        progressBar.visibility = View.VISIBLE

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("$API_BASE_URL/api/auth/email")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true
                connection.connectTimeout = 10000
                connection.readTimeout = 10000

                val requestBody = JSONObject().apply {
                    put("action", "send-code")
                    put("email", email)
                }

                connection.outputStream.write(requestBody.toString().toByteArray())

                val responseCode = connection.responseCode
                val response = if (responseCode == 200) {
                    connection.inputStream.bufferedReader().readText()
                } else {
                    connection.errorStream?.bufferedReader()?.readText() ?: "{}"
                }
                val jsonResponse = JSONObject(response)

                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    
                    if (responseCode == 200 && jsonResponse.optBoolean("success", false)) {
                        showCodeInput()
                        val isNewUser = jsonResponse.optBoolean("isNewUser", false)
                        val message = if (isNewUser) {
                            "Код отправлен на $email\nВы создаёте новый аккаунт"
                        } else {
                            "Код отправлен на $email"
                        }
                        Toast.makeText(this@EmailAuthActivity, message, Toast.LENGTH_LONG).show()
                    } else {
                        val error = jsonResponse.optString("error", "Ошибка отправки кода")
                        Toast.makeText(this@EmailAuthActivity, error, Toast.LENGTH_SHORT).show()
                        sendCodeButton.isEnabled = true
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("EmailAuth", "Error sending code", e)
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    Toast.makeText(
                        this@EmailAuthActivity,
                        "Ошибка подключения: ${e.message}",
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
        progressBar.visibility = View.VISIBLE

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("$API_BASE_URL/api/auth/email")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true
                connection.connectTimeout = 10000
                connection.readTimeout = 10000

                val requestBody = JSONObject().apply {
                    put("action", "verify-code")
                    put("email", currentEmail)
                    put("code", code)
                }

                connection.outputStream.write(requestBody.toString().toByteArray())

                val responseCode = connection.responseCode
                val response = if (responseCode == 200) {
                    connection.inputStream.bufferedReader().readText()
                } else {
                    connection.errorStream?.bufferedReader()?.readText() ?: "{}"
                }
                val jsonResponse = JSONObject(response)

                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    
                    if (responseCode == 200 && jsonResponse.optBoolean("success", false)) {
                        val userData = jsonResponse.getJSONObject("user")
                        val userToken = userData.getString("userToken")
                        val isNewUser = jsonResponse.optBoolean("isNewUser", false)
                        
                        // Сохраняем userToken
                        saveUserToken(userToken, userData)
                        
                        android.util.Log.d("EmailAuth", "✅ Login successful: $userToken")
                        
                        // Переходим к MainActivity
                        val intent = Intent(this@EmailAuthActivity, MainActivity::class.java)
                        intent.putExtra("userToken", userToken)
                        intent.putExtra("isNewUser", isNewUser)
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
                android.util.Log.e("EmailAuth", "Error verifying code", e)
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    Toast.makeText(
                        this@EmailAuthActivity,
                        "Ошибка подключения: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                    verifyButton.isEnabled = true
                }
            }
        }
    }

    private fun showCodeInput() {
        // Скрываем поля email
        emailInputCard.visibility = View.GONE
        sendCodeButton.visibility = View.GONE
        
        // Показываем поля кода
        codeInputCard.visibility = View.VISIBLE
        verifyButton.visibility = View.VISIBLE
        verifyButton.isEnabled = true
        
        // Обновляем текст
        titleText.text = "Введите код"
        subtitleText.text = "Код отправлен на $currentEmail"
        
        // Фокус на поле ввода кода
        codeInput.requestFocus()
        
        // Показываем клавиатуру
        val imm = getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
        imm.showSoftInput(codeInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
    }

    private fun saveUserToken(userToken: String, userData: JSONObject) {
        val displayNickname = userData.optString("displayNickname", "")
        
        authPrefs.edit().apply {
            putString("user_token", userToken)
            putString("email", userData.optString("email", ""))
            putString("auth_method", "email")
            putLong("auth_time", System.currentTimeMillis())
            putInt("user_id", userData.optInt("id", 0))
            putBoolean("is_premium", userData.optBoolean("isPremium", false))
            
            // Сохраняем никнейм если он есть
            if (displayNickname.isNotEmpty()) {
                putString("display_nickname", displayNickname)
                if (BuildConfig.DEBUG) {
                    android.util.Log.d("EmailAuth", "✅ Saved nickname: $displayNickname")
                }
            }
            
            apply()
        }
        
        if (BuildConfig.DEBUG) {
            android.util.Log.d("EmailAuth", "✅ User token saved to EncryptedSharedPreferences")
        }
        
        // Предлагаем включить биометрию после первой авторизации
        offerBiometricSetup()
    }
    
    private fun offerBiometricSetup() {
        // Проверяем, не настроен ли уже PIN-код
        if (authPrefs.contains("pin_code")) {
            return // PIN уже настроен
        }
        
        // Проверяем, не предлагали ли уже (чтобы не спамить)
        if (authPrefs.getBoolean("pin_offer_shown", false)) {
            return // Уже предлагали
        }
        
        // Помечаем что предложили
        authPrefs.edit().putBoolean("pin_offer_shown", true).apply()
        
        // Предлагаем настроить PIN + биометрию
        val biometricHelper = BiometricAuthHelper(this)
        val biometricText = if (biometricHelper.isBiometricAvailable()) {
            "\n\nТакже вы сможете использовать отпечаток пальца или Face ID."
        } else {
            ""
        }
        
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("🔐 Защитите свой аккаунт")
            .setMessage("Установите PIN-код из 4 цифр для защиты входа в приложение.$biometricText")
            .setPositiveButton("Настроить") { _, _ ->
                // Открываем экран создания PIN
                val intent = android.content.Intent(this, PinLockActivity::class.java)
                startActivity(intent)
            }
            .setNegativeButton("Позже") { dialog, _ ->
                dialog.dismiss()
            }
            .setCancelable(true)
            .show()
    }
    
    /**
     * Проверяем, авторизован ли пользователь
     */
    private fun isUserLoggedIn(): Boolean {
        val userToken = authPrefs.getString("user_token", null)
        val authMethod = authPrefs.getString("auth_method", null)
        
        android.util.Log.d("EmailAuth", "isUserLoggedIn check: userToken=${userToken?.take(16)}..., authMethod=$authMethod")
        
        // Если есть токен - пользователь авторизован
        return !userToken.isNullOrEmpty()
    }
}
