const API_BASE = '';

let currentUser = null;
let currentPuzzle = null;
let currentSolution = null;
let puzzleId = null;
let difficulty = 'medium';
let selectedCell = null;
let selectedNumber = null;
let isNoteMode = false;
let isClearMode = false;
let notes = {};
let moves = [];
let replayIndex = 0;
let replayInterval = null;
let replaySpeed = 1;
let isHelpingMode = false;
let currentHelpRequestId = null;
let solvedHelpRequests = [];

function init() {
  checkAuth();
  setupEventListeners();
  hideAllPages();
}

function hideAllPages() {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
}

async function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        currentUser = await response.json();
        updateUserInfo();
      } else {
        localStorage.removeItem('token');
      }
    } catch {
      localStorage.removeItem('token');
    }
  }
}

function updateUserInfo() {
  document.getElementById('userInfo').style.display = 'flex';
  document.getElementById('auth').style.display = 'none';
  document.getElementById('username').textContent = currentUser.username;
  document.getElementById('level').textContent = `等级: ${currentUser.level}`;
  document.getElementById('points').textContent = `积分: ${currentUser.points}`;
}

function setupEventListeners() {
  document.getElementById('loginBtn').addEventListener('click', showLoginModal);
  document.getElementById('registerBtn').addEventListener('click', showRegisterModal);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('authForm').addEventListener('submit', handleAuth);
  document.getElementById('toggleAuth').addEventListener('click', toggleAuth);
  document.querySelector('.close').addEventListener('click', closeModal);

  document.querySelectorAll('.nav-btn, .main-btn').forEach(btn => {
    btn.addEventListener('click', (e) => showPage(e.target.dataset.page));
  });

  document.getElementById('difficultyBtn').addEventListener('click', () => {
    document.getElementById('difficultyModal').classList.add('show');
  });
  
  document.getElementById('closeDifficultyModal').addEventListener('click', () => {
    document.getElementById('difficultyModal').classList.remove('show');
  });
  
  document.querySelectorAll('.modal-content button[data-diff]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      difficulty = e.target.dataset.diff;
      document.getElementById('difficultyModal').classList.remove('show');
      loadDailyPuzzle(false);
    });
  });

  document.getElementById('clearCustom').addEventListener('click', clearCustomBoard);
  document.getElementById('verifyCustom').addEventListener('click', verifyCustomPuzzle);
  document.getElementById('publishCustom').addEventListener('click', publishCustomGame);
  document.getElementById('startCustom').addEventListener('click', startCustomGame);
  
  document.getElementById('loadGameBtn').addEventListener('click', loadGameById);

  document.getElementById('submitComment').addEventListener('click', submitComment);

  document.getElementById('playBtn').addEventListener('click', playReplay);
  document.getElementById('pauseBtn').addEventListener('click', pauseReplay);
  document.getElementById('prevBtn').addEventListener('click', prevReplay);
  document.getElementById('speedBtn').addEventListener('click', changeSpeed);

  document.addEventListener('keydown', handleKeydown);
}

function showLoginModal() {
  document.getElementById('modalTitle').textContent = '登录';
  document.getElementById('toggleAuth').textContent = '切换到注册';
  document.getElementById('authModal').style.display = 'block';
}

function showRegisterModal() {
  document.getElementById('modalTitle').textContent = '注册';
  document.getElementById('toggleAuth').textContent = '切换到登录';
  document.getElementById('authModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('authModal').style.display = 'none';
  document.getElementById('authForm').reset();
}

function toggleAuth() {
  const title = document.getElementById('modalTitle');
  if (title.textContent === '登录') {
    title.textContent = '注册';
    document.getElementById('toggleAuth').textContent = '切换到登录';
  } else {
    title.textContent = '登录';
    document.getElementById('toggleAuth').textContent = '切换到注册';
  }
}

async function handleAuth(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value;
  const password = document.getElementById('authPassword').value;
  const isLogin = document.getElementById('modalTitle').textContent === '登录';

  const url = isLogin ? '/api/login' : '/api/register';
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  if (response.ok) {
    if (isLogin) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      updateUserInfo();
    }
    closeModal();
    alert(isLogin ? '登录成功' : '注册成功');
  } else {
    alert(data.error);
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  document.getElementById('userInfo').style.display = 'none';
  document.getElementById('auth').style.display = 'flex';
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  
  switch(page) {
    case 'daily':
      document.getElementById('dailyPage').style.display = 'block';
      loadDailyPuzzle();
      break;
    case 'custom':
      document.getElementById('customPage').style.display = 'block';
      initCustomBoard();
      break;
    case 'shared':
      document.getElementById('sharedPage').style.display = 'block';
      loadSharedGames();
      break;
    case 'leaderboard':
      document.getElementById('leaderboardPage').style.display = 'block';
      loadLeaderboard();
      break;
  }
}

let gameHistory = {};
let currentGameCount = {};

function showNewGameDialog() {
  const dialog = document.createElement('div');
  dialog.classList.add('new-game-dialog');
  
  const content = document.createElement('div');
  content.classList.add('new-game-dialog-content');
  
  const title = document.createElement('h3');
  title.textContent = '选择游戏模式';
  content.appendChild(title);
  
  const desc = document.createElement('p');
  desc.textContent = '请选择你想要的操作';
  content.appendChild(desc);
  
  const btnContainer = document.createElement('div');
  btnContainer.classList.add('dialog-buttons');
  
  const newGameBtn = document.createElement('button');
  newGameBtn.textContent = '新的一局';
  newGameBtn.classList.add('dialog-btn', 'dialog-btn-primary');
  newGameBtn.addEventListener('click', () => {
    dialog.remove();
    loadDailyPuzzle(true);
  });
  btnContainer.appendChild(newGameBtn);
  
  const restartBtn = document.createElement('button');
  restartBtn.textContent = '重开此局';
  restartBtn.classList.add('dialog-btn', 'dialog-btn-secondary');
  restartBtn.addEventListener('click', () => {
    dialog.remove();
    restartCurrentPuzzle();
  });
  btnContainer.appendChild(restartBtn);
  
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
    
    renderBoard('dailyBoard', currentPuzzle);
    initNumberPad('numberPad');
  }
}

