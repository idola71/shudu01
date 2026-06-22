// 自定义游戏核心模块

// 全局变量
let currentPuzzle = null;
let currentSolution = null;
let puzzleId = null;
let difficulty = 'medium';
let selectedCell = null;
let selectedNumber = null;
let isNoteMode = false;
let cheatCode = '';
const CHEAT_SEQUENCE = '198871516';
let isClearMode = false;
let notes = {};
let moves = [];
let gameHistory = {};
let currentGameCount = {};
let currentDifficultyInfo = null;
let isCustomGame = false; // 是否是从编辑器进入的自定义游戏
let originalCustomPuzzle = null; // 编辑器导入的原始谜题（用于标记固定数字）

// 计时器相关
let timerSeconds = 0;
let timerInterval = null;
let timerStarted = false;
let timerPaused = false;

// 难度配置
const DIFFICULTY_CONFIG = {
    easy: { name: '简单', stars: 1, holes: 35 },
    medium: { name: '中等', stars: 2, holes: 45 },
    hard: { name: '困难', stars: 3, holes: 52 },
    expert: { name: '专家', stars: 4, holes: 58 }
};

// 数独生成器
class SudokuGenerator {
    constructor() {
        this.grid = Array(81).fill(0);
        this.solution = Array(81).fill(0);
    }

    generateSolution() {
        this.grid = Array(81).fill(0);
        this.fillGrid(0);
        this.solution = [...this.grid];
        return this.solution;
    }

    fillGrid(index) {
        if (index === 81) return true;
        const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
            if (this.isValid(index, num)) {
                this.grid[index] = num;
                if (this.fillGrid(index + 1)) return true;
                this.grid[index] = 0;
            }
        }
        return false;
    }

    isValid(index, num) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        for (let c = 0; c < 9; c++) {
            if (this.grid[row * 9 + c] === num) return false;
        }
        for (let r = 0; r < 9; r++) {
            if (this.grid[r * 9 + col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (this.grid[r * 9 + c] === num) return false;
            }
        }
        return true;
    }

    generatePuzzle(difficulty) {
        const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
        const holes = config.holes;
        this.generateSolution();
        const solution = [...this.solution];
        const indices = this.shuffleArray([...Array(81).keys()]);
        let holeCount = 0;
        const puzzle = [...solution];

        for (const idx of indices) {
            if (holeCount >= holes) break;
            const backup = puzzle[idx];
            puzzle[idx] = 0;
            if (this.countSolutions([...puzzle]) === 1) {
                holeCount++;
            } else {
                puzzle[idx] = backup;
            }
        }
        return { puzzle, solution };
    }

    countSolutions(grid, maxCount = 2) {
        const index = grid.indexOf(0);
        if (index === -1) return 1;
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        let count = 0;
        for (const num of nums) {
            if (this.isValidGrid(grid, index, num)) {
                grid[index] = num;
                count += this.countSolutions(grid, maxCount - count);
                grid[index] = 0;
                if (count >= maxCount) break;
            }
        }
        return count;
    }

    isValidGrid(grid, index, num) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        for (let c = 0; c < 9; c++) {
            if (grid[row * 9 + c] === num) return false;
        }
        for (let r = 0; r < 9; r++) {
            if (grid[r * 9 + col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r * 9 + c] === num) return false;
            }
        }
        return true;
    }

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

const sudokuGenerator = new SudokuGenerator();

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 恢复音乐播放状态（从编辑器进入时）
    const savedMusicState = localStorage.getItem('musicState');
    if (savedMusicState && window.AudioManager) {
        const state = JSON.parse(savedMusicState);
        // 只恢复歌曲索引，从头播放
        window.AudioManager.currentIndex = state.currentIndex;
        window.AudioManager.createAudio();
        window.AudioManager.play();
        localStorage.removeItem('musicState');
    } else if (window.AudioManager) {
        // 正常进入时播放背景音乐
        window.AudioManager.startGameMusic();
    }
    
    initGame();
    initDifficultyButton();
    initTimer();
    initMusicControl();
});

function initGame() {
    // 检查是否是从编辑器进入的自定义游戏
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'play') {
        // 从编辑器进入，加载自定义游戏数据
        loadCustomGame();
    } else {
        // 默认生成新游戏
        loadPuzzle();
    }
}

// 音乐控制按钮初始化
function initMusicControl() {
    const musicBtn = document.getElementById('musicControlBtn');
    if (musicBtn && window.AudioManager) {
        musicBtn.addEventListener('click', () => {
            window.AudioManager.toggle();
            updateMusicButtonState();
        });
        
        // 初始化按钮状态
        updateMusicButtonState();
        
        // 监听音频状态变化
        setInterval(() => {
            updateMusicButtonState();
        }, 500);
    }
}

// 更新音乐按钮状态
function updateMusicButtonState() {
    const musicBtn = document.getElementById('musicControlBtn');
    if (musicBtn && window.AudioManager) {
        const state = window.AudioManager.getState();
        if (state.isPlaying) {
            musicBtn.classList.add('playing');
            musicBtn.classList.remove('paused');
        } else {
            musicBtn.classList.remove('playing');
            musicBtn.classList.add('paused');
        }
    }
}

