function openWebResource(url, preferApp = false) {
    if (preferApp && url.startsWith('tg://')) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        try {
            iframe.contentWindow.location.href = url;
        } catch (e) {
            console.warn('Failed to open tg:// URL via iframe, likely due to security restrictions.', e);
        } finally {
            document.body.removeChild(iframe);
        }

        if (url.includes('tg://')) {
            // Fallback to web version if app fails or isn't installed
            setTimeout(() => {
                window.open('https://web.telegram.org/', '_blank');
            }, 500);
            return;
        }
    }

    window.open(url, '_blank');
}

if (typeof sendMessage === 'function') {
    const originalSendMessage = sendMessage;

    sendMessage = async function(isVoiceInput = false, messageFromVoice = '') {
        const input = document.getElementById('message-input');
        const userMessage = messageFromVoice || input.value.trim();

        if (!userMessage) {
            return;
        }

        let processedMessage = userMessage.toLowerCase();
        let commandFound = false;

        // For voice input, require the keyword "среда"
        if (isVoiceInput) {
            const среда_keyword = 'среда';
            if (processedMessage.startsWith(среда_keyword)) {
                processedMessage = processedMessage.substring(среда_keyword.length).trim();
            } else {
                // If "среда" is not present in voice command, treat as regular message
                if (!isVoiceInput) { // Only add to chat if it's not a voice input that failed command check
                    addMessageToChat('user', userMessage);
                    input.value = '';
                }
                return originalSendMessage.call(this, isVoiceInput, userMessage);
            }
        }

        // List of commands to check
        const commands = {
            'открой телеграм': ['телеграм', 'тг'],
            'открой youtube': ['ютуб', 'youtube'],
            'открой google': ['гугл', 'google'],
            'открой wikipedia': ['википедия', 'wikipedia'],
            'открой yandex': ['яндекс', 'yandex'],
            'открой twitch': ['твич', 'twitch'],
            'открой instagram': ['инстаграм', 'instagram'],
            'открой vkontakte': ['вк', 'vk', 'вконтакте'],
            'открой facebook': ['фейсбук', 'facebook'],
            'открой twitter': ['твиттер', 'twitter', 'x'],
            'открой reddit': ['реддит', 'reddit'],
            'открой github': ['гитхаб', 'github'],
            'открой amazon': ['амазон', 'amazon'],
            'открой ozon': ['озон', 'ozon'],
            'открой wildberries': ['вайлдберриз', 'wildberries', 'wb'],
            'открой netflix': ['нетфликс', 'netflix'],
            'открой spotify': ['спотифай', 'spotify'],
            'открой figma': ['фигма', 'figma'],
            'открой gmail': ['почту', 'gmail'],
            'открой google maps': ['карты', 'google карты', 'карты гугл']
        };

        const siteUrls = {
            'телеграм': 'tg://resolve?domain=telegram',
            'youtube': 'https://www.youtube.com/',
            'google': 'https://www.google.com/',
            'wikipedia': 'https://ru.wikipedia.org/',
            'yandex': 'https://yandex.ru/',
            'twitch': 'https://www.twitch.tv/',
            'instagram': 'https://www.instagram.com/',
            'vkontakte': 'https://vk.com/',
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
            'google maps': 'https://www.google.com/maps'
        };


        for (const fullCommand in commands) {
            const keywords = commands[fullCommand];
            for (const keyword of keywords) {
                // Use a more robust check for "открой [keyword]" to avoid partial matches
                const openKeyword = 'открой';
                const regex = new RegExp(`(?:^|\\b)${openKeyword}\\s+${keyword}(?:\\b|$)`, 'i'); // Case-insensitive, whole word
                
                if (regex.test(processedMessage)) {
                    if (!isVoiceInput) {
                        addMessageToChat('user', userMessage);
                    }
                    input.value = '';
                    addMessageToChat('assistant', `Открываю ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}...`);
                    openWebResource(siteUrls[fullCommand.replace('открой ', '')], keyword === 'телеграм' || keyword === 'тг');
                    commandFound = true;
                    break;
                }
            }
            if (commandFound) break;
        }

        if (!commandFound) {
            if (!isVoiceInput) {
                addMessageToChat('user', userMessage);
            }
            input.value = '';
            // If no command is found, send the original message to Mistral
            return originalSendMessage.call(this, isVoiceInput, userMessage);
        }
    };
} else {
    console.error("Error: sendMessage function not found before open_sites.js script. This may cause issues.");
}