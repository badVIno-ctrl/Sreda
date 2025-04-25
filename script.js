let currentPage = 1;
let isAnimating = false;
let blocksMovedToChat = false;

document.getElementById('sreda-button').addEventListener('click', function() {
    if (isAnimating) return;
    isAnimating = true;
    document.querySelector('.grid').style.transform = 'translateY(-100%)';
    document.getElementById('page1').style.display = 'none';
    document.getElementById('page2').style.display = 'flex';
    document.getElementById('page2').style.opacity = '1';
    document.getElementById('page2').classList.remove('blurred');
    setTimeout(() => {
        isAnimating = false;
    }, 1000);
});

document.getElementById('block1').addEventListener('click', function() {
    showModal('<img src="images/android_image.jpg" alt="Среда Android">', `Среда — это голосовой помощник, который может выполнять различные задачи, такие как отправка сообщений, напоминания. Просто скажите 'Среда' и дайте команду, и она это выполнит. Примеры команд: - Открой приложение - Напомни мне - Поставь будильник - Расскажи о. Как работать с Средой: - Скажите 'Среда' - Дайте команду - Среда выполнит вашу команду`, 'https://github.com/badVIno-ctrl/androidS/releases/tag/s0.03.03');
});

document.getElementById('block2').addEventListener('click', function() {
    showModal('<img src="images/win_image.jpg" alt="Среда Windows 10">', 'Описание компьютерной версии "Среды".', 'sreda_windows.exe');
});

document.getElementById('block3').addEventListener('click', function() {
    showModal('<img src="images/shellooo.jpg" alt="Среда в очках">', 'Очки со Средой. Вы устанавливаете приложение "Среда" под андроид, подключаете очки по Bluetooth и вот чудо, работает. Заказать @BasantroVI', 'Заказать @BasantroVI');
});

document.getElementById('send-button').addEventListener('click', function() {
    sendMessage();
    moveBlocksToChat();
});

document.getElementById('chat-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
        moveBlocksToChat();
    }
});

let chatHistory = [];

function sendMessage() {
    const userInput = document.getElementById('chat-input').value;
    if (userInput.trim() === '') return;

    if (userInput.toLowerCase().includes('сайты 2604')) {
        addMessageToChat('assistant', "amashumi amabili nesithupha oh izinkulungwane ezine amashumi ayisishiyagalombili nesithupha");
        return;
    }

    if (userInput.toLowerCase().includes('приложения 2604')) {
        addMessageToChat('assistant', "amashumi amabili nesithupha oh izinkulungwane ezine amashumi ayisishiyagalombili nesithupha Armenian ake sihambe ake sihambe amashumi ayisishiyagalolunye nesishiyagalolunye");
        return;
    }

    if (userInput.toLowerCase().includes('презентация')) {
        const link = 'https://gamma.app/docs/-v9gy89ndkb5fzcc';
        addMessageToChat('assistant', `Вот ссылка на презентацию: <a href="${link}" target="_blank">${link}</a>`);
        return;
    }

    addMessageToChat('user', userInput);
    document.getElementById('chat-input').value = '';

    if (userInput.toLowerCase() === 'сбрось контекст') {
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        addMessageToChat('assistant', 'Контекст сброшен.');
    } else {
        sendMessageToMistral(userInput);
    }
}

function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.innerHTML = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.push({ sender, message });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

async function sendMessageToMistral(message) {
    const apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    const apiKey = 'DlWJGSjUANbZ5tRjXI3nHhA8AC6S44OX';

    const context = chatHistory.slice(-2).join('\n') + '\n' + message;

    const requestBody = {
        model: 'mistral-large-latest',
        messages: [
            {
                role: 'user',
                content: context
            }
        ]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            const assistantResponse = data.choices[0].message.content;
            addMessageToChat('assistant', assistantResponse);
            chatHistory.push({ sender: 'user', message }, { sender: 'assistant', message: assistantResponse });
        } else {
            console.error('Ошибка ответа сервера:', response.status);
            addMessageToChat('assistant', 'Ошибка ответа сервера. Пожалуйста, попробуйте позже.');
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        addMessageToChat('assistant', 'Ошибка при отправке запроса. Пожалуйста, попробуйте позже.');
    }
}

