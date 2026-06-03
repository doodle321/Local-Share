# Local-Share

<img width="1365" height="767" alt="Screenshot 2026-06-03 7 15 11 PM" src="https://github.com/user-attachments/assets/3acbab77-efbb-446a-aa76-b9ea337c7bb6" />

A lightweight, real-time file and text sharing web application designed for local networks (LAN). "Local Share" connects all devices on the same network, allowing instantaneous, dynamic data sharing without requiring page refreshes. When text or files are updated on one device, the changes reflect across all other connected devices instantly.


# Features
- Real-Time Syncing: Uses WebSockets to broadcast changes instantly across the local network.
- Zero Refreshes: Content updates dynamically without reloading the page
- Cross-Platform: Share text and files seamlessly between PCs, smartphones, and tablets.

## 1. Prerequisites & Installation
To run this application, you need to have Node.js and npm installed on your system.

 ### 1. Install Node.js and npm
 If you don't have Node.js installed:
  - Windows/macOS: Download and run the installer from [Node.js](https://nodejs.org).

  - Linux (Debian/Ubuntu): Run the following commands in your terminal:
```
  sudo apt update
  sudo apt install nodejs npm
```

### 2. Set Up the Project
Clone or download this repository, navigate to the project folder, and initialize it:
```
  git clone https://github.com/doodle321/Local-Share.git
  cd LocalShare 
  npm init -y
```

### 3. Install Dependencies (Socket.io) 
This project relies on socket.io for handling the real-time, bi-directional communication channels. Install it via npm:
```
npm install socket.io express
```
## Running the Application
The main application logic is contained within the localshare.js file included in this repository.

### 1. Start the Server 

Run the application using Node.js:

```
node localshare.js
```
### 2. Access the Web App
Once the server is running, it will output the port number (e.g., Server running on port 3000).

On the host machine: Open your browser and go to http://localhost:3000

On other local devices: Find the host machine's local IP address (e.g., 192.168.1.10) and connect via http://<host-ip>:3000
