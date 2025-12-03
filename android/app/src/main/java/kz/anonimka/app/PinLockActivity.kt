package kz.anonimka.app

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import android.view.View
import android.widget.TextView
import android.widget.Button
import android.widget.LinearLayout
import androidx.core.graphics.toColorInt

/**
 * PIN Lock Screen - экран защиты приложения PIN-кодом
 * Поддерживает:
 * - Создание нового PIN (4 цифры)
 * - Подтверждение PIN
 * - Вход по PIN
 * - Вход по биометрии (если настроена)
 */
class PinLockActivity : AppCompatActivity() {
    
    private lateinit var authPrefs: android.content.SharedPreferences
    private var currentPin = ""
    private var isSetupMode = false
    private var setupPinFirst = ""
    private lateinit var titleText: TextView
    private lateinit var pinDotsContainer: LinearLayout
    private lateinit var biometricButton: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Инициализация EncryptedSharedPreferences
        val masterKey = MasterKey.Builder(this)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        
        authPrefs = EncryptedSharedPreferences.create(
            this,
            "auth_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        
        // Проверяем режим: настройка или вход
        isSetupMode = !authPrefs.contains("pin_code")
        
        createPinUI()
        
        // Если биометрия доступна и включена - предлагаем
        if (!isSetupMode && BiometricAuthHelper.isBiometricAvailable(this) && 
            authPrefs.getBoolean("biometric_enabled", false)) {
            biometricButton.visibility = View.VISIBLE
            offerBiometricAuth()
        }
    }
    
