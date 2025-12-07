export default function MyPhotoPage() {
  return (
    <html lang="ru">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Мои фото - Anonimka</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#e0e0e0',
        minHeight: '100vh'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px'
          }}>
            <button
              onClick={() => window.history.back()}
              style={{
                background: 'rgba(131, 56, 236, 0.2)',
                border: '1px solid rgba(131, 56, 236, 0.5)',
                color: '#8338ec',
                padding: '8px 15px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginRight: '15px'
              }}
            >
              ← Назад
            </button>
            <h1 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>📸 Мои фото</h1>
          </div>

          {/* Info Banner */}
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '15px',
            background: 'rgba(0, 217, 255, 0.1)',
            borderLeft: '3px solid #00d9ff',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
            <div>
              <p id="photosLimitText" style={{
                margin: '0 0 5px 0',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}>
                Загрузка...
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#888'
              }}>
                Фото будут показаны во всех ваших активных объявлениях
              </p>
            </div>
          </div>

          {/* Add Photo Button */}
          <button
            id="addPhotoBtn"
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #8338ec 0%, #00d9ff 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '20px',
              boxShadow: '0 4px 15px rgba(131, 56, 236, 0.3)'
            }}
          >
            ➕ Добавить фото
          </button>

          {/* Photos Gallery */}
          <div
            id="photosGallery"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              minHeight: '300px'
            }}
          >
            <p style={{
              textAlign: 'center',
              color: '#888',
              margin: '60px 0'
            }}>
              ⏳ Загрузка фото...
            </p>
          </div>
        </div>

        {/* JavaScript */}
        <script dangerouslySetInnerHTML={{ __html: `
          const tg = window.Telegram?.WebApp;
          if (tg) {
            tg.ready();
            tg.expand();
          }

          // Get userToken from URL or localStorage
          const urlParams = new URLSearchParams(window.location.search);
          const userToken = urlParams.get('userToken') || localStorage.getItem('user_token');

          if (!userToken) {
            document.getElementById('photosGallery').innerHTML = \`
              <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;">🔐</div>
                <h3 style="color: #e0e0e0; margin: 0 0 15px 0;">Требуется авторизация</h3>
                <p style="color: #888; margin: 0;">Откройте эту страницу через Telegram бот</p>
              </div>
            \`;
          } else {
            loadPhotos();
          }

          // Load photos from API
          async function loadPhotos() {
            const gallery = document.getElementById('photosGallery');
            const limitText = document.getElementById('photosLimitText');

            try {
              const resp = await fetch('/api/user-photos?userToken=' + userToken);
              const result = await resp.json();

              if (result.error) {
                throw new Error(result.error.message);
              }

              const photos = result.data || [];
              
              // Get premium status
              const premiumResp = await fetch('/api/premium?action=get-user-status&userId=' + userToken);
              const premiumData = await premiumResp.json();
              const isPremium = premiumData.isPremium || false;
              const limit = isPremium ? 3 : 1;
              const active = photos.filter(p => p.is_active).length;

              limitText.innerHTML = \`Активных: <strong>\${active}/\${limit}</strong>\`;

              if (photos.length === 0) {
                gallery.innerHTML = \`
                  <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 5rem; margin-bottom: 25px; opacity: 0.4;">📸</div>
                    <h3 style="color: #e0e0e0; margin: 0 0 15px 0; font-size: 1.4rem;">Нет фото</h3>
                    <p style="color: #888; margin: 0; line-height: 1.6;">Нажмите кнопку "Добавить фото" выше,<br>чтобы загрузить фото для своих объявлений</p>
                  </div>
                \`;
                return;
              }

              // Render photos grid
              let html = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">';
              
              photos.forEach(photo => {
                const isActive = photo.is_active;
                const borderColor = isActive ? '#00d9ff' : '#ff3b30';
                const opacity = isActive ? '1' : '0.6';

                html += \`
                  <div style="border-radius: 12px; overflow: hidden; background: rgba(26, 26, 46, 0.8); border: 2px solid \${borderColor}; opacity: \${opacity};">
                    <div onclick="window.open('\${photo.photo_url}', '_blank')" style="width: 100%; height: 160px; background-image: url('\${photo.photo_url}'); background-size: cover; background-position: center; cursor: pointer; position: relative;">
                      \${!isActive ? '<div style="position: absolute; top: 5px; right: 5px; background: rgba(255, 59, 48, 0.95); color: white; padding: 4px 10px; font-size: 0.7rem; border-radius: 6px; font-weight: 600;">❌ Отключено</div>' : ''}
                    </div>
                    <div style="padding: 12px;">
                      <div style="color: #888; margin-bottom: 10px; font-size: 0.75rem;">Позиция: <strong style="color: #00d9ff;">\${photo.position}</strong></div>
                      \${photo.caption ? \`<div style="color: #e0e0e0; margin-bottom: 12px; font-size: 0.85rem; line-height: 1.4;">\${photo.caption}</div>\` : ''}
                      <div style="display: flex; gap: 8px; flex-direction: column;">
                        <button onclick="editCaption(\${photo.id}, '\${(photo.caption || '').replace(/'/g, "\\\\'")}'); event.stopPropagation();" style="width: 100%; padding: 10px; background: rgba(131, 56, 236, 0.2); border: 1px solid rgba(131, 56, 236, 0.6); color: #8338ec; border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">✏️ Изменить подпись</button>
                        <button onclick="toggleActive(\${photo.id}, \${!isActive}); event.stopPropagation();" style="width: 100%; padding: 10px; background: rgba(0, 217, 255, 0.2); border: 1px solid rgba(0, 217, 255, 0.6); color: #00d9ff; border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">
                          \${isActive ? '🚫 Скрыть фото' : '👁️ Показать фото'}
                        </button>
                        <button onclick="deletePhoto(\${photo.id}); event.stopPropagation();" style="width: 100%; padding: 10px; background: rgba(255, 59, 48, 0.2); border: 1px solid rgba(255, 59, 48, 0.6); color: #ff3b30; border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">🗑️ Удалить</button>
                      </div>
                    </div>
                  </div>
                \`;
              });

              html += '</div>';
              gallery.innerHTML = html;

            } catch (error) {
              console.error('Error loading photos:', error);
              gallery.innerHTML = \`
                <div style="text-align: center; padding: 60px 20px; color: #ff3b30;">
                  <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
                  <p style="margin-bottom: 20px;">\${error.message}</p>
                  <button onclick="loadPhotos()" style="padding: 12px 24px; background: rgba(131, 56, 236, 0.3); border: 1px solid #8338ec; color: #8338ec; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">🔄 Повторить</button>
                </div>
              \`;
            }
          }

          // Add photo
          document.getElementById('addPhotoBtn').addEventListener('click', async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              try {
                const gallery = document.getElementById('photosGallery');
                gallery.innerHTML = '<p style="text-align: center; color: #888; padding: 60px;">📤 Загрузка фото...</p>';

                // Upload to Telegram
                const formData = new FormData();
                formData.append('photo', file);
                formData.append('userToken', userToken);

                const uploadResp = await fetch('/api/upload-photo', {
                  method: 'POST',
                  body: formData
                });

                const uploadResult = await uploadResp.json();
                if (uploadResult.error) throw new Error(uploadResult.error);

                // Save to database
                const saveResp = await fetch('/api/user-photos', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userToken: userToken,
                    fileId: uploadResult.file_id,
                    photoUrl: uploadResult.url
                  })
                });

                const saveResult = await saveResp.json();
                if (saveResult.error) throw new Error(saveResult.error.message);

                await loadPhotos();

                if (saveResult.overLimit) {
                  alert('⚠️ Достигнут лимит фото. Лишние фото деактивированы.');
                }
              } catch (error) {
                alert('❌ Ошибка: ' + error.message);
                await loadPhotos();
              }
            };

            input.click();
          });

          // Edit caption
          async function editCaption(photoId, oldCaption) {
            const newCaption = prompt('Введите подпись к фото:', oldCaption || '');
            if (newCaption === null) return;

            try {
              const resp = await fetch('/api/user-photos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userToken: userToken,
                  updates: [{ id: photoId, caption: newCaption || null }]
                })
              });

              const result = await resp.json();
              if (result.error) throw new Error(result.error.message);

              await loadPhotos();
            } catch (error) {
              alert('❌ Ошибка: ' + error.message);
            }
          }

          // Toggle active state
          async function toggleActive(photoId, newState) {
            try {
              const resp = await fetch('/api/user-photos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userToken: userToken,
                  updates: [{ id: photoId, is_active: newState }]
                })
              });

              const result = await resp.json();
              if (result.error) throw new Error(result.error.message);

              await loadPhotos();
            } catch (error) {
              alert('❌ Ошибка: ' + error.message);
            }
          }

          // Delete photo
          async function deletePhoto(photoId) {
            if (!confirm('Удалить это фото?')) return;

            try {
              const resp = await fetch('/api/user-photos?userToken=' + userToken + '&photoId=' + photoId, {
                method: 'DELETE'
              });

              const result = await resp.json();
              if (result.error) throw new Error(result.error.message);

              await loadPhotos();
            } catch (error) {
              alert('❌ Ошибка: ' + error.message);
            }
          }
        `}} />
      </body>
    </html>
  );
}