let currentDifficultyInfo = null;

async function loadDailyPuzzle(newGame = false) {
  isHelpingMode = false;
  currentHelpRequestId = null;
  
  const hasValidGame = gameHistory[difficulty] && gameHistory[difficulty].puzzle && gameHistory[difficulty].solution;
  
  if (!newGame && hasValidGame) {
    currentPuzzle = gameHistory[difficulty].puzzle;
    currentSolution = gameHistory[difficulty].solution;
    puzzleId = gameHistory[difficulty].puzzleId;
    moves = gameHistory[difficulty].moves;
    notes = gameHistory[difficulty].notes;
    currentDifficultyInfo = gameHistory[difficulty].difficultyInfo;
  } else {
    const response = await fetch(`${API_BASE}/api/random?difficulty=${difficulty}`);
    const data = await response.json();
    
    currentPuzzle = data.puzzle;
    currentSolution = data.solution;
    puzzleId = data.id;
    moves = [];
    notes = {};
    currentDifficultyInfo = data.difficultyInfo;
    
    if (!gameHistory[difficulty]) {
      gameHistory[difficulty] = {};
    }
    gameHistory[difficulty].originalPuzzle = data.puzzle.map(v => v);
    gameHistory[difficulty].difficultyInfo = data.difficultyInfo;
    
    if (!currentGameCount[difficulty]) {
      currentGameCount[difficulty] = 0;
    }
    currentGameCount[difficulty]++;
  }
  
  selectedCell = null;
  selectedNumber = null;
  
  renderBoard('dailyBoard', currentPuzzle);
  initNumberPad('numberPad');
  loadRecords();
  loadComments();
  
  updateGameInfo();
}

function saveGameState() {
  const originalPuzzle = gameHistory[difficulty] && gameHistory[difficulty].originalPuzzle;
  const difficultyInfo = gameHistory[difficulty] && gameHistory[difficulty].difficultyInfo;
  gameHistory[difficulty] = {
    puzzle: [...currentPuzzle],
    solution: currentSolution,
    puzzleId: puzzleId,
    moves: [...moves],
    notes: { ...notes },
    originalPuzzle: originalPuzzle,
    difficultyInfo: difficultyInfo
  };
}

function updateGameInfo() {
  const infoDiv = document.getElementById('gameInfo');
  if (infoDiv) {
    const difficultyName = currentDifficultyInfo ? currentDifficultyInfo.name : difficulty;
    const difficultyDesc = currentDifficultyInfo ? currentDifficultyInfo.description : '';
    const stars = currentDifficultyInfo ? '★'.repeat(currentDifficultyInfo.stars) : '';
    
    infoDiv.innerHTML = `
      <div class="difficulty-info">
        <span class="difficulty-name">难度: ${difficultyName}</span>
        <span class="difficulty-stars">${stars}</span>
        ${difficultyDesc ? `<div class="difficulty-desc">${difficultyDesc}</div>` : ''}
      </div>
      <div class="puzzle-id">本局编号: <span id="puzzleIdDisplay">${puzzleId}</span> 
        <button onclick="copyPuzzleId()" style="margin-left: 5px;">复制</button>
      </div>
      <div>今日第<span id="gameCount">${currentGameCount[difficulty] || 1}</span> 局</div>
    `;
  }
}

function copyPuzzleId() {
  const id = document.getElementById('puzzleIdDisplay').textContent;
  navigator.clipboard.writeText(id).then(() => {
    alert('游戏编号已复制到剪贴板');
  });
}

let hintCount = 3;

