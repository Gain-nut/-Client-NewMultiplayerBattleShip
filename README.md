# 🎮 New Multiplayer Battleship — Client (React)

This is the **React frontend client** for the New Multiplayer Battleship game.

It connects to the server using **Socket.IO** with **IP-based matchmaking**, allowing players to place ships, chat with emojis, customize ship skins, and battle in real time.

-----

## 🚀 Features

### 🎯 Core Gameplay

  * **Real-time multiplayer Battleship**
  * **Drag-and-drop ship placement** (using `react-dnd`)
  * **Turn-based firing system**
  * **Hit / miss animations** via custom canvas particle effects
  * **Live sync with backend** through WebSockets
  * **Automatic detection** of opponent disconnects

### 💬 Extra Features

  * **Emoji chat**
  * **IP-based matchmaking** — enter server IP to join
  * **Ship skin customization**
  * **Round-based game loop** (Ready → Play → Next Round)

-----

## 🔌 Socket.IO Integration

The client connects to the server using the **IP provided by the player**.

### Client → Server Events

  * `join-game`
  * `place-ships`
  * `fire-shot`
  * `ready-for-next-round`

### Server → Client Events

  * `update-game-state`
  * `player-disconnect`
  * `game-reset`

-----

## 📁 Project Structure

```
/src
 ├── App.js          # Main UI + game flow
 ├── Game.js         # Board rendering & interactions
 ├── effects.js      # Canvas particle effects (fire / debris)
 ├── socket.js       # Socket.IO client setup
 ├── App.css         # Styling
 └── index.js        # App entry point
```

-----

## 🎆 Visual Effects System

A **custom canvas-based particle engine** powers the hit/miss visuals:

  * **Fire burst effects**
  * **Debris / splash particles**
  * **Cell-based animation spawning**

Creates a more immersive and dynamic gameplay experience.

-----

## ▶️ Getting Started

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Run the client

```bash
npm start
```

### 3️⃣ Open the game

```
http://localhost:3000
```

Enter the **server’s IP** when prompted to join a match.

-----

## 🔗 Backend Repository

The **Node.js + Express + Socket.IO game server** is hosted in a [separate repository](https://www.google.com/search?q=LINK_TO_BACKEND_REPO_HERE).

**Ensure the server is running before launching the client.**

-----
