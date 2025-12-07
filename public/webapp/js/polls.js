// ============= РћРџР РћРЎР« =============

let polls = [];

window.addEventListener('DOMContentLoaded', () => {
    loadPolls();
});

async function loadPolls() {
    const list = document.getElementById('pollsList');
    list.innerHTML = '<div class="empty-state">Р—Р°РіСЂСѓР·РєР°...</div>';
    try {
        const data = await apiRequest('/api/polls');
        polls = data.polls || [];
        renderPolls();
    } catch (error) {
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РѕРїСЂРѕСЃРѕРІ:', error);
        list.innerHTML = '<div class="empty-state">РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕРїСЂРѕСЃС‹</div>';
    }
}

function renderPolls() {
    const list = document.getElementById('pollsList');
    if (!polls.length) {
        list.innerHTML = '<div class="empty-state">РћРїСЂРѕСЃРѕРІ РїРѕРєР° РЅРµС‚</div>';
        return;
    }
    list.innerHTML = '';

    polls.forEach(poll => {
        const card = document.createElement('div');
        card.className = 'info-card neon-card';
        card.innerHTML = `
            <h3>${poll.question || 'РћРїСЂРѕСЃ'}</h3>
            <div class="poll-options">
                ${(poll.options || []).map(opt => renderOption(poll, opt)).join('')}
            </div>
        `;
        list.appendChild(card);
    });
}

function renderOption(poll, opt) {
    const totalVotes = (poll.options || []).reduce((sum, o) => sum + (o.votes || 0), 0) || 0;
    const percent = totalVotes ? Math.round((opt.votes || 0) * 100 / totalVotes) : 0;
    const disabled = poll.voted;
    return `
        <button class="poll-option ${disabled ? 'disabled' : ''}" data-poll="${poll.id}" data-option="${opt.id}" ${disabled ? 'disabled' : ''} onclick="vote(this)">
            <span>${opt.text || 'Р’Р°СЂРёР°РЅС‚'}</span>
            <span class="poll-percent">${percent}% вЂў ${opt.votes || 0}</span>
        </button>
    `;
}

async function vote(btn) {
    const pollId = btn.getAttribute('data-poll');
    const optionId = btn.getAttribute('data-option');
    if (!pollId || !optionId) return;

    // Р‘Р»РѕРєРёСЂСѓРµРј СЃСЂР°Р·Сѓ
    btn.disabled = true;
    try {
        await apiRequest(`/api/polls/${pollId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ optionId })
        });
        await loadPolls();
    } catch (error) {
        console.error('РћС€РёР±РєР° РіРѕР»РѕСЃРѕРІР°РЅРёСЏ:', error);
        alert('РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕРіРѕР»РѕСЃРѕРІР°С‚СЊ');
        btn.disabled = false;
    }
}

// Р­РєСЃРїРѕСЂС‚
window.vote = vote;

