document.addEventListener('DOMContentLoaded', () => {
    const gameMenu = document.getElementById('game-menu');
    const gameContainer = document.getElementById('game-container');
    const initialContent = gameContainer.innerHTML;

    let loadedGame = {
        name: null,
        css: null,
        script: null,
        // The game's JS should export a `destroy` function
        destroy: null
    };

    async function loadGame(gameName) {
        console.log(`Loading game: ${gameName}`);

        // If a game is already loaded, unload it first
        if (loadedGame.name) {
            await unloadGame();
        }

        gameContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const gamePath = `games/${gameName}/${gameName}`;

            // Load CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `${gamePath}.css`;
            document.head.appendChild(cssLink);

            // Load Game script as a module
            const gameModule = await import(`${gamePath}.js`);

            // Clear loading message
            gameContainer.innerHTML = '';

            // The game module should export an `init` function
            if (gameModule.init) {
                // The init function should return a cleanup/destroy function
                const destroyCallback = gameModule.init(gameContainer);
                loadedGame.destroy = destroyCallback;
            } else {
                throw new Error(`Game "${gameName}" does not have an init function.`);
            }

            loadedGame.name = gameName;
            loadedGame.css = cssLink;

        } catch (error) {
            console.error(`Error loading game ${gameName}:`, error);
            gameContainer.innerHTML = `<h2>Error loading ${gameName}. Check console for details.</h2>`;
        }
    }

    async function unloadGame() {
        if (!loadedGame.name) return;

        console.log(`Unloading game: ${loadedGame.name}`);

        if (loadedGame.destroy && typeof loadedGame.destroy === 'function') {
            loadedGame.destroy();
        }

        if (loadedGame.css) {
            loadedGame.css.remove();
        }

        // Reset game container to its initial state
        gameContainer.innerHTML = initialContent;

        loadedGame = { name: null, css: null, script: null, destroy: null };
    }

    gameMenu.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const gameName = event.target.dataset.game;
            if (gameName) {
                if (gameName === loadedGame.name) {
                    // If the same game button is clicked, unload it
                    unloadGame();
                } else {
                    loadGame(gameName);
                }
            }
        }
    });
});
