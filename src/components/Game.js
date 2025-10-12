// // src/components/Game.js
// import React, { useState } from 'react';
// import { socket } from '../socket';
// import GameBoard from './GameBoard';
// import './Game.css';

// function Game({ gameState, nickname }) {
//   // State สำหรับเก็บตำแหน่งเรือที่เรากำลังจะวาง (เฉพาะ Client นี้)
//   const [myShips, setMyShips] = useState([]);
//   const totalShipParts = 16; // 4 ลำ * 4 ช่อง = 16 ชิ้นส่วน

//   // --- 1. ตรวจสอบข้อมูลเบื้องต้น ---
//   if (!gameState || !gameState.players) {
//     return <div>Loading game...</div>;
//   }

//   const playerIds = Object.keys(gameState.players);
//   const myPlayerId = playerIds.find(id => gameState.players[id].nickname === nickname);
//   const opponentId = playerIds.find(id => id !== myPlayerId);

//   const me = gameState.players[myPlayerId];
//   const opponent = opponentId ? gameState.players[opponentId] : null;

//   if (!me) return <div>Initializing...</div>;

//   const isMyTurn = gameState.currentPlayerTurn === myPlayerId;

//   // --- 2. ฟังก์ชันสำหรับจัดการ Event ---
//   const handlePlacementClick = (row, col) => {
//     if (myShips.length < totalShipParts) {
//       const newPart = { row, col };
//       if (!myShips.some(part => part.row === row && part.col === col)) {
//         setMyShips([...myShips, newPart]);
//       }
//     }
//   };

//   const handleConfirmPlacement = () => {
//     if (myShips.length === totalShipParts) {
//       socket.emit('place-ships', myShips);
//     } else {
//       alert(`Please place all ${totalShipParts} ship parts.`);
//     }
//   };

//   const handleFire = (row, col) => {
//     if (isMyTurn && gameState.gameStatus === 'playing') {
//       socket.emit('fire-shot', { row, col });
//     }
//   };

//   // --- 3. เตรียมข้อมูลสำหรับแสดงผล Board ---
//   const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
//   // ในช่วงวางเรือ: แสดงเรือที่กำลังเลือก
//   if (gameState.gameStatus === 'placing') {
//     myShips.forEach(part => { myDisplayBoard[part.row][part.col] = 'ship'; });
//   } 
//   // ในช่วงเล่นเกม: แสดงเรือของตัวเอง + ผลการยิงของศัตรู
//   else {
//     me.ships.forEach(ship => { myDisplayBoard[ship.row][ship.col] = 'ship'; });
//     me.gameBoard.forEach((row, r_idx) => {
//       row.forEach((cell, c_idx) => {
//         if (cell === 'hit' || cell === 'miss') {
//           myDisplayBoard[r_idx][c_idx] = cell;
//         }
//       });
//     });
//   }

//   // --- 4. Render Component ตามสถานะของเกม ---
//   return (
//     <div className="game-container">
//       {/* ===== สถานะ: กำลังวางเรือ (Placing) ===== */}
//       {gameState.gameStatus === 'placing' && (
//         <div>
//           {me.ships.length === 0 ? (
//             <>
//               <h3>Place Your Ships ({myShips.length} / {totalShipParts} parts)</h3>
//               <GameBoard board={myDisplayBoard} onCellClick={handlePlacementClick} />
//               <button onClick={handleConfirmPlacement} disabled={myShips.length !== totalShipParts}>
//                 Confirm Placement
//               </button>
//             </>
//           ) : (
//             <h2>Waiting for {opponent?.nickname || 'opponent'} to place ships...</h2>
//           )}
//         </div>
//       )}

//       {/* ===== สถานะ: กำลังเล่น (Playing) ===== */}
//       {gameState.gameStatus === 'playing' && (
//         <>
//           <div className="turn-indicator">
//             <h2 className={isMyTurn ? 'my-turn' : ''}>
//               {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`}
//             </h2>
//           </div>
//           <div className="boards-container">
//             <div className="board-area">
//               <h3>Your Board (Score: {me.score})</h3>
//               <GameBoard board={myDisplayBoard} onCellClick={() => {}} />
//             </div>
//             <div className="board-area">
//               <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
//               {opponent ? (
//                 <GameBoard board={opponent.gameBoard} onCellClick={handleFire} />
//               ) : (
//                 <p>Waiting for opponent...</p>
//               )}
//             </div>
//           </div>
//         </>
//       )}

//       {/* ===== สถานะ: เกมจบแล้ว (Game Over) ===== */}
//       {gameState.gameStatus === 'gameover' && (
//         <div className="game-over">
//           <h1>Game Over!</h1>
//           <h2>Winner is: {gameState.players[gameState.winner]?.nickname || 'Someone'}</h2>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Game;


// // src/components/Game.js
// import React, { useState } from 'react';
// import { useDrop } from 'react-dnd';
// import { socket } from '../socket';
// import GameBoard from './GameBoard';
// import DraggableShip, { ItemTypes } from './DraggableShip';
// import './Game.css';

// // ข้อมูลเรือเริ่มต้น
// const initialShips = [
//   { id: 1, length: 4, position: null, orientation: 'horizontal' },
//   { id: 2, length: 4, position: null, orientation: 'horizontal' },
//   { id: 3, length: 4, position: null, orientation: 'horizontal' },
//   { id: 4, length: 4, position: null, orientation: 'horizontal' },
// ];

// function Game({ gameState, nickname }) {
//   const [myShips, setMyShips] = useState(initialShips);
//   const [shipOrientation, setShipOrientation] = useState('horizontal');

//   // --- Logic สำหรับการวางเรือ (Drop) ---
//   const moveShip = (shipId, newPosition) => {
//     setMyShips((prevShips) =>
//       prevShips.map((ship) =>
//         ship.id === shipId
//           ? { ...ship, position: newPosition, orientation: shipOrientation }
//           : ship
//       )
//     );
//   };

//   const [, drop] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     drop: (item, monitor) => {
//       // Logic การวางเรือจะอยู่ที่นี่ แต่เราจะทำใน GameBoard แทนเพื่อให้ได้ตำแหน่งที่แน่นอน
//     },
//   }));


//   // --- Logic เดิม แต่ปรับปรุงเล็กน้อย ---
//   if (!gameState || !gameState.players) return <div>Loading...</div>;

//   const playerIds = Object.keys(gameState.players);
//   const myPlayerId = playerIds.find(id => gameState.players[id].nickname === nickname);
//   if (!myPlayerId) return <div>Initializing...</div>;

//   const me = gameState.players[myPlayerId];
//   const opponentId = playerIds.find(id => id !== myPlayerId);
//   const opponent = opponentId ? gameState.players[opponentId] : null;

//   const isMyTurn = gameState.currentPlayerTurn === myPlayerId;

//   // --- สร้าง Array พิกัดทั้งหมดเพื่อส่งให้ Server ---
//   const handleConfirmPlacement = () => {
//     const allShipParts = [];
//     myShips.forEach(ship => {
//       if (ship.position) {
//         for (let i = 0; i < ship.length; i++) {
//           const part = {
//             row: ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i,
//             col: ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col,
//           };
//           allShipParts.push(part);
//         }
//       }
//     });

//     if (allShipParts.length === 16) {
//         socket.emit('place-ships', allShipParts);
//     } else {
//         alert('Please place all 4 ships on the board.');
//     }
//   };

//   const handleFire = (row, col) => {
//     if (isMyTurn && gameState.gameStatus === 'playing') {
//       socket.emit('fire-shot', { row, col });
//     }
//   };
  
//   // --- เตรียม Board สำหรับแสดงผล ---
//   const placementBoard = Array(8).fill(null).map(() => Array(8).fill(null));
//   myShips.forEach(ship => {
//     if (ship.position) {
//       for (let i = 0; i < ship.length; i++) {
//         const row = ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i;
//         const col = ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col;
//         if (row < 8 && col < 8) {
//           placementBoard[row][col] = 'ship';
//         }
//       }
//     }
//   });
  
