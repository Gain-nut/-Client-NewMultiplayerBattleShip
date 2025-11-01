import React, { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './DraggableShip';
import DraggableShip from './DraggableShip';
import { spawnAtCell } from '../effects';   
import './GameBoard.css';

const BOARD_SIZE = 8;
const CELL_SIZE = 42;

// ---------- Single cell ----------
const Cell = ({ value, isHovered, onClick, row, col }) => {
  const cellClass = `cell ${value || ''} ${isHovered ? 'hover-preview' : ''}`;
  return (
    <div
      className={cellClass}
      data-cell={`${row}-${col}`}
      onClick={onClick}
    >
      {value === 'hit' && <div className="hit-cross"></div>}
    </div>
  );
};

const GameBoard = ({
  ships = [],
  onDropShip,
  onRotateShip,
  boardData = Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(null)),
  onCellClick = () => {},
  emojis = [],
}) => {
  const [hoveredCells, setHoveredCells] = useState([]);
  const boardRef = useRef(null);
  const seenResultsRef = useRef(new Set()); // remember which cells already sparked for hit/miss

  // Cells covered by a ship placed at (row,col)
  function coveredCells(item, row, col) {
    const cells = [];
    for (let i = 0; i < item.length; i++) {
      const r = item.orientation === 'horizontal' ? row : row + i;
      const c = item.orientation === 'horizontal' ? col + i : col;
      cells.push({ r, c });
    }
    return cells;
  }

  // ----- DnD drop target -----
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.SHIP,
    hover: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const boardEl = boardRef.current;
      if (!boardEl || !offset) return;

      const rect = boardEl.getBoundingClientRect();
      const col = Math.floor((offset.x - rect.left) / CELL_SIZE);
      const row = Math.floor((offset.y - rect.top) / CELL_SIZE);

      // bounds check
      let valid = true;
      if (item.orientation === 'horizontal') {
        if (col < 0 || col + item.length > BOARD_SIZE || row < 0 || row >= BOARD_SIZE) valid = false;
      } else {
        if (row < 0 || row + item.length > BOARD_SIZE || col < 0 || col >= BOARD_SIZE) valid = false;
      }

      const next = [];
      if (valid) {
        for (let i = 0; i < item.length; i++) {
          const r = item.orientation === 'horizontal' ? row : row + i;
          const c = item.orientation === 'horizontal' ? col + i : col;
          next.push({ r, c });
        }
      }
      setHoveredCells(valid ? next : []);
    },
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const boardEl = boardRef.current;
      setHoveredCells([]);
      if (!boardEl || !offset || !onDropShip) return;

      const rect = boardEl.getBoundingClientRect();
      const col = Math.floor((offset.x - rect.left) / CELL_SIZE);
      const row = Math.floor((offset.y - rect.top) / CELL_SIZE);

      // bounds check
      if (item.orientation === 'horizontal') {
        if (col < 0 || col + item.length > BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return;
      } else {
        if (row < 0 || row + item.length > BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
      }

      // Place via your handler
      const placed = onDropShip(item, { row, col });
      if (placed === false) return;

      // 💥 Debris eruption on each covered tile
      coveredCells(item, row, col).forEach(({ r, c }) => {
        spawnAtCell(boardEl, r, c, CELL_SIZE, 'debris');
      });
    },
    leave: () => setHoveredCells([]),
  }));

  // ----- Fire particles on new hit/miss -----
  useEffect(() => {
    const boardEl = boardRef.current;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const v = boardData[r]?.[c];
        if (v === 'hit' || v === 'miss') {
          const key = `${r}-${c}:${v}`;
          if (!seenResultsRef.current.has(key)) {
            seenResultsRef.current.add(key);
            // 🔥 fiery sparks for hit, smoky sparks for miss (handled in effects.js)
            spawnAtCell(boardEl, r, c, CELL_SIZE, 'fire');
          }
        }
      }
    }
  }, [boardData]);

  // ----- Render -----
  return (
    <div
      ref={(el) => { boardRef.current = el; drop(el); }}
      className="game-board"
    >
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        const cellValue = boardData[row]?.[col] || null;
        const isHovered = hoveredCells.some(cell => cell.r === row && cell.c === col);

        return (
          <Cell
            key={i}
            value={cellValue}
            isHovered={isHovered}
            row={row}
            col={col}
            onClick={() => onCellClick(row, col)}
          />
        );
      })}

      {ships.map(ship => (
        <div
          key={ship.id}
          className="placed-ship"
          style={{
            top: `${ship.position.row * CELL_SIZE}px`,
            left: `${ship.position.col * CELL_SIZE}px`,
          }}
        >
          <DraggableShip ship={ship} onClick={onRotateShip} />
        </div>
      ))}
    {/* Emoji overlay (shared reactions) */}
      {emojis && emojis.length > 0 && (
        <div className="emoji-overlay">
          {emojis.map(e => (
            <div key={e.id} className="emoji-pop" title={e.from}>
              {e.emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameBoard;