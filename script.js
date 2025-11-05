// --- Глобальні змінні ---
let allWordsByCategory = {}; 
let availableWords = []; 
let isSoundEnabled = true; 
const SOUND_STORAGE_KEY = 'itAliasSound'; 
let sounds = {}; 
let gameState = {
  team1Score: 0,
  team2Score: 0,
  team1Name: "Команда 1",
  team2Name: "Команда 2",
  currentTeam: 1, 
  roundTime: 60,
  totalRounds: 3,
  currentRound: 0,
  isGameInProgress: false,
  lastRoundScore: 0,
  selectedCategory: 'mixed',
  isRoundActive: false 
};
let roundScore = 0;
let timeLeft = 0;
let timerInterval;

// --- Знаходимо елементи на HTML-сторінці ---
const screens = document.querySelectorAll('.screen');
const mainMenuScreen = document.getElementById('main-menu-screen'); 
const settingsScreen = document.getElementById('settings-screen'); 
const rulesScreen = document.getElementById('rules-screen');     
const gameScreen = document.getElementById('game-screen');
const turnEndScreen = document.getElementById('turn-end-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen'); 
const scoreboard = document.getElementById('scoreboard');
const team1NameDisplay = document.getElementById('team1-name');
const team1ScoreDisplay = document.getElementById('team1-score');
const team2NameDisplay = document.getElementById('team2-name');
const team2ScoreDisplay = document.getElementById('team2-score');
const team1Input = document.getElementById('team1-input');
const team2Input = document.getElementById('team2-input');
const timeSlider = document.getElementById('time-slider');
const timeOutput = document.getElementById('time-output');
const roundsSlider = document.getElementById('rounds-slider');
const roundsOutput = document.getElementById('rounds-output');
const categorySelect = document.getElementById('category-select'); 
const continueBtn = document.getElementById('continue-btn'); 
const newGameMenuBtn = document.getElementById('new-game-menu-btn'); 
const rulesBtn = document.getElementById('rules-btn');             
const startBtn = document.getElementById('start-btn'); 
const skipBtn = document.getElementById('skip-btn');
const correctBtn = document.getElementById('correct-btn');
const nextTurnBtn = document.getElementById('next-turn-btn');
const resetGameBtn = document.getElementById('reset-game-btn'); 
const newGameBtn = document.getElementById('new-game-btn'); 
const backButtons = document.querySelectorAll('.btn-primary[data-target], .btn-tertiary[data-target]');
const pauseBtn = document.getElementById('pause-btn');       
const resumeBtn = document.getElementById('resume-btn');     
const quitToMenuBtn = document.getElementById('quit-to-menu-btn'); 
const soundToggleBtn = document.getElementById('sound-toggle-btn'); 
const timerDisplay = document.getElementById('timer');
const roundCounterDisplay = document.getElementById('round-counter'); 
const wordDisplay = document.getElementById('word-display');
const turnEndTitle = document.getElementById('turn-end-title'); 
const roundSummaryDisplay = document.getElementById('round-summary');
const nextTeamNameDisplay = document.getElementById('next-team-name');
const winnerMessageDisplay = document.getElementById('winner-message'); 
const finalScoreSummaryDisplay = document.getElementById('final-score-summary');

// --- Прив'язуємо функції до кнопок ---
newGameMenuBtn.addEventListener('click', () => {
  const savedData = localStorage.getItem(GAME_STORAGE_KEY);
  if (savedData) {
    if (confirm("Ви впевнені, що хочете почати нову гру? Весь збережений прогрес буде втрачено.")) {
      performReset(); 
      showScreen(settingsScreen); 
    }
  } else {
    performReset(); 
    showScreen(settingsScreen);
  }
});
rulesBtn.addEventListener('click', () => showScreen(rulesScreen));
startBtn.addEventListener('click', setupNewGame);
continueBtn.addEventListener('click', continueGame); 
correctBtn.addEventListener('click', handleCorrect);
skipBtn.addEventListener('click', handleSkip);
nextTurnBtn.addEventListener('click', startRound);
resetGameBtn.addEventListener('click', quitGame); 
newGameBtn.addEventListener('click', () => {
    performReset(); 
    showScreen(mainMenuScreen); 
}); 
backButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    const targetScreenId = e.target.getAttribute('data-target');
    const targetScreen = document.getElementById(targetScreenId);
    if (targetScreen) {
      showScreen(targetScreen);
    }
  });
});
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
quitToMenuBtn.addEventListener('click', quitGame); 
soundToggleBtn.addEventListener('click', toggleSound); 
timeSlider.oninput = function() { timeOutput.value = this.value; }
roundsSlider.oninput = function() { roundsOutput.value = this.value; }

