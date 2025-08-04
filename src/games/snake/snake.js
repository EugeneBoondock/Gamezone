// Ensure the global games object exists
window.games = window.games || {};

window.games.snake = {
    init: function(container, difficulty) {
        // --- Game Setup ---
        const canvas = document.createElement('canvas');
        canvas.id = 'snake-canvas';
        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'snake-score';

        container.innerHTML = ''; // Clear container
        container.appendChild(canvas);
        container.appendChild(scoreDisplay);

        const ctx = canvas.getContext('2d');
        const gridSize = 20;
        canvas.width = 400;
        canvas.height = 400;

        // --- Difficulty Settings ---
        const speeds = { easy: 150, medium: 100, hard: 60 };
        const gameSpeed = speeds[difficulty] || 150;

        // --- Game State ---
        let snake = [{ x: 10, y: 10 }];
        let food = {};
        let score = 0;
        let direction = 'right';
        let changingDirection = false;
        let gameLoopTimeout;

        function placeFood() {
            food = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)),
                y: Math.floor(Math.random() * (canvas.height / gridSize))
            };
        }

        function draw() {
            // Clear canvas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw snake
            snake.forEach((part, index) => {
                ctx.fillStyle = index === 0 ? '#00ff00' : '#00cc00'; // Head is brighter
                ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
            });

            // Draw food
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

            scoreDisplay.textContent = `Score: ${score}`;
        }

        function update() {
            changingDirection = false;
            const head = { x: snake[0].x, y: snake[0].y };

            switch (direction) {
                case 'up': head.y -= 1; break;
                case 'down': head.y += 1; break;
                case 'left': head.x -= 1; break;
                case 'right': head.x += 1; break;
            }

            // Check for collision with walls
            if (head.x < 0 || head.x * gridSize >= canvas.width || head.y < 0 || head.y * gridSize >= canvas.height) {
                gameOver();
                return;
            }

            // Check for collision with self
            for (let i = 1; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    gameOver();
                    return;
                }
            }

            snake.unshift(head);

            // Check for food collision
            if (head.x === food.x && head.y === food.y) {
                score++;
                placeFood();
                window.soundManager.play('capture');
            } else {
                snake.pop();
            }
        }

        function gameOver() {
            window.soundManager.play('lose');
            clearTimeout(gameLoopTimeout);
            document.removeEventListener('keydown', handleKeyDown);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '40px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '20px Orbitron';
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        }

        function gameLoop() {
            update();
            draw();
            gameLoopTimeout = setTimeout(gameLoop, gameSpeed);
        }

        function handleKeyDown(event) {
            if (changingDirection) return;
            changingDirection = true;

            const keyPressed = event.key;
            const goingUp = direction === 'up';
            const goingDown = direction === 'down';
            const goingLeft = direction === 'left';
            const goingRight = direction === 'right';

            if (keyPressed === 'ArrowLeft' && !goingRight) direction = 'left';
            if (keyPressed === 'ArrowUp' && !goingDown) direction = 'up';
            if (keyPressed === 'ArrowRight' && !goingLeft) direction = 'right';
            if (keyPressed === 'ArrowDown' && !goingUp) direction = 'down';
        }

        // --- Event Listeners & Initialisation ---
        document.addEventListener('keydown', handleKeyDown);
        placeFood();
        gameLoop();

        // --- Cleanup ---
        function destroy() {
            console.log("Destroying Snake game.");
            clearTimeout(gameLoopTimeout);
            document.removeEventListener('keydown', handleKeyDown);
        }

        return destroy;
    }
};
