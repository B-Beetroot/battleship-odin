export default class Gameboard {
  constructor(size = 10) {
    this.size = size;
    this.ships = [];
    this.missedAttacks = [];
  }

  placeShip(ship, coordinates) {

    if (coordinates.length !== ship.length) {
      throw new Error("Coordinates must match ship length");
    }

    for (const newPosition of coordinates) {
      const [nx, ny] = newPosition;

      const isTooClose = this.ships.some(existingShip =>
        existingShip.positions.some(([ex, ey]) => {
          const dx = Math.abs(ex - nx);
          const dy = Math.abs(ey - ny);

          return dx <= 1 && dy <= 1;
        })
      );

      if (isTooClose) {
        throw new Error("Ships must have at least 1 square between them!");
      }
    }

    this.ships.push({ ship, positions: coordinates });
  }

receiveAttack([x, y]) {
  const hitShip = this.ships.find(placedShip =>
    placedShip.positions.some(([shipX, shipY]) => shipX === x && shipY === y)
  );

  if (hitShip) {
    hitShip.ship.hit();
    return {
      result: "hit",
      ship: hitShip.ship
    };
  }
  this.missedAttacks.push([x, y]);
  return { result: "miss" };
}


  reset() {
    this.ships = [];
    this.missedAttacks = [];
    this.previousMoves = [];
  }

  allShipsSunk() {
    return this.ships.every(s => s.ship.isSunk());
  }
}