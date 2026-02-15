# AgriFlow - Smart Farming Assistant

AgriFlow is a comprehensive mobile application for farmers and retailers to manage crops, view market prices, and connect with each other.

## 📋 Prerequisites

* Node.js & npm installed
* React Native development environment set up (Expo Go app on mobile recommended)
* Python installed (for Price Prediction ML model)

---

## 🔑 1. API Key Setup (Government Data)

To fetch real-time Mandi prices, you need an API key from the Open Government Data (OGD) Platform India.

1.  **Register/Login**: Go to [data.gov.in](https://data.gov.in/).
2.  **Navigate to Dataset**: Visit the [Current Daily Price of Various Commodities](https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi) page.
3.  **Get API Key**:
    * Click on the **"API"** button (usually near the download/export options).
    * If you are logged in, it will generate an API key for you.
4.  **Configure Backend**:
    * Open your backend `.env` file (`agriflow-backend/.env`).
    * Add your key:
        ```env
        DATA_GOV_API_KEY=your_generated_api_key_here
        ```

---

## 🌐 2. Connect Mobile App to Local Server

Since the app runs on your phone and the backend runs on your PC, they need to be on the **same Wi-Fi network**. You must update the API URL with your PC's local IP address.

1.  **Find your IP Address**:
    * Open Command Prompt (cmd) on your PC.
    * Type `ipconfig` and press Enter.
    * Look for **"IPv4 Address"** (e.g., `192.168.1.5` or `10.126.xxx.xx`).

2.  **Update Configuration**:
    * Open the file: `RythuMart/src/config/api.js`
    * Replace `localhost` or the existing IP with your IPv4 address:

    ```javascript
    // RythuMart/src/config/api.js
    
    // Replace '192.168.1.X' with your actual IPv4 Address from ipconfig
    export const API_URL = '[http://192.168.1.5:5000/api](http://192.168.1.5:5000/api)'; 
    ```

    > **Note:** If your IP changes (e.g., you reconnect to Wi-Fi), you must update this file again.

---

## 🚀 3. Run the Project

You will need two separate terminals: one for the Backend and one for the Frontend.

### **Step A: Start Backend Server (Node.js)**

1.  Open a terminal and navigate to the backend folder:
    ```bash
    cd agriflow-backend
    ```
2.  Install dependencies (first time only):
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    # OR if using nodemon
    npx nodemon server.js
    ```
    *You should see: "Server running on port 5000" and "Connected to Database".*

### **Step B: Start Frontend App (React Native)**

1.  Open a **new** terminal and navigate to the frontend folder:
    ```bash
    cd RythuMart
    ```
2.  Install dependencies (first time only):
    ```bash
    npm install
    ```
3.  Start the Expo server:
    ```bash
    npx expo start
    ```
4.  **Launch on Phone**:
    * Scan the QR code displayed in the terminal using the **Expo Go** app (Android) or Camera app (iOS).
    * Ensure your phone is connected to the same Wi-Fi as your PC.

---

## 🛠 Troubleshooting

* **"Network Request Failed"**: 
    * Double-check that the IP address in `src/config/api.js` matches your PC's IPv4 address.
    * Ensure your firewall is not blocking port 5000.
* **"RNGestureHandlerModule not found"**:
    * Stop the app and run: `npx expo run:android` (if using bare workflow) or simply restart the Expo server with `npx expo start -c` to clear cache.