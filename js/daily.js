// 今日挑战模块

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

async function loadDailyPuzzle(newGame = false) {
  // 重置帮助模式
  if (typeof isHelpingMode !== 'undefined') {
    window.isHelpingMode = false;
  }
  if (typeof currentHelpRequestId !== 'undefined') {
    window.currentHelpRequestId = null;
  }
  
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

function initNumberPad(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  const actionBtn = document.createElement('button');
  actionBtn.textContent = '新的一局';
  actionBtn.classList.add('action-btn', 'new-game-btn');
  actionBtn.id = 'newGameBtn';
  actionBtn.addEventListener('click', showNewGameDialog);
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
  clearBtn.id = 'clearBtn';
  clearBtn.addEventListener('click', toggleClearMode);
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

function checkWin() {
  const isComplete = currentPuzzle.every((val, idx) => val === currentSolution[idx]);
  if (isComplete) {
    alert('恭喜通关！');
    submitCompletion();
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
    }
  } catch (error) {
    console.error('提交通关记录失败:', error);
  }
}

// 记录和评论
async function loadRecords() {
  try {
    const response = await fetch(`${API_BASE}/api/records/${puzzleId}`);
    const records = await response.json();
    
    const recordsDiv = document.getElementById('records');
    if (records.length === 0) {
      recordsDiv.innerHTML = '<p>暂无通关记录</p>';
      return;
    }
    
    recordsDiv.innerHTML = records.map(r => `
      <div class="record-item">
        <span>${r.username}</span>
        <span>${new Date(r.completed_at).toLocaleString()}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('加载记录失败:', error);
  }
}

async function loadComments() {
  try {
    const response = await fetch(`${API_BASE}/api/comments/${puzzleId}`);
    const comments = await response.json();
    
    const commentsDiv = document.getElementById('comments');
    if (comments.length === 0) {
      commentsDiv.innerHTML = '<p>暂无评论</p>';
      return;
    }
    
    commentsDiv.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-header">
          <span>${c.username}</span>
          <span>${new Date(c.created_at).toLocaleString()}</span>
        </div>
        <div class="comment-content">${c.content}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('加载评论失败:', error);
  }
}

async function submitComment() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('请先登录');
    return;
  }
  
  const content = document.getElementById('commentInput').value.trim();
  if (!content) {
    alert('请输入评论内容');
    return;
  }
  
  try {
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
  } catch (error) {
    console.error('提交评论失败:', error);
  }
}

// 求助功能
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
      alert('发布求助失败：' + (data.error || '未知错误'));
    }
  } catch (error) {
    console.error('发布求助失败:', error);
    alert('发布求助失败，请检查网络连接！');
  }
}