//   // -- ส่วน Render --
//   return (
//     <div className="game-container" ref={drop}>
//       {gameState.gameStatus === 'placing' && (
//         <div className="placement-container">
//           {me.ships.length === 0 ? (
//             <>
//               <h3>Place Your Fleet</h3>
//               <GameBoard board={placementBoard} onDropShip={moveShip} />
//               <div className="ship-palette">
//                 <div className="ships-to-drag">
//                     {myShips.filter(s => s.position === null).map(s => <DraggableShip key={s.id} ship={s} />)}
//                 </div>
//                 <button onClick={() => setShipOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}>
//                   Rotate (Now: {shipOrientation})
//                 </button>
//               </div>
//               <button onClick={handleConfirmPlacement}>Confirm Placement</button>
//             </>
//           ) : (
//             <h2>Waiting for opponent...</h2>
//           )}
//         </div>
//       )}

//       {/* --- ส่วน Playing และ Game Over (เหมือนเดิม) --- */}
//       {gameState.gameStatus === 'playing' && (
//         <>
//             {/* ... โค้ดส่วน Playing ทั้งหมดจากขั้นตอนที่แล้ว ... */}
//         </>
//       )}
//       {gameState.gameStatus === 'gameover' && (
//         <>
//             {/* ... โค้ดส่วน Game Over ทั้งหมดจากขั้นตอนที่แล้ว ... */}
//         </>
//       )}
//     </div>
//   );
// }

// export default Game;





// //v 
// // src/components/Game.js
// import React, { useState } from 'react';
// import { socket } from '../socket';
// import GameBoard from './GameBoard';
// import DraggableShip from './DraggableShip';
// import './Game.css';

// // Initial state for the four ships
// const initialShips = [
//   { id: 1, length: 4, position: null, orientation: 'horizontal' },
//   { id: 2, length: 4, position: null, orientation: 'horizontal' },
//   { id: 3, length: 4, position: null, orientation: 'horizontal' },
//   { id: 4, length: 4, position: null, orientation: 'horizontal' },
// ];

// function Game({ gameState, nickname }) {
//   const [myShips, setMyShips] = useState(initialShips);
  
//   // --- 1. CORE VALIDATION LOGIC ---
//   const canPlaceShip = (shipToPlace, newPosition, allShips) => {
//     const { length, orientation } = shipToPlace;
//     const { row, col } = newPosition;

//     // Boundary Check: Ensure the ship does not go off the board
//     if (orientation === 'horizontal') {
//       if (col < 0 || col + length > 8) return false;
//     } else { // vertical
//       if (row < 0 || row + length > 8) return false;
//     }

//     // Collision Check: Ensure the ship does not overlap with others
//     const newParts = Array.from({ length }).map((_, i) => ({
//       row: orientation === 'horizontal' ? row : row + i,
//       col: orientation === 'horizontal' ? col + i : col,
//     }));

//     const otherShips = allShips.filter(s => s.id !== shipToPlace.id && s.position);
//     for (const otherShip of otherShips) {
//       const otherParts = Array.from({ length: otherShip.length }).map((_, i) => ({
//         row: otherShip.orientation === 'horizontal' ? otherShip.position.row : otherShip.position.row + i,
//         col: otherShip.orientation === 'horizontal' ? otherShip.position.col + i : otherShip.position.col,
//       }));
      
//       for (const newPart of newParts) {
//         if (otherParts.some(p => p.row === newPart.row && p.col === newPart.col)) {
//           return false; // Collision detected
//         }
//       }
//     }
//     return true; // Placement is valid
//   };

//   // --- 2. SHIP MANAGEMENT FUNCTIONS ---
//   const handleShipDrop = (ship, newPosition) => {
//     if (canPlaceShip(ship, newPosition, myShips)) {
//       setMyShips(ships => ships.map(s => s.id === ship.id ? { ...s, position: newPosition } : s));
//     } else {
//       console.log("Invalid placement.");
//     }
//   };

//   const handleRotatePaletteShip = (shipId) => {
//     setMyShips(ships => ships.map(s => 
//       s.id === shipId ? { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' } : s
//     ));
//   };

//   const handleConfirmPlacement = () => {
//     const placedShips = myShips.filter(s => s.position);
//     if (placedShips.length !== 4) {
//       alert('Please place all 4 ships on the board.');
//       return;
//     }
//     const allShipParts = [];
//     placedShips.forEach(ship => {
//         for (let i = 0; i < ship.length; i++) {
//             allShipParts.push({
//             row: ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i,
//             col: ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col,
//             });
//         }
//     });
//     socket.emit('place-ships', allShipParts);
//   };
  
//   // --- 3. STANDARD GAME LOGIC & RENDER ---
//   if (!gameState || !gameState.players) return <div>Loading...</div>;

//   const playerIds = Object.keys(gameState.players);
//   const myPlayerId = playerIds.find(id => gameState.players[id].nickname === nickname);
//   if (!myPlayerId) return <div>Initializing...</div>;

//   const me = gameState.players[myPlayerId];
//   const shipsOnBoard = myShips.filter(s => s.position !== null);
//   const shipsInPalette = myShips.filter(s => s.position === null);

//   // This part is for rendering the full game after placement is done
//   // It is simplified here to avoid mixing code from different stages
//   if (gameState.gameStatus !== 'placing' && me.ships.length > 0) {
//       const opponentId = playerIds.find(id => id !== myPlayerId);
//       const opponent = opponentId ? gameState.players[opponentId] : null;
//       const isMyTurn = gameState.currentPlayerTurn === myPlayerId;

//       const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
//       me.ships.forEach(ship => { myDisplayBoard[ship.row][ship.col] = 'ship'; });
//       me.gameBoard.forEach((row, r_idx) => {
//           row.forEach((cell, c_idx) => {
//           if (cell === 'hit' || cell === 'miss') {
//               myDisplayBoard[r_idx][c_idx] = cell;
//           }
//           });
//       });
      
//       const handleFire = (row, col) => {
//           if (isMyTurn && gameState.gameStatus === 'playing') {
//               socket.emit('fire-shot', { row, col });
//           }
//       };

//       return (
//         <div className="game-container">
//             {gameState.gameStatus === 'playing' && (
//                 <>
//                   <div className="turn-indicator">
//                     <h2 className={isMyTurn ? 'my-turn' : ''}>
//                       {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`}
//                     </h2>
//                   </div>
//                   <div className="boards-container">
//                     <div className="board-area">
//                       <h3>Your Board (Score: {me.score})</h3>
//                       <GameBoard ships={[]} /> {/* We draw hits/misses directly on the board now */}
//                     </div>
//                     <div className="board-area">
//                       <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
//                       {opponent ? <GameBoard ships={[]} onCellClick={handleFire} boardData={opponent.gameBoard} /> : <p>Waiting...</p>}
//                     </div>
//                   </div>
//                 </>
//             )}
//              {gameState.gameStatus === 'gameover' && ( <div className="game-over"><h1>Game Over!</h1><h2>Winner is: {gameState.players[gameState.winner]?.nickname}</h2></div>)}
//         </div>
//       );
//   }

//   // This is the renderer for the ship placement phase
//   return (
//     <div className="game-container">
//       {me.ships.length === 0 ? (
//         <div className="placement-container">
//           <h3>Place Your Fleet</h3>
//           <p>Click ships in the palette to rotate them.</p>
//           <GameBoard ships={shipsOnBoard} onDropShip={handleShipDrop} />
//           <div className="ship-palette">
//             {shipsInPalette.length > 0 ? (
//                 shipsInPalette.map(s => <DraggableShip key={s.id} ship={s} onRotate={handleRotatePaletteShip} />)
//             ) : (
//                 <p>All ships placed. Drag them on the board to reposition.</p>
//             )}
//           </div>
//           <button onClick={handleConfirmPlacement} disabled={shipsOnBoard.length !== 4}>Confirm Placement</button>
//         </div>
//       ) : (
//           <h2>Waiting for opponent to place ships...</h2>
//       )}
//     </div>
//   );
// }

