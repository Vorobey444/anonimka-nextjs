/**
 * Модуль работы с фото (photos.js)
 * 
 * Функции:
 * - Управление галереей "Мои фото"
 * - Добавление фото к анкете
 * - Редактирование, удаление, изменение порядка фото
 */

console.log('📸 [PHOTOS] Инициализация модуля фото');

/**
 * Получить URL фото (защищённый или обычный)
 */
function getPhotoUrl(photoUrlOrFileId, size = null) {
    // Если уже защищённый URL - возвращаем как есть
    if (photoUrlOrFileId && photoUrlOrFileId.includes('/api/secure-photo')) {
        return photoUrlOrFileId;
    }
    
    // Если это file_id от Telegram - преобразуем в защищённый URL
    if (photoUrlOrFileId && photoUrlOrFileId.startsWith('Ag')) {
        const secureUrl = `/api/secure-photo?fileId=${encodeURIComponent(photoUrlOrFileId)}`;
        return secureUrl;
    }
    
    // Иначе возвращаем как есть (может быть уже готовый URL)
    return photoUrlOrFileId;
}

/**
 * Сжатие изображения
 */
async function compressImage(file, maxSizeMB = 4) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Ограничиваем размер до 1280px по большей стороне
                const maxDimension = 1280;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Конвертируем в JPEG с качеством 0.85
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    
                    if (!blob) {
                        reject(new Error('Не удалось сжать изображение'));
                        return;
                    }
                    
                    const newFile = new File([blob], file.name.replace(/\.(heic|heif|png|webp)$/i, '.jpg'), {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    console.log(`✅ Изображение сжато: ${file.size} → ${blob.size} bytes`);
                    resolve(newFile);
                }, 'image/jpeg', 0.85);
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Не удалось загрузить изображение для сжатия'));
        };
        
        img.src = url;
    });
}

/**
 * Показать страницу "Мои фото"
 */
function showMyPhotos() {
    const userToken = localStorage.getItem('user_token');
    const savedUser = localStorage.getItem('telegram_user');
    const tgId = savedUser ? JSON.parse(savedUser)?.id : null;
    
    if (!userToken && !tgId) {
        tg.showAlert('❌ Требуется авторизация');
        return;
    }
    
    const userId = userToken || String(tgId);
    const url = window.location.origin + '/my-photo?userToken=' + userId;
    window.location.href = url;
    
    if (typeof closeHamburgerMenu === 'function') {
        closeHamburgerMenu();
    } else if (typeof closeBurgerMenu === 'function') {
        closeBurgerMenu();
    }
}

/**
 * Загрузить фото пользователя
 */
