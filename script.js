let isListening = false;
let micButtonChat;
let stopSpeakingButton;
let clearChatButton;
let clearChatConfirmModal;
let cancelClearChatButton;
let confirmClearChatButton;
let settingsToggleHome;
let settingsToggleChat;
let settingsModal;
let speakResponseToggle;
let autoOpenToggle;

let speakResponseEnabled = true;
let autoOpenEnabled = false;

function updateMicButtonState() {
    if (micButtonChat) {
        const icon = micButtonChat.querySelector('i');
        if (isListening) {
            icon.classList.remove('fa-microphone-slash');
            icon.classList.add('fa-microphone');
            micButtonChat.classList.add('active'); 
        } else {
            icon.classList.remove('fa-microphone');
            icon.classList.add('fa-microphone-slash');
            micButtonChat.classList.remove('active'); 
        }
    }
}


function initBubbles() {
    const container = document.getElementById('bubbles-container');
    const bubbleCount = window.innerWidth < 768 ? 5 : 10;

    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        const size = Math.random() * 100 + 50;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 20 + 10;
        const delay = Math.random() * 10;

        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.top = `${Math.random() * 100 + 100}%`;
        bubble.style.animationDuration = `${animationDuration}s`;
        bubble.style.animationDelay = `-${delay}s`;

        container.appendChild(bubble);
    }
}

function toggleTheme() {
    document.body.classList.toggle('light');
    document.body.classList.toggle('dark');

    const themeToggles = document.querySelectorAll('#theme-toggle, #theme-toggle-chat');
    themeToggles.forEach(toggle => {
        const icon = toggle.querySelector('i');
        if (document.body.classList.contains('light')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    const page = document.getElementById(pageId);
    page.classList.remove('hidden');

    if (pageId === 'chat-page') {
        loadChatHistory();
        page.classList.add('swipe-up');
        setTimeout(() => {
            page.classList.remove('swipe-up');
            document.body.style.overflow = 'hidden';
        }, 500);
    } else {
        page.classList.add('swipe-down');
        setTimeout(() => {
            page.classList.remove('swipe-down');
            document.body.style.overflow = '';
        }, 500);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function speakText(text) {
    if (!speakResponseEnabled) {
        return;
    }

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';

        const voices = speechSynthesis.getVoices();
        const russianVoices = voices.filter(voice => voice.lang === 'ru-RU');
        
        const preferredVoice = russianVoices.find(voice => voice.name.includes('Google') && voice.name.includes('Russian')) ||
                               russianVoices.find(voice => voice.name.includes('Microsoft') && voice.name.includes('Russian')) ||
                               russianVoices[0]; 

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
            if (stopSpeakingButton) {
                stopSpeakingButton.classList.remove('hidden');
            }
        };

        utterance.onend = () => {
            if (stopSpeakingButton) {
                stopSpeakingButton.classList.add('hidden');
            }
        };

        utterance.onerror = (event) => {
            console.error("SpeechSynthesisUtterance.onerror", event);
            if (stopSpeakingButton) {
                stopSpeakingButton.classList.add('hidden');
            }
        };

        speechSynthesis.cancel(); 
        speechSynthesis.speak(utterance);
    } else {
        console.warn('SpeechSynthesis API not supported in this browser.');
    }
}

function stopSpeaking() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        if (stopSpeakingButton) {
            stopSpeakingButton.classList.add('hidden');
        }
    }
}

async function _internalSendMessage(message, isVoiceInputRequest) {
    console.log("Отправка сообщения в Mistral API:", message);

    const loadingId = 'loading-' + Date.now();
    document.getElementById('chat-container').innerHTML += `
        <div id="${loadingId}" class="chat-message assistant p-2 mb-2 loading-dots">
            <div class="flex space-x-1">
                <div class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    `;

    scrollChatToBottom();

    try {
        let chatHistory = getChatHistoryForAPI();
        if (!chatHistory.length || chatHistory[chatHistory.length - 1].content !== message || chatHistory[chatHistory.length - 1].role !== 'user') {
             chatHistory.push({ role: 'user', content: message });
        }
        
        console.log("Полная история чата для Mistral API:", JSON.stringify(chatHistory));

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer iWyckB3Mn6SAp4ojlxK9zKIKfTq4XMXO'
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: chatHistory,
                temperature: 0.5 
            })
        });

        const data = await response.json();
        console.log("Ответ от Mistral API:", data);

        document.getElementById(loadingId)?.remove();

        if (response.ok && data.choices && data.choices.length > 0) {
            const assistantResponse = data.choices[0].message.content;
            addMessageToChat('assistant', assistantResponse);
            
            if (isVoiceInputRequest) {
                speakText(assistantResponse);
            }

            if (document.querySelectorAll('.chat-message').length >= 2) {
                       document.getElementById('products-sidebar').classList.remove('hidden');
            }
        } else {
            console.error("Ошибка: В ответе Mistral AI отсутствуют 'choices' или они пусты, либо HTTP статус не OK.", data);
            let errorMessage = 'Извините, не удалось получить ответ. Попробуйте еще раз.';
            if (response.status === 429) {
                errorMessage = 'Вы слишком часто отправляете запросы. Пожалуйста, подождите немного и попробуйте снова.';
            } else if (data.error && data.error.message) {
                errorMessage = `Ошибка от API: ${data.error.message}`;
            }
            addMessageToChat('assistant', errorMessage);
            if (isVoiceInputRequest) {
                speakText(errorMessage);
            }
        }
    } catch (error) {
        console.error("Произошла ошибка при подключении к серверу Mistral AI:", error);
        document.getElementById(loadingId)?.remove();
        addMessageToChat('assistant', 'Произошла ошибка при подключении к серверу. Пожалуйста, попробуйте позже.');
        if (isVoiceInputRequest) {
            speakText('Произошла ошибка при подключении к серверу. Попробуйте позже.');
        }
    }
}