function initNumberPad(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  const actionBtn = document.createElement('button');
  if (isHelpingMode) {
    actionBtn.textContent = '发布解题';
    actionBtn.classList.add('action-btn', 'submit-solution-btn');
    actionBtn.id = 'submitSolutionBtn';
    actionBtn.disabled = true;
    actionBtn.addEventListener('click', submitHelpSolution);
  } else {
    actionBtn.textContent = '新的一局';
    actionBtn.classList.add('action-btn', 'new-game-btn');
    actionBtn.id = 'newGameBtn';
    actionBtn.addEventListener('click', showNewGameDialog);
  }
  container.appendChild(actionBtn);
  
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement('button');
    btn.classList.add('num-btn');
    btn.setAttribute('data-num', i);
    
    const numSpan = document.createElement('span');
    numSpan.textContent = i;
    btn.appendChild(numSpan);
    
    const countSpan = document.createElement('span');
    countSpan.classList.add('num-count');
    countSpan.textContent = getNumberRemaining(i);
    btn.appendChild(countSpan);
    
    btn.addEventListener('click', () => selectNumber(i));
    container.appendChild(btn);
  }
  
  const noteBtn = document.createElement('button');
  noteBtn.textContent = '笔记';
  noteBtn.classList.add('action-btn', 'note-btn');
  noteBtn.addEventListener('click', toggleNoteMode);
  container.appendChild(noteBtn);
  
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '清除';
  clearBtn.classList.add('action-btn', 'clear-btn');
  clearBtn.id = containerId === 'numberPad' ? 'clearBtn' : 'clearCustomBtn';
  clearBtn.addEventListener('click', containerId === 'numberPad' ? toggleClearMode : clearCustomBoard);
  container.appendChild(clearBtn);
  
  const undoBtn = document.createElement('button');
  undoBtn.textContent = '回退';
  undoBtn.classList.add('action-btn', 'undo-btn');
  undoBtn.addEventListener('click', undoMove);
  container.appendChild(undoBtn);
  
  const helpBtn = document.createElement('button');
  helpBtn.textContent = '求助';
  helpBtn.classList.add('action-btn', 'help-btn');
  helpBtn.id = 'helpBtn';
  helpBtn.addEventListener('click', requestHelp);
  container.appendChild(helpBtn);
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
      const countSpan = btn.querySelector('.num-count');
      const remaining = getNumberRemaining(i);
      if (countSpan) {
        countSpan.textContent = remaining;
      }
      
      if (remaining === 0) {
        btn.classList.add('completed', 'completed-animation');
        btn.disabled = true;
      } else {
        btn.classList.remove('completed', 'completed-animation');
        btn.disabled = false;
      }
    }
  }
}

function selectNumber(num) {
  if (selectedNumber === num) {
    selectedNumber = null;
    document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight-num', 'highlight-cell', 'hint-cell', 'selected'));
  } else {
    selectedNumber = num;
    document.querySelectorAll('.num-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`.num-btn[data-num="${num}"]`).classList.add('selected');
    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('highlight-num', 'highlight-cell', 'highlight-row', 'highlight-col', 'highlight-box', 'hint-cell', 'selected');
    });
    highlightNumberOnBoard(num);
    
    if (isClearMode) {
      isClearMode = false;
      const clearBtn = document.getElementById('clearBtn');
      if (clearBtn) {
        clearBtn.classList.remove('selected');
        clearBtn.style.background = '';
      }
    }
  }
}

function highlightNumberOnBoard(num) {
  document.querySelectorAll('.cell').forEach((cell, idx) => {
    cell.classList.remove('highlight-row', 'highlight-col', 'highlight-box', 'highlight-num');
    if (currentPuzzle[idx] === num) {
      cell.classList.add('highlight-num');
    }
  });
}

function toggleNoteMode() {
  isNoteMode = !isNoteMode;
  const noteBtn = document.querySelector('.note-btn');
  const numBtns = document.querySelectorAll('.num-btn');
  
  if (isNoteMode) {
    noteBtn.classList.add('note-mode');
    numBtns.forEach(btn => {
      btn.classList.add('note-mode');
    });
  } else {
    noteBtn.classList.remove('note-mode');
    numBtns.forEach(btn => {
      btn.classList.remove('note-mode');
    });
  }
  
  if (isClearMode) {
    isClearMode = false;
    const clearBtn = document.getElementById('clearBtn');
    clearBtn.classList.remove('selected');
    clearBtn.style.background = '';
  }
}

function toggleClearMode() {
  isClearMode = !isClearMode;
  const clearBtn = document.getElementById('clearBtn');
  if (isClearMode) {
    clearBtn.classList.add('selected');
    clearBtn.style.background = '#f44336';
  } else {
    clearBtn.classList.remove('selected');
    clearBtn.style.background = '';
  }
}

function addNote(index, num) {
  const boardId = selectedCell.boardId;
  const cell = document.querySelector(`#${boardId} [data-index="${index}"]`);
  
  if (!cell) return;
  
  if (cell.classList.contains('fixed')) {
    return;
  }
  
  if (currentPuzzle[index] !== 0) {
    return;
  }
  
  if (!notes[index]) {
    notes[index] = [];
  }
  
  const oldNotes = [...notes[index]];
  
  const noteIndex = notes[index].indexOf(num);
  if (noteIndex === -1) {
    notes[index].push(num);
  } else {
    notes[index].splice(noteIndex, 1);
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
  } else {
    cell.innerHTML = '';
  }
}

function generateNoteHTML(noteNumbers) {
  const positions = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let html = '<span class="note">';
  for (let i = 0; i < 9; i++) {
    const num = (i + 1).toString();
    html += `<span>${noteNumbers.includes(i + 1) ? num : ''}</span>`;
  }
  html += '</span>';
  return html;
}

