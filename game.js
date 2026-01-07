import Player from "./Player.js";
import Ship from "./Ship.js";

let human = new Player("real");
let computer = new Player("computer");

let orientation = "horizontal";
let draggedShipLength = null;
let currentPlayer = human;
let gameStarted = false;

function buildPlacementCoordinates(x, y, length, orientationArg, boardSize) {
  const coords = [];
  if (orientationArg === "horizontal") {
    if (y + length - 1 >= boardSize) return null;
    for (let i = 0; i < length; i++) coords.push([x, y + i]);
  } else {
    if (x + length - 1 >= boardSize) return null;
    for (let i = 0; i < length; i++) coords.push([x + i, y]);
  }
  return coords;
}

function placeRandomFleet(board) {
  const fleet = [2, 3, 3, 4, 5];
  for (const length of fleet) {
    let placed = false;
    while (!placed) {
      const randOrientation = Math.random() < 0.5 ? "horizontal" : "vertical";
      const x = Math.floor(Math.random() * board.size);
      const y = Math.floor(Math.random() * board.size);

      const coords = buildPlacementCoordinates(x, y, length, randOrientation, board.size);
      if (!coords) continue;

      try {
        board.placeShip(new Ship(length), coords);
        placed = true;
      } catch {
        // retry silently
      }
    }
  }
}

placeRandomFleet(computer.gameboard);

function renderBoard(board, containerId, showShips = false, attackerMoves = []) {
  const container = document.getElementById(containerId);
  container.textContent = "";

  for (let x = 0; x < board.size; x++) {
    for (let y = 0; y < board.size; y++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      container.appendChild(cell);
    }
  }

  if (showShips) {
    for (const s of board.ships) {
      for (const [sx, sy] of s.positions) {
        const cell = container.querySelector(`.cell[data-x="${sx}"][data-y="${sy}"]`);
        if (cell) cell.classList.add("ship");
      }
    }
  }

  for (const [mx, my] of board.missedAttacks) {
    const cell = container.querySelector(`.cell[data-x="${mx}"][data-y="${my}"]`);
    if (cell) cell.classList.add("miss");
  }

  for (const move of attackerMoves) {
    const [ax, ay] = move;
    const isHit = board.ships.some(s =>
      s.positions.some(([sx, sy]) => sx === ax && sy === ay)
    );
    if (isHit) {
      const cell = container.querySelector(`.cell[data-x="${ax}"][data-y="${ay}"]`);
      if (cell) cell.classList.add("hit");
    }
  }
}

function renderHuman() {
  renderBoard(human.gameboard, "human-board", true, computer.previousMoves);
}
function renderComputer() {
  renderBoard(computer.gameboard, "computer-board", false, human.previousMoves);
}

function showDialog(message) {
  const dialog = document.getElementById("game-dialog");
  const msgEl = document.getElementById("game-dialog-message");
  msgEl.textContent = message;
  dialog.showModal();
}

function setupDialog() {
  const dialog = document.getElementById("game-dialog");
  const closeBtn = document.getElementById("game-dialog-close");
  closeBtn.addEventListener("click", () => dialog.close());
}

function rebuildDockSquares() {
  document.querySelectorAll("#ship-dock .ship").forEach(shipEl => {
    const length = parseInt(shipEl.dataset.length, 10);
    shipEl.textContent = "";
    shipEl.classList.remove("placed");
    for (let i = 0; i < length; i++) {
      const square = document.createElement("div");
      square.classList.add("dock-cell");
      shipEl.appendChild(square);
    }
    shipEl.addEventListener("dragstart", () => {
      if (gameStarted) return;
      if (shipEl.classList.contains("placed")) return;
      draggedShipLength = length;
    });
  });
}

function setupRotate() {
  const btn = document.getElementById("rotate-btn");
  const updateLabel = () => {
    btn.textContent = `Rotate: ${orientation[0].toUpperCase()}${orientation.slice(1)}`;
  };
  updateLabel();
  btn.addEventListener("click", () => {
    if (gameStarted) return;
    orientation = orientation === "horizontal" ? "vertical" : "horizontal";
    updateLabel();
    document.querySelectorAll("#ship-dock .ship").forEach(shipEl => {
      shipEl.classList.toggle("vertical", orientation === "vertical");
    });
  });
}