async function sendMessage(isVoiceInput = false, messageText = '') {
    const input = document.getElementById('message-input');
    const message = messageText || input.value.trim(); 

    if (!message) {
        return;
    }

    if (!isVoiceInput) { 
        addMessageToChat('user', message);
        input.value = '';
    }
    
    if (message) {
        await _internalSendMessage(message, isVoiceInput); 
    }
}

function addMessageToChat(role, content) {
    const chatContainer = document.getElementById('chat-container');
    const messageClass = role === 'user' ? 'user' : 'assistant';

    chatContainer.innerHTML += `
        <div class="chat-message ${messageClass} p-2 mb-2">
            ${content}
        </div>
    `;

    scrollChatToBottom();
    saveChatToHistory(role, content);
}

function scrollChatToBottom() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function getChatHistoryForAPI() {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        history = history.filter(msg => msg && msg.role && msg.content !== undefined && msg.content !== null);
    } catch (e) {
        console.error("Ошибка при парсинге истории чата из localStorage:", e);
        history = [];
        localStorage.removeItem('chatHistory');
    }

    return history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));
}

function saveChatToHistory(role, content) {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    } catch (e) {
        console.error("Ошибка при загрузке истории чата для сохранения:", e);
        history = [];
    }
    history.push({ role, content });
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

function loadChatHistory() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        if (!Array.isArray(history) || history.some(msg => !msg || msg.content === undefined)) {
            throw new Error("Неверный формат истории чата.");
        }
    } catch (e) {
        console.error("Ошибка при загрузке истории чата:", e);
        history = [];
        localStorage.removeItem('chatHistory');
    }

    if (history.length === 0) {
        addMessageToChat('assistant', 'Привет! Я Среда, ваш голосовой помощник. Скажите "Среда", чтобы я вас услышала!');
    } else {
        history.forEach(msg => {
            chatContainer.innerHTML += `
                <div class="chat-message ${msg.role} p-2 mb-2">
                    ${msg.content}
                </div>
            `;
        });
    }

    if (document.querySelectorAll('.chat-message').length > 0) {
        document.getElementById('products-sidebar').classList.remove('hidden');
    }

    scrollChatToBottom();
}

function clearChatHistory() {
    localStorage.removeItem('chatHistory');
    loadChatHistory(); 
    closeModal('clear-chat-confirm-modal');
}

function initSwipeEvents() {
    let startY = 0;
    let endY = 0;

    document.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
        endY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', () => {
        const diff = startY - endY;

        if (diff > 100 && !document.getElementById('home-page').classList.contains('hidden')) {
            showPage('chat-page');
        }

        if (diff < -100 && !document.getElementById('chat-page').classList.contains('hidden')) {
            showPage('home-page');
        }
    });
}

