#📡 MQTT WebApp
A responsive web application built with HTML, Bootstrap, Font Awesome, and MQTT.js to allow users to authenticate and control MQTT-enabled devices over the internet (e.g., ESP-01 with a relay).

##🚀 Features
🔐 Login interface (basic UI-level authentication)

🔗 MQTT Broker connectivity

📤 Publish messages to any topic

🧾 Track request history

🎨 Stylish UI with Bootstrap 5 and Font Awesome

🌐 Uses public MQTT broker test.mosquitto.org for demo/testing

##📁 Project Structure
graphql
Copy
Edit
/
├── index.html            # Main HTML interface
├── css/
│   └── index.css         # Custom styles
├── js/
│   └── index.script.js   # MQTT logic and UI interactions
└── README.md             # You're here!
🔧 Setup Instructions
Clone this repo

bash
Copy
Edit
git clone https://github.com/SandeepaPethangoda/mqttWebApp.git
cd mqtt-webapp
Open index.html in your browser

No local server needed – pure HTML/CSS/JS frontend

Login with any username/password (no backend check — UI only)

Connect to MQTT

Default broker: ws://test.mosquitto.org:8080

Enter client ID (can be anything unique)

Click Connect

Send MQTT Messages

Enter Topic (e.g., relay/control)

Enter Message (e.g., ON or OFF)

Choose QoS, Retain settings

Click Send

Control your ESP-01 Relay

If your ESP-01 listens to relay/control, it will respond accordingly!

🧠 ESP-01 MQTT Example
cpp
Copy
Edit
// Topic: relay/control
// Payload: ON / OFF
See ESP-01 MQTT Relay Code for reference (add your own link if hosted).

🛠 Dependencies
Bootstrap 5

Font Awesome 6



