'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Message {
  id: number
  sender_id: number
  sender_nickname: string
  message: string
  created_at: string
  is_mine: boolean
}

export default function ChatViewPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.id as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatPartner, setChatPartner] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatId) {
      loadMessages()
      const interval = setInterval(loadMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('user_token')
      
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success) {
        setMessages(data.messages || [])
        if (data.messages.length > 0) {
          const partner = data.messages.find((m: Message) => !m.is_mine)
          if (partner) {
            setChatPartner(partner.sender_nickname)
          }
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || sending) return

    setSending(true)

    try {
      const token = localStorage.getItem('user_token')
      
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          chatId: parseInt(chatId), 
          message: newMessage.trim() 
        })
      })

      const data = await res.json()

      if (data.success) {
        setNewMessage('')
        await loadMessages()
      } else {
        alert(data.error || 'Ошибка отправки')
      }
    } catch (err) {
      console.error('Send error:', err)
      alert('Ошибка отправки сообщения')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 24) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    }
  }

  return (
    <>
      <link rel="stylesheet" href="/style.css" />
      
      <div className="app-container">
        <div id="chatView" className="screen" style={{display: 'block'}}>
          <div className="header">
            <button className="back-btn" onClick={() => router.push('/chats')}>← Назад</button>
            <h2>{chatPartner || 'Чат'}</h2>
          </div>

          <div className="chat-container">
            {loading ? (
              <div className="loading-state">Загрузка...</div>
            ) : (
              <div className="messages-area">
                {messages.length > 0 ? (
                  <>
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`message-bubble ${msg.is_mine ? 'mine' : 'theirs'}`}
                      >
                        {!msg.is_mine && (
                          <div className="message-author">{msg.sender_nickname}</div>
                        )}
                        <div className="message-text">{msg.message}</div>
                        <div className="message-time">{formatTime(msg.created_at)}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="empty-state">
                    <p>Начните разговор</p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSend} className="message-input-form">
              <input
                type="text"
                className="message-input"
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={1000}
                disabled={sending}
              />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? '⏳' : '📤'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 70px);
          padding: 1rem;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .message-bubble {
          max-width: 75%;
          padding: 0.875rem 1.125rem;
          border-radius: 18px;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-bubble.mine {
          align-self: flex-end;
          background: linear-gradient(135deg, #ff006e, #cc0058);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message-bubble.theirs {
          align-self: flex-start;
          background: rgba(20, 20, 35, 0.8);
          border: 1px solid rgba(131, 56, 236, 0.3);
          color: var(--text-color);
          border-bottom-left-radius: 4px;
        }

        .message-author {
          font-size: 0.85rem;
          color: #8338ec;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .message-text {
          line-height: 1.4;
          word-wrap: break-word;
          margin-bottom: 0.25rem;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.7;
          text-align: right;
        }

        .message-input-form {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(20, 20, 35, 0.8);
          border-radius: 16px;
          border: 2px solid rgba(255, 0, 110, 0.3);
        }

        .message-input {
          flex: 1;
          padding: 0.875rem 1rem;
          background: rgba(30, 30, 45, 0.6);
          border: 2px solid rgba(255, 0, 110, 0.3);
          border-radius: 12px;
          color: var(--text-color);
          font-size: 1rem;
        }

        .message-input:focus {
          outline: none;
          border-color: #ff006e;
          box-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
        }

        .message-input::placeholder {
          color: var(--text-gray);
        }

        .send-btn {
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #ff006e, #cc0058);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 0, 110, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
