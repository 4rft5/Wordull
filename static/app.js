// Word lists (from original)
const VALID_GUESSES = [/* We'll use API validation instead */];

// Game state
let gameState = {
    boardState: [],
    evaluations: [],
    rowIndex: 0,
    gameStatus: 'IN_PROGRESS',
    solution: null,
    hardMode: false
};

let currentGuess = '';
let letterEvaluations = {};
let canInput = true;

// Get user's timezone offset to properly calculate "today"
function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Config management
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        return config;
    } catch (error) {
        console.error('Error loading config:', error);
        return {
            darkMode: false,
            hardMode: false,
            statsImported: false,
            notificationsEnabled: false,
            appriseUrl: '',
            reminderTime: '20:00'
        };
    }
}

async function saveConfig(config) {
    try {
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
    } catch (error) {
        console.error('Error saving config:', error);
    }
}

// Initialize game
async function initGame() {
    await loadGameState();
    
    // Load config (dark mode, stats imported status, tutorial)
    const config = await loadConfig();
    
    if (config.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    renderBoard();
    updateKeyboard();
    setupEventListeners();
    
    // Show tutorial on first load
    if (!config.tutorialShown) {
        setTimeout(() => {
            showHelpModal();
        }, 500);
    }
    
    // Show stats if game is complete and just loaded
    if (gameState.gameStatus !== 'IN_PROGRESS' && !sessionStorage.getItem('statsShown')) {
        setTimeout(() => {
            showStatsModal();
            sessionStorage.setItem('statsShown', 'true');
        }, 500);
    }
    
    // Check for new day every minute
    setInterval(checkForNewDay, 60000);
}

let lastCheckedDate = getTodayDate();

async function checkForNewDay() {
    const currentDate = getTodayDate();
    if (currentDate !== lastCheckedDate) {
        lastCheckedDate = currentDate;
        location.reload(); // Reload to get new puzzle
    }
}

// API calls
async function loadGameState() {
    try {
        const response = await fetch('/api/game-state');
        const data = await response.json();
        gameState = data;
        
        // If game is complete, can't input
        if (gameState.gameStatus !== 'IN_PROGRESS') {
            canInput = false;
        }
        
        updateLetterEvaluations();
    } catch (error) {
        console.error('Error loading game state:', error);
        showToast('Error loading game', 1000);
    }
}

async function saveGameState() {
    try {
        await fetch('/api/game-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState)
        });
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

async function validateWord(word) {
    try {
        const response = await fetch('/api/validate-word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });
        const data = await response.json();
        return data.valid;
    } catch (error) {
        console.error('Error validating word:', error);
        return false;
    }
}

async function submitGuess() {
    if (currentGuess.length !== 5) {
        shakeCurrent();
        showToast('Not enough letters', 1000);
        return;
    }

    if (gameState.gameStatus !== 'IN_PROGRESS' || !canInput) {
        return;
    }

    // Hard mode validation
    if (gameState.hardMode) {
        const hardModeError = validateHardMode(currentGuess);
        if (hardModeError) {
            shakeCurrent();
            showToast(hardModeError, 1000);
            return;
        }
    }

    // Validate word
    const isValid = await validateWord(currentGuess);
    if (!isValid) {
        shakeCurrent();
        showToast('Not in word list', 1000);
        return;
    }

    canInput = false;

    try {
        const response = await fetch('/api/evaluate-guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: currentGuess,
                rowIndex: gameState.rowIndex
            })
        });

        const result = await response.json();
        
        // Update game state
        gameState.boardState[gameState.rowIndex] = currentGuess;
        gameState.evaluations[gameState.rowIndex] = result.evaluation;
        
        const currentRow = gameState.rowIndex;
        gameState.rowIndex = result.rowIndex;
        gameState.gameStatus = result.gameStatus;
        
        if (result.solution) {
            gameState.solution = result.solution;
        }

        // Animate the reveal
        await revealRow(currentRow);
        
        // Update letter evaluations after reveal
        updateLetterEvaluations();
        updateKeyboard();
        
        currentGuess = '';

        // Handle win/loss
        if (result.gameStatus === 'WIN') {
            setTimeout(() => {
                bounceRow(currentRow);
                showToast(getWinMessage(currentRow + 1), 2000);
                setTimeout(() => showStatsModal(), 800);
            }, 500);
        } else if (result.gameStatus === 'FAIL') {
            setTimeout(() => {
                showToast(result.solution.toUpperCase(), Infinity);
                setTimeout(() => showStatsModal(), 2500);
            }, 1500);
        } else {
            canInput = true;
        }

    } catch (error) {
        console.error('Error submitting guess:', error);
        showToast('Error submitting guess', 1000);
        canInput = true;
    }
}

