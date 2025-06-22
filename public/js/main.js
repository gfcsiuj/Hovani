// Global socket variable, initialized after login
let socket;

document.addEventListener('DOMContentLoaded', () => {
    // Auth form elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const registerUsernameInput = document.getElementById('register-username');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const loginFeedback = document.getElementById('login-feedback');
    const registerFeedback = document.getElementById('register-feedback');

    // Links to toggle forms
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');

    // App sections
    const authContainer = document.getElementById('auth-container');
    const chatContainer = document.getElementById('chat-container');

    // User status and logout
    const usernameDisplay = document.getElementById('username-display');
    const logoutButton = document.getElementById('logout-button');

    // Chat elements (will be used more later)
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesList = document.getElementById('messages');
    // const usersList = document.getElementById('users');

    // --- Utility Functions ---
    function displayFeedback(element, message, isSuccess) {
        element.textContent = message;
        element.className = isSuccess ? 'auth-feedback success' : 'auth-feedback error';
    }

    function clearFeedback(...elements) {
        elements.forEach(el => {
            if (el) {
                el.textContent = '';
                el.className = 'auth-feedback';
            }
        });
    }

    function updateAuthUI(isLoggedIn, user = null) {
        if (isLoggedIn) {
            authContainer.style.display = 'none';
            chatContainer.style.display = 'block'; // Or 'flex' if it's a flex container
            usernameDisplay.textContent = `Logged in as: ${user.username}`;
            logoutButton.style.display = 'inline';
            initializeSocket(); // Initialize socket connection after login
        } else {
            authContainer.style.display = 'block'; // Or 'flex'
            chatContainer.style.display = 'none';
            usernameDisplay.textContent = 'Not logged in';
            logoutButton.style.display = 'none';
            if (socket) {
                socket.disconnect();
            }
        }
    }

    // --- API Call Functions ---
    async function handleAuthRequest(url, body, feedbackElement) {
        clearFeedback(loginFeedback, registerFeedback);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (!response.ok) {
                displayFeedback(feedbackElement, data.message || `Error: ${response.status}`, false);
                return null;
            }

            displayFeedback(feedbackElement, data.message || 'Success!', true);
            localStorage.setItem('token', data.token); // Store JWT
            localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
            updateAuthUI(true, data.user);
            return data;

        } catch (error) {
            console.error('Auth request error:', error);
            displayFeedback(feedbackElement, 'Network error or server unavailable.', false);
            return null;
        }
    }

    // --- Event Listeners for Auth ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value.trim();
            if (!email || !password) {
                displayFeedback(loginFeedback, 'Email and password are required.', false);
                return;
            }
            await handleAuthRequest('/.netlify/functions/login', { email, password }, loginFeedback);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerUsernameInput.value.trim();
            const email = registerEmailInput.value.trim();
            const password = registerPasswordInput.value.trim();
            if (!username || !email || !password) {
                displayFeedback(registerFeedback, 'Username, email, and password are required.', false);
                return;
            }
            await handleAuthRequest('/.netlify/functions/register', { username, email, password }, registerFeedback);
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormContainer.style.display = 'none';
            registerFormContainer.style.display = 'block';
            clearFeedback(loginFeedback, registerFeedback);
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerFormContainer.style.display = 'none';
            loginFormContainer.style.display = 'block';
            clearFeedback(loginFeedback, registerFeedback);
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            updateAuthUI(false);
            // Optionally, inform the server about logout if needed
        });
    }

    // --- Socket.IO Initialization and Event Handlers ---
    function initializeSocket() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log("No token found, socket not initialized.");
            return;
        }

        // Disconnect existing socket if any before creating a new one
        if (socket && socket.connected) {
            socket.disconnect();
        }

        // Connect to the server with authentication token
        socket = io({
            auth: { token }
            // For older versions of socket.io client, you might need:
            // query: { token }
        });

        socket.on('connect', () => {
            console.log('Socket connected successfully with ID:', socket.id);
            appendMessageToList('Connected to chat!', 'system');
            // You can now emit events that require authentication
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            appendMessageToList(`Connection Error: ${err.message}. Try refreshing.`, 'error');
            // Handle auth errors, e.g., invalid token
            if (err.message === 'Invalid token' || err.message === 'Authentication error') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateAuthUI(false); // Log out user
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            appendMessageToList(`Disconnected: ${reason}`, 'system');
            // If disconnected due to server-side auth error, could also trigger logout
            if (reason === 'io server disconnect') { // Often due to auth failure mid-session
                 // Consider if re-authentication or UI update is needed
            }
        });

        // Example: Handle incoming chat messages (to be implemented fully later)
        socket.on('chat message', (msgData) => {
            // msgData might be { user: 'username', text: 'message content', timestamp: ... }
            appendMessageToList(`${msgData.user}: ${msgData.text}`, 'chat');
        });
    }

    // --- Chat Message Handling (Basic for now) ---
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (messageInput.value.trim() && socket && socket.connected) {
                const messageText = messageInput.value.trim();
                // Emit message to server (to be implemented on server)
                socket.emit('chat message', { text: messageText });

                // Optimistically display sent message (server should confirm/broadcast)
                // appendMessageToList(`You: ${messageText}`, 'user');
                messageInput.value = '';
            } else if (!socket || !socket.connected) {
                appendMessageToList('Not connected to chat. Cannot send message.', 'error');
            }
        });
    }

    function appendMessageToList(text, type = 'chat') { // type can be 'chat', 'system', 'error', 'user'
        const listItem = document.createElement('li');
        listItem.textContent = text;
        if (type === 'system') listItem.style.fontStyle = 'italic';
        if (type === 'error') listItem.style.color = 'red';
        // if (type === 'user') listItem.style.textAlign = 'right'; // Example for user's own messages
        messagesList.appendChild(listItem);
        scrollToBottom();
    }

    function scrollToBottom() {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    }

    // --- Initial UI State Check ---
    function checkInitialAuthState() {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        if (token && userString) {
            try {
                const user = JSON.parse(userString);
                updateAuthUI(true, user);
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateAuthUI(false);
            }
        } else {
            updateAuthUI(false);
        }
    }

    checkInitialAuthState(); // Check auth state on page load
});
