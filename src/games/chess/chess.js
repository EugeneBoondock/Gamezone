window.games = window.games || {};

window.games.chess = {
    init: function(container, settings) {
        // --- Game Setup ---
        const game = new Chess();
        let board = null;
        let stockfish = null;

        container.innerHTML = `
            <div class="chess-container">
                <div id="chess-board" style="width: 400px"></div>
                <div id="chess-status" style="margin-top: 10px;"></div>
            </div>`;
        const statusEl = container.querySelector('#chess-status');
        const boardEl = container.querySelector('#chess-board');

        function onDragStart(source, piece) {
            return !game.game_over() &&
                   game.turn() === 'w' &&
                   piece.search(/^b/) === -1;
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
                        updateStatus();
                        window.soundManager.play('move');
                    }
                };
                stockfish.postMessage('uci');
                updateStatus();
            });

        const config = {
            draggable: true,
            position: 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd,
            pieceTheme: 'https://cdn.jsdelivr.net/npm/@lichess-org/chessground@8.4.2/assets/pieces/merida/{piece}.svg'
        };
        board = Chessboard(boardEl, config);
        updateStatus();

        function destroy() {
            if (stockfish) {
                stockfish.terminate();
            }
        }

        return destroy;
    }
};
