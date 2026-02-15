Here is the fully updated **README.md** file. It includes the specific API registration link, the guide for changing your IP address for local testing, and the commands to build and run the project.

```markdown
# AgriFlow - Smart Farming Assistant

AgriFlow is a comprehensive mobile application for farmers and retailers to manage crops, view market prices, and connect with each other.

## 📋 Prerequisites

* **Node.js** & **npm** installed.
* **Java Development Kit (JDK 17)** installed (Required for building Android apps).
* **Android Studio** installed with Android SDK and Virtual Device (Emulator) set up.
* **Python** installed (for Price Prediction ML model).

---

## 🔑 1. API Key Setup (Government Data)

To fetch real-time Mandi prices, you must register and get an API key from the Open Government Data (OGD) Platform India.

1.  **Register/Login**: Go to [data.gov.in](https://data.gov.in/).
2.  **Navigate to Dataset**: Visit the [Current Daily Price of Various Commodities](https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi) page.
3.  **Get API Key**:
    * Click on the **"API"** button (usually near the download/export options).
    * It will generate an API key for you.
4.  **Configure Backend**:
    * Open your backend `.env` file (`agriflow-backend/.env`).
    * Add your key:
        ```env
        DATA_GOV_API_KEY=your_generated_api_key_here
        ```

---

## 🌐 2. Network Configuration (Connect Mobile to PC)

Since the app runs on your phone and the backend runs on your PC, they must be on the **same Wi-Fi network**. You need to configure the app to talk to your PC's IP address.

1.  **Find your IP Address**:
    * Open Command Prompt (`cmd`) on your PC.
    * Type `ipconfig` and press Enter.
    * Look for **"IPv4 Address"** (e.g., `192.168.1.5` or `10.126.xxx.xx`).

2.  **Update API Configuration**:
    * Open the file: `RythuMart/src/config/api.js`
    * Replace `localhost` or the old IP with your current IPv4 address:

    ```javascript
    // RythuMart/src/config/api.js
    
    // Replace '192.168.1.X' with your actual IPv4 Address from ipconfig
    export const API_URL = '[http://192.168.1.5:5000/api](http://192.168.1.5:5000/api)'; 
    ```

    > **Note:** If your IP changes (e.g., you reconnect to Wi-Fi), you must update this file again.

---

## 📱 3. Android Build Setup (First Time Only)

To use native modules (like Maps or Gesture Handler), you must generate the Android native code and build it once.

### **Step A: Generate Android Folder**
Open a terminal in the `RythuMart` folder and run:
```bash
npx expo prebuild

```

*This creates the `android` folder.*

### **Step B: Configure Local Properties**

1. Navigate to `RythuMart/android/`.
2. Open (or create) the file named `local.properties`.
3. Add your Android SDK path:
* **Windows**: `sdk.dir=C\:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk`
* **Mac/Linux**: `sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk`



### **Step C: Build the Application**

Run this command to compile the app and install it on your emulator/device:

```bash
npx expo run:android

```

*(If this fails, try running `cd android && ./gradlew clean` and try again).*

---

## 🚀 4. Running the Project (Daily Workflow)

Once the setup above is done, use these commands to run the app daily.

### **Terminal 1: Start Backend Server**

```bash
cd agriflow-backend
npm start

```

*Runs `node server.js`. You should see "Server running on port 5000".*

### **Terminal 2: Start Mobile App**

```bash
cd RythuMart
npx expo start

```

* **To run on Android**: Press `a` in the terminal.
* **If you face issues**: Run `npx expo start -c` to clear the cache.

---

## 🛠 Troubleshooting

* **"Network Request Failed"**:
* Verify your phone and PC are on the same Wi-Fi.
* Check if the IP in `api.js` matches `ipconfig`.
* Turn off Windows Firewall temporarily to test connection.


* **"RNGestureHandlerModule not found"**:
* You need to rebuild the native app. Run `npx expo run:android` again.



```

```
