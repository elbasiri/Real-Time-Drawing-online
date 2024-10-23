let currentUser = null;
let ws = null;

// WebSocket connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to WebSocket');
        loadLastDrawing();
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
        console.log('WebSocket connection closed');
        setTimeout(connectWebSocket, 1000); // Reconnect on close
    };
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'draw':
            drawRemoteStroke(data);
            break;
        case 'cursor':
            updateRemoteCursor(data);
            break;
    }
}

// Cursor handling
function updateRemoteCursor(data) {
    let cursor = document.getElementById(`cursor-${data.username}`);
    
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = `cursor-${data.username}`;
        cursor.className = 'cursor';
        
        const label = document.createElement('span');
        label.textContent = data.username;
        label.style.position = 'absolute';
        label.style.top = '-20px';
        label.style.left = '10px';
        cursor.appendChild(label);
        
        document.getElementById('cursors-container').appendChild(cursor);
    }
    
    cursor.style.left = `${data.x}px`;
    cursor.style.top = `${data.y}px`;
}

// Authentication functions
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.username;
            document.getElementById('current-user').textContent = `Logged in as: ${currentUser}`;
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('drawing-container').style.display = 'block';
            connectWebSocket();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed');
    }
}

async function logout() {
    try {
        await fetch('/auth/logout', { method: 'POST' });
        currentUser = null;
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('drawing-container').style.display = 'none';
        if (ws) {
            ws.close();
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// UI helpers
function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

// Check authentication status on page load
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();
        
        if (data.isAuthenticated) {
            currentUser = data.username;
            document.getElementById('current-user').textContent = `Logged in as: ${currentUser}`;
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('drawing-container').style.display = 'block';
            connectWebSocket();
        }
    } catch (error) {
        console.error('Auth status check error:', error);
    }
}

// Initialize on page load
window.addEventListener('load', checkAuthStatus);