const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Chess Game' });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Each room: { white, black, chess, gameOver }
const games = {};

io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Find a waiting room (no black player)
  let room = Object.keys(games).find((r) => !games[r].black);

  if (!room) {
    // Create new room and assign White
    room = `room-${socket.id}`;
    games[room] = {
      white: socket.id,
      black: null,
      chess: new Chess(),
      gameOver: false,
    };
    socket.join(room);
    socket.data.room = room;
    socket.emit("playerRole", "w");
    socket.emit("waiting", "Connecting...");
    console.log(`🎯 New room created: ${room} (White joined)`);
  } else {
    // Join as Black
    games[room].black = socket.id;
    socket.join(room);
    socket.data.room = room;
    socket.emit("playerRole", "b");

    // Notify both players the game is ready
    io.to(room).emit("boardState", games[room].chess.fen());
    io.to(room).emit("message", "Opponent connected! Game start 🏁");
    console.log(`⚫ ${room}: Black joined`);
  }

  // ✅ Move handling
  socket.on("move", (move) => {
    const room = socket.data.room;
    if (!room || !games[room]) return;

    const game = games[room];
    if (game.gameOver) return;

    const chess = game.chess;

    // ❌ ignore invalid self-move (like from=f6, to=f6)
    if (!move || move.from === move.to) return;

    // Validate correct turn
    if ((chess.turn() === "w" && socket.id !== game.white) ||
        (chess.turn() === "b" && socket.id !== game.black)) return;

    try {
      const result = chess.move(move);
      if (!result) return;

      // Broadcast captured pieces
     // after result = chess.move(move)
if (result && result.captured) {
  // result.color → 'w' (white moved) or 'b' (black moved)
  // result.captured → lowercase piece type ('p', 'n', etc.)

  const capturedBy = result.color; // 'w' or 'b'
  const capturedOf = capturedBy === 'w' ? 'black' : 'white';

  io.to(room).emit("pieceCaptured", {
    capturedBy,       // 'w' or 'b' — who made the capture
    capturedOf,       // 'white' or 'black' — whose piece was captured
    capturedType: result.captured // 'p', 'r', 'n', 'b', 'q', or 'k'
  });
}



      // Update board state
     // --- after you emit boardState ---
io.to(room).emit("boardState", chess.fen());

// --- robust helpers for different chess.js versions ---
const turnNow = chess.turn(); // color whose turn it is *after* the move

if (chess.isCheckmate()) {
  const winner = turnNow === "w" ? "Black" : "White"; // opposite side wins
  io.to(room).emit("gameOver", { winner, reason: "Checkmate" });
  game.gameOver = true;
} else if (chess.isStalemate()) {
  io.to(room).emit("gameOver", { winner: "Draw", reason: "Stalemate" });
  game.gameOver = true;
} else if (chess.isDraw()) {
  io.to(room).emit("gameOver", { winner: "Draw", reason: "Draw" });
  game.gameOver = true;
} else {
  // Send check state only if the game is not over
  const inCheckNow = (typeof chess.in_check === 'function') ? chess.in_check() : (typeof chess.inCheck === 'function' ? chess.inCheck() : false);
  if (inCheckNow) {
    io.to(room).emit("check", { colorInCheck: chess.turn() });
  } else {
    // tell clients to clear check indicators
    io.to(room).emit("clearCheck");
  }
}


      // Auto reset 5s later
      if (game.gameOver) {
        setTimeout(() => {
          games[room].chess = new Chess();
          games[room].gameOver = false;
          io.to(room).emit("boardState", games[room].chess.fen());
          io.to(room).emit("message", "♻️ New game started!");
          io.to(room).emit("clearCheck");
        }, 5000);
      }
    } catch (err) {
      console.log("⚠️ Invalid move ignored:", move);
    }
  });


  
  // ✅ Manual restart
  socket.on("restartGame", () => {
    const room = socket.data.room;
    if (!room || !games[room]) return;

    games[room].chess = new Chess();
    games[room].gameOver = false;
    io.to(room).emit("boardState", games[room].chess.fen());
    io.to(room).emit("message", "♻️ Game restarted!");
  });

  // ✅ Handle disconnects cleanly
  socket.on('disconnect', () => {
    const room = socket.data.room;
    console.log('❌ Disconnected:', socket.id);

    if (room && games[room]) {
      io.to(room).emit("message", "Opponent disconnected. Waiting for new player...");
      delete games[room];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
