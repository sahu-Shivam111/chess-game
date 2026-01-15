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


---

## ⚙️ Installation & Setup

1. Clone the repository
git clone https://github.com/your-username/real-time-chess-game.git
2. npm install
3. Start the server
node server.js
4.Open the app
http://localhost:3000

🎮 How It Works

First player joins as White

Second player joins as Black

Moves are validated on the server

Game ends automatically on checkmate, draw, or stalemate

Captured pieces are tracked and displayed in real time


📌 Skills Demonstrated

Real-time application development

WebSocket-based communication

Game state management

Client–server architecture

UI/UX for interactive applications


🤝 Connect

If you like this project or have suggestions, feel free to connect or contribute!

---
If you want, I can also:
- Add **screenshots section**
- Make a **one-page minimal README**
- Customize it for **recruiter / internship focus**
- Add **Render / Netlify deployment instructions**

Just tell me 👍



