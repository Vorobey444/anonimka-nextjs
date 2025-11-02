# Скрипт для улучшения отображения "Моих объявлений"

$file = "public/webapp/app.js"
$content = Get-Content $file -Raw -Encoding UTF8

# Находим и заменяем блок отображения карточки объявления
$oldBlock = @'
            return `
            <div class="ad-card" data-ad-id="\$\{ad.id\}">
                \$\{isPinned \? '<span class="pinned-badge">📌 Закреплено</span>' : ''\}
                <div class="ad-info">
                    <div class="ad-field">
                        <span class="icon">\$\{ad.gender === 'male' \? '👨' : '👩'\}</span>
                        <span>\$\{ad.my_age \|\| '\?'\} лет, \$\{ad.body_type \|\| 'не указано'\}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">🎯</span>
                        <span>\$\{ad.goal \|\| 'не указано'\}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">\$\{ad.target === 'male' \|\| ad.target === 'мужчину' \? '.*?' : ad.target === 'female' \|\| ad.target === 'женщину' \? '👩' : '.*?'\}</span>
                        <span>Ищу \$\{ad.target \|\| '\?'\}, \$\{ageFrom\}-\$\{ageTo\} лет</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">📍</span>
                        <span>\$\{locationData\[ad.country\]\?\.flag \|\| '🌍'\} \$\{ad.region\}, \$\{ad.city\}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">📝</span>
                        <span>\$\{ad.text \? \(ad.text.substring\(0, 100\) \+ \(ad.text.length > 100 \? '...' : ''\)\) : 'Без описания'\}</span>
                    </div>
                    <div class="ad-field">
                        <span class="icon">📅</span>
                        <span>\$\{new Date\(ad.created_at\).toLocaleDateString\('ru-RU'\)\}</span>
                    </div>
                </div>
'@

$newBlock = @'
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
'@

$content = $content -replace [regex]::Escape($oldBlock), $newBlock

Set-Content $file -Value $content -Encoding UTF8 -NoNewline

Write-Host "Отображение объявлений улучшено!" -ForegroundColor Green
