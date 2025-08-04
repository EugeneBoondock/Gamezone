window.games = window.games || {};

window.games.chess = {
    init: function(container, difficulty) {
        // --- Game Setup ---
        console.log("Chess library constructor:", typeof Chess);
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
                    if (result.flags.includes('c')) {
                        window.soundManager.play('capture');
                    } else {
                        window.soundManager.play('move');
                    }
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

        function evaluateBoard(board) {
            let totalEvaluation = 0;
            const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (board[i][j]) {
                        totalEvaluation += (pieceValues[board[i][j].type] || 0) * (board[i][j].color === 'w' ? 1 : -1);
                    }
                }
            }
            return totalEvaluation;
        }

        function minimax(game, depth, alpha, beta, maximizingPlayer) {
            if (depth === 0 || game.game_over()) {
                return [null, evaluateBoard(game.board())];
            }

            const moves = game.moves({ verbose: true });
            let bestMove = null;
            let bestValue = maximizingPlayer ? -Infinity : Infinity;

            for (const move of moves) {
                game.move(move.san);
                const [_, value] = minimax(game, depth - 1, alpha, beta, !maximizingPlayer);
                game.undo();

                if (maximizingPlayer) {
                    if (value > bestValue) {
                        bestValue = value;
                        bestMove = move.san;
                    }
                    alpha = Math.max(alpha, bestValue);
                } else {
                    if (value < bestValue) {
                        bestValue = value;
                        bestMove = move.san;
                    }
                    beta = Math.min(beta, bestValue);
                }
                if (beta <= alpha) {
                    break;
                }
            }
            return [bestMove, bestValue];
        }

        function aiTurn() {
            if (game.game_over()) return;

            const difficultyMap = { easy: 1, medium: 2, hard: 3 };
            const depth = difficultyMap[difficulty] || 2;

            const [bestMove, _] = minimax(game, depth, -Infinity, Infinity, false);

            if (bestMove) {
                game.move(bestMove);
            } else {
                // Failsafe: if minimax returns no move, pick a random one
                const moves = game.moves();
                game.move(moves[Math.floor(Math.random() * moves.length)]);
            }

            renderBoard();
            updateStatus();
        }

        function updateStatus() {
            let status = '';
            const turn = game.turn() === 'w' ? 'White' : 'Black';

            if (game.in_checkmate()) {
                status = `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins.`;
                window.soundManager.play('win');
            } else if (game.in_draw()) {
                status = 'Draw!';
                window.soundManager.play('lose');
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
