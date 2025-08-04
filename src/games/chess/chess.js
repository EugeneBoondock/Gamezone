window.games = window.games || {};

window.games.chess = {
    init: function(container, settings) {
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
            'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
            'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
        };

        function renderBoard() {
            boardElement.innerHTML = '';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const squareName = 'abcdefgh'[c] + (8 - r);
                    const square = document.createElement('div');
                    square.classList.add('chess-square', (r + c) % 2 === 0 ? 'light' : 'dark');
                    square.dataset.square = squareName;

                    const piece = game.get(squareName);
                    if (piece) {
                        const pieceElement = document.createElement('span');
                        pieceElement.classList.add('chess-piece', piece.color === 'w' ? 'white' : 'black');
                        const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
                        pieceElement.textContent = pieceSymbols[symbol];
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
                const result = game.move(move);
                if (result) {
                    if (result.flags.includes('c')) window.soundManager.play('capture');
                    else window.soundManager.play('move');

                    renderBoard();
                    updateStatus(); // Update status immediately for player

                    if (!game.game_over()) {
                        setTimeout(aiTurn, 250);
                    }
                }
                selectedSquare = null;
                // Clear highlights
                boardElement.querySelectorAll('.selected-piece, .valid-move-hint, .capture-move-hint').forEach(el => el.remove());
            } else {
                const piece = game.get(squareName);
                if (piece && piece.color === game.turn()) {
                    selectedSquare = squareName;
                    squareElement.classList.add('selected-piece');
                    const moves = game.moves({ square: squareName, verbose: true });
                    moves.forEach(m => {
                        const targetSquare = boardElement.querySelector(`[data-square='${m.to}']`);
                        const hint = document.createElement('div');
                        hint.classList.add(m.flags.includes('c') ? 'capture-move-hint' : 'valid-move-hint');
                        targetSquare.appendChild(hint);
                    });
                }
            }
        }

        function evaluateBoard(gameInstance) {
            let totalEvaluation = 0;
            const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 900 };
            game.SQUARES.forEach(s => {
                const piece = gameInstance.get(s);
                if(piece) {
                    totalEvaluation += pieceValues[piece.type] * (piece.color === 'w' ? 1 : -1);
                }
            });
            return totalEvaluation;
        }

        function minimax(gameInstance, depth, alpha, beta, maximizingPlayer) {
            if (depth === 0 || gameInstance.game_over()) {
                return [null, evaluateBoard(gameInstance)];
            }

            const moves = gameInstance.moves({ verbose: true });
            let bestMove = null;
            let bestValue = maximizingPlayer ? -Infinity : Infinity;

            for (const move of moves) {
                gameInstance.move(move.san);
                const [_, value] = minimax(gameInstance, depth - 1, alpha, beta, !maximizingPlayer);
                gameInstance.undo();

                if (maximizingPlayer ? value > bestValue : value < bestValue) {
                    bestValue = value;
                    bestMove = move.san;
                }
                if (maximizingPlayer) alpha = Math.max(alpha, bestValue);
                else beta = Math.min(beta, bestValue);

                if (beta <= alpha) break;
            }
            return [bestMove, bestValue];
        }

        function aiTurn() {
            if (game.game_over()) return;

            statusDisplay.textContent = "AI is thinking...";
            const difficultyMap = { easy: 1, medium: 2, hard: 3 };
            const depth = difficultyMap[settings.difficulty] || 2;

            const [bestMove, _] = minimax(game, depth, -Infinity, Infinity, false);

            if (bestMove) {
                game.move(bestMove);
            } else {
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

        function destroy() {
            boardElement.removeEventListener('click', handleSquareClick);
        }

        return destroy;
    }
};