function moveBlocksToChat() {
    const blockContainer = document.querySelector('.block-container');
    const chatBlockContainer = document.getElementById('chat-block-container');
    blockContainer.classList.add('hidden');
    chatBlockContainer.style.display = 'block';
    blocksMovedToChat = true;

    const blocks = chatBlockContainer.getElementsByClassName('block');
    for (let i = 0; i < blocks.length; i++) {
        blocks[i].addEventListener('click', function() {
            if (this.id === 'block1') {
                showModal('<img src="images/android_image.jpg" alt="Среда Android">', `Среда — это голосовой помощник, который может выполнять различные задачи, такие как отправка сообщений, напоминания. Просто скажите 'Среда' и дайте команду, и она это выполнит. Примеры команд: - Открой приложение - Напомни мне - Поставь будильник - Расскажи о. Как работать с Средой: - Скажите 'Среда' - Дайте команду - Среда выполнит вашу команду`, 'downloads/sreda_android.apk');
            } else if (this.id === 'block2') {
                showModal('<img src="images/win_image.jpg" alt="Среда Windows 10">', 'Описание компьютерной версии "Среды".', 'sreda_windows.exe');
            } else if (this.id === 'block3') {
                showModal('<img src="images/shellooo.jpg" alt="Среда в очках">', 'Очки со Средой. Вы устанавливаете приложение "Среда" под андроид, подключаете очки по Bluetooth и вот чудо, работает. Заказать @BasantroVI', 'Заказать @BasantroVI');
            }
        });
    }
}

function toggleBlocksInChat() {
    const blockContainer = document.querySelector('.block-container');
    const chatBlockContainer = document.getElementById('chat-block-container');

    if (blocksMovedToChat) {
        chatBlockContainer.style.display = chatBlockContainer.style.display === 'block' ? 'none' : 'block';
    } else {
        blockContainer.classList.toggle('hidden');
    }
}

document.body.addEventListener('touchstart', function(event) {
    touchStartY = event.changedTouches[0].screenY;
}, false);

document.body.addEventListener('touchend', function(event) {
    touchEndY = event.changedTouches[0].screenY;
    handleGesture();
}, false);

function handleGesture() {
    if (touchStartY - touchEndY > 100 && currentPage < 2) {
        currentPage++;
        navigateToPage(currentPage);
    }
    if (touchStartY - touchEndY < -100 && currentPage > 1) {
        currentPage--;
        navigateToPage(currentPage);
    }
}

function navigateToPage(page) {
    if (isAnimating) return;
    isAnimating = true;
    if (page === 1) {
        document.querySelector('.grid').style.transform = 'translateY(0)';
        document.getElementById('page1').style.display = 'flex';
        document.getElementById('page2').style.display = 'none';
        document.getElementById('page2').classList.add('blurred');
        setTimeout(() => {
            isAnimating = false;
        }, 1000);
    } else if (page === 2) {
        document.querySelector('.grid').style.transform = 'translateY(-100%)';
        document.getElementById('page1').style.display = 'none';
        document.getElementById('page2').style.display = 'flex';
        document.getElementById('page2').classList.remove('blurred');
        setTimeout(() => {
            isAnimating = false;
        }, 1000);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
    }, function(err) {
        console.error('Ошибка копирования: ', err);
    });
}

function showModal(title, description, link) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-title">${title}</div>
        <p>${description}</p>
        <a href="javascript:void(0)" onclick="copyToClipboard('${link}')">${link}</a>
    `;
    modalContent.innerHTML = `
    <div class="modal-title">${title}</div>
        <p>${description}</p>
        <a href="${link}" target="_blank">Скачать</a>
    `;
    document.getElementById('modal').style.display = 'block';
}

document.querySelector('.close-button').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.forEach(({ sender, message }) => {
        addMessageToChat(sender, message);
    });

    document.getElementById('block2').classList.add('strikethrough');
});

document.querySelector('.block-toggle').addEventListener('click', function() {
    toggleBlocksInChat();
});

document.getElementById('dark-mode-button').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
});
