import Gameboard from "./Gameboard.js";

export default class Player {
  constructor(type = "real") {
    if (type !== "real" && type !== "computer") {
      throw new Error(`Player type must be "real" or "computer"`);
    }
    this.type = type;
    this.gameboard = new Gameboard();
    this.previousMoves = [];
    this.targetQueue = [];
    this.hitStreak = [];
    this.orientation = null;
    this.axisValue = null;
  }

  attack(opponentBoard, coordinates) {
    if (this.previousMoves.some(([x, y]) => x === coordinates[0] && y === coordinates[1])) {
      throw new Error("Coordinate already attacked");
    }

    this.previousMoves.push(coordinates);
    return opponentBoard.receiveAttack(coordinates);
  }

  getForbiddenCells(opponentBoard) {
    const forbidden = new Set();

    for (const placedShip of opponentBoard.ships) {
      if (placedShip.ship.isSunk()) {
        for (const [x, y] of placedShip.positions) {
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < opponentBoard.size && ny < opponentBoard.size) {
                forbidden.add(`${nx},${ny}`);
              }
            }
          }
        }
      }
    }

    return forbidden;
  }

  enqueueIfValid([nx, ny], opponentBoard, forbidden) {
    if (
      nx < 0 ||
      ny < 0 ||
      nx >= opponentBoard.size ||
      ny >= opponentBoard.size
    ) return;

    const key = `${nx},${ny}`;

    if (forbidden && forbidden.has(key)) return;
    if (this.previousMoves.some(([px, py]) => px === nx && py === ny)) return;
    if (this.targetQueue.some(([qx, qy]) => qx === nx && qy === ny)) return;

    this.targetQueue.push([nx, ny]);
  }

  pruneTargetQueue(forbidden) {
    if (!this.targetQueue.length) return;
    this.targetQueue = this.targetQueue.filter(([x, y]) => {
      const key = `${x},${y}`;
      if (this.previousMoves.some(([px, py]) => px === x && py === y)) return false;
      if (forbidden && forbidden.has(key)) return false;
      return true;
    });
  }

  trySetOrientation() {
    if (this.orientation || this.hitStreak.length < 2) return;

    for (let i = 0; i < this.hitStreak.length; i++) {
      for (let j = i + 1; j < this.hitStreak.length; j++) {
        const [x1, y1] = this.hitStreak[i];
        const [x2, y2] = this.hitStreak[j];
        if (x1 === x2) {
          this.orientation = "vertical";
          this.axisValue = x1;
          return;
        }
        if (y1 === y2) {
          this.orientation = "horizontal";
          this.axisValue = y1;
          return;
        }
      }
    }
  }

  getLineEndpoints() {
    if (!this.orientation || this.hitStreak.length === 0) return null;

    if (this.orientation === "vertical") {
      const ys = this.hitStreak
        .filter(([x]) => x === this.axisValue)
        .map(([, y]) => y);
      if (ys.length === 0) return null;
      return {
        x: this.axisValue,
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    } else {
      const xs = this.hitStreak
        .filter(([, y]) => y === this.axisValue)
        .map(([x]) => x);
      if (xs.length === 0) return null;
      return {
        y: this.axisValue,
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
      };
    }
  }

  resetTargeting() {
    this.hitStreak = [];
    this.targetQueue = [];
    this.orientation = null;
    this.axisValue = null;
  }

  computerAttack(opponentBoard) {
    if (this.type !== "computer") {
      throw new Error("Only computer players can make random attacks");
    }

    const forbidden = this.getForbiddenCells(opponentBoard);
    this.pruneTargetQueue(forbidden);

    let coordinates = null;

    while (this.targetQueue.length > 0) {
      const candidate = this.targetQueue.shift();
      const [cx, cy] = candidate;
      const key = `${cx},${cy}`;
      if (this.previousMoves.some(([px, py]) => px === cx && py === cy)) continue;
      if (forbidden.has(key)) continue;
      coordinates = candidate;
      break;
    }

    if (!coordinates) {
      const validCells = [];
      for (let x = 0; x < opponentBoard.size; x++) {
        for (let y = 0; y < opponentBoard.size; y++) {
          const key = `${x},${y}`;
          if (this.previousMoves.some(([px, py]) => px === x && py === y)) continue;
          if (forbidden.has(key)) continue;
          validCells.push([x, y]);
        }
      }

      if (validCells.length === 0) {
        for (let x = 0; x < opponentBoard.size; x++) {
          for (let y = 0; y < opponentBoard.size; y++) {
            if (!this.previousMoves.some(([px, py]) => px === x && py === y)) {
              validCells.push([x, y]);
            }
          }
        }
      }

      const idx = Math.floor(Math.random() * validCells.length);
      coordinates = validCells[idx];
    }

    this.previousMoves.push(coordinates);
    const result = opponentBoard.receiveAttack(coordinates);

    if (result.result === "hit") {
      this.hitStreak.push(coordinates);
      this.trySetOrientation();

      if (this.orientation) {
        this.targetQueue = this.targetQueue.filter(([x, y]) => {
          if (this.orientation === "vertical") {
            return x === this.axisValue;
          } else {
            return y === this.axisValue;
          }
        });
      }

      const newForbidden = this.getForbiddenCells(opponentBoard);

      if (!this.orientation) {
        const [x, y] = coordinates;
        this.enqueueIfValid([x + 1, y], opponentBoard, newForbidden);
        this.enqueueIfValid([x - 1, y], opponentBoard, newForbidden);
        this.enqueueIfValid([x, y + 1], opponentBoard, newForbidden);
        this.enqueueIfValid([x, y - 1], opponentBoard, newForbidden);
      } else {
        const ends = this.getLineEndpoints();
        if (ends) {
          if (this.orientation === "vertical") {
            this.enqueueIfValid([ends.x, ends.minY - 1], opponentBoard, newForbidden);
            this.enqueueIfValid([ends.x, ends.maxY + 1], opponentBoard, newForbidden);
          } else {
            this.enqueueIfValid([ends.minX - 1, ends.y], opponentBoard, newForbidden);
            this.enqueueIfValid([ends.maxX + 1, ends.y], opponentBoard, newForbidden);
          }
        }
      }

      const hitShip = opponentBoard.ships.find(s =>
        s.positions.some(([sx, sy]) => sx === coordinates[0] && sy === coordinates[1])
      );
      if (hitShip && hitShip.ship.isSunk()) {
        this.resetTargeting();
        const afterForbidden = this.getForbiddenCells(opponentBoard);
        this.pruneTargetQueue(afterForbidden);
      }
    }

    return result;
  }
}
