import Ship from "./Ship.js";

describe("Ship class", () => {
  test("creates a ship with correct length", () => {
    const ship = new Ship(3);
    expect(ship.length).toBe(3);
    expect(ship.hits).toBe(0);
  });

  test("hit() increases the number of hits", () => {
    const ship = new Ship(2);
    ship.hit();
    expect(ship.hits).toBe(1);
    ship.hit();
    expect(ship.hits).toBe(2);
  });

  test("hit() does not exceed ship length", () => {
    const ship = new Ship(2);
    ship.hit();
    ship.hit();
    ship.hit();
    expect(ship.hits).toBe(2);
  });

  test("isSunk() returns false if not fully hit", () => {
    const ship = new Ship(3);
    ship.hit();
    expect(ship.isSunk()).toBe(false);
  });

  test("isSunk() returns true when hits equal length", () => {
    const ship = new Ship(2);
    ship.hit();
    ship.hit();
    expect(ship.isSunk()).toBe(true);
  });

  test("throws error if length is invalid", () => {
    expect(() => new Ship(0)).toThrow("Ship length must be greater than 0");
  });
});