function loadCustomGame() {
    const gameData = localStorage.getItem('customGameData');
    if (gameData) {
        const data = JSON.parse(gameData);
        currentPuzzle = data.puzzle;
        currentSolution = data.solution;
        difficulty = data.difficulty;
        isCustomGame = true;
        originalCustomPuzzle = [...data.puzzle]; // 保存原始谜题
        
        puzzleId = 'custom-' + Date.now();
        moves = [];
        notes = {};
        
        resetTimer();
        
        renderBoard('gridContainer', currentPuzzle);
        initNumberPad('numberPad');
        updateGameInfo();
        
        // 更新难度按钮（禁用）
        const btn = document.getElementById('difficultyBtn');
        if (btn) {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
        }
        
        // 清除localStorage中的临时数据
        localStorage.removeItem('customGameData');
    } else {
        // 如果没有自定义数据，生成新游戏
        loadPuzzle();
    }
}

function initDifficultyButton() {
    const btn = document.getElementById('difficultyBtn');
    if (btn) {
        btn.addEventListener('click', cycleDifficulty);
    }
}

function cycleDifficulty() {
    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    const currentIndex = difficulties.indexOf(difficulty);
    const nextIndex = (currentIndex + 1) % difficulties.length;
    switchDifficulty(difficulties[nextIndex]);
}

function switchDifficulty(newDifficulty) {
    saveCurrentGameState();
    stopTimer();
    timerStarted = false;
    timerPaused = false;
    timerSeconds = 0;
    updateTimerDisplay();
    
    const oldDifficulty = difficulty;
    difficulty = newDifficulty;
    
    if (gameHistory[difficulty] && gameHistory[difficulty].currentPuzzle) {
        loadSavedGame(difficulty);
        if (gameHistory[difficulty].timerSeconds !== undefined) {
            timerSeconds = gameHistory[difficulty].timerSeconds;
            timerStarted = false;
            timerPaused = false;
            updateTimerDisplay();
        }
    } else {
        loadPuzzle();
    }
    updateDifficultyButton();
}

function saveCurrentGameState() {
    if (currentPuzzle && difficulty) {
        if (!gameHistory[difficulty]) {
            gameHistory[difficulty] = {};
        }
        gameHistory[difficulty].currentPuzzle = [...currentPuzzle];
        gameHistory[difficulty].currentSolution = currentSolution;
        gameHistory[difficulty].notes = JSON.parse(JSON.stringify(notes));
        gameHistory[difficulty].moves = [...moves];
        gameHistory[difficulty].selectedCell = selectedCell;
        gameHistory[difficulty].selectedNumber = selectedNumber;
        gameHistory[difficulty].isNoteMode = isNoteMode;
        gameHistory[difficulty].isClearMode = isClearMode;
        gameHistory[difficulty].timerSeconds = timerSeconds;
        gameHistory[difficulty].timerStarted = timerStarted;
        gameHistory[difficulty].timerPaused = timerPaused;
    }
}

function loadSavedGame(diff) {
    const saved = gameHistory[diff];
    if (!saved || !saved.currentPuzzle) return;
    
    currentPuzzle = saved.currentPuzzle;
    currentSolution = saved.currentSolution;
    notes = saved.notes ? JSON.parse(JSON.stringify(saved.notes)) : {};
    moves = saved.moves ? [...saved.moves] : [];
    selectedCell = saved.selectedCell;
    selectedNumber = saved.selectedNumber;
    isNoteMode = saved.isNoteMode || false;
    isClearMode = saved.isClearMode || false;
    
    if (saved.timerSeconds !== undefined) {
        timerSeconds = saved.timerSeconds;
    } else {
        timerSeconds = 0;
    }
    timerStarted = saved.timerStarted || false;
    timerPaused = saved.timerPaused || false;
    updateTimerDisplay();
    
    renderBoard('gridContainer', currentPuzzle);
    initNumberPad('numberPad');
    updateGameInfo();
    updateNumberCounts();
    
    Object.keys(notes).forEach(index => {
        const idx = parseInt(index);
        const cell = document.querySelector(`[data-index="${idx}"]`);
        if (cell) {
            cell.innerHTML = generateNoteHTML(notes[idx]);
        }
    });
    
    const noteBtn = document.querySelector('.note-btn');
    const numBtns = document.querySelectorAll('.num-btn');
    if (isNoteMode) {
        noteBtn?.classList.add('note-mode');
        numBtns.forEach(btn => btn.classList.add('note-mode'));
    } else {
        noteBtn?.classList.remove('note-mode');
        numBtns.forEach(btn => btn.classList.remove('note-mode'));
    }
}

function updateDifficultyButton() {
    const btn = document.getElementById('difficultyBtn');
    if (!btn) return;
    
    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
    const textEl = btn.querySelector('.difficulty-text');
    const starsEl = btn.querySelector('.difficulty-stars');
    
    if (textEl) textEl.textContent = '难度';
    if (starsEl) starsEl.textContent = '★'.repeat(config.stars) + '☆'.repeat(4 - config.stars);
}

// 计时器函数
function startTimer() {
    if (timerPaused) {
        timerPaused = false;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);
        updateTimerDisplay();
        return;
    }
    
    if (timerStarted) return;
    
    timerStarted = true;
    timerPaused = false;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function pauseTimer() {
    if (timerStarted && !timerPaused) {
        timerPaused = true;
        stopTimer();
        updateTimerDisplay();
    }
}