    private fun createPinUI() {
        // Программное создание UI
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 100, 48, 48)
            setBackgroundColor("#0a0a0f".toColorInt())
        }
        
        // Заголовок
        titleText = TextView(this).apply {
            text = if (isSetupMode) "🔐 Создайте PIN-код" else "🔐 Введите PIN-код"
            textSize = 24f
            setTextColor("#00ffff".toColorInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 60)
        }
        rootLayout.addView(titleText)
        
        // Точки для отображения введенных цифр
        pinDotsContainer = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 60)
        }
        for (i in 0..3) {
            val dot = View(this).apply {
                layoutParams = LinearLayout.LayoutParams(24, 24).apply {
                    setMargins(16, 0, 16, 0)
                }
                background = resources.getDrawable(android.R.drawable.ic_menu_circle_outline, theme)
                alpha = 0.3f
            }
            pinDotsContainer.addView(dot)
        }
        rootLayout.addView(pinDotsContainer)
        
        // Кнопки цифр (3x4 grid)
        val numbersGrid = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
        }
        
        val numbers = arrayOf(
            arrayOf("1", "2", "3"),
            arrayOf("4", "5", "6"),
            arrayOf("7", "8", "9"),
            arrayOf("", "0", "⌫")
        )
        
        for (row in numbers) {
            val rowLayout = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER
                setPadding(0, 8, 0, 8)
            }
            
            for (num in row) {
                if (num.isEmpty()) {
                    // Пустое место
                    val spacer = View(this).apply {
                        layoutParams = LinearLayout.LayoutParams(100, 100).apply {
                            setMargins(8, 8, 8, 8)
                        }
                    }
                    rowLayout.addView(spacer)
                } else {
                    val button = Button(this).apply {
                        text = num
                        textSize = 28f
                        layoutParams = LinearLayout.LayoutParams(100, 100).apply {
                            setMargins(8, 8, 8, 8)
                        }
                        setBackgroundColor("#1a1a2e".toColorInt())
                        setTextColor("#00ffff".toColorInt())
                        setOnClickListener {
                            if (num == "⌫") {
                                onBackspace()
                            } else {
                                onNumberClick(num)
                            }
                        }
                    }
                    rowLayout.addView(button)
                }
            }
            numbersGrid.addView(rowLayout)
        }
        rootLayout.addView(numbersGrid)
        
        // Кнопка биометрии (скрыта по умолчанию)
        biometricButton = Button(this).apply {
            text = "👆 Использовать отпечаток"
            textSize = 16f
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 40, 0, 0)
            }
            setBackgroundColor("#1a1a2e".toColorInt())
            setTextColor("#00ffff".toColorInt())
            visibility = View.GONE
            setOnClickListener {
                authenticateWithBiometric()
            }
        }
        rootLayout.addView(biometricButton)
        
        setContentView(rootLayout)
    }
    
    private fun onNumberClick(num: String) {
        if (currentPin.length < 4) {
            currentPin += num
            updatePinDots()
            
            if (currentPin.length == 4) {
                // PIN введен полностью
                android.os.Handler(mainLooper).postDelayed({
                    processPinInput()
                }, 200)
            }
        }
    }
    
    private fun onBackspace() {
        if (currentPin.isNotEmpty()) {
            currentPin = currentPin.dropLast(1)
            updatePinDots()
        }
    }
    
    private fun updatePinDots() {
        for (i in 0..3) {
            val dot = pinDotsContainer.getChildAt(i)
            dot.alpha = if (i < currentPin.length) 1.0f else 0.3f
        }
    }
    
    private fun processPinInput() {
        if (isSetupMode) {
            if (setupPinFirst.isEmpty()) {
                // Первый ввод PIN
                setupPinFirst = currentPin
                currentPin = ""
                titleText.text = "🔐 Подтвердите PIN-код"
                updatePinDots()
            } else {
                // Подтверждение PIN
                if (currentPin == setupPinFirst) {
                    // PIN совпадают - сохраняем
                    authPrefs.edit().putString("pin_code", currentPin).apply()
                    
                    // Предлагаем настроить биометрию
                    offerBiometricSetup()
                } else {
                    // PIN не совпадают
                    Toast.makeText(this, "❌ PIN-коды не совпадают", Toast.LENGTH_SHORT).show()
                    currentPin = ""
                    setupPinFirst = ""
                    titleText.text = "🔐 Создайте PIN-код"
                    updatePinDots()
                }
            }
        } else {
            // Режим входа - проверяем PIN
            val savedPin = authPrefs.getString("pin_code", "")
            if (currentPin == savedPin) {
                // PIN верный
                unlockApp()
            } else {
                // PIN неверный
                Toast.makeText(this, "❌ Неверный PIN-код", Toast.LENGTH_SHORT).show()
                currentPin = ""
                updatePinDots()
                
                // Встряхиваем экран для визуального эффекта
                window.decorView.animate()
                    .translationX(50f)
                    .setDuration(50)
                    .withEndAction {
                        window.decorView.animate()
                            .translationX(-50f)
                            .setDuration(50)
                            .withEndAction {
                                window.decorView.animate()
                                    .translationX(0f)
                                    .setDuration(50)
                                    .start()
                            }
                            .start()
                    }
                    .start()
            }
        }
    }
    
    private fun offerBiometricSetup() {
        if (!BiometricAuthHelper.isBiometricAvailable(this)) {
            // Биометрия недоступна - просто разблокируем
            unlockApp()
            return
        }
        
        AlertDialog.Builder(this)
            .setTitle("👆 Настроить биометрию?")
            .setMessage("Используйте отпечаток пальца или Face ID вместо PIN-кода для быстрого входа.")
            .setPositiveButton("Включить") { _, _ ->
                authPrefs.edit().putBoolean("biometric_enabled", true).apply()
                Toast.makeText(this, "✅ Биометрия включена", Toast.LENGTH_SHORT).show()
                unlockApp()
            }
            .setNegativeButton("Позже") { _, _ ->
                unlockApp()
            }
            .setCancelable(false)
            .show()
    }
    
    private fun offerBiometricAuth() {
        // Автоматически показываем биометрию при входе
        authenticateWithBiometric()
    }
    
    private fun authenticateWithBiometric() {
        BiometricAuthHelper.authenticate(
            activity = this,
            onSuccess = {
                unlockApp()
            },
            onError = { errorCode, errorMessage ->
                Toast.makeText(this, "Ошибка биометрии: $errorMessage", Toast.LENGTH_SHORT).show()
            },
            onFailed = {
                Toast.makeText(this, "Биометрия не распознана", Toast.LENGTH_SHORT).show()
            }
        )
    }
    
    private fun unlockApp() {
        authPrefs.edit().putBoolean("app_unlocked", true).apply()
        finish()
    }
    
    override fun onBackPressed() {
        // Запрещаем выход через Back кнопку
        if (isSetupMode) {
            AlertDialog.Builder(this)
                .setTitle("❌ Выход")
                .setMessage("Для защиты аккаунта необходимо установить PIN-код.")
                .setPositiveButton("Выйти из приложения") { _, _ ->
                    finishAffinity()
                }
                .setNegativeButton("Продолжить настройку", null)
                .show()
        } else {
            // При входе - закрываем приложение
            finishAffinity()
        }
    }
}
