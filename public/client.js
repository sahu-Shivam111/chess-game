const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const playerRoleText = document.getElementById("player-role");
const turnIndicator = document.getElementById("turn-indicator");
const statusText = document.getElementById("status");

let playerRole = null;
let gameReady = false;

// Store captured pieces locally (persisted)
let capturedWhite = JSON.parse(sessionStorage.getItem("capturedWhite")) || [];
let capturedBlack = JSON.parse(sessionStorage.getItem("capturedBlack")) || [];

// ♟ Unicode map
const pieceSymbols = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
};




// 🧩 Render captured pieces
function renderCaptured() {
  const whiteDiv = document.getElementById("whiteCaptured");
  const blackDiv = document.getElementById("blackCaptured");

  whiteDiv.innerHTML = capturedWhite.map(p => pieceSymbols[p]).join(" ");
  blackDiv.innerHTML = capturedBlack.map(p => pieceSymbols[p]).join(" ");
}

function highlightKing(color) {
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === color) {
        const file = "abcdefgh"[c];
        const rank = 8 - r;
        const sq = `${file}${rank}`;
        const el = document.querySelector(`[data-square="${sq}"]`);
        if (el) el.classList.add("in-check");
      }
    }
  }
}


// When in check
socket.on("check", ({ colorInCheck }) => {
  const side = colorInCheck; // 'w' or 'b'
  highlightKing(side);
  const name = side === "w" ? "White" : "Black";
  const ti = document.getElementById("turn-indicator");
  if (ti) {
    ti.textContent = `Turn: ${name} — Check!`;
    ti.style.color = "red";
  }
});

// Clear check highlight
socket.on("clearCheck", () => {
  document.querySelectorAll(".in-check").forEach(el => el.classList.remove("in-check"));
  const ti = document.getElementById("turn-indicator");
  if (ti) {
    ti.style.color = "#FFFF0079";
  }
});

// When game is over
socket.on("gameOver", ({ winner, reason }) => {
  const status = document.getElementById("status");
  if (status) {
    status.textContent = `${winner} wins — ${reason}`;
  }
  const ti = document.getElementById("turn-indicator");
  if (ti) {
    ti.textContent = `Game Over (${reason})`;
    ti.style.color = "gold";
  }
});


// ♜ Render board
function renderBoard() {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const div = document.createElement("div");
      const color = (rowIndex + colIndex) % 2 === 0 ? "light" : "dark";
      div.classList.add("square", color);

      const file = "abcdefgh"[colIndex];
      const rank = 8 - rowIndex;
      const squareNotation = `${file}${rank}`;
      div.dataset.square = squareNotation;

      if (square) {
        const piece = document.createElement("div");
        piece.textContent = pieceSymbols[
          square.color === "w" ? square.type.toUpperCase() : square.type
        ];
        piece.classList.add("piece", square.color);

        // ✅ Allow dragging only for your pieces and your turn
       const isPlayerTurn = gameReady && chess.turn() === playerRole;
const canDrag = square.color === playerRole && isPlayerTurn;

        piece.draggable = canDrag;

        if (canDrag) {
          piece.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("source", squareNotation);
          });
        }

        div.appendChild(piece);
      }

      div.addEventListener("dragover", (e) => e.preventDefault());
      div.addEventListener("drop", (e) => {
        const source = e.dataTransfer.getData("source");
        const target = e.target.dataset.square || e.target.parentNode.dataset.square;
        if (source && target && source !== target) {
          handleMove(source, target);
        }
      });

      boardElement.appendChild(div);
    });
  });

  // Flip for black
  if (playerRole === "b") boardElement.classList.add("flipped");
  else boardElement.classList.remove("flipped");

  renderCaptured();
}

// 🕹 Handle move
function handleMove(source, target) {
  if (!gameReady) return;
  socket.emit("move", { from: source, to: target, promotion: "q" });
}

// ⚡ SOCKET EVENTS

socket.on("playerRole", (role) => {
  playerRole = role;
  playerRoleText.textContent = `You are: ${role === "w" ? "White" : "Black"}`;
  statusText.textContent = "Connecting...";
  turnIndicator.textContent = "";
});

socket.on("waiting", (msg) => {
  statusText.textContent = msg;
  gameReady = false;
});

socket.on("message", (msg) => {
  statusText.textContent = msg;
  if (msg.includes("start")) {
    gameReady = true;
  }
});

socket.on("boardState", (fen) => {
  chess.load(fen);

  gameReady = true;
  renderBoard();
  const turn = chess.turn() === "w" ? "White" : "Black";
  turnIndicator.textContent = `Turn: ${turn}`;
});

socket.on("noMoves", ({ sideToMove }) => {
  const name = sideToMove === 'w' ? 'White' : 'Black';
  const status = document.getElementById('status');
  if (status) status.textContent = `${name} has no legal moves left.`;
});

socket.on("pieceCaptured", ({ capturedBy, capturedOf, capturedType }) => {
  // Store piece in the correct array
  if (capturedOf === "white") {
    capturedWhite.push(capturedType);
  } else if (capturedOf === "black") {
    capturedBlack.push(capturedType);
  }

  // Save updated lists in session storage
  sessionStorage.setItem("capturedWhite", JSON.stringify(capturedWhite));
  sessionStorage.setItem("capturedBlack", JSON.stringify(capturedBlack));

  // Re-render captured pieces on screen
  renderCaptured();
});




socket.on("gameOver", ({ winner, reason }) => {
  if (reason === "Checkmate") {
    statusText.textContent = `Checkmate! ${winner} wins!`;
  } else if (reason === "Stalemate") {
    statusText.textContent = "Stalemate! It's a draw.";
  } else if (reason === "Draw") {
    statusText.textContent = "Draw by rule.";
  }

  gameReady = false;

  // Clear captured after 5s (new game)
  setTimeout(() => {
    capturedWhite = [];
    capturedBlack = [];
    sessionStorage.clear();
    renderCaptured();
  }, 5000);
});

// ♻️ Restart manually
const restartBtn = document.getElementById("restartBtn");
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    sessionStorage.clear();
    capturedWhite = [];
    capturedBlack = [];
    socket.emit("restartGame");
  });
}
