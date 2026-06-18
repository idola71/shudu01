// 游戏状态
let currentPuzzle = [];
let currentSolution = [];
let notes = {};
let moves = [];
let selectedCell = null;
let selectedNumber = null;
let isNoteMode = false;
let cheatCode = '';
const CHEAT_SEQUENCE = '198871516';
let isClearMode = false;
let difficulty = 'medium';
let errorCount = 0; // 错误次数计数器

// 计时器相关
let timerSeconds = 0;
let timerInterval = null;
let timerStarted = false;
let timerPaused = false;

// 难度配置
const DIFFICULTY_CONFIG = {
    easy: { name: '简单', stars: 1 },
    medium: { name: '中等', stars: 2 },
    hard: { name: '困难', stars: 3 },
    expert: { name: '专家', stars: 4 }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    initTimer();
    initMusicControl();
    initLeaderboardBtn();
});

// 初始化游戏
function initGame() {
    console.log('initGame called');
    // 获取分享的游戏数据
    const sharedGameData = localStorage.getItem('sharedGame');
    console.log('sharedGameData:', sharedGameData);
    if (sharedGameData) {
        const game = JSON.parse(sharedGameData);
        console.log('game data:', game);
        loadSharedGame(game);
    } else {
        // 如果没有分享数据，显示错误或返回列表
        alert('无法加载分享的游戏，请返回共创乐园选择一个游戏');
        window.location.href = 'paradise.html';
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

// 排行榜按钮初始化
function initLeaderboardBtn() {
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            if (typeof openLeaderboard === 'function') {
                openLeaderboard();
            }
        });
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

// 加载分享的游戏
function loadSharedGame(game) {
    // 验证游戏数据
    if (!game || !game.playerPuzzle || !game.solution) {
        console.error('Invalid game data:', game);
        alert('游戏数据无效，请返回共创乐园重新选择游戏');
        window.location.href = 'paradise.html';
        return;
    }
    
    // 保存游戏ID用于后续更新统计
    window.currentGameId = game.id;
    
    // 设置难度
    difficulty = game.difficulty || 'medium';
    
    // 解析棋盘数据
    currentPuzzle = game.playerPuzzle.split('').map(Number);
    currentSolution = game.solution.split('').map(Number);
    
    // 验证棋盘数据长度
    if (currentPuzzle.length !== 81 || currentSolution.length !== 81) {
        console.error('Invalid puzzle length:', currentPuzzle.length, currentSolution.length);
        alert('棋盘数据无效，请返回共创乐园重新选择游戏');
        window.location.href = 'paradise.html';
        return;
    }
    
    // 重置游戏状态
    notes = {};
    moves = [];
    selectedCell = null;
    selectedNumber = null;
    isNoteMode = false;
    isClearMode = false;
    
    // 渲染棋盘
    renderBoard('gridContainer', currentPuzzle);
    
    // 初始化数字面板
    initNumberPad('numberPad');
    
    // 更新难度按钮显示（禁用点击）
    updateDifficultyButton();
    
    // 更新游戏信息
    updateGameInfo();
    
    // 开始播放背景音乐
    if (window.AudioManager) {
        window.AudioManager.startGameMusic();
    }
    
    // 加载评论
    loadComments(game.comments || []);
    
    // 更新参与人数
    updateParticipants(game.id);
}

// 更新参与人数
async function updateParticipants(gameId) {
    try {
        const { initTCB, updateSharedGame } = await import('./tcb-service.js');
        await initTCB();
        
        const sharedGames = JSON.parse(localStorage.getItem('sharedGames') || '[]');
        const gameIndex = sharedGames.findIndex(g => g.id === gameId);
        
        if (gameIndex !== -1) {
            const game = sharedGames[gameIndex];
            
            if (!game.playerRecords) {
                game.playerRecords = {};
            }
            
            const userKey = getUserKey();
            
            if (!game.playerRecords[userKey]) {
                game.participants = (game.participants || 0) + 1;
                game.playerRecords[userKey] = {
                    participated: true,
                    completed: false,
                    bestTime: null,
                    bestErrors: null
                };
                
                localStorage.setItem('sharedGames', JSON.stringify(sharedGames));
                
                const tcbDocId = game._id || game.id;
                await updateSharedGame(tcbDocId, {
                    participants: game.participants,
                    playerRecords: game.playerRecords
                });
                console.log('TCB: Participants updated for game:', tcbDocId);
            } else {
                console.log('Player already participated:', userKey);
            }
        }
    } catch (error) {
        console.error('TCB updateParticipants error:', error);
        
        const sharedGames = JSON.parse(localStorage.getItem('sharedGames') || '[]');
        const gameIndex = sharedGames.findIndex(g => g.id === gameId);
        
        if (gameIndex !== -1) {
            const game = sharedGames[gameIndex];
            
            if (!game.playerRecords) {
                game.playerRecords = {};
            }
            
            const userKey = getUserKey();
            
            if (!game.playerRecords[userKey]) {
                game.participants = (game.participants || 0) + 1;
                game.playerRecords[userKey] = {
                    participated: true,
                    completed: false,
                    bestTime: null,
                    bestErrors: null
                };
                localStorage.setItem('sharedGames', JSON.stringify(sharedGames));
                console.log('Local: Participants updated for game:', gameId);
            }
        }
    }
}

// 更新通关人数
async function updateCompleted(gameId) {
    try {
        const { initTCB, updateSharedGame } = await import('./tcb-service.js');
        await initTCB();
        
        const sharedGames = JSON.parse(localStorage.getItem('sharedGames') || '[]');
        const gameIndex = sharedGames.findIndex(g => g.id === gameId);
        
        if (gameIndex !== -1) {
            const game = sharedGames[gameIndex];
            const tcbDocId = game._id || game.id;
            
            if (!game.playerRecords) {
                game.playerRecords = {};
            }
            
            const userKey = getUserKey();
            
            if (!game.playerRecords[userKey]) {
                game.playerRecords[userKey] = {};
            }
            
            if (!game.playerRecords[userKey].completed) {
                game.completed = (game.completed || 0) + 1;
                game.playerRecords[userKey].completed = true;
                game.playerRecords[userKey].bestTime = timerSeconds;
                game.playerRecords[userKey].bestErrors = errorCount;
                
                localStorage.setItem('sharedGames', JSON.stringify(sharedGames));
                await updateSharedGame(tcbDocId, {
                    completed: game.completed,
                    playerRecords: game.playerRecords
                });
                console.log('TCB: Completed count updated for game:', tcbDocId);
            } else {
                const currentRecord = game.playerRecords[userKey];
                const isBetter = (errorCount < currentRecord.bestErrors) || 
                               (errorCount === currentRecord.bestErrors && timerSeconds < currentRecord.bestTime);
                
                if (isBetter) {
                    game.playerRecords[userKey].bestTime = timerSeconds;
                    game.playerRecords[userKey].bestErrors = errorCount;
                    
                    localStorage.setItem('sharedGames', JSON.stringify(sharedGames));
                    await updateSharedGame(tcbDocId, { playerRecords: game.playerRecords });
                    console.log('TCB: Best record updated for player:', userKey);
                }
            }
        }
    } catch (error) {
        console.error('TCB updateCompleted error:', error);
        
        const sharedGames = JSON.parse(localStorage.getItem('sharedGames') || '[]');
        const gameIndex = sharedGames.findIndex(g => g.id === gameId);
        
        if (gameIndex !== -1) {
            const game = sharedGames[gameIndex];
            
            if (!game.playerRecords) {
                game.playerRecords = {};
            }
            
            const userKey = getUserKey();
            
            if (!game.playerRecords[userKey]) {
                game.playerRecords[userKey] = {};
            }
            
            if (!game.playerRecords[userKey].completed) {
                game.completed = (game.completed || 0) + 1;
                game.playerRecords[userKey].completed = true;
                game.playerRecords[userKey].bestTime = timerSeconds;
                game.playerRecords[userKey].bestErrors = errorCount;
                localStorage.setItem('sharedGames', JSON.stringify(sharedGames));
                console.log('Local: Completed count updated for game:', gameId);
            } else {
                const currentRecord = game.playerRecords[userKey];
                const isBetter = (errorCount < currentRecord.bestErrors) || 
                               (errorCount === currentRecord.bestErrors && timerSeconds < currentRecord.bestTime);
                
                if (isBetter) {
                    game.playerRecords[userKey].bestTime = timerSeconds;
                    game.playerRecords[userKey].bestErrors = errorCount;
                    localStorage.setItem('sharedGames', JSON.stringify(sharedGames));
                    console.log('Local: Best record updated for player:', userKey);
                } else {
                    console.log('Player already completed with better record:', userKey);
                }
            }
        }
    }
}

// 获取用户唯一标识
function getUserKey() {
    // 如果用户已登录，使用用户ID，否则使用匿名标识
    if (window.UserManager && UserManager.isLoggedIn()) {
        const user = UserManager.getUser();
        return user?.username || user?.id || 'anonymous';
    }
    return 'anonymous';
}

// 渲染棋盘
function renderBoard(containerId, puzzle) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cells = container.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const value = puzzle[index];
        cell.innerHTML = '';
        cell.classList.remove('selected', 'same-row', 'same-col', 'same-block', 'same-number', 'fixed', 'user-input', 'error', 'note-highlight');
        cell.setAttribute('data-index', index);

        // 移除之前的点击事件监听器，避免重复绑定
        cell.removeEventListener('click', cellClickHandler);

        if (value !== 0) {
            const span = document.createElement('span');
            span.textContent = value;
            
            // 检查是否是原始固定数字
            const sharedGame = JSON.parse(localStorage.getItem('sharedGame') || '{}');
            const originalPuzzle = sharedGame.puzzle?.split('').map(Number) || [];
            
            if (originalPuzzle[index] !== 0 && originalPuzzle[index] === value) {
                cell.classList.add('fixed');
            } else {
                cell.classList.add('user-input');
                // 检查是否填错
                if (value !== currentSolution[index]) {
                    cell.classList.add('error');
                }
            }
            
            cell.appendChild(span);
        } else if (notes[index]) {
            // 显示笔记
            cell.innerHTML = generateNoteHTML(notes[index]);
            // 如果当前有选中的数字，且笔记中包含该数字，则高亮
            if (selectedNumber !== null && notes[index].includes(selectedNumber)) {
                cell.classList.add('note-highlight');
            }
        }

        // 添加点击事件监听器
        cell.addEventListener('click', cellClickHandler);
    });
}

