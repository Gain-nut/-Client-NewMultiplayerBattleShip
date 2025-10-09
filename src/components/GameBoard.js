// // src/components/GameBoard.js
// import React from 'react';
// import './GameBoard.css'; // เราจะสร้างไฟล์ css นี้ต่อไป

// // Cell: Component สำหรับแต่ละช่องในตาราง
// const Cell = ({ value, onClick }) => {
//   // กำหนด className ตามค่าของ value (เช่น 'ship', 'hit', 'miss')
//   const cellClass = `cell ${value}`; 
//   return <div className={cellClass} onClick={onClick}></div>;
// };

// // GameBoard: Component สำหรับตารางเกมทั้งหมด
// const GameBoard = ({ board, onCellClick }) => {
//   return (
//     <div className="game-board">
//       {board.map((row, rowIndex) =>
//         row.map((cellValue, colIndex) => (
//           <Cell
//             key={`${rowIndex}-${colIndex}`}
//             value={cellValue}
//             onClick={() => onCellClick(rowIndex, colIndex)}
//           />
//         ))
//       )}
//     </div>
//   );
// };

// export default GameBoard;


//v2
// src/components/GameBoard.js
// import React from 'react';
// import { useDrop } from 'react-dnd';
// import { ItemTypes } from './DraggableShip'; // import Type มาใช้
// import './GameBoard.css';

// const Cell = ({ value, onDrop, rowIndex, colIndex }) => {
//   const [{ isOver }, drop] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     // onDrop จะทำงานเมื่อเราปล่อยเรือลงบนช่องนี้
//     drop: (item) => onDrop(item.id, { row: rowIndex, col: colIndex }),
//     collect: (monitor) => ({
//       isOver: !!monitor.isOver(), // เช็คว่ามีเรือลากมาอยู่เหนือช่องนี้หรือไม่
//     }),
//   }));

//   const cellClass = `cell ${value || ''} ${isOver ? 'drop-target' : ''}`;
  
//   // ref={drop} คือการบอกว่าช่องนี้เป็น Drop Target
//   return <div ref={drop} className={cellClass}></div>;
// };

// // GameBoard: Component สำหรับตารางเกมทั้งหมด
// const GameBoard = ({ board, onDropShip }) => {
//   return (
//     <div className="game-board">
//       {board.map((row, rowIndex) =>
//         row.map((cellValue, colIndex) => (
//           <Cell
//             key={`${rowIndex}-${colIndex}`}
//             value={cellValue}
//             rowIndex={rowIndex}
//             colIndex={colIndex}
//             // ส่ง onDrop function ไปให้แต่ละ Cell
//             onDrop={onDropShip || (() => {})}
//           />
//         ))
//       )}
//     </div>
//   );
// };

// export default GameBoard;



// //v3
// // src/components/GameBoard.js
// // src/components/GameBoard.js
// import React from 'react';
// import { useDrop } from 'react-dnd';
// import { ItemTypes } from './DraggableShip';
// import DraggableShip from './DraggableShip';
// import './GameBoard.css';

// // A simple cell component, it can now render hits/misses for the gameplay phase
// const Cell = ({ value, onClick }) => {
//     const cellClass = `cell ${value || ''}`;
//     return <div className={cellClass} onClick={onClick}></div>;
// };


// const GameBoard = ({ ships, onDropShip, onRotateShip, boardData, onCellClick }) => {
//   const [{ isOver }, drop] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     drop: (item, monitor) => {
//       const offset = monitor.getClientOffset();
//       const boardElement = document.querySelector('.game-board');
//       if (boardElement && onDropShip) {
//         const rect = boardElement.getBoundingClientRect();
//         // Calculate grid position from mouse coordinates
//         const col = Math.round((offset.x - rect.left) / 42); // 40px width + 2px gap
//         const row = Math.round((offset.y - rect.top) / 42); 
//         onDropShip(item, { row, col });
//       }
//     },
//     collect: (monitor) => ({
//       isOver: !!monitor.isOver(),
//     }),
//   }));

