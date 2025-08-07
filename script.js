// --- DOM Elements ---
const gameContainer = document.getElementById('game-container');
const characterSelectScreen = document.getElementById('character-select-screen');
const levelSelectScreen = document.getElementById('level-select-screen');
const gameScreen = document.getElementById('game-screen');
const worldScreen = document.getElementById('world-screen');
const characterOptionsContainer = document.getElementById('character-options');
const characterPreview = document.getElementById('character-preview');
const confirmCharacterButton = document.getElementById('confirm-character-button');
const backToCharacterSelectButton = document.getElementById('back-to-character-select');
const levelButtons = [document.getElementById('level-easy'), document.getElementById('level-medium'), document.getElementById('level-hard')];
const goToWorldButton = document.getElementById('go-to-world-button');
const backToLevelSelectButton = document.getElementById('back-to-level-select');
const playerCharDisplay = document.getElementById('player-char-display');
const levelTitle = document.getElementById('level-title');
const levelDisplay = document.getElementById('level-display');
const xpDisplay = document.getElementById('xp-display');
const blocksDisplay = document.getElementById('blocks-display');
const instructionText = document.getElementById('instruction-text');
const problemArea = document.getElementById('problem-area');
const visualProblemArea = document.getElementById('visual-problem');
const answerOptionsArea = document.getElementById('answer-options');
const feedbackMessage = document.getElementById('feedback-message');
const quitLevelButton = document.getElementById('quit-level-button');
const worldPlayerChar = document.getElementById('world-player-char');
const worldLevelDisplay = document.getElementById('world-level-display');
const worldXpDisplay = document.getElementById('world-xp-display');
const worldBlocksDisplay = document.getElementById('world-blocks-display');
const buildingGrid = document.getElementById('building-grid');
const colorPalette = document.getElementById('color-palette');

// --- Sound Engine ---
const Sound = {
    audioCtx: null,
    init() {
        if (this.audioCtx) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
        }
    },
    play(type) {
        if (!this.audioCtx) return;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);

        switch (type) {
            case 'correct':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.4);
                break;
            case 'incorrect':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(164.81, this.audioCtx.currentTime); // E3
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.5);
                break;
            case 'click':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.2);
                break;
            case 'place':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(329.63, this.audioCtx.currentTime); // E4
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.3);
                break;
            case 'levelUp':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(261.63, this.audioCtx.currentTime); // C4
                oscillator.frequency.exponentialRampToValueAtTime(523.25, this.audioCtx.currentTime + 0.5);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.6);
                break;
            default: return;
        }
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 1);
    }
};

// --- Game Constants ---
const UNLOCKABLE_COLORS = ['#FF6347', '#4682B4', '#3CB371', '#FFD700', '#9370DB', '#FFA07A'];
const XP_VALUES = { easy: 3, medium: 5, hard: 8 };
const SHAPES = { /* ... (same as before) ... */ };
const PROBLEM_TYPES = { /* ... (same as before) ... */ };

// --- Game State ---
let gameState = { /* ... (same as before) ... */ };

// --- Utility Functions ---
function triggerAnimation(element, animationClass) {
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
    }, { once: true });
}

// --- Initialization ---
function initializeGame() {
    Sound.init(); // Initialize sound immediately for robustness
    setupCharacterSelection();
    initializeWorld();
    showScreen('character-select');
    addEventListeners();
}

// --- UI Update & Screen Management (with animation/sound hooks) ---
function updateColorPalette() {
    colorPalette.innerHTML = '';
    gameState.unlockedColors.forEach(color => {
        const colorOption = document.createElement('button');
        colorOption.classList.add('w-8', 'h-8', 'rounded-full', 'cursor-pointer', 'color-palette-option');
        colorOption.style.backgroundColor = color;
        if (color === gameState.activeColor) {
            colorOption.classList.add('selected');
        }
        colorOption.addEventListener('click', () => {
            Sound.play('click');
            gameState.activeColor = color;
            updateColorPalette();
        });
        colorPalette.appendChild(colorOption);
    });
}

function handleGridClick(event) {
    const cellIndex = event.target.closest('[data-index]')?.dataset.index;
    if (!cellIndex) return;
    if (gameState.worldGrid[cellIndex] === null && gameState.buildingBlocks > 0) {
        Sound.play('place');
        gameState.buildingBlocks--;
        gameState.worldGrid[cellIndex] = gameState.activeColor;
        triggerAnimation(worldBlocksDisplay, 'animate-pop');
        updateStatsUI();
        renderWorld();
    }
}

function checkAnswer(userAnswer) {
    const { correctAnswer, type } = gameState.currentProblem;
    const isNumeric = typeof correctAnswer === 'number';
    const isCorrect = isNumeric ? parseInt(userAnswer) === correctAnswer : userAnswer === correctAnswer;

    answerOptionsArea.querySelectorAll('button, div').forEach(el => el.style.pointerEvents = 'none');

    if (isCorrect) {
        Sound.play('correct');
        const xpGained = XP_VALUES[gameState.selectedDifficulty];
        feedbackMessage.textContent = `Correct! +1 Block, +${xpGained} XP!`;
        feedbackMessage.className = 'correct mt-4 font-bold text-center';
        gameState.buildingBlocks++;
        gameState.xp += xpGained;

        triggerAnimation(blocksDisplay, 'animate-pop');
        triggerAnimation(xpDisplay, 'animate-pop');

        updateStatsUI();
        const leveledUp = checkForLevelUp();
        if (!leveledUp) {
            setTimeout(generateAndDisplayProblem, 1500);
        }
    } else {
        Sound.play('incorrect');
        triggerAnimation(problemArea, 'animate-shake');
        feedbackMessage.textContent = `Oops! The answer was ${correctAnswer}.`;
        feedbackMessage.className = 'incorrect mt-4 font-bold text-center';
        setTimeout(generateAndDisplayProblem, 2500);
    }
}

