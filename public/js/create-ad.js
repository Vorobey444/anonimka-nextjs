// ============= CREATE-AD.JS - Создание анкеты =============

let currentStep = 1;
const maxSteps = 9;

const adData = {
    gender: '',
    target: '',
    goals: [],
    ageFrom: '',
    ageTo: '',
    myAge: '',
    body: '',
    orientation: '',
    text: ''
};

function showCreateAd() {
    showScreen('createAd');
    currentStep = 1;
    resetForm();
    updateStepVisibility();
}

function resetForm() {
    currentStep = 1;
    Object.keys(adData).forEach(key => {
        if (key === 'goals') {
            adData[key] = [];
        } else {
            adData[key] = '';
        }
    });
    updateStepVisibility();
}

function updateStepVisibility() {
    // Скрываем все шаги
    for (let i = 1; i <= maxSteps; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.style.display = (i === currentStep) ? 'block' : 'none';
        }
    }
    
    // Показываем textarea на 8 шаге
    const textareaContainer = document.getElementById('textareaContainer');
    if (textareaContainer) {
        textareaContainer.style.display = (currentStep === 8) ? 'block' : 'none';
    }
    
    // Управление кнопками навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.style.display = (currentStep > 1) ? 'inline-block' : 'none';
    if (nextBtn) nextBtn.style.display = (currentStep < maxSteps) ? 'inline-block' : 'none';
    if (submitBtn) submitBtn.style.display = (currentStep === maxSteps) ? 'inline-block' : 'none';
}

function nextStep() {
    if (!validateCurrentStep()) return;
    
    if (currentStep < maxSteps) {
        currentStep++;
        updateStepVisibility();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepVisibility();
    }
}

function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            if (!adData.gender) {
                alert('Выберите ваш пол');
                return false;
            }
            break;
        case 2:
            if (!adData.target) {
                alert('Выберите кого ищете');
                return false;
            }
            break;
        case 3:
            if (adData.goals.length === 0) {
                alert('Выберите хотя бы одну цель');
                return false;
            }
            break;
        case 4:
            const ageFrom = document.getElementById('ageFrom')?.value;
            const ageTo = document.getElementById('ageTo')?.value;
            if (!ageFrom || !ageTo) {
                alert('Укажите возрастной диапазон');
                return false;
            }
            adData.ageFrom = ageFrom;
            adData.ageTo = ageTo;
            break;
        case 5:
            const myAge = document.getElementById('myAge')?.value;
            if (!myAge) {
                alert('Укажите ваш возраст');
                return false;
            }
            adData.myAge = myAge;
            break;
        case 6:
            if (!adData.body) {
                alert('Выберите телосложение');
                return false;
            }
            break;
        case 7:
            if (!adData.orientation) {
                alert('Выберите ориентацию');
                return false;
            }
            break;
        case 8:
            const text = document.getElementById('adText')?.value;
            if (!text || text.trim().length < 10) {
                alert('Напишите текст анкеты (минимум 10 символов)');
                return false;
            }
            adData.text = text.trim();
            break;
    }
    return true;
}

async function submitAd() {
    if (!validateCurrentStep()) return;
    
    try {
        const userToken = localStorage.getItem('user_token');
        if (!userToken) {
            alert('Ошибка: токен пользователя не найден');
            return;
        }
        
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.disabled = true;
        
        const response = await fetch('/api/ads/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_token: userToken,
                ...adData
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Анкета успешно создана!');
            window.location.href = '/my-ads';
        } else {
            alert('Ошибка создания анкеты: ' + (data.error || 'Неизвестная ошибка'));
            if (submitBtn) submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Ошибка создания анкеты:', error);
        alert('Ошибка соединения с сервером');
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Обработчики для кнопок выбора
document.addEventListener('DOMContentLoaded', () => {
    // Пол
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            adData.gender = btn.dataset.gender;
            document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            nextStep();
        });
    });
    
    // Цель
    document.querySelectorAll('.target-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            adData.target = btn.dataset.target;
            document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            nextStep();
        });
    });
    
    // Цели (множественный выбор)
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const goal = btn.dataset.goal;
            if (adData.goals.includes(goal)) {
                adData.goals = adData.goals.filter(g => g !== goal);
                btn.classList.remove('active');
            } else {
                adData.goals.push(goal);
                btn.classList.add('active');
            }
        });
    });
    
    // Телосложение
    document.querySelectorAll('.body-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.body) {
                adData.body = btn.dataset.body;
                document.querySelectorAll('.body-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                nextStep();
            } else if (btn.dataset.orientation) {
                adData.orientation = btn.dataset.orientation;
                document.querySelectorAll('.body-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                nextStep();
            }
        });
    });
});

function updateCharacterCount() {
    const textarea = document.getElementById('adText');
    const counter = document.getElementById('charCounter');
    if (textarea && counter) {
        counter.textContent = `${textarea.value.length}/500`;
    }
}

function increaseAge(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const currentValue = parseInt(input.value) || 18;
        if (currentValue < 99) {
            input.value = currentValue + 1;
        }
    }
}

function decreaseAge(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const currentValue = parseInt(input.value) || 18;
        if (currentValue > 18) {
            input.value = currentValue - 1;
        }
    }
}

function handleCreateAdBack() {
    if (currentStep > 1) {
        previousStep();
    } else {
        window.location.href = '/main';
    }
}

// Экспорт
window.showCreateAd = showCreateAd;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.submitAd = submitAd;
window.resetForm = resetForm;
window.updateCharacterCount = updateCharacterCount;
window.increaseAge = increaseAge;
window.decreaseAge = decreaseAge;
window.handleCreateAdBack = handleCreateAdBack;