// export default Game;

//v55
// src/components/Game.js
// //v 
// // src/components/Game.js
// import React, { useState } from 'react';
// import { socket } from '../socket';
// import GameBoard from './GameBoard';
// import DraggableShip from './DraggableShip';
// import './Game.css';

// // Initial state for the four ships
// const initialShips = [
//   { id: 1, length: 4, position: null, orientation: 'horizontal' },
//   { id: 2, length: 4, position: null, orientation: 'horizontal' },
//   { id: 3, length: 4, position: null, orientation: 'horizontal' },
//   { id: 4, length: 4, position: null, orientation: 'horizontal' },
// ];

// function Game({ gameState, nickname }) {
//   const [myShips, setMyShips] = useState(initialShips);
  
//   // --- 1. CORE VALIDATION LOGIC ---
//   const canPlaceShip = (shipToPlace, newPosition, allShips) => {
//     const { length, orientation } = shipToPlace;
//     const { row, col } = newPosition;

//     // Boundary Check: Ensure the ship does not go off the board
//     if (orientation === 'horizontal') {
//       if (col < 0 || col + length > 8) return false;
//     } else { // vertical
//       if (row < 0 || row + length > 8) return false;
//     }

//     // Collision Check: Ensure the ship does not overlap with others
//     const newParts = Array.from({ length }).map((_, i) => ({
//       row: orientation === 'horizontal' ? row : row + i,
//       col: orientation === 'horizontal' ? col + i : col,
//     }));

//     const otherShips = allShips.filter(s => s.id !== shipToPlace.id && s.position);
//     for (const otherShip of otherShips) {
//       const otherParts = Array.from({ length: otherShip.length }).map((_, i) => ({
//         row: otherShip.orientation === 'horizontal' ? otherShip.position.row : otherShip.position.row + i,
//         col: otherShip.orientation === 'horizontal' ? otherShip.position.col + i : otherShip.position.col,
//       }));
      
//       for (const newPart of newParts) {
//         if (otherParts.some(p => p.row === newPart.row && p.col === newPart.col)) {
//           return false; // Collision detected
//         }
//       }
//     }
//     return true; // Placement is valid
//   };

//   // --- 2. SHIP MANAGEMENT FUNCTIONS ---
//   const handleShipDrop = (ship, newPosition) => {
//     if (canPlaceShip(ship, newPosition, myShips)) {
//       setMyShips(ships => ships.map(s => s.id === ship.id ? { ...s, position: newPosition } : s));
//     } else {
//       console.log("Invalid placement.");
//     }
//   };

//   const handleRotatePaletteShip = (shipId) => {
//     setMyShips(ships => ships.map(s => 
//       s.id === shipId ? { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' } : s
//     ));
//   };

//   const handleConfirmPlacement = () => {
//     const placedShips = myShips.filter(s => s.position);
//     if (placedShips.length !== 4) {
//       alert('Please place all 4 ships on the board.');
//       return;
//     }
//     const allShipParts = [];
//     placedShips.forEach(ship => {
//         for (let i = 0; i < ship.length; i++) {
//             allShipParts.push({
//             row: ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i,
//             col: ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col,
//             });
//         }
//     });
//     socket.emit('place-ships', allShipParts);
//   };
  
//   // --- 3. STANDARD GAME LOGIC & RENDER ---
//   if (!gameState || !gameState.players) return <div>Loading...</div>;

//   const playerIds = Object.keys(gameState.players);
//   const myPlayerId = playerIds.find(id => gameState.players[id].nickname === nickname);
//   if (!myPlayerId) return <div>Initializing...</div>;

//   const me = gameState.players[myPlayerId];
//   const shipsOnBoard = myShips.filter(s => s.position !== null);
//   const shipsInPalette = myShips.filter(s => s.position === null);

//   // This part is for rendering the full game after placement is done
//   // It is simplified here to avoid mixing code from different stages
//   if (gameState.gameStatus !== 'placing' && me.ships.length > 0) {
//       const opponentId = playerIds.find(id => id !== myPlayerId);
//       const opponent = opponentId ? gameState.players[opponentId] : null;
//       const isMyTurn = gameState.currentPlayerTurn === myPlayerId;

//       const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
//       me.ships.forEach(ship => { myDisplayBoard[ship.row][ship.col] = 'ship'; });
//       me.gameBoard.forEach((row, r_idx) => {
//           row.forEach((cell, c_idx) => {
//           if (cell === 'hit' || cell === 'miss') {
//               myDisplayBoard[r_idx][c_idx] = cell;
//           }
//           });
//       });
      
//       const handleFire = (row, col) => {
//           if (isMyTurn && gameState.gameStatus === 'playing') {
//               socket.emit('fire-shot', { row, col });
//           }
//       };

//       return (
//         <div className="game-container">
//             {gameState.gameStatus === 'playing' && (
//                 <>
//                   <div className="turn-indicator">
//                     <h2 className={isMyTurn ? 'my-turn' : ''}>
//                       {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`}
//                     </h2>
//                   </div>
//                   <div className="boards-container">
//                     <div className="board-area">
//                       <h3>Your Board (Score: {me.score})</h3>
//                       <GameBoard ships={[]} /> {/* We draw hits/misses directly on the board now */}
//                     </div>
//                     <div className="board-area">
//                       <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
//                       {opponent ? <GameBoard ships={[]} onCellClick={handleFire} boardData={opponent.gameBoard} /> : <p>Waiting...</p>}
//                     </div>
//                   </div>
//                 </>
//             )}
//              {gameState.gameStatus === 'gameover' && ( <div className="game-over"><h1>Game Over!</h1><h2>Winner is: {gameState.players[gameState.winner]?.nickname}</h2></div>)}
//         </div>
//       );
//   }

//   // This is the renderer for the ship placement phase
//   return (
//     <div className="game-container">
//       {me.ships.length === 0 ? (
//         <div className="placement-container">
//           <h3>Place Your Fleet</h3>
//           <p>Click ships in the palette to rotate them.</p>
//           <GameBoard ships={shipsOnBoard} onDropShip={handleShipDrop} />
//           <div className="ship-palette">
//             {shipsInPalette.length > 0 ? (
//                 shipsInPalette.map(s => <DraggableShip key={s.id} ship={s} onRotate={handleRotatePaletteShip} />)
//             ) : (
//                 <p>All ships placed. Drag them on the board to reposition.</p>
//             )}
//           </div>
//           <button onClick={handleConfirmPlacement} disabled={shipsOnBoard.length !== 4}>Confirm Placement</button>
//         </div>
//       ) : (
//           <h2>Waiting for opponent to place ships...</h2>
//       )}
//     </div>
//   );
// }

// export default Game;





///////------------------------------------------------------------------------------------------------------------------------------------------------------------------

// import React, { useState } from 'react'; 
// import { useDrop } from 'react-dnd';
// import { socket } from '../socket';
// import GameBoard from './GameBoard';
// import DraggableShip from './DraggableShip';
// import './Game.css';

// // Initial state for the four ships
// const initialShips = [
//   { id: 1, length: 4, position: null, orientation: 'horizontal' },
//   { id: 2, length: 4, position: null, orientation: 'horizontal' },
//   { id: 3, length: 4, position: null, orientation: 'horizontal' },
//   { id: 4, length: 4, position: null, orientation: 'horizontal' },
// ];