function validateHardMode(guess) {
    // Check all previous guesses for revealed hints
    for (let i = 0; i < gameState.rowIndex; i++) {
        const word = gameState.boardState[i];
        const evaluation = gameState.evaluations[i];
        
        if (!word || !evaluation) continue;
        
        // Check for correct letters (green) - must be in same position
        for (let j = 0; j < 5; j++) {
            if (evaluation[j] === 'correct') {
                if (guess[j] !== word[j]) {
                    return `${j + 1}${getOrdinalSuffix(j + 1)} letter must be ${word[j].toUpperCase()}`;
                }
            }
        }
        
        // Check for present letters (yellow) - must be used somewhere
        for (let j = 0; j < 5; j++) {
            if (evaluation[j] === 'present') {
                if (!guess.includes(word[j])) {
                    return `Guess must contain ${word[j].toUpperCase()}`;
                }
            }
        }
    }
    
    return null;
}

function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}

function getWinMessage(guessCount) {
    const messages = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];
    return messages[guessCount - 1] || 'Phew';
}

function updateLetterEvaluations() {
    letterEvaluations = {};
    
    for (let i = 0; i < gameState.rowIndex; i++) {
        const word = gameState.boardState[i];
        const evaluation = gameState.evaluations[i];
        
        if (!word || !evaluation) continue;
        
        for (let j = 0; j < word.length; j++) {
            const letter = word[j];
            const status = evaluation[j];
            
            const currentStatus = letterEvaluations[letter];
            const priority = { 'correct': 3, 'present': 2, 'absent': 1 };
            
            if (!currentStatus || (priority[status] || 0) > (priority[currentStatus] || 0)) {
                letterEvaluations[letter] = status;
            }
        }
    }
}

// Animations
async function revealRow(rowIndex) {
    const row = document.querySelectorAll('.game-row')[rowIndex];
    const tiles = row.querySelectorAll('.tile');
    
    for (let i = 0; i < tiles.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        const tile = tiles[i];
        const evaluation = gameState.evaluations[rowIndex][i];
        
        tile.classList.add('flip');
        
        await new Promise(resolve => setTimeout(resolve, 125));
        tile.setAttribute('data-state', evaluation);
        
        await new Promise(resolve => setTimeout(resolve, 125));
    }
}

function bounceRow(rowIndex) {
    const row = document.querySelectorAll('.game-row')[rowIndex];
    const tiles = row.querySelectorAll('.tile');
    
    tiles.forEach((tile, i) => {
        setTimeout(() => {
            tile.classList.add('bounce');
        }, i * 50);
    });
}

function shakeCurrent() {
    const row = document.querySelectorAll('.game-row')[gameState.rowIndex];
    row.classList.add('shake');
    setTimeout(() => row.classList.remove('shake'), 300);
}

// Rendering
function renderBoard() {
    const board = document.querySelector('#board');
    if (!board) return;
    
    board.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'game-row';

        // Determine what to show in this row
        let word = '';
        if (i < gameState.rowIndex) {
            // Previous guess
            word = gameState.boardState[i] || '';
        } else if (i === gameState.rowIndex) {
            // Current guess being typed
            word = currentGuess;
        }
        // Otherwise empty row

        const evaluation = gameState.evaluations[i];

        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            
            const letter = word[j] || '';
            if (letter) {
                tile.textContent = letter;
                
                if (evaluation && evaluation[j]) {
                    // Revealed tile
                    tile.setAttribute('data-state', evaluation[j]);
                } else if (i === gameState.rowIndex) {
                    // Current guess (tbd)
                    tile.setAttribute('data-state', 'tbd');
                    tile.classList.add('pop');
                }
            } else {
                tile.setAttribute('data-state', 'empty');
            }

            row.appendChild(tile);
        }

        board.appendChild(row);
    }
}

function updateKeyboard() {
    const keys = document.querySelectorAll('.key[data-key]');
    keys.forEach(key => {
        const letter = key.getAttribute('data-key');
        const evaluation = letterEvaluations[letter];
        
        // Remove old states
        key.removeAttribute('data-state');
        
        if (evaluation) {
            key.setAttribute('data-state', evaluation);
        }
    });
}

function handleKeyPress(key) {
    if (gameState.gameStatus !== 'IN_PROGRESS' || !canInput) {
        return;
    }

    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        currentGuess = currentGuess.slice(0, -1);
        renderBoard();
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        currentGuess += key;
        renderBoard();
    }
}

