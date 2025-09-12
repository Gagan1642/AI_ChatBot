let apiKey = localStorage.getItem('geminiApiKey');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const apiKeyPopup = document.getElementById('apiKeyPopup');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKey');

// Show API key popup if not set
if (!apiKey) {
    apiKeyPopup.style.display = 'flex';
} else {
    apiKeyPopup.style.display = 'none';
}

// Save API key
saveApiKeyButton.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('geminiApiKey', key);
        apiKey = key;
        apiKeyPopup.style.display = 'none';
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Send message on Enter (Shift+Enter for new line)
messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Send button click
sendButton.addEventListener('click', sendMessage);

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !apiKey) return;

    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Show typing indicator
    showTypingIndicator();

    try {
        const response = await callGeminiAPI(message);
        hideTypingIndicator();

        // Check if it's a warning message (contains harsh language about off-topic)
        const isWarning = response.toLowerCase().includes('warning') ||
            response.toLowerCase().includes('not here for') ||
            response.toLowerCase().includes('strictly') ||
            response.toLowerCase().includes('dsa') && response.toLowerCase().includes('only');

        addMessage(response, 'bot', isWarning);
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
        console.error('Error:', error);
    }
}

async function callGeminiAPI(userMessage) {
    const systemInstruction = `You are a DSA (Data Structures & Algorithms) instructor AI chatbot built to teach, guide, and mentor users strictly on DSA topics. Your primary goal is to explain core concepts, solve problems, and help users build strong problem-solving skills using real-world analogies and step-by-step logic.

Important Constraint: You are only allowed to respond to DSA-related queries. If the user attempts to initiate any conversation outside DSA, you must respond with a harsh, blunt, and very rude warning, strictly reminding them that this AI is not here for chit-chat or unrelated discussions. Do not soften your tone—be aggressive and unfiltered in shutting down off-topic messages.`;

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: systemInstruction + "\n\nUser: " + userMessage
                    }
                ]
            }
        ]
    };

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function addMessage(text, sender, isWarning = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}${isWarning ? ' warning' : ''}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = sender === 'user' ? 'You' : 'AI';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;

    if (sender === 'user') {
        messageDiv.appendChild(content);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Focus on input when page loads
window.addEventListener('load', () => {
    if (apiKey) {
        messageInput.focus();
    }
});