async function loadMyPhotos() {
    console.log('📸 loadMyPhotos() начало работы');
    const gallery = document.getElementById('photosGallery');
    const limitText = document.getElementById('photosLimitText');
    
    const userToken = localStorage.getItem('user_token');
    const savedUser = localStorage.getItem('telegram_user');
    const tgId = savedUser ? JSON.parse(savedUser)?.id : null;
    const userId = userToken || (tgId ? String(tgId) : null);
    
    if (!userId) {
        if (gallery) {
            gallery.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #888;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔐</div>
                    <p>Требуется авторизация</p>
                </div>`;
        }
        return;
    }
    
    try {
        if (gallery) {
            gallery.innerHTML = `<p style="color: #888; text-align: center; padding: 20px;">⏳ Загрузка...</p>`;
        }
        
        const resp = await fetch(`/api/user-photos?userToken=${userId}`);
        
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        const result = await resp.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        const photos = result.data || [];
        const isPremium = typeof userPremiumStatus !== 'undefined' ? userPremiumStatus.isPremium : false;
        const limit = isPremium ? 3 : 1;
        const active = photos.filter((p) => p.is_active).length;
        
        if (limitText) {
            limitText.innerHTML = `Активных: <strong>${active}/${limit}</strong>`;
        }
        
        if (!gallery) return;
        
        if (photos.length === 0) {
            gallery.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 5rem; margin-bottom: 20px; opacity: 0.5;">📸</div>
                    <h3 style="color: #e0e0e0; margin: 0 0 15px 0;">Нет фото</h3>
                    <p style="color: #888; margin: 0;">Нажмите "Добавить фото"</p>
                </div>
            `;
            return;
        }
        
        let gridHTML = `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">`;
        
        photos.forEach((photo, idx) => {
            const isActive = photo.is_active;
            const opacity = isActive ? '1' : '0.5';
            const isFirst = idx === 0;
            const isLast = idx === photos.length - 1;
            
            gridHTML += `
                <div style="border-radius: 12px; overflow: hidden; background: rgba(26, 26, 46, 0.6); border: 2px solid ${isActive ? 'rgba(0, 217, 255, 0.3)' : 'rgba(255, 59, 48, 0.3)'}; opacity: ${opacity};">
                    <div onclick="window.open('${photo.photo_url}', '_blank')" style="width: 100%; height: 150px; background-image: url('${photo.photo_url}'); background-size: cover; background-position: center; cursor: pointer; position: relative;">
                        ${!isActive ? '<div style="position: absolute; top: 0; right: 0; background: rgba(255, 59, 48, 0.9); color: white; padding: 4px 8px; font-size: 0.7rem; border-radius: 0 0 0 8px;">❌ Отключено</div>' : ''}
                    </div>
                    <div style="padding: 10px; font-size: 0.85rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <div style="color: #888; font-size: 0.75rem;">Позиция: <strong>${photo.position}</strong></div>
                            <div style="display: flex; gap: 4px;">
                                ${!isFirst ? `<button onclick="movePhotoUp(${photo.id}); event.stopPropagation();" style="padding: 4px 8px; background: rgba(0, 217, 255, 0.2); border: 1px solid rgba(0, 217, 255, 0.5); color: #00d9ff; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">↑</button>` : ''}
                                ${!isLast ? `<button onclick="movePhotoDown(${photo.id}); event.stopPropagation();" style="padding: 4px 8px; background: rgba(0, 217, 255, 0.2); border: 1px solid rgba(0, 217, 255, 0.5); color: #00d9ff; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">↓</button>` : ''}
                            </div>
                        </div>
                        ${photo.caption ? `<div style="color: #e0e0e0; margin-bottom: 10px; font-size: 0.8rem; max-height: 30px; overflow: hidden;">${photo.caption}</div>` : ''}
                        <div style="display: flex; gap: 4px; margin-top: 6px;">
                            <button onclick="editPhotoCaption(${photo.id}, '${(photo.caption || '').replace(/'/g, "\\'")}'); event.stopPropagation();" style="flex: 1; padding: 5px 2px; background: rgba(131, 56, 236, 0.2); border: 1px solid rgba(131, 56, 236, 0.5); color: #8338ec; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">✏️</button>
                            <button onclick="togglePhotoActive(${photo.id}, ${!isActive}); event.stopPropagation();" style="flex: 1; padding: 5px 2px; background: ${isActive ? 'rgba(0, 217, 255, 0.2)' : 'rgba(255, 59, 48, 0.2)'}; border: 1px solid ${isActive ? 'rgba(0, 217, 255, 0.5)' : 'rgba(255, 59, 48, 0.5)'}; color: ${isActive ? '#00d9ff' : '#ff3b30'}; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">${isActive ? '👁️' : '🚫'}</button>
                            <button onclick="deletePhoto(${photo.id}); event.stopPropagation();" style="flex: 1; padding: 5px 2px; background: rgba(255, 59, 48, 0.2); border: 1px solid rgba(255, 59, 48, 0.5); color: #ff3b30; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        gridHTML += `</div>`;
        gallery.innerHTML = gridHTML;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки фото:', error);
        if (gallery) {
            gallery.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #ff3b30;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                    <p style="margin-bottom: 15px;">${error.message}</p>
                    <button onclick="loadMyPhotos()" class="neon-button">🔄 Повторить</button>
                </div>
            `;
        }
    }
}

/**
 * Редактировать подпись к фото
 */
async function editPhotoCaption(photoId, oldCaption) {
    const userToken = localStorage.getItem('user_token');
    const newCaption = prompt('Введите подпись к фото:', oldCaption || '');
    
    if (newCaption === null) return;
    
    try {
        const resp = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userToken,
                updates: [{ id: photoId, caption: newCaption || null }]
            })
        });
        
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Переключить видимость фото
 */
async function togglePhotoActive(photoId, newState) {
    const userToken = localStorage.getItem('user_token');
    
    try {
        const resp = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userToken,
                updates: [{ id: photoId, is_active: newState }]
            })
        });
        
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Удалить фото
 */
async function deletePhoto(photoId) {
    if (!confirm('Удалить фото?')) return;
    
    const userToken = localStorage.getItem('user_token');
    
    try {
        const resp = await fetch(`/api/user-photos?id=${photoId}&userToken=${userToken}`, {
            method: 'DELETE'
        });
        
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Переместить фото вверх
 */
async function movePhotoUp(photoId) {
    const userToken = localStorage.getItem('user_token');
    try {
        const resp = await fetch(`/api/user-photos?userToken=${userToken}`);
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        
        const photos = result.data || [];
        const idx = photos.findIndex(p => p.id === photoId);
        if (idx <= 0) return;
        
        const newOrder = photos.map(p => p.id);
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        
        const patchResp = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken, order: newOrder })
        });
        
        const patchResult = await patchResp.json();
        if (patchResult.error) throw new Error(patchResult.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Переместить фото вниз
 */
async function movePhotoDown(photoId) {
    const userToken = localStorage.getItem('user_token');
    try {
        const resp = await fetch(`/api/user-photos?userToken=${userToken}`);
        const result = await resp.json();
        if (result.error) throw new Error(result.error.message);
        
        const photos = result.data || [];
        const idx = photos.findIndex(p => p.id === photoId);
        if (idx < 0 || idx >= photos.length - 1) return;
        
        const newOrder = photos.map(p => p.id);
        [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
        
        const patchResp = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken, order: newOrder })
        });
        
        const patchResult = await patchResp.json();
        if (patchResult.error) throw new Error(patchResult.error.message);
        await loadMyPhotos();
    } catch (error) {
        tg.showAlert('❌ Ошибка: ' + error.message);
    }
}

