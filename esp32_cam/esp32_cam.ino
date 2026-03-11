/*
 * NIVORA AI - ESP32-CAM (Optimized)
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ===================== PIN DEFINITIONS (AI-THINKER) =====================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ===================== WIFI =====================
const char* ssid = "Galaxy S23 FE 2737";
const char* password = "1234567890";

// ⚠️ MAC'S CURRENT NETWORK IP
const char* SERVER_URL = "http://192.168.29.182:5000/api/camera/frame";

// ===================== SETTINGS =====================
const unsigned long FRAME_INTERVAL = 100;
camera_fb_t * fb = NULL;
unsigned long lastFrameTime = 0;
int frameCount = 0;

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=== NIVORA AI - ESP32-CAM ===");

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if(psramFound()) {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 12;
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_LATEST;
  } else {
    config.frame_size = FRAMESIZE_QQVGA;
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera FAILED: 0x%x\n", err);
    while(1);
  }
  Serial.println("Camera OK");

  sensor_t * s = esp_camera_sensor_get();
  s->set_brightness(s, 1);
  s->set_saturation(s, -2);

  WiFi.begin(ssid, password);
  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi OK!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("Target: ");
  Serial.println(SERVER_URL);
  Serial.println("Streaming Active!");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");
    WiFi.reconnect();
    delay(5000);
    return;
  }

  if (millis() - lastFrameTime >= FRAME_INTERVAL) {
    lastFrameTime = millis();
    frameCount++;

    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Frame capture failed");
      return;
    }

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "image/jpeg");
    
    int code = http.POST(fb->buf, fb->len);
    
    if (code == 200) {
      Serial.printf("Frame %d: Analyzed (%d bytes)\n", frameCount, fb->len);
    } else {
      Serial.printf("Frame %d: Error %d\n", frameCount, code);
    }
    
    http.end();
    esp_camera_fb_return(fb);
  }
}
