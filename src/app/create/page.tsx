'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary'

function CreateAdPageContent() {
  useEffect(() => {
    // Динамическая загрузка скриптов
    const loadScripts = async () => {
      const scripts = [
        'https://telegram.org/js/telegram-web-app.js',
        '/js/core.js',
        '/js/create-ad.js'
      ];

      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          script.onload = () => {
            console.log(`✅ Loaded: ${src}`);
            resolve();
          };
          script.onerror = () => {
            console.error(`❌ Failed to load: ${src}`);
            reject();
          };
          document.head.appendChild(script);
        });
      }
      
      console.log('🎉 All create-ad scripts loaded');
    };

    loadScripts();
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        {/* Создание анкеты - ТОЧНАЯ КОПИЯ С WORK */}
        <div id="createAd" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" id="createAdBackBtn" onClick={() => (window as any).handleCreateAdBack?.()}>← Назад</button>
            <h2>Создать анкету</h2>
          </div>

          <form id="adForm" className="form-container">
            {/* Шаг 1: Пол */}
            <div className="form-step active" id="step1">
              <h3>👤 Ваш пол</h3>
              <div className="current-location">
                <p>📍 Ваш город: <span id="formLocationDisplay"></span></p>
                <button type="button" className="change-location-btn" onClick={() => (window as any).showLocationSetup?.()}>
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

            {/* Шаг 2: Кого ищете */}
            <div className="form-step" id="step2">
              <h3>🔍 Кого ищете</h3>
              <div className="target-select">
                <button type="button" className="target-btn" data-target="Мужчину">👨 Мужчину</button>
                <button type="button" className="target-btn" data-target="Девушку">👩 Девушку</button>
                <button type="button" className="target-btn" data-target="Пару">👫 Пару</button>
              </div>
            </div>

            {/* Шаг 3: Цель общения */}
            <div className="form-step" id="step3">
              <h3>🎯 Цель общения</h3>
              <p style={{fontSize: '0.9rem', color: 'var(--text-gray)', marginBottom: '15px'}}>Выберите одну или несколько целей</p>
              <div className="goal-select">
                <button type="button" className="goal-btn" data-goal="Дружба">🤝 Дружба</button>
                <button type="button" className="goal-btn" data-goal="Флирт">😊 Флирт</button>
                <button type="button" className="goal-btn" data-goal="Путешествия">✈️ Путешествия</button>
                <button type="button" className="goal-btn" data-goal="Общение">💬 Общение</button>
                <button type="button" className="goal-btn" data-goal="Секс">🔥 Секс</button>
                <button type="button" className="goal-btn" data-goal="Другое">❓ Другое</button>
              </div>
            </div>

            {/* Шаг 4: Возраст партнера */}
            <div className="form-step" id="step4">
              <h3>📅 Возраст партнера</h3>
              <div className="age-range">
                <div className="input-group">
                  <label>От</label>
                  <div className="age-control">
                    <button type="button" className="age-btn minus" onClick={() => (window as any).decreaseAge?.('ageFrom')}>−</button>
                    <input type="number" id="ageFrom" min="18" max="99" className="neon-input small" placeholder="" />
                    <button type="button" className="age-btn plus" onClick={() => (window as any).increaseAge?.('ageFrom')}>+</button>
                  </div>
                </div>
                <div className="input-group">
                  <label>До</label>
                  <div className="age-control">
                    <button type="button" className="age-btn minus" onClick={() => (window as any).decreaseAge?.('ageTo')}>−</button>
                    <input type="number" id="ageTo" min="18" max="99" className="neon-input small" placeholder="" />
                    <button type="button" className="age-btn plus" onClick={() => (window as any).increaseAge?.('ageTo')}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Шаг 5: Ваш возраст */}
            <div className="form-step" id="step5">
              <h3>🎂 Ваш возраст</h3>
              <div className="age-control centered">
                <button type="button" className="age-btn minus" onClick={() => (window as any).decreaseAge?.('myAge')}>−</button>
                <input type="number" id="myAge" min="18" max="99" className="neon-input" placeholder="" />
                <button type="button" className="age-btn plus" onClick={() => (window as any).increaseAge?.('myAge')}>+</button>
              </div>
            </div>

            {/* Шаг 6: Телосложение */}
            <div className="form-step" id="step6">
              <h3>💪 Телосложение</h3>
              <div className="body-select">
                <button type="button" className="body-btn" data-body="Стройное">✨ Стройное</button>
                <button type="button" className="body-btn" data-body="Обычное">👤 Обычное</button>
                <button type="button" className="body-btn" data-body="Плотное">💪 Плотное</button>
                <button type="button" className="body-btn" data-body="Спортивное">🏋️ Спортивное</button>
                <button type="button" className="body-btn" data-body="Другое">❓ Другое</button>
              </div>
            </div>

            {/* Шаг 7: Ориентация */}
            <div className="form-step" id="step7">
              <h3>💗 Ориентация</h3>
              <div className="body-select">
                <button type="button" className="body-btn" data-orientation="hetero">💏 Гетеро</button>
                <button type="button" className="body-btn" data-orientation="gay">🔥 Гей / Лесбиянка</button>
                <button type="button" className="body-btn" data-orientation="bi">😈 Би</button>
                <button type="button" className="body-btn" data-orientation="other">❓ Другое</button>
              </div>
            </div>

            {/* Шаг 8: Текст анкеты */}
            <div className="form-step" id="step8">
              <h3>💬 Текст анкеты</h3>
            </div>

            {/* Шаг 9: Добавление фото (опционально) */}
            <div className="form-step" id="step9">
              <h3>📸 Фото</h3>
              <p style={{color: 'var(--text-gray)', textAlign: 'center', marginBottom: '12px', fontSize: '0.85rem'}}>
                Опционально. Можно пропустить
              </p>

              {/* Галерея существующих фото */}
              <div id="step9PhotoGallery" style={{display: 'none', marginBottom: '12px'}}></div>

              <button type="button" id="addAdPhotoBtn" className="neon-button primary full-width" onClick={() => (window as any).addAdPhoto?.()} style={{marginBottom: 0}}>
                <span>📷 Выбрать фото</span>
              </button>
            </div>
          </form>

          {/* Textarea вынесен отдельно для обхода проблем с display */}
          <div id="textareaContainer" style={{display: 'none', textAlign: 'center', padding: '0 20px'}}>
            <textarea
              id="adText"
              placeholder="Расскажите о себе и что ищете..."
              rows={6}
              maxLength={500}
              onInput={() => (window as any).updateCharacterCount?.()}
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '15px',
                background: 'rgba(26, 26, 46, 0.8)',
                border: '2px solid #ff00ff',
                borderRadius: '15px',
                color: '#e0e0ff',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: '120px',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                boxSizing: 'border-box',
                display: 'block',
                visibility: 'visible',
                opacity: 1
              }}
            ></textarea>
            <div id="charCounter" style={{textAlign: 'right', color: 'var(--text-gray)', fontSize: '0.85rem', marginTop: '5px'}}>
              0/500
            </div>
          </div>

          {/* Навигация формы */}
          <div className="form-navigation">
            <button id="prevBtn" className="nav-btn" onClick={() => (window as any).previousStep?.()} style={{display: 'none'}}>← Назад</button>
            <button id="nextBtn" className="nav-btn primary" onClick={() => (window as any).nextStep?.()}>Далее →</button>
            <button id="submitBtn" className="nav-btn success" onClick={() => (window as any).submitAd?.()} style={{display: 'none'}}>🚀 Опубликовать</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CreateAdPage() {
  return (
    <ErrorBoundary>
      <CreateAdPageContent />
    </ErrorBoundary>
  )
}
