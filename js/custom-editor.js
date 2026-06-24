// 自定义游戏编辑器模块

// 全局变量
let currentPuzzle = Array(81).fill(0);
let currentSolution = null;
let selectedCell = null;
let selectedNumber = null;
let isClearMode = false;
let detectedDifficulty = null;

// 难度配置
const DIFFICULTY_CONFIG = {
    easy: { name: '简单', stars: 1, minHoles: 30, maxHoles: 38 },
    medium: { name: '中等', stars: 2, minHoles: 39, maxHoles: 47 },
    hard: { name: '困难', stars: 3, minHoles: 48, maxHoles: 54 },
    expert: { name: '专家', stars: 4, minHoles: 55, maxHoles: 60 }
};

// 数独求解器
class SudokuSolver {
    constructor() {}

    // 检查数独是否有效（无重复）
    isValid(grid) {
        // 检查每行
        for (let r = 0; r < 9; r++) {
            const row = new Set();
            for (let c = 0; c < 9; c++) {
                const val = grid[r * 9 + c];
                if (val !== 0) {
                    if (row.has(val)) return false;
                    row.add(val);
                }
            }
        }

        // 检查每列
        for (let c = 0; c < 9; c++) {
            const col = new Set();
            for (let r = 0; r < 9; r++) {
                const val = grid[r * 9 + c];
                if (val !== 0) {
                    if (col.has(val)) return false;
                    col.add(val);
                }
            }
        }

        // 检查每个3x3宫格
        for (let box = 0; box < 9; box++) {
            const boxSet = new Set();
            const boxRow = Math.floor(box / 3) * 3;
            const boxCol = (box % 3) * 3;
            for (let r = boxRow; r < boxRow + 3; r++) {
                for (let c = boxCol; c < boxCol + 3; c++) {
                    const val = grid[r * 9 + c];
                    if (val !== 0) {
                        if (boxSet.has(val)) return false;
                        boxSet.add(val);
                    }
                }
            }
        }

        return true;
    }

    // 计算解的数量
    countSolutions(grid, maxCount = 3) {
        const gridCopy = [...grid];
        return this._countSolutions(gridCopy, maxCount);
    }

    _countSolutions(grid, maxCount) {
        const emptyIndex = grid.indexOf(0);
        if (emptyIndex === -1) return 1;

        const row = Math.floor(emptyIndex / 9);
        const col = emptyIndex % 9;
        let count = 0;

        for (let num = 1; num <= 9; num++) {
            if (this._isValidPlacement(grid, row, col, num)) {
                grid[emptyIndex] = num;
                count += this._countSolutions(grid, maxCount - count);
                grid[emptyIndex] = 0;
                if (count >= maxCount) break;
            }
        }

        return count;
    }

    _isValidPlacement(grid, row, col, num) {
        // 检查行
        for (let c = 0; c < 9; c++) {
            if (grid[row * 9 + c] === num) return false;
        }

        // 检查列
        for (let r = 0; r < 9; r++) {
            if (grid[r * 9 + col] === num) return false;
        }

        // 检查宫格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r * 9 + c] === num) return false;
            }
        }

        return true;
    }

    // 求解数独
    solve(grid) {
        const gridCopy = [...grid];
        if (this._solve(gridCopy)) {
            return gridCopy;
        }
        return null;
    }

    _solve(grid) {
        const emptyIndex = grid.indexOf(0);
        if (emptyIndex === -1) return true;

        const row = Math.floor(emptyIndex / 9);
        const col = emptyIndex % 9;

        for (let num = 1; num <= 9; num++) {
            if (this._isValidPlacement(grid, row, col, num)) {
                grid[emptyIndex] = num;
                if (this._solve(grid)) return true;
                grid[emptyIndex] = 0;
            }
        }

        return false;
    }
}

const solver = new SudokuSolver();

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initEditor();
    initMusicControl();
});

function initEditor() {
    // 检查是否有来自趣味数独的游戏数据
    const gameData = localStorage.getItem('customGameData');
    if (gameData) {
        const data = JSON.parse(gameData);
        
        // 如果是来自趣味数独的分享
        if (data.fromGame) {
            currentPuzzle = data.puzzle;
            currentSolution = data.solution;
            
            // 计算空格数并判定难度
            const holes = currentPuzzle.filter(v => v === 0).length;
            let detectedDiff = 'medium';
            for (const [key, config] of Object.entries(DIFFICULTY_CONFIG)) {
                if (holes >= config.minHoles && holes <= config.maxHoles) {
                    detectedDiff = key;
                    break;
                }
            }
            detectedDifficulty = detectedDiff;
            
            alert(`已加载来自趣味数独的游戏状态！\n\n当前难度：${DIFFICULTY_CONFIG[detectedDiff].name}\n空格数：${holes}`);
            
            // 清除localStorage中的临时数据
            localStorage.removeItem('customGameData');
        }
    }
    
    renderBoard('gridContainer', currentPuzzle);
    initNumberPad('numberPad');
}

