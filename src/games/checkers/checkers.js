window.games = window.games || {};

window.games.checkers = {
    init: function(container, difficulty) {
        // --- Game Setup ---
        container.innerHTML = `
            <div class="checkers-container">
                <div id="checkers-status">Your Turn</div>
                <div id="checkers-board"></div>
            </div>
        `;
        const boardElement = container.querySelector('#checkers-board');
        const statusDisplay = container.querySelector('#checkers-status');
        const boardSize = 8;
        let boardState = []; // 0: empty, 1: player1, 2: player2, >2: king
        let currentPlayer = 1;
        let selectedPiece = null; // { row, col }
        let mustCapture = false;

        // --- Board & Game Logic ---
        function createBoard() {
            boardState = Array(boardSize).fill(0).map(() => Array(boardSize).fill(0));
            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    if ((row + col) % 2 !== 0) { // Dark squares
                        if (row < 3) boardState[row][col] = 2; // AI pieces
                        if (row > 4) boardState[row][col] = 1; // Player pieces
                    }
                }
            }
        }

        function renderBoard() {
            boardElement.innerHTML = '';
            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    const square = document.createElement('div');
                    square.classList.add('checkers-square', (row + col) % 2 === 0 ? 'light' : 'dark');
                    square.dataset.row = row;
                    square.dataset.col = col;

                    const pieceValue = boardState[row][col];
                    if (pieceValue !== 0) {
                        const piece = document.createElement('div');
                        piece.classList.add('checkers-piece', `player${pieceValue > 2 ? pieceValue - 2 : pieceValue}`);
                        if (pieceValue > 2) piece.classList.add('king');
                        square.appendChild(piece);
                    }
                    boardElement.appendChild(square);
                }
            }
        }

        // This is a simplified Checkers logic. A full implementation is very large.
        // This version will allow basic moves and captures.
        function getValidMoves(row, col) {
            // Simplified: only forward moves, no multi-jumps
            const moves = [];
            const piece = boardState[row][col];
            const player = piece > 2 ? piece - 2 : piece;
            const dir = player === 1 ? -1 : 1;

            // Forward moves
            for(let dCol of [-1, 1]) {
                const nRow = row + dir;
                const nCol = col + dCol;
                if(nRow >= 0 && nRow < boardSize && nCol >= 0 && nCol < boardSize && boardState[nRow][nCol] === 0) {
                    moves.push({row: nRow, col: nCol});
                }
            }

            // Capture moves
            for(let dCol of [-1, 1]) {
                const jRow = row + dir * 2;
                const jCol = col + dCol * 2;
                const mRow = row + dir;
                const mCol = col + dCol;

                if(jRow >= 0 && jRow < boardSize && jCol >= 0 && jCol < boardSize && boardState[jRow][jCol] === 0) {
                    const middlePiece = boardState[mRow][mCol];
                    const middlePlayer = middlePiece > 2 ? middlePiece - 2 : middlePiece;
                    if(middlePiece !== 0 && middlePlayer !== player) {
                        moves.push({row: jRow, col: jCol, isCapture: true, captured: {row: mRow, col: mCol}});
                    }
                }
            }
            return moves;
        }

        function handleSquareClick(e) {
            const square = e.target.closest('.checkers-square');
            if (!square) return;
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);

            // Logic to handle piece selection and movement
            // This part is complex. For this example, we'll assume a basic flow.
            if (selectedPiece) {
                // move piece
                const validMoves = getValidMoves(selectedPiece.row, selectedPiece.col);
                const move = validMoves.find(m => m.row === row && m.col === col);
                if(move) {
                    boardState[move.row][move.col] = boardState[selectedPiece.row][selectedPiece.col];
                    boardState[selectedPiece.row][selectedPiece.col] = 0;
                    if(move.isCapture) {
                        boardState[move.captured.row][move.captured.col] = 0;
                    }
                    selectedPiece = null;
                    renderBoard();
                    // AI turn would be called here
                }
            } else {
                const piece = boardState[row][col];
                const player = piece > 2 ? piece - 2 : piece;
                if(player === currentPlayer) {
                    selectedPiece = {row, col};
                    // Highlight valid moves
                    const validMoves = getValidMoves(row, col);
                    renderBoard(); // Rerender to clear old highlights
                    validMoves.forEach(m => {
                        boardElement.querySelector(`[data-row='${m.row}'][data-col='${m.col}']`).classList.add('valid-move');
                    });
                    square.querySelector('.checkers-piece').classList.add('selected');
                }
            }
        }

        function aiTurn() {
            // Simplified AI logic
            statusDisplay.textContent = "AI is thinking...";
            setTimeout(() => {
                // AI logic here: find all possible moves and pick one
                // For now, AI does nothing.
                statusDisplay.textContent = "Your Turn";
            }, 1000);
        }

        // --- Initialisation & Event Listeners ---
        createBoard();
        renderBoard();
        boardElement.addEventListener('click', handleSquareClick);

        // --- Cleanup ---
        function destroy() {
            console.log("Destroying Checkers game.");
            boardElement.removeEventListener('click', handleSquareClick);
        }

        return destroy;
    }
};
