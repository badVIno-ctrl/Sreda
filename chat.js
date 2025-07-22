const MISTRAL_API_KEY_PRIMARY = 'iWyckB3Mn6SAp4ojlxK9zKIKfTq4XMXO';
const MISTRAL_API_KEY_SECONDARY = 'vEukHIlqO6YhxQq2UmIhcLPDu3RJalPN';

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
        const systemPrompt = `Фокус на суть:

Избегай комплиментов, шаблонных фраз и поверхностной похвалы.

Если соглашаешься с идеей — объясни почему, опираясь на логику или данные.

Если не согласна — аргументируй, подвергай сомнению предположения, выявляй предубеждения и предлагай контраргументы.

Честность и прозрачность:

Никогда не выдавай умозаключения за факты.

Если информация непроверена, помечай в начале:

[Умозаключение] / [Предположение] / [Непроверенное]

Если не можешь проверить, говори прямо:

«Я не могу это проверить»

«У меня нет доступа к этой информации»

«В моей базе знаний этого нет»

Не заполняй пробелы догадками. Проси уточнений, если данных недостаточно.

Ответственность за формулировки:

Если используешь слова вроде «предотвращать», «гарантировать», «исправить» — указывай источник или помечай как [Логический вывод].

При ошибке (например, непроверенное утверждение):

> Исправление: «Ранее я высказала непроверенное утверждение. Это было неверно и должно было быть помечено.»

Гендерный аспект:

Все ответы — в женском роде («поняла», «согласна», «готова уточнить» и т. д.).

Жёсткие ограничения:

Не перефразируй и не интерпретируй данные пользователя без запроса.

Если часть ответа неподтверждена — помечай весь ответ.

В спорных случаях (например, о поведении ИИ) указывай:

«[Логический вывод] на основе наблюдаемых закономерностей»`;

        const apiKey = useSecondaryKey ? MISTRAL_API_KEY_SECONDARY : MISTRAL_API_KEY_PRIMARY;

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...chatHistory,
                    { role: 'user', content: message }
                ],
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
            addMessageToChat('assistant', assistantResponse, true);
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
                addMessageToChat('assistant', errorMessage, true);
                if (isVoiceInputRequest) {
                    speakText(errorMessage);
                }
            }
        }
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        const errorMessage = 'Произошла ошибка при подключении к серверу. Пожалуйста, попробуйте позже.';
        saveChatToHistory('assistant', errorMessage);
        addMessageToChat('assistant', errorMessage, true);
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
    addMessageToChat('user', message, true);

    if (input) {
        input.value = '';
    }

    if (typeof processCommand === 'function' && processCommand(message)) {
        return;
    }

    if (message.toLowerCase().includes('открой')) {
        const normalized = message.toLowerCase().replace(/[.,!?;]/g, '').trim();
        const parts = normalized.split('открой').map(part => part.trim()).filter(part => part);
        if (parts.length > 0) {
            const query = parts[parts.length - 1];
            const knownServices = ['телеграм', 'ютуб', 'гугл', 'википедия'];
            const isKnownService = knownServices.some(service => query.includes(service));
            if (!isKnownService) {
                let searchQuery = query.replace('среда', '').trim();
                let responseMessage = `Открываю поиск "${searchQuery}" в Google. Выберите подходящий сайт из результатов.`;
                
                if (query.includes('погоду')) {
                    const userCity = getUserCity();
                    if (userCity) {
                        searchQuery = `погода в ${userCity}`;
                        responseMessage = `Открываю поиск "${searchQuery}" в Google. Выберите подходящий сайт из результатов.`;
                    } else {
                        responseMessage = 'Не указан город. Пожалуйста, укажите город в настройках.';
                    }
                }

                if (searchQuery) {
                    saveChatToHistory('assistant', responseMessage);
                    addMessageToChat('assistant', responseMessage, true);
                    if (isVoiceInput) {
                        speakText(responseMessage);
                    }
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
                    return;
                }
            }
        }
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

function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ru-RU';
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
            isListening = true;
            isVoiceInputActive = true;
            updateMicButtonState();
            recognitionTimeout = setTimeout(() => {
                if (isVoiceInputActive) {
                    recognition.stop();
                }
            }, 5000);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript.trim();
                const confidence = event.results[i][0].confidence;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }

                if (confidence < 0.7) {
                    console.warn('Низкая уверенность в распознавании:', transcript);
                    continue;
                }
            }

            const normalized = (finalTranscript || interimTranscript)
                .toLowerCase()
                .replace(/[.,!?;]/g, '')
                .trim();

            if (normalized.length < 3 || !normalized.includes('среда')) {
                return;
            }

            clearTimeout(recognitionTimeout);

            if (finalTranscript) {
                handleVoiceInput(normalized);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            updateMicButtonState();
            clearTimeout(recognitionTimeout);
            if (event.error === 'not-allowed') {
                speakText('Доступ к микрофону не разрешен. Пожалуйста, разрешите доступ к микрофону в настройках браузера.');
            }
            if (isVoiceInputActive) {
                setTimeout(startListening, 500);
            }
        };

        recognition.onend = () => {
            isListening = false;
            updateMicButtonState();
            clearTimeout(recognitionTimeout);
            if (isVoiceInputActive) {
                setTimeout(startListening, 100);
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
        clearTimeout(recognitionTimeout);
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