function renderBoard(containerId, puzzle, highlightMoves = []) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  const originalPuzzle = gameHistory[difficulty]?.originalPuzzle;
  
  puzzle.forEach((value, index) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = index;
    
    const row = Math.floor(index / 9);
    const col = index % 9;
    
    if (value !== 0) {
      cell.textContent = value;
      if (originalPuzzle && originalPuzzle[index] !== 0) {
        cell.classList.add('fixed');
      }
    } else if (notes[index]) {
      cell.innerHTML = generateNoteHTML(notes[index]);
    }
    
    if (row % 3 === 0 && row !== 0) {
      cell.style.borderTop = '2px solid #333';
    }
    if (col % 3 === 0 && col !== 0) {
      cell.style.borderLeft = '2px solid #333';
    }
    
    highlightMoves.forEach(move => {
      if (move.index === index) {
        cell.textContent = move.value;
        cell.classList.remove('fixed');
        cell.classList.add('selected');
      }
    });
    
    cell.addEventListener('click', () => selectCell(index, containerId));
    container.appendChild(cell);
  });
  
  updateHighlights();
}

function selectCell(index, boardId) {
  selectedCell = { index, boardId };
  
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('selected');
  });
  
  const cell = document.querySelector(`[data-index="${index}"]`);
  if (cell) {
    cell.classList.add('selected');
  }
  
  updateHighlights();
  
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
    if (selectedNumber !== null) {
      highlightNumberOnBoard(selectedNumber);
    }
  }
}

function updateHighlights() {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('highlight-row', 'highlight-col', 'highlight-box', 'highlight-num');
  });
  
  if (!selectedCell) return;
  
  const { index } = selectedCell;
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  const selectedValue = currentPuzzle[index];
  
  document.querySelectorAll('.cell').forEach((cell, idx) => {
    const cellRow = Math.floor(idx / 9);
    const cellCol = idx % 9;
    const cellBoxRow = Math.floor(cellRow / 3);
    const cellBoxCol = Math.floor(cellCol / 3);
    const cellValue = currentPuzzle[idx];
    
    if (cellRow === row) {
      cell.classList.add('highlight-row');
    }
    if (cellCol === col) {
      cell.classList.add('highlight-col');
    }
    if (cellBoxRow === boxRow && cellBoxCol === boxCol) {
      cell.classList.add('highlight-box');
    }
    if (selectedValue !== 0 && cellValue === selectedValue && idx !== index) {
      cell.classList.add('highlight-num');
    }
  });
}

function handleKeydown(e) {
  if (!selectedCell) return;
  
  const num = parseInt(e.key);
  if (num >= 1 && num <= 9) {
    if (isNoteMode) {
      addNote(selectedCell.index, num);
    } else {
      fillCell(num);
    }
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    clearCell();
  } else if (e.key === 'n' || e.key === 'N') {
    toggleNoteMode();
  }
}

function fillCell(num) {
  if (!selectedCell || !currentPuzzle) return;
  
  const { index, boardId } = selectedCell;
  const cell = document.querySelector(`#${boardId} [data-index="${index}"]`);
  
  if (cell && !cell.classList.contains('fixed')) {
    const oldValue = currentPuzzle[index];
    const oldNotes = notes[index] ? [...notes[index]] : null;
    
    currentPuzzle[index] = num;
    cell.textContent = num;
    cell.classList.add('filled');
    
    if (currentSolution && currentSolution[index] !== num) {
      cell.classList.add('error');
    } else {
      cell.classList.remove('error');
    }
    
    if (notes[index]) {
      delete notes[index];
    }
    
    clearRelatedNotes(index, num);
    
    moves.push({
      index,
      value: oldValue,
      notes: oldNotes,
      type: 'fill',
      timestamp: Date.now()
    });
    
    updateNumberCounts();
    checkCompleteLines(index);
    
    updateHighlights();
    checkWin();
    
    saveGameState();
  }
}

function checkCompleteLines(index) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  
  const isRowComplete = checkLineComplete(row, 'row');
  const isColComplete = checkLineComplete(col, 'col');
  const isBoxComplete = checkBoxComplete(boxRow, boxCol);
  
  if (isRowComplete) animateComplete(row, 'row');
  if (isColComplete) animateComplete(col, 'col');
  if (isBoxComplete) animateComplete([boxRow, boxCol], 'box');
}

function checkLineComplete(n, type) {
  for (let i = 0; i < 9; i++) {
    let idx;
    if (type === 'row') {
      idx = n * 9 + i;
    } else {
      idx = i * 9 + n;
    }
    if (currentPuzzle[idx] === 0) return false;
  }
  return true;
}

function checkBoxComplete(boxRow, boxCol) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = (boxRow * 3 + i) * 9 + (boxCol * 3 + j);
      if (currentPuzzle[idx] === 0) return false;
    }
  }
  return true;
}

function animateComplete(n, type) {
  const cells = [];
  
  if (type === 'row') {
    for (let i = 0; i < 9; i++) {
      cells.push(document.querySelector(`[data-index="${n * 9 + i}"]`));
    }
  } else if (type === 'col') {
    for (let i = 0; i < 9; i++) {
      cells.push(document.querySelector(`[data-index="${i * 9 + n}"]`));
    }
  } else if (type === 'box') {
    const [boxRow, boxCol] = n;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        cells.push(document.querySelector(`[data-index="${(boxRow * 3 + i) * 9 + (boxCol * 3 + j)}"]`));
      }
    }
  }
  
  cells.forEach(cell => {
    if (cell) {
      cell.classList.add('complete-animation');
      setTimeout(() => {
        cell.classList.remove('complete-animation');
      }, 500);
    }
  });
}

