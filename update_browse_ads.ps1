# Скрипт для обновления секции browsеAds в index.html

$filePath = "public/webapp/index.html"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Старая секция для замены
$oldSection = @'
            <div class="location-selector">
                <h3>📍 Выберите локацию</h3>
                
                <!-- Выбор страны для фильтра -->
                <div class="form-country-selection">
                    <h4>Страна</h4>
                    <div class="country-buttons">
                        <button type="button" class="country-btn form-country filter-country" data-country="russia">
                            <span class="flag">🇷🇺</span>
                            Россия
                        </button>
                        <button type="button" class="country-btn form-country filter-country" data-country="kazakhstan">
                            <span class="flag">🇰🇿</span>
                            Казахстан
                        </button>
                    </div>
                </div>

                <!-- Выбор региона для фильтра -->
                <div class="form-region-selection filter-region-selection" style="display: none;">
                    <h4>Регион/область</h4>
                    <div class="search-container">
                        <input type="text" class="form-region-input filter-region-input" placeholder="Начните вводить название...">
                        <div class="suggestions-list form-region-suggestions filter-region-suggestions"></div>
                    </div>
                </div>

                <!-- Выбор города для фильтра -->
                <div class="form-city-selection filter-city-selection" style="display: none;">
                    <h4>Город</h4>
                    <div class="search-container">
                        <input type="text" class="form-city-input filter-city-input" placeholder="Введите название города...">
                        <div class="suggestions-list form-city-suggestions filter-city-suggestions"></div>
                    </div>
                </div>

                <!-- Отображение выбранной локации для фильтра -->
                <div class="form-selected-location filter-selected-location" style="display: none;">
                    <div class="location-display">
                        <span class="form-location-text filter-location-text"></span>
                        <button type="button" class="reset-form-location reset-filter-location">🔄 Изменить</button>
                    </div>
                </div>
            </div>
'@

# Новая секция
$newSection = @'
            <div class="current-location-display">
                <p class="location-label">📍 Ваша локация:</p>
                <p class="location-value" id="browseLocationDisplay">Загрузка...</p>
                <button class="neon-button small" onclick="showLocationSetup()">
                    🔄 Сменить локацию
                </button>
            </div>
'@

# Заменяем
$newContent = $content -replace [regex]::Escape($oldSection), $newSection

# Добавляем секцию "Мои объявления" после browseAds
$insertAfter = @'
        </div>

        <!-- Детали объявления -->
'@

$myAdsSection = @'
        </div>

        <!-- Мои объявления -->
        <div id="myAds" class="screen">
            <div class="header">
                <button class="back-btn" onclick="showMainMenu()">← Назад</button>
                <h2>Мои объявления</h2>
            </div>

            <div id="myAdsList" class="ads-list">
                <!-- Объявления пользователя будут загружены через JS -->
            </div>
        </div>

        <!-- Детали объявления -->
'@

$newContent = $newContent -replace [regex]::Escape($insertAfter), $myAdsSection

# Сохраняем
Set-Content $filePath -Value $newContent -Encoding UTF8 -NoNewline

Write-Host "✅ Файл index.html обновлен successfully!"
