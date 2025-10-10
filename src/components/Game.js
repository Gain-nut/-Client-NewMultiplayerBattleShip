// src/components/GameBoard.js// src/components/Game.js
import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { socket } from '../socket';
import GameBoard from './GameBoard';
import DraggableShip, { ItemTypes } from './DraggableShip';
import './Game.css';

const initialShips = [
  { id: 1, length: 4, position: null, orientation: 'horizontal' },
  { id: 2, length: 4, position: null, orientation: 'horizontal' },
  { id: 3, length: 4, position: null, orientation: 'horizontal' },
  { id: 4, length: 4, position: null, orientation: 'horizontal' },
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
                        <GameBoard ships={[]} boardData={myDisplayBoard} />
                    </div>
                    <div className="board-area">
                        <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
                        {opponent ? <GameBoard ships={[]} onCellClick={handleFire} boardData={opponent.gameBoard} /> : <p>Waiting...</p>}
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

    // if (gameState.gameStatus === 'gameover') {
    //   console.log("GameOver")
    //     return (
    //         <div className="game-over">
    //             <h1>Game Over!</h1>
    //             <h2>Winner is: {gameState.players[gameState.winner]?.nickname}</h2>
    //         </div>
    //     );
    // }
  }

  return <div>Unhandled game state: {gameState.gameStatus}</div>;
}

export default Game;