// 单元格点击处理函数（单独定义以便移除）
function cellClickHandler(e) {
    // 使用 closest 方法查找最近的 .cell 元素，确保正确获取索引
    const cell = e.target.closest('.cell');
    if (cell) {
        const index = parseInt(cell.getAttribute('data-index'));
        if (!isNaN(index)) {
            selectCell(index);
        }
    }
}

// 选择单元格
function selectCell(index) {
    // 开始或继续计时
    startTimer();

    selectedCell = index;

    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
    });

    const cell = document.querySelector(`[data-index="${index}"]`);
    if (cell) {
        cell.classList.add('selected');
    }

    // 如果没有选择数字，则高亮行、列、宫格
    if (selectedNumber === null) {
        updateHighlights();

        // 如果点击的单元格有数字，高亮显示相同的数字
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
        // 取消格子选中状态和行、列、宫格高亮
        selectedCell = null;
        document.querySelectorAll('.cell').forEach(c => {
            c.classList.remove('selected', 'highlight-row', 'highlight-col', 'highlight-box');
        });
        if (selectedNumber !== null) {
            highlightNumberOnBoard(selectedNumber);
        }
    }
}

// 更新高亮
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

// 高亮棋盘上的数字
function highlightNumberOnBoard(num) {
    document.querySelectorAll('.cell').forEach((cell, idx) => {
        cell.classList.remove('highlight-num');
        if (currentPuzzle[idx] === num) {
            cell.classList.add('highlight-num');
        }
    });

    // 高亮笔记中包含该数字的格子
    document.querySelectorAll('.cell').forEach((cell, idx) => {
        // 如果格子已经有数字，移除 note-highlight
        if (currentPuzzle[idx] !== 0) {
            cell.classList.remove('note-highlight');
            return;
        }
        
        // 如果当前格子没有选中的数字对应的笔记，移除高亮
        if (!notes[idx] || !notes[idx].includes(num)) {
            cell.classList.remove('note-highlight');
        } else {
            cell.classList.add('note-highlight');
        }
    });
}