function resetTimer() {
    stopTimer();
    timerSeconds = 0;
    timerStarted = false;
    timerPaused = false;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timerDisplay');
    if (!timerEl) return;
    
    const timeEl = timerEl.querySelector('.timer-time');
    if (timeEl) {
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const iconEl = timerEl.querySelector('.timer-icon');
    if (iconEl) {
        if (timerPaused) {
            iconEl.style.display = 'none';
            let pauseIcon = timerEl.querySelector('.pause-icon');
            if (!pauseIcon) {
                pauseIcon = document.createElement('span');
                pauseIcon.classList.add('pause-icon');
                pauseIcon.textContent = '⏸';
                iconEl.parentNode.insertBefore(pauseIcon, iconEl);
            }
            pauseIcon.style.display = 'inline';
        } else {
            iconEl.style.display = 'inline';
            const pauseIcon = timerEl.querySelector('.pause-icon');
            if (pauseIcon) pauseIcon.style.display = 'none';
        }
    }
    
    if (timerPaused) {
        timerEl.classList.add('paused');
    } else {
        timerEl.classList.remove('paused');
    }
}

function initTimer() {
    const timerEl = document.getElementById('timerDisplay');
    if (timerEl) {
        timerEl.addEventListener('click', () => {
            if (timerStarted) {
                if (timerPaused) {
                    startTimer();
                } else {
                    pauseTimer();
                }
            }
        });
    }
}

function loadPuzzle() {
    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
    const result = sudokuGenerator.generatePuzzle(difficulty);

    currentPuzzle = result.puzzle;
    currentSolution = result.solution;
    puzzleId = 'local-' + Date.now();
    moves = [];
    notes = {};
    currentDifficultyInfo = config;

    if (!gameHistory[difficulty]) {
        gameHistory[difficulty] = {};
    }
    gameHistory[difficulty].originalPuzzle = [...result.puzzle];
    gameHistory[difficulty].difficultyInfo = config;

    if (!currentGameCount[difficulty]) {
        currentGameCount[difficulty] = 0;
    }
    currentGameCount[difficulty]++;

    selectedCell = null;
    selectedNumber = null;
    isNoteMode = false;
    isClearMode = false;
    
    resetTimer();

    renderBoard('gridContainer', currentPuzzle);
    initNumberPad('numberPad');
    updateGameInfo();
    saveCurrentGameState();
}

function initNumberPad(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.classList.remove('num-pad');
    container.classList.add('action-btns-wrapper');

    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = '重新开始';
    newGameBtn.classList.add('action-btn', 'new-game-btn');
    newGameBtn.id = 'newGameBtn';
    newGameBtn.addEventListener('click', showRestartDialog);
    container.appendChild(newGameBtn);

    const numPad = document.createElement('div');
    numPad.classList.add('num-pad');

    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.classList.add('num-btn');
        btn.setAttribute('data-num', i);

        const numSpan = document.createElement('span');
        numSpan.textContent = i;
        btn.appendChild(numSpan);

        const countSpan = document.createElement('span');
        countSpan.classList.add('count');
        countSpan.textContent = getNumberRemaining(i);
        btn.appendChild(countSpan);

        btn.addEventListener('click', () => {
            startTimer();
            selectNumber(i);
        });
        numPad.appendChild(btn);
    }
    container.appendChild(numPad);

    const actionBtns = document.createElement('div');
    actionBtns.classList.add('action-btns');

    const leftGroup = document.createElement('div');
    leftGroup.classList.add('left-group');

    const noteBtn = document.createElement('button');
    noteBtn.textContent = '笔记';
    noteBtn.classList.add('action-btn', 'wide', 'note-btn');
    noteBtn.addEventListener('click', toggleNoteMode);
    leftGroup.appendChild(noteBtn);

    const undoBtn = document.createElement('button');
    undoBtn.textContent = '回退';
    undoBtn.classList.add('action-btn', 'wide');
    undoBtn.id = 'undoBtn';
    undoBtn.addEventListener('click', undoMove);
    leftGroup.appendChild(undoBtn);

    actionBtns.appendChild(leftGroup);

    const rightGroup = document.createElement('div');
    rightGroup.classList.add('right-group');

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清除';
    clearBtn.classList.add('action-btn', 'square');
    clearBtn.id = 'clearBtn';
    clearBtn.addEventListener('click', toggleClearMode);
    rightGroup.appendChild(clearBtn);

    const shareBtn = document.createElement('button');
    shareBtn.textContent = '分享';
    shareBtn.classList.add('action-btn', 'square');
    shareBtn.id = 'shareBtn';
    shareBtn.addEventListener('click', shareGame);
    rightGroup.appendChild(shareBtn);

    actionBtns.appendChild(rightGroup);
    container.appendChild(actionBtns);
}

function getNumberRemaining(num) {
    if (!currentPuzzle) return 9;
    let count = 0;
    for (let i = 0; i < 81; i++) {
        if (currentPuzzle[i] === num) count++;
    }
    return 9 - count;
}

function updateNumberCounts() {
    for (let i = 1; i <= 9; i++) {
        const btn = document.querySelector(`.num-btn[data-num="${i}"]`);
        if (btn) {
            const countSpan = btn.querySelector('.count');
            const remaining = getNumberRemaining(i);
            
            if (countSpan) countSpan.textContent = remaining;

            if (remaining === 0) {
                btn.classList.remove('completed');
                void btn.offsetWidth;
                btn.classList.add('completed');
                btn.disabled = true;
            } else {
                btn.classList.remove('completed');
                btn.disabled = false;
            }
        }
    }
}