function setupEventListeners() {
    // Keyboard clicks
    document.addEventListener('click', (e) => {
        const key = e.target.closest('.key');
        if (key) {
            const letter = key.getAttribute('data-key');
            handleKeyPress(letter);
        }
    });

    // Physical keyboard
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) return;
        
        if (e.key === 'Enter') {
            handleKeyPress('ENTER');
        } else if (e.key === 'Backspace') {
            handleKeyPress('BACKSPACE');
        } else if (/^[a-zA-Z]$/.test(e.key)) {
            handleKeyPress(e.key.toUpperCase());
        }
    });

    // Modal buttons
    document.getElementById('help-button')?.addEventListener('click', showHelpModal);
    document.getElementById('stats-button')?.addEventListener('click', showStatsModal);
    document.getElementById('settings-button')?.addEventListener('click', showSettingsModal);
    
    // Modal background click to close
    setupModalClickHandlers();
}

// Modals
async function showHelpModal() {
    const modal = document.getElementById('help-modal');
    modal.classList.add('open');
    
    // Mark tutorial as shown
    const config = await loadConfig();
    if (!config.tutorialShown) {
        config.tutorialShown = true;
        await saveConfig(config);
    }
}

function showStatsModal() {
    loadAndShowStats();
}

async function showSettingsModal() {
    const config = await loadConfig();
    
    const modal = document.getElementById('settings-modal');
    const hardModeCheckbox = modal.querySelector('#hard-mode-toggle');
    const darkModeCheckbox = modal.querySelector('#dark-mode-toggle');
    const notificationsCheckbox = modal.querySelector('#notifications-toggle');
    const appriseUrlInput = modal.querySelector('#apprise-url');
    const reminderTimeInput = modal.querySelector('#reminder-time');
    const notificationDetails = modal.querySelector('#notification-details');
    
    // Set current state from both game state and config
    hardModeCheckbox.checked = gameState.hardMode || config.hardMode;
    darkModeCheckbox.checked = config.darkMode;
    notificationsCheckbox.checked = config.notificationsEnabled;
    appriseUrlInput.value = config.appriseUrl || '';
    reminderTimeInput.value = config.reminderTime || '20:00';
    
    // Show/hide notification details
    if (config.notificationsEnabled) {
        notificationDetails.style.display = 'block';
    } else {
        notificationDetails.style.display = 'none';
    }
    
    // Disable hard mode if game in progress and not at start
    if (gameState.gameStatus === 'IN_PROGRESS' && gameState.rowIndex > 0) {
        hardModeCheckbox.disabled = true;
    } else {
        hardModeCheckbox.disabled = false;
    }
    
    // Check if stats already imported from config
    if (config.statsImported) {
        const importDetails = modal.querySelector('#import-details');
        const completeSection = modal.querySelector('#import-complete');
        const toggleBtn = modal.querySelector('#toggle-import-btn');
        if (importDetails) importDetails.style.display = 'none';
        if (completeSection) completeSection.style.display = 'block';
        if (toggleBtn) toggleBtn.style.display = 'none';
    }
    
    modal.classList.add('open');
}

async function loadAndShowStats() {
    try {
        const response = await fetch('/api/statistics');
        const stats = await response.json();

        const modal = document.getElementById('stats-modal');
        
        // Update stats display
        modal.querySelector('#stat-played').textContent = stats.gamesPlayed;
        modal.querySelector('#stat-win-pct').textContent = stats.winPercentage;
        modal.querySelector('#stat-streak').textContent = stats.currentStreak;
        modal.querySelector('#stat-max-streak').textContent = stats.maxStreak;

        // Update guess distribution
        const distributionDiv = modal.querySelector('#guess-distribution');
        distributionDiv.innerHTML = '';
        
        const maxGuesses = Math.max(...Object.values(stats.guesses), 1);
        
        for (let i = 1; i <= 6; i++) {
            const count = stats.guesses[i.toString()] || 0;
            const percentage = Math.max((count / maxGuesses) * 100, 7);
            
            const barDiv = document.createElement('div');
            barDiv.className = 'graph-row';
            
            const shouldHighlight = gameState.gameStatus !== 'IN_PROGRESS' && 
                                   gameState.gameStatus === 'WIN' && 
                                   gameState.rowIndex === i;
            
            barDiv.innerHTML = `
                <div class="guess-number">${i}</div>
                <div class="guess-bar ${shouldHighlight ? 'highlight' : ''}" style="width: ${percentage}%">
                    <div class="num-guesses">${count}</div>
                </div>
            `;
            
            distributionDiv.appendChild(barDiv);
        }

        // Show/hide share container based on game completion
        const shareContainer = modal.querySelector('.share-container');
        if (gameState.gameStatus !== 'IN_PROGRESS') {
            shareContainer.style.display = 'flex';
            // Start countdown timer
            startCountdownTimer();
        } else {
            shareContainer.style.display = 'none';
        }

        modal.classList.add('open');
    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('Error loading statistics', 1000);
    }
}

