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
    // const usersList = document.getElementById('users'); // This is the old one, new is conversation-list
    const conversationList = document.getElementById('conversation-list');
    const currentChatUsername = document.getElementById('current-chat-username');
    const currentChatAvatar = document.getElementById('current-chat-avatar');
    const currentChatStatus = document.getElementById('current-chat-status');


    // --- Mock Data ---
    const mockConversations = {
        "User One": {
            avatar: "https://via.placeholder.com/40?text=U1",
            status: "Online",
            messages: [
                { sender: "User One", text: "Hey, how are you?", time: "10:28 AM", type: "received" },
                { sender: "You", text: "I'm good, thanks! Working on this.", time: "10:30 AM", type: "sent" },
                { sender: "User One", text: "Cool! Let me know if you need help.", time: "10:31 AM", type: "received" }
            ]
        },
        "Another User": {
            avatar: "https://via.placeholder.com/40?text=U2",
            status: "Offline",
            messages: [
                { sender: "Another User", text: "Lunch tomorrow?", time: "Yesterday", type: "received" },
                { sender: "You", text: "Sure, sounds good!", time: "Yesterday", type: "sent" }
            ]
        },
        "User Three": {
            avatar: "https://via.placeholder.com/40?text=U3",
            status: "Online",
            messages: [
                { sender: "User Three", text: "Did you see the new designs?", time: "Mon", type: "received" }
            ]
        }
    };

    function populateConversationList() {
        if (!conversationList) return;
        conversationList.innerHTML = ''; // Clear existing
        Object.keys(mockConversations).forEach((username, index) => {
            const convoData = mockConversations[username];
            const lastMessage = convoData.messages.length > 0 ? convoData.messages[convoData.messages.length - 1] : { text: "No messages yet", time: "" };

            const listItem = document.createElement('li');
            listItem.className = 'conversation-item';
            if (index === 0) listItem.classList.add('active-conversation'); // Make first active by default
            listItem.dataset.username = username; // Store username for click handling

            listItem.innerHTML = `
                <img src="${convoData.avatar}" alt="${username}" class="avatar">
                <div class="conversation-details">
                    <p class="conversation-name">${username}</p>
                    <p class="conversation-snippet">${lastMessage.text}</p>
                </div>
                <span class="conversation-timestamp">${lastMessage.time}</span>
            `;
            listItem.addEventListener('click', () => selectConversation(username, listItem));
            conversationList.appendChild(listItem);
        });
        // Load the first conversation by default if list is not empty
        if (Object.keys(mockConversations).length > 0) {
            selectConversation(Object.keys(mockConversations)[0], conversationList.querySelector('.conversation-item'));
        }
    }

    function selectConversation(username, selectedListItem) {
        if (!mockConversations[username]) return;

        const convoData = mockConversations[username];
        currentChatUsername.textContent = username;
        currentChatAvatar.src = convoData.avatar;
        currentChatStatus.textContent = convoData.status;

        messagesList.innerHTML = ''; // Clear previous messages
        convoData.messages.forEach(msg => {
            appendMessageToList(msg.text, msg.type, msg.sender, msg.time);
        });

        // Update active state in conversation list
        const allConvoItems = conversationList.querySelectorAll('.conversation-item');
        allConvoItems.forEach(item => item.classList.remove('active-conversation'));
        if (selectedListItem) {
            selectedListItem.classList.add('active-conversation');
        }
    }


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
            if (conversationList) conversationList.innerHTML = ''; // Clear conversation list on logout
            if (messagesList) messagesList.innerHTML = ''; // Clear messages on logout
            if (currentChatUsername) currentChatUsername.textContent = '';
            if (currentChatAvatar) currentChatAvatar.src = 'https://via.placeholder.com/40';
            if (currentChatStatus) currentChatStatus.textContent = '';
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
            appendMessageToListHelper('Connected to chat!', 'system');
            // You can now emit events that require authentication
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            appendMessageToListHelper(`Connection Error: ${err.message}. Try refreshing.`, 'error');
            // Handle auth errors, e.g., invalid token
            if (err.message === 'Invalid token' || err.message === 'Authentication error') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateAuthUI(false); // Log out user
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            appendMessageToListHelper(`Disconnected: ${reason}`, 'system');
            // If disconnected due to server-side auth error, could also trigger logout
            if (reason === 'io server disconnect') { // Often due to auth failure mid-session
                 // Consider if re-authentication or UI update is needed
            }
        });

        // Example: Handle incoming chat messages (to be implemented fully later)
        socket.on('chat message', (msgData) => {
            // msgData might be { user: 'username', text: 'message content', timestamp: ... }
            appendMessageToListHelper(msgData.text, msgData.type || 'chat', msgData.user, msgData.time);
        });
    }

    // --- Chat Message Handling (Basic for now) ---
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const messageText = messageInput.value.trim();
            if (messageText) {
                if (socket && socket.connected) {
                    // Emit message to server (to be implemented on server)
                    // For now, we'll just add it to the mock data for the current conversation
                    // and re-render. In a real app, server would send it back.
                    const currentConvoUsername = currentChatUsername.textContent;
                    if (mockConversations[currentConvoUsername]) {
                        const newMsg = {
                            sender: "You",
                            text: messageText,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            type: "sent"
                        };
                        mockConversations[currentConvoUsername].messages.push(newMsg);
                        // append this new message to the UI directly
                        appendMessageToList(newMsg.text, newMsg.type, newMsg.sender, newMsg.time);
                    }
                } else {
                     // If socket not connected, still add to UI for local demo feel
                    appendMessageToList(messageText, "sent", "You", new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    // appendMessageToListHelper('Not connected. Message shown locally.', 'error');
                }
                messageInput.value = '';
            }
        });
    }

    function appendMessageToList(text, type = 'chat', sender = '', time = '') {
        if (!messagesList) return;
        const listItem = document.createElement('li');
        listItem.classList.add('message-item');
        if (type === 'sent') {
            listItem.classList.add('message-sent');
        } else {
            listItem.classList.add('message-received');
        }

        listItem.innerHTML = `
            <div class="message-content">${text}</div>
            <span class="message-timestamp">${time}</span>
        `;
        messagesList.appendChild(listItem);
        scrollToBottom();
    }

    // Wrapper for system/error messages that don't have sender/time in the same way
    function appendMessageToListHelper(text, type = 'system') {
        if (!messagesList) return;
        const listItem = document.createElement('li');
        listItem.textContent = text;
        if (type === 'system') listItem.style.fontStyle = 'italic';
        if (type === 'error') {
            listItem.style.color = 'red';
            listItem.style.textAlign = 'center';
        }
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