// 选择数字
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
    
    // 如果清除模式激活，询问是否清除所有该数字的笔记
    if (isClearMode) {
        const count = getNoteCount(num);
        if (count > 0) {
            if (confirm(`确定要清除所有数字 ${num} 的笔记吗？`)) {
                clearAllNotesForNumber(num);
            }
        }
        return;
    }

    if (selectedNumber === num) {
        selectedNumber = null;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight-num', 'highlight-cell', 'selected'));
        // 移除所有笔记的高亮
        document.querySelectorAll('.cell').forEach((cell, idx) => {
            cell.classList.remove('note-highlight');
        });
    } else {
        selectedNumber = num;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector(`.num-btn[data-num="${num}"]`).classList.add('selected');

        // 取消格子选中状态和行、列、宫格高亮，只高亮相同数字
        selectedCell = null;
        document.querySelectorAll('.cell').forEach(c => {
            c.classList.remove('selected', 'highlight-row', 'highlight-col', 'highlight-box');
        });

        highlightNumberOnBoard(num);
    }
}

// 填写数字
function fillCell(num) {
    if (selectedCell === null) {
        return;
    }

    const index = selectedCell;
    const cell = document.querySelector(`[data-index="${index}"]`);
    
    if (!cell) {
        return;
    }
    
    const sharedGame = JSON.parse(localStorage.getItem('sharedGame') || '{}');
    const originalPuzzle = sharedGame.puzzle?.split('').map(Number) || [];

    // 检查是否是固定数字
    const isFixedCell = cell.classList.contains('fixed');
    const isOriginalFixed = originalPuzzle.length > 0 && originalPuzzle[index] !== 0;
    
    if (isFixedCell || isOriginalFixed) {
        return;
    }

    const prevValue = currentPuzzle[index];
    const prevNotes = notes[index] ? [...notes[index]] : null;

    // 如果当前格子已经填入了相同的数字，则清除该格子
    if (prevValue === num) {
        moves.push({
            index,
            prevValue,
            notes: prevNotes,
            type: 'fill'
        });

        currentPuzzle[index] = 0;
        cell.textContent = '';
        cell.innerHTML = '';
        cell.classList.remove('user-input', 'error');

        // 恢复之前的笔记
        if (prevNotes) {
            notes[index] = prevNotes;
            cell.innerHTML = generateNoteHTML(notes[index]);
        }

        // 播放删除音效
        if (window.SoundManager) {
            window.SoundManager.play('delete');
        }

        updateNumberCounts();
        return;
    }

    // 保存移动记录
    moves.push({
        index,
        prevValue,
        notes: prevNotes,
        type: 'fill'
    });

    currentPuzzle[index] = num;
    delete notes[index];

    cell.innerHTML = `<span>${num}</span>`;
    cell.classList.remove('error');
    cell.classList.remove('note-highlight');

    // 检查是否填错
    if (num !== currentSolution[index]) {
        cell.classList.add('error');
        errorCount++; // 增加错误计数器
        // 播放错误音效
        if (window.SoundManager) {
            window.SoundManager.play('error');
        }
    } else {
        // 播放正确填入数字音效
        if (window.SoundManager) {
            window.SoundManager.play('number');
        }
    }

    cell.classList.add('user-input');
    cell.classList.remove('fixed');

    // 删除同行同列同宫格中的相同数字笔记
    removeNotesForNumber(index, num);

    updateNumberCounts();
    
    // 检查并触发完成动画
    const row = Math.floor(index / 9);
    const col = index % 9;
    checkCompletions(row, col, num);
    
    checkCompletion();
}