//   return (
//     <div ref={drop} className="game-board" style={{ backgroundColor: isOver ? '#00ff001a' : '#1a1d22' }}>
//       {/* If boardData is provided (during gameplay), render it. Otherwise, render empty cells. */}
//       {boardData ? (
//          boardData.flat().map((cellValue, i) => (
//             <Cell 
//                 key={i} 
//                 value={cellValue} 
//                 onClick={() => onCellClick(Math.floor(i / 8), i % 8)}
//             />
//          ))
//       ) : (
//         Array.from({ length: 64 }).map((_, i) => <Cell key={i} />)
//       )}

//       {/* Render ships that have been placed on the board */}
//       {ships.map(ship => (
//         <div
//           key={ship.id}
//           className="placed-ship"
//           style={{
//             top: `${ship.position.row * 42}px`,
//             left: `${ship.position.col * 42}px`,
//           }}
//         >
//           <DraggableShip ship={ship} onRotate={onRotateShip} />
//         </div>
//       ))}
//     </div>
//   );
// };

// export default GameBoard;

// 10/8/2025 18:00  shadow
// src/components/GameBoard.js
// src/components/GameBoard.js
// src/components/GameBoard.js
// src/components/GameBoard.js
// import React, { useState } from 'react'; // <-- เพิ่ม useState
// import { useDrop } from 'react-dnd';
// import { ItemTypes } from './DraggableShip';
// import DraggableShip from './DraggableShip';
// import './GameBoard.css';

// const Cell = ({ value, isHovered, onClick }) => {
//     // เพิ่ม isHovered เพื่อแสดงเงา
//     const cellClass = `cell ${value || ''} ${isHovered ? 'hover-preview' : ''}`;
//     return <div className={cellClass} onClick={onClick}></div>;
// };

// const GameBoard = ({ ships, onDropShip, onRotateShip, boardData, onCellClick }) => {
//   // State ใหม่สำหรับเก็บตำแหน่งที่กำลังลากเรือมาทับ
//   const [hoveredCells, setHoveredCells] = useState([]);

//   const [{ isOver }, drop] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     // hover: ฟังก์ชันที่จะทำงานเมื่อมี item ลากมาอยู่เหนือ drop target
//     hover: (item, monitor) => {
//         const offset = monitor.getClientOffset();
//         const boardElement = document.querySelector('.game-board');
//         if (boardElement) {
//             const rect = boardElement.getBoundingClientRect();
//             const col = Math.floor((offset.x - rect.left) / 42);
//             const row = Math.floor((offset.y - rect.top) / 42);

//             const newHoveredCells = [];
//             for (let i = 0; i < item.length; i++) {
//                 const r = item.orientation === 'horizontal' ? row : row + i;
//                 const c = item.orientation === 'horizontal' ? col + i : col;
//                 if (r >= 0 && r < 8 && c >= 0 && c < 8) {
//                     newHoveredCells.push({ r, c });
//                 }
//             }
//             setHoveredCells(newHoveredCells);
//         }
//     },
//     drop: (item, monitor) => {
//       // ... โค้ดส่วน drop เหมือนเดิม ...
//       setHoveredCells([]); // เคลียร์เงาเมื่อวางเรือเสร็จ
//       const offset = monitor.getClientOffset();
//       const boardElement = document.querySelector('.game-board');
//       if (boardElement && onDropShip) {
//         const rect = boardElement.getBoundingClientRect();
//         const col = Math.floor((offset.x - rect.left) / 42);
//         const row = Math.floor((offset.y - rect.top) / 42);
//         onDropShip(item, { row, col });
//       }
//     },
//     // leave: ทำงานเมื่อลาก item ออกจาก drop target
//     leave: () => {
//         setHoveredCells([]); // เคลียร์เงา
//     },
//     collect: (monitor) => ({ isOver: !!monitor.isOver() }),
//   }));

