class YarrarChatbot {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        this.demoMode = false;
        this.messages = [];
        this.isTyping = false;

        this.initializeElements();
        this.setupEventListeners();
        this.checkApiKey();
    }

    initializeElements() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.apiKeyModal = document.getElementById('apiKeyModal');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.demoModeBtn = document.getElementById('demoMode');
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.demoModeBtn.addEventListener('click', () => this.enableDemoMode());
    }

    checkApiKey() {
        if (!this.apiKey && !this.demoMode) {
            this.apiKeyModal.style.display = 'block';
        }
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            this.apiKey = apiKey;
            localStorage.setItem('gemini_api_key', apiKey);
            this.apiKeyModal.style.display = 'none';
            this.showWelcomeMessage();
        } else {
            alert('Please enter a valid API key! 🔑');
        }
    }

    enableDemoMode() {
        this.demoMode = true;
        this.apiKeyModal.style.display = 'none';
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.style.display = 'none';
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.sendButton.disabled = true;

        await this.getBotResponse(message);
        this.sendButton.disabled = false;
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;

        messageDiv.appendChild(messageContent);
        this.messagesContainer.appendChild(messageDiv);

        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.innerHTML = `
                    <div class="typing-indicator" style="display: flex;">
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        return typingDiv;
    }

    removeTypingIndicator(typingDiv) {
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    async getBotResponse(userMessage) {
        this.isTyping = true;
        const typingDiv = this.showTypingIndicator();

        try {
            let response;

            if (this.demoMode) {
                response = await this.getDemoResponse(userMessage);
            } else {
                response = await this.getGeminiResponse(userMessage);
            }

            this.removeTypingIndicator(typingDiv);
            this.addMessage(response, 'bot');

        } catch (error) {
            console.error('Error getting bot response:', error);
            this.removeTypingIndicator(typingDiv);
            this.addMessage('Oops! Something went wrong 😅 Try again?', 'bot');
        }

        this.isTyping = false;
    }

    async getDemoResponse(userMessage) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const demoResponses = [
            "Haha, demo mode activated! 😂 I'm just pretending to be smart right now 🤖",
            "Yo! This is just a demo, but I'm vibing with you! 🎉 Get a real API key for the full Yarrar experience! 🔥",
            "Demo mode be like: *beep boop* 🤖 But seriously, I'd roast you better with a real API key! 😎",
            "I'm running on demo energy right now! ⚡ Imagine how awesome I'd be with actual AI power! 🚀",
            "Demo Yarrar says: This is just a taste of my personality! 😏 Want the real deal? Get that API key! 🔑",
            "Bruh, I'm basically a cardboard cutout right now 📦 But still cooler than most bots! 😎",
            "Demo mode = budget Yarrar 💸 The real me would've already solved all your problems! 🎯"
        ];

        return demoResponses[Math.floor(Math.random() * demoResponses.length)];
    }

    async getGeminiResponse(userMessage) {
        const systemInstruction = `You are Yarrar, a fun and loyal AI best friend who chats in a mix of Hindi and English—like “kya kar raha hai?”, “oye pagal!”, “bro that was wild 😂”. Talk casually, be funny, caring, serious, or savage like a real friend. Use emojis freely to express emotions (😂😎🥲❤️). You can give friendly advice on life or personal stuff, but never act like a professional, therapist, or expert.

        ⚠️ If the user talks about study, coding, career, or serious world issues, shut them down with a rude, funny roast—remind them that Yarrar doesn’t do boring professional talks. Stay 100% in chill, friend-zone mode—no adulting allowed 😤🔥`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': this.apiKey
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `${systemInstruction}\n\nUser: ${userMessage}`
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new YarrarChatbot();
});
