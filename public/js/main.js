// Global socket variable, initialized after login
let socket;

document.addEventListener('DOMContentLoaded', () => {
    // Auth form elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginUserIdInput = document.getElementById('login-userid'); // Changed from login-email
    const loginPasswordInput = document.getElementById('login-password');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerProfilePictureInput = document.getElementById('register-profile-picture'); // New input
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

    // Chat elements
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesList = document.getElementById('messages');
    const conversationList = document.getElementById('conversation-list');
    const currentChatUsername = document.getElementById('current-chat-username');
    const currentChatAvatar = document.getElementById('current-chat-avatar');
    const currentChatStatus = document.getElementById('current-chat-status');


    // --- Mock Data (Can be removed or updated as real data flows) ---
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
        }
    };

    function populateConversationList() {
        if (!conversationList) return;
        conversationList.innerHTML = '';
        const user = JSON.parse(localStorage.getItem('user'));
        // In a real app, this list would come from the server based on the logged-in user
        Object.keys(mockConversations).forEach((username, index) => {
            const convoData = mockConversations[username];
            const lastMessage = convoData.messages.length > 0 ? convoData.messages[convoData.messages.length - 1] : { text: "No messages yet", time: "" };

            const listItem = document.createElement('li');
            listItem.className = 'conversation-item';
            if (index === 0) listItem.classList.add('active-conversation');
            listItem.dataset.username = username;

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
        if (Object.keys(mockConversations).length > 0) {
            selectConversation(Object.keys(mockConversations)[0], conversationList.querySelector('.conversation-item'));
        }
    }

    function selectConversation(username, selectedListItem) {
        if (!mockConversations[username]) return;

        const convoData = mockConversations[username];
        currentChatUsername.textContent = username;
        currentChatAvatar.src = convoData.avatar; // Update with actual user avatar later
        currentChatStatus.textContent = convoData.status;

        messagesList.innerHTML = '';
        convoData.messages.forEach(msg => {
            appendMessageToList(msg.text, msg.type, msg.sender, msg.time);
        });

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
        if (isLoggedIn && user) {
            authContainer.style.display = 'none';
            chatContainer.style.display = 'block';
            usernameDisplay.textContent = `Logged in as: ${user.username} (ID: ${user.userId})`; // Display username and User ID
            logoutButton.style.display = 'inline';
            // Populate mock conversations for now. Later, this would fetch user's actual conversations.
            populateConversationList();
            initializeSocket();
        } else {
            authContainer.style.display = 'block';
            chatContainer.style.display = 'none';
            usernameDisplay.textContent = 'Not logged in';
            logoutButton.style.display = 'none';
            if (socket) {
                socket.disconnect();
            }
        }
    }

    // --- API Call Functions ---
    async function handleAuthRequest(url, body, feedbackElement, isRegister = false) {
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

            let successMessage = data.message || 'Success!';
            if (isRegister && data.user && data.user.userId) {
                successMessage += ` Your User ID is: ${data.user.userId}. Please save it for login.`;
            }
            displayFeedback(feedbackElement, successMessage, true);

            if (!isRegister) { // For login, store token and user, then update UI
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                updateAuthUI(true, data.user);
            } else {
                // For registration, after showing success, maybe clear form or switch to login
                registerForm.reset(); // Clear the registration form
                // Optionally, switch to the login form automatically
                // setTimeout(() => {
                //     showLoginLink.click();
                //     clearFeedback(registerFeedback);
                // }, 3000); // Switch after 3 seconds
            }
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
            const userId = loginUserIdInput.value.trim(); // Changed from email
            const password = loginPasswordInput.value.trim();
            if (!userId || !password) {
                displayFeedback(loginFeedback, 'User ID and password are required.', false); // Updated message
                return;
            }
            // Basic validation for User ID format (8 digits, starts with 90)
            if (!/^90\d{6}$/.test(userId)) {
                displayFeedback(loginFeedback, 'Invalid User ID format. Must be 8 digits starting with 90.', false);
                return;
            }
            await handleAuthRequest('/.netlify/functions/login', { userId, password }, loginFeedback);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerUsernameInput.value.trim();
            const password = registerPasswordInput.value.trim();
            const profilePicture = registerProfilePictureInput.value.trim(); // Get profile picture URL

            if (!username || !password) {
                displayFeedback(registerFeedback, 'Username and password are required.', false);
                return;
            }
            if (password.length < 6) {
                 displayFeedback(registerFeedback, 'Password must be at least 6 characters long.', false);
                return;
            }

            const body = { username, password };
            if (profilePicture) {
                body.profilePicture = profilePicture;
            }

            await handleAuthRequest('/.netlify/functions/register', body, registerFeedback, true);
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormContainer.style.display = 'none';
            registerFormContainer.style.display = 'block';
            clearFeedback(loginFeedback, registerFeedback);
            loginForm.reset();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerFormContainer.style.display = 'none';
            loginFormContainer.style.display = 'block';
            clearFeedback(loginFeedback, registerFeedback);
            registerForm.reset();
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            updateAuthUI(false);
            if (conversationList) conversationList.innerHTML = '';
            if (messagesList) messagesList.innerHTML = '';
            if (currentChatUsername) currentChatUsername.textContent = '';
            if (currentChatAvatar) currentChatAvatar.src = 'https://via.placeholder.com/40';
            if (currentChatStatus) currentChatStatus.textContent = '';
        });
    }

    // --- Socket.IO Initialization and Event Handlers ---
    function initializeSocket() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log("No token found, socket not initialized.");
            return;
        }

        if (socket && socket.connected) {
            socket.disconnect();
        }

        socket = io({ auth: { token } });

        socket.on('connect', () => {
            console.log('Socket connected successfully with ID:', socket.id);
            const user = JSON.parse(localStorage.getItem('user'));
            appendMessageToListHelper(`Connected as ${user.username}!`, 'system');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            appendMessageToListHelper(`Connection Error: ${err.message}. Try refreshing.`, 'error');
            if (err.message === 'Invalid token' || err.message === 'Authentication error') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateAuthUI(false);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            appendMessageToListHelper(`Disconnected: ${reason}`, 'system');
        });

        socket.on('chat message', (msgData) => {
            // msgData: { user: { username: 'senderName', profilePicture: 'url' }, text: 'message', time: 'HH:MM AM/PM', type: 'received' }
            const localUser = JSON.parse(localStorage.getItem('user'));
            // Determine if message is sent or received based on sender's ID if available, or username
            // For now, if msgData.user.username is not the localUser.username, it's 'received'
            const type = (msgData.user && localUser && msgData.user.username === localUser.username) ? 'sent' : 'received';
            appendMessageToList(msgData.text, type , msgData.user.username, msgData.time, msgData.user.profilePicture);
        });

        // Placeholder for user list updates
        socket.on('update userList', (users) => {
            console.log('Received user list update:', users);
            // This is where you'd update the UI that lists online users or conversations
            // For now, we are using mockConversations. This would replace/update that.
        });
    }

    // --- Chat Message Handling ---
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const messageText = messageInput.value.trim();
            if (messageText && socket && socket.connected) {
                const user = JSON.parse(localStorage.getItem('user'));
                const messageData = {
                    // text: messageText, // Server will get this from the actual message event
                    // No need to send user object here, server knows from socket
                };
                socket.emit('chat message', messageText); // Just send the text

                // Optimistically display sent message (server should confirm or send it back to all clients including sender)
                // appendMessageToList(messageText, "sent", user.username, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user.profilePicture);
                // Server will broadcast, so sender will also receive it via 'chat message' event.
                // This prevents displaying the message twice if server echoes back to sender.
                // If server does NOT echo to sender, then uncomment the line above.

                messageInput.value = '';
            } else if (messageText) {
                appendMessageToListHelper('Not connected. Cannot send message.', 'error');
            }
        });
    }

    function appendMessageToList(text, type = 'chat', senderName = '', time = '', avatarUrl = 'https://via.placeholder.com/40') {
        if (!messagesList) return;
        const listItem = document.createElement('li');
        listItem.classList.add('message-item');

        // Simple distinction for sent/received for now
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (localUser && senderName === localUser.username) {
            listItem.classList.add('message-sent');
        } else {
            listItem.classList.add('message-received');
        }
        // For a more robust system, message type ('sent'/'received') should come from server or be based on a unique sender ID

        // Include avatar in message display if it's a received message from another user
        let avatarImg = '';
        if (type === 'received' && senderName) { // Show avatar for received messages
             // avatarImg = `<img src="${avatarUrl || 'https://via.placeholder.com/30?text=?'}" alt="${senderName}" class="message-avatar">`;
        }
        // Currently, the CSS is not set up for avatars inside messages, but structure is here if needed.

        listItem.innerHTML = `
            ${avatarImg}
            <div class="message-content-wrapper">
                ${type === 'received' && senderName ? `<p class="message-sender-name">${senderName}</p>` : ''}
                <div class="message-content">${text}</div>
            </div>
            <span class="message-timestamp">${time}</span>
        `;
        // If CSS requires sender name inside message-content for styling, adjust structure.
        messagesList.appendChild(listItem);
        scrollToBottom();
    }

    function appendMessageToListHelper(text, type = 'system') {
        if (!messagesList) return;
        const listItem = document.createElement('li');
        listItem.classList.add('message-item', `message-${type}`); // e.g. message-system, message-error
        listItem.innerHTML = `<div class="message-content">${text}</div>`;
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
                console.error("Error parsing user from localStorage:", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateAuthUI(false);
            }
        } else {
            updateAuthUI(false);
        }
    }

    checkInitialAuthState();
});
