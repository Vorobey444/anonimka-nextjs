'use client';

export default function CreateAdPage() {
  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      <script src="/app.js" defer></script>
      
      <div className="app-container">
        <div id="createAd" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" id="createAdBackBtn" onClick={() => (window as any).handleCreateAdBack()}>← Назад</button>
            <h2>Создать анкету</h2>
          </div>
          
          <form id="adForm" className="form-container">
            {/* Шаг 1: Пол */}
            <div className="form-step active" id="step1">
              <h3>👤 Ваш пол</h3>
              <div className="current-location">
                <p>📍 Ваш город: <span id="formLocationDisplay"></span></p>
                <button type="button" className="change-location-btn" onClick={() => (window as any).showLocationSetup()}>
                  📍 Сменить город
                </button>
              </div>
              <div className="gender-select">
                <button type="button" className="gender-btn" data-gender="Мужчина">
                  <span className="icon">👨</span>
                  Мужчина
                </button>
                <button type="button" className="gender-btn" data-gender="Девушка">
                  <span className="icon">👩</span>
                  Девушка
                </button>
                <button type="button" className="gender-btn" data-gender="Пара">
                  <span className="icon">👫</span>
                  Пара
                </button>
              </div>
            </div>

            {/* Остальные шаги будут управляться через JS */}
            <div className="form-step" id="step2" style={{display: 'none'}}>
              <h3>🔍 Кого ищете</h3>
              <div className="target-select">
                <button type="button" className="target-btn" data-target="Мужчину">👨 Мужчину</button>
                <button type="button" className="target-btn" data-target="Девушку">👩 Девушку</button>
                <button type="button" className="target-btn" data-target="Пару">👫 Пару</button>
              </div>
            </div>

            <div className="form-step" id="step3" style={{display: 'none'}}>
              <h3>🎯 Цель общения</h3>
              <div className="goal-select">
                <button type="button" className="goal-btn" data-goal="Дружба">🤝 Дружба</button>
                <button type="button" className="goal-btn" data-goal="Флирт">😊 Флирт</button>
                <button type="button" className="goal-btn" data-goal="Путешествия">✈️ Путешествия</button>
                <button type="button" className="goal-btn" data-goal="Общение">💬 Общение</button>
                <button type="button" className="goal-btn" data-goal="Секс">🔥 Секс</button>
                <button type="button" className="goal-btn" data-goal="Другое">❓ Другое</button>
              </div>
            </div>

            {/* Добавить остальные шаги */}
          </form>

          <div className="form-navigation">
            <button id="prevBtn" className="nav-btn" onClick={() => (window as any).previousStep()} style={{display: 'none'}}>← Назад</button>
            <button id="nextBtn" className="nav-btn primary" onClick={() => (window as any).nextStep()}>Далее →</button>
            <button id="submitBtn" className="nav-btn success" onClick={() => (window as any).submitAd()} style={{display: 'none'}}>🚀 Опубликовать</button>
          </div>
        </div>
      </div>
    </>
  );
}
