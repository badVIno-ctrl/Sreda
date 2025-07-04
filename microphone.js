let speechRecognition;

function initSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        speechRecognition.continuous = true;
        speechRecognition.interimResults = false; 
        speechRecognition.lang = 'ru-RU';

        speechRecognition.onstart = () => {
            isListening = true;
            updateMicButtonState();
            addMessageToChat('assistant', 'Слушаю...'); 
            console.log('Speech recognition started.');
        };

        speechRecognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            const transcript = finalTranscript.trim();
            console.log('Speech recognition result:', transcript);
            
            if (transcript) {
                addMessageToChat('user', transcript); 
                sendMessage(true, transcript);
            } else {
                console.log('No speech detected or empty transcript.');
            }
        };

        speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            updateMicButtonState();

            if (event.error === 'not-allowed') {
                alert('Пожалуйста, разрешите доступ к микрофону для работы голосового управления.');
                return; 
            } else if (event.error === 'network') {
                console.warn('Speech recognition network error. Check internet connection.');
            } else if (event.error === 'no-speech') {
                console.warn('No speech detected for a while. Restarting recognition.');
            } else if (event.error === 'audio-capture') {
                console.error('No microphone found or audio input device issues.');
            }
            
            if (micButtonChat && micButtonChat.classList.contains('active')) {
                console.log('Attempting to restart speech recognition...');
                setTimeout(() => startListening(), 500);
            }
        };

        speechRecognition.onend = () => {
            console.log('Speech recognition ended.');
            isListening = false;
            updateMicButtonState();

            if (micButtonChat && micButtonChat.classList.contains('active')) {
                console.log('Restarting speech recognition...');
                setTimeout(() => startListening(), 100); 
            }
        };

    } else {
        console.error('Speech Recognition API not supported in this browser.');
        alert('Извините, ваш браузер не поддерживает голосовой ввод. Пожалуйста, используйте текстовый ввод.');
        if (typeof micButtonChat !== 'undefined' && micButtonChat) micButtonChat.style.display = 'none';
    }
}

function startListening() {
    if (speechRecognition && !isListening) {
        try {
            speechRecognition.start();
            console.log('Attempting to start speech recognition...');
        } catch (e) {
            console.error('Error starting speech recognition:', e.message);
            if (e.message.includes('already started')) {
                isListening = true;
                updateMicButtonState();
            } else if (e.message.includes('permission')) {
                alert('Пожалуйста, разрешите доступ к микрофону для работы голосового управления.');
                isListening = false;
                updateMicButtonState();
            } else {
                isListening = false;
                updateMicButtonState();
            }
        }
    } else {
        console.log('Speech recognition already listening or not initialized.');
    }
}

function stopListening() {
    if (speechRecognition && isListening) {
        speechRecognition.stop();
        isListening = false; 
        updateMicButtonState();
        console.log('Speech recognition stopped.');
    } else {
        console.log('Speech recognition not active, cannot stop.');
    }
}

function toggleMic() {
    const clickedButton = this; 

    const shouldBeActive = !clickedButton.classList.contains('active');

    clickedButton.classList.toggle('active');

    if (shouldBeActive) {
        startListening();
    } else {
        stopListening();
    }
    updateMicButtonState(); 
}

document.addEventListener('DOMContentLoaded', initSpeechRecognition);