import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './DraggableShip';
import DraggableShip from './DraggableShip';
import './GameBoard.css';

const BOARD_SIZE = 8;
const CELL_SIZE = 42;

const Cell = ({ value, isHovered, onClick }) => {
    const cellClass = `cell ${value || ''} ${isHovered ? 'hover-preview' : ''}`;
    return (
        <div className={cellClass} onClick={onClick}>
            {value === 'hit' && <div className="hit-cross"></div>}
        </div>
    );
};

const GameBoard = ({
    ships = [],
    onDropShip,
    onRotateShip,
    boardData = Array(8).fill(Array(8).fill(null)),
    onCellClick = () => {}
}) => {
    const [hoveredCells, setHoveredCells] = useState([]);

    const [, drop] = useDrop(() => ({
        accept: ItemTypes.SHIP,
        hover: (item, monitor) => {
            const offset = monitor.getClientOffset();
            const boardElement = document.querySelector('.game-board');
            if (!boardElement) return;

            const rect = boardElement.getBoundingClientRect();
            const col = Math.floor((offset.x - rect.left) / CELL_SIZE);
            const row = Math.floor((offset.y - rect.top) / CELL_SIZE);

            // Check if ship fits inside the grid
            let valid = true;
            if (item.orientation === 'horizontal') {
                if (col < 0 || col + item.length > BOARD_SIZE || row < 0 || row >= BOARD_SIZE) valid = false;
            } else {
                if (row < 0 || row + item.length > BOARD_SIZE || col < 0 || col >= BOARD_SIZE) valid = false;
            }

            const newHoveredCells = [];
            if (valid) {
                for (let i = 0; i < item.length; i++) {
                    const r = item.orientation === 'horizontal' ? row : row + i;
                    const c = item.orientation === 'horizontal' ? col + i : col;
                    newHoveredCells.push({ r, c });
                }
            }
            setHoveredCells(valid ? newHoveredCells : []);
        },
        drop: (item, monitor) => {
            const offset = monitor.getClientOffset();
            const boardElement = document.querySelector('.game-board');
            setHoveredCells([]);
            if (boardElement && onDropShip) {
                const rect = boardElement.getBoundingClientRect();
                const col = Math.floor((offset.x - rect.left) / CELL_SIZE);
                const row = Math.floor((offset.y - rect.top) / CELL_SIZE);

                // Check if ship fits inside the grid before placing
                if (item.orientation === 'horizontal') {
                    if (col < 0 || col + item.length > BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return;
                } else {
                    if (row < 0 || row + item.length > BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
                }
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
                const row = Math.floor(i / BOARD_SIZE);
                const col = i % BOARD_SIZE;
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
                    style={{
                        top: `${ship.position.row * CELL_SIZE}px`,
                        left: `${ship.position.col * CELL_SIZE}px`,
                    }}
                >
                    <DraggableShip ship={ship} onClick={onRotateShip} />
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
