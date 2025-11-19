// Create the main game structure
class GameApp extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <header>
                <div class="header-left">
                    <button class="icon" id="help-button" aria-label="help">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                            <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                        </svg>
                    </button>
                </div>
                <div class="title">WORDULL</div>
                <div class="header-right">
                    <button class="icon" id="stats-button" aria-label="statistics">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                            <path d="M16,11V3H8v6H2v12h20V11H16z M10,5h4v14h-4V5z M4,11h4v8H4V11z M20,19h-4v-6h4V19z"/>
                        </svg>
                    </button>
                    <button class="icon" id="settings-button" aria-label="settings">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                        </svg>
                    </button>
                </div>
            </header>
            
            <div id="board-container">
                <div id="board"></div>
            </div>
            
            <div id="keyboard">
                <div class="keyboard-row">
                    <button class="key" data-key="Q">Q</button>
                    <button class="key" data-key="W">W</button>
                    <button class="key" data-key="E">E</button>
                    <button class="key" data-key="R">R</button>
                    <button class="key" data-key="T">T</button>
                    <button class="key" data-key="Y">Y</button>
                    <button class="key" data-key="U">U</button>
                    <button class="key" data-key="I">I</button>
                    <button class="key" data-key="O">O</button>
                    <button class="key" data-key="P">P</button>
                </div>
                <div class="keyboard-row">
                    <div style="flex: 0.5"></div>
                    <button class="key" data-key="A">A</button>
                    <button class="key" data-key="S">S</button>
                    <button class="key" data-key="D">D</button>
                    <button class="key" data-key="F">F</button>
                    <button class="key" data-key="G">G</button>
                    <button class="key" data-key="H">H</button>
                    <button class="key" data-key="J">J</button>
                    <button class="key" data-key="K">K</button>
                    <button class="key" data-key="L">L</button>
                    <div style="flex: 0.5"></div>
                </div>
                <div class="keyboard-row">
                    <button class="key wide" data-key="ENTER">ENTER</button>
                    <button class="key" data-key="Z">Z</button>
                    <button class="key" data-key="X">X</button>
                    <button class="key" data-key="C">C</button>
                    <button class="key" data-key="V">V</button>
                    <button class="key" data-key="B">B</button>
                    <button class="key" data-key="N">N</button>
                    <button class="key" data-key="M">M</button>
                    <button class="key wide" data-key="BACKSPACE">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                            <path fill="var(--color-tone-1)" d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            ${this.getHelpModal()}
            ${this.getStatsModal()}
            ${this.getSettingsModal()}
            
            <div id="toast-container"></div>
        `;
    }
    
    getHelpModal() {
        return `
            <div id="help-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1>HOW TO PLAY</h1>
                        <div class="close-icon" onclick="closeModal('help-modal')">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="help-content">
                        <p>Guess the <strong>WORDULL</strong> in 6 tries.</p>
                        <p>Each guess must be a valid 5-letter word. Hit the enter button to submit.</p>
                        <p>After each guess, the color of the tiles will change to show how close your guess was to the word.</p>
                        
                        <hr style="border: 1px solid var(--color-tone-4); margin: 16px 0;">
                        
                        <p><strong>Examples</strong></p>
                        
                        <div class="help-example">
                            <div class="game-row">
                                <div class="tile" data-state="correct">W</div>
                                <div class="tile" data-state="empty">E</div>
                                <div class="tile" data-state="empty">A</div>
                                <div class="tile" data-state="empty">R</div>
                                <div class="tile" data-state="empty">Y</div>
                            </div>
                            <p>The letter <strong>W</strong> is in the word and in the correct spot.</p>
                        </div>
                        
                        <div class="help-example">
                            <div class="game-row">
                                <div class="tile" data-state="empty">P</div>
                                <div class="tile" data-state="present">I</div>
                                <div class="tile" data-state="empty">L</div>
                                <div class="tile" data-state="empty">L</div>
                                <div class="tile" data-state="empty">S</div>
                            </div>
                            <p>The letter <strong>I</strong> is in the word but in the wrong spot.</p>
                        </div>
                        
                        <div class="help-example">
                            <div class="game-row">
                                <div class="tile" data-state="empty">V</div>
                                <div class="tile" data-state="empty">A</div>
                                <div class="tile" data-state="empty">G</div>
                                <div class="tile" data-state="absent">U</div>
                                <div class="tile" data-state="empty">E</div>
                            </div>
                            <p>The letter <strong>U</strong> is not in the word in any spot.</p>
                        </div>
                        
                        <hr style="border: 1px solid var(--color-tone-4); margin: 16px 0;">
                        
                        <p><strong>A new WORDULL will be available each day!</strong></p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getStatsModal() {
        return `
            <div id="stats-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1>STATISTICS</h1>
                        <div class="close-icon" onclick="closeModal('stats-modal')">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </div>
                    </div>
                    
                    <div class="statistics-container">
                        <div class="stat">
                            <div class="stat-value" id="stat-played">0</div>
                            <div class="stat-label">Played</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="stat-win-pct">0</div>
                            <div class="stat-label">Win %</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="stat-streak">0</div>
                            <div class="stat-label">Current<br>Streak</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="stat-max-streak">0</div>
                            <div class="stat-label">Max<br>Streak</div>
                        </div>
                    </div>
                    
                    <div class="guess-distribution-title">GUESS DISTRIBUTION</div>
                    <div id="guess-distribution"></div>
                    
                    <div class="share-container">
                        <div class="countdown-container">
                            <div class="countdown-label">Next Wordull</div>
                            <div class="countdown-timer" id="countdown-timer">--:--:--</div>
                        </div>
                        <button class="share-button" onclick="shareResults()">
                            Share
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getSettingsModal() {
        return `
            <div id="settings-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1>SETTINGS</h1>
                        <div class="close-icon" onclick="closeModal('settings-modal')">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </div>
                    </div>
                    
                    <div class="setting">
                        <div class="setting-text">
                            <div class="setting-title">Hard Mode</div>
                            <div class="setting-description">Any revealed hints must be used in subsequent guesses</div>
                        </div>
                        <div class="setting-control">
                            <input type="checkbox" id="hard-mode-toggle" onchange="toggleHardMode(this.checked)">
                            <label for="hard-mode-toggle" class="switch">
                                <span class="switch-knob"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting">
                        <div class="setting-text">
                            <div class="setting-title">Dark Theme</div>
                        </div>
                        <div class="setting-control">
                            <input type="checkbox" id="dark-mode-toggle" onchange="toggleDarkMode(this.checked)">
                            <label for="dark-mode-toggle" class="switch">
                                <span class="switch-knob"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting notification-setting">
                        <div class="setting-text">
                            <div class="setting-title">Daily Reminders</div>
                            <div class="setting-description">Get notified if you haven't completed the puzzle</div>
                        </div>
                        <div class="setting-control">
                            <input type="checkbox" id="notifications-toggle" onchange="toggleNotifications(this.checked)">
                            <label for="notifications-toggle" class="switch">
                                <span class="switch-knob"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="notification-details" id="notification-details">
                        <div class="notification-row">
                            <label for="apprise-url">Apprise URL</label>
                            <input type="text" id="apprise-url" placeholder="mailto://user:pass@gmail.com" onchange="updateAppriseUrl(this.value)">
                        </div>
                        <div class="notification-row">
                            <label for="reminder-time">Reminder Time</label>
                            <div style="display: flex; gap: 8px; flex: 1;">
                                <input type="time" id="reminder-time" onchange="updateReminderTime(this.value)">
                                <button class="test-notification-btn" onclick="testNotification()">Test</button>
                            </div>
                        </div>
                        <div class="notification-help">
                            <details>
                                <summary>Apprise URL Examples</summary>
                                <ul>
                                    <li><code>mailto://user:pass@gmail.com</code></li>
                                    <li><code>gotify://hostname/token</code></li>
                                    <li><code>discord://webhook_id/webhook_token</code></li>
                                    <li><code>slack://tokenA/tokenB/tokenC</code></li>
                                    <li><a href="https://github.com/caronc/apprise#supported-notifications" target="_blank" rel="noopener">View all supported services →</a></li>
                                </ul>
                            </details>
                        </div>
                    </div>
                    
                    <div class="import-section">
                        <button class="import-toggle" id="toggle-import-btn" onclick="toggleImportSection()">
                            ▶ Import Existing Stats
                        </button>
                        
                        <div id="import-details" class="import-details">
                            <p style="font-size: 12px; color: var(--color-tone-2); margin: 8px 0;">
                                Enter your existing Wordle statistics to import them. This can only be done once.
                            </p>
                            
                            <div class="import-grid">
                                <div class="import-field">
                                    <label>Games Played</label>
                                    <input type="number" id="import-played" min="0" value="0">
                                </div>
                                <div class="import-field">
                                    <label>Current Streak</label>
                                    <input type="number" id="import-streak" min="0" value="0">
                                </div>
                                <div class="import-field">
                                    <label>Max Streak</label>
                                    <input type="number" id="import-max-streak" min="0" value="0">
                                </div>
                            </div>
                            
                            <p style="font-size: 14px; font-weight: bold; margin: 16px 0 8px;">Guess Distribution</p>
                            <p style="font-size: 12px; color: var(--color-tone-2); margin: 0 0 8px;">Enter how many games you won in each number of guesses. Failed games will be calculated automatically.</p>
                            <div class="import-grid">
                                <div class="import-field">
                                    <label>1 Guess</label>
                                    <input type="number" id="import-guess-1" min="0" value="0">
                                </div>
                                <div class="import-field">
                                    <label>2 Guesses</label>
                                    <input type="number" id="import-guess-2" min="0" value="0">
                                </div>
                                <div class="import-field">
                                    <label>3 Guesses</label>
                                    <input type="number" id="import-guess-3" min="0" value="0">
                                </div>
                                <div class="import-field">
                                    <label>4 Guesses</label>
                                    <input type="number" id="import-guess-4" min="0" value="0">
                                </div>
                                <div class="import-field">
                                    <label>5 Guesses</label>
                                    <input type="number" id="import-guess-5" min="0" value="0">
                                </div>
                                <div class="import-field">
                                    <label>6 Guesses</label>
                                    <input type="number" id="import-guess-6" min="0" value="0">
                                </div>
                            </div>
                            
                            <button class="save-button" onclick="saveImportedStats()">Save Imported Stats</button>
                        </div>
                        
                        <div id="import-complete">
                            ✓ Stats have been imported
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('game-app', GameApp);