// 添加笔记
function addNote(index, num) {
    const cell = document.querySelector(`[data-index="${index}"]`);

    if (!cell || cell.classList.contains('fixed')) return;
    if (currentPuzzle[index] !== 0) return;

    const oldNotes = notes[index] ? [...notes[index]] : [];

    if (!notes[index]) {
        notes[index] = [];
    }

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
        // 如果当前有选中的数字，且笔记中包含该数字，则高亮
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

// 清除格子
function clearCell() {
    if (selectedCell === null) return;

    const index = selectedCell;
    const cell = document.querySelector(`[data-index="${index}"]`);
    const sharedGame = JSON.parse(localStorage.getItem('sharedGame') || '{}');
    const originalPuzzle = sharedGame.puzzle?.split('').map(Number) || [];

    if (!cell || cell.classList.contains('fixed')) return;
    if (originalPuzzle && originalPuzzle[index] !== 0) return;

    const prevValue = currentPuzzle[index];
    const prevNotes = notes[index] ? [...notes[index]] : null;

    if (prevValue === 0 && !prevNotes) return;

    moves.push({
        index,
        prevValue,
        notes: prevNotes,
        type: 'fill'
    });

    currentPuzzle[index] = 0;
    delete notes[index];
    cell.textContent = '';
    cell.innerHTML = '';
    cell.classList.remove('error');

    updateNumberCounts();
}

// 清除某个数字的所有笔记
function clearAllNotesForNumber(num) {
    let clearedCount = 0;

    for (let i = 0; i < 81; i++) {
        if (notes[i] && notes[i].includes(num)) {
            const oldNotes = [...notes[i]];
            notes[i] = notes[i].filter(n => n !== num);

            if (notes[i].length === 0) {
                delete notes[i];
            }

            moves.push({
                index: i,
                value: 0,
                notes: oldNotes.length > 0 ? oldNotes : null,
                type: 'note',
                timestamp: Date.now()
            });

            const cell = document.querySelector(`[data-index="${i}"]`);
            if (cell) {
                if (notes[i]) {
                    cell.innerHTML = generateNoteHTML(notes[i]);
                } else {
                    cell.innerHTML = '';
                }
                cell.classList.remove('note-highlight');
            }

            clearedCount++;
        }
    }

    if (clearedCount > 0) {
        alert(`已清除 ${clearedCount} 个格子中的数字 ${num} 的笔记`);
    }
}

// 获取某个数字在笔记中出现的次数
function getNoteCount(num) {
    let count = 0;
    for (let i = 0; i < 81; i++) {
        if (notes[i] && notes[i].includes(num)) {
            count++;
        }
    }
    return count;
}

// 回退移动
function undoMove() {
    if (moves.length === 0) return;

    const lastMove = moves.pop();
    const index = lastMove.index;
    const cell = document.querySelector(`[data-index="${index}"]`);

    if (!cell) return;

    if (lastMove.type === 'fill') {
        currentPuzzle[index] = lastMove.prevValue;
        notes[index] = lastMove.notes;

        if (lastMove.prevValue !== 0) {
            cell.innerHTML = `<span>${lastMove.prevValue}</span>`;
            cell.classList.add('user-input');
            cell.classList.remove('error');

            if (lastMove.prevValue !== currentSolution[index]) {
                cell.classList.add('error');
            }
        } else {
            cell.innerHTML = '';
            cell.classList.remove('user-input', 'error');
        }

        if (notes[index]) {
            cell.innerHTML = generateNoteHTML(notes[index]);
        }
    } else if (lastMove.type === 'note') {
        notes[index] = lastMove.notes;

        if (notes[index]) {
            cell.innerHTML = generateNoteHTML(notes[index]);
        } else {
            cell.innerHTML = '';
        }
    }

    updateNumberCounts();
}

// 删除同行同列同宫格中的相同数字笔记
function removeNotesForNumber(index, num) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    for (let i = 0; i < 81; i++) {
        if (i === index) continue;

        const cellRow = Math.floor(i / 9);
        const cellCol = i % 9;
        const cellBoxRow = Math.floor(cellRow / 3);
        const cellBoxCol = Math.floor(cellCol / 3);

        const sameRow = cellRow === row;
        const sameCol = cellCol === col;
        const sameBox = cellBoxRow === boxRow && cellBoxCol === boxCol;

        if (sameRow || sameCol || sameBox) {
            if (notes[i] && notes[i].includes(num)) {
                notes[i] = notes[i].filter(n => n !== num);
                if (notes[i].length === 0) {
                    delete notes[i];
                }

                const cell = document.querySelector(`[data-index="${i}"]`);
                if (cell && currentPuzzle[i] === 0) {
                    if (notes[i]) {
                        cell.innerHTML = generateNoteHTML(notes[i]);
                    } else {
                        cell.innerHTML = '';
                    }
                }
            }
        }
    }
}