// --- Робота зі сховищем (localStorage) ---
const GAME_STORAGE_KEY = 'itAliasSavedGame'; 
function saveGameState() { localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(gameState)); }
function loadGameState() {
  const savedData = localStorage.getItem(GAME_STORAGE_KEY);
  if (savedData) {
    gameState = JSON.parse(savedData);
    return true; 
  }
  return false; 
}
function clearGameState() { localStorage.removeItem(GAME_STORAGE_KEY); }

// --- Логіка Звуку ---
function loadSounds() {
  try {
    sounds.correct = new Audio('sounds/correct.mp3');
    sounds.skip = new Audio('sounds/skip.mp3');
    sounds.timesUp = new Audio('sounds/times-up.mp3');
    sounds.tick = new Audio('sounds/tick.mp3');
    console.log("Звуки завантажено.");
  } catch (e) {
    console.error("Помилка завантаження звуків. Перевірте папку 'sounds'.", e);
    isSoundEnabled = false; 
  }
}
function playSound(sound) {
  if (isSoundEnabled && sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.warn("Помилка програвання звуку:", e));
  }
}
function stopSound(sound) {
  if (sound) {
    sound.pause();
    sound.currentTime = 0;
  }
}
function updateSoundIcon() {
  if (isSoundEnabled) {
    soundToggleBtn.textContent = 'Звук: Увімк. 🔊';
  } else {
    soundToggleBtn.textContent = 'Звук: Вимк. 🔇';
  }
}
function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  localStorage.setItem(SOUND_STORAGE_KEY, isSoundEnabled);
  updateSoundIcon();
  if (gameState.isRoundActive) {
    if (isSoundEnabled && timeLeft <= 5 && timeLeft > 0) {
      playSound(sounds.tick);
    } else {
      stopSound(sounds.tick);
    }
  }
}
function loadSoundPreference() {
  const savedSoundSetting = localStorage.getItem(SOUND_STORAGE_KEY);
  if (savedSoundSetting !== null) {
    isSoundEnabled = (savedSoundSetting === 'true');
  }
  updateSoundIcon();
}

// --- Ініціалізація гри (Запуск) ---
async function initializeApp() {
  loadSoundPreference();
  loadSounds();
  newGameMenuBtn.disabled = true;
  continueBtn.disabled = true;
  try {
    const response = await fetch('./words.json');
    if (!response.ok) throw new Error('Не вдалося завантажити слова.');
    allWordsByCategory = await response.json(); 
    newGameMenuBtn.disabled = false;
    console.log(`Завантажено ${Object.keys(allWordsByCategory).length} категорій слів.`);
  } catch (error) {
    console.error(error);
    const h1 = mainMenuScreen.querySelector('h1');
    if (h1) {
      h1.textContent = "Помилка завантаження слів. Спробуйте оновити.";
      h1.style.color = 'red';
    }
    return;
  }
  if (loadGameState() && gameState.isGameInProgress) {
    continueBtn.style.display = 'block';
    continueBtn.disabled = false;
  }
  
  pauseBtn.style.display = 'none'; // Кнопка паузи схована
  
  showScreen(mainMenuScreen); 
  scoreboard.style.display = 'none';
}

