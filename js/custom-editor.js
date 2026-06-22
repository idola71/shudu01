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
    // 先执行核验
    if (!performVerification()) {
        return;
    }

    // 获取当前用户信息
    const user = UserManager?.getUser ? UserManager.getUser() : { nickname: '当前玩家', defaultSlogan: '' };
    
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
    confirmBtn.addEventListener('click', async () => {
        const slogan = sloganInput.value.trim() || '未命名游戏';

        // 生成游戏编号
        const gameId = generateGameId();
        
        // 创建分享数据
        const sharedGame = {
            id: Date.now().toString(),
            gameCode: gameId,
            userId: user?.id || null,        // 用户ID（不会变化）
            username: user?.username || null, // 用户名（不会变化）
            nickname: user?.nickname || user?.username || '当前玩家', // 昵称（可变化）
            puzzle: currentPuzzle.join(''),
            solution: currentSolution.join(''),
            playerPuzzle: currentPuzzle.join(''),
            slogan: slogan,
            difficulty: detectedDifficulty,
            shareTime: new Date().toLocaleString('zh-CN'),
            participants: 0,
            completed: 0,
            notes: {},
            moves: []
        };

        // 保存到本地存储
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
        await sendMessage(sharedGame.id);

        dialog.remove();
        alert(`分享成功！\n\n游戏已发布到共创乐园\n游戏编号：${gameId}\n\n站内信已发送`);
    });
    btnContainer.appendChild(confirmBtn);

    content.appendChild(btnContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
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

// 发送站内信
async function sendMessage(gameId, type = 'system', title = '系统通知', content = '') {
    let userId = 'anonymous';
    let nickname = '匿名用户';
    
    if (window.UserManager && UserManager.isLoggedIn()) {
        const user = UserManager.getUser();
        userId = user?.id || user?.username || 'anonymous';
        nickname = user?.nickname || user?.username || '匿名用户';
    }

    const message = {
        id: Date.now().toString(),
        userId: userId,
        nickname: nickname,
        title: title || '系统通知',
        content: content || `您分享的数独游戏已发布到共创乐园！游戏编号：${gameId}`,
        time: new Date().toLocaleString('zh-CN'),
        timestamp: Date.now(),
        read: false,
        type: type,
        gameId: gameId,
        participants: 0,
        completed: 0
    };

    try {
        const { initTCB, addMessage } = await import('./tcb-service.js');
        await initTCB();
        const tcbId = await addMessage(message);
        if (tcbId) {
            message._id = tcbId;
        }
        console.log('TCB: Message sent');
    } catch (error) {
        console.error('TCB sendMessage error:', error);
    }

    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    
    const exists = messages.some(m => 
        !m.read && m.gameId === gameId && m.type === type
    );
    
    if (!exists) {
        messages.unshift(message);
        localStorage.setItem('messages', JSON.stringify(messages));
    }
    
    if (window.messagePopup) {
        window.messagePopup.loadMessages();
    }
}