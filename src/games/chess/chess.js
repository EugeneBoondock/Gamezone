window.games = window.games || {};

window.games.chess = {
    init: function(container, settings) {
        // --- Game Setup ---
        const game = new Chess();
        let board = null;
        let stockfish = null;

        container.innerHTML = `
            <div class="chess-container">
                <div id="chess-board" style="width: 400px; position: relative;"></div>
                <div id="chess-status" style="margin-top: 10px;"></div>
            </div>`;
        const statusEl = container.querySelector('#chess-status');
        const boardEl = container.querySelector('#chess-board');

        // --- Rendering Unicode Pieces ---
        const pieceSymbols = {
            'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
            'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
        };

        function renderUnicodePieces() {
            boardEl.querySelectorAll('.unicode-piece-container').forEach(e => e.remove());
            const squares = game.SQUARES;
            for (const squareName of squares) {
                const piece = game.get(squareName);
                if (piece) {
                    const squareEl = boardEl.querySelector(`.square-${squareName}`);
                    if (squareEl) {
                        const pieceEl = document.createElement('div');
                        pieceEl.classList.add('unicode-piece-container');
                        const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
                        pieceEl.innerHTML = `<span class="chess-piece ${piece.color === 'w' ? 'white' : 'black'}">${pieceSymbols[symbol]}</span>`;
                        squareEl.appendChild(pieceEl);
                    }
                }
            }
        }

        // --- Event Handlers for chessboard.js ---
        function onDragStart(source, piece) {
            return !game.game_over() && game.turn() === 'w' && piece.search(/^b/) === -1;
        }

        function onDrop(source, target) {
            const move = game.move({ from: source, to: target, promotion: 'q' });
            if (move === null) return 'snapback';

            window.soundManager.play(move.flags.includes('c') ? 'capture' : 'move');
            updateStatus();

            if (!game.game_over()) {
                setTimeout(getBestMove, 250);
            }
        }

        function onSnapEnd() {
            board.position(game.fen());
            renderUnicodePieces();
        }

        function updateStatus() {
            let statusText = '';
            const turn = game.turn() === 'w' ? 'White' : 'Black';

            if (game.in_checkmate()) {
                statusText = `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins.`;
                window.soundManager.play('win');
            } else if (game.in_draw()) {
                statusText = 'Draw!';
                window.soundManager.play('lose');
            } else {
                statusText = `${turn}'s Turn`;
                if (game.in_check()) {
                    statusText += ' - Check!';
                }
            }
            statusEl.textContent = statusText;
        }

        function getBestMove() {
            statusEl.textContent = "AI is thinking...";
            stockfish.postMessage('position fen ' + game.fen());
            const depth = settings.difficulty === 'hard' ? 12 : settings.difficulty === 'medium' ? 8 : 4;
            stockfish.postMessage('go depth ' + depth);
        }

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
                        board.position(game.fen());
                        renderUnicodePieces();
                        updateStatus();
                        window.soundManager.play('move');
                    }
                };
                stockfish.postMessage('uci');
                updateStatus();
            });

        // --- Chessboard.js Configuration ---
        const config = {
            draggable: true,
            position: 'clear', // Start with an empty board to prevent loading piece images
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        };
        board = Chessboard(boardEl, config);
        board.position(game.fen()); // Set the starting position from chess.js

        // Initial render of pieces
        setTimeout(renderUnicodePieces, 200);

        // --- Cleanup ---
        function destroy() {
            if (stockfish) stockfish.terminate();
        }

        return destroy;
    }
};