// 生成笔记HTML
function generateNoteHTML(noteNumbers) {
    let html = '<div class="note">';
    for (let i = 1; i <= 9; i++) {
        html += `<span>${noteNumbers.includes(i) ? i : ''}</span>`;
    }
    html += '</div>';
    return html;
}

// 随机标语列表
const randomSlogans = [
    '挑战你的极限！',
    '经典数独等你来战！',
    '适合初学者的数独',
    '完全空白，等你来填！',
    '数独大师的挑战',
    '脑力风暴来袭！',
    '数字迷宫探险',
    '脑力体操时间'
];

// 生成随机标语
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

// 分享游戏
function shareGame() {
    // 共创乐园的游戏不支持再次分享
    alert('此游戏来自共创乐园，不支持再次分享。\n\n如需分享游戏，请前往"趣味数独"进行游戏并分享。');
}

// 发送站内信
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

// 切换笔记模式
function toggleNoteMode() {
    isNoteMode = !isNoteMode;
    isClearMode = false;

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

// 切换清除模式
function toggleClearMode() {
    isClearMode = !isClearMode;
    const clearBtn = document.getElementById('clearBtn');

    if (isClearMode) {
        if (clearBtn) {
            clearBtn.classList.add('selected');
            clearBtn.style.background = '#f44336';
        }
        
        // 取消笔记模式
        if (isNoteMode) {
            isNoteMode = false;
            const noteBtn = document.querySelector('.note-btn');
            const numBtns = document.querySelectorAll('.num-btn');
            if (noteBtn) {
                noteBtn.classList.remove('note-mode');
            }
            numBtns.forEach(btn => btn.classList.remove('note-mode'));
        }
        
        // 取消数字按钮的选中状态
        selectedNumber = null;
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight-num', 'highlight-cell', 'selected', 'note-highlight'));
    } else {
        if (clearBtn) {
            clearBtn.classList.remove('selected');
            clearBtn.style.background = '';
        }
    }
}

// 初始化数字面板
function initNumberPad(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.classList.remove('num-pad');
    container.classList.add('action-btns-wrapper');

    // 添加重新开始按钮（对应趣味数独的"新的一局"）
    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = '重新开始';
    newGameBtn.classList.add('action-btn', 'new-game-btn');
    newGameBtn.id = 'newGameBtn';
    newGameBtn.addEventListener('click', showRestartDialog);
    container.appendChild(newGameBtn);

    // 创建数字键盘容器
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

    // 添加动作按钮
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
    shareBtn.style.opacity = '0.5'; // 设置为半透明
    shareBtn.style.cursor = 'not-allowed'; // 设置鼠标样式
    shareBtn.addEventListener('click', shareGame);
    rightGroup.appendChild(shareBtn);

    actionBtns.appendChild(rightGroup);

    container.appendChild(actionBtns);
}

// 获取数字剩余数量
function getNumberRemaining(num) {
    let count = 0;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const index = i * 9 + j;
            if (currentPuzzle[index] === num) count++;
        }
    }
    return 9 - count;
}

