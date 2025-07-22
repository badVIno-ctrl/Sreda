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
let userCityInput;
let saveUserNameButton;

let speakResponseEnabled = true;
let autoOpenEnabled = false;

let recognition;
let isVoiceInputActive = false;
let speechRecognitionInterval;
let currentSpeechSynthesisUtterance = null;
let recognitionTimeout;

function getUserName() {
    return localStorage.getItem('userName') || '';
}

function getUserCity() {
    return localStorage.getItem('userCity') || '';
}

function setUserName(name) {
    localStorage.setItem('userName', name);
}

function setUserCity(city) {
    localStorage.setItem('userCity', city);
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
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.classList.add('speaking');
            }
        };

        currentSpeechSynthesisUtterance.onend = () => {
            if (stopSpeakingButton) {
                stopSpeakingButton.classList.add('hidden');
            }
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.classList.remove('speaking');
            }
            currentSpeechSynthesisUtterance = null;
        };

        currentSpeechSynthesisUtterance.onerror = (event) => {
            console.error("SpeechSynthesisUtterance.onerror", event);
            if (stopSpeakingButton) {
                stopSpeakingButton.classList.add('hidden');
            }
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.classList.remove('speaking');
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
        const chatInput = document.querySelector('.chat-input');
        if (chatInput) {
            chatInput.classList.remove('speaking');
        }
        currentSpeechSynthesisUtterance = null;
    }
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
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isVoiceInputActive = true;
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.classList.remove('listening');
                chatInput.classList.add('recording');
            }
        };

        recognition.onend = () => {
            isVoiceInputActive = false;
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.classList.remove('recording');
                if (isListening) {
                    chatInput.classList.add('listening');
                }
            }
            clearTimeout(recognitionTimeout);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim().toLowerCase();
            if (transcript.includes('среда')) {
                const chatInput = document.querySelector('.chat-input');
                if (chatInput) {
                    chatInput.classList.add('listening');
                }
            }
            if (transcript && micButtonChat) {
                sendMessage(true, transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isVoiceInputActive = false;
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.classList.remove('recording', 'listening');
            }
            clearTimeout(recognitionTimeout);
        };
    } else {
        console.warn('Speech Recognition API not supported in this browser.');
    }
}

function startListening() {
    if (recognition && !isVoiceInputActive) {
        recognition.start();
        recognitionTimeout = setTimeout(() => {
            if (isVoiceInputActive) {
                recognition.stop();
            }
        }, 10000); // 10 seconds timeout
    }
}

function stopListening() {
    if (recognition && isVoiceInputActive) {
        recognition.stop();
    }
}

function toggleMic() {
    if (isListening) {
        stopListening();
        isListening = false;
    } else {
        startListening();
        isListening = true;
    }
    updateMicButtonState();
}

document.addEventListener('DOMContentLoaded', () => {
    initBubbles();
    initSwipeEvents();
    loadSettings();
    initializeSpeechRecognition();
    startListening();

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
    userCityInput = document.getElementById('user-city-input');
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
            const city = userCityInput.value.trim();
            if (name && city) {
                setUserName(name);
                setUserCity(city);
                closeModal('user-name-modal');
                loadChatHistory();
            } else {
                alert('Пожалуйста, введите ваше имя и город.');
            }
        });
    }
});