package kz.anonimka.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var geolocationCallback: GeolocationPermissions.Callback? = null
    private var geolocationOrigin: String? = null

    // SharedPreferences для хранения данных авторизации
    private val authPrefs by lazy {
        getSharedPreferences("anonimka_auth", MODE_PRIVATE)
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

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        android.util.Log.d("Anonimka", "onCreate called, savedInstanceState: ${savedInstanceState != null}")

        // Проверяем авторизацию
        val userToken = authPrefs.getString("user_token", null)
        val authMethod = authPrefs.getString("auth_method", "telegram")

        if (userToken == null) {
            // Нет авторизации - перенаправляем на EmailAuthActivity
            android.util.Log.d("Anonimka", "⚠️ No auth token found, redirecting to EmailAuthActivity")
            val intent = Intent(this, EmailAuthActivity::class.java)
            startActivity(intent)
            finish()
            return
        }

        android.util.Log.d("Anonimka", "✅ Auth token found: ${userToken.take(8)}..., method: $authMethod")

        // Получаем FCM токен для Push-уведомлений
        getFCMToken()

        // Edge-to-edge display для Android 15 (правильная реализация)
        enableEdgeToEdge()
        
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        swipeRefreshLayout.isEnabled = false

        // Применяем padding только для верхней панели (статус бар)
        // Bottom padding НЕ применяем для корректной работы adjustResize
        ViewCompat.setOnApplyWindowInsetsListener(swipeRefreshLayout) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(
                0, // left
                insets.top, // top - отступ от статус бара
                0, // right
                0 // bottom - НЕ применяем, чтобы adjustResize работал правильно
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

        // Добавляем JavaScript Interface для связи с WebView
        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun saveAuthData(userData: String) {
                authPrefs.edit().apply {
                    putString("telegram_user", userData)
                    putLong("telegram_auth_time", System.currentTimeMillis())
                    apply()
                }
                android.util.Log.d("Anonimka", "✅ Auth data saved to SharedPreferences")
            }

            @JavascriptInterface
            fun getAuthData(): String {
                return authPrefs.getString("telegram_user", "") ?: ""
            }

            @JavascriptInterface
            fun getUserToken(): String {
                return authPrefs.getString("user_token", "") ?: ""
            }

            @JavascriptInterface
            fun getAuthMethod(): String {
                return authPrefs.getString("auth_method", "telegram") ?: "telegram"
            }

            @JavascriptInterface
            fun getEmail(): String {
                return authPrefs.getString("email", "") ?: ""
            }
        }, "AndroidAuth")

        // Настройка WebView как в Telegram
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false

            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Оптимизации производительности
            cacheMode = WebSettings.LOAD_DEFAULT

            // Предзагрузка
            loadsImagesAutomatically = true
            blockNetworkImage = false
            
            // Важно: отключаем встроенный зум как в Telegram WebView
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
            
            // Правильный размер контента
            useWideViewPort = true
            loadWithOverviewMode = true

            layoutAlgorithm = WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING

            // Отключаем Safe Browsing на новых устройствах
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = false
            }

            // Ускорение текста
            textZoom = 100
            minimumFontSize = 8
            minimumLogicalFontSize = 8
            defaultFontSize = 16

            // ВКЛЮЧАЕМ ГЕОЛОКАЦИЮ
            setGeolocationEnabled(true)

            // Поддержка масштабирования
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
        }

        // Чёрный фон WebView чтобы не было белых полос
        webView.setBackgroundColor(Color.parseColor("#0a0a0f"))

        WebView.setWebContentsDebuggingEnabled(false)

        // Обработка низкой памяти для старых устройств
        val activityManager = getSystemService(ACTIVITY_SERVICE) as android.app.ActivityManager
        val memoryInfo = android.app.ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)

        // Если мало памяти (< 512MB) - упрощенный режим
        if (memoryInfo.totalMem < 512 * 1024 * 1024) {
            android.util.Log.d("Anonimka", "⚠️ Low memory device detected: ${memoryInfo.totalMem / (1024 * 1024)}MB")
            webView.settings.apply {
                // Отключаем автозагрузку картинок на слабых устройствах
                loadsImagesAutomatically = false
                blockNetworkImage = true
            }
        }

        // WebViewClient для контроля навигации
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()

                // Открываем внешние ссылки в браузере
                if (!url.contains("anonimka.kz") && !url.contains("t.me")) {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                }

                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // Показываем индикатор только для первой загрузки
                if (!swipeRefreshLayout.isRefreshing) {
                    swipeRefreshLayout.isRefreshing = true
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false

                // Скрываем splash screen если он еще виден
                window.decorView.postDelayed({
                    // Контент загружен, можно убрать черный экран
                }, 100)

                // Инжектим данные авторизации при загрузке страницы
                val userToken = authPrefs.getString("user_token", "")
                val authMethod = authPrefs.getString("auth_method", "telegram")
                val email = authPrefs.getString("email", "")
                val displayNickname = authPrefs.getString("display_nickname", "")

                android.util.Log.d("Anonimka", "📱 [INJECT] Preparing injection: token=${userToken?.take(16)}..., method=$authMethod")

                if (!userToken.isNullOrEmpty()) {
                    val script = """
                        (function() {
                            try {
                                localStorage.setItem('user_token', '$userToken');
                                localStorage.setItem('auth_method', '$authMethod');
                                localStorage.setItem('email', '$email');
                                localStorage.setItem('auth_time', '${authPrefs.getLong("auth_time", 0)}');
                                
                                // Инжектим никнейм если он сохранён
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
                    """.trimIndent()

                    webView.evaluateJavascript(script) { result ->
                        android.util.Log.d("Anonimka", "📱 [INJECT] Result: $result")
                    }
                }

                // Для обратной совместимости с Telegram auth
                val savedUser = authPrefs.getString("telegram_user", "")
                if (!savedUser.isNullOrEmpty() && authMethod == "telegram") {
                    webView.evaluateJavascript("""
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
                    """.trimIndent(), null)
                }

                // Если в URL есть параметр authorized - закрываем модалку
                if (url?.contains("authorized=true") == true) {
                    handleIntent(intent)
                }
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) {
                    super.onReceivedError(view, request, error)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        val errorCode = error.errorCode
                        if (errorCode != WebViewClient.ERROR_CONNECT && errorCode != WebViewClient.ERROR_HOST_LOOKUP) {
                            Toast.makeText(this@MainActivity, "Ошибка загрузки: ${error.description}", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            }

            // Обработка краша WebView на старых устройствах
            override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    android.util.Log.e("Anonimka", "❌ WebView render process crashed")
                    // Перезагружаем приложение
                    recreate()
                    return true
                }
                return super.onRenderProcessGone(view, detail)
            }
        }

        // WebChromeClient для загрузки файлов и геолокации
        webView.webChromeClient = object : WebChromeClient() {

            // Обработка запроса геолокации
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                android.util.Log.d("Anonimka", "📍 GPS request from: $origin")

                // Проверяем разрешения
                val hasFineLocation = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                val hasCoarseLocation = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (hasFineLocation || hasCoarseLocation) {
                    // Разрешение уже есть
                    callback?.invoke(origin, true, false)
                    android.util.Log.d("Anonimka", "✅ GPS permission already granted")
                } else {
                    // Запрашиваем разрешение
                    geolocationCallback = callback
                    geolocationOrigin = origin
                    locationPermissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            }

            override fun onGeolocationPermissionsHidePrompt() {
                super.onGeolocationPermissionsHidePrompt()
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                // Проверяем разрешения
                if (!hasStoragePermissions()) {
                    requestStoragePermissions()
                    return false
                }

                // Открываем выбор файла
                val intent = fileChooserParams?.createIntent()
                intent?.type = "image/*"
                intent?.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false)

                try {
                    fileChooserLauncher.launch(intent)
                } catch (e: Exception) {
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
        swipeRefreshLayout.setColorSchemeResources(
            R.color.purple_500,
            R.color.purple_700,
            R.color.teal_200
        )

        // Загружаем webapp
        loadWebApp()

        // Восстанавливаем состояние WebView если оно было сохранено
        if (savedInstanceState != null) {
            android.util.Log.d("Anonimka", "🔄 Восстанавливаем сохранённое состояние WebView")
            webView.restoreState(savedInstanceState)
        } else {
            // Только если нет сохранённого состояния - загружаем URL
            loadWebApp()
        }

        // Обрабатываем deep link если пришли из Telegram
        handleIntent(intent)
    }

    private fun loadWebApp() {
        android.util.Log.d("Anonimka", "🌐 Loading webapp URL")
        webView.loadUrl("https://anonimka.kz/webapp")
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data = intent?.data

        // Проверяем если пришли из Telegram после авторизации через deep link
        if (data?.scheme == "anonimka" && data.path == "/authorized") {
            android.util.Log.d("Anonimka", "🔄 Возврат из Telegram - перезагружаем WebView")

            // Перезагружаем WebView чтобы инжектнуть сохранённые данные
            webView.postDelayed({
                webView.reload()
            }, 300)
            return
        }

        val url = webView.url

        // Проверяем если пришли из Telegram после авторизации (старый способ)
        val isFromTelegram = data?.let {
            it.scheme == "tg" || it.host == "anonimka.kz"
        } ?: false

        // Или если в URL есть параметр authorized=true
        val isAuthorized = url?.contains("authorized=true") == true

        if (isFromTelegram || isAuthorized) {
            // Инжектим JavaScript для закрытия диалога авторизации
            webView.postDelayed({
                webView.evaluateJavascript("""
                    (function() {
                        console.log('🔄 Обработка возврата из Telegram');
                        
                        // Закрываем модальное окно авторизации
                        var authModal = document.getElementById('telegramAuthModal');
                        var closeBtn = document.querySelector('.modal-close');
                        var backdrop = document.querySelector('.modal-overlay');
                        
                        if (authModal) {
                            authModal.style.display = 'none';
                            console.log('✅ Модальное окно закрыто');
                        }
                        if (closeBtn) closeBtn.click();
                        if (backdrop) backdrop.style.display = 'none';
                        
                        // Если в URL есть параметр from_app, очищаем его
                        if (window.location.href.includes('from_app=')) {
                            var cleanUrl = window.location.href.split('?')[0];
                            window.history.replaceState({}, document.title, cleanUrl);
                        }
                        
                        // Перезагружаем страницу для применения авторизации
                        setTimeout(function() {
                            window.location.reload();
                        }, 500);
                    })();
                """, null)
            }, 800)
        }
    }

    private fun hasStoragePermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_MEDIA_IMAGES
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
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

    // Сохранение состояния WebView при сворачивании приложения
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        android.util.Log.d("Anonimka", "💾 Saving WebView state")
        webView.saveState(outState)
    }
    
    // Восстановление состояния WebView при возврате
    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        android.util.Log.d("Anonimka", "🔄 Restoring WebView state")
        webView.restoreState(savedInstanceState)
    }
    
    override fun onPause() {
        super.onPause()
        android.util.Log.d("Anonimka", "⏸️ onPause - сохраняем состояние")
        webView.onPause()
    }
    
    override fun onResume() {
        super.onResume()
        android.util.Log.d("Anonimka", "▶️ onResume - восстанавливаем состояние")
        webView.onResume()
    }

    override fun onDestroy() {
        super.onDestroy()
        fileUploadCallback?.onReceiveValue(null)
        fileUploadCallback = null
    }

    /**
     * Включает edge-to-edge display для Android 15+
     * Правильная реализация согласно гайдлайнам Google
     */
    private fun enableEdgeToEdge() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            // Android 15+ (API 35+) - используем новый способ
            window.decorView.setOnApplyWindowInsetsListener { view, insets ->
                val systemBars = insets.getInsets(android.view.WindowInsets.Type.systemBars())
                view.setPadding(0, 0, 0, 0)
                insets
            }
        }
        
        // Универсальная настройка для всех версий
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // Прозрачные системные панели с темным фоном для контента
        window.statusBarColor = Color.parseColor("#0a0a0f")
        window.navigationBarColor = Color.parseColor("#0a0a0f")
        
        // Светлые иконки на темном фоне
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = 0 // Темные иконки (светлый фон = 0, темный = убираем флаги)
        }
    }

    /**
     * Получает FCM токен и отправляет на сервер
     */
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
            
            // Сохраняем локально
            authPrefs.edit().putString("fcm_token", fcmToken).apply()
            
            // Отправляем на сервер
            sendFCMTokenToServer(fcmToken)
        }
    }

    /**
     * Отправляет FCM токен на сервер
     */
    private fun sendFCMTokenToServer(fcmToken: String) {
        val userToken = authPrefs.getString("user_token", null)
        
        if (userToken.isNullOrEmpty()) {
            android.util.Log.w("Anonimka", "⚠️ user_token не найден, FCM токен не отправлен")
            return
        }
        
        android.util.Log.d("Anonimka", "📤 Отправка FCM токена на сервер...")
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("https://anonimka.kz/api/fcm-token")
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
                    
                    val responseCode = connection.responseCode
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
}
