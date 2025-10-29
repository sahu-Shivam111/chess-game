const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Keep track of connected players
let players = { white: null, black: null };
let chess = new Chess();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Chess Game' });
});

io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Assign player roles
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  // Send initial board state
  socket.emit('boardState', chess.fen());

  // Listen for moves
  socket.on("move", (move) => {
    try {
      // Prevent wrong player from moving
      if ((chess.turn() === "w" && socket.id !== players.white) ||
          (chess.turn() === "b" && socket.id !== players.black)) return;

      const result = chess.move(move);

      if (result) {
        io.emit("move", move);
        io.emit("boardState", chess.fen());

        // ✅ If checkmate, reset the game automatically after 5 seconds
        if (chess.in_checkmate()) {
          const winner = chess.turn() === "w" ? "Black" : "White";
          io.emit("gameOver", { winner });

          console.log(`♟️ Game Over! Winner: ${winner}`);

          setTimeout(() => {
            chess = new Chess(); // reset game
            io.emit("boardState", chess.fen());
          }, 5000);
        }
      } else {
        socket.emit("invalidMove", move);
      }

    } catch (err) {
      console.error("Invalid move:", err.message);
      socket.emit("invalidMove", move);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);

    if (socket.id === players.white) players.white = null;
    if (socket.id === players.black) players.black = null;
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
