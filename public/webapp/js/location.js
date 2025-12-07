// ============= Р›РћРљРђР¦РРЇ =============

window.addEventListener('DOMContentLoaded', () => {
    loadSavedLocation();
});

function loadSavedLocation() {
    try {
        const saved = localStorage.getItem('userLocation');
        if (!saved) return;
        const loc = JSON.parse(saved);
        if (loc.country) document.getElementById('country').value = loc.country;
        if (loc.region) document.getElementById('region').value = loc.region;
        if (loc.city) document.getElementById('city').value = loc.city;
    } catch (e) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р»РѕРєР°С†РёРё РёР· localStorage:', e);
    }
}

async function saveLocation(event) {
    event.preventDefault();
    setSaving(true);
    try {
        const location = {
            country: document.getElementById('country').value,
            region: document.getElementById('region').value.trim(),
            city: document.getElementById('city').value.trim(),
            timestamp: Date.now()
        };

        localStorage.setItem('userLocation', JSON.stringify(location));
        localStorage.setItem('userCountry', location.country);
        localStorage.setItem('userRegion', location.region);
        localStorage.setItem('userCity', location.city);

        const userId = getUserId();
        const userToken = localStorage.getItem('user_token');
        if (userId || userToken) {
            try {
                await apiRequest('/api/location', {
                    method: 'POST',
                    body: JSON.stringify({
                        tgId: userId,
                        userToken,
                        location
                    })
                });
            } catch (apiErr) {
                console.warn('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р»РѕРєР°С†РёСЋ РЅР° СЃРµСЂРІРµСЂРµ:', apiErr);
            }
        }

        alert('вњ… Р›РѕРєР°С†РёСЏ СЃРѕС…СЂР°РЅРµРЅР°');
        window.history.back();
    } catch (error) {
        console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ Р»РѕРєР°С†РёРё:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р»РѕРєР°С†РёСЋ');
    } finally {
        setSaving(false);
    }
}

function resetLocation() {
    localStorage.removeItem('userLocation');
    localStorage.removeItem('userCountry');
    localStorage.removeItem('userRegion');
    localStorage.removeItem('userCity');
    document.getElementById('region').value = '';
    document.getElementById('city').value = '';
    alert('Р›РѕРєР°С†РёСЏ СЃР±СЂРѕС€РµРЅР°');
}

function setSaving(isSaving) {
    const btn = document.getElementById('saveLocationBtn');
    if (!btn) return;
    btn.disabled = isSaving;
    btn.textContent = isSaving ? 'РЎРѕС…СЂР°РЅРµРЅРёРµ...' : 'рџ’ѕ РЎРѕС…СЂР°РЅРёС‚СЊ';
}

// Р­РєСЃРїРѕСЂС‚
window.saveLocation = saveLocation;
window.resetLocation = resetLocation;

