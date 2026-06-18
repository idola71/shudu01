import { 
    initTCB, 
    getSharedGames, 
    deleteSharedGame,
    getLeaderboard 
} from './tcb-service.js';

let allGames = [];
let currentGames = [];

const DIFFICULTY_CONFIG = {
    easy: { name: '简单', stars: 1 },
    medium: { name: '中等', stars: 2 },
    hard: { name: '困难', stars: 3 },
    expert: { name: '专家', stars: 4 }
};

let currentFilter = 'all';
let currentSort = 'newest';
let currentSearch = '';

async function loadGames() {
    try {
        await initTCB();
        allGames = await getSharedGames();
        currentGames = [...allGames];
        renderGameGrid();
    } catch (error) {
        console.error('Failed to load games:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadGames();
    
    document.getElementById('searchInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            searchGames();
        }
    });
    
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchGames);
    } else {
        const searchBtnByClass = document.querySelector('.search-btn');
        if (searchBtnByClass) {
            searchBtnByClass.addEventListener('click', searchGames);
        }
    }
});

function createCustomGame() {
    window.location.href = 'custom-editor.html';
}

function renderGameGrid() {
    const gameGrid = document.getElementById('gameGrid');
    const emptyState = document.getElementById('emptyState');

    if (!currentGames || currentGames.length === 0) {
        gameGrid.innerHTML = '';
        gameGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    gameGrid.style.display = 'grid';
    gameGrid.innerHTML = '';

    currentGames.forEach(game => {
        const card = createGameCard(game);
        gameGrid.appendChild(card);
    });
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.classList.add('game-card');
    card.addEventListener('click', () => {
        localStorage.setItem('sharedGame', JSON.stringify(game));
        window.location.href = 'paradise-game.html?gameId=' + game.id;
    });

    let isOwnGame = false;
    if (window.UserManager && UserManager.isLoggedIn()) {
        const user = UserManager.getUser();
        const userId = user?.id || user?.username;
        isOwnGame = game.userId === userId || 
                    game.username === userId || 
                    game.nickname === user?.nickname;
    }

    let html = '';

    if (isOwnGame) {
        html += `
            <button class="cancel-share-btn" data-id="${game.id}" title="取消分享">✕</button>
        `;
    }

    html += `
        <div class="card-main">
            <div class="card-thumbnail">
                <div class="thumbnail-grid">
                    ${generateThumbnail(game.playerPuzzle)}
                </div>
            </div>
            <div class="card-leaderboard">
                <div class="leaderboard-header">最快记录</div>
                <div class="leaderboard-top">
                    ${generateTopThreeHTML(game.id)}
                </div>
            </div>
        </div>
    `;

    html += `
        <div class="card-content">
            <div class="difficulty-badge ${game.difficulty}">
                ${DIFFICULTY_CONFIG[game.difficulty]?.name || '未知'}
            </div>
            <div class="card-title" title="${game.slogan}">${game.slogan}</div>
            <div class="card-game-code">游戏编号：${game.gameCode || 'N/A'}</div>
            <div class="card-meta">
                <img src="public/images/账号图标.svg" alt="${game.nickname}">
                <span>${game.nickname}</span>
            </div>
            <div class="card-stats">
                <div class="stat-item">
                    <img src="public/images/参与人数图标.svg" alt="参与人数" class="stat-icon">
                    <span>${game.participants}</span>
                </div>
                <div class="stat-item">
                    <img src="public/images/通关人数图标.svg" alt="通关人数" class="stat-icon">
                    <span>${game.completed}</span>
                </div>
                <div class="stat-item">
                    <img src="public/images/分享日期图标.svg" alt="分享日期" class="stat-icon">
                    <span>${game.shareTime}</span>
                </div>
            </div>
        </div>
    `;

    card.innerHTML = html;

    if (isOwnGame) {
        const cancelBtn = card.querySelector('.cancel-share-btn');
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (confirm('确定要取消分享这个游戏吗？')) {
                cancelShare(game.id);
            }
        });
    }

    return card;
}

async function generateTopThreeHTML(gameId) {
    const leaderboard = await getLeaderboard(gameId);
    return leaderboard.slice(0, 3).map((item, index) => `
        <div class="top-item">
            <span class="top-rank">${index + 1}</span>
            <span class="top-time">${item ? formatTime(item.time) : '--'}</span>
        </div>
    `).join('');
}

function formatTime(seconds) {
    if (!seconds || seconds < 0) return '--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function cancelShare(gameId) {
    const success = await deleteSharedGame(gameId);
    if (success) {
        await loadGames();
        alert('已取消分享');
    } else {
        alert('取消分享失败');
    }
}

function generateThumbnail(puzzle) {
    let html = '';
    const cells = puzzle.split('');
    
    cells.forEach((cell, index) => {
        const isFixed = cell !== '0';
        html += `<div class="thumbnail-cell${isFixed ? ' fixed' : ''}">${isFixed ? cell : ''}</div>`;
    });
    
    return html;
}

function searchGames() {
    const searchInput = document.getElementById('searchInput');
    currentSearch = searchInput.value.trim().toLowerCase();
    applyFilters();
}

function filterGames() {
    const filterSelect = document.getElementById('filterSelect');
    currentFilter = filterSelect.value;
    applyFilters();
}

function sortGames() {
    const sortSelect = document.getElementById('sortSelect');
    currentSort = sortSelect.value;
    applyFilters();
}

function applyFilters() {
    let filtered = [...allGames];

    let currentUserId = null;
    let currentUserNickname = null;
    if (window.UserManager && UserManager.isLoggedIn()) {
        const user = UserManager.getUser();
        currentUserId = user?.id || user?.username;
        currentUserNickname = user?.nickname;
    }

    if (currentFilter === 'mine') {
        filtered = filtered.filter(game => {
            if (currentUserId && (game.userId === currentUserId || game.username === currentUserId)) {
                return true;
            }
            if (currentUserNickname && game.nickname === currentUserNickname) {
                return true;
            }
            return false;
        });
    } else if (currentFilter === 'others') {
        filtered = filtered.filter(game => {
            if (currentUserId && (game.userId === currentUserId || game.username === currentUserId)) {
                return false;
            }
            if (currentUserNickname && game.nickname === currentUserNickname) {
                return false;
            }
            return true;
        });
    }

    if (currentSearch) {
        filtered = filtered.filter(game => {
            const nicknameMatch = game.nickname && game.nickname.toLowerCase().includes(currentSearch);
            const codeMatch = game.gameCode && game.gameCode.toLowerCase().includes(currentSearch);
            return nicknameMatch || codeMatch;
        });
    }

    filtered.sort((a, b) => {
        const timeA = new Date(a.shareTime.replace(/-/g, '/')).getTime();
        const timeB = new Date(b.shareTime.replace(/-/g, '/')).getTime();
        
        if (currentSort === 'newest') {
            return timeB - timeA;
        } else {
            return timeA - timeB;
        }
    });

    currentGames = filtered;
    renderGameGrid();
}