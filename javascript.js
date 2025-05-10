// Ollama Configuration
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'llama3';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggle-sidebar');
const themeBtn = document.getElementById('theme-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const gettingStartedBtn = document.getElementById('getting-started-btn');
const techSupportBtn = document.getElementById('tech-support-btn');

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    checkOllamaConnection();
    setTimeout(showWelcomeMessage, 800);
});

// Check Ollama connection on startup
async function checkOllamaConnection() {
    try {
        const response = await fetch(OLLAMA_API_URL.replace('/generate', ''));
        if (!response.ok) {
            showConnectionError();
        }
    } catch (error) {
        showConnectionError();
    }
}

function showConnectionError() {
    addMessage('ai',
        '⚠️ Ollama Connection Issue\n\n' +
        'Please ensure:\n' +
        '1. Ollama is installed (https://ollama.com)\n' +
        '2. Service is running (run `ollama serve`)\n' +
        '3. Llama 3 is installed (run `ollama pull llama3`)\n\n' +
        'You can still type messages, but they will fail until Ollama is running.'
    );
}

function showWelcomeMessage() {
    addMessage(
        'ai',
        `🌟 <strong>Welcome to Amazing Chat with Llama 3!</strong> 🌟<br><br>` +
        `This chat is powered by Ollama's Llama 3 model.<br><br>` +
        `<strong>You can:</strong><br>` +
        `- Ask any question<br>` +
        `- Get creative ideas<br>` +
        `- Have meaningful conversations<br><br>` +
        `What would you like to explore today?`
    );
}

// Message handling
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.innerHTML = text; // Note: In production, sanitize this
    messageDiv.appendChild(messageContent);
    
    const messageFooter = document.createElement('div');
    messageFooter.classList.add('message-footer');
    
    const timeSpan = document.createElement('span');
    timeSpan.classList.add('message-time');
    const now = new Date();
    timeSpan.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageFooter.appendChild(timeSpan);
    
    if (sender === 'user') {
        const statusIcon = document.createElement('span');
        statusIcon.innerHTML = ' <i class="fas fa-check-double" style="opacity: 0.7; font-size: 0.7rem;"></i>';
        messageFooter.appendChild(statusIcon);
    } else {
        const reactions = document.createElement('div');
        reactions.classList.add('message-reactions');
        reactions.innerHTML = `
            <button class="reaction-btn">👍</button>
            <button class="reaction-btn">❤️</button>
            <button class="reaction-btn">😮</button>
        `;
        messageFooter.appendChild(reactions);
    }
    
    messageDiv.appendChild(messageFooter);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Typing indicators
function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <span class="typing-text">Llama 3 is typing...</span>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Ollama API interaction
async function getOllamaResponse(prompt) {
    showTyping();
    sendButton.classList.add('loading');
    userInput.disabled = true;

    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: prompt,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';
        
        // Create empty AI message container
        addMessage('ai', '');
        const messageDiv = chatMessages.lastChild.querySelector('.message-content');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        aiResponse += data.response;
                        messageDiv.innerHTML = formatResponse(aiResponse);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                } catch (e) {
                    console.error('Error parsing chunk:', e);
                }
            }
        }

        if (!aiResponse.trim()) {
            messageDiv.textContent = '⚠️ No response received from Llama 3. Please try again.';
        }

    } catch (error) {
        addMessage('ai', 
            `⚠️ Error: ${error.message}<br><br>` +
            `<strong>Possible solutions:</strong><br>` +
            `1. Ensure Ollama is running (try 'ollama serve')<br>` +
            `2. Verify model is installed (run 'ollama pull llama3')<br>` +
            `3. Check API URL (currently: ${OLLAMA_API_URL})`
        );
        console.error('Error:', error);
    } finally {
        hideTyping();
        sendButton.classList.remove('loading');
        userInput.disabled = false;
        userInput.focus();
    }
}

// Format the AI response with basic markdown support
function formatResponse(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

// Helpers
function showGettingStarted() {
    addMessage('ai', 
        `🚀 <strong>Getting Started with Llama 3</strong><br><br>` +
        `1. <strong>Ask anything</strong> - This model can handle complex questions<br>` +
        `2. <strong>Be specific</strong> - More detailed prompts get better answers<br>` +
        `3. <strong>Try creative tasks</strong> - Storytelling, code generation, etc.<br><br>` +
        `<strong>Example prompts:</strong><br>` +
        `- "Explain quantum computing in simple terms"<br>` +
        `- "Write a short poem about AI"<br>` +
        `- "Help me debug this Python code: [your code]"`
    );
}

function showTechSupport() {
    addMessage('ai',
        `🛠️ <strong>Tech Support</strong><br><br>` +
        `<strong>Having issues with Ollama?</strong><br><br>` +
        `🔧 <strong>Quick fixes:</strong><br>` +
        `1. Ensure Ollama is running (check terminal)<br>` +
        `2. Verify model is installed: <code>ollama pull llama3</code><br>` +
        `3. Check API URL (currently: ${OLLAMA_API_URL})<br><br>` +
        `📧 <strong>Contact support:</strong><br>` +
        `Email: danewalajay@gmail.com`
    );
}

// Event listeners
function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addMessage('user', message);
        userInput.value = '';
        getOllamaResponse(message);
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

menuBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
toggleSidebar.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    themeBtn.innerHTML = document.body.classList.contains('light-mode') 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
});

newChatBtn.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    setTimeout(() => {
        addMessage('ai', 'New chat started with Llama 3! What would you like to discuss?');
    }, 500);
});

gettingStartedBtn.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
    showGettingStarted();
});

techSupportBtn.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
    showTechSupport();
});

// Initialize with focus on input
userInput.focus();