// 更新数字计数
function updateNumberCounts() {
    for (let i = 1; i <= 9; i++) {
        const btn = document.querySelector(`.num-btn[data-num="${i}"]`);
        if (btn) {
            const countSpan = btn.querySelector('.count');
            const remaining = getNumberRemaining(i);
            const wasCompleted = btn.classList.contains('completed');

            if (countSpan) {
                countSpan.textContent = remaining;
            }

            if (remaining === 0) {
                // 只有当按钮从未完成变为完成时才触发动画
                if (!wasCompleted) {
                    btn.classList.remove('completed');
                    void btn.offsetWidth; // 强制重排
                    btn.classList.add('completed');
                }
                btn.disabled = true;
            } else {
                btn.classList.remove('completed');
                btn.disabled = false;
            }
        }
    }
}

// 检查完成情况并触发动画
function checkCompletions(row, col, num) {
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    // 检查数字是否全部填写完毕
    if (getNumberRemaining(num) === 0) {
        // 给所有该数字的格子添加动画
        document.querySelectorAll('.cell').forEach((cell, idx) => {
            if (currentPuzzle[idx] === num) {
                triggerPulseAnimation(cell);
            }
        });
    }

    // 检查行是否填写完毕
    if (isRowComplete(row)) {
        // 给整行添加动画
        for (let c = 0; c < 9; c++) {
            const idx = row * 9 + c;
            const cell = document.querySelector(`[data-index="${idx}"]`);
            if (cell) triggerPulseAnimation(cell);
        }
    }

    // 检查列是否填写完毕
    if (isColComplete(col)) {
        // 给整列添加动画
        for (let r = 0; r < 9; r++) {
            const idx = r * 9 + col;
            const cell = document.querySelector(`[data-index="${idx}"]`);
            if (cell) triggerPulseAnimation(cell);
        }
    }

    // 检查宫格是否填写完毕
    if (isBoxComplete(boxRow, boxCol)) {
        // 给整个宫格添加动画
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
    void element.offsetWidth; // 强制重排
    element.classList.add('completed');
}

// 检查是否完成
// 格式化时间显示
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function checkCompletion() {
    console.log('checkCompletion called');
    console.log('currentPuzzle:', currentPuzzle);
    console.log('currentSolution:', currentSolution);
    
    for (let i = 0; i < 81; i++) {
        if (currentPuzzle[i] !== currentSolution[i]) {
            console.log(`Mismatch at index ${i}: puzzle=${currentPuzzle[i]}, solution=${currentSolution[i]}`);
            return;
        }
    }
    
    // 完成！
    console.log('Game completed! Timer:', timerSeconds);
    stopTimer();
    
    // 保存排行榜记录
    if (timerSeconds > 0 && typeof addLeaderboardRecord === 'function') {
        // 安全获取用户昵称
        let userName = '匿名玩家';
        try {
            if (window.UserManager && UserManager.isLoggedIn()) {
                const user = UserManager.getUser();
                // 优先使用昵称，其次使用用户名
                if (user && user.nickname) {
                    userName = user.nickname;
                } else if (user && user.username) {
                    userName = user.username;
                }
            }
        } catch (e) {
            console.error('Error getting username:', e);
        }
        console.log('Saving leaderboard record:', userName, timerSeconds, errorCount);
        addLeaderboardRecord(userName, timerSeconds, errorCount);
        console.log('Leaderboard record saved');
    } else {
        console.log('Leaderboard record not saved: timerSeconds=', timerSeconds, 'addLeaderboardRecord=', typeof addLeaderboardRecord);
    }
    
    // 更新通关人数
    if (window.currentGameId) {
        updateCompleted(window.currentGameId);
    }
    
    // 共创乐园游戏完成可获得EXP
    try {
        if (window.UserManager && UserManager.isLoggedIn()) {
            const result = UserManager.addExpByDifficulty(difficulty);
            UserManager.updateCompletedGames(difficulty);
            
            if (result.levelUp) {
                alert(`恭喜完成！\n\n${result.message}\n\n难度：${DIFFICULTY_CONFIG[difficulty]?.name}\n用时：${formatTime(timerSeconds)}`);
            } else {
                alert(`恭喜完成！\n\n${result.message}\n\n难度：${DIFFICULTY_CONFIG[difficulty]?.name}\n用时：${formatTime(timerSeconds)}`);
            }
        } else {
            alert(`恭喜完成！\n\n难度：${DIFFICULTY_CONFIG[difficulty]?.name}\n用时：${formatTime(timerSeconds)}`);
        }
    } catch (e) {
        console.error('Error in completion logic:', e);
        alert(`恭喜完成！\n\n难度：${DIFFICULTY_CONFIG[difficulty]?.name}\n用时：${formatTime(timerSeconds)}`);
    }
}

// 自动完成棋盘（彩蛋功能）
function completePuzzle() {
    if (!currentSolution || currentSolution.length === 0) {
        console.log('completePuzzle: No solution available');
        return;
    }
    
    const originalPuzzle = window.sharedGameData?.playerPuzzle;
    
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
    
    // 保存排行榜记录
    if (timerSeconds > 0 && typeof addLeaderboardRecord === 'function') {
        const userName = window.UserManager?.isLoggedIn() ? window.UserManager.getCurrentUser().username : '匿名玩家';
        addLeaderboardRecord(userName, timerSeconds);
    }
    
    alert('恭喜！棋盘已自动完成！');
}

// 更新难度按钮显示
function updateDifficultyButton() {
    const btn = document.getElementById('difficultyBtn');
    if (!btn) return;

    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
    const textEl = btn.querySelector('.difficulty-text');
    const starsEl = btn.querySelector('.difficulty-stars');

    if (textEl) {
        textEl.textContent = config.name;
    }
    if (starsEl) {
        starsEl.textContent = '★'.repeat(config.stars) + '☆'.repeat(4 - config.stars);
    }
}

// 更新游戏信息
function updateGameInfo() {
    // 更新难度显示
    updateDifficultyButton();
}

// 显示重新开始确认对话框
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

// 重新开始当前游戏
function restartCurrentPuzzle() {
    const sharedGame = JSON.parse(localStorage.getItem('sharedGame') || '{}');
    // 使用原始谜题（puzzle）而不是玩家进度（playerPuzzle）
    if (sharedGame.puzzle) {
        currentPuzzle = sharedGame.puzzle.split('').map(Number);
        moves = [];
        notes = {};
        selectedCell = null;
        selectedNumber = null;
        isNoteMode = false;
        isClearMode = false;
        
        // 重置计时器
        resetTimer();

        // 重新渲染棋盘
        renderBoard('gridContainer', currentPuzzle);
        
        // 重置数字键盘选中状态
        document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
        
        // 重置清除按钮状态
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.classList.remove('selected');
            clearBtn.style.background = '';
        }
        
        // 重置笔记按钮状态
        const noteBtn = document.querySelector('.note-btn');
        if (noteBtn) {
            noteBtn.classList.remove('selected');
        }
        
        updateNumberCounts();
    }
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

// 暂停计时器
function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerPaused = true;
    updateTimerDisplay();
}