// function Game({ gameState, nickname }) {
//   // const [myShips, setMyShips] = useState(initialShips);
//   const [myShips, setMyShips] = useState([]);

//   // Reset ships state when starting a new placement phase
//   useEffect(() => {
//     if (gameState?.gameStatus === 'placing' && myShips.length === 0) {
//       setMyShips(initialShips);
//     }
//   }, [gameState?.gameStatus, myShips.length]);
  
  
//   // --- 1. CORE VALIDATION LOGIC ---
//   const canPlaceShip = (shipToPlace, newPosition, allShips) => {
//     const { length, orientation } = shipToPlace;
//     const { row, col } = newPosition;

//     // Boundary Check: Ensure the ship does not go off the board
//     if (orientation === 'horizontal') {
//       if (col < 0 || col + length > 8) return false;
//     } else { // vertical
//       if (row < 0 || row + length > 8) return false;
//     }

//     // Collision Check: Ensure the ship does not overlap with others
//     const newParts = Array.from({ length }).map((_, i) => ({
//       row: orientation === 'horizontal' ? row : row + i,
//       col: orientation === 'horizontal' ? col + i : col,
//     }));

//     const otherShips = allShips.filter(s => s.id !== shipToPlace.id && s.position);
//     for (const otherShip of otherShips) {
//       const otherParts = Array.from({ length: otherShip.length }).map((_, i) => ({
//         row: otherShip.orientation === 'horizontal' ? otherShip.position.row : otherShip.position.row + i,
//         col: otherShip.orientation === 'horizontal' ? otherShip.position.col + i : otherShip.position.col,
//       }));
      
//       for (const newPart of newParts) {
//         if (otherParts.some(p => p.row === newPart.row && p.col === newPart.col)) {
//           return false; // Collision detected
//         }
//       }
//     }
//     return true; // Placement is valid
//   };

//   // --- 2. SHIP MANAGEMENT FUNCTIONS ---
//   const handleShipDrop = (ship, newPosition) => {
//     if (canPlaceShip(ship, newPosition, myShips)) {
//       setMyShips(ships => ships.map(s => s.id === ship.id ? { ...s, position: newPosition } : s));
//     } else {
//       console.log("Invalid placement.");
//     }
//   };

//   const handleRotatePaletteShip = (shipId) => {
//     setMyShips(ships => ships.map(s => 
//       s.id === shipId ? { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' } : s
//     ));
//   };

//   const handleConfirmPlacement = () => {
//     const placedShips = myShips.filter(s => s.position);
//     if (placedShips.length !== 4) {
//       alert('Please place all 4 ships on the board.');
//       return;
//     }
//     const allShipParts = [];
//     placedShips.forEach(ship => {
//         for (let i = 0; i < ship.length; i++) {
//             allShipParts.push({
//             row: ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i,
//             col: ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col,
//             });
//         }
//     });
//     socket.emit('place-ships', allShipParts);
//   };
  
//   // --- 3. STANDARD GAME LOGIC & RENDER ---
//   if (!gameState || !gameState.players) return <div>Loading...</div>;

//   const playerIds = Object.keys(gameState.players);
//   const myPlayerId = playerIds.find(id => gameState.players[id].nickname === nickname);
//   if (!myPlayerId) return <div>Initializing...</div>;

//   const me = gameState.players[myPlayerId];
//   const shipsOnBoard = myShips.filter(s => s.position !== null);
//   const shipsInPalette = myShips.filter(s => s.position === null);

//   // This part is for rendering the full game after placement is done
//   // It is simplified here to avoid mixing code from different stages
//   if (gameState.gameStatus !== 'placing' && me.ships.length > 0) {
//       const opponentId = playerIds.find(id => id !== myPlayerId);
//       const opponent = opponentId ? gameState.players[opponentId] : null;
//       const isMyTurn = gameState.currentPlayerTurn === myPlayerId;

//       const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
//       me.ships.forEach(ship => { myDisplayBoard[ship.row][ship.col] = 'ship'; });
//       me.gameBoard.forEach((row, r_idx) => {
//           row.forEach((cell, c_idx) => {
//           if (cell === 'hit' || cell === 'miss') {
//               myDisplayBoard[r_idx][c_idx] = cell;
//           }
//           });
//       });
      
//       const handleFire = (row, col) => {
//           if (isMyTurn && gameState.gameStatus === 'playing') {
//               socket.emit('fire-shot', { row, col });
//           }
//       };

//       return (
//         <div className="game-container">
//             {gameState.gameStatus === 'playing' && (
//                 <>
//                   <div className="turn-indicator">
//                     <h2 className={isMyTurn ? 'my-turn' : ''}>
//                       {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`}
//                     </h2>
//                   </div>
//                   <div className="boards-container">
//                     <div className="board-area">
//                       <h3>Your Board (Score: {me.score})</h3>
//                       <GameBoard ships={[]} /> {/* We draw hits/misses directly on the board now */}
//                     </div>
//                     <div className="board-area">
//                       <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
//                       {opponent ? <GameBoard ships={[]} onCellClick={handleFire} boardData={opponent.gameBoard} /> : <p>Waiting...</p>}
//                     </div>
//                   </div>
//                 </>
//             )}
//              {gameState.gameStatus === 'gameover' && ( <div className="game-over"><h1>Game Over!</h1><h2>Winner is: {gameState.players[gameState.winner]?.nickname}</h2></div>)}
//         </div>
//       );
//   }

//   // This is the renderer for the ship placement phase
//   return (
//     <div className="game-container">
//       {me.ships.length === 0 ? (
//         <div className="placement-container">
//           <h3>Place Your Fleet</h3>
//           <p>Click ships in the palette to rotate them.</p>
//           <GameBoard ships={shipsOnBoard} onDropShip={handleShipDrop} />
//           <div className="ship-palette">
//             {shipsInPalette.length > 0 ? (
//                 shipsInPalette.map(s => <DraggableShip key={s.id} ship={s} onRotate={handleRotatePaletteShip} />)
//             ) : (
//                 <p>All ships placed. Drag them on the board to reposition.</p>
//             )}
//           </div>
//           <button onClick={handleConfirmPlacement} disabled={shipsOnBoard.length !== 4}>Confirm Placement</button>
//         </div>
//       ) : (
//           <h2>Waiting for opponent to place ships...</h2>
//       )}
//     </div>
//   );
// }

// export default Game;
// //-------------------------------------------------------------------------------------------------------------------------------
// // import React, { useState, useEffect } from 'react';
// // import { useDrop } from 'react-dnd'; // <-- เพิ่ม useDrop ที่นี่
// // import { socket } from '../socket';
// // import GameBoard from './GameBoard';
// // import DraggableShip, { ItemTypes } from './DraggableShip';
// // import './Game.css';

// // const initialShips = [
// //   { id: 1, length: 4, position: null, orientation: 'horizontal' },
// //   { id: 2, length: 4, position: null, orientation: 'horizontal' },
// //   { id: 3, length: 4, position: null, orientation: 'horizontal' },
// //   { id: 4, length: 4, position: null, orientation: 'horizontal' },
// // ];

// function Game({ gameState, nickname }) {
//   const [myShips, setMyShips] = useState([]);

//   // Reset ships state when starting a new placement phase
//   useEffect(() => {
//     if (gameState?.gameStatus === 'placing' && myShips.length === 0) {
//       setMyShips(initialShips);
//     }
//   }, [gameState?.gameStatus, myShips.length]);

//   const canPlaceShip = (shipToPlace, newPosition, allShips) => {
//     // ... โค้ด canPlaceShip ที่ถูกต้องและสมบูรณ์จากขั้นตอนก่อนหน้า ...
//     // (สำคัญ: ใช้โค้ด canPlaceShip จากคำตอบก่อนหน้านี้ที่แก้ปัญหาการทับซ้อน)
//     const { length, orientation } = shipToPlace;
//     const { row, col } = newPosition;