function setupRandomPlacement() {
  const btn = document.getElementById("random-btn");
  btn.addEventListener("click", () => {
    if (typeof human.gameboard.reset === "function") {
      human.gameboard.reset();
    } else {
      human.gameboard.ships = [];
      human.gameboard.missedAttacks = [];
      human.previousMoves = [];
    }

    placeRandomFleet(human.gameboard);
    renderHuman();
    checkStart();
  });
}

function setupRestart() {
  const btn = document.getElementById("restart-btn");
  btn.addEventListener("click", () => {
    human = new Player("real");
    computer = new Player("computer");
    currentPlayer = human;
    orientation = "horizontal";
    gameStarted = false;
    draggedShipLength = null;

    placeRandomFleet(computer.gameboard);
    rebuildDockSquares();

    document.querySelectorAll("#ship-dock .ship").forEach(shipEl => {
      shipEl.classList.remove("vertical", "placed");
    });

    const dock = document.getElementById("ship-dock");
    dock.classList.remove("dimmed");
    document.getElementById("computer-board").classList.add("disabled");
    document.getElementById("rotate-btn").removeAttribute("disabled");
    document.getElementById("random-btn").removeAttribute("disabled");
    document.getElementById("rotate-btn").textContent = "Rotate: Horizontal";

    document.querySelectorAll(".cell.drag-over-valid, .cell.drag-over-invalid")
      .forEach(c => c.classList.remove("drag-over-valid", "drag-over-invalid"));

    updateHint("Place your ships to begin.");
    renderHuman();
    renderComputer();
  });
}

function setupDragAndDrop() {
  const humanBoardEl = document.getElementById("human-board");

  rebuildDockSquares();

  //clear all highlights
  function clearHighlights() {
    humanBoardEl.querySelectorAll(".cell.drag-over-valid, .cell.drag-over-invalid")
      .forEach(c => c.classList.remove("drag-over-valid", "drag-over-invalid"));
  }

  //check if coords overlap or are too close to existing ships
  function isTooClose(coords) {
    return coords.some(([cx, cy]) => {
      return human.gameboard.ships.some(ship =>
        ship.positions.some(([sx, sy]) => {
          //at least 1 cell gap around ships
          return Math.abs(sx - cx) <= 1 && Math.abs(sy - cy) <= 1;
        })
      );
    });
  }

  //show footprint
  humanBoardEl.addEventListener("dragover", e => {
    e.preventDefault();
    if (gameStarted || !draggedShipLength) return;

    const cell = e.target.closest(".cell");
    if (!cell) return;

    clearHighlights();

    const x = parseInt(cell.dataset.x, 10);
    const y = parseInt(cell.dataset.y, 10);
    const coords = buildPlacementCoordinates(x, y, draggedShipLength, orientation, human.gameboard.size);

    if (!coords) {
      // Out of bounds footprint
      for (let i = 0; i < draggedShipLength; i++) {
        const cx = orientation === "horizontal" ? x : x + i;
        const cy = orientation === "horizontal" ? y + i : y;
        const targetCell = humanBoardEl.querySelector(`.cell[data-x="${cx}"][data-y="${cy}"]`);
        if (targetCell) targetCell.classList.add("drag-over-invalid");
      }
      return;
    }
    //check overlap or proximity
    const invalid = isTooClose(coords);
    const cssClass = invalid ? "drag-over-invalid" : "drag-over-valid";

    coords.forEach(([cx, cy]) => {
      const targetCell = humanBoardEl.querySelector(`.cell[data-x="${cx}"][data-y="${cy}"]`);
      if (targetCell) targetCell.classList.add(cssClass);
    });
  });

  //clear highlights and reset
  document.addEventListener("dragend", () => {
    clearHighlights();
    draggedShipLength = null;
  });

  //attempt placement
  humanBoardEl.addEventListener("drop", e => {
    e.preventDefault();
    if (gameStarted || !draggedShipLength) return;

    const anchor = humanBoardEl.querySelector(".cell.drag-over-valid, .cell.drag-over-invalid");
    if (!anchor) {
      clearHighlights();
      draggedShipLength = null;
      return;
    }

    const x = parseInt(anchor.dataset.x, 10);
    const y = parseInt(anchor.dataset.y, 10);
    const coords = buildPlacementCoordinates(x, y, draggedShipLength, orientation, human.gameboard.size);

    clearHighlights();

    if (!coords) {
      showDialog("Cannot place ship: out of bounds!");
      draggedShipLength = null;
      return;
    }

    try {
      //attempt to place ship (overlap/too close errors handled here)
      human.gameboard.placeShip(new Ship(draggedShipLength), coords);

      //mark dock ship as placed
      const shipEls = document.querySelectorAll(`.ship[data-length="${draggedShipLength}"]`);
      for (const el of shipEls) {
        if (!el.classList.contains("placed")) {
          el.classList.add("placed");
          break;
        }
      }

      renderHuman();
      checkStart();
    } catch (err) {
      //placement errors
      showDialog(err.message);
    } finally {
      draggedShipLength = null;
    }
  });
}