function clearRelatedNotes(index, num) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  const boardId = selectedCell.boardId;
  
  for (let i = 0; i < 81; i++) {
    if (i === index || !notes[i]) continue;
    
    const cellRow = Math.floor(i / 9);
    const cellCol = i % 9;
    const cellBoxRow = Math.floor(cellRow / 3);
    const cellBoxCol = Math.floor(cellCol / 3);
    
    const isSameRow = cellRow === row;
    const isSameCol = cellCol === col;
    const isSameBox = cellBoxRow === boxRow && cellBoxCol === boxCol;
    
    if (isSameRow || isSameCol || isSameBox) {
      const noteIndex = notes[i].indexOf(num);
      if (noteIndex !== -1) {
        notes[i].splice(noteIndex, 1);
        
        if (notes[i].length === 0) {
          delete notes[i];
        }
        
        const cell = document.querySelector(`#${boardId} [data-index="${i}"]`);
        if (cell && !currentPuzzle[i]) {
          cell.innerHTML = notes[i] ? generateNoteHTML(notes[i]) : '';
        }
      }
    }
  }
}

function clearCell() {
  if (!selectedCell || !currentPuzzle) return;
  
  const { index, boardId } = selectedCell;
  const cell = document.querySelector(`#${boardId} [data-index="${index}"]`);
  
  if (cell && !cell.classList.contains('fixed')) {
    currentPuzzle[index] = 0;
    cell.textContent = '';
    cell.classList.remove('error', 'filled');
    
    if (notes[index]) {
      delete notes[index];
    }
  }
}

async function requestHelp() {
  if (!currentPuzzle || !currentSolution || !puzzleId) {
    alert('请先开始一局游戏');
    return;
  }
  
  if (!currentUser) {
    alert('请先登录！');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/help`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameId: puzzleId,
        puzzle: gameHistory[difficulty]?.originalPuzzle || currentPuzzle,
        solution: currentSolution,
        progress: currentPuzzle,
        notes: notes,
        difficulty: difficulty,
        userId: currentUser.id
      })
    });
    
    const data = await response.json();
    if (data.success) {
      alert(`求助已发布！求助编号：${data.requestId}\n其他玩家可以在共创挑战中看到你的求助。`);
    } else {
      alert('发布求助失败，请重试！');
    }
  } catch (error) {
    console.error('发布求助失败:', error);
    alert('发布求助失败，请检查网络连接！');
  }
}

async function loadHelpRequests() {
  try {
    const response = await fetch(`${API_BASE}/api/help`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('加载求助列表失败:', error);
    return [];
  }
}

async function getHelpRequest(id) {
  try {
    const response = await fetch(`${API_BASE}/api/help/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('加载求助详情失败:', error);
    return null;
  }
}

async function submitHelpResponse(requestId, stepData) {
  const userId = localStorage.getItem('userId') || 'anonymous';
  
  try {
    const response = await fetch(`${API_BASE}/api/help/${requestId}/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        helperId: userId,
        stepData: stepData
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('提交帮助失败:', error);
    return false;
  }
}

function showHint() {
  if (!currentPuzzle || !currentSolution) return;
  
  const emptyIndices = [];
  currentPuzzle.forEach((val, idx) => {
    if (val === 0) emptyIndices.push(idx);
  });
  
  if (emptyIndices.length > 0) {
    const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const correctValue = currentSolution[randomIdx];
    
    moves.push({
      index: randomIdx,
      value: currentPuzzle[randomIdx],
      timestamp: Date.now(),
      isUndo: true
    });
    
    currentPuzzle[randomIdx] = correctValue;
    const cell = document.querySelector(`[data-index="${randomIdx}"]`);
    cell.textContent = correctValue;
    cell.classList.add('filled', 'hint-cell');
    
    hintCount--;
    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) {
      hintBtn.textContent = `提示(${hintCount})`;
      if (hintCount <= 0) {
        hintBtn.disabled = true;
        hintBtn.style.opacity = '0.5';
      }
    }
    
    checkWin();
  }
}

function undoMove() {
  if (moves.length === 0) {
    alert('没有可以回退的步骤！');
    return;
  }
  
  const lastMove = moves.pop();
  const cell = document.querySelector(`[data-index="${lastMove.index}"]`);
  
  if (cell) {
    currentPuzzle[lastMove.index] = lastMove.value;
    
    if (lastMove.type === 'note') {
      if (lastMove.notes && lastMove.notes.length > 0) {
        notes[lastMove.index] = [...lastMove.notes];
        cell.innerHTML = generateNoteHTML(notes[lastMove.index]);
      } else {
        delete notes[lastMove.index];
        cell.innerHTML = '';
      }
    } else {
      cell.textContent = lastMove.value || '';
      cell.classList.remove('filled', 'error', 'hint-cell');
      
      if (lastMove.notes && lastMove.notes.length > 0) {
        notes[lastMove.index] = [...lastMove.notes];
        cell.innerHTML = generateNoteHTML(notes[lastMove.index]);
      } else {
        delete notes[lastMove.index];
      }
    }
    
    if (lastMove.isUndo && hintCount < 3) {
      hintCount++;
      const hintBtn = document.getElementById('hintBtn');
      if (hintBtn) {
        hintBtn.textContent = `提示(${hintCount})`;
        hintBtn.disabled = false;
        hintBtn.style.opacity = '1';
      }
    }
  }
  
  updateNumberCounts();
}

function checkPuzzle() {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('error');
  });
  
  let hasError = false;
  
  currentPuzzle.forEach((value, index) => {
    if (value !== 0 && value !== currentSolution[index]) {
      const cell = document.querySelector(`[data-index="${index}"]`);
      if (cell) {
        cell.classList.add('error');
        hasError = true;
      }
    }
  });
  
  if (!hasError) {
    alert('当前填写全部正确！');
  }
}

function solvePuzzle() {
  currentPuzzle = [...currentSolution];
  renderBoard('dailyBoard', currentPuzzle);
}

function checkWin() {
  const isComplete = currentPuzzle.every((val, idx) => val === currentSolution[idx]);
  if (isComplete) {
    if (isHelpingMode) {
      alert('恭喜！你已经完成了这道求助题目，现在可以发布解题了！');
      const submitBtn = document.getElementById('submitSolutionBtn');
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    } else {
      alert('恭喜通关！');
      submitCompletion();
    }
  }
}

async function submitHelpSolution() {
  if (!currentUser || !currentHelpRequestId) {
    return;
  }
  
  if (!confirm('确定要发布解题吗？这将通知求助者你已经完成了他们的题目解答。')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/help/${currentHelpRequestId}/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        helperId: currentUser.id,
        stepData: moves
      })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('解题发布成功！求助者将收到通知。');
      
      solvedHelpRequests.push(currentHelpRequestId);
      
      isHelpingMode = false;
      currentHelpRequestId = null;
      
      showPage('shared');
      loadSharedGames();
    } else {
      alert('发布解题失败：' + (data.error || '未知错误'));
    }
  } catch (error) {
    console.error('发布解题失败:', error);
    alert('发布解题失败，请检查网络连接！');
  }
}

async function submitCompletion() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/daily/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ puzzleId, difficulty })
    });
    
    const data = await response.json();
    if (response.ok) {
      currentUser.points += data.points;
      currentUser.level += 1;
      updateUserInfo();
      loadRecords();
    }
  } catch (err) {
    console.error('提交失败:', err);
  }
}

async function loadRecords() {
  const response = await fetch(`${API_BASE}/api/daily/records/${puzzleId}`);
  const records = await response.json();
  
  const container = document.getElementById('recordsList');
  container.innerHTML = '';
  
  records.forEach((record, idx) => {
    const item = document.createElement('div');
    item.className = 'record-item';
    item.innerHTML = `
      <div>排名 ${idx + 1}</div>
      <div>玩家: ${record.username}</div>
      <div>等级: ${record.level}</div>
      <div>时间: ${record.completed_at}</div>
    `;
    container.appendChild(item);
  });
}

async function loadComments() {
  const response = await fetch(`${API_BASE}/api/comments/${puzzleId}`);
  const comments = await response.json();
  
  const container = document.getElementById('commentsList');
  container.innerHTML = '';
  
  comments.forEach(comment => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <div class="username">${comment.username} (等级 ${comment.level})</div>
      <div class="content">${comment.content}</div>
      <div class="time">${comment.created_at}</div>
    `;
    container.appendChild(item);
  });
}

async function submitComment() {
  const content = document.getElementById('commentInput').value;
  if (!content.trim()) return;
  
  const token = localStorage.getItem('token');
  if (!token) {
    alert('请先登录');
    return;
  }
  
  const response = await fetch(`${API_BASE}/api/comments`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ puzzleId, content })
  });
  
  if (response.ok) {
    document.getElementById('commentInput').value = '';
    loadComments();
  }
}

function initCustomBoard() {
  const emptyPuzzle = Array(81).fill(0);
  currentPuzzle = emptyPuzzle;
  renderBoard('customBoard', emptyPuzzle);
  
  const numberPad = document.getElementById('customNumberPad');
  numberPad.innerHTML = '';
  
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.addEventListener('click', () => fillCustomCell(i));
    numberPad.appendChild(btn);
  }
}

function fillCustomCell(num) {
  if (!selectedCell) return;
  
  const { index } = selectedCell;
  const cell = document.querySelector('#customBoard [data-index="' + index + '"]');
  
  if (cell) {
    currentPuzzle[index] = num;
    cell.textContent = num;
  }
}

function clearCustomBoard() {
  currentPuzzle = Array(81).fill(0);
  renderBoard('customBoard', currentPuzzle);
}

