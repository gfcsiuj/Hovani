// Establish a connection with the Socket.IO server
// By default, it connects to the host that serves the page.
const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesList = document.getElementById('messages');
    // const usersList = document.getElementById('users'); // For future use

    // Display a message when connected
    socket.on('connect', () => {
        const listItem = document.createElement('li');
        listItem.textContent = 'Connected to the chat server!';
        listItem.style.fontStyle = 'italic';
        listItem.style.color = 'green';
        messagesList.appendChild(listItem);
        scrollToBottom();
    });

    // Display a message when disconnected
    socket.on('disconnect', () => {
        const listItem = document.createElement('li');
        listItem.textContent = 'Disconnected from the chat server.';
        listItem.style.fontStyle = 'italic';
        listItem.style.color = 'red';
        messagesList.appendChild(listItem);
        scrollToBottom();
    });

    // Handle incoming chat messages (placeholder for actual messages)
    // Example: socket.on('chat message', (msg) => { /* ... */ });

    // Handle form submission for sending messages (placeholder)
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value.trim()) {
            // Example: socket.emit('chat message', messageInput.value);

            // For now, just display it locally as a sent message
            const listItem = document.createElement('li');
            listItem.textContent = `You: ${messageInput.value}`;
            messagesList.appendChild(listItem);

            messageInput.value = '';
            scrollToBottom();
        }
    });

    // Function to scroll the chat window to the bottom
    function scrollToBottom() {
        const chatWindow = document.getElementById('chat-window');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Initial message to indicate JS is loaded
    const initialMsg = document.createElement('li');
    initialMsg.textContent = 'main.js loaded. Waiting for server connection...';
    messagesList.appendChild(initialMsg);
    scrollToBottom();
});

// Future client-side logic:
// - Handle receiving messages from other users.
// - Handle receiving list of users.
// - Implement login/registration forms and communication with backend.
// - Dynamic UI updates based on server events.
// - Token management for authenticated requests.
