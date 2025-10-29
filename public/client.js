const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const playerRoleText = document.getElementById("player-role");
const turnIndicator = document.getElementById("turn-indicator");

let playerRole = null;

let whiteCapturedPieces = [];
let blackCapturedPieces = [];


// ✅ Helper — get Unicode piece symbol
function getPieceUnicode(piece) {
  const unicodePieces = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
  };
  return unicodePieces[piece] || "";
}

// ✅ Helper — find a king’s square
function getKingSquare(color) {
  const board = chess.board();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === "k" && piece.color === color) {
        const file = "abcdefgh"[col];
        const rank = 8 - row;
        return `${file}${rank}`;
      }
    }
  }
  return null;
}

function updateCapturedUI() {
  const whiteCapturedDiv = document.getElementById('whiteCaptured');
  const blackCapturedDiv = document.getElementById('blackCaptured');

  whiteCapturedDiv.innerHTML = whiteCapturedPieces.join(' ');
  blackCapturedDiv.innerHTML = blackCapturedPieces.join(' ');


  sessionStorage.setItem('whiteCaptured', JSON.stringify(whiteCapturedPieces));
  sessionStorage.setItem('blackCaptured', JSON.stringify(blackCapturedPieces));
}






// ✅ Render board each update
function renderBoard() {
  const board = chess.board();
  boardElement.innerHTML = "";

  // find king in check
  let inCheckColor = null;
  if (chess.in_check()) {
    // the side to move is IN check
    inCheckColor = chess.turn();
  }
  const kingSquareInCheck = inCheckColor ? getKingSquare(inCheckColor) : null;

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement("div");
      const squareColor = (rowIndex + colIndex) % 2 === 0 ? "light" : "dark";
      squareElement.classList.add("square", squareColor);

      const file = "abcdefgh"[colIndex];
      const rank = 8 - rowIndex;
      const squareNotation = `${file}${rank}`;
      squareElement.dataset.square = squareNotation;

      // add piece
      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.textContent = getPieceUnicode(
          square.color === "w" ? square.type.toUpperCase() : square.type
        );
        pieceElement.classList.add("piece", square.color);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (chess.turn() !== playerRole) return e.preventDefault();
          e.dataTransfer.setData("source", squareNotation);
          e.target.classList.add("dragging");
        });

        pieceElement.addEventListener("dragend", (e) => {
          e.target.classList.remove("dragging");
        });

        squareElement.appendChild(pieceElement);
      }

      // ✅ Highlight king if in check
      if (squareNotation === kingSquareInCheck) {
        squareElement.classList.add("in-check");
      }

      squareElement.addEventListener("dragover", (e) => e.preventDefault());
      squareElement.addEventListener("drop", (e) => {
        const source = e.dataTransfer.getData("source");
        const target = e.target.dataset.square || e.target.parentNode.dataset.square;
        handleMove(source, target);
      });

      boardElement.appendChild(squareElement);
    });
  });

  // Flip for black player
  if (playerRole === "b") boardElement.classList.add("flipped");
  else boardElement.classList.remove("flipped");

  // update display
  updateGameInfo();
}

// ✅ Update status text
function updateGameInfo() {
  // your color
  if (playerRole === "w") playerRoleText.textContent = "You are: White";
  else if (playerRole === "b") playerRoleText.textContent = "You are: Black";
  else playerRoleText.textContent = "You are: Spectator";

  // whose turn
  const turn = chess.turn() === "w" ? "White" : "Black";
  turnIndicator.textContent = `Turn: ${turn}`;
  turnIndicator.style.color = turn === "White" ? "#fff" : "#000";

  // check
  if (chess.in_check()) {
    const checkedSide = chess.turn() === "w" ? "White" : "Black";
    turnIndicator.textContent = `Turn: ${turn} — ${checkedSide} is in Check!`;
    turnIndicator.style.color = "red";
  }

  // checkmate
  if (chess.in_checkmate()) {
    const loser = chess.turn() === "w" ? "White" : "Black";
    const winner = loser === "White" ? "Black" : "White";
    turnIndicator.textContent = `Checkmate! ${winner} wins!`;
    turnIndicator.style.color = "red";
  }
  updateCapturedUI();

}

// ✅ Handle move drag/drop
function handleMove(source, target) {
  const move = chess.move({ from: source, to: target, promotion: "q" });

  // invalid move
  if (move === null) return false;

  // send move to server
  socket.emit("move", move);

  // check if a piece was captured
  if (move.captured) {
    if (move.color === "w") {
      // white moved, so black’s piece got captured
      blackCapturedPieces.push(getPieceUnicode(move.captured));
    } else {
      // black moved, so white’s piece got captured
      whiteCapturedPieces.push(getPieceUnicode(move.captured.toUpperCase()));
    }
  }

  renderBoard();  // re-render the updated board
  updateCapturedUI();  // show captured pieces
  updateGameInfo(); // show check, turn, etc.
  return true;
}

window.addEventListener("load", () => {
  const savedWhite = sessionStorage.getItem('whiteCaptured');
  const savedBlack = sessionStorage.getItem('blackCaptured');

  if (savedWhite) whiteCapturedPieces = JSON.parse(savedWhite);
  if (savedBlack) blackCapturedPieces = JSON.parse(savedBlack);

  updateCapturedUI(); // show them immediately
  renderBoard();
});


// ✅ Socket listeners
socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
  
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  const result = chess.move(move);
  if (result && result.captured) {
    if (result.color === "w") {
      blackCapturedPieces.push(getPieceUnicode(result.captured));
    } else {
      whiteCapturedPieces.push(getPieceUnicode(result.captured.toUpperCase()));
    }
     updateCapturedUI();
  }
  renderBoard();
  
});

socket.on("gameOver", ({ winner }) => {
  alert(` Checkmate! ${winner} wins!`);
});


// initial

