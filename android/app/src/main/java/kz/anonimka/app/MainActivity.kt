package kz.anonimka.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    
    // SharedPreferences для хранения данных авторизации
    private val authPrefs by lazy {
        getSharedPreferences("anonimka_auth", MODE_PRIVATE)
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
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

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)

        ViewCompat.setOnApplyWindowInsetsListener(swipeRefreshLayout) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            // Применяем отступ сверху, чтобы не налезать на статус-бар, и убираем нижний отступ
            view.setPadding(insets.left, insets.top, insets.right, 0)
            windowInsets
        }

        // Добавляем JavaScript Interface для связи с WebView
        webView.addJavascriptInterface(object {
            @android.webkit.JavascriptInterface
            fun saveAuthData(userData: String) {
                authPrefs.edit().apply {
                    putString("telegram_user", userData)
                    putLong("telegram_auth_time", System.currentTimeMillis())
                    apply()
                }
                android.util.Log.d("Anonimka", "✅ Auth data saved to SharedPreferences")
            }
            
            @android.webkit.JavascriptInterface
            fun getAuthData(): String {
                return authPrefs.getString("telegram_user", "") ?: ""
            }
        }, "AndroidAuth")
        
        // Настройка WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            
            // Для лучшей производительности
            cacheMode = WebSettings.LOAD_DEFAULT
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            
            // Поддержка масштабирования
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
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

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false
                
                // Инжектим сохранённые данные авторизации при загрузке страницы
                val savedUser = authPrefs.getString("telegram_user", "")
                if (!savedUser.isNullOrEmpty()) {
                    webView.evaluateJavascript("""
                        (function() {
                            try {
                                var userData = ${savedUser};
                                localStorage.setItem('telegram_user', JSON.stringify(userData));
                                localStorage.setItem('telegram_auth_time', '${authPrefs.getLong("telegram_auth_time", 0)}');
                                localStorage.setItem('user_id', userData.id.toString());
                                console.log('✅ Auth data injected from Android:', userData.id);
                            } catch(e) {
                                console.error('❌ Error injecting auth data:', e);
                            }
                        })();
                    """.trimIndent(), null)
                }
                
                // Если в URL есть параметр authorized - закрываем модалку
                if (url?.contains("authorized=true") == true) {
                    handleIntent(intent)
                }
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Toast.makeText(this@MainActivity, "Ошибка загрузки: ${error?.description}", Toast.LENGTH_SHORT).show()
                }
            }
        }

        // WebChromeClient для загрузки файлов и геолокации
        webView.webChromeClient = object : WebChromeClient() {
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

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
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
        
        // Обрабатываем deep link если пришли из Telegram
        handleIntent(intent)
    }

    private fun loadWebApp() {
        webView.loadUrl("https://anonimka.kz/webapp")
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data = intent?.data
        val url = webView.url
        
        // Проверяем если пришли из Telegram после авторизации
        val isFromTelegram = data?.let {
            it.scheme == "anonimka" || it.scheme == "tg" || it.host == "anonimka.kz"
        } ?: false
        
        // Или если в URL есть параметр authorized=true
        val isAuthorized = url?.contains("authorized=true") == true || data?.path == "/authorized"
        
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
                """.trimIndent(), null)
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

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fileUploadCallback?.onReceiveValue(null)
        fileUploadCallback = null
    }
}