function removeNotesForNumber(index, num) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    document.querySelectorAll('.cell').forEach((cell, idx) => {
        const cellRow = Math.floor(idx / 9);
        const cellCol = idx % 9;
        const cellBoxRow = Math.floor(cellRow / 3);
        const cellBoxCol = Math.floor(cellCol / 3);

        const isRelated = cellRow === row || cellCol === col || 
                         (cellBoxRow === boxRow && cellBoxCol === boxCol);

        if (isRelated && notes[idx] && notes[idx].includes(num)) {
            const noteIndex = notes[idx].indexOf(num);
            if (noteIndex > -1) {
                notes[idx].splice(noteIndex, 1);
                
                const targetCell = document.querySelector(`[data-index="${idx}"]`);
                if (notes[idx].length === 0) {
                    delete notes[idx];
                    if (targetCell) targetCell.innerHTML = '';
                } else {
                    if (targetCell) targetCell.innerHTML = generateNoteHTML(notes[idx]);
                }
            }
        }
    });
}

function checkAndTriggerCompletionAnimations(index, num) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    if (getNumberRemaining(num) === 0) {
        document.querySelectorAll('.cell').forEach((cell, idx) => {
            if (currentPuzzle[idx] === num) {
                triggerPulseAnimation(cell);
            }
        });
    }

    if (isRowComplete(row)) {
        for (let c = 0; c < 9; c++) {
            const idx = row * 9 + c;
            const cell = document.querySelector(`[data-index="${idx}"]`);
            if (cell) triggerPulseAnimation(cell);
        }
    }

    if (isColComplete(col)) {
        for (let r = 0; r < 9; r++) {
            const idx = r * 9 + col;
            const cell = document.querySelector(`[data-index="${idx}"]`);
            if (cell) triggerPulseAnimation(cell);
        }
    }

    if (isBoxComplete(boxRow, boxCol)) {
        for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
            for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                const idx = r * 9 + c;
                const cell = document.querySelector(`[data-index="${idx}"]`);
                if (cell) triggerPulseAnimation(cell);
            }
        }
    }
}

function isRowComplete(row) {
    for (let c = 0; c < 9; c++) {
        if (currentPuzzle[row * 9 + c] === 0) return false;
    }
    return true;
}

function isColComplete(col) {
    for (let r = 0; r < 9; r++) {
        if (currentPuzzle[r * 9 + col] === 0) return false;
    }
    return true;
}

function isBoxComplete(boxRow, boxCol) {
    for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
            if (currentPuzzle[r * 9 + c] === 0) return false;
        }
    }
    return true;
}

function triggerPulseAnimation(element) {
    element.classList.remove('completed');
    void element.offsetWidth;
    element.classList.add('completed');
}

function selectNumber(num) {
    // 播放数字按钮点击音效
    if (window.SoundManager) {
        window.SoundManager.play('click');
    }
    
    // 彩蛋检测：笔记模式下输入特定序列自动完成棋盘
    if (isNoteMode) {
        cheatCode += num.toString();
        // 只保留最后12位
        if (cheatCode.length > CHEAT_SEQUENCE.length) {
            cheatCode = cheatCode.slice(-CHEAT_SEQUENCE.length);
        }
        // 检查是否匹配彩蛋序列
        if (cheatCode === CHEAT_SEQUENCE) {
            completePuzzle();
            cheatCode = '';
            return;
        }
    } else {
        // 非笔记模式时重置彩蛋码
        cheatCode = '';
    }
    
    if (isClearMode) {
        const count = getNoteCount(num);
        if (count > 0) {
            if (confirm(`确定要清除所有数字 ${num} 的笔记吗？`)) {
                clearNotesForNumber(num);
            }
        }
        return;
    }
    
    if (selectedNumber === num) {
        selectedNumber = null;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight-num', 'highlight-cell', 'selected'));
        document.querySelectorAll('.cell').forEach((cell, idx) => {
            cell.classList.remove('note-highlight');
        });
    } else {
        selectedNumber = num;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector(`.num-btn[data-num="${num}"]`).classList.add('selected');

        selectedCell = null;
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlight-row', 'highlight-col', 'highlight-box', 'note-highlight');
        });
        highlightNumberOnBoard(num);
        highlightNotesOnBoard(num);
    }
}

function highlightNumberOnBoard(num) {
    document.querySelectorAll('.cell').forEach((cell, idx) => {
        cell.classList.remove('highlight-num');
        if (currentPuzzle[idx] === num) {
            cell.classList.add('highlight-num');
        }
    });
}

function highlightNotesOnBoard(num) {
    document.querySelectorAll('.cell').forEach((cell, idx) => {
        if (notes[idx] && notes[idx].includes(num)) {
            cell.classList.add('note-highlight');
        }
    });
}

function toggleNoteMode() {
    if (isClearMode) {
        const hasNotes = Object.keys(notes).length > 0;
        if (hasNotes) {
            if (confirm('确定要清除所有笔记吗？')) {
                clearAllNotes();
            }
        }
        return;
    }
    
    isNoteMode = !isNoteMode;
    const noteBtn = document.querySelector('.note-btn');
    const numBtns = document.querySelectorAll('.num-btn');

    if (isNoteMode) {
        noteBtn.classList.add('note-mode');
        numBtns.forEach(btn => btn.classList.add('note-mode'));
    } else {
        noteBtn.classList.remove('note-mode');
        numBtns.forEach(btn => btn.classList.remove('note-mode'));
    }
}

