'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function MyPhotosPageContent() {
  const router = useRouter()
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const token = localStorage.getItem('user_token')
      if (!token) {
        router.push('/')
        return
      }

      const res = await fetch('/api/user-photos', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success) {
        setPhotos(data.photos || [])
      }
    } catch (err) {
      console.error('Error loading photos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (photos.length >= 5) {
      alert('Максимум 5 фотографий')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой (максимум 10 МБ)')
      return
    }

    setUploading(true)

    try {
      const token = localStorage.getItem('user_token')
      const formData = new FormData()
      formData.append('photo', file)

      const res = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        await loadPhotos()
      } else {
        alert(data.error || 'Ошибка загрузки')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Ошибка загрузки фото')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId: number) => {
    if (!confirm('Удалить эту фотографию?')) return

    try {
      const token = localStorage.getItem('user_token')
      const res = await fetch('/api/user-photos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ photoId })
      })

      const data = await res.json()

      if (data.success) {
        await loadPhotos()
      } else {
        alert(data.error || 'Ошибка удаления')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Ошибка удаления фото')
    }
  }

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div id="myPhotosScreen" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.back()}>← Назад</button>
            <h2>📸 Мои фотографии</h2>
          </div>

          <div className="my-photos-content">
            <div className="info-box">
              💡 Максимум 5 фотографий. Они будут видны в ваших объявлениях.
            </div>

            {loading ? (
              <div className="loading-state">Загрузка...</div>
            ) : (
              <>
                <div className="photos-grid">
                  {photos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.url} alt="Фото" />
                      <button
                        className="delete-photo-btn"
                        onClick={() => handleDelete(photo.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}

                  {photos.length < 5 && (
                    <label className="upload-photo-btn">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                        style={{display: 'none'}}
                      />
                      <div className="upload-icon">
                        {uploading ? '⏳' : '➕'}
                      </div>
                      <div className="upload-text">
                        {uploading ? 'Загрузка...' : 'Добавить фото'}
                      </div>
                    </label>
                  )}
                </div>

                {photos.length === 0 && !uploading && (
                  <div className="empty-state">
                    <p>У вас пока нет фотографий</p>
                    <p className="empty-hint">Добавьте фото, чтобы сделать анкеты привлекательнее</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .my-photos-content {
          padding: 1rem;
        }

        .photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin: 2rem 0;
        }

        .photo-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid rgba(131, 56, 236, 0.3);
        }

        .photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .delete-photo-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 68, 68, 0.9);
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .delete-photo-btn:hover {
          background: rgba(255, 68, 68, 1);
          transform: scale(1.1);
        }

        .upload-photo-btn {
          aspect-ratio: 1;
          border: 2px dashed rgba(131, 56, 236, 0.5);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(20, 20, 35, 0.3);
        }

        .upload-photo-btn:hover {
          border-color: #8338ec;
          background: rgba(131, 56, 236, 0.1);
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .upload-text {
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-gray);
        }

        .empty-hint {
          font-size: 0.9rem;
          opacity: 0.7;
          margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
          .photos-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 0.75rem;
          }
        }
      `}</style>
    </>
  )
}

export default function MyPhotosPage() {
  return (
    <ErrorBoundary>
      <MyPhotosPageContent />
    </ErrorBoundary>
  )
}