//     if (orientation === 'horizontal') {
//       if (col < 0 || col + length > 8 || row < 0 || row > 7) return false;
//     } else { // vertical
//       if (row < 0 || row + length > 8 || col < 0 || col > 7) return false;
//     }

//     const newParts = Array.from({ length }).map((_, i) => ({
//       row: orientation === 'horizontal' ? row : row + i,
//       col: orientation === 'horizontal' ? col + i : col,
//     }));

//     const otherShips = allShips.filter(s => s.id !== shipToPlace.id && s.position);
//     for (const otherShip of otherShips) {
//       const otherParts = Array.from({ length: otherShip.length }).map((_, i) => ({
//         row: otherShip.orientation === 'horizontal' ? otherShip.position.row : otherShip.position.row + i,
//         col: otherShip.orientation === 'horizontal' ? otherShip.position.col + i : otherShip.position.col,
//       }));
//       for (const newPart of newParts) {
//         if (otherParts.some(p => p.row === newPart.row && p.col === newPart.col)) {
//           return false;
//         }
//       }
//     }
//     return true;
//   };

//   const handleShipDrop = (ship, newPosition) => {
//     if (canPlaceShip(ship, newPosition, myShips)) {
//       setMyShips(ships => ships.map(s => s.id === ship.id ? { ...s, position: newPosition } : s));
//     }
//   };

//   const handleRotateShip = (shipId) => {
//     setMyShips(ships => ships.map(s => {
//       if (s.id === shipId) {
//         const newOrientation = s.orientation === 'horizontal' ? 'vertical' : 'horizontal';
//         if (s.position && !canPlaceShip({ ...s, orientation: newOrientation }, s.position, ships)) {
//           return s; // หมุนไม่ได้
//         }
//         return { ...s, orientation: newOrientation };
//       }
//       return s;
//     }));
//   };
  
//   // Logic สำหรับคืนเรือไปที่อู่
//   const [, dropPalette] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     drop: (item) => {
//       setMyShips(ships => ships.map(s => s.id === item.id ? { ...s, position: null } : s));
//     },
//   }));

//   const handleConfirmPlacement = () => {
//      // ... โค้ดเดิม ...
//   };
  
//   // ... ส่วน Logic เดิม (หาผู้เล่น, ยิง, ฯลฯ) ...

//   const shipsOnBoard = myShips.filter(s => s.position !== null);
//   const shipsInPalette = myShips.filter(s => s.position === null);

//   // ... ส่วน Render ...
//   return (
//     <div className="game-container">
//       {gameState.gameStatus === 'placing' && me.ships.length === 0 && (
//         <div className="placement-container">
//           <h3>Place Your Fleet (Click to rotate)</h3>
//           <GameBoard ships={shipsOnBoard} onDropShip={handleShipDrop} onRotateShip={handleRotateShip} />
//           <div className="ship-palette" ref={dropPalette}>
//             {shipsInPalette.length > 0 ? (
//                 shipsInPalette.map(s => <DraggableShip key={s.id} ship={s} onClick={handleRotateShip} />)
//             ) : (
//                 <p>All ships placed. Drag ships to reposition or back here to un-place.</p>
//             )}
//           </div>
//           <button onClick={handleConfirmPlacement} disabled={shipsOnBoard.length !== 4}>Confirm Placement</button>
//         </div>
//       )}
        
//       {/* ... โค้ดส่วน Playing และ Game Over เหมือนเดิม ... */}
//     </div>
//   );
// }

// // export default Game;



////----------------------------------------------------------------------------------------------------------------------------------------------------------------------

// // src/components/Game.js
// import React, { useState, useEffect } from 'react';
// import { useDrop } from 'react-dnd';
// import { socket } from '../socket';
// import GameBoard from './GameBoard';
// import DraggableShip, { ItemTypes } from './DraggableShip';
// import './Game.css';

// const initialShips = [
//   { id: 1, length: 4, position: null, orientation: 'horizontal' },
//   { id: 2, length: 4, position: null, orientation: 'horizontal' },
//   { id: 3, length: 4, position: null, orientation: 'horizontal' },
//   { id: 4, length: 4, position: null, orientation: 'horizontal' },
// ];

// function Game({ gameState, nickname }) {
//   const [myShips, setMyShips] = useState(initialShips);

//   useEffect(() => {
//     if (gameState?.gameStatus === 'placing' && me?.ships.length === 0) {
//       setMyShips(initialShips);
//     }
//   }, [gameState, nickname]);


//   // --- ส่วน Logic ทั้งหมด (canPlaceShip, handleShipDrop, ฯลฯ) เหมือนเดิม ---
//   // ... (วางโค้ดส่วน Logic ทั้งหมดของคุณจากไฟล์เดิมไว้ตรงนี้) ...
//   const canPlaceShip = (shipToPlace, newPosition, allShips) => {
//     const { length, orientation } = shipToPlace;
//     const { row, col } = newPosition;

//     if (orientation === 'horizontal') {
//       if (col < 0 || col + length > 8 || row < 0 || row > 7) return false;
//     } else { // vertical
//       if (row < 0 || row + length > 8 || col < 0 || col > 7) return false;
//     }

//     const newParts = Array.from({ length }).map((_, i) => ({
//       row: orientation === 'horizontal' ? row : row + i,
//       col: orientation === 'horizontal' ? col + i : col,
//     }));

//     const otherShips = allShips.filter(s => s.id !== shipToPlace.id && s.position);
//     for (const otherShip of otherShips) {
//       const otherParts = Array.from({ length: otherShip.length }).map((_, i) => ({
//         row: otherShip.orientation === 'horizontal' ? otherShip.position.row : otherShip.position.row + i,
//         col: otherShip.orientation === 'horizontal' ? otherShip.position.col + i : otherShip.position.col,
//       }));
//       for (const newPart of newParts) {
//         if (otherParts.some(p => p.row === newPart.row && p.col === newPart.col)) {
//           return false;
//         }
//       }
//     }
//     return true;
//   };

//   const handleShipDrop = (ship, newPosition) => {
//     if (canPlaceShip(ship, newPosition, myShips)) {
//       setMyShips(ships => ships.map(s => s.id === ship.id ? { ...s, position: newPosition } : s));
//     }
//   };

//   const handleRotateShip = (shipId) => {
//     setMyShips(ships => ships.map(s => {
//       if (s.id === shipId) {
//         const newOrientation = s.orientation === 'horizontal' ? 'vertical' : 'horizontal';
//         if (s.position && !canPlaceShip({ ...s, orientation: newOrientation }, s.position, ships)) {
//           return s; // หมุนไม่ได้
//         }
//         return { ...s, orientation: newOrientation };
//       }
//       return s;
//     }));
//   };
  
//   const [, dropPalette] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     drop: (item) => {
//       setMyShips(ships => ships.map(s => s.id === item.id ? { ...s, position: null } : s));
//     },
//   }));

//   const handleConfirmPlacement = () => {
//     const placedShips = myShips.filter(s => s.position);
//     if (placedShips.length !== 4) {
//       alert('Please place all 4 ships on the board.');
//       return;
//     }
//     const allShipParts = [];
//     placedShips.forEach(ship => {
//       for (let i = 0; i < ship.length; i++) {
//         allShipParts.push({
//           row: ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i,
//           col: ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col,
//         });
//       }
//     });
//     socket.emit('place-ships', allShipParts);
//   };
  
  
//   if (!gameState || !gameState.players) return <div>Loading...</div>;

//   const playerIds = Object.keys(gameState.players);
//   const myPlayerId = playerIds.find(id => gameState.players[id].nickname === nickname);
//   if (!myPlayerId) return <div>Initializing...</div>;

//   const me = gameState.players[myPlayerId];
//   const shipsOnBoard = myShips.filter(s => s.position !== null);
//   const shipsInPalette = myShips.filter(s => s.position === null);

