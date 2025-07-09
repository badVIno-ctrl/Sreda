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

const MISTRAL_API_KEY_PRIMARY = 'iWyckB3Mn6SAp4ojlxK9zKIKfTq4XMXO';
const MISTRAL_API_KEY_SECONDARY = 'vEukHIlqO6YhxQq2UmIhcLPDu3RJalPN';

let recognition;
let isVoiceInputActive = false;
let speechRecognitionInterval;

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
    container.innerHTML = '';
    const bubbleCount = 20;

    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        const size = Math.random() * 150 + 50;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 20 + 10;
        const delay = Math.random() * 10;
        const startTop = Math.random() * 100;

        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.top = `${startTop}%`;
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
        }, 500);
    } else {
        page.classList.add('swipe-down');
        setTimeout(() => {
            page.classList.remove('swipe-down');
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

async function _internalSendMessage(message, isVoiceInputRequest, useSecondaryKey = false) {
    const loadingId = 'loading-' + Date.now();
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML += `
        <div id="${loadingId}" class="chat-message-wrapper assistant">
            <div class="avatar-container">
                <i class="fas fa-robot"></i>
            </div>
            <div class="chat-message assistant p-2 mb-2 loading-dots">
                <div class="flex space-x-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        </div>
    `;

    scrollChatToBottom();

    try {
        let chatHistory = getChatHistoryForAPI();
        if (!chatHistory.length || chatHistory[chatHistory.length - 1].content !== message || chatHistory[chatHistory.length - 1].role !== 'user') {
            chatHistory.push({ role: 'user', content: message });
        }

        const apiKey = useSecondaryKey ? MISTRAL_API_KEY_SECONDARY : MISTRAL_API_KEY_PRIMARY;

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: chatHistory,
                temperature: 0.5
            })
        });

        const data = await response.json();

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
            if (response.status === 429 && !useSecondaryKey) {
                return _internalSendMessage(message, isVoiceInputRequest, true);
            } else {
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
        }
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        addMessageToChat('assistant', 'Произошла ошибка при подключении к серверу. Пожалуйста, попробуйте позже.');
        if (isVoiceInputRequest) {
            speakText('Произошла ошибка при подключении к серверу. Попробуйте позже.');
        }
    }
}

function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1));
            }
        }
    }

    return matrix[b.length][a.length];
}

function processCommand(message) {
    const lowerCaseMessage = message.toLowerCase();
    const words = lowerCaseMessage.split(/\s+/);

    const openKeywords = ['откр', 'открыть', 'открой', 'открывай', 'запуск', 'запусти', 'запустить', 'зайди', 'зайти', 'перейти', 'перейди'];
    const services = {
        'телеграм': 'https://web.telegram.org/',
        'youtube': 'https://www.youtube.com/',
        'google': 'https://www.google.com/',
        'википедия': 'https://ru.wikipedia.org/',
        'яндекс': 'https://yandex.ru/',
        'twitch': 'https://www.twitch.tv/',
        'instagram': 'https://www.instagram.com/',
        'вконтакте': 'https://vk.com/',
        'facebook': 'https://www.facebook.com/',
        'twitter': 'https://twitter.com/',
        'reddit': 'https://www.reddit.com/',
        'github': 'https://github.com/',
        'amazon': 'https://www.amazon.com/',
        'ozon': 'https://www.ozon.ru/',
        'wildberries': 'https://www.wildberries.ru/',
        'netflix': 'https://www.netflix.com/',
        'spotify': 'https://open.spotify.com/',
        'figma': 'https://www.figma.com/',
        'gmail': 'https://mail.google.com/',
        'почта': 'https://mail.google.com/',
        'гугл карты': 'https://www.google.com/maps/'
    };

    const serviceSynonyms = {
        'телеграм': ['телеграм', 'тг'],
        'youtube': ['ютуб', 'youtube'],
        'google': ['гугл', 'google'],
        'википедия': ['википедия', 'вики', 'wikipedia'],
        'яндекс': ['яндекс', 'yandex'],
        'twitch': ['твич', 'twitch'],
        'instagram': ['инстаграм', 'инста', 'instagramm'],
        'вконтакте': ['вк', 'вконтакте', 'vk'],
        'facebook': ['фейсбук', 'facebook'],
        'twitter': ['твиттер', 'twitter'],
        'reddit': ['реддит', 'reddit'],
        'github': ['гитхаб', 'github'],
        'amazon': ['амазон', 'amazon'],
        'ozon': ['озон', 'ozon'],
        'wildberries': ['вайлдберриз', 'вб', 'wildberries'],
        'netflix': ['нетфликс', 'netflix'],
        'spotify': ['спотифай', 'spotify'],
        'figma': ['фигма', 'figma'],
        'gmail': ['gmail', 'джимейл'],
        'почта': ['почта', 'mail'],
        'гугл карты': ['гугл карты', 'карты гугл', 'карты', 'google maps']
    };

    const MAX_LEVENSHTEIN_DISTANCE = 2;

    let foundOpenCommand = false;
    let targetService = null;

    for (const word of words) {
        for (const openKeyword of openKeywords) {
            if (word.includes(openKeyword) || levenshteinDistance(word, openKeyword) <= MAX_LEVENSHTEIN_DISTANCE) {
                foundOpenCommand = true;
                break;
            }
        }
        if (foundOpenCommand) break;
    }

    if (!foundOpenCommand) {
        return false;
    }

    let minDistance = Infinity;
    let closestServiceName = null;

    for (const serviceName in serviceSynonyms) {
        for (const synonym of serviceSynonyms[serviceName]) {
            for (const messageWord of words) {
                const distance = levenshteinDistance(messageWord, synonym);
                if (distance <= MAX_LEVENSHTEIN_DISTANCE && distance < minDistance) {
                    minDistance = distance;
                    closestServiceName = serviceName;
                }
            }
        }
    }

    if (closestServiceName) {
        const url = services[closestServiceName];
        if (url) {
            window.open(url, '_blank');
            addMessageToChat('assistant', `Открываю ${closestServiceName.charAt(0).toUpperCase() + closestServiceName.slice(1)}!`);
            return true;
        }
    }

    return false;
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

    if (processCommand(message)) {
        return;
    }

    if (message) {
        await _internalSendMessage(message, isVoiceInput);
    }
}

