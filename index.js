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
let userNameModal;
let userNameInput;
let saveUserNameButton;

let speakResponseEnabled = true;
let autoOpenEnabled = false;

const MISTRAL_API_KEY_PRIMARY = 'iWyckB3Mn6SAp4ojlxK9zKIKfTq4XMXO';
const MISTRAL_API_KEY_SECONDARY = 'vEukHIlqO6YhxQq2UmIhcLPDu3RJalPN';

let recognition;
let isVoiceInputActive = false;
let speechRecognitionInterval;
let currentSpeechSynthesisUtterance = null;

function getUserName() {
    return localStorage.getItem('userName') || '';
}

function setUserName(name) {
    localStorage.setItem('userName', name);
}

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
    if (!container) return;
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
    if (!page) return;

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
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function speakText(text) {
    if (!speakResponseEnabled) {
        return;
    }

    if ('speechSynthesis' in window) {
        if (currentSpeechSynthesisUtterance) {
            window.speechSynthesis.cancel();
        }
        currentSpeechSynthesisUtterance = new SpeechSynthesisUtterance(text);
        currentSpeechSynthesisUtterance.lang = 'ru-RU';

        const voices = speechSynthesis.getVoices();
        const russianVoices = voices.filter(voice => voice.lang.startsWith('ru'));

        const preferredVoice = russianVoices.find(voice => voice.name.includes('Google') && voice.name.includes('Russian')) ||
            russianVoices.find(voice => voice.name.includes('Microsoft') && voice.name.includes('Russian')) ||
            russianVoices[0];

        if (preferredVoice) {
            currentSpeechSynthesisUtterance.voice = preferredVoice;
        }

        currentSpeechSynthesisUtterance.onstart = () => {
            if (stopSpeakingButton) {
                stopSpeakingButton.classList.remove('hidden');
            }
        };

        currentSpeechSynthesisUtterance.onend = () => {
            if (stopSpeakingButton) {
                stopSpeakingButton.classList.add('hidden');
            }
            currentSpeechSynthesisUtterance = null;
        };

        currentSpeechSynthesisUtterance.onerror = (event) => {
            console.error("SpeechSynthesisUtterance.onerror", event);
            if (stopSpeakingButton) {
                stopSpeakingButton.classList.add('hidden');
            }
            currentSpeechSynthesisUtterance = null;
        };

        speechSynthesis.cancel();
        speechSynthesis.speak(currentSpeechSynthesisUtterance);
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
        currentSpeechSynthesisUtterance = null;
    }
}

async function _internalSendMessage(message, isVoiceInputRequest, useSecondaryKey = false) {
    const loadingId = 'loading-' + Date.now();
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;

    const loadingWrapper = document.createElement('div');
    loadingWrapper.id = loadingId;
    loadingWrapper.className = 'chat-message-wrapper assistant';
    loadingWrapper.innerHTML = `
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
    `;
    chatContainer.appendChild(loadingWrapper);
    scrollChatToBottom();

    try {
        let chatHistory = getChatHistoryForAPI();

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
            let assistantResponse = data.choices[0].message.content;

            const userName = getUserName();
            const salutations = [];
            if (userName) {
                salutations.push(`${userName}, `);
            }
            salutations.push('Сэр, ');
            salutations.push('');

            const chosenSalutation = salutations[Math.floor(Math.random() * salutations.length)];
            assistantResponse = chosenSalutation + assistantResponse;

            saveChatToHistory('assistant', assistantResponse);
            addMessageToChat('assistant', assistantResponse, true); // Анимация для нового ответа
            if (isVoiceInputRequest) {
                speakText(assistantResponse);
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
                saveChatToHistory('assistant', errorMessage);
                addMessageToChat('assistant', errorMessage, true); // Анимация для ошибки
                if (isVoiceInputRequest) {
                    speakText(errorMessage);
                }
            }
        }
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        const errorMessage = 'Произошла ошибка при подключении к серверу. Пожалуйста, попробуйте позже.';
        saveChatToHistory('assistant', errorMessage);
        addMessageToChat('assistant', errorMessage, true); // Анимация для ошибки
        if (isVoiceInputRequest) {
            speakText(errorMessage);
        }
    }
}

