// ============= POLLS.JS - Опросы =============

function showPolls() {
    showScreen('pollsScreen');
    loadPollResults('photos_in_ads');
}

async function votePoll(pollId, answer) {
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
        alert('Ошибка: токен пользователя не найден');
        return;
    }
    
    try {
        const response = await fetch('/api/poll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Token': userToken
            },
            body: JSON.stringify({
                poll_id: pollId,
                answer: answer
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem(`poll_voted_${pollId}`, 'true');
            loadPollResults(pollId);
        } else {
            if (data.error === 'Already voted') {
                alert('Вы уже проголосовали в этом опросе!');
                loadPollResults(pollId);
            } else {
                alert('Ошибка голосования: ' + (data.error || 'Неизвестная ошибка'));
            }
        }
    } catch (error) {
        console.error('Ошибка голосования:', error);
        alert('Ошибка соединения с сервером');
    }
}

async function loadPollResults(pollId) {
    let prefix = '';
    if (pollId === 'photos_in_ads') {
        prefix = 'photos';
    }
    
    const optionsElement = document.getElementById(`${prefix}PollOptions`);
    const resultsElement = document.getElementById(`${prefix}PollResults`);
    
    if (!optionsElement || !resultsElement) return;
    
    try {
        const userToken = localStorage.getItem('user_token');
        const headers = { 'Content-Type': 'application/json' };
        if (userToken) headers['X-User-Token'] = userToken;
        
        const response = await fetch(`/api/poll?poll_id=${pollId}`, { headers });
        const data = await response.json();
        
        if (data.success) {
            const total = data.results.yes + data.results.no;
            const yesPercent = total > 0 ? Math.round((data.results.yes / total) * 100) : 0;
            const noPercent = total > 0 ? Math.round((data.results.no / total) * 100) : 0;
            
            if (data.hasVoted) {
                document.getElementById(`${prefix}YesPercent`).textContent = yesPercent + '%';
                document.getElementById(`${prefix}NoPercent`).textContent = noPercent + '%';
                document.getElementById(`${prefix}YesBar`).style.width = yesPercent + '%';
                document.getElementById(`${prefix}NoBar`).style.width = noPercent + '%';
                document.getElementById(`${prefix}YesCount`).textContent = data.results.yes + ' ' + getPluralForm(data.results.yes, 'голос', 'голоса', 'голосов');
                document.getElementById(`${prefix}NoCount`).textContent = data.results.no + ' ' + getPluralForm(data.results.no, 'голос', 'голоса', 'голосов');
                document.getElementById(`${prefix}TotalVotes`).textContent = total;
                
                optionsElement.style.display = 'none';
                resultsElement.style.display = 'flex';
            } else {
                optionsElement.style.display = 'flex';
                resultsElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки результатов:', error);
        optionsElement.style.display = 'flex';
        resultsElement.style.display = 'none';
    }
}

function getPluralForm(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

window.showPolls = showPolls;
window.votePoll = votePoll;
window.loadPollResults = loadPollResults;
