package kz.anonimka.app

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

/**
 * BiometricAuthHelper - помощник для биометрической аутентификации
 * 
 * Поддерживает:
 * - Отпечаток пальца
 * - Face ID / Face Unlock
 * - Iris Scanner
 */
class BiometricAuthHelper(private val activity: FragmentActivity) {
    
    private val biometricManager = BiometricManager.from(activity)
    
    /**
     * Проверяет доступность биометрической аутентификации
     */
    fun isBiometricAvailable(): Boolean {
        return when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS -> true
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> false
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> false
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> false
            else -> false
        }
    }
    
    /**
     * Получает статус биометрии
     */
    fun getBiometricStatus(): BiometricStatus {
        return when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS -> 
                BiometricStatus.Available
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> 
                BiometricStatus.NoHardware
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> 
                BiometricStatus.HardwareUnavailable
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> 
                BiometricStatus.NoneEnrolled
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED ->
                BiometricStatus.SecurityUpdateRequired
            else -> 
                BiometricStatus.Unknown
        }
    }
    
    /**
     * Показывает диалог биометрической аутентификации
     * 
     * @param title заголовок диалога
     * @param subtitle подзаголовок
     * @param description описание
     * @param onSuccess коллбек успешной аутентификации
     * @param onError коллбек ошибки
     * @param onFailed коллбек неудачной попытки
     */
    fun authenticate(
        title: String = "Биометрическая аутентификация",
        subtitle: String = "Подтвердите свою личность",
        description: String = "Используйте отпечаток пальца или Face ID",
        onSuccess: () -> Unit,
        onError: (errorCode: Int, errorMessage: String) -> Unit = { _, _ -> },
        onFailed: () -> Unit = {}
    ) {
        val executor = ContextCompat.getMainExecutor(activity)
        
        val biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess()
                }
                
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    onError(errorCode, errString.toString())
                }
                
                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    onFailed()
                }
            }
        )
        
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription(description)
            .setNegativeButtonText("Отмена")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build()
        
        biometricPrompt.authenticate(promptInfo)
    }
    
    /**
     * Статус биометрической аутентификации
     */
    sealed class BiometricStatus {
        object Available : BiometricStatus()
        object NoHardware : BiometricStatus()
        object HardwareUnavailable : BiometricStatus()
        object NoneEnrolled : BiometricStatus()
        object SecurityUpdateRequired : BiometricStatus()
        object Unknown : BiometricStatus()
        
        val message: String
            get() = when (this) {
                is Available -> "Биометрия доступна"
                is NoHardware -> "Биометрический сканер отсутствует"
                is HardwareUnavailable -> "Биометрический сканер недоступен"
                is NoneEnrolled -> "Не настроены отпечатки пальцев или Face ID"
                is SecurityUpdateRequired -> "Требуется обновление безопасности"
                is Unknown -> "Неизвестный статус"
            }
    }
    
    companion object {
        /**
         * Быстрая проверка доступности биометрии
         */
        fun isAvailable(context: Context): Boolean {
            val biometricManager = BiometricManager.from(context)
            return biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG
            ) == BiometricManager.BIOMETRIC_SUCCESS
        }
    }
}