async function verifyCustomPuzzle() {
  const response = await fetch(`${API_BASE}/api/custom/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puzzle: currentPuzzle })
  });
  
  const data = await response.json();
  alert(data.valid ? '配置有效！' : '配置无效，请检查重复数字');
}

async function publishCustomGame() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('请先登录');
    return;
  }
  
  const title = prompt('请输入游戏标题：');
  if (!title) {
    return;
  }
  
  const response = await fetch(`${API_BASE}/api/custom/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puzzle: currentPuzzle })
  });
  
  const data = await response.json();
  if (!data.valid) {
    alert('配置无效，请检查重复数字');
    return;
  }
  
  const solutionResponse = await fetch(`${API_BASE}/api/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puzzle: currentPuzzle })
  });
  
  const solutionData = await solutionResponse.json();
  if (!solutionData.solution) {
    alert('无法计算解决方案，请检查数独是否有解');
    return;
  }
  
  const publishResponse = await fetch(`${API_BASE}/api/custom/create`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      puzzle: currentPuzzle, 
      solution: solutionData.solution,
      title: title
    })
  });
  
  const publishData = await publishResponse.json();
  if (publishData.success) {
    alert(`游戏发布成功！游戏编号：${publishData.id}\n其他玩家可以在共创挑战中看到你的游戏。`);
  } else {
    alert('发布失败：' + (publishData.error || '未知错误'));
  }
}

async function startCustomGame() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('请先登录');
    return;
  }
  
  const response = await fetch(`${API_BASE}/api/custom/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puzzle: currentPuzzle })
  });
  
  const data = await response.json();
  if (!data.valid) {
    alert('配置无效，请检查重复数字');
    return;
  }
  
  const solution = await solveSudoku(currentPuzzle);
  if (!solution) {
    alert('无法找到解答');
    return;
  }
  
  const createResponse = await fetch(`${API_BASE}/api/custom/create`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      puzzle: currentPuzzle, 
      solution: solution,
      title: '自定义数独'
    })
  });
  
  if (createResponse.ok) {
    alert('游戏创建成功！');
    showPage('shared');
  }
}

async function loadGameById() {
  const gameIdInput = document.getElementById('gameIdInput');
  const gameId = gameIdInput.value.trim();
  
  if (!gameId) {
    alert('请输入游戏编号');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/game/${gameId}`);
    const data = await response.json();
    
    if (!response.ok) {
      alert(data.error || '加载游戏失败');
      return;
    }
    
    currentPuzzle = data.puzzle;
    currentSolution = data.solution;
    puzzleId = data.id;
    moves = [];
    notes = {};
    selectedCell = null;
    selectedNumber = null;
    
    showPage('daily');
    renderBoard('dailyBoard', currentPuzzle);
    initNumberPad('numberPad');
    updateGameInfo();
    
    alert('游戏加载成功！');
  } catch (error) {
    console.error('加载游戏失败:', error);
    alert('加载游戏失败，请检查网络连接！');
  }
}

function solveSudoku(puzzle) {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push(puzzle.slice(i * 9, (i + 1) * 9));
  }
  
  if (solve(grid)) {
    return grid.flat();
  }
  return null;
}

function solve(grid) {
  const empty = findEmpty(grid);
  if (!empty) return true;
  
  const [row, col] = empty;
  
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      grid[row][col] = num;
      if (solve(grid)) return true;
      grid[row][col] = 0;
    }
  }
  return false;
}

function findEmpty(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) return [row, col];
    }
  }
  return null;
}

function isValidPlacement(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
  }
  
  for (let i = 0; i < 9; i++) {
    if (grid[i][col] === num) return false;
  }
  
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j] === num) return false;
    }
  }
  return true;
}

async function loadSharedGames() {
  const [customGamesResponse, helpRequestsResponse] = await Promise.all([
    fetch(`${API_BASE}/api/custom/list`),
    fetch(`${API_BASE}/api/help`)
  ]);
  
  const customGames = await customGamesResponse.json();
  const helpRequests = await helpRequestsResponse.json();
  
  const container = document.getElementById('sharedList');
  container.innerHTML = '';
  
  if (customGames.length === 0 && helpRequests.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">暂无自定义游戏和求助请求</div>';
    return;
  }
  
  if (helpRequests.length > 0) {
    const helpSection = document.createElement('div');
    helpSection.className = 'shared-section';
    helpSection.innerHTML = '<h3>求助请求</h3>';
    container.appendChild(helpSection);
    
    helpRequests.forEach(request => {
      const item = document.createElement('div');
      const isMyRequest = currentUser && request.user_id === currentUser.id;
      const isSolved = solvedHelpRequests.includes(request.id);
      item.className = `shared-item help-item ${isMyRequest ? 'my-request' : ''} ${isSolved ? 'solved' : ''}`;
      const difficultyName = request.difficulty === 'beginner' ? '入门' : 
                            request.difficulty === 'easy' ? '简单' : 
                            request.difficulty === 'medium' ? '中等' : 
                            request.difficulty === 'hard' ? '困难' : 
                            request.difficulty === 'expert' ? '专家' : '大师';
      
      item.innerHTML = `
        <div class="title">求助编号：${request.id} ${isMyRequest ? '(我发起的)' : ''} ${isSolved ? '(已解答)' : ''}</div>
        <div class="meta">求助人：${request.username || '匿名'}</div>
        <div class="meta">难度：${difficultyName}</div>
        <div class="meta">求助时间：${new Date(request.created_at).toLocaleString('zh-CN')}</div>
        <div class="meta">${isSolved ? '已解答' : '点击进入并帮助 TA'}</div>
      `;
      if (!isSolved) {
        item.addEventListener('click', () => loadHelpRequest(request.id));
      }
      container.appendChild(item);
    });
  }
  
  if (customGames.length > 0) {
    const customSection = document.createElement('div');
    customSection.className = 'shared-section';
    customSection.innerHTML = '<h3>自定义游戏</h3>';
    container.appendChild(customSection);
    
    customGames.forEach(game => {
      const item = document.createElement('div');
      item.className = 'shared-item';
      item.innerHTML = `
        <div class="title">${game.title}</div>
        <div class="meta">难度等级: ${game.difficulty}</div>
        <div class="meta">作者: ${game.username}</div>
        <div class="meta">创建时间: ${game.created_at}</div>
      `;
      item.addEventListener('click', () => loadSharedGame(game.id));
      container.appendChild(item);
    });
  }
}

async function loadSharedGame(id) {
  const response = await fetch(`${API_BASE}/api/custom/${id}`);
  const game = await response.json();
  
  currentPuzzle = game.puzzle;
  currentSolution = game.solution;
  puzzleId = id;
  moves = [];
  
  document.getElementById('replayContainer').style.display = 'none';
  document.getElementById('sharedList').style.display = 'none';
  
  const container = document.createElement('div');
  container.innerHTML = `
    <h2>${game.title}</h2>
    <p>难度等级: ${game.difficulty}</p>
    <button id="playFromStart">从头开始</button>
    <button id="viewShares">查看分享进度</button>
    <button id="backToList">返回列表</button>
  `;
  document.getElementById('sharedPage').appendChild(container);
  
  document.getElementById('playFromStart').addEventListener('click', () => {
    container.remove();
    document.getElementById('replayContainer').style.display = 'flex';
    renderBoard('replayBoard', currentPuzzle);
  });
  
  document.getElementById('viewShares').addEventListener('click', () => {
    container.remove();
    loadSharedProgress(id);
  });
  
  document.getElementById('backToList').addEventListener('click', () => {
    container.remove();
    document.getElementById('sharedList').style.display = 'grid';
  });
}

async function loadSharedProgress(puzzleId) {
  const response = await fetch(`${API_BASE}/api/share/${puzzleId}`);
  const data = await response.json();
  
  currentPuzzle = data.puzzle;
  currentSolution = data.solution;
  moves = data.moves;
  replayIndex = 0;
  
  document.getElementById('sharedList').style.display = 'none';
  document.getElementById('replayContainer').style.display = 'flex';
  
  renderBoard('replayBoard', currentPuzzle);
}

function playReplay() {
  if (replayInterval) clearInterval(replayInterval);
  
  replayInterval = setInterval(() => {
    if (replayIndex < moves.length) {
      const move = moves[replayIndex];
      currentPuzzle[move.index] = move.value;
      const cell = document.querySelector('#replayBoard [data-index="' + move.index + '"]');
      if (cell) {
        cell.textContent = move.value;
        cell.classList.add('selected');
        setTimeout(() => cell.classList.remove('selected'), 500);
      }
      replayIndex++;
    } else {
      clearInterval(replayInterval);
    }
  }, 1000 / replaySpeed);
}

function pauseReplay() {
  if (replayInterval) {
    clearInterval(replayInterval);
    replayInterval = null;
  }
}

function prevReplay() {
  if (replayIndex > 0) {
    replayIndex--;
    const currentState = [...currentPuzzle];
    
    moves.slice(0, replayIndex).forEach(move => {
      currentState[move.index] = move.value;
    });
    
    for (let i = replayIndex; i < moves.length; i++) {
      currentState[moves[i].index] = 0;
    }
    
    currentPuzzle = currentState;
    renderBoard('replayBoard', currentPuzzle);
  }
}

function changeSpeed() {
  const speeds = [1, 2, 5, 10];
  const currentIdx = speeds.indexOf(replaySpeed);
  replaySpeed = speeds[(currentIdx + 1) % speeds.length];
  document.getElementById('speedBtn').textContent = `速度: ${replaySpeed}x`;
}

async function loadLeaderboard() {
  const response = await fetch(`${API_BASE}/api/users/top`);
  const users = await response.json();
  
  const body = document.getElementById('leaderboardBody');
  body.innerHTML = '';
  
  users.forEach((user, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${user.username}</td>
      <td>${user.level}</td>
      <td>${user.points}</td>
    `;
    body.appendChild(row);
  });
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('authModal')) {
    closeModal();
  }
});