//   // --- ส่วน Render ที่แก้ไข Logic การแสดงผลใหม่ทั้งหมด ---
//   return (
//     <div className="game-container">

//       {/* ===== สถานะ: รอผู้เล่น (Waiting) ===== */}
//       {gameState.gameStatus === 'waiting' && (
//         <div className="waiting-room">
//           <h2>Welcome, {nickname}!</h2>
//           <h3>Waiting for another player to join...</h3>
//         </div>
//       )}

//       {/* ===== สถานะ: กำลังวางเรือ (Placing) ===== */}
//       {gameState.gameStatus === 'placing' && (
//         me.ships.length === 0 ? (
//           <div className="placement-container">
//             <h3>Place Your Fleet (Click to rotate)</h3>
//             <GameBoard ships={shipsOnBoard} onDropShip={handleShipDrop} onRotateShip={handleRotateShip} />
//             <div className="ship-palette" ref={dropPalette}>
//               {shipsInPalette.length > 0 ? (
//                   shipsInPalette.map(s => <DraggableShip key={s.id} ship={s} onClick={handleRotateShip} />)
//               ) : (
//                   <p>All ships placed. Drag to reposition or back here to un-place.</p>
//               )}
//             </div>
//             <button onClick={handleConfirmPlacement} disabled={shipsOnBoard.length !== 4}>Confirm Placement</button>
//           </div>
//         ) : (
//           <h2>Waiting for opponent to place ships...</h2>
//         )
//       )}

//       {/* ===== สถานะ: กำลังเล่น (Playing) และจบเกม (Game Over) ===== */}
//       {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'gameover') && (
//         // ... (วางโค้ดส่วนแสดงผลตอนเล่นเกมและจบเกมทั้งหมดไว้ที่นี่) ...
//         // เริ่มจากส่วนที่หา opponent
//         (() => {
//             const opponentId = playerIds.find(id => id !== myPlayerId);
//             const opponent = opponentId ? gameState.players[opponentId] : null;
//             const isMyTurn = gameState.currentPlayerTurn === myPlayerId;

//             const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
//             me.ships.forEach(ship => { myDisplayBoard[ship.row][ship.col] = 'ship'; });
//             me.gameBoard.forEach((row, r_idx) => {
//                 row.forEach((cell, c_idx) => {
//                 if (cell === 'hit' || cell === 'miss') {
//                     myDisplayBoard[r_idx][c_idx] = cell;
//                 }
//                 });
//             });

//             const handleFire = (row, col) => {
//                 if (isMyTurn && gameState.gameStatus === 'playing') {
//                 socket.emit('fire-shot', { row, col });
//                 }
//             };
//             return (
//                 <>
//                 {gameState.gameStatus === 'playing' && (
//                     <>
//                         <div className="turn-indicator">
//                             <h2 className={isMyTurn ? 'my-turn' : ''}>
//                             {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`}
//                             </h2>
//                             <div className="timer">Time Left: {gameState.timer}</div>
//                         </div>
//                         <div className="boards-container">
//                             <div className="board-area">
//                                 <h3>Your Board (Score: {me.score})</h3>
//                                 <GameBoard ships={[]} boardData={myDisplayBoard} />
//                             </div>
//                             <div className="board-area">
//                                 <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
//                                 {opponent ? <GameBoard ships={[]} onCellClick={handleFire} boardData={opponent.gameBoard} /> : <p>Waiting...</p>}
//                             </div>
//                         </div>
//                     </>
//                 )}
//                 {gameState.gameStatus === 'gameover' && (<div className="game-over"><h1>Game Over!</h1><h2>Winner is: {gameState.players[gameState.winner]?.nickname}</h2></div>)}
//                 </>
//             )
//         })()
//       )}
//     </div>
//   );
// }

// export default Game;


// 10/8/2025  18:51

// src/components/Game.js
// src/components/Game.js
// src/components/Game.js// src/components/Game.js


// src/components/Game.js
// // src/components/Game.js
// import React, { useState, useEffect } from 'react';
// import { useDrop } from 'react-dnd';
// import { socket } from '../socket';
// import GameBoard from './GameBoard';
// import DraggableShip, { ItemTypes } from './DraggableShip';
// import './Game.css';

// // ... (initialShips constant remains the same)
// const initialShips = [
//   { id: 1, length: 4, position: null, orientation: 'horizontal' },
//   { id: 2, length: 4, position: null, orientation: 'horizontal' },
//   { id: 3, length: 4, position: null, orientation: 'horizontal' },
//   { id: 4, length: 4, position: null, orientation: 'horizontal' },
// ];

// function Game({ gameState, nickname }) {
//   // ... (All state hooks and helper functions like validateBoard, handleShipDrop, etc., remain the same as the previous correct version)
//   const [myShips, setMyShips] = useState(initialShips);
//   const [isPlacementValid, setIsPlacementValid] = useState(false);

//   const myPlayerId = gameState?.players ? Object.keys(gameState.players).find(id => gameState.players[id].nickname === nickname) : null;
//   const me = myPlayerId ? gameState.players[myPlayerId] : null;
  
//   const validateBoard = (allShips) => {
//     const placedShips = allShips.filter(s => s.position);
//     if (placedShips.length !== 4) return false;

//     const allOccupiedCells = new Set();
//     for (const ship of placedShips) {
//       for (let i = 0; i < ship.length; i++) {
//         const row = ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i;
//         const col = ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col;
//         const coord = `${row},${col}`;

//         if (allOccupiedCells.has(coord) || row < 0 || row > 7 || col < 0 || col > 7) {
//             return false;
//         }
//         allOccupiedCells.add(coord);
//       }
//     }
//     return true;
//   };
  
//   useEffect(() => {
//     setIsPlacementValid(validateBoard(myShips));
//   }, [myShips]);

//   useEffect(() => {
//     if (gameState?.gameStatus === 'waiting' || (gameState?.gameStatus === 'placing' && me?.ships.length === 0)) {
//         if (!myShips.some(s => s.position !== null)) {
//             setMyShips(initialShips);
//         }
//     }
//   }, [gameState, me]);

//   const handleShipDrop = (droppedShip, newPosition) => {
//     setMyShips(currentShips =>
//       currentShips.map(ship =>
//         ship.id === droppedShip.id ? { ...ship, position: newPosition } : ship
//       )
//     );
//   };

//   const handleRotateShip = (shipId) => {
//     setMyShips(ships => ships.map(s => {
//       if (s.id === shipId) {
//         return { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' };
//       }
//       return s;
//     }));
//   };

//   const [, dropPalette] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     drop: (item) => { setMyShips(ships => ships.map(s => s.id === item.id ? { ...s, position: null } : s)) },
//   }));

//   const handleConfirmPlacement = () => {
//     if (!isPlacementValid) {
//       alert('Invalid ship placement. All 4 ships must be on the board and cannot overlap.');
//       return;
//     }
//     const allShipParts = [];
//     myShips.filter(s => s.position).forEach(ship => {
//       for (let i = 0; i < ship.length; i++) {
//         allShipParts.push({
//           row: ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i,
//           col: ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col,
//         });
//       }
//     });
//     socket.emit('place-ships', allShipParts);
//   };


//   // --- RENDER LOGIC (Corrected and Simplified) ---
//   if (!gameState || !me) return <div>Loading or connecting...</div>;

//   // RENDER: WAITING ROOM
//   if (gameState.gameStatus === 'waiting') {
//     return (
//       <div className="waiting-room">
//         <h2>Welcome, {nickname}!</h2>
//         <h3>Waiting for another player to join...</h3>
//       </div>
//     );
//   }

