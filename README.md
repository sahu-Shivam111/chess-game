# ♟️ Real-Time Multiplayer Chess Game

A real-time online chess game where two players can play against each other with live move synchronization, turn handling, captured piece tracking, and game-over detection.

---

## 🚀 Features

- Real-time multiplayer gameplay using **Socket.IO**
- Automatic player role assignment (White / Black)
- Drag-and-drop chess pieces with move validation
- Server-side chess logic (legal moves, check, checkmate, draw)
- Live turn indicator and game status updates
- Captured pieces display for both players
- Board rotation for black player
- Game restart and auto-reset after game over
- Responsive UI

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, Tailwind CSS, JavaScript  
- **Backend:** Node.js, Express.js  
- **Real-Time Communication:** Socket.IO  
- **Game Logic:** chess.js  

---

## 📂 Project Structure
project-root/
│
├── public/
│ ├── client.js # Frontend game logic
│ ├── style.css # Styling
│
├── views/
│ └── index.ejs # Game UI
│
├── server.js # Backend & Socket.IO logic
├── package.json
└── README.md

