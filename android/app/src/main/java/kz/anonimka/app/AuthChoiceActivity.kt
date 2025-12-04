package kz.anonimka.app

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.card.MaterialCardView

class AuthChoiceActivity : AppCompatActivity() {
    private lateinit var rootLayout: View
    private lateinit var emailAuthCard: MaterialCardView
    private lateinit var googleAuthCard: MaterialCardView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        setContentView(R.layout.activity_auth_choice)

        rootLayout = findViewById(R.id.root_layout_auth_choice)
        emailAuthCard = findViewById(R.id.emailAuthCard)
        googleAuthCard = findViewById(R.id.googleAuthCard)

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            windowInsets
        }

        // Email авторизация
        emailAuthCard.setOnClickListener {
            val intent = Intent(this, EmailAuthActivity::class.java)
            startActivity(intent)
        }

        // Google авторизация
        googleAuthCard.setOnClickListener {
            val intent = Intent(this, GoogleAuthActivity::class.java)
            startActivity(intent)
        }
    }
}