function startCountdownTimer() {
    const timerElement = document.getElementById('countdown-timer');
    if (!timerElement) return;

    async function updateCountdown() {
        try {
            // Get server's timezone-aware midnight
            const response = await fetch('/api/next-reset');
            const data = await response.json();
            
            const now = new Date();
            const nextReset = new Date(data.nextReset);
            
            const diff = nextReset - now;
            
            if (diff <= 0) {
                timerElement.textContent = '0:00:00';
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            timerElement.textContent = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } catch (error) {
            console.error('Error updating countdown:', error);
        }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    // Clear interval when modal is closed
    const modal = document.getElementById('stats-modal');
    const observer = new MutationObserver(() => {
        if (!modal.classList.contains('open')) {
            clearInterval(interval);
            observer.disconnect();
        }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('closing');
    setTimeout(() => {
        modal.classList.remove('open', 'closing');
    }, 200);
}

function setupModalClickHandlers() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Settings functions
async function toggleHardMode(enabled) {
    gameState.hardMode = enabled;
    await saveGameState();
    
    // Save to config as well
    const config = await loadConfig();
    config.hardMode = enabled;
    await saveConfig(config);
}

async function toggleDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Save to config
    const config = await loadConfig();
    config.darkMode = enabled;
    await saveConfig(config);
}

async function toggleNotifications(enabled) {
    const config = await loadConfig();
    config.notificationsEnabled = enabled;
    await saveConfig(config);
    
    // Show/hide notification details
    const notificationDetails = document.getElementById('notification-details');
    if (enabled) {
        notificationDetails.style.display = 'block';
    } else {
        notificationDetails.style.display = 'none';
    }
}

async function updateAppriseUrl(url) {
    const config = await loadConfig();
    config.appriseUrl = url;
    await saveConfig(config);
}

async function updateReminderTime(time) {
    const config = await loadConfig();
    config.reminderTime = time;
    await saveConfig(config);
}

async function testNotification() {
    const appriseUrl = document.getElementById('apprise-url').value;
    
    if (!appriseUrl) {
        showToast('Please enter an Apprise URL first', 2000);
        return;
    }
    
    try {
        const response = await fetch('/api/test-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appriseUrl })
        });
        
        if (response.ok) {
            showToast('Test notification sent!', 2000);
        } else {
            const data = await response.json();
            showToast(data.detail || 'Failed to send notification', 2000);
        }
    } catch (error) {
        console.error('Error testing notification:', error);
        showToast('Error sending notification', 2000);
    }
}

async function saveImportedStats() {
    const played = parseInt(document.getElementById('import-played').value) || 0;
    const streak = parseInt(document.getElementById('import-streak').value) || 0;
    const maxStreak = parseInt(document.getElementById('import-max-streak').value) || 0;
    
    const guesses = {};
    for (let i = 1; i <= 6; i++) {
        guesses[i.toString()] = parseInt(document.getElementById(`import-guess-${i}`).value) || 0;
    }

    try {
        const response = await fetch('/api/import-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gamesPlayed: played,
                currentStreak: streak,
                maxStreak: maxStreak,
                guesses: guesses
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            showToast('Stats imported successfully!', 2000);
            
            document.getElementById('import-details').style.display = 'none';
            document.getElementById('import-complete').style.display = 'block';
            document.getElementById('toggle-import-btn').style.display = 'none';
            
            // Mark as imported in config
            const config = await loadConfig();
            config.statsImported = true;
            await saveConfig(config);
        } else {
            showToast('Error importing stats', 1000);
        }
    } catch (error) {
        console.error('Error importing stats:', error);
        showToast('Error importing stats', 1000);
    }
}

function toggleImportSection() {
    const section = document.getElementById('import-details');
    const button = document.getElementById('toggle-import-btn');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        button.textContent = '▼ Hide Import';
    } else {
        section.style.display = 'none';
        button.textContent = '▶ Show Import';
    }
}

// Share functionality
async function shareResults() {
    const guessCount = gameState.gameStatus === 'WIN' ? gameState.rowIndex : 'X';
    const hardModeStr = gameState.hardMode ? '*' : '';
    
    let text = `Wordull ${guessCount}/6${hardModeStr}\n\n`;

    for (let i = 0; i < gameState.rowIndex; i++) {
        const evaluation = gameState.evaluations[i];
        if (!evaluation) continue;

        evaluation.forEach(status => {
            if (status === 'correct') text += '🟩';
            else if (status === 'present') text += '🟨';
            else text += '⬛';
        });
        text += '\n';
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showToast('Copied results to clipboard', 2000);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast('Copied results to clipboard', 2000);
            } catch (err) {
                showToast('Failed to copy', 1000);
            }
            document.body.removeChild(textArea);
        }
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showToast('Failed to copy', 1000);
    }
}

// Toast notifications
function showToast(message, duration = 2000) {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    if (duration !== Infinity) {
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initGame);