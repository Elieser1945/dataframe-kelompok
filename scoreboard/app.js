const MAX_SCORE = 30;
const MIN_WIN_SCORE = 21;
const GAME_POINT_THRESHOLD = 20;
const HISTORY_LIMIT = 50;

const state = {
  scores: { a: 0, b: 0 },
  games: { a: 0, b: 0 },
  serving: "a",
  completedGames: [],
  bestOf: 3,
  teamNames: { a: "Team A", b: "Team B" },
  history: [],
  matchComplete: false,
};

const elements = {
  score: {
    a: document.getElementById("score-a"),
    b: document.getElementById("score-b"),
  },
  games: {
    a: document.getElementById("games-a"),
    b: document.getElementById("games-b"),
  },
  teamDisplay: {
    a: document.getElementById("display-team-a"),
    b: document.getElementById("display-team-b"),
  },
  serveIndicators: {
    a: document.getElementById("serve-indicator-a"),
    b: document.getElementById("serve-indicator-b"),
  },
  teamPanels: {
    a: document.querySelector('.team-panel[data-team="a"]'),
    b: document.querySelector('.team-panel[data-team="b"]'),
  },
  targetGames: document.getElementById("target-games"),
  matchStatus: document.getElementById("match-status"),
  setHistoryBody: document.getElementById("set-history-body"),
  gamePointBanner: document.getElementById("game-point-banner"),
  matchPointBanner: document.getElementById("match-point-banner"),
  gameLabelA: document.getElementById("game-label-a"),
  gameLabelB: document.getElementById("game-label-b"),
  teamForm: document.getElementById("team-form"),
  bestOf: document.getElementById("best-of"),
  undo: document.getElementById("undo-last"),
  resetGame: document.getElementById("reset-game"),
  resetMatch: document.getElementById("reset-match"),
  nameInputs: {
    a: document.getElementById("team-a-name"),
    b: document.getElementById("team-b-name"),
  },
  scoreButtons: document.querySelectorAll(".score-btn"),
  serveButtons: document.querySelectorAll(".serve-toggle"),
};

function gamesNeededToWin() {
  return Math.ceil(state.bestOf / 2);
}

function snapshotState() {
  return {
    scores: { ...state.scores },
    games: { ...state.games },
    serving: state.serving,
    completedGames: state.completedGames.map((game) => ({ ...game })),
    bestOf: state.bestOf,
    teamNames: { ...state.teamNames },
    matchComplete: state.matchComplete,
  };
}

function limitHistory() {
  if (state.history.length > HISTORY_LIMIT) {
    state.history.splice(0, state.history.length - HISTORY_LIMIT);
  }
}

function recordAction(description) {
  state.history.push({
    description,
    snapshot: snapshotState(),
    statusMessage: elements.matchStatus.textContent,
  });
  limitHistory();
}

function undoLastAction() {
  const last = state.history.pop();
  if (!last) return;

  Object.assign(state, last.snapshot);
  elements.matchStatus.textContent = last.statusMessage;
  elements.matchStatus.classList.toggle("celebrate", state.matchComplete);
  updateDisplay();
}

function updateDisplay() {
  elements.score.a.textContent = state.scores.a;
  elements.score.b.textContent = state.scores.b;
  elements.games.a.textContent = state.games.a;
  elements.games.b.textContent = state.games.b;
  elements.teamDisplay.a.textContent = state.teamNames.a;
  elements.teamDisplay.b.textContent = state.teamNames.b;
  elements.gameLabelA.textContent = state.teamNames.a;
  elements.gameLabelB.textContent = state.teamNames.b;
  elements.targetGames.textContent = gamesNeededToWin();

  elements.teamPanels.a.classList.toggle("serving", state.serving === "a");
  elements.teamPanels.b.classList.toggle("serving", state.serving === "b");

  const buttonsDisabled = state.matchComplete;
  elements.scoreButtons.forEach((btn) => {
    btn.disabled = buttonsDisabled;
  });
  elements.serveButtons.forEach((btn) => {
    btn.disabled = buttonsDisabled;
  });

  updateBanners();
  renderSetHistory();
}

function updateBanners() {
  const { a: scoreA, b: scoreB } = state.scores;
  const maxScore = Math.max(scoreA, scoreB);
  const minScore = Math.min(scoreA, scoreB);
  const isTied = scoreA === scoreB;
  const leadingTeam = scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : null;
  const gamePoint = maxScore >= GAME_POINT_THRESHOLD && maxScore - minScore === 1;
  const winningOpportunity = maxScore >= GAME_POINT_THRESHOLD && maxScore - minScore >= 1;

  if (gamePoint && leadingTeam) {
    elements.gamePointBanner.classList.add("show");
    elements.gamePointBanner.textContent = `${state.teamNames[leadingTeam]} game point`;
  } else {
    elements.gamePointBanner.classList.remove("show");
  }

  const matchPoint =
    leadingTeam &&
    winningOpportunity &&
    state.games[leadingTeam] === gamesNeededToWin() - 1 &&
    !state.matchComplete;

  if (matchPoint) {
    elements.matchPointBanner.classList.add("show");
    elements.matchPointBanner.textContent = `${state.teamNames[leadingTeam]} match point`;
  } else {
    elements.matchPointBanner.classList.remove("show");
  }

  if (isTied || maxScore < GAME_POINT_THRESHOLD) {
    elements.gamePointBanner.classList.remove("show");
  }
}

function renderSetHistory() {
  const tbody = elements.setHistoryBody;
  tbody.innerHTML = "";

  if (!state.completedGames.length) {
    const row = document.createElement("tr");
    row.classList.add("empty");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No games completed yet.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  state.completedGames.forEach((game, index) => {
    const row = document.createElement("tr");
    if (game.winner) {
      row.classList.add("victory");
    }

    const indexCell = document.createElement("td");
    indexCell.textContent = index + 1;
    row.appendChild(indexCell);

    const scoreACell = document.createElement("td");
    scoreACell.textContent = game.scoreA;
    row.append