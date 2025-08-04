window.games = window.games || {};

window.games.checkers = {
    init: function(container, settings) {
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
        let board = [];
        let turn = 1; // 1 for player, 2 for AI
        let selectedPiece = null; // { row, col, moves }
        let isPlayerTurn = true;

        const createBoard = () => {
            board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(0));
            for (let r = 0; r < boardSize; r++) {
                for (let c = 0; c < boardSize; c++) {
                    if ((r + c) % 2 !== 0) {
                        if (r < 3) board[r][c] = 2; // AI
                        if (r > 4) board[r][c] = 1; // Player
                    }
                }
            }
        };

        const renderBoard = () => {
            boardElement.innerHTML = '';
            for (let r = 0; r < boardSize; r++) {
                for (let c = 0; c < boardSize; c++) {
                    const square = document.createElement('div');
                    square.classList.add('checkers-square', (r + c) % 2 === 0 ? 'light' : 'dark');
                    square.dataset.row = r;
                    square.dataset.col = c;

                    const pieceVal = board[r][c];
                    if (pieceVal !== 0) {
                        const piece = document.createElement('div');
                        const player = pieceVal > 2 ? pieceVal - 2 : pieceVal;
                        piece.classList.add('checkers-piece', `player${player}`);
                        if (pieceVal > 2) piece.classList.add('king');
                        square.appendChild(piece);
                    }
                    boardElement.appendChild(square);
                }
            }
            if (selectedPiece) {
                const el = boardElement.querySelector(`[data-row='${selectedPiece.row}'][data-col='${selectedPiece.col}'] .checkers-piece`);
                if(el) el.classList.add('selected');
                selectedPiece.moves.forEach(move => {
                    const moveEl = boardElement.querySelector(`[data-row='${move.to.row}'][data-col='${move.to.col}']`);
                    if(moveEl) moveEl.classList.add('valid-move');
                });
            }
        };

        const getValidMoves = (r, c, b, player) => {
            const moves = [];
            const piece = b[r][c];
            const isKing = piece > 2;
            const dirs = isKing ? [[-1,-1], [-1,1], [1,-1], [1,1]] : (player === 1 ? [[-1,-1], [-1,1]] : [[1,-1], [1,1]]);

            for (const [dr, dc] of dirs) {
                const r1 = r + dr, c1 = c + dc;
                const r2 = r + dr*2, c2 = c + dc*2;

                if (r1 >= 0 && r1 < 8 && c1 >= 0 && c1 < 8 && b[r1][c1] === 0) {
                    moves.push({ to: { row: r1, col: c1 }, captures: [] });
                }
                if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && b[r2][c2] === 0) {
                    const midPiece = b[r1][c1];
                    const midPlayer = midPiece > 2 ? midPiece - 2 : midPiece;
                    if (midPiece !== 0 && midPlayer !== player) {
                        moves.push({ to: { row: r2, col: c2 }, captures: [{ row: r1, col: c1 }] });
                    }
                }
            }
            return moves;
        };

        const getAllMoves = (player, b) => {
            let allMoves = [];
            let canCapture = false;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = b[r][c];
                    const pOwner = p > 2 ? p - 2 : p;
                    if (p !== 0 && pOwner === player) {
                        const moves = getValidMoves(r, c, b, player);
                        const captures = moves.filter(m => m.captures.length > 0);
                        if (captures.length > 0) {
                            if (!canCapture) {
                                allMoves = []; // Discard non-capture moves
                                canCapture = true;
                            }
                            allMoves.push({ from: { r, c }, moves: captures });
                        } else if (!canCapture && moves.length > 0) {
                            allMoves.push({ from: { r, c }, moves });
                        }
                    }
                }
            }
            return allMoves;
        };

        const movePiece = (from, to, captures) => {
            board[to.row][to.col] = board[from.row][from.col];
            board[from.row][from.col] = 0;
            captures.forEach(cap => board[cap.row][cap.col] = 0);

            // King me
            const player = board[to.row][to.col] > 2 ? board[to.row][to.col] - 2 : board[to.row][to.col];
            if (player === 1 && to.row === 0) board[to.row][to.col] = 3;
            if (player === 2 && to.row === 7) board[to.row][to.col] = 4;
        };

        const aiTurn = () => {
            isPlayerTurn = false;
            statusDisplay.textContent = "AI is thinking...";
            setTimeout(() => {
                const allMoves = getAllMoves(2, board);
                if (allMoves.length === 0) { statusDisplay.textContent = "You Win!"; return; }

                // AI Logic (simplified: random valid move)
                const pieceMoves = allMoves[Math.floor(Math.random() * allMoves.length)];
                const move = pieceMoves.moves[Math.floor(Math.random() * pieceMoves.moves.length)];

                movePiece(pieceMoves.from, move.to, move.captures);
                window.soundManager.play(move.captures.length > 0 ? 'capture' : 'move');
                turn = 1;
                isPlayerTurn = true;
                statusDisplay.textContent = "Your Turn";
                renderBoard();
            }, 500);
        };

        const handleSquareClick = (e) => {
            if (!isPlayerTurn) return;
            const square = e.target.closest('.checkers-square');
            if (!square) return;
            const r = parseInt(square.dataset.row), c = parseInt(square.dataset.col);

            if (selectedPiece) {
                const move = selectedPiece.moves.find(m => m.to.row === r && m.to.col === c);
                if (move) {
                    movePiece(selectedPiece, move.to, move.captures);
                    window.soundManager.play(move.captures.length > 0 ? 'capture' : 'move');
                    selectedPiece = null;
                    turn = 2;
                    renderBoard();

                    const playerMoves = getAllMoves(1, board);
                    if (playerMoves.length === 0) { statusDisplay.textContent = "AI Wins!"; return; }

                    aiTurn();
                } else {
                    selectedPiece = null;
                    renderBoard();
                }
            } else {
                const allPlayerMoves = getAllMoves(1, board);
                const pieceMoves = allPlayerMoves.find(p => p.from.r === r && p.from.c === c);
                if (pieceMoves) {
                    selectedPiece = { row: r, col: c, moves: pieceMoves.moves };
                    renderBoard();
                }
            }
        };

        createBoard();
        renderBoard();
        boardElement.addEventListener('click', handleSquareClick);

        function destroy() {
            boardElement.removeEventListener('click', handleSquareClick);
        }
        return destroy;
    }
};
