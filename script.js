// --- DOM Elements ---
const startScreen = document.getElementById('start-screen');
const characterSelectScreen = document.getElementById('character-select-screen');
const levelSelectScreen = document.getElementById('level-select-screen');
const gameScreen = document.getElementById('game-screen');
const worldScreen = document.getElementById('world-screen');

const startButton = document.getElementById('start-button');
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

// --- Game Screens Array ---
const ALL_SCREENS = [startScreen, characterSelectScreen, levelSelectScreen, gameScreen, worldScreen];

// --- Sound Engine ---
const Sound = {
    audioCtx: null,
    init() {
        if (this.audioCtx) return;
        try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { console.error("Web Audio API is not supported in this browser"); }
    },
    play(type) {
        if (!this.audioCtx) return;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        switch (type) {
            case 'correct': oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.4); break;
            case 'incorrect': oscillator.type = 'square'; oscillator.frequency.setValueAtTime(164.81, this.audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.5); break;
            case 'click': oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.2); break;
            case 'place': oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(329.63, this.audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.3); break;
            case 'levelUp': oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(261.63, this.audioCtx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(523.25, this.audioCtx.currentTime + 0.5); gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.6); break;
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
const SHAPES = { triangle: { name: 'triangle', svg: `<svg viewbox="0 0 100 100"><polygon points="50,15 90,85 10,85" fill="currentColor"/></svg>` }, square: { name: 'square', svg: `<svg viewbox="0 0 100 100"><rect x="15" y="15" width="70" height="70" fill="currentColor"/></svg>` }, circle: { name: 'circle', svg: `<svg viewbox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="currentColor"/></svg>` }, star: { name: 'star', svg: `<svg viewbox="0 0 100 100"><polygon points="50,5 61,40 98,40 68,62 79,96 50,75 21,96 32,62 2,40 39,40" fill="currentColor"/></svg>` },};
const PROBLEM_TYPES = { easy: ['count', 'shape-identification'], medium: ['addition', 'number-comparison'], hard: ['subtraction', 'multiplication'],};
const characters = [ { id: 'blue', color: '#6495ED' }, { id: 'green', color: '#90EE90' }, { id: 'pink', color: '#FFB6C1' }, { id: 'yellow', color: '#FAFAD2' },];

// --- Game State ---
let gameState = { currentScreen: 'start', selectedCharacter: { color: '#ccc' }, selectedDifficulty: null, buildingBlocks: 0, xp: 0, level: 1, xpToNextLevel: 10, unlockedColors: [], activeColor: '#ccc', currentProblem: null, worldGrid: [],};

// --- Utility Functions ---
function triggerAnimation(element, animationClass) {
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => element.classList.remove(animationClass), { once: true });
}

// --- Screen Management ---
function showScreen(screenToShow) {
    ALL_SCREENS.forEach(screen => {
        screen.classList.toggle('hidden', screen !== screenToShow);
    });
    gameState.currentScreen = screenToShow.id.replace('-screen', '');
    if (screenToShow === worldScreen) {
        updateColorPalette();
        updateStatsUI();
        renderWorld();
    }
}

// --- UI Update Functions ---
function updateStatsUI() {
    levelDisplay.textContent = `LVL: ${gameState.level}`;
    xpDisplay.textContent = `XP: ${gameState.xp}/${gameState.xpToNextLevel}`;
    blocksDisplay.textContent = `Blocks: ${gameState.buildingBlocks}`;
    playerCharDisplay.style.backgroundColor = gameState.selectedCharacter..color;
    worldLevelDisplay.textContent = `LVL: ${gameState.level}`;
    worldXpDisplay.textContent = `XP: ${gameState.xp}/${gameState.xpToNextLevel}`;
    worldBlocksDisplay.textContent = `Blocks: ${gameState.buildingBlocks}`;
    worldPlayerChar.style.backgroundColor = gameState.selectedCharacter.color;
}

function updateColorPalette() {
    colorPalette.innerHTML = '';
    gameState.unlockedColors.forEach(color => {
        const colorOption = document.createElement('button');
        colorOption.classList.add('w-8', 'h-8', 'rounded-full', 'cursor-pointer', 'color-palette-option');
        colorOption.style.backgroundColor = color;
        colorOption.classList.toggle('selected', color === gameState.activeColor);
        colorOption.addEventListener('click', () => {
            Sound.play('click');
            gameState.activeColor = color;
            updateColorPalette();
        });
        colorPalette.appendChild(colorOption);
    });
}

// --- Game Setup ---
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
    Object.assign(gameState, { selectedCharacter: { color: '#ccc' }, buildingBlocks: 0, xp: 0, level: 1, xpToNextLevel: 10, unlockedColors: [], activeColor: '#ccc', });
    characterPreview.style.backgroundColor = gameState.selectedCharacter.color;
    confirmCharacterButton.disabled = true;
    document.querySelectorAll('.character-option.selected').forEach(el => el.classList.remove('selected'));
}

