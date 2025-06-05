// MQTT Web Application Script
let mqttClient = null;
let isConnected = false;
let requestHistory = [];
let currentUser = '';

// Cookie utility functions
function setCookie(name, value, days = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            try {
                return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
            } catch (e) {
                return null;
            }
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// User management with cookies
function saveUserSettings(username, settings) {
    const userData = getCookie('mqttAppUsers') || {};
    userData[username] = {
        ...settings,
        lastLogin: new Date().toISOString()
    };
    setCookie('mqttAppUsers', userData, 30); // Save for 30 days
}

function getUserSettings(username) {
    const userData = getCookie('mqttAppUsers');
    return userData && userData[username] ? userData[username] : {};
}

function saveConnectionSettings() {
    if (!currentUser) return;

    const settings = {
        brokerUrl: document.getElementById('brokerUrl').value,
        clientId: document.getElementById('clientId').value,
        defaultTopic: document.getElementById('topic').value,
        defaultQos: document.getElementById('qos').value,
        defaultRetain: document.getElementById('retain').value
    };

    saveUserSettings(currentUser, { ...getUserSettings(currentUser), connectionSettings: settings });
}

function loadConnectionSettings() {
    if (!currentUser) return;

    const userSettings = getUserSettings(currentUser);
    if (userSettings.connectionSettings) {
        const settings = userSettings.connectionSettings;
        document.getElementById('brokerUrl').value = settings.brokerUrl || 'ws://test.mosquitto.org:8080';
        document.getElementById('clientId').value = settings.clientId || ('client-' + Math.random().toString(36).substr(2, 9));
        document.getElementById('topic').value = settings.defaultTopic || 'relay/control';
        document.getElementById('qos').value = settings.defaultQos || '0';
        document.getElementById('retain').value = settings.defaultRetain || 'false';
    }
}

// Initialize with random client ID
document.getElementById('clientId').value = 'client-' + Math.random().toString(36).substr(2, 9);

// Login functionality
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple validation (you can enhance this with real authentication)
    if (username && password) {
        currentUser = username;
        document.getElementById('currentUser').textContent = username;
        document.getElementById('loginPage').classList.add('d-none');
        document.getElementById('appPage').classList.remove('d-none');

        // Load user settings and history
        loadConnectionSettings();
        loadHistory();

        // Save login timestamp
        saveUserSettings(username, getUserSettings(username));
    }
});

function logout() {
    if (isConnected) {
        disconnectMQTT();
    }

    // Save current settings before logout
    if (currentUser) {
        saveConnectionSettings();
        saveHistory();
    }

    document.getElementById('loginPage').classList.remove('d-none');
    document.getElementById('appPage').classList.add('d-none');
    document.getElementById('loginForm').reset();
    currentUser = '';
    requestHistory = [];
}

function connectMQTT() {
    const brokerUrl = document.getElementById('brokerUrl').value;
    const clientId = document.getElementById('clientId').value;

    if (!brokerUrl) {
        alert('Please enter a broker URL');
        return;
    }

    // Show loading indicator
    showConnectingState(true);

    try {
        mqttClient = mqtt.connect(brokerUrl, {
            clientId: clientId || 'client-' + Math.random().toString(36).substr(2, 9),
            connectTimeout: 10000 // 10 second timeout
        });

        mqttClient.on('connect', function () {
            isConnected = true;
            updateConnectionStatus(true);
            showConnectingState(false);
            document.getElementById('sendBtn').disabled = false;
            console.log('Connected to MQTT broker');
        });

        mqttClient.on('error', function (error) {
            console.error('MQTT connection error:', error);
            updateConnectionStatus(false);
            showConnectingState(false);
            alert('Failed to connect to MQTT broker: ' + error.message);
        });

        mqttClient.on('close', function () {
            isConnected = false;
            updateConnectionStatus(false);
            showConnectingState(false);
            document.getElementById('sendBtn').disabled = true;
            console.log('Disconnected from MQTT broker');
        });

        // Timeout fallback
        setTimeout(() => {
            if (!isConnected && mqttClient) {
                showConnectingState(false);
                alert('Connection timeout. Please check your broker URL.');
                mqttClient.end();
                mqttClient = null;
            }
        }, 15000);

    } catch (error) {
        console.error('Error connecting to MQTT:', error);
        showConnectingState(false);
        alert('Failed to connect to MQTT broker');
    }
}

