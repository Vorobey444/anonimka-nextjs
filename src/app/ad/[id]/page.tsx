'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Ad {
  id: number
  user_id: number
  nickname: string
  gender: string
  age: number
  location: string
  text: string
  photo_url?: string
  created_at: string
}

export default function AdDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const adId = params.id as string
  
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingChat, setCreatingChat] = useState(false)

  useEffect(() => {
    if (adId) {
      loadAd()
    }
  }, [adId])

  const loadAd = async () => {
    try {
      const res = await fetch(`/api/ads?id=${adId}`)
      const data = await res.json()

      if (data.success && data.ad) {
        setAd(data.ad)
      } else {
        alert('Анкета не найдена')
        router.push('/browse')
      }
    } catch (err) {
      console.error('Error loading ad:', err)
      alert('Ошибка загрузки анкеты')
      router.push('/browse')
    } finally {
      setLoading(false)
    }
  }

  const handleContact = async () => {
    if (!ad || creatingChat) return

    setCreatingChat(true)

    try {
      const token = localStorage.getItem('user_token')
      
      const res = await fetch('/api/create-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: ad.user_id })
      })

      const data = await res.json()

      if (data.success && data.chatId) {
        router.push(`/chat/${data.chatId}`)
      } else {
        alert(data.error || 'Ошибка создания чата')
      }
    } catch (err) {
      console.error('Create chat error:', err)
      alert('Ошибка создания чата')
    } finally {
      setCreatingChat(false)
    }
  }

  const getGenderEmoji = (gender: string) => {
    if (gender === 'male') return '♂️'
    if (gender === 'female') return '♀️'
    return '⚧️'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Сегодня'
    if (days === 1) return 'Вчера'
    if (days < 7) return `${days} дн. назад`
    return date.toLocaleDateString('ru-RU')
  }

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div id="adDetails" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.push('/browse')}>← Назад</button>
            <h2>Анкета</h2>
          </div>

          {loading ? (
            <div className="loading-state">Загрузка...</div>
          ) : ad ? (
            <div className="ad-details-content">
              {ad.photo_url && (
                <div className="ad-photo-large">
                  <img src={ad.photo_url} alt="Photo" />
                </div>
              )}

              <div className="ad-info-card">
                <div className="ad-header-details">
                  <h2 className="ad-nickname">{ad.nickname}</h2>
                  <div className="ad-basic-info">
                    <span className="info-item">
                      {getGenderEmoji(ad.gender)} {ad.age} лет
                    </span>
                    <span className="info-item">
                      📍 {ad.location}
                    </span>
                  </div>
                </div>

                <div className="ad-text-section">
                  <h3>О себе:</h3>
                  <p className="ad-text-full">{ad.text}</p>
                </div>

                <div className="ad-meta">
                  <span className="ad-date">
                    🕐 {formatDate(ad.created_at)}
                  </span>
                </div>
              </div>

              <button 
                className="contact-btn"
                onClick={handleContact}
                disabled={creatingChat}
              >
                {creatingChat ? '⏳ Создание чата...' : '💬 Написать'}
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p>Анкета не найдена</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ad-details-content {
          padding: 1rem;
        }

        .ad-photo-large {
          width: 100%;
          max-height: 400px;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 1.5rem;
          background: rgba(20, 20, 35, 0.6);
          border: 2px solid rgba(131, 56, 236, 0.3);
        }

        .ad-photo-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ad-info-card {
          background: rgba(20, 20, 35, 0.6);
          border: 2px solid rgba(131, 56, 236, 0.3);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .ad-header-details {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ad-nickname {
          color: #8338ec;
          font-size: 1.5rem;
          margin: 0 0 0.75rem 0;
          font-weight: 700;
        }

        .ad-basic-info {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .info-item {
          color: var(--text-color);
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .ad-text-section h3 {
          color: var(--text-color);
          font-size: 1.1rem;
          margin: 0 0 0.75rem 0;
        }

        .ad-text-full {
          color: var(--text-color);
          line-height: 1.6;
          font-size: 1rem;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .ad-meta {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ad-date {
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        .contact-btn {
          width: 100%;
          padding: 1.125rem;
          background: linear-gradient(135deg, #ff006e, #cc0058);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 0, 110, 0.3);
        }

        .contact-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 0, 110, 0.4);
        }

        .contact-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-gray);
        }
      `}</style>
    </>
  )
}
