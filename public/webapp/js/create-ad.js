// ============= РЎРћР—Р”РђРќРР• / Р Р•Р”РђРљРўРР РћР’РђРќРР• РђРќРљР•РўР« =============

let adId = null;

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    adId = params.get('adId');

    if (adId) {
        loadAd(adId);
    }
});

async function loadAd(id) {
    setSavingState(true, 'Р—Р°РіСЂСѓР·РєР°...');
    try {
        const data = await apiRequest(`/api/ads/${id}`);
        if (!data || !data.ad) throw new Error('РђРЅРєРµС‚Р° РЅРµ РЅР°Р№РґРµРЅР°');
        fillForm(data.ad);
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р°РЅРєРµС‚С‹:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РЅРєРµС‚Сѓ');
        window.location.href = '/webapp/my-ads.html';
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
    setSavingState(true, 'РЎРѕС…СЂР°РЅРµРЅРёРµ...');

    try {
        const userId = getUserId();
        if (!userId) throw new Error('РќРµС‚ Р°РІС‚РѕСЂРёР·Р°С†РёРё');

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

        alert('вњ… РђРЅРєРµС‚Р° СЃРѕС…СЂР°РЅРµРЅР°');
        window.location.href = '/webapp/my-ads.html';
    } catch (error) {
        console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ Р°РЅРєРµС‚С‹:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р°РЅРєРµС‚Сѓ');
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

function setSavingState(isSaving, text = 'РЎРѕС…СЂР°РЅРµРЅРёРµ...') {
    const btn = document.getElementById('saveBtn');
    if (!btn) return;
    btn.disabled = isSaving;
    btn.textContent = isSaving ? text : 'рџ’ѕ РЎРѕС…СЂР°РЅРёС‚СЊ';
}

// Р­РєСЃРїРѕСЂС‚
window.saveAd = saveAd;

