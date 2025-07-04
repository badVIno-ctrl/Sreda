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
        let processedMessage = userMessage.toLowerCase();
        
        if (!userMessage) {
            return;
        }

        let isCommand = false;
        let siteToOpen = '';

        const среда_keyword = 'среда';
        const открой_keyword = 'открой';

        if (isVoiceInput && processedMessage.startsWith(среда_keyword)) {
            processedMessage = processedMessage.substring(среда_keyword.length).trim();
        }
        
        if (processedMessage.startsWith(открой_keyword)) {
            const parts = processedMessage.split(открой_keyword);
            if (parts.length > 1) {
                siteToOpen = parts[1].trim();
                isCommand = true;
            }
        }

        if (isCommand && siteToOpen) {
            if (!isVoiceInput) {
                addMessageToChat('user', userMessage); 
            }
            input.value = '';

            let opened = false;
            
            if (siteToOpen === 'телеграм' || siteToOpen === 'тг') {
                addMessageToChat('assistant', 'Открываю Telegram...');
                openWebResource('tg://resolve?domain=telegram', true);
                opened = true;
            } else if (siteToOpen === 'ютуб' || siteToOpen === 'youtube') {
                addMessageToChat('assistant', 'Открываю YouTube...');
                openWebResource('https://www.youtube.com/', false);
                opened = true;
            } else if (siteToOpen === 'гугл' || siteToOpen === 'google') {
                addMessageToChat('assistant', 'Открываю Google...');
                openWebResource('https://www.google.com/', false);
                opened = true;
            } else if (siteToOpen === 'википедия' || siteToOpen === 'wikipedia') {
                addMessageToChat('assistant', 'Открываю Википедию...');
                openWebResource('https://ru.wikipedia.org/', false);
                opened = true;
            } else if (siteToOpen === 'яндекс' || siteToOpen === 'yandex') {
                addMessageToChat('assistant', 'Открываю Яндекс...');
                openWebResource('https://yandex.ru/', false);
                opened = true;
            } else if (siteToOpen === 'твич' || siteToOpen === 'twitch') {
                addMessageToChat('assistant', 'Открываю Twitch...');
                openWebResource('https://www.twitch.tv/', false);
                opened = true;
            } else if (siteToOpen === 'инстаграм' || siteToOpen === 'instagram') {
                addMessageToChat('assistant', 'Открываю Instagram...');
                openWebResource('https://www.instagram.com/', false);
                opened = true;
            } else if (siteToOpen === 'вк' || siteToOpen === 'vk' || siteToOpen === 'вконтакте') {
                addMessageToChat('assistant', 'Открываю ВКонтакте...');
                openWebResource('https://vk.com/', false);
                opened = true;
            } else if (siteToOpen === 'фейсбук' || siteToOpen === 'facebook') {
                addMessageToChat('assistant', 'Открываю Facebook...');
                openWebResource('https://www.facebook.com/', false);
                opened = true;
            } else if (siteToOpen === 'твиттер' || siteToOpen === 'twitter' || siteToOpen === 'x') {
                addMessageToChat('assistant', 'Открываю X (Twitter)...');
                openWebResource('https://twitter.com/', false);
                opened = true;
            } else if (siteToOpen === 'реддит' || siteToOpen === 'reddit') {
                addMessageToChat('assistant', 'Открываю Reddit...');
                openWebResource('https://www.reddit.com/', false);
                opened = true;
            } else if (siteToOpen === 'гитхаб' || siteToOpen === 'github') {
                addMessageToChat('assistant', 'Открываю GitHub...');
                openWebResource('https://github.com/', false);
                opened = true;
            } else if (siteToOpen === 'амазон' || siteToOpen === 'amazon') {
                addMessageToChat('assistant', 'Открываю Amazon...');
                openWebResource('https://www.amazon.com/', false);
                opened = true;
            } else if (siteToOpen === 'озон' || siteToOpen === 'ozon') {
                addMessageToChat('assistant', 'Открываю Ozon...');
                openWebResource('https://www.ozon.ru/', false);
                opened = true;
            } else if (siteToOpen === 'вайлдберриз' || siteToOpen === 'wildberries' || siteToOpen === 'wb') {
                addMessageToChat('assistant', 'Открываю Wildberries...');
                openWebResource('https://www.wildberries.ru/', false);
                opened = true;
            } else if (siteToOpen === 'нетфликс' || siteToOpen === 'netflix') {
                addMessageToChat('assistant', 'Открываю Netflix...');
                openWebResource('https://www.netflix.com/', false);
                opened = true;
            } else if (siteToOpen === 'спотифай' || siteToOpen === 'spotify') {
                addMessageToChat('assistant', 'Открываю Spotify...');
                openWebResource('https://open.spotify.com/', false);
                opened = true;
            } else if (siteToOpen === 'фигма' || siteToOpen === 'figma') {
                addMessageToChat('assistant', 'Открываю Figma...');
                openWebResource('https://www.figma.com/', false);
                opened = true;
            } else if (siteToOpen === 'почту' || siteToOpen === 'gmail') {
                addMessageToChat('assistant', 'Открываю Gmail...');
                openWebResource('https://mail.google.com/', false);
                opened = true;
            } else if (siteToOpen === 'карты' || siteToOpen === 'google карты' || siteToOpen === 'карты гугл') {
                addMessageToChat('assistant', 'Открываю Google Карты...');
                openWebResource('https://www.google.com/maps', false);
                opened = true;
            } else {
                addMessageToChat('assistant', `Извините, я не знаю, как открыть "${siteToOpen}".`);
                opened = true;
            }

            if (opened) {
                return;
            }
        }

        if (typeof originalSendMessage === 'function') {
            return originalSendMessage.call(this, isVoiceInput, userMessage); 
        } else {
            addMessageToChat('assistant', 'Произошла внутренняя ошибка. Пожалуйста, попробуйте позже.');
        }
    };
} else {
    console.error("Error: sendMessage function not found before open_sites.js script. This may cause issues.");
}