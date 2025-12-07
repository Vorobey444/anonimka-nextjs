// ============= РџР РћР¤РР›Р¬ =============

window.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});

async function loadProfile() {
    try {
        const userId = getUserId();
        if (!userId) {
            document.getElementById('accountInfo').textContent = 'РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ';
            return;
        }

        const data = await apiRequest(`/api/users?tgId=${userId}`);
        if (!data || !data.success) throw new Error('РќРµС‚ РґР°РЅРЅС‹С…');

        const user = data;
        document.getElementById('pNickname').value = user.displayNickname || '';
        document.getElementById('pGender').value = user.gender || '';
        document.getElementById('pAge').value = user.age || '';
        document.getElementById('pCity').value = user.city || '';
        document.getElementById('pAbout').value = user.about || '';

        document.getElementById('accountInfo').textContent = `ID: ${user.id || user.tgId || ''} | PRO: ${user.isPremium ? 'Р”Р°' : 'РќРµС‚'}`;
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРѕС„РёР»СЏ:', error);
        document.getElementById('accountInfo').textContent = 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РїСЂРѕС„РёР»СЊ';
    }
}

async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
        const userId = getUserId();
        if (!userId) throw new Error('РќРµС‚ Р°РІС‚РѕСЂРёР·Р°С†РёРё');

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

        alert('вњ… РџСЂРѕС„РёР»СЊ СЃРѕС…СЂР°РЅС‘РЅ');
    } catch (error) {
        console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РїСЂРѕС„РёР»СЏ:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕС„РёР»СЊ');
    } finally {
        setSaving(false);
    }
}

function setSaving(isSaving) {
    const btn = document.getElementById('saveProfileBtn');
    if (!btn) return;
    btn.disabled = isSaving;
    btn.textContent = isSaving ? 'РЎРѕС…СЂР°РЅРµРЅРёРµ...' : 'рџ’ѕ РЎРѕС…СЂР°РЅРёС‚СЊ';
}

// Р­РєСЃРїРѕСЂС‚
window.saveProfile = saveProfile;

