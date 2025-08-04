/**
 * Tic-Tac-Toe Game Module
 * Implements the game logic and UI for Tic-Tac-Toe.
 * Exports an `init` function that sets up the game and returns a `destroy` function.
 */
export function init(container) {
    // --- STATE ---
    let currentPlayer = 'X';
    let boardState = Array(9).fill(null);
    let gameActive = true;

    // --- UI RENDER ---
    container.innerHTML = `
        <div class="tictactoe-container">
            <div id="tictactoe-status">Player ${currentPlayer}'s turn</div>
            <div id="tictactoe-board">
                ${boardState.map((_, i) => `<div class="tictactoe-cell" data-index="${i}"></div>`).join('')}
            </div>
            <button id="tictactoe-restart">Restart Game</button>
        </div>
    `;

    // --- UI ELEMENTS ---
    const statusDisplay = container.querySelector('#tictactoe-status');
    const boardElement = container.querySelector('#tictactoe-board');
    const restartButton = container.querySelector('#tictactoe-restart');
    const cells = container.querySelectorAll('.tictactoe-cell');

    // --- GAME LOGIC ---
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    function checkWin() {
        for (const condition of winningConditions) {
            const [a, b, c] = condition;
            if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                return true;
            }
        }
        return false;
    }

    function checkDraw() {
        return boardState.every(cell => cell !== null);
    }

    function handleCellClick(event) {
        const cell = event.target;
        const index = parseInt(cell.dataset.index);

        if (!gameActive || boardState[index] !== null) {
            return;
        }

        // Update state
        boardState[index] = currentPlayer;

        // Update UI
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer.toLowerCase());

        // Check for game over
        if (checkWin()) {
            statusDisplay.textContent = `Player ${currentPlayer} wins!`;
            gameActive = false;
        } else if (checkDraw()) {
            statusDisplay.textContent = 'Game is a draw!';
            gameActive = false;
        } else {
            // Next turn
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
        }
    }

    function restartGame() {
        boardState.fill(null);
        currentPlayer = 'X';
        gameActive = true;
        statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        });
    }

    // --- EVENT LISTENERS ---
    boardElement.addEventListener('click', handleCellClick);
    restartButton.addEventListener('click', restartGame);

    // --- CLEANUP ---
    function destroy() {
        console.log("Destroying Tic-Tac-Toe game and its event listeners.");
        boardElement.removeEventListener('click', handleCellClick);
        restartButton.removeEventListener('click', restartGame);
        // The loader will clear the container's innerHTML
    }

    return destroy;
}
