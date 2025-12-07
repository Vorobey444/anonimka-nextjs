// ============= СОЗДАНИЕ / РЕДАКТИРОВАНИЕ АНКЕТЫ =============

let adId = null;

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    adId = params.get('adId');

    if (adId) {
        loadAd(adId);
    }
});

async function loadAd(id) {
    setSavingState(true, 'Загрузка...');
    try {
        const data = await apiRequest(`/api/ads/${id}`);
        if (!data || !data.ad) throw new Error('Анкета не найдена');
        fillForm(data.ad);
    } catch (error) {
        console.error('Ошибка загрузки анкеты:', error);
        alert('Не удалось загрузить анкету');
        window.location.href = '/webapp-v2/my-ads.html';
    } finally {
        setSavingState(false);
    }
}

function fillForm(ad) {
    document.getElementById('nickname').value = ad.nickname || '';
    document.getElementById('gender').value = ad.gender || '';
    document.getElementById('age').value = ad.age || '';
    document.getElementById('city').value = ad.city || '';
    document.getElementById('about').value = ad.about || '';
    document.getElementById('interests').value = (ad.interests || []).join(', ');
    document.getElementById('lookingFor').value = ad.looking_for || '';
}

async function saveAd(event) {
    event.preventDefault();
    setSavingState(true, 'Сохранение...');

    try {
        const userId = getUserId();
        if (!userId) throw new Error('Нет авторизации');

        const payload = collectForm();
        payload.tgId = userId;

        if (adId) {
            await apiRequest(`/api/ads/${adId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/ads', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        alert('✅ Анкета сохранена');
        window.location.href = '/webapp-v2/my-ads.html';
    } catch (error) {
        console.error('Ошибка сохранения анкеты:', error);
        alert('Не удалось сохранить анкету');
    } finally {
        setSavingState(false);
    }
}

function collectForm() {
    return {
        nickname: document.getElementById('nickname').value.trim(),
        gender: document.getElementById('gender').value,
        age: Number(document.getElementById('age').value),
        city: document.getElementById('city').value.trim(),
        about: document.getElementById('about').value.trim(),
        interests: document.getElementById('interests').value
            .split(',')
            .map(i => i.trim())
            .filter(Boolean),
        looking_for: document.getElementById('lookingFor').value.trim()
    };
}

function setSavingState(isSaving, text = 'Сохранение...') {
    const btn = document.getElementById('saveBtn');
    if (!btn) return;
    btn.disabled = isSaving;
    btn.textContent = isSaving ? text : '💾 Сохранить';
}

// Экспорт
window.saveAd = saveAd;
