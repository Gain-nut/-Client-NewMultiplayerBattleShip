
// src/components/GameBoard.js
// src/components/GameBoard.js
import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './DraggableShip';
import DraggableShip from './DraggableShip';
import './GameBoard.css';

const Cell = ({ value, isHovered, onClick }) => {
    const cellClass = `cell ${value || ''} ${isHovered ? 'hover-preview' : ''}`;
    return <div className={cellClass} onClick={onClick}></div>;
};

const GameBoard = ({ ships = [], onDropShip, onRotateShip, boardData = Array(8).fill(Array(8).fill(null)), onCellClick = () => {} }) => {
  const [hoveredCells, setHoveredCells] = useState([]);

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.SHIP,
    hover: (item, monitor) => {
        const offset = monitor.getClientOffset();
        const boardElement = document.querySelector('.game-board');
        if (!boardElement) return;
        
        const rect = boardElement.getBoundingClientRect();
        const col = Math.floor((offset.x - rect.left) / 42);
        const row = Math.floor((offset.y - rect.top) / 42);
            
        const newHoveredCells = [];
        for (let i = 0; i < item.length; i++) {
            const r = item.orientation === 'horizontal' ? row : row + i;
            const c = item.orientation === 'horizontal' ? col + i : col;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                newHoveredCells.push({ r, c });
            }
        }
        setHoveredCells(newHoveredCells);
    },
    drop: (item, monitor) => {
      setHoveredCells([]);
      const offset = monitor.getClientOffset();
      const boardElement = document.querySelector('.game-board');
      if (boardElement && onDropShip) {
        const rect = boardElement.getBoundingClientRect();
        const col = Math.floor((offset.x - rect.left) / 42);
        const row = Math.floor((offset.y - rect.top) / 42);
        onDropShip(item, { row, col });
      }
    },
    leave: () => {
        setHoveredCells([]);
    },
  }));

  return (
    <div ref={drop} className="game-board">
      {Array.from({ length: 64 }).map((_, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const cellValue = boardData[row]?.[col] || null;
        const isHovered = hoveredCells.some(cell => cell.r === row && cell.c === col);

        return (
          <Cell
            key={i}
            value={cellValue}
            isHovered={isHovered}
            onClick={() => onCellClick(row, col)}
          />
        );
      })}

      {ships.map(ship => (
        <div
          key={ship.id}
          className="placed-ship"
          style={{ top: `${ship.position.row * 42}px`, left: `${ship.position.col * 42}px` }}
        >
          <DraggableShip ship={ship} onClick={onRotateShip} />
        </div>
      ))}
    </div>
  );
};

export default GameBoard;