function loadSettings() {
    const savedSpeakResponse = localStorage.getItem('speakResponseEnabled');
    if (savedSpeakResponse !== null) {
        speakResponseEnabled = JSON.parse(savedSpeakResponse);
    }

    const savedAutoOpen = localStorage.getItem('autoOpenEnabled');
    if (savedAutoOpen !== null) {
        autoOpenEnabled = JSON.parse(savedAutoOpen);
    }
}

function saveSettings() {
    localStorage.setItem('speakResponseEnabled', JSON.stringify(speakResponseEnabled));
    localStorage.setItem('autoOpenEnabled', JSON.stringify(autoOpenEnabled));
}

function applySettingsToUI() {
    if (speakResponseToggle) {
        speakResponseToggle.checked = speakResponseEnabled;
    }
    if (autoOpenToggle) {
        autoOpenToggle.checked = autoOpenEnabled;
    }
}

function setupSettingsListeners() {
    if (speakResponseToggle) {
        speakResponseToggle.addEventListener('change', (event) => {
            speakResponseEnabled = event.target.checked;
            saveSettings();
        });
    }
    if (autoOpenToggle) {
        autoOpenToggle.addEventListener('change', (event) => {
            autoOpenEnabled = event.target.checked;
            saveSettings();
        });
    }
}


document.addEventListener('DOMContentLoaded', () => {
    initBubbles();
    initSwipeEvents();
    loadSettings();

    micButtonChat = document.getElementById('mic-toggle-chat');
    stopSpeakingButton = document.getElementById('stop-speaking-button');
    clearChatButton = document.getElementById('clear-chat-button');
    clearChatConfirmModal = document.getElementById('clear-chat-confirm-modal');
    cancelClearChatButton = document.getElementById('cancel-clear-chat');
    confirmClearChatButton = document.getElementById('confirm-clear-chat');
    settingsToggleHome = document.getElementById('settings-toggle-home');
    settingsToggleChat = document.getElementById('settings-toggle-chat');
    settingsModal = document.getElementById('settings-modal');
    speakResponseToggle = document.getElementById('speak-response-toggle');
    autoOpenToggle = document.getElementById('auto-open-toggle');

    if (micButtonChat) {
        micButtonChat.addEventListener('click', toggleMic);
        micButtonChat.classList.add('active'); 
    }

    if (stopSpeakingButton) {
        stopSpeakingButton.addEventListener('click', stopSpeaking);
    }
    if (clearChatButton) {
        clearChatButton.addEventListener('click', () => openModal('clear-chat-confirm-modal'));
    }
    if (cancelClearChatButton) {
        cancelClearChatButton.addEventListener('click', () => closeModal('clear-chat-confirm-modal'));
    }
    if (confirmClearChatButton) {
        confirmClearChatButton.addEventListener('click', clearChatHistory);
    }
    
    if (settingsToggleHome) {
        settingsToggleHome.addEventListener('click', () => openModal('settings-modal'));
    }
    if (settingsToggleChat) {
        settingsToggleChat.addEventListener('click', () => openModal('settings-modal'));
    }

    const closeSettingsModalButton = settingsModal ? settingsModal.querySelector('.close-modal') : null;
    if (closeSettingsModalButton) {
        closeSettingsModalButton.addEventListener('click', () => closeModal('settings-modal'));
    }
    
    applySettingsToUI();
    setupSettingsListeners();

    if (typeof startListening === 'function' && micButtonChat && micButtonChat.classList.contains('active')) { 
        startListening();
    } else {
        console.warn("Speech recognition not started. Either API is not available or mic button is not active.");
    }
    updateMicButtonState();


    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(savedTheme);
        document.querySelectorAll('#theme-toggle, #theme-toggle-chat').forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (savedTheme === 'light') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    const themeToggleChat = document.getElementById('theme-toggle-chat');
    if (themeToggleChat) {
        themeToggleChat.addEventListener('click', toggleTheme);
    }
    document.getElementById('start-chat').addEventListener('click', () => showPage('chat-page'));
    document.getElementById('back-button').addEventListener('click', () => showPage('home-page'));

    document.getElementById('send-button').addEventListener('click', () => sendMessage(false));
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(false);
        }
    });

    document.querySelectorAll('[data-modal]').forEach(element => {
        element.addEventListener('click', () => {
            openModal(element.dataset.modal + '-modal');
        });
    });

    document.querySelectorAll('.close-modal').forEach(element => {
        element.addEventListener('click', () => {
            const modal = element.closest('.modal');
            closeModal(modal.id);
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    if (autoOpenEnabled) {
        console.log("Auto-open is enabled.");
    }
});