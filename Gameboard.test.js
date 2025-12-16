import Gameboard from "./Gameboard.js";
import Ship from "./Ship.js";

describe("Gameboard class", () => {
  test("places a ship at valid coordinates", () => {
    const board = new Gameboard();
    const ship = new Ship(3);
    board.placeShip(ship, [[0,0],[0,1],[0,2]]);
    expect(board.ships.length).toBe(1);
    expect(board.ships[0].positions).toEqual([[0,0],[0,1],[0,2]]);
  });

  test("throws error if coordinates length does not match ship length", () => {
    const board = new Gameboard();
    const ship = new Ship(3);
    expect(() => board.placeShip(ship, [[0,0],[0,1]])).toThrow("Coordinates must match ship length");
  });

  test("throws error if ships are too close", () => {
    const board = new Gameboard();
    const ship1 = new Ship(2);
    const ship2 = new Ship(2);
    board.placeShip(ship1, [[0,0],[0,1]]);
    expect(() => board.placeShip(ship2, [[0,2],[0,3]])).toThrow("Ships must have at least 1 square between them");
  });

  test("receiveAttack registers a hit", () => {
    const board = new Gameboard();
    const ship = new Ship(2);
    board.placeShip(ship, [[1,1],[1,2]]);
    const result = board.receiveAttack([1,1]);

    expect(result.result).toBe("hit");
    expect(result.ship).toBe(ship);
    expect(ship.hits).toBe(1);   
  });


  test("receiveAttack registers a miss", () => {
    const board = new Gameboard();
    const ship = new Ship(2);
    board.placeShip(ship, [[1,1],[1,2]]);
    const result = board.receiveAttack([5,5]);
    expect(result.result).toBe("miss");
    expect(board.missedAttacks).toContainEqual([5,5]);
  });

  test("allShipsSunk returns false if not all ships are sunk", () => {
    const board = new Gameboard();
    const ship = new Ship(2);
    board.placeShip(ship, [[0,0],[0,1]]);
    board.receiveAttack([0,0]);
    expect(board.allShipsSunk()).toBe(false);
  });

  test("allShipsSunk returns true when all ships are sunk", () => {
    const board = new Gameboard();
    const ship = new Ship(2);
    board.placeShip(ship, [[0,0],[0,1]]);
    board.receiveAttack([0,0]);
    board.receiveAttack([0,1]);
    expect(board.allShipsSunk()).toBe(true);
  });
});