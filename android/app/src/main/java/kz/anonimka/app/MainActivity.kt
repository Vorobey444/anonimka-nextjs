package kz.anonimka.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.util.Log
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.edit
import androidx.core.graphics.toColorInt
import androidx.core.net.toUri
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    companion object {
        private const val EMAIL_AUTH_REQUEST_CODE = 1001
        
        // Безопасное логирование только в DEBUG режиме
        private fun logDebug(tag: String, message: String) {
            if (BuildConfig.DEBUG) {
                android.util.Log.d(tag, message)
            }
        }
        
        private fun logError(tag: String, message: String, error: Throwable? = null) {
            if (BuildConfig.DEBUG) {
                if (error != null) {
                    android.util.Log.e(tag, message, error)
                } else {
                    android.util.Log.e(tag, message)
                }
            }
        }
    }

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private var fileUploadCallback: ValueCallback<Array<android.net.Uri>>? = null
    private var geolocationCallback: GeolocationPermissions.Callback? = null
    private var geolocationOrigin: String? = null

    // Авто-ретраи при сетевых ошибках WebView
    private var webRetryCount: Int = 0
    private var webMaxRetries: Int = 3
    private val webBaseDelayMs: Long = 1000

    // Разовая автоперезагрузка при смене сети
    private var lastNetworkType: String? = null
    private var networkReloadCooldownMs: Long = 60000 // 60 секунд
    private var lastNetworkReloadTs: Long = 0
    private var connectivityCallbackRegistered: Boolean = false

    // EncryptedSharedPreferences для безопасного хранения токенов
    private val authPrefs by lazy {
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
            // Fallback to regular SharedPreferences if encryption fails
            android.util.Log.e("Anonimka", "Failed to create EncryptedSharedPreferences: ${e.message}")
            getSharedPreferences("anonimka_auth", MODE_PRIVATE)
        }
    }

    // Launcher для запроса разрешений GPS
    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineLocation = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseLocation = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false

        if (fineLocation || coarseLocation) {
            // Разрешение получено
            geolocationCallback?.invoke(geolocationOrigin, true, false)
            android.util.Log.d("Anonimka", "✅ GPS permission granted")
        } else {
            geolocationCallback?.invoke(geolocationOrigin, false, false)
            Toast.makeText(this, "Разрешение на местоположение отклонено", Toast.LENGTH_SHORT).show()
        }
        geolocationCallback = null
        geolocationOrigin = null
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val data = result.data
            val uris = data?.let {
                if (it.clipData != null) {
                    val count = it.clipData!!.itemCount
                    Array(count) { index ->
                        it.clipData!!.getItemAt(index).uri
                    }
                } else {
                    it.data?.let { uri -> arrayOf(uri) }
                }
            }
            fileUploadCallback?.onReceiveValue(uris)
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (!allGranted) {
            Toast.makeText(this, "Необходимо разрешение для загрузки файлов", Toast.LENGTH_SHORT).show()
        }
    }

    // Launcher для запроса разрешения на уведомления (Android 13+)
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            android.util.Log.d("Anonimka", "✅ Notification permission granted")
        } else {
            android.util.Log.w("Anonimka", "⚠️ Notification permission denied")
            Toast.makeText(this, "Разрешите уведомления для получения сообщений", Toast.LENGTH_LONG).show()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        
        // Проверка PIN-кода при запуске
        if (!checkPinLockRequired()) {
            return // PIN экран открыт, ждем разблокировки
        }
        
        // Проверка безопасности приложения
        performSecurityChecks()
        
        // Запрос разрешения на уведомления для Android 13+
        requestNotificationPermission()

        android.util.Log.d("Anonimka", "onCreate called, savedInstanceState: ${savedInstanceState != null}")

        // Проверяем наличие сохранённой авторизации (для логирования)
        val savedToken = authPrefs.getString("user_token", null)
        val authMethod = authPrefs.getString("auth_method", "telegram")

        if (savedToken != null) {
            android.util.Log.d("Anonimka", "✅ Auth token found: ${savedToken.take(8)}..., method: $authMethod")
        } else {
            android.util.Log.d("Anonimka", "ℹ️ No saved token, WebApp will handle auth")
        }

        // Настраиваем обычный режим - черный статус бар и навигация
        window.statusBarColor = "#0a0a0f".toColorInt()
        window.navigationBarColor = "#0a0a0f".toColorInt()
        
        // Светлые иконки на черном фоне
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        // Получаем FCM токен для Push-уведомлений
        getFCMToken()
        
        // Проверяем обновления приложения в Google Play
        checkForAppUpdates()

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        swipeRefreshLayout.isEnabled = false
        // Фон корневого контейнера чёрный, чтобы верхний padding не давал белую полосу
        swipeRefreshLayout.setBackgroundColor("#0a0a0f".toColorInt())

        // Тёмная тема в WebView (если движок поддерживает FORCE_DARK)
        try {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                WebSettingsCompat.setForceDark(webView.settings, WebSettingsCompat.FORCE_DARK_ON)
            }
        } catch (_: Exception) {}

        // Оптимизации для Xiaomi (Mi 17 Pro и похожих моделей)
        try {
            val isXiaomi = android.os.Build.MANUFACTURER.equals("Xiaomi", ignoreCase = true)
            if (isXiaomi) {
                // Небольшие оптимизации рендеринга и прокрутки
                webView.settings.setOffscreenPreRaster(true)
                webView.isVerticalScrollBarEnabled = false
                webView.isHorizontalScrollBarEnabled = false
                webView.overScrollMode = android.view.View.OVER_SCROLL_NEVER

                // Добавим признак устройства в User-Agent (для тонких серверных адаптаций при необходимости)
                val ua = webView.settings.userAgentString
                if (!ua.contains("XiaomiMi17Pro")) {
                    webView.settings.userAgentString = ua + " XiaomiMi17Pro"
                }
            }
        } catch (_: Exception) {}

        // Обработка системных отступов на корневом контейнере (Samsung Fold корректнее отдаёт insets родителю)
        ViewCompat.setOnApplyWindowInsetsListener(swipeRefreshLayout) { view, windowInsets ->
            val statusBars = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars())
            val navigationBars = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars())
            val imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime())

            // Huawei/EMUI: иногда ime.bottom == 0 даже при видимой клавиатуре.
            val imeVisible = windowInsets.isVisible(WindowInsetsCompat.Type.ime())
            val computedImeFallback = if (imeVisible && imeInsets.bottom == 0) {
                // эвристика: разница между высотой корня и текущего view
                val rootH = view.rootView.height
                val vh = view.height
                val diff = (rootH - vh).coerceAtLeast(0)
                diff
            } else 0

            // Максимальный нижний отступ: навигация или клавиатура (учитываем fallback)
            val bottomPadding = listOf(navigationBars.bottom, imeInsets.bottom, computedImeFallback).maxOrNull() ?: 0

            // Верхний отступ: учитываем display cutout, если statusBars.top == 0
            val topFromInsets = statusBars.top
            val cutoutTop = WindowInsetsCompat.toWindowInsetsCompat(window.decorView.rootWindowInsets)
                .displayCutout?.safeInsetTop ?: 0
            val fallbackTopPx = (24 * resources.displayMetrics.density).toInt()
            val topPadding = when {
                topFromInsets > 0 -> topFromInsets
                cutoutTop > 0 -> cutoutTop
                else -> fallbackTopPx
            }

            view.setPadding(0, topPadding, 0, bottomPadding)

            android.util.Log.d(
                "Anonimka",
                "📐 Insets -> top=${topPadding} (raw=${topFromInsets}, cutout=${cutoutTop}), bottom=${bottomPadding} (nav=${navigationBars.bottom}, ime=${imeInsets.bottom}, imeVisible=${imeVisible}, imeFallback=${computedImeFallback})"
            )

            windowInsets
        }

        // Обработка кнопки "Назад"
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // Регистрируем callback на смену сети (разовая безопасная перезагрузка)
        registerNetworkChangeCallback()

        // Добавляем JavaScript Interface для связи с WebView (только для доверенных доменов)
        webView.addJavascriptInterface(object {
            private fun isAllowedDomain(): Boolean {
                val url = webView.url ?: return false
                return url.startsWith("https://ru.anonimka.kz") || 
                       url.startsWith("https://anonimka.kz")
            }

            @JavascriptInterface
            fun saveAuthData(userData: String) {
                if (!isAllowedDomain()) return
                authPrefs.edit {
                    putString("telegram_user", userData)
                    putLong("telegram_auth_time", System.currentTimeMillis())
                }
                if (BuildConfig.DEBUG) {
                    android.util.Log.d("Anonimka", "✅ Auth data saved")
                }
            }

            @JavascriptInterface
            fun getAuthData(): String {
                if (!isAllowedDomain()) return ""
                return authPrefs.getString("telegram_user", "") ?: ""
            }

            @JavascriptInterface
            fun getUserToken(): String {
                if (!isAllowedDomain()) return ""
                return authPrefs.getString("user_token", "") ?: ""
            }

            @JavascriptInterface
            fun getAuthMethod(): String {
                if (!isAllowedDomain()) return ""
                return authPrefs.getString("auth_method", "telegram") ?: "telegram"
            }

            @JavascriptInterface
            fun getEmail(): String {
                if (!isAllowedDomain()) return ""
                return authPrefs.getString("email", "") ?: ""
            }
            
            @JavascriptInterface
            fun getDisplayNickname(): String {
                if (!isAllowedDomain()) return ""
                return authPrefs.getString("display_nickname", "") ?: ""
            }
            
            @JavascriptInterface
            fun isAndroid(): Boolean {
                return true
            }
            
            @JavascriptInterface
            fun isBiometricAvailable(): Boolean {
                return BiometricAuthHelper.isAvailable(this@MainActivity)
            }
            
            @JavascriptInterface
            fun isBiometricEnabled(): Boolean {
                if (!isAllowedDomain()) return false
                return authPrefs.getBoolean("biometric_enabled", false)
            }
            
            @JavascriptInterface
            fun setBiometricEnabled(enabled: Boolean) {
                if (!isAllowedDomain()) return
                
                if (enabled && !BiometricAuthHelper.isAvailable(this@MainActivity)) {
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "Биометрия недоступна на этом устройстве", Toast.LENGTH_SHORT).show()
                    }
                    return
                }
                
                authPrefs.edit().putBoolean("biometric_enabled", enabled).apply()
                
                runOnUiThread {
                    val message = if (enabled) "✅ Биометрия включена" else "❌ Биометрия отключена"
                    Toast.makeText(this@MainActivity, message, Toast.LENGTH_LONG).show()
                    
                    // Обновляем статус в WebView
                    webView.evaluateJavascript("if(typeof updateBiometricStatus === 'function') updateBiometricStatus();", null)
                }
            }
            
            @JavascriptInterface
            fun areNotificationsEnabled(): Boolean {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    return ContextCompat.checkSelfPermission(
                        this@MainActivity,
                        Manifest.permission.POST_NOTIFICATIONS
                    ) == PackageManager.PERMISSION_GRANTED
                }
                return true // На старых версиях разрешение не требуется
            }
            
            @JavascriptInterface
            fun requestNotificationPermission() {
                if (!isAllowedDomain()) return
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    runOnUiThread {
                        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                } else {
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "Уведомления уже включены", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            
            @JavascriptInterface
            fun openNotificationSettings() {
                if (!isAllowedDomain()) return
                
                runOnUiThread {
                    if (isFinishing || isDestroyed) {
                        Log.e("MainActivity", "Cannot open settings: Activity is finishing/destroyed")
                        return@runOnUiThread
                    }
                    
                    try {
                        // Для Android 8.0+ (включая Android 16)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            val intent = Intent().apply {
                                action = android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS
                                putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, packageName)
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            }
                            
                            // Проверяем что Intent можно открыть
                            if (intent.resolveActivity(packageManager) != null) {
                                startActivity(intent)
                                Toast.makeText(this@MainActivity, "Откройте раздел 'Уведомления'", Toast.LENGTH_LONG).show()
                                return@runOnUiThread
                            }
                        }
                        
                        // Fallback 1: детали приложения (Android 5.0+)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            val detailsIntent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                data = android.net.Uri.parse("package:$packageName")
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            }
                            
                            if (detailsIntent.resolveActivity(packageManager) != null) {
                                startActivity(detailsIntent)
                                Toast.makeText(this@MainActivity, "Откройте раздел 'Уведомления'", Toast.LENGTH_LONG).show()
                                return@runOnUiThread
                            }
                        }
                        
                        // Fallback 2: общие настройки
                        val settingsIntent = Intent(android.provider.Settings.ACTION_SETTINGS).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        startActivity(settingsIntent)
                        Toast.makeText(this@MainActivity, "Откройте: Приложения → Anonimka → Уведомления", Toast.LENGTH_LONG).show()
                        
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Failed to open notification settings: ${e.message}", e)
                        Toast.makeText(this@MainActivity, "Не удалось открыть настройки. Откройте их вручную через Настройки → Приложения → Anonimka", Toast.LENGTH_LONG).show()
                    }
                }
            }
            
            @JavascriptInterface
            fun openBiometricSettings() {
                if (!isAllowedDomain()) return
                
                runOnUiThread {
                    try {
                        // Пробуем открыть настройки биометрии (Android 10+)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                            val intent = Intent(android.provider.Settings.ACTION_BIOMETRIC_ENROLL).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            startActivity(intent)
                            Toast.makeText(this@MainActivity, "Настройте отпечаток пальца или Face ID", Toast.LENGTH_LONG).show()
                        } else {
                            // Для старых версий - в настройки безопасности
                            val securityIntent = Intent(android.provider.Settings.ACTION_SECURITY_SETTINGS).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            startActivity(securityIntent)
                            Toast.makeText(this@MainActivity, "Откройте раздел 'Биометрия' или 'Отпечаток пальца'", Toast.LENGTH_LONG).show()
                        }
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Failed to open biometric settings: ${e.message}", e)
                        // Fallback - настройки безопасности
                        try {
                            val securityIntent = Intent(android.provider.Settings.ACTION_SECURITY_SETTINGS).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            startActivity(securityIntent)
                            Toast.makeText(this@MainActivity, "Откройте раздел с биометрией", Toast.LENGTH_LONG).show()
                        } catch (ex: Exception) {
                            Log.e("MainActivity", "All biometric settings intents failed: ${ex.message}", ex)
                            Toast.makeText(this@MainActivity, "Не удалось открыть настройки биометрии. Откройте их вручную.", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            }
            
            @JavascriptInterface
            fun hasPinCode(): Boolean {
                if (!isAllowedDomain()) return false
                return authPrefs.contains("pin_code")
            }
            
            @JavascriptInterface
            fun setupPinCode() {
                if (!isAllowedDomain()) return
                
                runOnUiThread {
                    val intent = Intent(this@MainActivity, PinLockActivity::class.java)
                    startActivity(intent)
                }
            }
            
            @JavascriptInterface
            fun resetPinCode() {
                if (!isAllowedDomain()) return
                
                runOnUiThread {
                    androidx.appcompat.app.AlertDialog.Builder(this@MainActivity)
                        .setTitle("⚠️ Подтверждение")
                        .setMessage("Введите текущий PIN-код для удаления")
                        .setPositiveButton("Продолжить") { _, _ ->
                            // Удаляем PIN и биометрию
                            authPrefs.edit()
                                .remove("pin_code")
                                .putBoolean("biometric_enabled", false)
                                .putBoolean("app_unlocked", true)
                                .apply()
                            
                            Toast.makeText(this@MainActivity, "✅ PIN-код удален", Toast.LENGTH_SHORT).show()
                            
                            // Обновляем статусы в WebView
                            webView.evaluateJavascript("if(typeof updatePinStatus === 'function') updatePinStatus();", null)
                            webView.evaluateJavascript("if(typeof updateBiometricStatus === 'function') updateBiometricStatus();", null)
                        }
                        .setNegativeButton("Отмена", null)
                        .show()
                }
            }
        }, "AndroidAuth")

        // Настройка WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false  // Безопасность: запрещаем file:// доступ
            allowContentAccess = true
            allowFileAccessFromFileURLs = false  // Безопасность: запрещаем file:// → file://
            allowUniversalAccessFromFileURLs = false  // Безопасность: запрещаем file:// → http://
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE  // Разрешаем для совместимости
            cacheMode = WebSettings.LOAD_DEFAULT
            loadsImagesAutomatically = true
            blockNetworkImage = false
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
            useWideViewPort = true
            loadWithOverviewMode = true
            layoutAlgorithm = WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = true  // Безопасность: Google Safe Browsing
            }
            textZoom = 100
            minimumFontSize = 8
            minimumLogicalFontSize = 8
            defaultFontSize = 16
            setGeolocationEnabled(true)
        }

        // Фон WebView
        webView.setBackgroundColor("#0a0a0f".toColorInt())

        WebView.setWebContentsDebuggingEnabled(false)

        // Обработка низкой памяти
        val activityManager = getSystemService(ACTIVITY_SERVICE) as android.app.ActivityManager
        val memoryInfo = android.app.ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)

        if (memoryInfo.totalMem < 512 * 1024 * 1024) {
            android.util.Log.d("Anonimka", "⚠️ Low memory device detected: ${memoryInfo.totalMem / (1024 * 1024)}MB")
            webView.settings.apply {
                loadsImagesAutomatically = false
                blockNetworkImage = true
            }
        }

        // WebViewClient для контроля навигации и сетевых ошибок
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                if (!url.contains("anonimka.kz") && !url.contains("ru.anonimka.kz") && !url.contains("t.me")) {
                    val intent = Intent(Intent.ACTION_VIEW, url.toUri())
                    startActivity(intent)
                    return true
                }
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                if (!swipeRefreshLayout.isRefreshing) {
                    swipeRefreshLayout.isRefreshing = true
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false
                // Сброс счётчика ретраев после успешной загрузки
                webRetryCount = 0

                // Инжектим данные авторизации
                val userToken = authPrefs.getString("user_token", "")
                val authMethod = authPrefs.getString("auth_method", "telegram")
                val email = authPrefs.getString("email", "")
                val displayNickname = authPrefs.getString("display_nickname", "")

                android.util.Log.d("Anonimka", "📱 [INJECT] Preparing injection: token=${userToken?.take(16)}..., method=$authMethod")
                if (!userToken.isNullOrEmpty()) {
                    webView.evaluateJavascript(
                        """
                        (function() {
                            try {
                                localStorage.setItem('user_token', '$userToken');
                                localStorage.setItem('auth_method', '$authMethod');
                                localStorage.setItem('email', '$email');
                                localStorage.setItem('auth_time', '${authPrefs.getLong("auth_time", 0)}');
                                if ('$displayNickname' !== '') {
                                    localStorage.setItem('user_nickname', '$displayNickname');
                                }
                                console.log('✅ [INJECT] Auth data injected:', {
                                    userToken: '${userToken.take(16)}...',
                                    authMethod: '$authMethod',
                                    email: '$email',
                                    nickname: '$displayNickname'
                                });
                                return 'SUCCESS';
                            } catch(e) {
                                console.error('❌ [INJECT] Error:', e);
                                return 'ERROR: ' + e.message;
                            }
                        })();
                        """,
                        null
                    )
                }

                // Для обратной совместимости с Telegram auth
                val savedUser = authPrefs.getString("telegram_user", "")
                if (!savedUser.isNullOrEmpty() && authMethod == "telegram") {
                    webView.evaluateJavascript(
                        """
                        (function() {
                            try {
                                var userData = $savedUser;
                                localStorage.setItem('telegram_user', JSON.stringify(userData));
                                localStorage.setItem('telegram_auth_time', '${authPrefs.getLong("telegram_auth_time", 0)}');
                                localStorage.setItem('user_id', userData.id.toString());
                                console.log('✅ Telegram auth data injected from Android:', userData.id);
                            } catch(e) {
                                console.error('❌ Error injecting telegram auth data:', e);
                            }
                        })();
                        """,
                        null
                    )
                }
                if (url?.contains("authorized=true") == true) {
                    handleIntent(intent)
                }
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) {
                    super.onReceivedError(view, request, error)
                    val errorCode = error.errorCode
                    if (errorCode != ERROR_CONNECT && errorCode != ERROR_HOST_LOOKUP) {
                        Toast.makeText(this@MainActivity, "Ошибка загрузки: ${error.description}", Toast.LENGTH_LONG).show()
                    }
                }
            }

            override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    android.util.Log.e("Anonimka", "❌ WebView render process crashed")
                    recreate()
                    return true
                }
                return super.onRenderProcessGone(view, detail)
            }
        }

        // WebChromeClient для загрузки файлов и геолокации
        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
                android.util.Log.d("Anonimka", "📍 GPS request from: $origin")
                val hasFineLocation = ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val hasCoarseLocation = ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

                if (hasFineLocation || hasCoarseLocation) {
                    callback?.invoke(origin, true, false)
                    android.util.Log.d("Anonimka", "✅ GPS permission already granted")
                } else {
                    geolocationCallback = callback
                    geolocationOrigin = origin
                    locationPermissionLauncher.launch(
                        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
                    )
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<android.net.Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                if (!hasStoragePermissions()) {
                    requestStoragePermissions()
                    return false
                }

                val intent = fileChooserParams?.createIntent()
                intent?.type = "image/*"
                intent?.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false)

                try {
                    fileChooserLauncher.launch(intent)
                } catch (_: Exception) {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = null
                    Toast.makeText(this@MainActivity, "Не удалось открыть выбор файла", Toast.LENGTH_SHORT).show()
                    return false
                }

                return true
            }

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                if (newProgress == 100) {
                    swipeRefreshLayout.isRefreshing = false
                }
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (request.resources.contains("android.webkit.resource.BLUETOOTH_SCANNING")) {
                        request.deny()
                        return
                    }
                }
                super.onPermissionRequest(request)
            }
        }

        // Настройка SwipeRefreshLayout
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }
        swipeRefreshLayout.setColorSchemeResources(R.color.purple_500, R.color.purple_700, R.color.teal_200)

        // Проверяем наличие токена авторизации
        val userToken = authPrefs.getString("user_token", null)
        if (userToken.isNullOrEmpty()) {
            // Нет токена — показываем email авторизацию
            val intent = Intent(this, EmailAuthActivity::class.java)
            startActivityForResult(intent, EMAIL_AUTH_REQUEST_CODE)
        } else {
            // Токен есть — проверяем биометрию если включена
            val biometricEnabled = authPrefs.getBoolean("biometric_enabled", false)
            
            if (biometricEnabled && BiometricAuthHelper.isAvailable(this)) {
                // Биометрия включена - требуем аутентификацию
                val biometricHelper = BiometricAuthHelper(this)
                biometricHelper.authenticate(
                    title = "Вход в Anonimka",
                    subtitle = "Подтвердите вход с помощью биометрии",
                    onSuccess = {
                        if (savedInstanceState == null) {
                            loadWebApp()
                        }
                    },
                    onError = { _, message ->
                        Toast.makeText(this, "Ошибка биометрии: $message", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                )
            } else {
                // Биометрия не включена или недоступна - загружаем напрямую
                if (savedInstanceState == null) {
                    loadWebApp()
                }
            }
        }

        // Обрабатываем deep link
        handleIntent(intent)
    }

    private fun loadWebApp() {
        android.util.Log.d("Anonimka", "🌐 Loading webapp URL")
        
        // Проверяем есть ли intent extras (из Google/Email авторизации)
        val userToken = intent.getStringExtra("userToken")
        val isNewUser = intent.getBooleanExtra("isNewUser", false)
        
        if (userToken != null) {
            android.util.Log.d("Anonimka", "✅ Intent extras: userToken=${userToken.take(8)}..., isNewUser=$isNewUser")
            
            // Сохраняем в authPrefs если еще не сохранено
            if (authPrefs.getString("user_token", null) == null) {
                authPrefs.edit().apply {
                    putString("user_token", userToken)
                    apply()
                }
            }
            
            // Загружаем WebApp и после загрузки вызываем проверку онбординга
            webView.loadUrl("https://ru.anonimka.kz/webapp")
            
            // После загрузки страницы запускаем проверку онбординга
            webView.postDelayed({
                webView.evaluateJavascript("""
                    (function() {
                        console.log('📱 [Android] Проверка онбординга после авторизации');
                        if (typeof checkOnboardingStatus === 'function') {
                            checkOnboardingStatus();
                        } else {
                            console.warn('⚠️ checkOnboardingStatus не найдена, ждем загрузки');
                            setTimeout(function() {
                                if (typeof checkOnboardingStatus === 'function') {
                                    checkOnboardingStatus();
                                }
                            }, 1000);
                        }
                    })();
                """.trimIndent(), null)
            }, 2000)
        } else {
            webView.loadUrl("https://ru.anonimka.kz/webapp")
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == EMAIL_AUTH_REQUEST_CODE) {
            if (resultCode == RESULT_OK) {
                // Успешная авторизация - загружаем webapp
                loadWebApp()
            } else {
                // Отмена авторизации - закрываем приложение
                finish()
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data = intent?.data

        if (data?.scheme == "anonimka" && data.path == "/authorized") {
            android.util.Log.d("Anonimka", "🔄 Возврат из Telegram - перезагружаем WebView")
            webView.postDelayed({ webView.reload() }, 300)
            return
        }

        val url = webView.url
        val isFromTelegram = data?.let { it.scheme == "tg" || it.host == "anonimka.kz" } ?: false
        val isAuthorized = url?.contains("authorized=true") == true

        if (isFromTelegram || isAuthorized) {
            webView.postDelayed({
                webView.evaluateJavascript("""
                    (function() {
                        console.log('🔄 Обработка возврата из Telegram');
                        var authModal = document.getElementById('telegramAuthModal');
                        var closeBtn = document.querySelector('.modal-close');
                        var backdrop = document.querySelector('.modal-overlay');
                        if (authModal) authModal.style.display = 'none';
                        if (closeBtn) closeBtn.click();
                        if (backdrop) backdrop.style.display = 'none';
                        if (window.location.href.includes('from_app=')) {
                            var cleanUrl = window.location.href.split('?')[0];
                            window.history.replaceState({}, document.title, cleanUrl);
                        }
                        setTimeout(function() { window.location.reload(); }, 500);
                    })();
                """, null)
            }, 800)
        }
    }

    private fun hasStoragePermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestStoragePermissions() {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        permissionLauncher.launch(permissions)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        android.util.Log.d("Anonimka", "💾 Saving WebView state")
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        android.util.Log.d("Anonimka", "🔄 Restoring WebView state")
        webView.restoreState(savedInstanceState)
    }

    // onPause/onResume перенесены ниже с логикой PIN

    override fun onDestroy() {
        super.onDestroy()
        fileUploadCallback?.onReceiveValue(null)
        fileUploadCallback = null
        unregisterNetworkChangeCallback()
    }

    private fun getFCMToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                android.util.Log.e("Anonimka", "❌ Ошибка получения FCM токена", task.exception)
                return@addOnCompleteListener
            }

            val fcmToken = task.result ?: ""
            if (fcmToken.isEmpty()) {
                android.util.Log.e("Anonimka", "❌ FCM токен пустой")
                return@addOnCompleteListener
            }

            android.util.Log.d("Anonimka", "🔑 FCM токен получен: ${fcmToken.take(20)}...")
            authPrefs.edit { putString("fcm_token", fcmToken) }
            sendFCMTokenToServer(fcmToken)
        }
    }

    private fun sendFCMTokenToServer(fcmToken: String) {
        val userToken = authPrefs.getString("user_token", null)
        if (userToken.isNullOrEmpty()) {
            android.util.Log.w("Anonimka", "⚠️ user_token не найден, FCM токен не отправлен")
            return
        }

        android.util.Log.d("Anonimka", "📤 Отправка FCM токена на сервер...")
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("https://ru.anonimka.kz/api/fcm-token")
                val connection = url.openConnection() as HttpURLConnection
                connection.apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                    val params = JSONObject().apply {
                        put("userToken", userToken)
                        put("fcmToken", fcmToken)
                    }
                    val json = JSONObject().apply {
                        put("action", "register")
                        put("params", params)
                    }
                    outputStream.use { os ->
                        os.write(json.toString().toByteArray())
                    }
                    val responseCode = responseCode
                    if (responseCode == 200) {
                        android.util.Log.d("Anonimka", "✅ FCM токен успешно зарегистрирован на сервере")
                    } else {
                        android.util.Log.e("Anonimka", "❌ Ошибка регистрации FCM токена: $responseCode")
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("Anonimka", "❌ Ошибка при отправке FCM токена", e)
            }
        }
    }

    // Мягкий авто-ретрай загрузки основной страницы при сетевых сбоях
    private fun maybeRetryWebLoad(reason: String) {
        val isHttp2PingFail = reason.contains("ERR_HTTP2_PING_FAILED", ignoreCase = true)
        val isNetworkIssue = isHttp2PingFail || reason.contains("timeout", true) || reason.contains("503", true)

        if (!isNetworkIssue) {
            android.util.Log.d("Anonimka", "ℹ️ Skip retry (reason=$reason)")
            return
        }

        if (webRetryCount >= webMaxRetries) {
            android.util.Log.e("Anonimka", "❌ Retry limit reached ($webRetryCount). Showing hint to user.")
            Toast.makeText(this, "Проблема сети. Проверьте соединение и повторите.", Toast.LENGTH_LONG).show()
            return
        }

        val delay = webBaseDelayMs shl webRetryCount // 1s, 2s, 4s
        webRetryCount += 1
        android.util.Log.w("Anonimka", "⚠️ Network issue ($reason). Retry #$webRetryCount in ${delay}ms")
        Toast.makeText(this, "Проблема сети, пробуем снова…", Toast.LENGTH_SHORT).show()

        webView.postDelayed({
            try {
                if (webView.url.isNullOrEmpty()) {
                    // Если URL ещё не загружен, пробуем открыть стартовый
                    val startUrl = "https://ru.anonimka.kz/webapp"
                    webView.loadUrl(startUrl)
                } else {
                    webView.reload()
                }
            } catch (e: Exception) {
                android.util.Log.e("Anonimka", "❌ Retry failed: ${e.message}", e)
            }
        }, delay)
    }

    /**
     * Запрос разрешения на уведомления для Android 13+
     */
    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            when {
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    android.util.Log.d("Anonimka", "✅ Notification permission already granted")
                }
                shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) -> {
                    android.util.Log.d("Anonimka", "⚠️ Показываем объяснение для разрешения уведомлений")
                    Toast.makeText(
                        this,
                        "Разрешите уведомления для получения новых сообщений",
                        Toast.LENGTH_LONG
                    ).show()
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
                else -> {
                    android.util.Log.d("Anonimka", "📱 Запрос разрешения на уведомления")
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        } else {
            android.util.Log.d("Anonimka", "✅ Android < 13, разрешение на уведомления не требуется")
        }
    }

    // Сетевой callback: безопасная одноразовая перезагрузка WebView при смене типа сети
    private var connectivityCallback: ConnectivityManager.NetworkCallback? = null

    private fun registerNetworkChangeCallback() {
        if (connectivityCallbackRegistered) return
        val cm = getSystemService(ConnectivityManager::class.java)
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                handleNetworkMaybeReload(cm)
            }

            override fun onLost(network: Network) {
                // Ничего — ждём новое подключение
            }
        }

        cm.registerNetworkCallback(request, callback)
        connectivityCallbackRegistered = true
        connectivityCallback = callback
        android.util.Log.d("Anonimka", "📶 Network callback registered")
    }

    private fun unregisterNetworkChangeCallback() {
        if (!connectivityCallbackRegistered) return
        val cm = getSystemService(ConnectivityManager::class.java)
        try {
            connectivityCallback?.let { cm.unregisterNetworkCallback(it) }
            android.util.Log.d("Anonimka", "📶 Network callback unregistered")
        } catch (_: Exception) {}
        connectivityCallbackRegistered = false
        connectivityCallback = null
    }

    private fun handleNetworkMaybeReload(cm: ConnectivityManager) {
        val active = cm.activeNetwork ?: return
        val caps = cm.getNetworkCapabilities(active) ?: return
        val type = when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            else -> "other"
        }

        val now = System.currentTimeMillis()
        val cooldownPassed = now - lastNetworkReloadTs > networkReloadCooldownMs
        val typeChanged = lastNetworkType != null && lastNetworkType != type

        android.util.Log.d("Anonimka", "📶 Network change: $lastNetworkType -> $type, cooldownPassed=$cooldownPassed")

        if (typeChanged && cooldownPassed) {
            // Для мобильной сети разрешим больше мягких ретраев
            webMaxRetries = if (type == "cellular") 5 else 3
            lastNetworkReloadTs = now
            runOnUiThread {
                if (isFinishing || isDestroyed) {
                    android.util.Log.w("Anonimka", "⚠️ Skip reload: activity finishing/destroyed")
                    return@runOnUiThread
                }
                val vw = try { webView } catch (_: Exception) { null }
                if (vw == null) {
                    android.util.Log.w("Anonimka", "⚠️ Skip reload: webView is null")
                    return@runOnUiThread
                }
                try {
                    Toast.makeText(this, "Сеть изменилась, обновляем страницу…", Toast.LENGTH_SHORT).show()
                        if (vw.url.isNullOrEmpty()) {
                        vw.loadUrl("https://ru.anonimka.kz/webapp")
                    } else {
                        vw.reload()
                    }
                    android.util.Log.d("Anonimka", "🔄 WebView reloaded on network change")
                } catch (e: Exception) {
                    android.util.Log.e("Anonimka", "❌ Reload on network change failed: ${e.message}", e)
                }
            }
        }

        lastNetworkType = type
    }
    
    /**
     * Проверка необходимости PIN-кода
     * @return true если можно продолжить, false если нужно показать PIN
     */
    private fun checkPinLockRequired(): Boolean {
        // Если нет сохраненного токена - не требуем PIN (пользователь еще не авторизован)
        val hasToken = authPrefs.getString("user_token", null) != null
        if (!hasToken) {
            return true // Можно продолжить без PIN
        }
        
        // Если есть PIN-код, проверяем разблокирован ли
        val hasPinCode = authPrefs.contains("pin_code")
        if (hasPinCode) {
            val isUnlocked = authPrefs.getBoolean("app_unlocked", false)
            if (!isUnlocked) {
                // Показываем PIN экран
                val intent = Intent(this, PinLockActivity::class.java)
                startActivity(intent)
                return false // Останавливаем загрузку MainActivity
            }
        }
        
        return true // Можно продолжить
    }
    
    override fun onResume() {
        super.onResume()
        webView.onResume()
        // Проверяем PIN при возврате в приложение
        if (!checkPinLockRequired()) {
            return
        }
    }
    
    override fun onPause() {
        super.onPause()
        webView.onPause()
        // Сбрасываем флаг разблокировки когда приложение сворачивается
        val hasPinCode = authPrefs.contains("pin_code")
        if (hasPinCode) {
            authPrefs.edit().putBoolean("app_unlocked", false).apply()
        }
    }
    
    /**
     * Проверка безопасности приложения
     */
    private fun performSecurityChecks() {
        val securityStatus = SecurityManager.performSecurityCheck(this)
        
        if (BuildConfig.DEBUG) {
            logDebug("Anonimka", "Security Check: rooted=${securityStatus.isRooted}, " +
                    "emulator=${securityStatus.isEmulator}, " +
                    "integrity=${securityStatus.isIntegrityValid}")
        }
        
        // Показываем предупреждения пользователю
        if (securityStatus.warnings.isNotEmpty()) {
            val message = securityStatus.warnings.joinToString("\n")
            
            androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("⚠️ Предупреждение безопасности")
                .setMessage("$message\n\nПриложение может работать нестабильно или небезопасно.")
                .setPositiveButton("Понятно") { dialog, _ -> dialog.dismiss() }
                .setCancelable(true)
                .show()
        }
        
        // В production можно заблокировать запуск на rooted устройствах
        if (!BuildConfig.DEBUG && securityStatus.isRooted) {
            // Раскомментируйте для блокировки:
            // androidx.appcompat.app.AlertDialog.Builder(this)
            //     .setTitle("❌ Доступ запрещён")
            //     .setMessage("Приложение не может работать на устройствах с root-доступом из соображений безопасности.")
            //     .setPositiveButton("Выход") { _, _ -> finish() }
            //     .setCancelable(false)
            //     .show()
        }
    }
    
    /**
     * Проверка обновлений приложения в Google Play
     */
    private fun checkForAppUpdates() {
        val appUpdateManager = AppUpdateManagerFactory.create(this)
        
        val appUpdateInfoTask = appUpdateManager.appUpdateInfo
        
        appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) {
                // Обновление доступно
                val availableVersionCode = appUpdateInfo.availableVersionCode()
                val currentVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    packageManager.getPackageInfo(packageName, 0).longVersionCode.toInt()
                } else {
                    @Suppress("DEPRECATION")
                    packageManager.getPackageInfo(packageName, 0).versionCode
                }
                
                logDebug("Anonimka", "📦 Update available: $currentVersionCode -> $availableVersionCode")
                
                // Показываем диалог с предложением обновиться
                androidx.appcompat.app.AlertDialog.Builder(this)
                    .setTitle("🔄 Доступно обновление")
                    .setMessage("Новая версия приложения доступна в Google Play.\n\nХотите обновить сейчас?")
                    .setPositiveButton("Обновить") { _, _ ->
                        try {
                            // Запускаем обновление
                            appUpdateManager.startUpdateFlowForResult(
                                appUpdateInfo,
                                this,
                                AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build(),
                                1234 // requestCode для onActivityResult
                            )
                        } catch (e: Exception) {
                            logError("Anonimka", "Failed to start update flow", e)
                            Toast.makeText(this, "Не удалось открыть Google Play", Toast.LENGTH_SHORT).show()
                            // Fallback: открываем Google Play страницу вручную
                            try {
                                val intent = Intent(Intent.ACTION_VIEW).apply {
                                    data = android.net.Uri.parse("market://details?id=kz.anonimka.app")
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                }
                                startActivity(intent)
                            } catch (ex: Exception) {
                                // Если Google Play не установлен, открываем браузер с прямой ссылкой
                                val webIntent = Intent(Intent.ACTION_VIEW).apply {
                                    data = android.net.Uri.parse("https://play.google.com/store/apps/details?id=kz.anonimka.app")
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                }
                                startActivity(webIntent)
                            }
                        }
                    }
                    .setNegativeButton("Позже") { dialog, _ -> dialog.dismiss() }
                    .setCancelable(true)
                    .show()
            } else {
                logDebug("Anonimka", "✅ App is up to date")
            }
        }.addOnFailureListener { e ->
            // Не удалось проверить обновления (нет интернета, не установлен Google Play и т.д.)
            logError("Anonimka", "Failed to check for updates", e)
        }
    }
}