function onComputerBoardClick(e) {
  if (!gameStarted) return;

  const cell = e.target.closest(".cell");
  if (!cell || currentPlayer !== human) return;

  const x = parseInt(cell.dataset.x, 10);
  const y = parseInt(cell.dataset.y, 10);

  if (human.previousMoves.some(([px, py]) => px === x && py === y)) return;

  const result = human.attack(computer.gameboard, [x, y]);
  renderComputer();

  if (result.result === "hit" && result.ship.isSunk()) {
    let shipName = "";
    if (result.ship.length === 2) shipName = "Destroyer (2)";
    else if (result.ship.length === 3) shipName = "Cruiser/Submarine (3)";
    else if (result.ship.length === 4) shipName = "Battleship (4)";
    else if (result.ship.length === 5) shipName = "Carrier (5)";
    else shipName = `Ship of length ${result.ship.length}`;

    showDialog(`You sunk the enemy's ${shipName}!`);
  }

  if (computer.gameboard.allShipsSunk()) {
    showDialog("Victory! What is dead may never die, but your enemies surely did!");
    gameStarted = false;
    return;
  }

  if (result.result === "hit") {
    return;
  }

  currentPlayer = computer;
  computerTurn();
}

function computerTurn() {
  updateHint("Enemy turn. Watch the computer unleash its attack.");
  //delay
  setTimeout(() => {
    const result = computer.computerAttack(human.gameboard);
    renderHuman();

    if (result && result.result === "hit" && result.ship.isSunk()) {
      let shipName = "";
      if (result.ship.length === 2) shipName = "Destroyer (2)";
      else if (result.ship.length === 3) shipName = "Cruiser/Submarine (3)";
      else if (result.ship.length === 4) shipName = "Battleship (4)";
      else if (result.ship.length === 5) shipName = "Carrier (5)";
      else shipName = `Ship of length ${result.ship.length}`;

      showDialog(`The computer sunk your ${shipName}!`);
    }

    if (human.gameboard.allShipsSunk()) {
      showDialog("Defeat! The Drowned God claims your fleet.");
      return;
    }
    
    if (result.result === "hit") {
      computerTurn();
    } else {
      currentPlayer = human;
      updateHint("Your turn. Choose a target on the enemy grid to attack.");
    }
  }, 1000);
}

function checkStart() {
  if (human.gameboard.ships && human.gameboard.ships.length === 5) {
    startGame();
  }
}

function updateHint(message) {
  const hintEl = document.getElementById("hint");
  if (hintEl) hintEl.textContent = message;
}

function startGame() {
  gameStarted = true;
  document.getElementById("computer-board").classList.remove("disabled");
  document.getElementById("rotate-btn").setAttribute("disabled", "true");
  document.getElementById("random-btn").setAttribute("disabled", "true");
  document.getElementById("ship-dock").classList.add("dimmed");

  document.querySelectorAll(".cell.drag-over-valid, .cell.drag-over-invalid")
    .forEach(c => c.classList.remove("drag-over-valid", "drag-over-invalid"));

  updateHint("Your turn. Choose a target on the enemy grid to attack.");
}

function initGame() {
  setupRotate();
  setupDragAndDrop();
  setupRandomPlacement();
  setupRestart();
  setupDialog();
  renderHuman();
  renderComputer();

  updateHint("Place your ships to begin.");
  document.getElementById("computer-board").addEventListener("click", onComputerBoardClick);
}

document.addEventListener("DOMContentLoaded", initGame);