// 重置计时器
function resetTimer() {
    stopTimer();
    timerSeconds = 0;
    timerStarted = false;
    timerPaused = false;
    updateTimerDisplay();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
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

    // 更新图标显示
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
            if (pauseIcon) {
                pauseIcon.style.display = 'none';
            }
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

// 加载评论
function loadComments(comments) {
    const commentsDiv = document.getElementById('comments');
    if (!commentsDiv) return;
    
    // 清空现有评论
    commentsDiv.innerHTML = '';
    
    // 渲染每条评论
    comments.forEach(comment => {
        const commentItem = document.createElement('div');
        commentItem.classList.add('comment-item');
        commentItem.innerHTML = `
            <div class="comment-header">
                <span>${comment.nickname}</span>
                <span>${comment.time}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        `;
        
        commentsDiv.appendChild(commentItem);
    });
}

// 提交评论
function submitComment() {
    const input = document.getElementById('commentInput');
    const commentsDiv = document.getElementById('comments');
    
    if (!input || !commentsDiv) return;
    
    const text = input.value.trim();
    if (!text) return;

    const commentItem = document.createElement('div');
    commentItem.classList.add('comment-item');
    commentItem.innerHTML = `
        <div class="comment-header">
            <span>当前用户</span>
            <span>${new Date().toLocaleString('zh-CN')}</span>
        </div>
        <div class="comment-content">${text}</div>
    `;
    
    commentsDiv.appendChild(commentItem);
    input.value = '';
}