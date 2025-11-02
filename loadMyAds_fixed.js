// Улучшенная версия функции loadMyAds с читаемым форматом

// В строке 1130 заменить на:
myAdsList.innerHTML = myAds.map((ad, index) => {
    const isPinned = ad.is_pinned && (!ad.pinned_until || new Date(ad.pinned_until) > new Date());
    const ageFrom = ad.age_from || ad.ageFrom || '?';
    const ageTo = ad.age_to || ad.ageTo || '?';
    
    const authorGender = ad.gender === 'male' ? 'Мужчина' : 'Женщина';
    const authorIcon = ad.gender === 'male' ? '👨' : '👩';
    const targetText = ad.target === 'male' || ad.target === 'мужчину' ? 'мужчину' : 'женщину';
    const targetIcon = ad.target === 'male' || ad.target === 'мужчину' ? '👨' : '👩';
    
    return `
    <div class="ad-card" data-ad-id="${ad.id}">
        ${isPinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
        <div class="ad-header">
            <h3>${authorIcon} ${authorGender}, ${ad.my_age || '?'} лет</h3>
            <span class="ad-date">📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}</span>
        </div>
        <div class="ad-info">
            <div class="ad-field">
                <span class="icon">💪</span>
                <span><strong>Телосложение:</strong> ${ad.body_type || 'не указано'}</span>
            </div>
            <div class="ad-field">
                <span class="icon">🎯</span>
                <span><strong>Цель:</strong> ${ad.goal || 'не указано'}</span>
            </div>
            <div class="ad-field">
                <span class="icon">${targetIcon}</span>
                <span><strong>Ищу:</strong> ${targetText}, ${ageFrom}-${ageTo} лет</span>
            </div>
            <div class="ad-field">
                <span class="icon">📍</span>
                <span>${locationData[ad.country]?.flag || '🌍'} ${ad.region}, ${ad.city}</span>
            </div>
            ${ad.text ? `<div class="ad-field full-width">
                <span class="icon">📝</span>
                <span><strong>О себе:</strong> ${ad.text}</span>
            </div>` : ''}
        </div>
        <div class="ad-actions">
            <button class="delete-ad-btn" onclick="deleteMyAd(${ad.id})">🗑️ Удалить</button>
            <button class="pin-ad-btn" onclick="pinMyAd(${ad.id}, ${!isPinned})">${isPinned ? '✖️ Открепить' : '📌 Закрепить (24ч)'}</button>
        </div>
    </div>
`;
}).join('');