/**
 * Поменять местами позиции двух фото (drag & drop)
 */
async function swapPhotoPositions(photoId1, photoId2) {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) return;
        
        console.log(`🔄 Меняем местами фото ${photoId1} и ${photoId2}`);
        
        const response = await fetch('/api/user-photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userToken, 
                photoId1: parseInt(photoId1),
                photoId2: parseInt(photoId2),
                action: 'swap'
            })
        });
        
        if (response.ok) {
            console.log('✅ Позиции фото обменены');
            // Обновляем галерею через небольшую задержку
            setTimeout(() => {
                loadMyPhotos();
            }, 500);
        } else {
            throw new Error('Ошибка обмена позиций');
        }
    } catch (error) {
        console.error('❌ Ошибка обмена позиций:', error);
        tg.showAlert('Ошибка при изменении порядка');
    }
}

/**
 * Добавить фото при создании анкеты (шаг 9)
 */
async function addAdPhoto() {
    console.log('📸 [addAdPhoto] Начало загрузки фото для анкеты');
    
    // Проверяем количество уже загруженных фото
    const currentPhotos = document.querySelectorAll('#step9PhotoGrid .step9-photo-item');
    if (currentPhotos.length >= 3) {
        tg.showAlert('❌ Максимум 3 фото. Удалите одно фото, чтобы загрузить новое.');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('📸 [addAdPhoto] Выбран файл:', file.name);
        
        try {
            const addBtn = document.getElementById('addAdPhotoBtn');
            if (addBtn) {
                addBtn.disabled = true;
                addBtn.innerHTML = '<span>⏳ Загрузка...</span>';
            }
            
            let fileToUpload = file;
            
            // Сжимаем если больше 4MB
            if (file.size > 4 * 1024 * 1024 && typeof compressImage === 'function') {
                console.log('🗜️ Сжимаем файл...');
                fileToUpload = await compressImage(file, 4);
            }
            
            const userToken = localStorage.getItem('user_token');
            const savedUser = localStorage.getItem('telegram_user');
            const tgId = savedUser ? JSON.parse(savedUser)?.id : null;
            const userId = userToken || (tgId ? String(tgId) : null);
            
            if (!userId) {
                throw new Error('Требуется авторизация');
            }
            
            const photoData = await uploadPhotoToTelegram(fileToUpload, userId);
            
            console.log('📸 [addAdPhoto] photoData received:', photoData);
            
            // Сохраняем в formData
            if (typeof formData !== 'undefined') {
                formData.adPhotoFileId = photoData.file_id;
                formData.adPhotoUrl = photoData.photo_url;
            }
            
            // Показываем превью
            const preview = document.getElementById('adPhotoPreview');
            const img = document.getElementById('adPhotoImage');
            const btn = document.getElementById('addAdPhotoBtn');
            
            console.log('📸 [addAdPhoto] photoData:', photoData);
            
            // Сохраняем фото в БД user_photos
            await fetch('/api/user-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userToken: userId,
                    fileId: photoData.file_id,
                    photoUrl: photoData.photo_url
                })
            });
            
            // Перезагружаем галерею
            loadMyPhotosForStep9();
            
            tg.showAlert('✅ Фото добавлено!');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки фото:', error);
            tg.showAlert('❌ ' + (error.message || 'Ошибка загрузки'));
        } finally {
            const addBtn = document.getElementById('addAdPhotoBtn');
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.innerHTML = '<span>📷 Выбрать фото</span>';
            }
        }
    };
    
    input.click();
}

/**
 * Удалить фото из анкеты
 */
function removeAdPhoto() {
    if (typeof formData !== 'undefined') {
        delete formData.adPhotoFileId;
        delete formData.adPhotoUrl;
    }
    
    const preview = document.getElementById('adPhotoPreview');
    const btn = document.getElementById('addAdPhotoBtn');
    
    if (preview) preview.style.display = 'none';
    if (btn) btn.style.display = 'block';
    
    console.log('🗑️ Фото удалено из анкеты');
}

/**
 * Загрузить существующие фото на шаге 9
 */