function selectCharacter(selectedDiv, color) {
    document.querySelectorAll('.character-option.selected').forEach(el => el.classList.remove('selected'));
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
    showScreen(gameScreen);
    generateAndDisplayProblem();
}

function initializeWorld() {
    buildingGrid.innerHTML = '';
    for (let i = 0; i < 100; i++) {
        gameState.worldGrid[i] = null;
        const cell = document.createElement('div');
        cell.classList.add('border', 'border-gray-400', 'hover:bg-gray-300', 'cursor-pointer');
        cell.dataset.index = i;
        cell.addEventListener('click', handleGridClick);
        buildingGrid.appendChild(cell);
    }
}

function renderWorld() {
    const cells = buildingGrid.children;
    for (let i = 0; i < 100; i++) {
        cells[i].style.backgroundColor = gameState.worldGrid[i] || '';
        cells[i].classList.toggle('hover:bg-gray-300', !gameState.worldGrid[i]);
    }
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

// --- Problem Logic ---
function checkAnswer(userAnswer) {
    const { correctAnswer } = gameState.currentProblem;
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
        setTimeout(() => {
            feedbackMessage.textContent = '\u00A0';
            generateAndDisplayProblem();
        }, 2500);
        return true;
    }
    return false;
}

function generateAndDisplayProblem() {
    if (feedbackMessage.textContent.includes('LEVEL UP')) {
        setTimeout(generateAndDisplayProblem, 2000); return;
    }
    instructionText.textContent = '';
    visualProblemArea.innerHTML = '';
    answerOptionsArea.innerHTML = '';
    feedbackMessage.textContent = '\u00A0';
    feedbackMessage.className = '';
    const availableProblems = PROBLEM_TYPES[gameState.selectedDifficulty];
    const problemType = availableProblems[Math.floor(Math.random() * availableProblems.length)];
    let problem = {};
    switch (problemType) {
        case 'count': const count = Math.floor(Math.random() * 5) + 1; problem = { type: 'count', question: `Count the blocks:`, correctAnswer: count, options: generateNumberOptions(count, 4, 10), visualData: { count: count, color: gameState.selectedCharacter.color } }; break;
        case 'addition': const add1 = Math.floor(Math.random() * 5) + 1; const add2 = Math.floor(Math.random() * 5) + 1; const addAns = add1 + add2; problem = { type: 'addition', question: `What is ${add1} + ${add2}?`, correctAnswer: addAns, options: generateNumberOptions(addAns, 4, 15), visualData: { counts: [add1, add2], colors: ['#FF6347', '#4682B4'] } }; break;
        case 'subtraction': const sub1 = Math.floor(Math.random() * 6) + 5; const sub2 = Math.floor(Math.random() * sub1) + 1; const subAns = sub1 - sub2; problem = { type: 'subtraction', question: `What is ${sub1} - ${sub2}?`, correctAnswer: subAns, options: generateNumberOptions(subAns, 4, 10), visualData: { count1: sub1, count2: sub2, color: '#3CB371' } }; break;
        case 'multiplication': const mul1 = Math.floor(Math.random() * 4) + 2; const mul2 = Math.floor(Math.random() * 4) + 2; const mulAns = mul1 * mul2; problem = { type: 'multiplication', question: `What is ${mul1} x ${mul2}?`, correctAnswer: mulAns, options: generateNumberOptions(mulAns, 4, 20), visualData: { groups: mul1, countPerGroup: mul2, color: '#9370DB' } }; break;
        case 'number-comparison': let comp1 = Math.floor(Math.random() * 10) + 1; let comp2 = Math.floor(Math.random() * 10) + 1; while (comp1 === comp2) { comp2 = Math.floor(Math.random() * 10) + 1; } problem = { type: 'number-comparison', question: `Which number is bigger?`, correctAnswer: Math.max(comp1, comp2), options: [comp1, comp2], visualData: { nums: [comp1, comp2], colors: ['#FFA07A', '#20B2AA'] } }; break;
        case 'shape-identification': const shapeNames = Object.keys(SHAPES); const correctShapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)]; let shapeOptions = [SHAPES[correctShapeName]]; while (shapeOptions.length < 3) { const randomShape = SHAPES[shapeNames[Math.floor(Math.random() * shapeNames.length)]]; if (!shapeOptions.some(s => s.name === randomShape.name)) { shapeOptions.push(randomShape); } } problem = { type: 'shape-identification', question: `Click on the ${correctShapeName}:`, correctAnswer: correctShapeName, options: shapeOptions.sort(() => Math.random() - 0.5), visualData: { color: gameState.selectedCharacter.color } }; break;
    }
    gameState.currentProblem = problem;
    displayProblem(problem);
}

