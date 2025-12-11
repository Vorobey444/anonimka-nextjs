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
    if (!userToken) {
        tg.showAlert('❌ Требуется авторизация');
        return;
    }
    
    const url = window.location.origin + '/my-photo?userToken=' + userToken;
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
    
    if (!userToken) {
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
        
        const resp = await fetch(`/api/user-photos?userToken=${userToken}`);
        
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
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
                            <button onclick="editPhotoCaption(${photo.id}, '${(photo.caption || '').replace(/'/g, "\\'")}'); event.stopPropagation();" style="flex: 1; min-width: 60px; padding: 8px 6px; background: rgba(131, 56, 236, 0.2); border: 1px solid rgba(131, 56, 236, 0.5); color: #8338ec; border-radius: 6px; font-size: 0.7rem; cursor: pointer;">✏️ Подпись</button>
                            <button onclick="togglePhotoActive(${photo.id}, ${!isActive}); event.stopPropagation();" style="flex: 1; min-width: 60px; padding: 8px 6px; background: ${isActive ? 'rgba(0, 217, 255, 0.2)' : 'rgba(131, 56, 236, 0.2)'}; border: 1px solid ${isActive ? 'rgba(0, 217, 255, 0.5)' : 'rgba(131, 56, 236, 0.5)'}; color: ${isActive ? '#00d9ff' : '#8338ec'}; border-radius: 6px; font-size: 0.7rem; cursor: pointer;">
                                ${isActive ? '👁️ Видимо' : '🚫 Скрыто'}
                            </button>
                            <button onclick="deletePhoto(${photo.id}); event.stopPropagation();" style="flex: 1; min-width: 60px; padding: 8px 6px; background: rgba(255, 59, 48, 0.2); border: 1px solid rgba(255, 59, 48, 0.5); color: #ff3b30; border-radius: 6px; font-size: 0.7rem; cursor: pointer;">🗑️ Удалить</button>
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
 * Добавить фото при создании анкеты (шаг 9)
 */
async function addAdPhoto() {
    console.log('📸 [addAdPhoto] Начало загрузки фото для анкеты');
    
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
            
            const userId = localStorage.getItem('user_token');
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
            const userToken = localStorage.getItem('user_token');
            await fetch('/api/user-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userToken,
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
        if (!userToken) return;
        
        const resp = await fetch(`/api/user-photos?userToken=${userToken}`);
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
        
        container.innerHTML = '';
        container.style.display = 'block';
        
        // Инфо блок
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 12px;
            color: var(--neon-cyan);
            font-size: 12px;
        `;
        infoDiv.innerHTML = `ℹ️ Выберите фото для анкеты или добавьте новое`;
        container.appendChild(infoDiv);
        
        // Сетка фото
        const gridDiv = document.createElement('div');
        gridDiv.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        `;
        
        photos.slice(0, 6).forEach((photo, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'step9-photo-item';
            photoDiv.style.cssText = `
                position: relative;
                border: 2px solid ${formData?.selectedPhotoId === photo.id ? 'var(--neon-pink)' : 'var(--neon-cyan)'};
                border-radius: 8px;
                overflow: hidden;
                aspect-ratio: 1;
                cursor: pointer;
            `;
            photoDiv.onclick = () => selectStep9Photo(photo.id, photo.photo_url, photo.file_id);
            
            const img = document.createElement('img');
            img.src = photo.photo_url;
            img.alt = `Фото ${index + 1}`;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            photoDiv.appendChild(img);
            
            // Кнопка удаления
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '✕';
            delBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: rgba(255, 0, 0, 0.9);
                color: white;
                border: none;
                cursor: pointer;
                font-size: 14px;
            `;
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm('Удалить это фото?')) {
                    await deleteStep9Photo(photo.id);
                }
            };
            photoDiv.appendChild(delBtn);
            
            gridDiv.appendChild(photoDiv);
        });
        
        container.appendChild(gridDiv);
        
    } catch (error) {
        console.error('Ошибка загрузки фото для шага 9:', error);
    }
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
 * Удалить фото на шаге 9
 */
async function deleteStep9Photo(photoId) {
    try {
        const userToken = localStorage.getItem('user_token');
        const resp = await fetch('/api/user-photos', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoId, userToken })
        });
        
        if (resp.ok) {
            tg.showAlert('✅ Фото удалено');
            loadMyPhotosForStep9(); // Перезагружаем галерею
        }
    } catch (error) {
        console.error('Ошибка удаления фото:', error);
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
    const userId = getCurrentUserId();
    
    if (!userToken) {
        tg.showAlert('Требуется авторизация');
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
                    userToken,
                    tgId: userId,
                    fileId: photoData.file_id,
                    photoUrl: photoData.photo_url,
                    caption: null
                })
            });
            
            const result = await resp.json();
            if (result.error) throw new Error(result.error.message);
            
            await loadMyPhotos();
            
            if (result.overLimit) {
                tg.showAlert(`⚠️ Достигнут лимит: ${result.limit} фото.\\n\\nЛишние фото деактивированы.`);
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
window.showPhotoSourceMenu = showPhotoSourceMenu;
window.closePhotoSourceMenu = closePhotoSourceMenu;
window.openGallery = openGallery;
window.removePhoto = removePhoto;
window.showPhotoModal = showPhotoModal;
window.closePhotoModal = closePhotoModal;
window.addPhotoFromGallery = addPhotoFromGallery;
window.getPhotoUrl = getPhotoUrl;
window.compressImage = compressImage;
window.capturePhoto = capturePhoto;
window.closeCameraModal = closeCameraModal;
window.switchCamera = switchCamera;

console.log('✅ [PHOTOS] Модуль фото инициализирован');
