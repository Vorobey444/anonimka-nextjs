package kz.anonimka.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
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
    private lateinit var emailInputCard: View
    private lateinit var codeInput: EditText
    private lateinit var codeInputCard: View
    private lateinit var sendCodeButton: Button
    private lateinit var verifyButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var titleText: TextView
    private lateinit var subtitleText: TextView
    
    private var currentEmail: String = ""
    private val API_BASE_URL = "https://anonimka.kz"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_email_auth)

        emailInput = findViewById(R.id.emailInput)
        emailInputCard = findViewById(R.id.emailInputCard)
        codeInput = findViewById(R.id.codeInput)
        codeInputCard = findViewById(R.id.codeInputCard)
        sendCodeButton = findViewById(R.id.sendCodeButton)
        verifyButton = findViewById(R.id.verifyButton)
        progressBar = findViewById(R.id.progressBar)
        titleText = findViewById(R.id.titleText)
        subtitleText = findViewById(R.id.subtitleText)

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
        val prefs = getSharedPreferences("anonimka_auth", MODE_PRIVATE)
        val displayNickname = userData.optString("displayNickname", "")
        
        prefs.edit().apply {
            putString("user_token", userToken)
            putString("email", userData.optString("email", ""))
            putString("auth_method", "email")
            putLong("auth_time", System.currentTimeMillis())
            putInt("user_id", userData.optInt("id", 0))
            putBoolean("is_premium", userData.optBoolean("isPremium", false))
            
            // Сохраняем никнейм если он есть
            if (displayNickname.isNotEmpty()) {
                putString("display_nickname", displayNickname)
                android.util.Log.d("EmailAuth", "✅ Saved nickname: $displayNickname")
            }
            
            apply()
        }
        
        android.util.Log.d("EmailAuth", "✅ User token saved to SharedPreferences")
    }
}