function displayProblem(problem) {
    instructionText.textContent = problem.question;
    visualProblemArea.innerHTML = '';
    answerOptionsArea.innerHTML = '';
    switch (problem.type) {
        case 'shape-identification':
            problem.options.forEach(shape => {
                const shapeDiv = document.createElement('div');
                shapeDiv.classList.add('w-24', 'h-24', 'm-2', 'cursor-pointer', 'text-gray-700', 'hover:text-yellow-500');
                shapeDiv.innerHTML = shape.svg;
                shapeDiv.style.color = problem.visualData.color;
                shapeDiv.dataset.shape = shape.name;
                shapeDiv.addEventListener('click', () => checkAnswer(shape.name));
                answerOptionsArea.appendChild(shapeDiv);
            });
            break;
        case 'number-comparison':
            problem.visualData.nums.forEach((num, index) => {
                const container = document.createElement('div');
                container.classList.add('flex', 'flex-col', 'items-center', 'm-2');
                const numberText = document.createElement('p');
                numberText.textContent = num;
                numberText.classList.add('text-2xl', 'font-bold');
                container.appendChild(numberText);
                const blockContainer = document.createElement('div');
                blockContainer.classList.add('flex', 'flex-col-reverse');
                for (let i = 0; i < num; i++) {
                    const block = document.createElement('div');
                    block.classList.add('w-6', 'h-6', 'm-0.5', 'block');
                    block.style.backgroundColor = problem.visualData.colors[index];
                    blockContainer.appendChild(block);
                }
                container.appendChild(blockContainer);
                visualProblemArea.appendChild(container);
            });
        // Fall-through for numeric options
        case 'count':
        case 'addition':
        case 'subtraction':
        case 'multiplication':
            if (problem.visualData?.count) { for (let i = 0; i < problem.visualData.count; i++) { const block = document.createElement('div'); block.classList.add('w-10', 'h-10', 'm-1', 'block'); block.style.backgroundColor = problem.visualData.color; visualProblemArea.appendChild(block); } }
            if (problem.visualData?.counts) { /* Visuals for addition */ }
            if (problem.visualData?.count1) { /* Visuals for subtraction */ }
            if (problem.visualData?.groups) { for (let i = 0; i < problem.visualData.groups; i++) { const groupDiv = document.createElement('div'); groupDiv.classList.add('flex', 'flex-col', 'm-1', 'p-1', 'border', 'border-dashed'); for (let j = 0; j < problem.visualData.countPerGroup; j++) { const block = document.createElement('div'); block.classList.add('w-6', 'h-6', 'm-0.5', 'block'); block.style.backgroundColor = problem.visualData.color; groupDiv.appendChild(block); } visualProblemArea.appendChild(groupDiv); } }
            problem.options.forEach(option => {
                const button = document.createElement('button');
                button.classList.add('game-button', 'block', 'text-xl', 'md:text-2xl', 'px-4', 'py-2');
                button.textContent = option;
                button.addEventListener('click', () => checkAnswer(option));
                answerOptionsArea.appendChild(button);
            });
            break;
    }
}

function generateNumberOptions(correctAnswer, numOptions, maxRange) {
    let options = new Set([correctAnswer]);
    while (options.size < numOptions) {
        let randomOption = Math.floor(Math.random() * (maxRange + 1));
        if (randomOption >= 0 && Math.abs(randomOption - correctAnswer) < (maxRange / 1.5)) { options.add(randomOption); }
        if (options.size < numOptions && Math.random() > 0.95) { options.add(Math.max(0, correctAnswer + (options.size % 2 === 0 ? 1 : -1) * (Math.floor(options.size / 2) + 1))); }
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
}

// --- Event Listeners ---
function addEventListeners() {
    startButton.addEventListener('click', () => {
        Sound.init();
        Sound.play('click');
        showScreen(characterSelectScreen);
    });
    document.querySelectorAll('.game-button:not(#start-button)').forEach(button => {
        button.addEventListener('click', () => Sound.play('click'));
    });
    confirmCharacterButton.addEventListener('click', () => {
        if (!confirmCharacterButton.disabled) {
            updateStatsUI();
            showScreen(levelSelectScreen);
        }
    });
    backToCharacterSelectButton.addEventListener('click', () => {
        setupCharacterSelection();
        showScreen(characterSelectScreen);
    });
    levelButtons.forEach(button => {
        button.addEventListener('click', () => selectLevel(button.dataset.difficulty));
    });
    quitLevelButton.addEventListener('click', () => showScreen(levelSelectScreen));
    goToWorldButton.addEventListener('click', () => showScreen(worldScreen));
    backToLevelSelectButton.addEventListener('click', () => showScreen(levelSelectScreen));
}

// --- Start the game ---
document.addEventListener('DOMContentLoaded', initializeGame);