//   // RENDER: PLACEMENT PHASE
//   if (gameState.gameStatus === 'placing') {
//     // If you have already submitted your ships, show a waiting message
//     if (me.ships.length > 0) {
//       return <h2>Waiting for opponent to place ships...</h2>;
//     }
//     // Otherwise, show the placement board
//     return (
//       <div className="placement-container">
//         <h3>Place Your Fleet (Click ship to rotate)</h3>
//         <GameBoard
//           ships={myShips.filter(s => s.position !== null)}
//           onDropShip={handleShipDrop}
//           onRotateShip={handleRotateShip}
//         />
//         <div className="ship-palette" ref={dropPalette}>
//           {myShips.filter(s => s.position === null).map(s => <DraggableShip key={s.id} ship={s} onClick={handleRotateShip} />)}
//         </div>
//         <button onClick={handleConfirmPlacement} disabled={!isPlacementValid}>
//           Confirm Placement
//         </button>
//       </div>
//     );
//   }

//   // RENDER: PLAYING & GAME OVER PHASES
//   if (gameState.gameStatus === 'playing' || gameState.gameStatus === 'gameover') {
//     const opponentId = Object.keys(gameState.players).find(id => id !== myPlayerId);
//     const opponent = opponentId ? gameState.players[opponentId] : null;
//     const isMyTurn = gameState.currentPlayerTurn === myPlayerId;
    
//     // Create your board display data (ships + hits/misses)
//     const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
//     me.ships.forEach(part => { myDisplayBoard[part.row][part.col] = 'ship'; });
//     me.gameBoard.forEach((row, r_idx) => {
//       row.forEach((cell, c_idx) => {
//         if (cell) myDisplayBoard[r_idx][c_idx] = cell;
//       });
//     });

//     const handleFire = (row, col) => {
//       if (isMyTurn && gameState.gameStatus === 'playing' && !opponent.gameBoard[row][col]) {
//         socket.emit('fire-shot', { row, col });
//       }
//     };
    