async function loadMyPhotosForStep9() {
    try {
        console.log('📸 [loadMyPhotosForStep9] Загрузка фото...');
        const userToken = localStorage.getItem('user_token');
        const savedUser = localStorage.getItem('telegram_user');
        const tgId = savedUser ? JSON.parse(savedUser)?.id : null;
        const userId = userToken || (tgId ? String(tgId) : null);
        
        if (!userId) return;
        
        const resp = await fetch(`/api/user-photos?userToken=${userId}`);
        const result = await resp.json();
        
        const container = document.getElementById('step9PhotoGallery');
        if (!container) {
            console.error('❌ step9PhotoGallery контейнер не найден');
            return;
        }
        
        if (result.error || !result.data || result.data.length === 0) {
            console.log('ℹ️ Нет фото в галерее');
            container.innerHTML = `
                <div style="text-align: center; padding: 15px; color: var(--text-gray);">
                    <p style="margin: 0;">📷 У вас пока нет фото</p>
                    <p style="margin: 8px 0 0 0; font-size: 13px;">Загрузите фото ниже</p>
                </div>
            `;
            container.style.display = 'block';
            return;
        }
        
        const photos = result.data;
        console.log(`✅ Загружено ${photos.length} фото`);
        
        // Сохраняем порядок фото глобально
        window.step9PhotoOrder = photos.map(p => p.id);
        
        container.innerHTML = '';
        container.style.display = 'block';
        
        // Проверяем Premium статус (с учётом даты истечения)
        let isPremium = false;
        if (typeof userPremiumStatus !== 'undefined' && userPremiumStatus?.isPremium) {
            // Проверяем, не истёк ли премиум
            if (userPremiumStatus.premiumUntil) {
                isPremium = new Date(userPremiumStatus.premiumUntil) > new Date();
            } else {
                // Если premiumUntil не задан - считаем бессрочным
                isPremium = true;
            }
        }
        console.log('📸 [loadMyPhotosForStep9] isPremium:', isPremium);
        
        // Инфо блок с лимитами
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 8px;
            padding: 10px 12px;
            margin-bottom: 12px;
            font-size: 11px;
            text-align: center;
        `;
        infoDiv.innerHTML = `
            <div style="color: var(--neon-cyan); margin-bottom: 6px;">📷 Можно загрузить до 3 фото</div>
            <div style="color: ${isPremium ? 'var(--neon-green)' : 'var(--text-gray)'}; font-size: 10px;">
                ${isPremium 
                    ? '✨ PRO: все 3 фото будут видны в анкете' 
                    : '🔒 FREE: только 1 фото будет активно. Получите PRO для всех 3!'
                }
            </div>
        `;
        container.appendChild(infoDiv);
        
        // Горизонтальная сетка фото (3 в ряд)
        const gridDiv = document.createElement('div');
        gridDiv.id = 'step9PhotoGrid';
        gridDiv.style.cssText = `
            display: flex !important;
            flex-direction: row !important;
            gap: 8px;
            justify-content: center;
            flex-wrap: nowrap !important;
            overflow-x: auto;
            padding: 4px 0;
            align-items: flex-start;
        `;
        
        photos.slice(0, 3).forEach((photo, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'step9-photo-item';
            photoDiv.dataset.photoId = photo.id;
            photoDiv.draggable = true;
            const isSelected = typeof formData !== 'undefined' && formData?.selectedPhotoId === photo.id;
            photoDiv.style.cssText = `
                position: relative;
                border: 2px solid ${isSelected ? 'var(--neon-pink)' : 'rgba(0, 255, 255, 0.5)'};
                border-radius: 8px;
                overflow: hidden;
                width: 90px !important;
                height: 90px !important;
                min-width: 90px !important;
                max-width: 90px !important;
                flex-shrink: 0;
                cursor: grab;
                transition: transform 0.2s, border-color 0.2s;
                background: #1a1a2e;
                display: inline-block !important;
            `;
            
            // Drag events
            photoDiv.addEventListener('dragstart', handlePhotoDragStart);
            photoDiv.addEventListener('dragend', handlePhotoDragEnd);
            photoDiv.addEventListener('dragover', handlePhotoDragOver);
            photoDiv.addEventListener('drop', handlePhotoDrop);
            photoDiv.addEventListener('dragenter', handlePhotoDragEnter);
            photoDiv.addEventListener('dragleave', handlePhotoDragLeave);
            
            // Touch events для мобильных
            photoDiv.addEventListener('touchstart', handlePhotoTouchStart, { passive: false });
            photoDiv.addEventListener('touchmove', handlePhotoTouchMove, { passive: false });
            photoDiv.addEventListener('touchend', handlePhotoTouchEnd);
            
            // Клик для выбора
            photoDiv.onclick = (e) => {
                if (!window.isDragging) {
                    selectStep9Photo(photo.id, photo.photo_url, photo.file_id);
                }
            };
            
            const img = document.createElement('img');
            img.src = photo.photo_url;
            img.alt = `Фото ${index + 1}`;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; pointer-events: none;';
            img.draggable = false;
            photoDiv.appendChild(img);
            
            // Для FREE аккаунтов затемняем 2-3 фото
            if (!isPremium && index > 0) {
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                `;
                overlay.innerHTML = `
                    <div style="color: #888; font-size: 10px; text-align: center;">
                        <div style="font-size: 16px;">🔒</div>
                        <div>Скрыто</div>
                    </div>
                `;
                photoDiv.appendChild(overlay);
            }
            
            // Номер фото
            const numBadge = document.createElement('div');
            numBadge.style.cssText = `
                position: absolute;
                top: 4px;
                left: 4px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            numBadge.textContent = index + 1;
            photoDiv.appendChild(numBadge);
            
            // Кнопка удаления
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '✕';
            delBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: rgba(255, 50, 50, 0.9);
                color: white;
                border: none;
                cursor: pointer;
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                line-height: 1;
            `;
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                e.preventDefault();
                tg.showConfirm('Удалить это фото?', async (confirmed) => {
                    if (confirmed) {
                        await deleteStep9Photo(photo.id);
                    }
                });
            };
            photoDiv.appendChild(delBtn);
            
            gridDiv.appendChild(photoDiv);
        });
        
        container.appendChild(gridDiv);
        
    } catch (error) {
        console.error('Ошибка загрузки фото для шага 9:', error);
    }
}

