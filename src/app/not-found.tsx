'use client';

import { useRouter } from 'next/navigation';
import './globals.css';

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '20px',
        padding: '40px 30px',
        textAlign: 'center',
        border: '2px solid rgba(255, 0, 110, 0.3)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 50px rgba(255, 0, 110, 0.1)'
      }}>
        {/* Иконка */}
        <div style={{
          fontSize: '80px',
          marginBottom: '20px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          🔧
        </div>

        {/* Заголовок */}
        <h1 style={{
          color: '#ff006e',
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '15px',
          textShadow: '0 0 20px rgba(255, 0, 110, 0.6)'
        }}>
          Технические работы
        </h1>

        {/* Подзаголовок */}
        <p style={{
          color: '#00d9ff',
          fontSize: '1.1rem',
          marginBottom: '25px',
          fontWeight: '600'
        }}>
          Страница временно недоступна
        </p>

        {/* Описание */}
        <div style={{
          background: 'rgba(255, 0, 110, 0.1)',
          borderLeft: '4px solid #ff006e',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <p style={{
            color: '#ffffff',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            margin: 0
          }}>
            ⚙️ Мы проводим техническое обслуживание для улучшения работы сайта.<br/><br/>
            ⏱️ Приложение скоро заработает в полном объёме.<br/><br/>
            💡 Попробуйте обновить страницу через несколько минут.
          </p>
        </div>

        {/* Кнопка возврата */}
        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            padding: '15px',
            background: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            boxShadow: '0 0 20px rgba(255, 0, 110, 0.3)',
            transition: 'all 0.3s ease',
            marginBottom: '15px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 0, 110, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 0, 110, 0.3)';
          }}
        >
          🏠 Вернуться на главную
        </button>

        {/* Дополнительная кнопка */}
        <button
          onClick={() => window.location.reload()}
          style={{
            width: '100%',
            padding: '15px',
            background: 'rgba(0, 217, 255, 0.1)',
            color: '#00d9ff',
            border: '2px solid #00d9ff',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0, 217, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🔄 Обновить страницу
        </button>

        {/* Футер */}
        <p style={{
          color: '#888',
          fontSize: '0.85rem',
          marginTop: '30px',
          lineHeight: '1.5'
        }}>
          Если проблема сохраняется, свяжитесь с нами:<br/>
          <a href="https://t.me/Vorobey_444" target="_blank" style={{
            color: '#00d9ff',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            @Vorobey_444
          </a>
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