function toggleClearMode() {
    isClearMode = !isClearMode;
    const clearBtn = document.getElementById('clearBtn');
    if (isClearMode) {
        clearBtn.classList.add('selected');
        clearBtn.style.background = '#f44336';
        
        if (isNoteMode) {
            isNoteMode = false;
            const noteBtn = document.querySelector('.note-btn');
            const numBtns = document.querySelectorAll('.num-btn');
            noteBtn.classList.remove('note-mode');
            numBtns.forEach(btn => btn.classList.remove('note-mode'));
        }
        
        selectedNumber = null;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight-num', 'highlight-cell', 'selected', 'note-highlight'));
    } else {
        clearBtn.classList.remove('selected');
        clearBtn.style.background = '';
    }
}

function getNoteCount(num) {
    let count = 0;
    Object.values(notes).forEach(noteList => {
        if (noteList.includes(num)) count++;
    });
    return count;
}

function clearNotesForNumber(num) {
    Object.keys(notes).forEach(index => {
        const idx = parseInt(index);
        if (notes[idx] && notes[idx].includes(num)) {
            notes[idx] = notes[idx].filter(n => n !== num);
            if (notes[idx].length === 0) {
                delete notes[idx];
            }
            const cell = document.querySelector(`[data-index="${idx}"]`);
            if (cell) {
                cell.innerHTML = notes[idx] ? generateNoteHTML(notes[idx]) : '';
                cell.classList.remove('note-highlight');
            }
        }
    });
}

function clearAllNotes() {
    Object.keys(notes).forEach(index => {
        const idx = parseInt(index);
        const cell = document.querySelector(`[data-index="${idx}"]`);
        if (cell) {
            cell.innerHTML = '';
            cell.classList.remove('note-highlight');
        }
    });
    notes = {};
}

// 自动完成棋盘（彩蛋功能）
function completePuzzle() {
    if (!currentSolution) {
        console.log('completePuzzle: No solution available');
        return;
    }
    
    const originalPuzzle = gameHistory[difficulty]?.originalPuzzle || originalCustomPuzzle;
    
    currentSolution.forEach((value, index) => {
        // 跳过初始已填的格子
        if (originalPuzzle && originalPuzzle[index] !== 0) return;
        
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (cell && !cell.classList.contains('fixed')) {
            currentPuzzle[index] = value;
            cell.textContent = value;
            cell.classList.add('user-input');
            cell.classList.remove('error', 'selected', 'highlight-cell');
            
            // 清除该格子的笔记
            if (notes[index]) {
                delete notes[index];
            }
        }
    });
    
    // 更新数字计数
    updateNumberCounts();
    
    // 播放完成音效
    if (window.SoundManager) {
        window.SoundManager.play('win');
    }
    
    // 显示完成动画
    setTimeout(() => {
        document.querySelectorAll('.cell.user-input').forEach(cell => {
            cell.classList.add('completed');
        });
    }, 100);
    
    // 关闭笔记模式
    isNoteMode = false;
    const noteBtn = document.querySelector('.note-btn');
    const numBtns = document.querySelectorAll('.num-btn');
    if (noteBtn) noteBtn.classList.remove('note-mode');
    numBtns.forEach(btn => btn.classList.remove('note-mode'));
    
    alert('恭喜！棋盘已自动完成！');
}

function addNote(index, num) {
    const cell = document.querySelector(`[data-index="${index}"]`);

    if (!cell || cell.classList.contains('fixed')) return;
    if (currentPuzzle[index] !== 0) return;

    const oldNotes = notes[index] ? [...notes[index]] : [];

    if (!notes[index]) notes[index] = [];

    const noteIndex = notes[index].indexOf(num);
    if (noteIndex === -1) {
        notes[index].push(num);
        // 播放添加笔记音效
        if (window.SoundManager) {
            window.SoundManager.play('note_add');
        }
    } else {
        notes[index].splice(noteIndex, 1);
        // 播放删除笔记音效
        if (window.SoundManager) {
            window.SoundManager.play('note_remove');
        }
    }

    moves.push({
        index,
        value: 0,
        notes: oldNotes.length > 0 ? oldNotes : null,
        type: 'note',
        timestamp: Date.now()
    });

    if (notes[index].length === 0) {
        delete notes[index];
    }

    if (notes[index]) {
        cell.innerHTML = generateNoteHTML(notes[index]);
        if (selectedNumber !== null && notes[index].includes(selectedNumber)) {
            cell.classList.add('note-highlight');
        } else {
            cell.classList.remove('note-highlight');
        }
    } else {
        cell.innerHTML = '';
        cell.classList.remove('note-highlight');
    }
}

function generateNoteHTML(noteNumbers) {
    let html = '<div class="note">';
    for (let i = 1; i <= 9; i++) {
        html += `<span>${noteNumbers.includes(i) ? i : ''}</span>`;
    }
    html += '</div>';
    return html;
}

function renderBoard(containerId, puzzle) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // 获取原始谜题（优先使用编辑器导入的）
    const originalPuzzle = isCustomGame && originalCustomPuzzle ? originalCustomPuzzle : gameHistory[difficulty]?.originalPuzzle;

    puzzle.forEach((value, index) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = index;

        const row = Math.floor(index / 9);
        const col = index % 9;

        if (value !== 0) {
            cell.textContent = value;
            // 判断是否是固定数字（编辑器导入的或原始谜题中的）
            if (originalPuzzle && originalPuzzle[index] !== 0) {
                cell.classList.add('fixed');
            } else {
                cell.classList.add('user-input');
                if (value !== (gameHistory[difficulty]?.solution || currentSolution)[index]) {
                    cell.classList.add('error');
                }
            }
        } else if (notes[index]) {
            cell.innerHTML = generateNoteHTML(notes[index]);
        }

        if (row % 3 === 0 && row !== 0) {
            cell.style.borderTopWidth = '2.5px';
            cell.style.borderTopColor = 'rgba(255,255,255,0.5)';
        }
        if (col % 3 === 0 && col !== 0) {
            cell.style.borderLeftWidth = '2.5px';
            cell.style.borderLeftColor = 'rgba(255,255,255,0.5)';
        }

        cell.addEventListener('click', () => selectCell(index));
        container.appendChild(cell);
    });

    updateHighlights();
}