async function loadHelpRequest(id) {
  const request = await getHelpRequest(id);
  if (!request) {
    alert('求助请求不存在！');
    return;
  }
  
  const originalPuzzle = JSON.parse(request.puzzle);
  currentPuzzle = JSON.parse(request.progress);
  currentSolution = JSON.parse(request.solution);
  puzzleId = request.game_id;
  moves = [];
  notes = JSON.parse(request.notes) || {};
  selectedCell = null;
  selectedNumber = null;
  difficulty = request.difficulty;
  
  isHelpingMode = true;
  currentHelpRequestId = id;
  
  if (!gameHistory[difficulty]) {
    gameHistory[difficulty] = {};
  }
  gameHistory[difficulty].originalPuzzle = originalPuzzle;
  gameHistory[difficulty].puzzle = currentPuzzle;
  gameHistory[difficulty].solution = currentSolution;
  gameHistory[difficulty].puzzleId = puzzleId;
  gameHistory[difficulty].moves = moves;
  gameHistory[difficulty].notes = notes;
  
  showPage('daily');
  renderBoard('dailyBoard', currentPuzzle);
  initNumberPad('numberPad');
  updateGameInfo();
  
  alert(`已加载 ${request.username || '匿名'} 的求助游戏，开始帮助 TA 完成数独吧！`);
}
