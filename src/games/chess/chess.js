window.games = window.games || {};

window.games.chess = {
    init: function(container, difficulty) {
        // --- Game Setup ---
        const game = new Chess();
        container.innerHTML = `
            <div class="chess-container">
                <div id="chess-status">White's Turn</div>
                <div id="chess-board"></div>
            </div>
        `;
        const boardElement = container.querySelector('#chess-board');
        const statusDisplay = container.querySelector('#chess-status');
        let selectedSquare = null;

        const pieceSymbols = {
            'p': '♙', 'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔',
            'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚'
        };

        function renderBoard() {
            boardElement.innerHTML = '';
            const board = game.board();
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const square = document.createElement('div');
                    const squareName = 'abcdefgh'[c] + (8 - r);
                    square.classList.add('chess-square', (r + c) % 2 === 0 ? 'light' : 'dark');
                    square.dataset.square = squareName;

                    if (board[r][c]) {
                        const piece = board[r][c];
                        const pieceElement = document.createElement('span');
                        pieceElement.classList.add('chess-piece', piece.color === 'w' ? 'white' : 'black');
                        pieceElement.textContent = pieceSymbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
                        square.appendChild(pieceElement);
                    }
                    boardElement.appendChild(square);
                }
            }
        }

        function handleSquareClick(e) {
            const squareElement = e.target.closest('.chess-square');
            if (!squareElement) return;
            const squareName = squareElement.dataset.square;

            if (selectedSquare) {
                const move = { from: selectedSquare, to: squareName, promotion: 'q' };
                const result = game.move(move, { sloppy: true });
                if (result) {
                    renderBoard();
                    setTimeout(aiTurn, 250);
                }
                selectedSquare = null;
                // Clear highlights
                boardElement.querySelectorAll('.selected-piece, .valid-move-hint, .capture-move-hint').forEach(el => el.classList.remove('selected-piece', 'valid-move-hint', 'capture-move-hint'));
            } else {
                const piece = game.get(squareName);
                if (piece && piece.color === game.turn()) {
                    selectedSquare = squareName;
                    squareElement.classList.add('selected-piece');
                    // Highlight valid moves
                    const moves = game.moves({ square: squareName, verbose: true });
                    moves.forEach(m => {
                        const targetSquare = boardElement.querySelector(`[data-square='${m.to}']`);
                        const hint = document.createElement('div');
                        hint.classList.add(m.flags.includes('c') ? 'capture-move-hint' : 'valid-move-hint');
                        targetSquare.appendChild(hint);
                    });
                }
            }
            updateStatus();
        }

        function aiTurn() {
            if (game.game_over()) return;

            const moves = game.moves();
            // AI difficulty implementation can be very complex. This is a placeholder.
            const move = moves[Math.floor(Math.random() * moves.length)];
            game.move(move);
            renderBoard();
            updateStatus();
        }

        function updateStatus() {
            let status = '';
            const turn = game.turn() === 'w' ? 'White' : 'Black';

            if (game.in_checkmate()) {
                status = `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins.`;
            } else if (game.in_draw()) {
                status = 'Draw!';
            } else {
                status = `${turn}'s Turn`;
                if (game.in_check()) {
                    status += ' - Check!';
                }
            }
            statusDisplay.textContent = status;
        }

        // --- Initialisation & Event Listeners ---
        renderBoard();
        boardElement.addEventListener('click', handleSquareClick);

        // --- Cleanup ---
        function destroy() {
            console.log("Destroying Chess game.");
            boardElement.removeEventListener('click', handleSquareClick);
        }

        return destroy;
    }
};