function disconnectMQTT() {
    if (mqttClient) {
        mqttClient.end();
        mqttClient = null;
    }
    isConnected = false;
    updateConnectionStatus(false);
    document.getElementById('sendBtn').disabled = true;
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');

    if (connected) {
        statusElement.innerHTML = '<i class="fas fa-circle status-connected"></i> <span>Connected</span>';
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
    } else {
        statusElement.innerHTML = '<i class="fas fa-circle status-disconnected"></i> <span>Disconnected</span>';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
    }
}

function showConnectingState(connecting) {
    const connectBtn = document.getElementById('connectBtn');
    const connectBtnContent = document.getElementById('connectBtnContent');
    const connectingSpinner = document.getElementById('connectingSpinner');

    if (connecting) {
        connectBtn.disabled = true;
        connectBtnContent.classList.add('d-none');
        connectingSpinner.classList.remove('d-none');
    } else {
        connectBtn.disabled = false;
        connectBtnContent.classList.remove('d-none');
        connectingSpinner.classList.add('d-none');
    }
}

function sendMessage() {
    if (!isConnected || !mqttClient) {
        alert('Please connect to MQTT broker first');
        return;
    }

    const topic = document.getElementById('topic').value;
    const message = document.getElementById('message').value;
    const qos = parseInt(document.getElementById('qos').value);
    const retain = document.getElementById('retain').value === 'true';

    if (!topic || !message) {
        alert('Please enter both topic and message');
        return;
    }

    // Save current settings
    saveConnectionSettings();

    try {
        mqttClient.publish(topic, message, { qos: qos, retain: retain }, function (error) {
            if (error) {
                console.error('Publish error:', error);
                alert('Failed to send message');
            } else {
                console.log('Message sent successfully');
                addToHistory(topic, message, qos, retain);
                // Clear the message field
                document.getElementById('message').value = '';
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

function addToHistory(topic, message, qos, retain) {
    const request = {
        timestamp: new Date().toLocaleString(),
        topic: topic,
        message: message,
        qos: qos,
        retain: retain
    };

    requestHistory.unshift(request);

    // Keep only last 50 requests
    if (requestHistory.length > 50) {
        requestHistory = requestHistory.slice(0, 50);
    }

    saveHistory();
    displayHistory();
}

function displayHistory() {
    const historyContainer = document.getElementById('requestHistory');

    if (requestHistory.length === 0) {
        historyContainer.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>No requests sent yet</p>
                    </div>
                `;
        return;
    }

    let historyHTML = '';
    requestHistory.forEach((request, index) => {
        historyHTML += `
                    <div class="request-item">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <strong class="text-primary">${request.topic}</strong>
                            <small class="text-muted">${request.timestamp}</small>
                        </div>
                        <div class="mb-2">
                            <span class="badge bg-secondary me-2">QoS: ${request.qos}</span>
                            ${request.retain ? '<span class="badge bg-info">Retained</span>' : ''}
                        </div>
                        <div class="text-break">
                            <small class="text-muted">Message:</small><br>
                            <span>${request.message}</span>
                        </div>
                    </div>
                `;
    });

    historyContainer.innerHTML = historyHTML;
}

function clearHistory() {
    if (confirm('Are you sure you want to clear the request history?')) {
        requestHistory = [];
        saveHistory();
        displayHistory();
    }
}

function saveHistory() {
    if (!currentUser) return;

    const userSettings = getUserSettings(currentUser);
    userSettings.requestHistory = requestHistory;
    saveUserSettings(currentUser, userSettings);
}

function loadHistory() {
    if (!currentUser) return;

    const userSettings = getUserSettings(currentUser);
    requestHistory = userSettings.requestHistory || [];
    displayHistory();
}

// Auto-save settings when fields change
document.addEventListener('DOMContentLoaded', function () {
    const settingsFields = ['brokerUrl', 'clientId', 'topic', 'qos', 'retain'];
    settingsFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', saveConnectionSettings);
            field.addEventListener('blur', saveConnectionSettings);
        }
    });
});