async function sendMessage(isVoiceInput = false, messageText = '') {
    const input = document.getElementById('message-input');
    const message = messageText || (input ? input.value.trim() : '');

    if (!message) {
        return;
    }

    saveChatToHistory('user', message);
    addMessageToChat('user', message, true); // Анимация для нового сообщения пользователя

    if (input) {
        input.value = '';
    }

    if (typeof processCommand === 'function' && processCommand(message)) {
        return;
    }

    if (message) {
        await _internalSendMessage(message, isVoiceInput);
    }
}

function typeMessage(element, text, useAnimation = true, callback) {
    if (!useAnimation) {
        element.textContent = text;
        if (callback) callback();
        return;
    }

    let index = 0;
    element.classList.add('typing-cursor');
    const interval = setInterval(() => {
        element.textContent = text.slice(0, index);
        index++;
        if (index > text.length) {
            clearInterval(interval);
            element.classList.remove('typing-cursor');
            if (callback) callback();
        }
    }, 70);
}

function addMessageToChat(role, content, useAnimation = true, callback = null) {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `chat-message-wrapper ${role}`;
    messageWrapper.innerHTML = `
        <div class="avatar-container">
            ${role === 'assistant' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>'}
        </div>
        <div class="chat-message ${role} p-2 mb-2"></div>
    `;
    chatContainer.appendChild(messageWrapper);
    const messageElement = messageWrapper.querySelector('.chat-message');

    typeMessage(messageElement, content, useAnimation, () => {
        scrollChatToBottom();
        if (callback) callback();
    });
}

function scrollChatToBottom() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
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
    } catch (e) {
        history = [];
    }
    history.push({ role, content });
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

function loadChatHistory() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    chatContainer.innerHTML = '';

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        if (!Array.isArray(history) || history.some(msg => !msg || msg.content === undefined)) {
            throw new Error("Invalid chat history format.");
        }
    } catch (e) {
        history = [];
        localStorage.removeItem('chatHistory');
    }

    if (history.length === 0) {
        const userName = getUserName();
        const welcomeMessage = `Привет${userName ? ', ' + userName : ''}! Я Среда, ваш голосовой помощник. Скажите "Среда", чтобы я вас услышала!`;
        saveChatToHistory('assistant', welcomeMessage);
        addMessageToChat('assistant', welcomeMessage, true);
    } else {
        history.forEach((msg) => {
            // Старые сообщения из истории показываем без анимации
            addMessageToChat(msg.role, msg.content, false); 
        });
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

        if (diff > 100 && document.getElementById('home-page') && !document.getElementById('home-page').classList.contains('hidden')) {
            showPage('chat-page');
        }

        if (diff < -100 && document.getElementById('chat-page') && !document.getElementById('chat-page').classList.contains('hidden')) {
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

    userNameModal = document.getElementById('user-name-modal');
    userNameInput = document.getElementById('user-name-input');
    saveUserNameButton = document.getElementById('save-user-name');

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

    const themeToggleHome = document.getElementById('theme-toggle');
    if (themeToggleHome) {
        themeToggleHome.addEventListener('click', toggleTheme);
    }
    const themeToggleChat = document.getElementById('theme-toggle-chat');
    if (themeToggleChat) {
        themeToggleChat.addEventListener('click', toggleTheme);
    }

    const startChatButton = document.getElementById('start-chat');
    if (startChatButton) {
        startChatButton.addEventListener('click', () => showPage('chat-page'));
    }
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => showPage('home-page'));
    }

    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');

    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => sendMessage(false));
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage(false);
            }
        });
    }

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

    if (saveUserNameButton) {
        saveUserNameButton.addEventListener('click', () => {
            const name = userNameInput.value.trim();
            if (name) {
                setUserName(name);
                closeModal('user-name-modal');
                loadChatHistory();
            } else {
                alert('Пожалуйста, введите ваше имя.');
            }
        });
    }
});