function selectCell(index) {
    startTimer();
    
    selectedCell = index;

    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
    });

    const cell = document.querySelector(`[data-index="${index}"]`);
    if (cell) cell.classList.add('selected');

    if (selectedNumber === null) {
        updateHighlights();
        
        const clickedValue = currentPuzzle[index];
        if (clickedValue !== 0) {
            highlightNumberOnBoard(clickedValue);
        }
    }

    if (isClearMode) {
        clearCell();
        return;
    }

    if (selectedNumber !== null) {
        if (isNoteMode) {
            addNote(index, selectedNumber);
        } else {
            fillCell(selectedNumber);
        }
        selectedCell = null;
        document.querySelectorAll('.cell').forEach(c => {
            c.classList.remove('selected', 'highlight-row', 'highlight-col', 'highlight-box');
        });
        if (selectedNumber !== null) {
            highlightNumberOnBoard(selectedNumber);
        }
    }
}

function updateHighlights() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('highlight-row', 'highlight-col', 'highlight-box', 'highlight-num');
    });

    if (selectedCell === null) return;

    const row = Math.floor(selectedCell / 9);
    const col = selectedCell % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    document.querySelectorAll('.cell').forEach((cell, idx) => {
        const cellRow = Math.floor(idx / 9);
        const cellCol = idx % 9;
        const cellBoxRow = Math.floor(cellRow / 3);
        const cellBoxCol = Math.floor(cellCol / 3);

        if (cellRow === row) cell.classList.add('highlight-row');
        if (cellCol === col) cell.classList.add('highlight-col');
        if (cellBoxRow === boxRow && cellBoxCol === boxCol) cell.classList.add('highlight-box');
    });
}

function fillCell(num) {
    if (selectedCell === null) return;

    const index = selectedCell;
    const cell = document.querySelector(`[data-index="${index}"]`);
    // 获取原始谜题（优先使用编辑器导入的）
    const originalPuzzle = isCustomGame && originalCustomPuzzle ? originalCustomPuzzle : gameHistory[difficulty]?.originalPuzzle;

    // 如果是固定数字，不允许修改
    if (!cell || cell.classList.contains('fixed')) return;
    if (originalPuzzle && originalPuzzle[index] !== 0) return;

    const prevValue = currentPuzzle[index];
    const prevNotes = notes[index] ? [...notes[index]] : null;

    if (prevValue === num) {
        moves.push({ index, prevValue, notes: prevNotes, type: 'fill' });

        currentPuzzle[index] = 0;
        cell.textContent = '';
        cell.innerHTML = '';
        cell.classList.remove('user-input', 'error');
        
        if (prevNotes && prevNotes.length > 0) {
            notes[index] = prevNotes;
            cell.innerHTML = generateNoteHTML(prevNotes);
            if (selectedNumber !== null && prevNotes.includes(selectedNumber)) {
                cell.classList.add('note-highlight');
            }
        }
        
        // 播放删除音效
        if (window.SoundManager) {
            window.SoundManager.play('delete');
        }
        
        updateNumberCounts();
        return;
    }

    moves.push({ index, prevValue, notes: prevNotes, type: 'fill' });

    currentPuzzle[index] = num;
    delete notes[index];
    cell.textContent = num;
    cell.innerHTML = num;
    cell.classList.add('user-input');
    cell.classList.remove('note-highlight');

    if (num !== currentSolution[index]) {
        cell.classList.add('error');
        // 播放错误音效
        if (window.SoundManager) {
            window.SoundManager.play('error');
        }
    } else {
        cell.classList.remove('error');
        // 播放正确填入数字音效
        if (window.SoundManager) {
            window.SoundManager.play('number');
        }
    }

    removeNotesForNumber(index, num);
    checkAndTriggerCompletionAnimations(index, num);

    updateNumberCounts();
    checkWin();
}

function clearCell() {
    if (selectedCell === null) return;

    const index = selectedCell;
    const cell = document.querySelector(`[data-index="${index}"]`);
    // 获取原始谜题（优先使用编辑器导入的）
    const originalPuzzle = isCustomGame && originalCustomPuzzle ? originalCustomPuzzle : gameHistory[difficulty]?.originalPuzzle;

    // 如果是固定数字，不允许清除
    if (!cell || cell.classList.contains('fixed')) return;
    if (originalPuzzle && originalPuzzle[index] !== 0) return;

    const prevValue = currentPuzzle[index];
    const prevNotes = notes[index] ? [...notes[index]] : null;

    if (prevValue === 0 && !prevNotes) return;

    moves.push({ index, prevValue, notes: prevNotes, type: 'clear' });

    currentPuzzle[index] = 0;
    delete notes[index];
    cell.textContent = '';
    cell.innerHTML = '';
    cell.classList.remove('error');

    updateNumberCounts();
}

