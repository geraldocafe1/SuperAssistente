document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const status = document.getElementById('status');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    let selectedVoice = null;

    function loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        selectedVoice = voices.find(voice => voice.lang === 'pt-BR') || voices.find(voice => voice.lang.startsWith('pt-'));
    }
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            status.textContent = 'Ouvindo... 🎤';
            micBtn.classList.add('animate-pulse', 'bg-red-500');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            sendMessage();
        };

        recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            status.textContent = 'Erro ao ouvir. Tente de novo.';
        };

        recognition.onend = () => {
            isListening = false;
            status.textContent = '';
            micBtn.classList.remove('animate-pulse', 'bg-red-500');
        };
    } else {
        micBtn.disabled = true;
        status.textContent = 'Reconhecimento de voz não suportado.';
    }

    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-bubble p-3 rounded-lg mb-2 max-w-xs ${sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-amber-100'}`;
        messageDiv.textContent = message;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (messageText === '') return;

        addMessage(messageText, 'user');
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) {
                throw new Error(`Erro na resposta do servidor: ${response.statusText}`);
            }

            const data = await response.json();
            const reply = data.reply;

            addMessage(reply, 'assistant');
            speak(reply);

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            addMessage('Oops! Não consegui me conectar. Verifique o servidor. 🔌', 'assistant');
        }
    }

    function speak(text) {
        if (!window.speechSynthesis || !text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.lang = 'pt-BR';
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            if (recognition) recognition.start();
        }
    });

    window.onload = () => {
        setTimeout(() => {
            const welcomeText = "Olá! Sou o Assistente Coffe. Como posso te ajudar hoje? Lembrando que o Palmeiras não tem mundial k k kkk";
            addMessage(welcomeText, 'assistant');
            speak(welcomeText);
        }, 500);
    };
});