// --- Функції гри ---
function showScreen(screenToShow) {
  screens.forEach(screen => screen.classList.remove('active'));
  screenToShow.classList.add('active');
  
  // Керуємо ТІЛЬКИ кнопкою паузи
  if (screenToShow === gameScreen) {
    pauseBtn.style.display = 'block';
  } else {
    pauseBtn.style.display = 'none';
  }
}

function getWordsForCategory(category) {
  if (category === 'mixed') {
    return [].concat(allWordsByCategory.easy, allWordsByCategory.medium, allWordsByCategory.hard);
  }
  return allWordsByCategory[category] || []; 
}
function setupNewGame() {
  clearGameState(); 
  gameState.team1Name = team1Input.value || "Команда 1";
  gameState.team2Name = team2Input.value || "Команда 2";
  gameState.roundTime = parseInt(timeSlider.value, 10);
  gameState.totalRounds = parseInt(roundsSlider.value, 10); 
  gameState.selectedCategory = categorySelect.value; 
  gameState.team1Score = 0;
  gameState.team2Score = 0;
  gameState.currentTeam = 1;
  gameState.currentRound = 0;
  gameState.lastRoundScore = 0;
  gameState.isGameInProgress = true; 
  gameState.isRoundActive = false; 
  updateScoreboard();
  scoreboard.style.display = 'flex'; 
  startRound();
}
function continueGame() {
  updateScoreboard();
  scoreboard.style.display = 'flex';
  team1Input.value = gameState.team1Name;
  team2Input.value = gameState.team2Name;
  timeSlider.value = gameState.roundTime;
  timeOutput.value = gameState.roundTime;
  roundsSlider.value = gameState.totalRounds;
  roundsOutput.value = gameState.totalRounds;
  categorySelect.value = gameState.selectedCategory; 
  if (gameState.isRoundActive) {
    startRound(true); 
  } else {
    showRoundSummary(true); 
  }
}
function startRound(isContinuation = false) {
  roundScore = 0; 
  timeLeft = gameState.roundTime;
  timerDisplay.textContent = timeLeft;
  if (!isContinuation) {
    if (gameState.currentTeam === 1) {
      gameState.currentRound++;
    }
  }
  roundCounterDisplay.textContent = `${gameState.currentRound} / ${gameState.totalRounds}`;
  if (gameState.currentTeam === 1) {
    document.getElementById('team1-display').classList.add('active-team');
    document.getElementById('team2-display').classList.remove('active-team');
  } else {
    document.getElementById('team1-display').classList.remove('active-team');
    document.getElementById('team2-display').classList.add('active-team');
  }
  const categoryWords = getWordsForCategory(gameState.selectedCategory);
  if (!categoryWords || categoryWords.length === 0) {
    wordDisplay.textContent = "ПОМИЛКА СЛІВ";
    return;
  }
  availableWords = [...categoryWords].sort(() => Math.random() - 0.5);

  nextWord();
  showScreen(gameScreen);
  
  startTimer();
  gameState.isRoundActive = true; 
  saveGameState(); 
}
function startTimer() {
  clearInterval(timerInterval); 
  if (timeLeft <= 5 && timeLeft > 0) {
    playSound(sounds.tick);
  }
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft === 5) { 
      playSound(sounds.tick);
    }
    if (timeLeft <= 0) {
      endRound(); 
    }
  }, 1000);
}
function nextWord() {
  wordDisplay.style.fontSize = '2rem';
  wordDisplay.innerHTML = ''; 

  if (availableWords.length === 0) {
    const categoryWords = getWordsForCategory(gameState.selectedCategory);
    if (!categoryWords || categoryWords.length === 0) {
      wordDisplay.textContent = "Слова скінчились!";
      return;
    }
    availableWords = [...categoryWords].sort(() => Math.random() - 0.5);
  }
  const newWord = availableWords.pop(); 
  wordDisplay.textContent = newWord;
  
  const hasOverflow = wordDisplay.scrollWidth > wordDisplay.clientWidth;
  const wordCount = newWord.split(' ').length;

  if (hasOverflow && wordCount > 1) {
    wordDisplay.innerHTML = newWord.replace(/ /g, '<br>');
  } else if (hasOverflow && wordCount === 1) {
    wordDisplay.style.fontSize = '1.6rem';
    if (wordDisplay.scrollWidth > wordDisplay.clientWidth) {
      wordDisplay.style.fontSize = '1.3rem';
    }
  }
}
function handleCorrect() {
  roundScore++; 
  playSound(sounds.correct); 
  nextWord();
}
function handleSkip() {
  playSound(sounds.skip); 
  nextWord();
}
function endRound() {
  clearInterval(timerInterval); 
  gameState.isRoundActive = false; 
  stopSound(sounds.tick); 
  playSound(sounds.timesUp); 
  
  if (gameState.currentTeam === 1) gameState.team1Score += roundScore;
  else gameState.team2Score += roundScore;
  gameState.lastRoundScore = roundScore; 
  updateScoreboard();
  if (gameState.currentTeam === 2 && gameState.currentRound >= gameState.totalRounds) {
    gameState.isGameInProgress = false; 
    showWinner();
    clearGameState(); 
  } else {
    gameState.currentTeam = (gameState.currentTeam === 1) ? 2 : 1;
    showRoundSummary(false); 
    saveGameState(); 
  }
}
function showRoundSummary(isContinuation = false) {
  if (isContinuation) {
    turnEndTitle.style.display = 'none';
    roundSummaryDisplay.style.display = 'none';
  } else {
    turnEndTitle.style.display = 'block';
    roundSummaryDisplay.style.display = 'block';
    roundSummaryDisplay.textContent = `Ви заробили ${gameState.lastRoundScore} балів!`;
  }
  const nextTeam = (gameState.currentTeam === 1) ? gameState.team1Name : gameState.team2Name;
  nextTeamNameDisplay.textContent = nextTeam;
  showScreen(turnEndScreen);
}
function updateScoreboard() {
  team1NameDisplay.textContent = gameState.team1Name;
  team1ScoreDisplay.textContent = gameState.team1Score;
  team2NameDisplay.textContent = gameState.team2Name;
  team2ScoreDisplay.textContent = gameState.team2Score;
}
function showWinner() {
  let winnerMsg = "";
  if (gameState.team1Score > gameState.team2Score) winnerMsg = `🎉 Перемогла ${gameState.team1Name}! 🎉`;
  else if (gameState.team2Score > gameState.team1Score) winnerMsg = `🎉 Перемогла ${gameState.team2Name}! 🎉`;
  else winnerMsg = "Нічия! 🤝"; 
  winnerMessageDisplay.textContent = winnerMsg;
  finalScoreSummaryDisplay.textContent = `Фінальний рахунок: ${gameState.team1Name} (${gameState.team1Score}) - ${gameState.team2Name} (${gameState.team2Score})`;
  showScreen(gameOverScreen); 
}
function performReset() {
  stopSound(sounds.tick); 
  
  gameState.isGameInProgress = false; 
  gameState.isRoundActive = false; 
  clearGameState(); 
  scoreboard.style.display = 'none'; 
  continueBtn.style.display = 'none'; 
  team1Input.value = "Команда 1";
  team2Input.value = "Команда 2";
  timeSlider.value = 60;
  timeOutput.value = 60;
  roundsSlider.value = 3;
  roundsOutput.value = 3;
  categorySelect.value = "mixed"; 
  gameState.lastRoundScore = 0; 
}

// --- Функції Паузи ---
function pauseGame() {
  clearInterval(timerInterval); 
  stopSound(sounds.tick); 
  showScreen(pauseScreen); 
}
function resumeGame() {
  showScreen(gameScreen); 
  startTimer(); 
}
function quitGame() {
  if (!confirm("Вийти в головне меню? Ваш прогрес буде збережено.")) {
      return; 
  }
  clearInterval(timerInterval); 
  stopSound(sounds.tick); 
  
  gameState.isRoundActive = false; 
  saveGameState(); 
  scoreboard.style.display = 'none'; 
  initializeApp(); 
}

// --- ЗАПУСК ДОДАТКУ ---
initializeApp();