// ===== DRAG AND DROP HANDLERS =====
let draggedElement = null;
let draggedPhotoId = null;

function handlePhotoDragStart(e) {
    window.isDragging = true;
    draggedElement = this;
    draggedPhotoId = this.dataset.photoId;
    this.style.opacity = '0.5';
    this.style.cursor = 'grabbing';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedPhotoId);
}

function handlePhotoDragEnd(e) {
    window.isDragging = false;
    this.style.opacity = '1';
    this.style.cursor = 'grab';
    document.querySelectorAll('.step9-photo-item').forEach(item => {
        item.style.transform = '';
        item.classList.remove('drag-over');
    });
    draggedElement = null;
}

function handlePhotoDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handlePhotoDragEnter(e) {
    e.preventDefault();
    if (this !== draggedElement) {
        this.style.transform = 'scale(1.05)';
        this.classList.add('drag-over');
    }
}

function handlePhotoDragLeave(e) {
    this.style.transform = '';
    this.classList.remove('drag-over');
}

function handlePhotoDrop(e) {
    e.preventDefault();
    if (this !== draggedElement && draggedElement) {
        const grid = this.parentNode;
        const items = Array.from(grid.children);
        const fromIndex = items.indexOf(draggedElement);
        const toIndex = items.indexOf(this);
        
        if (fromIndex < toIndex) {
            grid.insertBefore(draggedElement, this.nextSibling);
        } else {
            grid.insertBefore(draggedElement, this);
        }
        
        // Обновляем номера
        updatePhotoNumbers();
        // Сохраняем новый порядок
        savePhotoOrder();
    }
    this.style.transform = '';
    this.classList.remove('drag-over');
}

// ===== TOUCH HANDLERS FOR MOBILE =====
let touchStartY = 0;
let touchStartX = 0;
let touchElement = null;
let touchTimeout = null;

function handlePhotoTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchElement = this;
    
    // Долгое нажатие для начала перетаскивания
    touchTimeout = setTimeout(() => {
        window.isDragging = true;
        this.style.opacity = '0.7';
        this.style.transform = 'scale(1.1)';
        this.style.zIndex = '100';
        navigator.vibrate && navigator.vibrate(50);
    }, 300);
}

function handlePhotoTouchMove(e) {
    if (!window.isDragging) {
        clearTimeout(touchTimeout);
        return;
    }
    e.preventDefault();
    
    const touch = e.touches[0];
    const grid = document.getElementById('step9PhotoGrid');
    if (!grid) return;
    
    const items = Array.from(grid.querySelectorAll('.step9-photo-item'));
    
    // Находим элемент под пальцем
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    const photoUnder = elementUnder?.closest('.step9-photo-item');
    
    items.forEach(item => {
        if (item === photoUnder && item !== touchElement) {
            item.style.transform = 'scale(0.95)';
        } else if (item !== touchElement) {
            item.style.transform = '';
        }
    });
}

function handlePhotoTouchEnd(e) {
    clearTimeout(touchTimeout);
    
    if (window.isDragging && touchElement) {
        const touch = e.changedTouches[0];
        const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        const photoUnder = elementUnder?.closest('.step9-photo-item');
        
        if (photoUnder && photoUnder !== touchElement) {
            const grid = photoUnder.parentNode;
            const items = Array.from(grid.children);
            const fromIndex = items.indexOf(touchElement);
            const toIndex = items.indexOf(photoUnder);
            
            if (fromIndex < toIndex) {
                grid.insertBefore(touchElement, photoUnder.nextSibling);
            } else {
                grid.insertBefore(touchElement, photoUnder);
            }
            
            updatePhotoNumbers();
            savePhotoOrder();
        }
        
        touchElement.style.opacity = '1';
        touchElement.style.transform = '';
        touchElement.style.zIndex = '';
    }
    
    window.isDragging = false;
    touchElement = null;
    
    document.querySelectorAll('.step9-photo-item').forEach(item => {
        item.style.transform = '';
    });
}

