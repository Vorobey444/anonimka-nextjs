// ============= ПРОФИЛЬ =============

window.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});

async function loadProfile() {
    try {
        const userId = getUserId();
        if (!userId) {
            document.getElementById('accountInfo').textContent = 'Требуется авторизация';
            return;
        }

        const data = await apiRequest(`/api/users?tgId=${userId}`);
        if (!data || !data.success) throw new Error('Нет данных');

        const user = data;
        document.getElementById('pNickname').value = user.displayNickname || '';
        document.getElementById('pGender').value = user.gender || '';
        document.getElementById('pAge').value = user.age || '';
        document.getElementById('pCity').value = user.city || '';
        document.getElementById('pAbout').value = user.about || '';

        document.getElementById('accountInfo').textContent = `ID: ${user.id || user.tgId || ''} | PRO: ${user.isPremium ? 'Да' : 'Нет'}`;
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        document.getElementById('accountInfo').textContent = 'Не удалось загрузить профиль';
    }
}

async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
        const userId = getUserId();
        if (!userId) throw new Error('Нет авторизации');

        const payload = {
            tgId: userId,
            displayNickname: document.getElementById('pNickname').value.trim(),
            gender: document.getElementById('pGender').value,
            age: Number(document.getElementById('pAge').value) || null,
            city: document.getElementById('pCity').value.trim(),
            about: document.getElementById('pAbout').value.trim()
        };

        await apiRequest('/api/profile', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        alert('✅ Профиль сохранён');
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        alert('Не удалось сохранить профиль');
    } finally {
        setSaving(false);
    }
}

function setSaving(isSaving) {
    const btn = document.getElementById('saveProfileBtn');
    if (!btn) return;
    btn.disabled = isSaving;
    btn.textContent = isSaving ? 'Сохранение...' : '💾 Сохранить';
}

// Экспорт
window.saveProfile = saveProfile;
