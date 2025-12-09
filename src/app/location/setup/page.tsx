'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function LocationSetupPageContent() {
  const router = useRouter()
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)

  const countries = ['Казахстан', 'Россия', 'Беларусь', 'Украина', 'Другая']

  const handleSave = async () => {
    if (!country || !city) {
      alert('Выберите страну и город')
      return
    }

    setLoading(true)

    try {
      // Сохраняем локацию
      const locationData = {
        country,
        region: region || null,
        city,
        auto: false
      }

      localStorage.setItem('user_location', JSON.stringify(locationData))

      // Отправляем на сервер (если нужно)
      const token = localStorage.getItem('user_token')
      if (token) {
        await fetch('/api/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ location: locationData })
        })
      }

      // Переходим на главную
      router.push('/menu')
    } catch (err) {
      console.error('Error saving location:', err)
      alert('Ошибка сохранения локации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div id="locationSetup" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.back()}>← Назад</button>
            <div className="logo">
              <div className="neon-icon">🎯</div>
              <h1>Настройка локации</h1>
              <p>Укажите ваше местоположение</p>
            </div>
          </div>

          <div className="location-setup-content">
            <div className="form-group">
              <label htmlFor="country">Страна *</label>
              <select
                id="country"
                className="form-control"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Выберите страну</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="region">Регион / Область</label>
              <input
                type="text"
                id="region"
                className="form-control"
                placeholder="Например: Алматинская область"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">Город *</label>
              <input
                type="text"
                id="city"
                className="form-control"
                placeholder="Например: Алматы"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <div className="info-box">
              💡 Локация используется для подбора анкет из вашего региона
            </div>

            <button 
              className="neon-button"
              onClick={handleSave}
              disabled={loading || !country || !city}
            >
              {loading ? 'Сохранение...' : 'Сохранить →'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .location-setup-content {
          padding: 1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          color: var(--text-color);
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .form-control {
          width: 100%;
          padding: 1rem;
          background: rgba(20, 20, 35, 0.6);
          border: 2px solid rgba(131, 56, 236, 0.3);
          border-radius: 12px;
          color: var(--text-color);
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-control:focus {
          outline: none;
          border-color: #8338ec;
          box-shadow: 0 0 20px rgba(131, 56, 236, 0.3);
        }

        .form-control option {
          background: #1a1a2e;
          color: var(--text-color);
        }

        .neon-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}

export default function LocationSetupPage() {
  return (
    <ErrorBoundary>
      <LocationSetupPageContent />
    </ErrorBoundary>
  )
}