function checkForLevelUp() {
    if (gameState.xp >= gameState.xpToNextLevel) {
        Sound.play('levelUp');
        gameState.level++;
        gameState.xp -= gameState.xpToNextLevel;
        gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.5);
        const nextColor = UNLOCKABLE_COLORS.find(c => !gameState.unlockedColors.includes(c));

        if (nextColor) {
            gameState.unlockedColors.push(nextColor);
            feedbackMessage.textContent = `LEVEL UP! New color unlocked!`;
        } else {
            feedbackMessage.textContent = `LEVEL UP!`;
        }

        feedbackMessage.className = 'correct font-bold text-center';
        triggerAnimation(feedbackMessage, 'animate-flash');
        updateStatsUI();

        // Delay next problem to let user read level up message
        setTimeout(() => {
            feedbackMessage.textContent = '\u00A0';
            generateAndDisplayProblem();
        }, 2500);
        return true;
    }
    return false;
}

// --- Event Listeners ---
function addEventListeners() {
    // Add a generic click sound to all buttons
    document.querySelectorAll('.game-button').forEach(button => {
        button.addEventListener('click', () => Sound.play('click'));
    });

    // Specific listeners
    confirmCharacterButton.addEventListener('click', () => {
        if (!confirmCharacterButton.disabled) {
            updateStatsUI();
            showScreen('level-select');
        }
    });
    backToCharacterSelectButton.addEventListener('click', () => {
        setupCharacterSelection();
        showScreen('character-select');
    });
    levelButtons.forEach(button => {
        button.addEventListener('click', () => selectLevel(button.dataset.difficulty));
    });
    quitLevelButton.addEventListener('click', () => showScreen('level-select'));
    goToWorldButton.addEventListener('click', () => showScreen('world'));
    backToLevelSelectButton.addEventListener('click', () => showScreen('level-select'));
}


// --- Rest of the script (mostly unchanged, stubs for brevity) ---
function showScreen(screenName) {
    characterSelectScreen.classList.add('hidden');
    levelSelectScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    worldScreen.classList.add('hidden');
    gameState.currentScreen = screenName;
    const screen = document.getElementById(`${screenName}-screen`);
    if (screen) screen.classList.remove('hidden');

    if (screenName === 'world') {
        updateColorPalette();
        updateStatsUI();
        renderWorld();
    }
}

function updateStatsUI() {
    levelDisplay.textContent = `LVL: ${gameState.level}`;
    xpDisplay.textContent = `XP: ${gameState.xp}/${gameState.xpToNextLevel}`;
    blocksDisplay.textContent = `Blocks: ${gameState.buildingBlocks}`;
    playerCharDisplay.style.backgroundColor = gameState.selectedCharacter.color;
    worldLevelDisplay.textContent = `LVL: ${gameState.level}`;
    worldXpDisplay.textContent = `XP: ${gameState.xp}/${gameState.xpToNextLevel}`;
    worldBlocksDisplay.textContent = `Blocks: ${gameState.buildingBlocks}`;
    worldPlayerChar.style.backgroundColor = gameState.selectedCharacter.color;
}

function setupCharacterSelection() {
    characterOptionsContainer.innerHTML = '';
    characters.forEach(char => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('character-option', 'block');
        optionDiv.style.backgroundColor = char.color;
        optionDiv.dataset.color = char.color;
        optionDiv.addEventListener('click', () => {
            Sound.play('click');
            selectCharacter(optionDiv, char.color);
        });
        characterOptionsContainer.appendChild(optionDiv);
    });
    Object.assign(gameState, {
        selectedCharacter: { color: '#ccc' }, buildingBlocks: 0, xp: 0, level: 1, xpToNextLevel: 10,
        unlockedColors: [], activeColor: '#ccc',
    });
    characterPreview.style.backgroundColor = gameState.selectedCharacter.color;
    confirmCharacterButton.disabled = true;
    document.querySelectorAll('.character-option.selected').forEach(el => el.classList.remove('selected'));
}

function selectCharacter(selectedDiv, color) {
    document.querySelectorAll('.character-option').forEach(div => div.classList.remove('selected'));
    selectedDiv.classList.add('selected');
    gameState.selectedCharacter.color = color;
    gameState.unlockedColors = [color];
    gameState.activeColor = color;
    characterPreview.style.backgroundColor = color;
    confirmCharacterButton.disabled = false;
}

function selectLevel(difficulty) {
    gameState.selectedDifficulty = difficulty;
    levelTitle.textContent = `Level: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
    feedbackMessage.textContent = '\u00A0';
    feedbackMessage.className = '';
    updateStatsUI();
    showScreen('game');
    generateAndDisplayProblem();
}

function initializeWorld() { /* ... same ... */ }
function renderWorld() { /* ... same ... */ }
function generateAndDisplayProblem() { /* ... same as previous version ... */ }
function displayProblem(problem) { /* ... same as previous version ... */ }
function generateNumberOptions(c, n, m) { /* ... same ... */ }

// --- Start the game ---
document.addEventListener('DOMContentLoaded', initializeGame);
