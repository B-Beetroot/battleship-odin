# Project: Battleship - The Odin Project

A classic Battleship game implementation built as part of [The Odin Project](https://www.theodinproject.com/) curriculum. This project emphasizes **Test Driven Development (TDD)** using **Jest** and modern JavaScript (ESM). The goal is to isolate game logic from DOM manipulation, ensuring clean, testable code.

---

## Introduction

This project recreates the game of **Battleship**, where players take turns attacking coordinates on each other’s boards until all ships are sunk.  

Key focus areas:
- Practicing **TDD**: write a test, then make it pass.
- Building modular, reusable classes (`Ship`, `Gameboard`, `Player`).
- Separating **game logic** from **UI rendering**.
- Using **Jest** for unit testing with Babel compatibility for ESM.

---

## Features

- **Ship Class**
  - Tracks ship length, hits, and sunk status.
  - `hit()` method increments damage.
  - `isSunk()` determines if the ship is destroyed.

- **Gameboard Class**
  - Places ships at specific coordinates.
  - `receiveAttack()` processes attacks, marking hits or misses.
  - Tracks missed shots.
  - Reports if all ships are sunk.

- **Player Class**
  - Represents both human and computer players.
  - Each player has their own gameboard.
  - Computer player makes random legal moves.

---

## Gameplay

1. Drag-and-drop ship placement for the real player's board.
2. The computer’s board is randomly generated.
3. Players take turns attacking coordinates.
4. Hits and misses are tracked and displayed.
5. The computer makes random valid moves, with smarter AI that attacks adjacent cells after a hit.
6. The game ends when one player’s fleet is completely sunk.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- [The Odin Project](https://www.theodinproject.com/) for guidance and curriculum.