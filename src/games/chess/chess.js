window.games = window.games || {};

window.games.chess = {
    init: function(container, settings) {
        // --- Game Setup ---
        const game = new Chess();
        let stockfish = null;
        let draggedPiece = null;
        let sourceSquare = null;

        container.innerHTML = `
            <div class="chess-container">
                <div id="chess-board" style="width: 400px; height: 400px; display: flex; flex-wrap: wrap;"></div>
                <div id="chess-status" style="margin-top: 10px;"></div>
            </div>`;
        const statusEl = container.querySelector('#chess-status');
        const boardEl = container.querySelector('#chess-board');

        const pieceSymbols = {
            'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
            'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
        };

        function renderBoard() {
            boardEl.innerHTML = '';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const squareName = 'abcdefgh'[c] + (8 - r);
                    const square = document.createElement('div');
                    square.classList.add('chess-square', (r + c) % 2 === 0 ? 'light' : 'dark');
                    square.dataset.square = squareName;

                    const piece = game.get(squareName);
                    if (piece) {
                        const pieceEl = document.createElement('span');
                        pieceEl.classList.add('chess-piece', piece.color === 'w' ? 'white' : 'black');
                        const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
                        pieceEl.textContent = pieceSymbols[symbol];
                        pieceEl.draggable = true;
                        square.appendChild(pieceEl);
                    }
                    boardEl.appendChild(square);
                }
            }
            updateStatus();
        }

        function updateStatus() { /* ... same as before ... */ }
        function getBestMove() { /* ... same as before ... */ }

        // --- Drag and Drop Handlers ---
        boardEl.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('chess-piece')) {
                sourceSquare = e.target.parentElement.dataset.square;
                draggedPiece = e.target;
                setTimeout(() => e.target.style.display = 'none', 0);
            }
        });

        boardEl.addEventListener('dragend', (e) => {
            if (draggedPiece) {
                draggedPiece.style.display = 'block';
                draggedPiece = null;
                sourceSquare = null;
            }
        });

        boardEl.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        boardEl.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('chess-square')) {
                const targetSquare = e.target.dataset.square;
                const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });

                if (move) {
                    window.soundManager.play(move.flags.includes('c') ? 'capture' : 'move');
                    if (!game.game_over()) setTimeout(getBestMove, 250);
                }
                renderBoard(); // Re-render the entire board
            }
        });


        // --- Stockfish Initialization ---
        fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
            .then(res => res.text())
            .then(text => {
                const blob = new Blob([text], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                stockfish = new Worker(url);
                stockfish.onmessage = function(event) {
                    const message = event.data;
                    if (message.startsWith('bestmove')) {
                        const bestMove = message.split(' ')[1];
                        game.move(bestMove, { sloppy: true });
                        renderBoard();
                        window.soundManager.play('move');
                    }
                };
                stockfish.postMessage('uci');
            });

        renderBoard();

        function destroy() {
            if (stockfish) stockfish.terminate();
            // Remove event listeners if needed
        }

        return destroy;
    }
};