//   return (
//     <div ref={drop} className="game-board" style={{ backgroundColor: isOver ? '#00ff001a' : '#1a1d22' }}>
//       {boardData.flat().map((cellValue, i) => {
//         const rowIndex = Math.floor(i / 8);
//         const colIndex = i % 8;
//         const isHovered = hoveredCells.some(cell => cell.r === rowIndex && cell.c === colIndex);
//         return (
//             <Cell
//                 key={i}
//                 value={cellValue}
//                 isHovered={isHovered}
//                 onClick={() => onCellClick(rowIndex, colIndex)}
//             />
//         )
//       })}
//       {ships.map(ship => (
//         <div
//           key={ship.id}
//           className="placed-ship"
//           style={{ top: `${ship.position.row * 42}px`, left: `${ship.position.col * 42}px` }}
//         >
//           <DraggableShip ship={ship} onClick={onRotateShip} />
//         </div>
//       ))}
//     </div>
//   );
// };

// export default GameBoard;


// 10/8/2025 20:09 hover but not vertical

// src/components/Game.js// src/components/Game.js// src/components/GameBoard.js
// import React, { useState } from 'react'; // <-- เพิ่ม useState
// import { useDrop } from 'react-dnd';
// import { ItemTypes } from './DraggableShip';
// import DraggableShip from './DraggableShip';
// import './GameBoard.css';

// const Cell = ({ value, isHovered, onClick }) => {
//     // เพิ่ม isHovered เพื่อแสดงเงา
//     const cellClass = `cell ${value || ''} ${isHovered ? 'hover-preview' : ''}`;
//     return <div className={cellClass} onClick={onClick}></div>;
// };

// const GameBoard = ({ ships, onDropShip, onRotateShip, boardData, onCellClick }) => {
//   // State ใหม่สำหรับเก็บตำแหน่งที่กำลังลากเรือมาทับ
//   const [hoveredCells, setHoveredCells] = useState([]);

//   const [{ isOver }, drop] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     // hover: ฟังก์ชันที่จะทำงานเมื่อมี item ลากมาอยู่เหนือ drop target
//     hover: (item, monitor) => {
//         const offset = monitor.getClientOffset();
//         const boardElement = document.querySelector('.game-board');
//         if (boardElement) {
//             const rect = boardElement.getBoundingClientRect();
//             const col = Math.floor((offset.x - rect.left) / 42);
//             const row = Math.floor((offset.y - rect.top) / 42);

//             const newHoveredCells = [];
//             for (let i = 0; i < item.length; i++) {
//                 const r = item.orientation === 'horizontal' ? row : row + i;
//                 const c = item.orientation === 'horizontal' ? col + i : col;
//                 if (r >= 0 && r < 8 && c >= 0 && c < 8) {
//                     newHoveredCells.push({ r, c });
//                 }
//             }
//             setHoveredCells(newHoveredCells);
//         }
//     },
//     drop: (item, monitor) => {
//       // ... โค้ดส่วน drop เหมือนเดิม ...
//       setHoveredCells([]); // เคลียร์เงาเมื่อวางเรือเสร็จ
//       const offset = monitor.getClientOffset();
//       const boardElement = document.querySelector('.game-board');
//       if (boardElement && onDropShip) {
//         const rect = boardElement.getBoundingClientRect();
//         const col = Math.floor((offset.x - rect.left) / 42);
//         const row = Math.floor((offset.y - rect.top) / 42);
//         onDropShip(item, { row, col });
//       }
//     },
//     // leave: ทำงานเมื่อลาก item ออกจาก drop target
//     leave: () => {
//         setHoveredCells([]); // เคลียร์เงา
//     },
//     collect: (monitor) => ({ isOver: !!monitor.isOver() }),
//   }));