function undoMove() {
    if (moves.length === 0) return;

    const lastMove = moves.pop();
    const index = lastMove.index;
    const cell = document.querySelector(`[data-index="${index}"]`);

    if (!cell) return;

    if (lastMove.type === 'fill') {
        currentPuzzle[index] = lastMove.prevValue;
        if (lastMove.prevValue === 0) {
            cell.textContent = '';
            if (lastMove.notes && lastMove.notes.length > 0) {
                notes[index] = lastMove.notes;
                cell.innerHTML = generateNoteHTML(lastMove.notes);
            } else {
                cell.innerHTML = '';
            }
        } else {
            cell.textContent = lastMove.prevValue;
            cell.innerHTML = lastMove.prevValue;
        }
        cell.classList.remove('error');
        cell.classList.remove('user-input');
    } else if (lastMove.type === 'clear') {
        if (lastMove.notes) {
            notes[index] = lastMove.notes;
            cell.innerHTML = generateNoteHTML(lastMove.notes);
        } else {
            currentPuzzle[index] = lastMove.prevValue;
            cell.textContent = lastMove.prevValue;
            cell.innerHTML = lastMove.prevValue;
            if (lastMove.prevValue !== currentSolution[index]) {
                cell.classList.add('error');
            }
        }
    } else if (lastMove.type === 'note') {
        notes[index] = lastMove.notes;
        if (notes[index] && notes[index].length > 0) {
            cell.innerHTML = generateNoteHTML(lastMove.notes);
            if (selectedNumber !== null && notes[index].includes(selectedNumber)) {
                cell.classList.add('note-highlight');
            } else {
                cell.classList.remove('note-highlight');
            }
        } else {
            delete notes[index];
            cell.innerHTML = '';
            cell.classList.remove('note-highlight');
        }
    }

    updateNumberCounts();
}

function checkWin() {
    const isComplete = currentPuzzle.every((val, idx) => val === currentSolution[idx]);
    if (isComplete) {
        stopTimer();
        alert('恭喜通关！');
    }
}

function updateGameInfo() {
    updateDifficultyButton();
}

