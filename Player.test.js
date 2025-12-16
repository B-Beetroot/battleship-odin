import Player from "./Player.js";
import Gameboard from "./Gameboard.js";
import Ship from "./Ship.js";

describe("Player class", () => {
  test("creates a real player with its own gameboard", () => {
    const player = new Player("real");
    expect(player.type).toBe("real");
    expect(player.gameboard).toBeInstanceOf(Gameboard);
  });

  test("creates a computer player with its own gameboard", () => {
    const computer = new Player("computer");
    expect(computer.type).toBe("computer");
    expect(computer.gameboard).toBeInstanceOf(Gameboard);
  });

  test("throws error for invalid player type", () => {
    expect(() => new Player("alien")).toThrow(`Player type must be "real" or "computer"`);
  });

  test("real player can attack opponent board", () => {
    const player = new Player("real");
    const opponent = new Gameboard();
    const ship = new Ship(2);
    opponent.placeShip(ship, [[0,0],[0,1]]);
    const result = player.attack(opponent, [0,0]);
    expect(result.result).toBe("hit");
    expect(ship.hits).toBe(1);
  });

  test("attack prevents duplicate coordinates", () => {
    const player = new Player("real");
    const opponent = new Gameboard();
    const ship = new Ship(2);
    opponent.placeShip(ship, [[0,0],[0,1]]);
    player.attack(opponent, [0,0]);
    expect(() => player.attack(opponent, [0,0])).toThrow("Coordinate already attacked");
  });

  test("computer player can make attacks", () => {
    const computer = new Player("computer");
    const opponent = new Gameboard();
    const ship = new Ship(1);
    opponent.placeShip(ship, [[1,1]]);
    const result = computer.computerAttack(opponent);
    expect(["hit","miss"]).toContain(result.result);
    expect(computer.previousMoves.length).toBe(1);
  });

  test("real player cannot use computerAttack", () => {
    const player = new Player("real");
    const opponent = new Gameboard();
    expect(() => player.computerAttack(opponent)).toThrow("Only computer players can make random attacks");
  });

  test("computer detects vertical orientation after two vertical hits", () => {
    const computer = new Player("computer");
    const opponent = new Gameboard();
    const ship = new Ship(3);
    opponent.placeShip(ship, [[2,2],[2,3],[2,4]]);

    computer.previousMoves.push([2,2]);
    computer.hitStreak.push([2,2]);

    computer.previousMoves.push([2,3]);
    computer.hitStreak.push([2,3]);
    computer.trySetOrientation();

    expect(computer.orientation).toBe("vertical");
    expect(computer.axisValue).toBe(2);
  });

  test("computer detects horizontal orientation after two horizontal hits", () => {
    const computer = new Player("computer");
    const opponent = new Gameboard();
    const ship = new Ship(3);
    opponent.placeShip(ship, [[5,5],[6,5],[7,5]]);

    computer.previousMoves.push([5,5]);
    computer.hitStreak.push([5,5]);
    computer.previousMoves.push([6,5]);
    computer.hitStreak.push([6,5]);
    computer.trySetOrientation();

    expect(computer.orientation).toBe("horizontal");
    expect(computer.axisValue).toBe(5);
  });

  test("pruneTargetQueue removes already attacked or forbidden cells", () => {
    const computer = new Player("computer");
    const opponent = new Gameboard();
    const ship = new Ship(1);
    opponent.placeShip(ship, [[0,0]]);

    computer.previousMoves.push([1,1]);
    computer.targetQueue = [[1,1],[2,2]];

    const forbidden = new Set(["2,2"]);
    computer.pruneTargetQueue(forbidden);

    expect(computer.targetQueue).toEqual([]); 
  });

  test("resetTargeting clears hitStreak, targetQueue, orientation, and axisValue", () => {
    const computer = new Player("computer");
    computer.hitStreak = [[1,1],[1,2]];
    computer.targetQueue = [[1,3]];
    computer.orientation = "vertical";
    computer.axisValue = 1;

    computer.resetTargeting();

    expect(computer.hitStreak).toEqual([]);
    expect(computer.targetQueue).toEqual([]);
    expect(computer.orientation).toBeNull();
    expect(computer.axisValue).toBeNull();
  });

  test("getForbiddenCells marks sunk ship and its adjacent cells", () => {
    const opponent = new Gameboard();
    const ship = new Ship(1);
    opponent.placeShip(ship, [[4,4]]);
    ship.hit(); 

    const computer = new Player("computer");
    const forbidden = computer.getForbiddenCells(opponent);

    expect(forbidden.has("4,4")).toBe(true);
    expect(forbidden.has("3,3")).toBe(true);
    expect(forbidden.has("5,5")).toBe(true);
  });

  test("computerAttack enqueues neighbors after a hit", () => {
    const computer = new Player("computer");
    const opponent = new Gameboard();
    const ship = new Ship(2);
    opponent.placeShip(ship, [[0,0],[0,1]]);

    const result = computer.computerAttack(opponent);
    if (result === "hit") {
      expect(computer.hitStreak.length).toBe(1);
      expect(computer.targetQueue.length).toBeGreaterThan(0);
    }
  });
});