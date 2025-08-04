document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameMenu = document.getElementById('game-menu');
    const gameContainer = document.getElementById('game-container');
    const initialContent = gameContainer.innerHTML;
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const difficultySetting = document.getElementById('difficulty-setting');
    const opponentSetting = document.getElementById('opponent-setting');
    const soundSetting = document.getElementById('sound-setting');

    // --- Global State ---
    let loadedGame = { name: null, destroy: null, css: null, script: null };
    let settings = {
        difficulty: 'medium',
        opponent: 'ai',
        sound: true
    };

    // --- Sound Manager ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const soundManager = {
        presets: {
            move: { type: 'sine', freq: 440, dur: 0.1 },
            capture: { type: 'square', freq: 220, dur: 0.2 },
            win: { type: 'triangle', freq: 523, dur: 0.5, melody: [0, 5, 7, 12] },
            lose: { type: 'sawtooth', freq: 330, dur: 0.8, melody: [0, -3, -5, -8] }
        },
        play: function(soundName) {
            if (!settings.sound || !audioCtx) return;

            const preset = this.presets[soundName];
            if (!preset) return;

            if (preset.melody) {
                preset.melody.forEach((semitone, i) => {
                    const freq = preset.freq * Math.pow(2, semitone / 12);
                    this.generateSound(preset.type, freq, preset.dur / preset.melody.length, i * (preset.dur / preset.melody.length) * 1000);
                });
            } else {
                this.generateSound(preset.type, preset.freq, preset.dur);
            }
        },
        generateSound: function(type, frequency, duration, delay = 0) {
            setTimeout(() => {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.type = type;
                oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); // Lower volume
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + duration);
            }, delay);
        }
    };
    window.soundManager = soundManager;

    // --- Game Loading ---
    function loadGame(gameName) {
        console.log(`Loading game: ${gameName} with settings:`, settings);
        gameContainer.classList.add('loading');

        // Unload previous game with a delay to allow fade-out
        if (loadedGame.name) {
            unloadGame();
        }

        // Load new game after a delay
        setTimeout(() => {
            gameContainer.innerHTML = '<h2>Loading...</h2>';

            const gamePath = `/games/${gameName}/${gameName}`;

            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `${gamePath}.css`;
            document.head.appendChild(cssLink);

            const script = document.createElement('script');
            script.src = `${gamePath}.js`;

            script.onload = () => {
                gameContainer.innerHTML = '';
                if (window.games && window.games[gameName] && typeof window.games[gameName].init === 'function') {
                    const destroyCallback = window.games[gameName].init(gameContainer, settings);
                    loadedGame.destroy = destroyCallback;
                } else {
                    console.error(`Game "${gameName}" could not be loaded.`);
                    gameContainer.innerHTML = `<h2>Error: Could not load game "${gameName}".</h2>`;
                }
                gameContainer.classList.remove('loading');
            };

            script.onerror = () => {
                gameContainer.innerHTML = `<h2>Error loading script for ${gameName}.</h2>`;
                gameContainer.classList.remove('loading');
            };

            document.body.appendChild(script);

            loadedGame.name = gameName;
            loadedGame.css = cssLink;
            loadedGame.script = script;
        }, 500); // This duration should match the opacity transition in style.css
    }

    function unloadGame() {
        if (!loadedGame.name) return;
        console.log(`Unloading game: ${loadedGame.name}`);
        gameContainer.classList.add('loading');

        setTimeout(() => {
            const activeButton = gameMenu.querySelector(`[data-game="${loadedGame.name}"]`);
            if (activeButton) {
                activeButton.classList.remove('active');
            }

            if (loadedGame.destroy) loadedGame.destroy();
            if (loadedGame.css) loadedGame.css.remove();
            if (loadedGame.script) loadedGame.script.remove();
            gameContainer.innerHTML = initialContent;
            loadedGame = { name: null, destroy: null, css: null, script: null };
            gameContainer.classList.remove('loading');
        }, 500); // This duration should match the opacity transition in style.css
    }

    // --- Event Listeners ---
    gameMenu.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const gameName = event.target.dataset.game;

            // Remove active class from any other button
            gameMenu.querySelectorAll('button').forEach(btn => {
                if (btn !== event.target) {
                    btn.classList.remove('active');
                }
            });

            if (gameName) {
                if (gameName === loadedGame.name) {
                    unloadGame(); // This will also remove the active class
                } else {
                    event.target.classList.add('active');
                    loadGame(gameName);
                }
            }
        }
    });

    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    function handleSettingChange() {
        settings.difficulty = difficultySetting.value;
        settings.opponent = opponentSetting.value;
        settings.sound = soundSetting.checked;
        console.log("Settings updated:", settings);

        // If a game is currently loaded, reload it with the new settings
        if (loadedGame.name) {
            loadGame(loadedGame.name);
        }
    }

    difficultySetting.addEventListener('change', handleSettingChange);
    opponentSetting.addEventListener('change', handleSettingChange);
    soundSetting.addEventListener('change', handleSettingChange);
});