function showRestartDialog() {
    const dialog = document.createElement('div');
    dialog.classList.add('new-game-dialog');

    const content = document.createElement('div');
    content.classList.add('new-game-dialog-content');

    const title = document.createElement('h3');
    title.textContent = '确认重新开始';
    content.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = '确定要重新开始当前游戏吗？所有进度将丢失。';
    content.appendChild(desc);

    const btnContainer = document.createElement('div');
    btnContainer.classList.add('dialog-buttons');

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确定';
    confirmBtn.classList.add('dialog-btn', 'dialog-btn-primary');
    confirmBtn.addEventListener('click', () => {
        dialog.remove();
        restartCurrentPuzzle();
    });
    btnContainer.appendChild(confirmBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.classList.add('dialog-btn', 'dialog-btn-cancel');
    cancelBtn.addEventListener('click', () => {
        dialog.remove();
    });
    btnContainer.appendChild(cancelBtn);

    content.appendChild(btnContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}
function restartCurrentPuzzle() {
    if (currentSolution && gameHistory[difficulty] && gameHistory[difficulty].originalPuzzle) {
        currentPuzzle = gameHistory[difficulty].originalPuzzle.map(v => v);
        moves = [];
        notes = {};
        selectedCell = null;
        selectedNumber = null;
        
        resetTimer();

        renderBoard('gridContainer', currentPuzzle);
        initNumberPad('numberPad');
        updateNumberCounts();
    }
}

const randomSlogans = [
    '挑战你的极限！', '经典数独等你来战！', '脑力大考验！', '你能解开吗？',
    '思维的艺术', '数字的魅力', '逻辑的挑战', '智慧的较量',
    '耐心的考验', '完美的谜题', '等你来征服！', '烧脑时刻到！',
    '思维风暴来袭！', '数字迷宫探险', '脑力体操时间'
];

function generateRandomSlogan() {
    return randomSlogans[Math.floor(Math.random() * randomSlogans.length)];
}

function generateGameId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 使用时间戳确保唯一性（精确到毫秒）
    const timestamp = Date.now();
    
    return `${year}${month}${day}-${timestamp}`;
}

function shareGame() {
    // 检查是否登录
    if (!window.UserManager || !UserManager.isLoggedIn()) {
        alert('请先登录账号才能分享游戏到共创乐园！\n\n即将跳转至账号页面...');
        setTimeout(() => {
            window.location.href = 'account.html';
        }, 1000);
        return;
    }
    
    // 创建分享对话框
    const dialog = document.createElement('div');
    dialog.classList.add('new-game-dialog');

    const content = document.createElement('div');
    content.classList.add('new-game-dialog-content');

    const title = document.createElement('h3');
    title.textContent = '分享游戏';
    content.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = '请选择分享方式';
    content.appendChild(desc);

    const btnContainer = document.createElement('div');
    btnContainer.classList.add('dialog-buttons');

    // 分享至共创乐园
    const paradiseBtn = document.createElement('button');
    paradiseBtn.textContent = '分享至共创乐园';
    paradiseBtn.classList.add('dialog-btn', 'dialog-btn-primary');
    paradiseBtn.addEventListener('click', () => {
        dialog.remove();
        shareToParadise();
    });
    btnContainer.appendChild(paradiseBtn);

    // 分享到编辑器
    const editorBtn = document.createElement('button');
    editorBtn.textContent = '分享到编辑器';
    editorBtn.classList.add('dialog-btn', 'dialog-btn-secondary');
    editorBtn.addEventListener('click', () => {
        dialog.remove();
        shareToEditor();
    });
    btnContainer.appendChild(editorBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.classList.add('dialog-btn', 'dialog-btn-cancel');
    cancelBtn.addEventListener('click', () => {
        dialog.remove();
    });
    btnContainer.appendChild(cancelBtn);

    content.appendChild(btnContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

// 分享至共创乐园（分享初始状态）
function shareToParadise() {
    // 获取当前用户信息
    const user = UserManager.getUser();
    
    // 创建分享对话框
    const dialog = document.createElement('div');
    dialog.classList.add('new-game-dialog');

    const content = document.createElement('div');
    content.classList.add('new-game-dialog-content');

    const title = document.createElement('h3');
    title.textContent = '分享游戏到共创乐园';
    content.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = '请输入游戏标语（最多20字）';
    content.appendChild(desc);

    // 创建输入框容器
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('slogan-input-container');

    // 标语输入框
    const sloganInput = document.createElement('input');
    sloganInput.type = 'text';
    sloganInput.maxLength = 20;
    sloganInput.placeholder = '输入游戏标语...';
    sloganInput.classList.add('slogan-input');
    // 使用用户的默认标语作为默认值
    sloganInput.value = user.defaultSlogan || generateRandomSlogan();
    inputContainer.appendChild(sloganInput);

    // 随机生成按钮（使用SVG图标）
    const randomBtn = document.createElement('button');
    randomBtn.classList.add('random-btn');
    randomBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
    `;
    randomBtn.title = '随机生成';
    randomBtn.addEventListener('click', () => {
        sloganInput.value = generateRandomSlogan();
    });
    inputContainer.appendChild(randomBtn);

    content.appendChild(inputContainer);

    // 右上角关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('dialog-close-btn');
    closeBtn.innerHTML = '×';
    closeBtn.title = '关闭';
    closeBtn.addEventListener('click', () => {
        dialog.remove();
    });
    content.appendChild(closeBtn);

    const btnContainer = document.createElement('div');
    btnContainer.classList.add('dialog-buttons');

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '分享';
    confirmBtn.classList.add('dialog-btn', 'dialog-btn-primary');
    confirmBtn.addEventListener('click', () => {
        const slogan = sloganInput.value.trim() || '未命名游戏';
        
        // 生成游戏编号
        const gameId = generateGameId();
        
        // 创建分享数据（分享初始状态）
        const originalPuzzle = originalCustomPuzzle?.join('') || currentPuzzle.join('');
        const sharedGame = {
            id: Date.now().toString(),
            gameCode: gameId, // 游戏编号
            userId: user?.id || null,        // 用户ID（不会变化）
            username: user?.username || null, // 用户名（不会变化）
            nickname: user?.nickname || user?.username || '当前玩家', // 昵称（可变化）
            puzzle: originalPuzzle,
            solution: currentSolution.join(''),
            playerPuzzle: originalPuzzle, // 分享初始状态，不包含游戏进度
            slogan: slogan,
            difficulty: difficulty,
            shareTime: new Date().toLocaleString('zh-CN'),
            participants: 0,
            completed: 0,
            notes: JSON.parse(JSON.stringify(notes)),
            moves: [...moves],
            // 添加评论数组，标语作为首条评论
            comments: [{
                id: Date.now().toString(),
                nickname: user?.nickname || user?.username || '当前玩家',
                content: slogan,
                time: new Date().toLocaleString('zh-CN')
            }]
        };

        // 保存到本地存储（模拟分享）
        const sharedGames = JSON.parse(localStorage.getItem('sharedGames') || '[]');
        sharedGames.unshift(sharedGame);
        localStorage.setItem('sharedGames', JSON.stringify(sharedGames));

        // 同步到腾讯云开发
        (async function saveToTCB() {
            try {
                const { initTCB, addSharedGame } = await import('./tcb-service.js');
                await initTCB();
                await addSharedGame(sharedGame);
                console.log('TCB: Game shared successfully');
            } catch (error) {
                console.error('TCB share error:', error);
            }
        })();

        // 发送站内信（使用游戏的 id 而不是 gameCode）
        sendMessage(sharedGame.id);

        dialog.remove();
        alert(`分享成功！\n\n游戏已发布到共创乐园\n游戏编号：${gameId}\n\n站内信已发送`);
    });
    btnContainer.appendChild(confirmBtn);

    content.appendChild(btnContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
}

// 分享到编辑器（分享当前进度状态）
function shareToEditor() {
    // 保存当前游戏状态到localStorage
    const gameData = {
        puzzle: [...currentPuzzle],
        solution: [...currentSolution],
        difficulty: difficulty,
        notes: JSON.parse(JSON.stringify(notes)),
        moves: [...moves],
        fromGame: true // 标记来自自定义游戏
    };
    
    localStorage.setItem('customGameData', JSON.stringify(gameData));
    
    alert('游戏进度已保存！\n\n即将跳转至编辑器，你可以继续编辑或分享此游戏。');
    
    // 跳转到编辑器
    window.location.href = 'custom-editor.html';
}

function sendMessage(gameId, type = 'system', title = '系统通知', content = '') {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    
    // 检查是否已存在相同类型和gameId的未读消息（避免重复发送）
    const exists = messages.some(m => 
        !m.read && m.gameId === gameId && m.type === type
    );
    
    if (!exists) {
        messages.unshift({
            id: Date.now().toString(),
            title: title || '系统通知',
            content: content || `您分享的数独游戏已发布到共创乐园！游戏编号：${gameId}`,
            time: new Date().toLocaleString('zh-CN'),
            read: false,
            type: type,
            gameId: gameId,
            participants: 0,
            completed: 0
        });
        localStorage.setItem('messages', JSON.stringify(messages));
    }
}