// 音乐控制按钮初始化
function initMusicControl() {
    const musicBtn = document.getElementById('musicControlBtn');
    if (musicBtn && window.AudioManager) {
        // 自动播放背景音乐
        window.AudioManager.startGameMusic();
        
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

function initNumberPad(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.classList.remove('num-pad');
    container.classList.add('action-btns-wrapper');

    const startBtn = document.createElement('button');
    startBtn.textContent = '开始游戏';
    startBtn.classList.add('action-btn', 'new-game-btn');
    startBtn.id = 'startBtn';
    startBtn.addEventListener('click', startGame);
    container.appendChild(startBtn);

    const numPad = document.createElement('div');
    numPad.classList.add('num-pad');

    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.classList.add('num-btn');
        btn.setAttribute('data-num', i);

        const numSpan = document.createElement('span');
        numSpan.textContent = i;
        btn.appendChild(numSpan);

        btn.addEventListener('click', () => {
            selectNumber(i);
        });
        numPad.appendChild(btn);
    }
    container.appendChild(numPad);

    const actionBtns = document.createElement('div');
    actionBtns.classList.add('action-btns');

    const leftGroup = document.createElement('div');
    leftGroup.classList.add('left-group');

    const verifyBtn = document.createElement('button');
    verifyBtn.textContent = '核验';
    verifyBtn.classList.add('action-btn', 'wide', 'note-btn');
    verifyBtn.addEventListener('click', verifyPuzzle);
    leftGroup.appendChild(verifyBtn);

    const randomBtn = document.createElement('button');
    randomBtn.textContent = '随机';
    randomBtn.classList.add('action-btn', 'wide');
    randomBtn.id = 'randomBtn';
    randomBtn.addEventListener('click', fillRandomNumbers);
    leftGroup.appendChild(randomBtn);

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

function selectNumber(num) {
    if (isClearMode) {
        // 清除模式：清除所有该数字
        clearNumber(num);
        return;
    }

    if (selectedNumber === num) {
        selectedNumber = null;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight-num', 'selected'));
    } else {
        selectedNumber = num;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector(`.num-btn[data-num="${num}"]`).classList.add('selected');

        selectedCell = null;
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlight-row', 'highlight-col', 'highlight-box');
        });
        highlightNumberOnBoard(num);
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

function toggleClearMode() {
    isClearMode = !isClearMode;
    const clearBtn = document.getElementById('clearBtn');
    if (isClearMode) {
        clearBtn.classList.add('selected');
        clearBtn.style.background = '#f44336';
        
        selectedNumber = null;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight-num', 'selected'));
    } else {
        clearBtn.classList.remove('selected');
        clearBtn.style.background = '';
    }
}

function clearNumber(num) {
    currentPuzzle.forEach((val, idx) => {
        if (val === num) {
            currentPuzzle[idx] = 0;
            const cell = document.querySelector(`[data-index="${idx}"]`);
            if (cell) {
                cell.textContent = '';
                cell.innerHTML = '';
                cell.classList.remove('fixed', 'error');
            }
        }
    });
}

function renderBoard(containerId, puzzle) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    puzzle.forEach((value, index) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = index;

        const row = Math.floor(index / 9);
        const col = index % 9;

        if (value !== 0) {
            cell.textContent = value;
            cell.classList.add('fixed');
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
    selectedCell = index;

    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
    });

    const cell = document.querySelector(`[data-index="${index}"]`);
    if (cell) cell.classList.add('selected');

    if (isClearMode) {
        clearCell(index);
        return;
    }

    if (selectedNumber === null) {
        updateHighlights();
        const clickedValue = currentPuzzle[index];
        if (clickedValue !== 0) {
            highlightNumberOnBoard(clickedValue);
        }
    } else {
        fillCell(index, selectedNumber);
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

function fillCell(index, num) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    if (!cell) return;

    // 清除原有数字
    currentPuzzle[index] = num;
    cell.textContent = num;
    cell.innerHTML = num;
    cell.classList.add('fixed');
    cell.classList.remove('error');

    // 检查是否有冲突
    if (!solver.isValid(currentPuzzle)) {
        cell.classList.add('error');
    }
}

function clearCell(index) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    if (!cell) return;

    currentPuzzle[index] = 0;
    cell.textContent = '';
    cell.innerHTML = '';
    cell.classList.remove('fixed', 'error');
}

// 核验数独（唯一解和难度判定）
function verifyPuzzle() {
    // 检查是否为空
    const filledCount = currentPuzzle.filter(v => v !== 0).length;
    if (filledCount === 0) {
        alert('请先填入一些数字！');
        return;
    }

    // 检查是否有效（无重复）
    if (!solver.isValid(currentPuzzle)) {
        alert('当前棋盘存在重复数字，请检查！');
        return;
    }

    // 检查唯一解
    const solutionCount = solver.countSolutions(currentPuzzle, 3);
    if (solutionCount === 0) {
        alert('当前棋盘无解！');
        return;
    }
    if (solutionCount > 1) {
        alert('当前棋盘存在多个解，请修改！');
        return;
    }

    // 求解并判定难度
    const solution = solver.solve(currentPuzzle);
    if (!solution) {
        alert('无法求解当前棋盘！');
        return;
    }

    currentSolution = solution;

    // 计算空格数量（挖空数）
    const holes = 81 - filledCount;

    // 判定难度
    let difficulty = 'easy';
    for (const [key, config] of Object.entries(DIFFICULTY_CONFIG)) {
        if (holes >= config.minHoles && holes <= config.maxHoles) {
            difficulty = key;
            break;
        }
    }

    detectedDifficulty = difficulty;

    // 更新难度按钮显示
    updateDifficultyButton(difficulty);

    alert(`核验通过！\n\n游戏难度：${DIFFICULTY_CONFIG[difficulty].name}\n空格数：${holes}`);
}

function updateDifficultyButton(difficulty) {
    const btn = document.getElementById('difficultyBtn');
    if (!btn) return;

    const config = DIFFICULTY_CONFIG[difficulty];
    const textEl = btn.querySelector('.difficulty-text');
    const starsEl = btn.querySelector('.difficulty-stars');

    if (textEl) textEl.textContent = config.name;
    if (starsEl) starsEl.textContent = '★'.repeat(config.stars) + '☆'.repeat(4 - config.stars);
}

// 随机生成数字（确保唯一解）
function fillRandomNumbers() {
    // 清空当前棋盘
    currentPuzzle = Array(81).fill(0);
    detectedDifficulty = null;

    // 随机选择难度
    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    // 使用数独生成器生成对应难度的谜题
    const generator = new SudokuGenerator();
    const result = generator.generatePuzzle(randomDifficulty);
    
    // 直接使用生成的谜题（生成器已确保唯一解）
    currentPuzzle = [...result.puzzle];
    currentSolution = result.solution;

    // 计算实际空格数并判定难度
    const holes = currentPuzzle.filter(v => v === 0).length;
    let detectedDiff = randomDifficulty;
    for (const [key, config] of Object.entries(DIFFICULTY_CONFIG)) {
        if (holes >= config.minHoles && holes <= config.maxHoles) {
            detectedDiff = key;
            break;
        }
    }
    detectedDifficulty = detectedDiff;

    // 渲染棋盘
    renderBoard('gridContainer', currentPuzzle);
    updateDifficultyButton(detectedDiff);
}

// 数独生成器（用于随机功能）
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
        const holes = config.minHoles + Math.floor(Math.random() * (config.maxHoles - config.minHoles + 1));
        
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

// 开始游戏
function startGame() {
    // 先执行核验
    if (!performVerification()) {
        return;
    }

    // 确认开始游戏
    const confirmStart = confirm(`游戏难度：${DIFFICULTY_CONFIG[detectedDifficulty].name}\n\n确定开始游戏吗？`);
    if (!confirmStart) return;

    // 保存音乐播放状态
    if (window.AudioManager) {
        const state = window.AudioManager.getState();
        localStorage.setItem('musicState', JSON.stringify({
            isPlaying: state.isPlaying,
            currentIndex: state.currentIndex,
            currentTime: window.AudioManager.audio?.currentTime || 0
        }));
    }

    // 保存游戏数据到localStorage
    localStorage.setItem('customGameData', JSON.stringify({
        puzzle: currentPuzzle,
        solution: currentSolution,
        difficulty: detectedDifficulty
    }));

    // 跳转到游戏界面
    window.location.href = 'custom-game.html?mode=play';
}

// 分享游戏
function shareGame() {
    if (!performVerification()) {
        return;
    }

    const user = window.UserManager?.getUser ? UserManager.getUser() : null;

    const gameData = {
        puzzle: currentPuzzle.join(''),
        solution: currentSolution.join(''),
        difficulty: detectedDifficulty,
        slogan: '分享游戏',
        nickname: user?.nickname || user?.username || '匿名玩家',
        shareTime: new Date().toLocaleString('zh-CN'),
        version: '1.0'
    };
    
    const gameCode = generateGameCode(gameData);
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1000;
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        width: 90%;
        max-width: 450px;
        background: var(--theme-gradient, linear-gradient(135deg, #FFA726 0%, #FF7043 100%));
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.5);
        overflow: hidden;
        animation: slideUp 0.3s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 36px;
        padding: 0 16px;
        background: rgba(255, 255, 255, 0.15);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    `;

    const title = document.createElement('h3');
    title.textContent = '游戏编码';
    title.style.cssText = `
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: white;
    `;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        background: transparent;
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        opacity: 0.85;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.addEventListener('click', () => {
        dialog.remove();
    });
    header.appendChild(closeBtn);

    content.appendChild(header);

    const body = document.createElement('div');
    body.style.cssText = `
        padding: 16px;
    `;

    const codeContainer = document.createElement('div');
    codeContainer.style.cssText = `
        background: rgba(255, 255, 255, 0.15);
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        border: 1px solid rgba(255, 255, 255, 0.3);
    `;

    const codeText = document.createElement('textarea');
    codeText.value = gameCode;
    codeText.readOnly = true;
    codeText.style.cssText = `
        width: 100%;
        height: 60px;
        border: none;
        background: transparent;
        resize: none;
        font-size: 12px;
        line-height: 1.5;
        color: white;
        outline: none;
        font-family: monospace;
    `;
    codeContainer.appendChild(codeText);

    body.appendChild(codeContainer);

    const tip = document.createElement('p');
    tip.innerHTML = '💡 <strong>使用方法：</strong><br>1. 复制上方编码<br>2. 发送给好友<br>3. 好友在自定义游戏粘贴编码即可玩同一局游戏';
    tip.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        padding: 12px;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 13px;
        margin: 0 0 16px 0;
        line-height: 1.5;
    `;
    body.appendChild(tip);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 10px;
    `;

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '复制编码';
    copyBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    `;
    copyBtn.addEventListener('mouseover', () => {
        copyBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    copyBtn.addEventListener('mouseout', () => {
        copyBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(gameCode).then(() => {
            copyBtn.textContent = '已复制 ✓';
            copyBtn.style.background = '#4CAF50';
            setTimeout(() => {
                copyBtn.textContent = '复制编码';
                copyBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            }, 2000);
        }).catch(() => {
            codeText.select();
            document.execCommand('copy');
            copyBtn.textContent = '已复制 ✓';
        });
    });
    btnContainer.appendChild(copyBtn);

    body.appendChild(btnContainer);
    content.appendChild(body);
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

// 生成游戏编码（Base64）
function generateGameCode(gameData) {
    return gameData.puzzle;
}

// 显示编码对话框
function showGameCodeDialog(gameCode, slogan) {
    const dialog = document.createElement('div');
    dialog.classList.add('new-game-dialog');

    const content = document.createElement('div');
    content.classList.add('new-game-dialog-content');
    content.style.maxWidth = '500px';

    const title = document.createElement('h3');
    title.textContent = '游戏编码已生成';
    title.style.color = '#4CAF50';
    content.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = `标语：${slogan}`;
    desc.style.marginBottom = '15px';
    content.appendChild(desc);

    // 编码显示区域
    const codeContainer = document.createElement('div');
    codeContainer.style.cssText = `
        background: #f5f5f5;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
    `;

    const codeLabel = document.createElement('p');
    codeLabel.textContent = '游戏编码：';
    codeLabel.style.fontWeight = 'bold';
    codeLabel.style.marginBottom = '10px';
    codeContainer.appendChild(codeLabel);

    const codeText = document.createElement('textarea');
    codeText.value = gameCode;
    codeText.readOnly = true;
    codeText.style.cssText = `
        width: 100%;
        height: 80px;
        border: none;
        background: transparent;
        resize: none;
        font-size: 12px;
        line-height: 1.5;
    `;
    codeContainer.appendChild(codeText);

    content.appendChild(codeContainer);

    // 提示信息
    const tip = document.createElement('p');
    tip.innerHTML = '💡 <strong>使用方法：</strong><br>1. 复制上方编码<br>2. 发送给好友<br>3. 好友在共创乐园粘贴即可玩同一局游戏';
    tip.style.cssText = `
        background: #e3f2fd;
        padding: 12px;
        border-radius: 8px;
        color: #1976d2;
        font-size: 13px;
        margin-bottom: 15px;
    `;
    content.appendChild(tip);

    // 按钮
    const btnContainer = document.createElement('div');
    btnContainer.classList.add('dialog-buttons');

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '复制编码';
    copyBtn.classList.add('dialog-btn', 'dialog-btn-primary');
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(gameCode).then(() => {
            copyBtn.textContent = '已复制 ✓';
            copyBtn.style.background = '#4CAF50';
            setTimeout(() => {
                copyBtn.textContent = '复制编码';
                copyBtn.style.background = '';
            }, 2000);
        }).catch(() => {
            codeText.select();
            document.execCommand('copy');
            copyBtn.textContent = '已复制 ✓';
        });
    });
    btnContainer.appendChild(copyBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.classList.add('dialog-btn', 'dialog-btn-secondary');
    closeBtn.addEventListener('click', () => {
        dialog.remove();
    });
    btnContainer.appendChild(closeBtn);

    content.appendChild(btnContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

// 发送分享成功的站内信
function sendShareMessage(gameCode, slogan) {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    
    messages.unshift({
        id: Date.now().toString(),
        title: '游戏分享成功',
        content: `您分享的数独游戏「${slogan}」已生成编码！\n\n编码：${gameCode.substring(0, 20)}...\n\n将此编码发送给好友，好友在共创乐园粘贴即可玩同一局游戏。`,
        time: new Date().toLocaleString('zh-CN'),
        read: false,
        type: 'share',
        gameCode: gameCode,
        slogan: slogan
    });
    
    localStorage.setItem('messages', JSON.stringify(messages));
    
    // 更新消息徽章
    if (window.messagePopup) {
        window.messagePopup.loadMessages();
    }
}

// 执行核验（唯一解和难度判定）
function performVerification() {
    // 检查是否为空
    const filledCount = currentPuzzle.filter(v => v !== 0).length;
    if (filledCount === 0) {
        alert('请先填入一些数字！');
        return false;
    }

    // 检查是否有效（无重复）
    if (!solver.isValid(currentPuzzle)) {
        alert('当前棋盘存在重复数字，请检查！');
        return false;
    }

    // 检查唯一解
    const solutionCount = solver.countSolutions(currentPuzzle, 3);
    if (solutionCount === 0) {
        alert('当前棋盘无解！');
        return false;
    }
    if (solutionCount > 1) {
        alert('当前棋盘存在多个解，请修改！');
        return false;
    }

    // 求解
    const solution = solver.solve(currentPuzzle);
    if (!solution) {
        alert('无法求解当前棋盘！');
        return false;
    }

    currentSolution = solution;

    // 计算空格数量并判定难度
    const holes = 81 - filledCount;
    
    // 检查难度是否符合要求（至少简单难度，即至少30个空格）
    if (holes < 30) {
        alert(`当前游戏过于简单（仅${holes}个空格），请减少填入的数字！\n\n建议至少保留30个空格。`);
        return false;
    }

    // 判定难度
    let difficulty = 'easy';
    for (const [key, config] of Object.entries(DIFFICULTY_CONFIG)) {
        if (holes >= config.minHoles && holes <= config.maxHoles) {
            difficulty = key;
            break;
        }
    }

    detectedDifficulty = difficulty;
    updateDifficultyButton(difficulty);

    return true;
}

// 生成随机标语
const randomSlogans = [
    '挑战你的极限！', '经典数独等你来战！', '脑力大考验！', '你能解开吗？',
    '思维的艺术', '数字的魅力', '逻辑的挑战', '智慧的较量',
    '耐心的考验', '完美的谜题', '等你来征服！', '烧脑时刻到！',
    '思维风暴来袭！', '数字迷宫探险', '脑力体操时间'
];

function generateRandomSlogan() {
    return randomSlogans[Math.floor(Math.random() * randomSlogans.length)];
}

// 生成游戏编号（格式：年月日-时间戳）
function generateGameId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 使用时间戳确保唯一性（精确到毫秒）
    const timestamp = Date.now();
    
    return `${year}${month}${day}-${timestamp}`;
}

// 解析游戏编码
function parseGameCode(code) {
    try {
        code = code.trim();
        
        if (/^\d{81}$/.test(code)) {
            const puzzle = code.split('').map(Number);
            
            const solver = new SudokuSolver();
            
            if (!solver.isValid(puzzle)) {
                return null;
            }
            
            const solutionCount = solver.countSolutions(puzzle, 3);
            if (solutionCount !== 1) {
                return null;
            }
            
            const solution = solver.solve(puzzle);
            if (!solution) {
                return null;
            }
            
            const holes = puzzle.filter(v => v === 0).length;
            
            let diff = 'easy';
            const difficulties = ['easy', 'medium', 'hard', 'expert'];
            for (const key of difficulties) {
                const config = DIFFICULTY_CONFIG[key];
                if (holes >= config.minHoles && holes <= config.maxHoles) {
                    diff = key;
                    break;
                }
            }
            
            return {
                puzzle: code,
                solution: solution.join(''),
                difficulty: diff,
                slogan: '',
                nickname: '匿名玩家',
                shareTime: '',
                version: '3.0'
            };
        }
        
        const utf8String = atob(code);
        const jsonString = decodeURIComponent(escape(utf8String));
        const data = JSON.parse(jsonString);
        
        const difficultyMap = { 0: 'easy', 1: 'medium', 2: 'hard' };
        
        return {
            puzzle: data.p || data.puzzle,
            solution: data.s || data.solution,
            difficulty: difficultyMap[data.d] || data.difficulty || 'easy',
            slogan: data.slogan || '',
            nickname: data.nickname || '匿名玩家',
            shareTime: data.shareTime || '',
            version: data.version || '2.0'
        };
    } catch (error) {
        console.error('解析编码失败:', error);
        return null;
    }
}

// 从编码生成游戏
function generateGameFromCode() {
    const codeInput = document.getElementById('gameCodeInput');
    const errorDiv = document.getElementById('codeError');
    const code = codeInput.value.trim();

    if (!code) {
        errorDiv.textContent = '请输入游戏编码';
        return;
    }

    if (!/^\d{81}$/.test(code)) {
        errorDiv.textContent = '编码格式错误，必须是81个阿拉伯数字';
        return;
    }

    const puzzle = code.split('').map(Number);
    const filledCount = puzzle.filter(v => v !== 0).length;
    
    if (filledCount === 0) {
        errorDiv.textContent = '棋盘为空，请输入有效的数字';
        return;
    }

    const solver = new SudokuSolver();
    
    if (!solver.isValid(puzzle)) {
        errorDiv.textContent = '棋盘存在重复数字，请检查！';
        return;
    }

    const solutionCount = solver.countSolutions(puzzle, 3);
    if (solutionCount === 0) {
        errorDiv.textContent = '当前棋盘无解！';
        return;
    }
    if (solutionCount > 1) {
        errorDiv.textContent = '当前棋盘存在多个解，请修改！';
        return;
    }

    const solution = solver.solve(puzzle);
    if (!solution) {
        errorDiv.textContent = '无法求解当前棋盘！';
        return;
    }

    const holes = 81 - filledCount;
    
    if (holes < 30) {
        errorDiv.textContent = `当前游戏过于简单（仅${holes}个空格），请至少保留30个空格！`;
        return;
    }

    let diff = 'easy';
    for (const [key, config] of Object.entries(DIFFICULTY_CONFIG)) {
        if (holes >= config.minHoles && holes <= config.maxHoles) {
            diff = key;
            break;
        }
    }

    currentPuzzle = [...puzzle];
    currentSolution = solution;
    detectedDifficulty = diff;

    renderBoard('gridContainer', currentPuzzle);
    
    const diffConfig = DIFFICULTY_CONFIG[diff];
    if (document.querySelector('.difficulty-text')) {
        document.querySelector('.difficulty-text').textContent = diffConfig.name;
    }
    if (document.querySelector('.difficulty-stars')) {
        document.querySelector('.difficulty-stars').textContent = '★'.repeat(diffConfig.stars) + '☆'.repeat(4 - diffConfig.stars);
    }
    
    errorDiv.textContent = '';
    alert(`游戏生成成功！\n\n难度：${diffConfig.name}\n空格数：${holes}`);
}

function showSuccessMessage(message) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(76, 175, 80, 0.95);
        color: white;
        padding: 20px 40px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 600;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
    `;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);

    setTimeout(() => {
        msgDiv.remove();
    }, 2000);
}