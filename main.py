from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta, time
import httpx
import json
import os
from pathlib import Path
from typing import Optional
import pytz
import apprise
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

app = FastAPI()

# Data storage
DATA_DIR = Path("/data")
DATA_DIR.mkdir(exist_ok=True)
STATS_FILE = DATA_DIR / "stats.json"
GAME_STATE_FILE = DATA_DIR / "game_state.json"
CONFIG_FILE = DATA_DIR / "config.json"

# Word lists (from original Wordle)
VALID_WORDS_FILE = Path("static/words.json")

# Load word lists
def load_word_lists():
    if VALID_WORDS_FILE.exists():
        with open(VALID_WORDS_FILE, 'r') as f:
            data = json.load(f)
            return set(word.upper() for word in data.get('valid', []))
    return set()

VALID_WORDS = load_word_lists()

# Models
class Stats(BaseModel):
    currentStreak: int = 0
    maxStreak: int = 0
    guesses: dict = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "fail": 0}
    winPercentage: int = 0
    gamesPlayed: int = 0
    gamesWon: int = 0
    averageGuesses: int = 0

class GameState(BaseModel):
    boardState: list
    evaluations: list
    rowIndex: int
    solution: str
    gameStatus: str
    lastPlayedTs: Optional[int] = None
    lastCompletedTs: Optional[int] = None
    hardMode: bool = False
    date: str

class Config(BaseModel):
    darkMode: bool = False
    hardMode: bool = False
    statsImported: bool = False
    tutorialShown: bool = False
    notificationsEnabled: bool = False
    appriseUrl: str = ""
    reminderTime: str = "20:00"  # Default 8 PM

class ImportStats(BaseModel):
    gamesPlayed: int
    winPercentage: int
    currentStreak: int
    maxStreak: int
    guesses: dict

class ValidateWord(BaseModel):
    word: str

class TestNotification(BaseModel):
    appriseUrl: str

# Helper functions
def load_stats() -> Stats:
    if STATS_FILE.exists():
        with open(STATS_FILE, 'r') as f:
            return Stats(**json.load(f))
    return Stats()

def save_stats(stats: Stats):
    with open(STATS_FILE, 'w') as f:
        json.dump(stats.dict(), f, indent=2)

def load_game_state() -> Optional[GameState]:
    if GAME_STATE_FILE.exists():
        with open(GAME_STATE_FILE, 'r') as f:
            return GameState(**json.load(f))
    return None

def save_game_state(state: GameState):
    with open(GAME_STATE_FILE, 'w') as f:
        json.dump(state.dict(), f, indent=2)

def load_config() -> Config:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r') as f:
            return Config(**json.load(f))
    return Config()

def save_config(config: Config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config.dict(), f, indent=2)

async def fetch_word_of_day(date: str) -> str:
    """Fetch word of the day from NYTimes API"""
    url = f"https://www.nytimes.com/svc/wordle/v2/{date}.json"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return data.get('solution', '').upper()
        except Exception as e:
            print(f"Error fetching word: {e}")
            raise HTTPException(status_code=500, detail="Could not fetch word of the day")

def get_today_date() -> str:
    """Get today's date in YYYY-MM-DD format using container's timezone"""
    tz_name = os.getenv('TZ', 'UTC')
    try:
        tz = pytz.timezone(tz_name)
    except:
        tz = pytz.UTC
    
    now = datetime.now(tz)
    return now.strftime('%Y-%m-%d')

# Notification functions
def send_notification(apprise_url: str, title: str, body: str) -> bool:
    """Send a notification using Apprise"""
    try:
        apobj = apprise.Apprise()
        apobj.add(apprise_url)
        return apobj.notify(title=title, body=body)
    except Exception as e:
        print(f"Error sending notification: {e}")
        return False

def check_and_send_reminder():
    """Check if today's puzzle is incomplete and send reminder"""
    try:
        config = load_config()
        
        if not config.notificationsEnabled or not config.appriseUrl:
            return
        
        state = load_game_state()
        today = get_today_date()
        
        # Check if puzzle for today exists and is incomplete
        if state and state.date == today and state.gameStatus == 'IN_PROGRESS':
            title = "Wordull Reminder"
            body = f"Don't forget to complete today's Wordull puzzle! You have {6 - state.rowIndex} guesses remaining."
            send_notification(config.appriseUrl, title, body)
            print(f"Sent reminder notification at {datetime.now()}")
    except Exception as e:
        print(f"Error in check_and_send_reminder: {e}")

