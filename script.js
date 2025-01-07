// script.js
document.getElementById('sreda-button').addEventListener('click', function() {
    document.querySelector('.grid').style.transform = 'translateY(-100%)';
    document.getElementById('sreda-button').style.display = 'none';
    document.querySelector('.version-container').classList.remove('blurred'); // Убираем размытие
    document.getElementById('page2').classList.remove('blurred'); // Убираем размытие
    setTimeout(() => {
        document.getElementById('page1').style.display = 'none';
        document.getElementById('page2').style.display = 'flex';
        document.getElementById('page2').style.opacity = '1';
        document.querySelector('.background-text').classList.add('visible');
        distributeBadVInoTexts();
    }, 1000); // Ждем 1 секунду, чтобы анимация завершилась
});

document.getElementById('block1').addEventListener('click', function() {
    showModal('<img src="images/android_image.jpg" alt="Среда Android">', `Среда — это голосовой помощник, который может выполнять различные задачи, такие как отправка сообщений, напоминания. Просто скажите 'Среда' и дайте команду, и она это выполнит
Примеры команд:
- Открой приложение
- Напомни мне
- Поставь будильник
- Расскажи о
Как работать с Средой:
- Скажите 'Среда'
- Дайте команду
- Среда выполнит вашу команду`, 'downloads/sreda_android.apk');
});

document.getElementById('block2').addEventListener('click', function() {
    showModal('<img src="images/win_image.jpg" alt="Среда Windows 10">', 'Описание компьютерной версии "Среды".', 'sreda_windows.exe');
});

document.getElementById('block3').addEventListener('click', function() {
    showModal('<img src="images/shellooo.jpg" alt="Среда в очках">', 'Очки со Средой. Вы устанавливаете приложение "Среда" под андроид, подключаете очки по Bluetooth и вот чудо, работает', 'Заказать @BasantroVI');
});

document.getElementById('chat-button').addEventListener('click', function() {
    document.getElementById('chat-modal').style.display = 'block';
});

document.querySelector('.close-button').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('chat-modal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
    if (event.target == document.getElementById('chat-modal')) {
        document.getElementById('chat-modal').style.display = 'none';
    }
});

function showModal(title, description, link) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-title">${title}</div>
        <p>${description}</p>
        <a href="javascript:void(0)" onclick="copyToClipboard('${link}')">${link}</a>
    `;
    document.getElementById('modal').style.display = 'block';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        // Убираем уведомление о копировании текста
    }, function(err) {
        console.error('Ошибка копирования: ', err);
    });
}

function distributeBadVInoTexts() {
    const backgroundText = document.getElementById('background-text');
    const numTexts = 50;
    const minDistance = 50; // Минимальное расстояние между надписями

    for (let i = 0; i < numTexts; i++) {
        const span = document.createElement('span');
        span.textContent = 'badVIno';
        span.style.top = Math.random() * 100 + '%';
        span.style.left = Math.random() * 100 + '%';
        span.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;

        // Проверка расстояния между надписями
        let overlaps = true;
        while (overlaps) {
            overlaps = false;
            const spans = backgroundText.getElementsByTagName('span');
            for (let j = 0; j < spans.length; j++) {
                const rect1 = span.getBoundingClientRect();
                const rect2 = spans[j].getBoundingClientRect();
                const distance = Math.sqrt(Math.pow(rect1.left - rect2.left, 2) + Math.pow(rect1.top - rect2.top, 2));
                if (distance < minDistance) {
                    overlaps = true;
                    span.style.top = Math.random() * 100 + '%';
                    span.style.left = Math.random() * 100 + '%';
                    break;
                }
            }
        }

        backgroundText.appendChild(span);
    }
}

document.getElementById('send-button').addEventListener('click', function() {
    sendMessage();
});

document.getElementById('chat-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

let chatHistory = [];

function sendMessage() {
    const userInput = document.getElementById('chat-input').value;
    if (userInput.trim() === '') return;

    addMessageToChat('user', userInput);
    document.getElementById('chat-input').value = '';

    if (userInput.toLowerCase() === 'сбрось контекст') {
        chatHistory = [];
        addMessageToChat('assistant', 'Контекст сброшен.');
    } else {
        sendMessageToMistral(userInput);
    }
}

function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
            chatHistory.push(`Пользователь: ${message}`, `Среда: ${assistantResponse}`);
        } else {
            console.error('Ошибка ответа сервера:', response.status);
            addMessageToChat('assistant', 'Ошибка ответа сервера. Пожалуйста, попробуйте позже.');
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        addMessageToChat('assistant', 'Ошибка при отправке запроса. Пожалуйста, попробуйте позже.');
    }
}

