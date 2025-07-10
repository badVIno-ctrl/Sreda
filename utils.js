// Function to calculate Levenshtein distance
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

// Function to process commands like opening websites
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
        'почта': 'https://mail.ru/',
        'гугл карты': 'https://maps.google.com/',
        'авито': 'https://www.avito.ru/',
        'кинопоиск': 'https://www.kinopoisk.ru/',
        'госуслуги': 'https://www.gosuslugi.ru/',
        'сбербанк': 'https://www.sberbank.ru/',
        'тинькофф': 'https://www.tinkoff.ru/',
        'одноклассники': 'https://ok.ru/',
        'zoom': 'https://zoom.us/',
        'skype': 'https://www.skype.com/',
        'discord': 'https://discord.com/',
        'steam': 'https://store.steampowered.com/',
        'epic games': 'https://store.epicgames.com/',
        'pinterest': 'https://www.pinterest.com/',
        'aliexpress': 'https://aliexpress.ru/',
        'booking': 'https://www.booking.com/',
        'airbnb': 'https://www.airbnb.ru/',
        'delivery club': 'https://www.delivery-club.ru/',
        'яндекс еда': 'https://eda.yandex.ru/',
        'deepseek': 'https://www.deepmind.com/research/highlighted-research/deepseek',
        'qwen': 'https://qwen.cloud/',
        'grok': 'https://grok.com/',
        'gemini': 'https://gemini.google.com/',
        'gamma': 'https://gamma.app/'
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
        'почта': ['почта', 'mail', 'мейл ру', 'mail ru'],
        'гугл карты': ['гугл карты', 'карты гугл', 'карты', 'google maps'],
        'авито': ['авито'],
        'кинопоиск': ['кинопоиск'],
        'госуслуги': ['госуслуги'],
        'сбербанк': ['сбербанк', 'сбер'],
        'тинькофф': ['тинькофф'],
        'одноклассники': ['одноклассники', 'ок ру'],
        'zoom': ['зум', 'zoom'],
        'skype': ['скайп', 'skype'],
        'discord': ['дискорд', 'discord'],
        'steam': ['стим', 'steam'],
        'epic games': ['эпик геймс', 'epic games'],
        'pinterest': ['пинтерест', 'pinterest'],
        'aliexpress': ['алиэкспресс', 'алиэкспрес', 'aliexpress'],
        'booking': ['букинг', 'booking'],
        'airbnb': ['эйрбнб', 'airbnb'],
        'delivery club': ['деливери клаб', 'delivery club'],
        'яндекс еда': ['яндекс еда', 'еда яндекс'],
        'deepseek': ['дипсик', 'deepseek'],
        'qwen': ['квен', 'qwen'],
        'grok': ['грок', 'grok'],
        'gemini': ['джемини', 'гемини', 'gemini'],
        'gamma': ['гамма', 'gamma']
    };

    const MAX_LEVENSHTEIN_DISTANCE = 2;

    let foundOpenCommand = false;

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
         
            if (typeof saveChatToHistory === 'function') {
                saveChatToHistory('assistant', `Открываю ${closestServiceName.charAt(0).toUpperCase() + closestServiceName.slice(1)}!`);
            }
            if (typeof loadChatHistory === 'function') {
                loadChatHistory();
            }
            return true;
        }
    }

    return false;
}