function updatePhotoNumbers() {
    const grid = document.getElementById('step9PhotoGrid');
    if (!grid) return;
    
    const isPremium = typeof userPremiumStatus !== 'undefined' && userPremiumStatus?.isPremium;
    const items = grid.querySelectorAll('.step9-photo-item');
    
    items.forEach((item, index) => {
        // Обновляем номер
        const numBadge = item.querySelector('div[style*="border-radius: 50%"]:not(button)');
        if (numBadge && numBadge.style.background.includes('rgba(0, 0, 0')) {
            numBadge.textContent = index + 1;
        }
        
        // Обновляем оверлей "Скрыто" - удаляем старый и добавляем новый если нужно
        const existingOverlay = item.querySelector('div[style*="background: rgba(0, 0, 0, 0.7)"]');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Для FREE аккаунтов затемняем 2-3 фото (index > 0)
        if (!isPremium && index > 0) {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                pointer-events: none;
            `;
            overlay.innerHTML = `
                <div style="color: #888; font-size: 10px; text-align: center;">
                    <div style="font-size: 16px;">🔒</div>
                    <div>Скрыто</div>
                </div>
            `;
            item.appendChild(overlay);
        }
    });
}

function savePhotoOrder() {
    const grid = document.getElementById('step9PhotoGrid');
    if (!grid) return;
    
    const items = grid.querySelectorAll('.step9-photo-item');
    const newOrder = Array.from(items).map(item => item.dataset.photoId);
    window.step9PhotoOrder = newOrder;
    
    console.log('📸 Новый порядок фото:', newOrder);
    // TODO: Сохранить порядок на сервере если нужно
}

/**
 * Выбрать фото на шаге 9
 */
function selectStep9Photo(photoId, photoUrl, fileId) {
    if (typeof formData !== 'undefined') {
        formData.selectedPhotoId = photoId;
        formData.adPhotoUrl = photoUrl;
        formData.adPhotoFileId = fileId;
    }
    
    // Обновляем UI - отмечаем выбранное фото
    document.querySelectorAll('.step9-photo-item').forEach(item => {
        item.style.borderColor = 'var(--neon-cyan)';
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.style.borderColor = 'var(--neon-pink)';
    }
    
    console.log('📸 Выбрано фото:', photoId);
    tg.showAlert('✅ Фото выбрано для анкеты!');
}

/**
 * Удалить фото на шаге 9 (удаляет из галереи и всех анкет)
 */
async function deleteStep9Photo(photoId) {
    let errorMessage = '';
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            errorMessage = 'User token not found';
            throw new Error(errorMessage);
        }
        
        console.log('🗑️ Удаляем фото ID:', photoId);
        
        const response = await fetch('/api/user-photos', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken, photoId })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            errorMessage = `HTTP ${response.status}: ${errorData.error || response.statusText}`;
            throw new Error(errorMessage);
        }
        
        console.log('✅ Фото удалено');
        
        // Удаляем элемент фото из DOM
        const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
        if (photoElement) {
            photoElement.remove();
        }
        
        // Обновляем номера и оверлеи
        updatePhotoNumbers();
        
        // Проверяем, остались ли фото
        const gridDiv = document.getElementById('step9PhotoGrid');
        if (gridDiv && gridDiv.children.length === 0) {
            const galleryContainer = document.getElementById('step9PhotoGallery');
            if (galleryContainer) {
                galleryContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <p style="margin: 0;">📷 У вас пока нет фото в галерее</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px;">Добавьте фото ниже</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        const errorDetails = {
            photoId,
            message: error.message || String(error),
            stack: error.stack || '',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        console.error('❌ Photo deletion error:', errorDetails);
        
        // Отправляем ошибку на сервер для логирования
        try {
            await fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_PHOTO_STEP9',
                    error: errorDetails.message,
                    stack: errorDetails.stack,
                    photoId: photoId,
                    userAgent: errorDetails.userAgent,
                    timestamp: errorDetails.timestamp
                })
            }).catch(err => console.log('⚠️ Could not send error to server:', err.message));
        } catch (logErr) {
            console.log('⚠️ Error logging failed:', logErr);
        }
        
        // Показываем alert с информацией об ошибке
        const fullError = `❌ Ошибка удаления фото:\n\nID: ${photoId}\n${errorDetails.message}`;
        if (typeof tg !== 'undefined' && tg.showAlert) {
            tg.showAlert(fullError);
        } else {
            alert(fullError);
        }
    }
}

/**
 * ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ =====
 */

/**
 * Показать меню выбора источника фото
 */
function showPhotoSourceMenu() {
    if (!window.Telegram || !window.Telegram.WebApp) {
        document.getElementById('photoInput').click();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'photo-source-menu';
    menu.innerHTML = `
        <div class="photo-source-overlay" onclick="closePhotoSourceMenu()"></div>
        <div class="photo-source-content">
            <h3 style="margin-top: 0; color: var(--neon-cyan);">📷 Выберите источник</h3>
            <button class="source-btn" onclick="openCamera()">
                <span style="font-size: 24px;">📸</span>
                <span>Сделать фото</span>
            </button>
            <button class="source-btn" onclick="openGallery()">
                <span style="font-size: 24px;">🖼️</span>
                <span>Выбрать из галереи</span>
            </button>
            <button class="source-btn cancel" onclick="closePhotoSourceMenu()">
                <span>❌</span>
                <span>Отмена</span>
            </button>
        </div>
    `;
    document.body.appendChild(menu);
}

/**
 * Закрыть меню выбора источника фото
 */
function closePhotoSourceMenu() {
    const menu = document.querySelector('.photo-source-menu');
    if (menu) menu.remove();
}

/**
 * Открыть галерею для выбора фото
 */
function openGallery() {
    closePhotoSourceMenu();
    const galleryInput = document.getElementById('photoInput');
    if (galleryInput) {
        galleryInput.value = '';
        galleryInput.click();
    }
}

/**
 * Обработчик выбора фото из галереи
 */
function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📷 Выбран файл:', {
        name: file.name,
        type: file.type,
        size: file.size
    });
    
    // Проверка размера (макс 20 МБ)
    if (file.size > 20 * 1024 * 1024) {
        tg.showAlert('Файл слишком большой! Максимум 20 МБ');
        event.target.value = '';
        return;
    }
    
    // Проверка что файл не пустой (Stories имеют size = 0)
    if (file.size === 0) {
        tg.showAlert('❌ Stories и временные файлы не поддерживаются!\n\nСохраните фото в галерею и выберите его оттуда.');
        event.target.value = '';
        return;
    }
    
    // Принимаем изображения, видео и HEIC (Live Photos, анимации)
    const isMedia = file.type.startsWith('image/') || 
                    file.type.startsWith('video/') ||
                    file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif');
    
    if (!isMedia) {
        tg.showAlert('Можно прикрепить только фото или видео!');
        event.target.value = '';
        return;
    }
    
    selectedPhoto = file;
    
    // Показываем превью
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('photoPreview');
        const img = document.getElementById('photoPreviewImage');
        
        if (!preview || !img) return;
        
        // Для видео показываем иконку, для фото - превью
        if (file.type.startsWith('video/')) {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="50">🎥</text></svg>';
        } else {
            img.src = e.target.result;
        }
        
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

/**
 * Удалить выбранное фото
 */
function removePhoto() {
    selectedPhoto = null;
    const input = document.getElementById('photoInput');
    const preview = document.getElementById('photoPreview');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
}

/**
 * Показать модальное окно с фото
 */
function showPhotoModal(photoUrl) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    
    if (!modal || !modalImage) return;
    
    modalImage.style.backgroundImage = `url('${photoUrl}')`;
    modalImage.oncontextmenu = () => false;
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.oncontextmenu = () => false;
}

/**
 * Закрыть модальное окно с фото
 */
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    
    if (!modal) return;
    
    modal.classList.remove('active');
    modal.style.display = 'none';
    if (modalImage) modalImage.style.backgroundImage = '';
    modal.oncontextmenu = null;
}

/**
 * Добавить фото из галереи устройства
 */
async function addPhotoFromGallery() {
    const userToken = localStorage.getItem('user_token');
    const savedUser = localStorage.getItem('telegram_user');
    const tgId = savedUser ? JSON.parse(savedUser)?.id : null;
    const userId = userToken || (tgId ? String(tgId) : getCurrentUserId());
    
    if (!userToken && !tgId) {
        tg.showAlert('Требуется авторизация');
        return;
    }
    
    // Проверяем количество уже загруженных фото
    const currentPhotos = document.querySelectorAll('#photosGallery .photo-item');
    if (currentPhotos.length >= 3) {
        tg.showAlert('❌ Максимум 3 фото. Удалите одно фото, чтобы загрузить новое.');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            const gallery = document.getElementById('photosGallery');
            if (gallery) gallery.innerHTML = '<div class="loading-spinner"></div><p>Загрузка фото...</p>';
            
            const photoData = await uploadPhotoToTelegram(file, userId);
            
            const resp = await fetch('/api/user-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userToken: userId,
                    tgId: tgId,
                    fileId: photoData.file_id,
                    photoUrl: photoData.photo_url,
                    caption: null
                })
            });
            
            const result = await resp.json();
            if (result.error) throw new Error(result.error.message);
            
            await loadMyPhotos();
            
            if (result.overLimit) {
                tg.showAlert(`⚠️ Достигнут лимит: ${result.limit} фото.

Лишние фото деактивированы.`);
            }
        } catch (error) {
            console.error('❌ Error adding photo:', error);
            tg.showAlert('❌ Ошибка: ' + error.message);
            await loadMyPhotos();
        }
    };
    
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 1000);
}

/**
 * Сделать снимок с камеры
 */
function capturePhoto() {
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('cameraCanvas');
    
    if (!video || !canvas) {
        console.error('❌ [PHOTOS] Элементы камеры не найдены');
        return;
    }
    
    // Устанавливаем размер canvas равный видео
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Рисуем кадр с видео на canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Конвертируем canvas в blob
    canvas.toBlob((blob) => {
        // Создаем File из blob
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        
        // Закрываем камеру
        closeCameraModal();
        
        // Обрабатываем как обычное фото
        window.selectedPhoto = file;
        
        // Показываем превью
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('photoPreview');
            const img = document.getElementById('photoPreviewImage');
            if (img) img.src = e.target.result;
            if (preview) preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        
    }, 'image/jpeg', 0.9);
}

/**
 * Закрыть модальное окно камеры
 */
function closeCameraModal() {
    // Останавливаем поток камеры
    if (window.currentCameraStream) {
        window.currentCameraStream.getTracks().forEach(track => track.stop());
        window.currentCameraStream = null;
    }
    
    // Удаляем модальное окно
    const modal = document.getElementById('cameraModal');
    if (modal) modal.remove();
}

/**
 * Переключить камеру (селфи/задняя)
 */
async function switchCamera() {
    try {
        // Останавливаем текущий поток
        if (window.currentCameraStream) {
            window.currentCameraStream.getTracks().forEach(track => track.stop());
        }
        
        // Переключаем режим
        window.currentFacingMode = window.currentFacingMode === 'user' ? 'environment' : 'user';
        
        // Запускаем камеру с новым режимом
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: window.currentFacingMode
            } 
        });
        
        const video = document.getElementById('cameraPreview');
        if (video) {
            video.srcObject = stream;
            window.currentCameraStream = stream;
        }
        
        console.log('📷 [PHOTOS] Камера переключена:', window.currentFacingMode === 'user' ? 'Селфи' : 'Задняя');
        
    } catch (error) {
        console.error('❌ [PHOTOS] Ошибка переключения камеры:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('Не удалось переключить камеру');
        }
    }
}

// Экспорт функций в глобальную область
window.showMyPhotos = showMyPhotos;
window.loadMyPhotos = loadMyPhotos;
window.addAdPhoto = addAdPhoto;
window.removeAdPhoto = removeAdPhoto;
window.deletePhoto = deletePhoto;
window.editPhotoCaption = editPhotoCaption;
window.togglePhotoActive = togglePhotoActive;
window.movePhotoUp = movePhotoUp;
window.movePhotoDown = movePhotoDown;
window.loadMyPhotosForStep9 = loadMyPhotosForStep9;
window.selectStep9Photo = selectStep9Photo;
window.deleteStep9Photo = deleteStep9Photo;
window.updatePhotoNumbers = updatePhotoNumbers;
window.savePhotoOrder = savePhotoOrder;
window.showPhotoSourceMenu = showPhotoSourceMenu;
window.closePhotoSourceMenu = closePhotoSourceMenu;
window.openGallery = openGallery;
window.handlePhotoSelect = handlePhotoSelect;
window.removePhoto = removePhoto;
window.showPhotoModal = showPhotoModal;
window.closePhotoModal = closePhotoModal;
window.addPhotoFromGallery = addPhotoFromGallery;
window.getPhotoUrl = getPhotoUrl;
window.compressImage = compressImage;
window.capturePhoto = capturePhoto;
window.closeCameraModal = closeCameraModal;
window.switchCamera = switchCamera;
window.swapPhotoPositions = swapPhotoPositions;
window.openCamera = openCamera;
window.deletePhotoFromStep9 = deletePhotoFromStep9;

/**
 * Открыть камеру для съёмки
 */
async function openCamera() {
    if (typeof closePhotoSourceMenu === 'function') closePhotoSourceMenu();
    
    // Проверяем поддержку getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback на обычный input с capture
        const cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            cameraInput.value = '';
            cameraInput.click();
        }
        return;
    }
    
    try {
        // Создаем модальное окно с камерой
        const cameraModal = document.createElement('div');
        cameraModal.id = 'cameraModal';
        cameraModal.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.95); z-index: 10000;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
            ">
                <video id="cameraPreview" autoplay playsinline style="
                    max-width: 100%; max-height: 70vh; border-radius: 12px;
                "></video>
                <canvas id="cameraCanvas" style="display: none;"></canvas>
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="switchCamera()" style="
                        background: rgba(131, 56, 236, 0.2); border: 2px solid var(--neon-purple);
                        border-radius: 50%; width: 70px; height: 70px; font-size: 32px; cursor: pointer;
                    ">🔄</button>
                    <button onclick="capturePhoto()" style="
                        background: rgba(0, 217, 255, 0.2); border: 2px solid var(--neon-cyan);
                        border-radius: 50%; width: 70px; height: 70px; font-size: 32px; cursor: pointer;
                    ">📸</button>
                    <button onclick="closeCameraModal()" style="
                        background: rgba(255, 0, 102, 0.2); border: 2px solid var(--neon-pink);
                        border-radius: 50%; width: 70px; height: 70px; font-size: 32px; cursor: pointer;
                    ">❌</button>
                </div>
            </div>
        `;
        document.body.appendChild(cameraModal);
        
        // Запускаем камеру
        window.currentFacingMode = 'environment';
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: window.currentFacingMode }
        });
        
        const video = document.getElementById('cameraPreview');
        if (video) {
            video.srcObject = stream;
            window.currentCameraStream = stream;
        }
        
    } catch (error) {
        console.error('❌ [PHOTOS] Ошибка открытия камеры:', error);
        // Fallback на input
        const cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            cameraInput.value = '';
            cameraInput.click();
        }
    }
}

/**
 * Удалить фото на шаге 9 (удаляет из галереи и всех анкет)
 */
async function deletePhotoFromStep9(photoId) {
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            throw new Error('User token not found');
        }
        
        console.log('🗑️ Удаляем фото ID:', photoId);
        
        const response = await fetch('/api/user-photos', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken, photoId })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        console.log('✅ Фото удалено');
        
        // Удаляем элемент из DOM
        const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
        if (photoElement && photoElement.parentElement) {
            photoElement.parentElement.remove();
        }
        
        // Проверяем, остались ли фото
        const gridDiv = document.getElementById('step9PhotoGrid');
        if (gridDiv && gridDiv.children.length === 0) {
            const galleryContainer = document.getElementById('step9PhotoGallery');
            if (galleryContainer) {
                galleryContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <p>📷 У вас пока нет фото в галерее</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка удаления фото:', error);
        if (typeof tg !== 'undefined' && tg?.showAlert) {
            tg.showAlert('Ошибка при удалении фото');
        }
    }
}

console.log('✅ [PHOTOS] Модуль фото инициализирован');