//   return (
//     <div ref={drop} className="game-board" style={{ backgroundColor: isOver ? '#00ff001a' : '#1a1d22' }}>
//       {boardData.flat().map((cellValue, i) => {
//         const rowIndex = Math.floor(i / 8);
//         const colIndex = i % 8;
//         const isHovered = hoveredCells.some(cell => cell.r === rowIndex && cell.c === colIndex);
//         return (
//             <Cell
//                 key={i}
//                 value={cellValue}
//                 isHovered={isHovered}
//                 onClick={() => onCellClick(rowIndex, colIndex)}
//             />
//         )
//       })}
//       {ships.map(ship => (
//         <div
//           key={ship.id}
//           className="placed-ship"
//           style={{ top: `${ship.position.row * 42}px`, left: `${ship.position.col * 42}px` }}
//         >
//           <DraggableShip ship={ship} onClick={onRotateShip} />
//         </div>
//       ))}
//     </div>
//   );
// };

// export default GameBoard;

//work but dont show color
//10/8/2025 8:57
// src/components/GameBoard.js
// src/components/GameBoard.js
// src/components/GameBoard.js// src/components/GameBoard.js// src/components/GameBoard.js
// import React, { useState } from 'react';
// import { useDrop } from 'react-dnd';
// import { ItemTypes } from './DraggableShip';
// import DraggableShip from './DraggableShip';
// import './GameBoard.css';

// const Cell = ({ value, isHovered, onClick }) => {
//     const cellClass = `cell ${value || ''} ${isHovered ? 'hover-preview' : ''}`;
//     return <div className={cellClass} onClick={onClick}></div>;
// };

// const GameBoard = ({ ships = [], onDropShip, onRotateShip, boardData = Array(8).fill(Array(8).fill(null)), onCellClick = () => {} }) => {
//   const [hoveredCells, setHoveredCells] = useState([]);

//   const [, drop] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     hover: (item, monitor) => {
//         const offset = monitor.getClientOffset();
//         const boardElement = document.querySelector('.game-board');
//         if (!boardElement) return;
        
//         const rect = boardElement.getBoundingClientRect();
//         const col = Math.floor((offset.x - rect.left) / 42);
//         const row = Math.floor((offset.y - rect.top) / 42);
            
//         const newHoveredCells = [];
//         for (let i = 0; i < item.length; i++) {
//             const r = item.orientation === 'horizontal' ? row : row + i;
//             const c = item.orientation === 'horizontal' ? col + i : col;
//             if (r >= 0 && r < 8 && c >= 0 && c < 8) {
//                 newHoveredCells.push({ r, c });
//             }
//         }
//         setHoveredCells(newHoveredCells);
//     },
//     drop: (item, monitor) => {
//       setHoveredCells([]);
//       const offset = monitor.getClientOffset();
//       const boardElement = document.querySelector('.game-board');
//       if (boardElement && onDropShip) {
//         const rect = boardElement.getBoundingClientRect();
//         const col = Math.floor((offset.x - rect.left) / 42);
//         const row = Math.floor((offset.y - rect.top) / 42);
//         onDropShip(item, { row, col });
//       }
//     },
//     leave: () => {
//         setHoveredCells([]);
//     },
//   }));

//   return (
//     <div ref={drop} className="game-board">
//       {Array.from({ length: 64 }).map((_, i) => {
//         const row = Math.floor(i / 8);
//         const col = i % 8;
//         const cellValue = boardData[row]?.[col] || null;
//         const isHovered = hoveredCells.some(cell => cell.r === row && cell.c === col);

//         return (
//           <Cell
//             key={i}
//             value={cellValue}
//             isHovered={isHovered}
//             onClick={() => onCellClick(row, col)}
//           />
//         );
//       })}

//       {ships.map(ship => (
//         <div
//           key={ship.id}
//           className="placed-ship"
//           style={{ top: `${ship.position.row * 42}px`, left: `${ship.position.col * 42}px` }}
//         >
//           <DraggableShip ship={ship} onClick={onRotateShip} />
//         </div>
//       ))}
//     </div>
//   );
// };

// export default GameBoard;



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