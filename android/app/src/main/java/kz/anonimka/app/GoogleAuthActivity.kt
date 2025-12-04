package kz.anonimka.app

import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class GoogleAuthActivity : AppCompatActivity() {
    private lateinit var progressBar: ProgressBar
    private lateinit var rootLayout: View
    private lateinit var titleText: TextView
    
    private val API_BASE_URL = "https://anonimka.kz"
    
    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var firebaseAuth: FirebaseAuth
    
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
            Log.e("GoogleAuth", "Failed to create EncryptedSharedPreferences: ${e.message}")
            getSharedPreferences("anonimka_auth", MODE_PRIVATE)
        }
    }
    
    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        handleGoogleSignInResult(task)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        setContentView(R.layout.activity_google_auth)

        rootLayout = findViewById(R.id.root_layout_google_auth)
        progressBar = findViewById(R.id.progressBar)
        titleText = findViewById(R.id.titleText)

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            windowInsets
        }

        // Инициализация Firebase Auth
        firebaseAuth = FirebaseAuth.getInstance()

        // Настройка Google Sign-In
        // ⚠️ ВАЖНО: Замените на ваш Web Client ID из Firebase Console
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("YOUR_WEB_CLIENT_ID_HERE") // TODO: Замените на ваш ID
            .requestEmail()
            .build()

        googleSignInClient = GoogleSignIn.getClient(this, gso)

        // Сразу запускаем Google Sign-In
        startGoogleSignIn()
    }

    private fun startGoogleSignIn() {
        progressBar.visibility = View.VISIBLE
        titleText.text = "Подключение к Google..."
        
        val signInIntent = googleSignInClient.signInIntent
        googleSignInLauncher.launch(signInIntent)
    }

    private fun handleGoogleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            Log.d("GoogleAuth", "✅ Google Sign-In успешен: ${account.email}")
            
            if (account.idToken != null) {
                firebaseAuthWithGoogle(account.idToken!!)
            } else {
                progressBar.visibility = View.GONE
                Toast.makeText(this, "Ошибка получения токена", Toast.LENGTH_SHORT).show()
                finish()
            }
        } catch (e: ApiException) {
            Log.e("GoogleAuth", "❌ Google Sign-In ошибка: ${e.statusCode}", e)
            progressBar.visibility = View.GONE
            Toast.makeText(this, "Google вход не удался", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    private fun firebaseAuthWithGoogle(idToken: String) {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        firebaseAuth.signInWithCredential(credential)
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    Log.d("GoogleAuth", "✅ Firebase авторизация успешна")
                    val user = firebaseAuth.currentUser
                    if (user != null && user.email != null) {
                        registerWithBackend(user.email!!, user.displayName, idToken)
                    } else {
                        progressBar.visibility = View.GONE
                        Toast.makeText(this, "Ошибка получения данных пользователя", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                } else {
                    Log.e("GoogleAuth", "❌ Firebase ошибка", task.exception)
                    progressBar.visibility = View.GONE
                    Toast.makeText(this, "Ошибка авторизации", Toast.LENGTH_SHORT).show()
                    finish()
                }
            }
    }

    private fun registerWithBackend(email: String, displayName: String?, googleIdToken: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("$API_BASE_URL/api/auth/google")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true
                connection.connectTimeout = 10000
                connection.readTimeout = 10000

                val requestBody = JSONObject().apply {
                    put("email", email)
                    put("displayName", displayName ?: "")
                    put("idToken", googleIdToken)
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
                        
                        // Сохраняем данные
                        authPrefs.edit().apply {
                            putString("user_token", userToken)
                            putString("email", email)
                            putString("auth_method", "google")
                            putLong("auth_time", System.currentTimeMillis())
                            if (displayName != null) {
                                putString("display_nickname", displayName)
                            }
                            apply()
                        }
                        
                        Log.d("GoogleAuth", "✅ Регистрация на бэкенде успешна")
                        
                        // Переходим к MainActivity
                        val intent = Intent(this@GoogleAuthActivity, MainActivity::class.java)
                        intent.putExtra("userToken", userToken)
                        intent.putExtra("isNewUser", isNewUser)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    } else {
                        val error = jsonResponse.optString("error", "Ошибка регистрации")
                        Toast.makeText(this@GoogleAuthActivity, error, Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e("GoogleAuth", "❌ Ошибка подключения", e)
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    Toast.makeText(
                        this@GoogleAuthActivity,
                        "Ошибка подключения: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
}