# Scheduler setup
scheduler = BackgroundScheduler()

def setup_reminder_schedule():
    """Setup the scheduled reminder based on config"""
    try:
        config = load_config()
        
        # Remove existing jobs
        for job in scheduler.get_jobs():
            if job.id == 'wordull_reminder':
                job.remove()
        
        if config.notificationsEnabled and config.appriseUrl and config.reminderTime:
            # Parse time (format: "HH:MM")
            hour, minute = map(int, config.reminderTime.split(':'))
            
            # Get timezone
            tz_name = os.getenv('TZ', 'UTC')
            try:
                tz = pytz.timezone(tz_name)
            except:
                tz = pytz.UTC
            
            # Schedule job
            trigger = CronTrigger(hour=hour, minute=minute, timezone=tz)
            scheduler.add_job(
                check_and_send_reminder,
                trigger=trigger,
                id='wordull_reminder',
                replace_existing=True
            )
            print(f"Scheduled reminder for {config.reminderTime} ({tz_name})")
    except Exception as e:
        print(f"Error setting up reminder schedule: {e}")

@app.on_event("startup")
async def startup_event():
    """Start the scheduler on app startup"""
    scheduler.start()
    setup_reminder_schedule()

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown the scheduler"""
    scheduler.shutdown()

# API Routes
@app.get("/api/word-of-day")
async def get_word_of_day():
    """Get the current word of the day"""
    today = get_today_date()
    word = await fetch_word_of_day(today)
    return {"date": today, "solution": word}

@app.get("/api/game-state")
async def get_game_state():
    """Get current game state"""
    today = get_today_date()
    state = load_game_state()
    config = load_config()
    stats = load_stats()
    
    # Check if we need to reset streak due to missed day
    if state and state.date != today:
        yesterday_date = (datetime.strptime(today, '%Y-%m-%d') - timedelta(days=1)).strftime('%Y-%m-%d')
        
        if state.gameStatus == 'IN_PROGRESS':
            if stats.currentStreak > 0:
                stats.currentStreak = 0
                save_stats(stats)
        elif state.date < yesterday_date:
            if stats.currentStreak > 0:
                stats.currentStreak = 0
                save_stats(stats)
    
    # If no state or date changed, create new game
    if not state or state.date != today:
        word = await fetch_word_of_day(today)
        state = GameState(
            boardState=[""] * 6,
            evaluations=[None] * 6,
            rowIndex=0,
            solution=word,
            gameStatus="IN_PROGRESS",
            date=today,
            hardMode=config.hardMode if config else False,
            lastCompletedTs=state.lastCompletedTs if state else None
        )
        save_game_state(state)
    
    # Don't send solution to client
    state_dict = state.dict()
    state_dict.pop('solution')
    return state_dict

@app.post("/api/game-state")
async def update_game_state(state: GameState):
    """Update game state"""
    today = get_today_date()
    state.date = today
    save_game_state(state)
    return {"success": True}

@app.get("/api/config")
async def get_config():
    """Get user configuration"""
    config = load_config()
    return config.dict()

@app.post("/api/config")
async def update_config(config: Config):
    """Update user configuration"""
    save_config(config)
    # Reschedule reminders if notification settings changed
    setup_reminder_schedule()
    return {"success": True}

@app.post("/api/validate-word")
async def validate_word(data: ValidateWord):
    """Validate if a word is in the valid word list"""
    word = data.word.upper()
    
    if VALID_WORDS:
        is_valid = word in VALID_WORDS
    else:
        is_valid = len(word) == 5 and word.isalpha()
    
    return {"valid": is_valid}

@app.post("/api/evaluate-guess")
async def evaluate_guess(guess: dict):
    """Evaluate a guess and return results"""
    guess_word = guess.get('word', '').upper()
    row_index = guess.get('rowIndex', 0)
    
    state = load_game_state()
    if not state:
        raise HTTPException(status_code=400, detail="No active game")
    
    if state.gameStatus != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Game already complete")
    
    solution = state.solution
    
    # Evaluate the guess
    evaluation = ['absent'] * 5
    solution_chars = list(solution)
    guess_chars = list(guess_word)
    
    # First pass: mark correct positions
    for i in range(5):
        if guess_chars[i] == solution_chars[i]:
            evaluation[i] = 'correct'
            solution_chars[i] = None
            guess_chars[i] = None
    
    # Second pass: mark present letters
    for i in range(5):
        if guess_chars[i] and guess_chars[i] in solution_chars:
            evaluation[i] = 'present'
            solution_chars[solution_chars.index(guess_chars[i])] = None
    
    # Update state
    state.boardState[row_index] = guess_word
    state.evaluations[row_index] = evaluation
    state.rowIndex = row_index + 1
    
    # Check win/loss
    is_win = all(e == 'correct' for e in evaluation)
    is_loss = row_index >= 5 and not is_win
    
    if is_win:
        state.gameStatus = "WIN"
        update_stats_on_completion(True, row_index + 1, state.lastCompletedTs)
        state.lastCompletedTs = int(datetime.now().timestamp() * 1000)
    elif is_loss:
        state.gameStatus = "FAIL"
        update_stats_on_completion(False, 0, state.lastCompletedTs)
        state.lastCompletedTs = int(datetime.now().timestamp() * 1000)
    
    save_game_state(state)
    
    return {
        "evaluation": evaluation,
        "gameStatus": state.gameStatus,
        "rowIndex": state.rowIndex,
        "solution": solution if (is_win or is_loss) else None
    }

def update_stats_on_completion(is_win: bool, num_guesses: int, last_completed_ts: Optional[int]):
    """Update statistics after game completion"""
    stats = load_stats()
    
    stats.gamesPlayed += 1
    
    if is_win:
        if last_completed_ts:
            last_date = datetime.fromtimestamp(last_completed_ts / 1000).date()
            today = datetime.now().date()
            days_diff = (today - last_date).days
            
            if days_diff == 1:
                stats.currentStreak += 1
            elif days_diff == 0:
                pass
            else:
                stats.currentStreak = 1
        else:
            stats.currentStreak += 1
        
        stats.guesses[str(num_guesses)] = stats.guesses.get(str(num_guesses), 0) + 1
        stats.gamesWon += 1
        stats.maxStreak = max(stats.currentStreak, stats.maxStreak)
    else:
        stats.currentStreak = 0
        stats.guesses["fail"] = stats.guesses.get("fail", 0) + 1
    
    stats.winPercentage = round(stats.gamesWon / stats.gamesPlayed * 100) if stats.gamesPlayed > 0 else 0
    
    total_guesses = sum(int(k) * v for k, v in stats.guesses.items() if k != "fail")
    stats.averageGuesses = round(total_guesses / stats.gamesWon) if stats.gamesWon > 0 else 0
    
    save_stats(stats)

@app.get("/api/statistics")
async def get_statistics():
    """Get user statistics"""
    stats = load_stats()
    return stats.dict()

@app.post("/api/import-stats")
async def import_statistics(import_data: ImportStats):
    """Import existing Wordle statistics"""
    total_wins = sum(import_data.guesses.get(str(i), 0) for i in range(1, 7))
    
    stats = Stats(
        gamesPlayed=import_data.gamesPlayed,
        gamesWon=total_wins,
        winPercentage=import_data.winPercentage,
        currentStreak=import_data.currentStreak,
        maxStreak=import_data.maxStreak,
        guesses=import_data.guesses,
        averageGuesses=0
    )
    
    if stats.gamesWon > 0:
        total_guesses = sum(int(k) * v for k, v in stats.guesses.items() if k != "fail")
        stats.averageGuesses = round(total_guesses / stats.gamesWon)
    
    save_stats(stats)
    
    config = load_config()
    config.statsImported = True
    save_config(config)
    
    return {"success": True, "message": "Statistics imported successfully"}

@app.post("/api/test-notification")
async def test_notification(data: TestNotification):
    """Test sending a notification"""
    if not data.appriseUrl:
        raise HTTPException(status_code=400, detail="Apprise URL is required")
    
    success = send_notification(
        data.appriseUrl,
        "Wordull Test",
        "This is a test notification from Wordull. If you received this, your notifications are working!"
    )
    
    if success:
        return {"success": True, "message": "Test notification sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send notification")

@app.get("/api/next-reset")
async def get_next_reset():
    """Get the timestamp for the next puzzle reset (midnight in container timezone)"""
    tz_name = os.getenv('TZ', 'UTC')
    try:
        tz = pytz.timezone(tz_name)
    except:
        tz = pytz.UTC
    
    now = datetime.now(tz)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    return {"nextReset": tomorrow.isoformat()}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "date": get_today_date()}

# Serve static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")