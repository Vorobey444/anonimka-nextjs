'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#e0e0e0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: 0
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔄</div>
        <h2 style={{ marginBottom: '15px', color: '#00d9ff' }}>Обновление приложения</h2>
        <p style={{ marginBottom: '25px', color: '#888', maxWidth: '300px' }}>
          Приложение обновляется. Пожалуйста, обновите страницу.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #00d9ff, #8338ec)',
            border: 'none',
            borderRadius: '25px',
            color: 'white',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Обновить страницу
        </button>
      </body>
    </html>
  );
}
