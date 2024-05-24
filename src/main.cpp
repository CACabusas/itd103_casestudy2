#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char *ssid = "SSID"; // Replace with your SSID
const char *password = "Password"; // Replace with your internet password

const char *serverUrl = "http://ip_address:3001/motion/newmotion"; // Replace ip_address with your own (if using localhost)

const int pirPin = D5;
int pirState = LOW;
int val = 0;

WiFiClient client;

void sendMotionData();

void setup() {
  Serial.begin(115200);
  pinMode(pirPin, INPUT);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  val = digitalRead(pirPin);
  if (val == HIGH) {
    if (pirState == LOW) {
      Serial.println("Motion detected!");
      sendMotionData();
      pirState = HIGH;
    }
  } else {
    pirState = LOW;
  }
  delay(100);
}

void sendMotionData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    String payload = "{}";  // Empty JSON payload
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Data sent successfully");
      Serial.println("Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error sending data. HTTP response code: ");
      Serial.println(httpResponseCode);
      Serial.println("Connection failed, error: " + String(http.errorToString(httpResponseCode).c_str()));
    }
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}