//     if (gameState.gameStatus === 'playing') {
//         return (
//             <div className="playing-container">
//                 <div className="turn-indicator">
//                     <h2 className={isMyTurn ? 'my-turn' : ''}> {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`} </h2>
//                     <div className="timer">Time Left: {gameState.timer}</div>
//                 </div>
//                 <div className="boards-container">
//                     <div className="board-area">
//                         <h3>Your Board (Score: {me.score})</h3>
//                         <GameBoard ships={[]} boardData={myDisplayBoard} onCellClick={() => {}} />
//                     </div>
//                     <div className="board-area">
//                         <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
//                         {opponent ? <GameBoard ships={[]} onCellClick={handleFire} boardData={opponent.gameBoard} /> : <p>Waiting...</p>}
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     if (gameState.gameStatus === 'gameover') {
//         return (
//             <div className="game-over">
//                 <h1>Game Over!</h1>
//                 <h2>Winner is: {gameState.players[gameState.winner]?.nickname}</h2>
//             </div>
//         );
//     }
//   }

//   return <div>Unhandled game state: {gameState.gameStatus}</div>;
// }

// export default Game;


//10/8/2025 9:05
// src/components/Game.js
// src/components/Game.js
// src/components/Game.js
// import React, { useState, useEffect } from 'react';
// import { useDrop } from 'react-dnd';
// import { socket } from '../socket';
// import GameBoard from './GameBoard';
// import DraggableShip, { ItemTypes } from './DraggableShip';
// import './Game.css';

// const initialShips = [
//   { id: 1, length: 4, position: null, orientation: 'horizontal' },
//   { id: 2, length: 4, position: null, orientation: 'horizontal' },
//   { id: 3, length: 4, position: null, orientation: 'horizontal' },
//   { id: 4, length: 4, position: null, orientation: 'horizontal' },
// ];

// function Game({ gameState, nickname }) {
//   const [myShips, setMyShips] = useState(initialShips);
//   const [isPlacementValid, setIsPlacementValid] = useState(false);

//   const myPlayerId = gameState?.players ? Object.keys(gameState.players).find(id => gameState.players[id].nickname === nickname) : null;
//   const me = myPlayerId ? gameState.players[myPlayerId] : null;

//   const validateBoard = (allShips) => {
//     const placedShips = allShips.filter(s => s.position);
//     if (placedShips.length !== 4) return false;

//     const allOccupiedCells = new Set();
//     for (const ship of placedShips) {
//       for (let i = 0; i < ship.length; i++) {
//         const row = ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i;
//         const col = ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col;
//         const coord = `${row},${col}`;
//         if (allOccupiedCells.has(coord) || row < 0 || row > 7 || col < 0 || col > 7) return false;
//         allOccupiedCells.add(coord);
//       }
//     }
//     return true;
//   };

//   useEffect(() => {
//     setIsPlacementValid(validateBoard(myShips));
//   }, [myShips]);

//   useEffect(() => {
//     if (gameState?.gameStatus === 'waiting' || (gameState?.gameStatus === 'placing' && me?.ships.length === 0)) {
//         setMyShips(initialShips);
//     }
//   }, [gameState, me]);

//   const handleShipDrop = (droppedShip, newPosition) => {
//     setMyShips(currentShips =>
//       currentShips.map(ship =>
//         ship.id === droppedShip.id ? { ...ship, position: newPosition } : ship
//       )
//     );
//   };

//   const handleRotateShip = (shipId) => {
//     setMyShips(ships => ships.map(s => {
//       if (s.id === shipId) {
//         return { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' };
//       }
//       return s;
//     }));
//   };

//   const [, dropPalette] = useDrop(() => ({
//     accept: ItemTypes.SHIP,
//     drop: (item) => { setMyShips(ships => ships.map(s => s.id === item.id ? { ...s, position: null } : s)) },
//   }));

//   const handleConfirmPlacement = () => {
//     if (!isPlacementValid) {
//       alert('Invalid ship placement. All 4 ships must be on the board and cannot overlap.');
//       return;
//     }
//     const allShipParts = [];
//     myShips.filter(s => s.position).forEach(ship => {
//       for (let i = 0; i < ship.length; i++) {
//         allShipParts.push({
//           row: ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i,
//           col: ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col,
//         });
//       }
//     });
//     socket.emit('place-ships', allShipParts);
//   };

//   if (!gameState || !me) return <div>Loading or connecting...</div>;

//   if (gameState.gameStatus === 'waiting') {
//     return (
//       <div className="waiting-room">
//         <h2>Welcome, {nickname}!</h2>
//         <h3>Waiting for another player to join...</h3>
//       </div>
//     );
//   }

//   if (gameState.gameStatus === 'placing') {
//     if (me.ships.length > 0) {
//       return <h2>Waiting for opponent to place ships...</h2>;
//     }
//     return (
//       <div className="placement-container">
//         <h3>Place Your Fleet (Click ship to rotate)</h3>
//         <GameBoard
//           ships={myShips.filter(s => s.position !== null)}
//           onDropShip={handleShipDrop}
//           onRotateShip={handleRotateShip}
//         />
//         <div className="ship-palette" ref={dropPalette}>
//           {myShips.filter(s => s.position === null).map(s => <DraggableShip key={s.id} ship={s} onClick={handleRotateShip} />)}
//         </div>
//         <button onClick={handleConfirmPlacement} disabled={!isPlacementValid}>
//           Confirm Placement
//         </button>
//       </div>
//     );
//   }

//   if (gameState.gameStatus === 'playing' || gameState.gameStatus === 'gameover') {
//     const opponentId = Object.keys(gameState.players).find(id => id !== myPlayerId);
//     const opponent = opponentId ? gameState.players[opponentId] : null;
//     const isMyTurn = gameState.currentPlayerTurn === myPlayerId;
    
//     const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
//     me.ships.forEach(part => { myDisplayBoard[part.row][part.col] = 'ship'; });
//     me.gameBoard.forEach((row, r_idx) => {
//       row.forEach((cell, c_idx) => { if (cell) myDisplayBoard[r_idx][c_idx] = cell; });
//     });

//     const handleFire = (row, col) => {
//       if (isMyTurn && gameState.gameStatus === 'playing' && opponent && !opponent.gameBoard[row][col]) {
//         socket.emit('fire-shot', { row, col });
//       }
//     };
    
//     if (gameState.gameStatus === 'playing') {
//         return (
//             <div className="playing-container">
//                 <div className="turn-indicator">
//                     <h2 className={isMyTurn ? 'my-turn' : ''}> {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`} </h2>
//                     <div className="timer">Time Left: {gameState.timer}</div>
//                 </div>
//                 <div className="boards-container">
//                     <div className="board-area">
//                         <h3>Your Board (Score: {me.score})</h3>
//                         <GameBoard ships={[]} boardData={myDisplayBoard} />
//                     </div>
//                     <div className="board-area">
//                         <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
//                         {opponent ? <GameBoard ships={[]} onCellClick={handleFire} boardData={opponent.gameBoard} /> : <p>Waiting...</p>}
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     if (gameState.gameStatus === 'gameover') {
//         return (
//             <div className="game-over">
//                 <h1>Game Over!</h1>
//                 <h2>Winner is: {gameState.players[gameState.winner]?.nickname}</h2>
//             </div>
//         );
//     }
//   }

//   return <em>Unhandled game state: {gameState.gameStatus}</em>;
// }

// export default Game;





// src/components/GameBoard.js// src/components/Game.js
import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { socket } from '../socket';
import GameBoard from './GameBoard';
import DraggableShip, { ItemTypes } from './DraggableShip';
import './Game.css';

const initialShips = [
  { id: 1, length: 4, position: null, orientation: 'horizontal', image: '/images/shipRed.png' },
  { id: 2, length: 4, position: null, orientation: 'horizontal', image: '/images/shipRed.png' },
  { id: 3, length: 4, position: null, orientation: 'horizontal', image: '/images/shipRed.png' },
  { id: 4, length: 4, position: null, orientation: 'horizontal', image: '/images/shipRed.png' },
];


function Game({ gameState, nickname }) {
  const [myShips, setMyShips] = useState(initialShips);
  const [isPlacementValid, setIsPlacementValid] = useState(false);

  const myPlayerId = gameState?.players ? Object.keys(gameState.players).find(id => gameState.players[id].nickname === nickname) : null;
  const me = myPlayerId ? gameState.players[myPlayerId] : null;

  const validateBoard = (allShips) => {
    const placedShips = allShips.filter(s => s.position);
    if (placedShips.length !== 4) return false;

    const allOccupiedCells = new Set();
    for (const ship of placedShips) {
      for (let i = 0; i < ship.length; i++) {
        const row = ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i;
        const col = ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col;
        const coord = `${row},${col}`;
        if (allOccupiedCells.has(coord) || row < 0 || row > 7 || col < 0 || col > 7) return false;
        allOccupiedCells.add(coord);
      }
    }
    return true;
  };

  useEffect(() => {
    setIsPlacementValid(validateBoard(myShips));
  }, [myShips]);

  useEffect(() => {
    if (gameState?.gameStatus === 'waiting' || (gameState?.gameStatus === 'placing' && me?.ships.length === 0)) {
        setMyShips(initialShips);
    }
  }, [gameState, me]);

  const handleShipDrop = (droppedShip, newPosition) => {
    setMyShips(currentShips =>
      currentShips.map(ship =>
        ship.id === droppedShip.id ? { ...ship, position: newPosition } : ship
      )
    );
  };

  const handleRotateShip = (shipId) => {
    setMyShips(ships => ships.map(s => {
      if (s.id === shipId) {
        return { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' };
      }
      return s;
    }));
  };

  const [, dropPalette] = useDrop(() => ({
    accept: ItemTypes.SHIP,
    drop: (item) => { setMyShips(ships => ships.map(s => s.id === item.id ? { ...s, position: null } : s)) },
  }));

  const handleConfirmPlacement = () => {
    if (!isPlacementValid) {
      alert('Invalid ship placement. All 4 ships must be on the board and cannot overlap.');
      return;
    }
    const allShipParts = [];
    myShips.filter(s => s.position).forEach(ship => {
      for (let i = 0; i < ship.length; i++) {
        allShipParts.push({
          row: ship.orientation === 'horizontal' ? ship.position.row : ship.position.row + i,
          col: ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col,
        });
      }
    });
    socket.emit('place-ships', allShipParts);
  };

  if (!gameState || !me) return <div>Loading or connecting...</div>;

  if (gameState.gameStatus === 'waiting') {
    return (
      <div className="waiting-room">
        <h2>Welcome, {nickname}!</h2>
        <h3>Waiting for another player to join...</h3>
      </div>
    );
  }

  if (gameState.gameStatus === 'placing') {
    if (me.ships.length > 0) {
      return <h2>Waiting for opponent to place ships...</h2>;
    }
    return (
      <div className="placement-container">
        <h3>Place Your Fleet (Click ship to rotate)</h3>
        <GameBoard
          ships={myShips.filter(s => s.position !== null)}
          onDropShip={handleShipDrop}
          onRotateShip={handleRotateShip}
        />
        <div className="ship-palette" ref={dropPalette}>
          {myShips.filter(s => s.position === null).map(s => <DraggableShip key={s.id} ship={s} onClick={handleRotateShip} />)}
        </div>
        <button onClick={handleConfirmPlacement} disabled={!isPlacementValid}>
          Confirm Placement
        </button>
      </div>
    );
  }

  if (gameState.gameStatus === 'playing' || gameState.gameStatus === 'gameover') {
    const opponentId = Object.keys(gameState.players).find(id => id !== myPlayerId);
    const opponent = opponentId ? gameState.players[opponentId] : null;
    const isMyTurn = gameState.currentPlayerTurn === myPlayerId;
    
    // สร้าง Board ของเราจากข้อมูลเรือ + ข้อมูลที่ศัตรูยิงมา
    const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    if (me.ships) me.ships.forEach(part => { myDisplayBoard[part.row][part.col] = 'ship'; });
    if (me.gameBoard) me.gameBoard.forEach((row, r_idx) => {
      row.forEach((cell, c_idx) => { if (cell) myDisplayBoard[r_idx][c_idx] = cell; });
    });

    const handleFire = (row, col) => {
      if (isMyTurn && gameState.gameStatus === 'playing' && opponent && !opponent.gameBoard[row][col]) {
        socket.emit('fire-shot', { row, col });
      }
    };
    
    if (gameState.gameStatus === 'playing') {
        return (
            <div className="playing-container">
                <div className="turn-indicator">
                    <h2 className={isMyTurn ? 'my-turn' : ''}> {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`} </h2>
                    <div className="timer">Time Left: {gameState.timer}</div>
                </div>
                <div className="boards-container">
                  <div className="board-area">
                    <h3>Your Board (Score: {me.score})</h3>
                    <GameBoard
                      ships={myShips.filter(s => s.position)} // 👈 show your ships with image
                      boardData={myDisplayBoard}
                    />
                  </div>

                  <div className="board-area">
                    <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
                    {opponent ? (
                      <GameBoard
                        ships={[]} // 👈 opponent ships hidden
                        onCellClick={handleFire}
                        boardData={opponent.gameBoard}
                      />
                    ) : (
                      <p>Waiting...</p>
                    )}
                  </div>
                </div>
            </div>
        );
    }

    if (gameState.gameStatus === 'gameover') {
        return (
            <div className="game-over">
                <h1>Game Over!</h1>
                <h2>Winner is: {gameState.players[gameState.winner]?.nickname}</h2>
            </div>
        );
    }
  }

  return <div>Unhandled game state: {gameState.gameStatus}</div>;
}

export default Game;