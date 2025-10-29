const express = require('express');
const http = require('http');
const socket = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io =  socket(server);

const chess = new Chess();

let players = { white: null, black: null };
let currentPlayer = "w";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign role
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

    // Move handling
    socket.on("move", (move) => {
        try {
            if ((chess.turn() === "w" && socket.id !== players.white) ||
                (chess.turn() === "b" && socket.id !== players.black)) return;

            const result = chess.move(move);
            if (result) { 
                currentPlayer = chess.turn();
                 io.emit("move", move);
                  io.emit("boardState", chess.fen());
            }
            else{
                console.log("Invalid move ",move);
                socket.emit("invalidMove",move);
            }
        } catch (err) {
            console.log('Invalid move:', err.message);
            socket.emit("Invalid move:",move);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.id === players.white) delete players.white;
        else if (socket.id === players.black) delete players.black;
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));