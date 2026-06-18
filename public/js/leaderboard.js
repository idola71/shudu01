let leaderboardPopup = null;
let leaderboardBackdrop = null;
let gamePaused = false;

document.addEventListener('DOMContentLoaded', function() {
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', toggleLeaderboard);
    }
});

function toggleLeaderboard() {
    if (!leaderboardPopup) {
        createLeaderboardPopup();
    }

    const isVisible = leaderboardPopup.style.display === 'flex';
    
    if (isVisible) {
        closeLeaderboard();
    } else {
        openLeaderboard();
    }
}

function createLeaderboardPopup() {
    leaderboardBackdrop = document.createElement('div');
    leaderboardBackdrop.className = 'message-backdrop';
    leaderboardBackdrop.id = 'leaderboardBackdrop';
    leaderboardBackdrop.style.display = 'none';
    leaderboardBackdrop.addEventListener('click', closeLeaderboard);

    leaderboardPopup = document.getElementById('leaderboardPopup');
    if (!leaderboardPopup) {
        leaderboardPopup = document.createElement('div');
        leaderboardPopup.className = 'message-popup';
        leaderboardPopup.id = 'leaderboardPopup';
        leaderboardPopup.innerHTML = `
            <div class="message-popup-content">
                <div class="message-popup-header">
                    <h3>排行榜</h3>
                    <button class="close-btn" onclick="closeLeaderboard()">×</button>
                </div>
                <div class="leaderboard-list" id="leaderboardList">
                </div>
            </div>
        `;
        document.body.appendChild(leaderboardPopup);
    }

    document.body.appendChild(leaderboardBackdrop);
}

function openLeaderboard() {
    if (!leaderboardPopup) {
        createLeaderboardPopup();
    }

    if (!gamePaused && typeof pauseTimer === 'function') {
        pauseTimer();
        gamePaused = true;
    }

    leaderboardPopup.style.display = 'flex';
    leaderboardBackdrop.style.display = 'block';

    loadLeaderboardData();
}

function closeLeaderboard() {
    if (!leaderboardPopup) return;

    leaderboardPopup.style.display = 'none';
    leaderboardBackdrop.style.display = 'none';

    if (gamePaused && typeof resumeTimer === 'function') {
        resumeTimer();
        gamePaused = false;
    }
}

async function loadLeaderboardData() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;

    try {
        const { initTCB, getLeaderboard } = await import('./tcb-service.js');
        await initTCB();
        
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId') || 'default';
        
        const data = await getLeaderboard(gameId);
        
        if (data.length > 0) {
            renderLeaderboard(data);
            return;
        }
    } catch (error) {
        console.error('TCB loadLeaderboard error:', error);
    }
    
    const data = getLeaderboardDataLocal();
    renderLeaderboard(data);
}

function renderLeaderboard(data) {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;

    if (data.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-empty">暂无排行榜数据</div>';
        return;
    }

    leaderboardList.innerHTML = data.slice(0, 10).map((item, index) => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${escapeHtml(item.name)}</div>
                <div class="leaderboard-details">
                    <span class="leaderboard-time">${formatTime(item.time)}</span>
                    <span class="leaderboard-errors">错误: ${item.errors || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getLeaderboardDataLocal() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId') || 'default';
    const allLeaderboards = JSON.parse(localStorage.getItem('paradiseLeaderboards') || '{}');
    const leaderboard = allLeaderboards[gameId] || [];

    return leaderboard.sort((a, b) => {
        const errorDiff = (a.errors || 0) - (b.errors || 0);
        if (errorDiff !== 0) return errorDiff;
        return a.time - b.time;
    });
}

async function addLeaderboardRecord(name, time, errors = 0) {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId') || 'default';

    try {
        const { initTCB, addLeaderboardRecord } = await import('./tcb-service.js');
        await initTCB();
        
        await addLeaderboardRecord({
            gameId: gameId,
            name: name,
            time: time,
            errors: errors,
            date: new Date().toISOString()
        });
        console.log('Leaderboard record added to TCB');
    } catch (error) {
        console.error('TCB addLeaderboardRecord error:', error);
    }

    const allLeaderboards = JSON.parse(localStorage.getItem('paradiseLeaderboards') || '{}');
    if (!allLeaderboards[gameId]) {
        allLeaderboards[gameId] = [];
    }

    allLeaderboards[gameId].push({
        name: name,
        time: time,
        errors: errors,
        date: new Date().toISOString()
    });

    localStorage.setItem('paradiseLeaderboards', JSON.stringify(allLeaderboards));
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}