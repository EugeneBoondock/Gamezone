document.addEventListener('DOMContentLoaded', () => {
    const gameMenu = document.getElementById('game-menu');
    const gameContainer = document.getElementById('game-container');
    const initialContent = gameContainer.innerHTML;

    let loadedGame = {
        name: null,
        css: null,
        script: null,
        destroy: null
    };

    function loadGame(gameName) {
        console.log(`Loading game: ${gameName}`);

        if (loadedGame.name) {
            unloadGame();
        }

        gameContainer.innerHTML = '<h2>Loading...</h2>';

        const gamePath = `/games/${gameName}/${gameName}`;

        // Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = `${gamePath}.css`;
        document.head.appendChild(cssLink);

        // Load Game script
        const script = document.createElement('script');
        script.src = `${gamePath}.js`;

        script.onload = () => {
            gameContainer.innerHTML = '';
            if (window.games && window.games[gameName] && typeof window.games[gameName].init === 'function') {
                const destroyCallback = window.games[gameName].init(gameContainer);
                loadedGame.destroy = destroyCallback;
            } else {
                console.error(`Game "${gameName}" could not be loaded.`);
                gameContainer.innerHTML = `<h2>Error: Could not load game "${gameName}".</h2>`;
            }
        };

        script.onerror = () => {
            gameContainer.innerHTML = `<h2>Error loading script for ${gameName}.</h2>`;
        };

        document.body.appendChild(script);

        loadedGame.name = gameName;
        loadedGame.css = cssLink;
        loadedGame.script = script;
    }

    function unloadGame() {
        if (!loadedGame.name) return;

        console.log(`Unloading game: ${loadedGame.name}`);

        if (loadedGame.destroy && typeof loadedGame.destroy === 'function') {
            loadedGame.destroy();
        }

        if (loadedGame.css) {
            loadedGame.css.remove();
        }
        if (loadedGame.script) {
            loadedGame.script.remove();
        }

        gameContainer.innerHTML = initialContent;

        loadedGame = { name: null, css: null, script: null, destroy: null };
    }

    gameMenu.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const gameName = event.target.dataset.game;
            if (gameName) {
                if (gameName === loadedGame.name) {
                    unloadGame();
                } else {
                    loadGame(gameName);
                }
            }
        }
    });
});
