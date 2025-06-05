#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char *ssid = "**************";
const char *password = "************";

// MQTT Broker
const char *mqtt_server = "test.mosquitto.org";
const char *mqtt_topic = "relay/control";

// GPIO0 for relay control
#define RELAY_PIN 0

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi()
{
    delay(10);
    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
}

void callback(char *topic, byte *payload, unsigned int length)
{
    String msg;
    for (unsigned int i = 0; i < length; i++)
    {
        msg += (char)payload[i];
    }
    msg.trim();

    Serial.print("Message received on topic [");
    Serial.print(topic);
    Serial.print("]: ");
    Serial.println(msg);

    if (msg == "ON")
    {
        digitalWrite(RELAY_PIN, HIGH); // Turn relay ON
    }
    else if (msg == "OFF")
    {
        digitalWrite(RELAY_PIN, LOW); // Turn relay OFF
    }
}

void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP01Client"))
        {
            Serial.println("connected");
            client.subscribe(mqtt_topic);
        }
        else
        {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" trying again in 5s");
            delay(5000);
        }
    }
}

void setup()
{
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, LOW); // Relay off at startup

    Serial.begin(9600);
    setup_wifi();

    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);
}

void loop()
{
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();
}