function addMessageToChat(role, content) {
    const chatContainer = document.getElementById('chat-container');
    const messageClass = role === 'user' ? 'user' : 'assistant';
    const avatarContent = role === 'user' ? 'Вы' : '<i class="fas fa-robot"></i>';

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `chat-message-wrapper ${messageClass}`;

    messageWrapper.innerHTML = `
        <div class="avatar-container">
            ${avatarContent}
        </div>
        <div class="chat-message ${messageClass} p-2 mb-2">
            ${content}
        </div>
    `;
    
    chatContainer.appendChild(messageWrapper);

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
    }
    catch (e) {
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
        history = [];
        localStorage.removeItem('chatHistory');
    }

    if (history.length === 0) {
        addMessageToChat('assistant', 'Привет! Я Среда, ваш голосовой помощник. Скажите "Среда", чтобы я вас услышала!');
    } else {
        history.forEach(msg => {
            const avatarContent = msg.role === 'user' ? 'Вы' : '<i class="fas fa-robot"></i>';
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `chat-message-wrapper ${msg.role}`;
            messageWrapper.innerHTML = `
                <div class="avatar-container">
                    ${avatarContent}
                </div>
                <div class="chat-message ${msg.role} p-2 mb-2">
                    ${msg.content}
                </div>
            `;
            chatContainer.appendChild(messageWrapper);
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

function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ru-RU';

        recognition.onstart = () => {
            isListening = true;
            isVoiceInputActive = true;
            updateMicButtonState();
            speechRecognitionInterval = setInterval(() => {
                if (!isListening && isVoiceInputActive) {
                    startListening();
                }
            }, 1000);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                handleVoiceInput(finalTranscript.trim());
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            isVoiceInputActive = false;
            updateMicButtonState();
            clearInterval(speechRecognitionInterval);
            if (event.error === 'not-allowed') {
                speakText('Доступ к микрофону не разрешен. Пожалуйста, разрешите доступ к микрофону в настройках браузера.');
            }
        };

        recognition.onend = () => {
            isListening = false;
            updateMicButtonState();
            clearInterval(speechRecognitionInterval);
            if (isVoiceInputActive) {
                startListening();
            }
        };
    } else {
        console.warn('Web Speech API is not supported in this browser.');
    }
}

function startListening() {
    if (recognition) {
        try {
            isVoiceInputActive = true;
            recognition.start();
        } catch (e) {
            if (e.name === 'InvalidStateError') {
                recognition.stop();
                setTimeout(() => {
                    if (isVoiceInputActive) {
                        recognition.start();
                    }
                }, 100);
            }
        }
    }
}

function stopListening() {
    if (recognition) {
        isVoiceInputActive = false;
        recognition.stop();
        clearInterval(speechRecognitionInterval);
    }
}

function toggleMic() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

async function handleVoiceInput(transcript) {
    addMessageToChat('user', transcript);
    await sendMessage(true, transcript);
}

document.addEventListener('DOMContentLoaded', () => {
    initBubbles();
    initSwipeEvents();
    loadSettings();
    initializeSpeechRecognition();

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

    const sredaInfoButton = document.getElementById('sreda-info-button');
    if (sredaInfoButton) {
        sredaInfoButton.addEventListener('click', () => openModal('sreda-info-modal'));
    }

    if (micButtonChat) {
        micButtonChat.addEventListener('click', toggleMic);
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
        settingsToggleHome.addEventListener('click', () => {
            applySettingsToUI();
            openModal('settings-modal');
        });
    }
    if (settingsToggleChat) {
        settingsToggleChat.addEventListener('click', () => {
            applySettingsToUI();
            openModal('settings-modal');
        });
    }

    document.querySelectorAll('.modal .close-modal').forEach(button => {
        button.addEventListener('click', (event) => {
            const modal = event.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    applySettingsToUI();
    setupSettingsListeners();

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

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
});