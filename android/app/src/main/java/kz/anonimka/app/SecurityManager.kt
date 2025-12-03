package kz.anonimka.app

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import java.io.File
import java.security.MessageDigest

/**
 * SecurityManager - комплексная система безопасности приложения
 * 
 * Включает:
 * - Root Detection (обнаружение root-доступа)
 * - Tamper Detection (проверка целостности APK)
 * - SSL Certificate Pinning (проверка сертификатов)
 */
object SecurityManager {
    
    // SSL Certificate Pinning - SHA256 публичных ключей сертификатов
    private const val RU_ANONIMKA_PIN = "sha256/+K1EwYnntOwmSZhBKYL6R5+mI8ea15nkPDWuXPTHpAs="
    private const val ANONIMKA_PIN = "sha256/wQGsjY7bl1F7nA33OYYFiBmXi+UC7YS2y3LP0WpDvs8="
    
    // Известные пути root-файлов
    private val ROOT_PATHS = arrayOf(
        "/system/app/Superuser.apk",
        "/sbin/su",
        "/system/bin/su",
        "/system/xbin/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/su",
        "/su/bin/su"
    )
    
    // Известные root-приложения
    private val ROOT_PACKAGES = arrayOf(
        "com.noshufou.android.su",
        "com.noshufou.android.su.elite",
        "eu.chainfire.supersu",
        "com.koushikdutta.superuser",
        "com.thirdparty.superuser",
        "com.yellowes.su",
        "com.topjohnwu.magisk"
    )
    
    /**
     * Создаёт OkHttpClient с SSL Certificate Pinning
     */
    fun createSecureOkHttpClient(): OkHttpClient {
        val certificatePinner = CertificatePinner.Builder()
            .add("ru.anonimka.kz", RU_ANONIMKA_PIN)
            .add("anonimka.kz", ANONIMKA_PIN)
            .build()
        
        return OkHttpClient.Builder()
            .certificatePinner(certificatePinner)
            .build()
    }
    
    /**
     * Проверка на наличие root-доступа
     * @param context Context для проверки пакетов
     * @return true если устройство рутовано
     */
    fun isDeviceRooted(context: Context): Boolean {
        return checkRootFiles() || checkRootPackages(context) || checkSuCommand()
    }
    
    /**
     * Проверка наличия root-файлов
     */
    private fun checkRootFiles(): Boolean {
        return ROOT_PATHS.any { path ->
            try {
                File(path).exists()
            } catch (e: Exception) {
                false
            }
        }
    }
    
    /**
     * Проверка наличия root-приложений
     */
    private fun checkRootPackages(context: Context): Boolean {
        return ROOT_PACKAGES.any { packageName ->
            try {
                val pm = context.packageManager
                pm.getPackageInfo(packageName, 0)
                true
            } catch (e: Exception) {
                false
            }
        }
    }
    
    /**
     * Проверка выполнения команды su
     */
    private fun checkSuCommand(): Boolean {
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("which", "su"))
            val output = process.inputStream.bufferedReader().readText()
            process.waitFor()
            output.isNotEmpty()
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Проверка целостности APK (Tamper Detection)
     * Сравнивает сигнатуру установленного APK с оригинальной
     * 
     * @param context контекст приложения
     * @param expectedSignature SHA256 хеш оригинальной сигнатуры (опционально)
     * @return true если APK не изменён
     */
    @Suppress("DEPRECATION")
    fun verifyAppIntegrity(context: Context, expectedSignature: String? = null): Boolean {
        return try {
            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                context.packageManager.getPackageInfo(
                    context.packageName,
                    PackageManager.GET_SIGNING_CERTIFICATES
                )
            } else {
                context.packageManager.getPackageInfo(
                    context.packageName,
                    PackageManager.GET_SIGNATURES
                )
            }
            
            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.signingInfo?.apkContentsSigners
            } else {
                packageInfo.signatures
            }
            
            if (signatures == null || signatures.isEmpty()) {
                return false
            }
            
            // Если не указана ожидаемая сигнатура, просто проверяем что она есть
            if (expectedSignature == null) {
                return true
            }
            
            // Вычисляем SHA256 хеш сигнатуры
            val signature = signatures[0]
            val md = MessageDigest.getInstance("SHA-256")
            val digest = md.digest(signature.toByteArray())
            val hexString = digest.joinToString("") { "%02x".format(it) }
            
            hexString.equals(expectedSignature, ignoreCase = true)
        } catch (e: Exception) {
            if (BuildConfig.DEBUG) {
                android.util.Log.e("SecurityManager", "Integrity check failed", e)
            }
            false
        }
    }
    
    /**
     * Проверка запуска на эмуляторе
     * @return true если приложение запущено на эмуляторе
     */
    fun isEmulator(): Boolean {
        return (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.PRODUCT.contains("sdk_google")
                || Build.PRODUCT.contains("google_sdk")
                || Build.PRODUCT.contains("sdk")
                || Build.PRODUCT.contains("sdk_x86")
                || Build.PRODUCT.contains("vbox86p")
                || Build.PRODUCT.contains("emulator")
                || Build.PRODUCT.contains("simulator")
    }
    
    /**
     * Комплексная проверка безопасности
     * @param context Context для проверок
     * @return SecurityStatus с результатами всех проверок
     */
    fun performSecurityCheck(context: Context): SecurityStatus {
        return SecurityStatus(
            isRooted = isDeviceRooted(context),
            isEmulator = isEmulator(),
            isIntegrityValid = verifyAppIntegrity(context),
            hasCertificatePinning = true
        )
    }
    
    /**
     * Результат проверки безопасности
     */
    data class SecurityStatus(
        val isRooted: Boolean,
        val isEmulator: Boolean,
        val isIntegrityValid: Boolean,
        val hasCertificatePinning: Boolean
    ) {
        val isSecure: Boolean
            get() = !isRooted && isIntegrityValid
        
        val warnings: List<String>
            get() = buildList {
                if (isRooted) add("⚠️ Обнаружен root-доступ")
                if (isEmulator) add("⚠️ Запуск на эмуляторе")
                if (!isIntegrityValid) add("⚠️ APK был модифицирован")
            }
    }
}
