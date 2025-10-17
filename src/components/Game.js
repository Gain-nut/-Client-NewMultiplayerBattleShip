// src/components/Game.js
import React, { useState, useEffect, useRef } from 'react';
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

  const myPlayerId = gameState?.players
    ? Object.keys(gameState.players).find(id => gameState.players[id].nickname === nickname)
    : null;
  const me = myPlayerId ? gameState.players[myPlayerId] : null;

  // 🔊 Fire sound
  const fireSound = useRef(null);

  // 🔊 Background music
  const bgMusic = useRef(null);

  useEffect(() => {
    // Fire sound setup
    fireSound.current = new Audio('/sounds/fire.mp3');
    fireSound.current.preload = 'auto';

    // Background music setup
    bgMusic.current = new Audio('/sounds/bg_music.mp3');
    bgMusic.current.loop = true;      // loop continuously
    bgMusic.current.volume = 0.3;     // optional lower volume
    bgMusic.current.play().catch(() => {
      console.log('Background music play blocked, user interaction needed.');
    });

    // Cleanup on unmount
    return () => {
      if (bgMusic.current) {
        bgMusic.current.pause();
        bgMusic.current = null;
      }
    };
  }, []);


  // Validate ship placement
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

  // Ship drop & rotate handlers
  const handleShipDrop = (droppedShip, newPosition) => {
    const adjustedPosition = { row: newPosition.row, col: newPosition.col };
    setMyShips(currentShips =>
      currentShips.map(ship =>
        ship.id === droppedShip.id ? { ...ship, position: adjustedPosition } : ship
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
    drop: (item) => {
      setMyShips(ships => ships.map(s => s.id === item.id ? { ...s, position: null } : s));
    },
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

  const handleReadyForNextRound = () => {
    socket.emit('ready-for-next-round');
  };

  // 🎧 FIRE SOUND DETECTION
  const prevGameState = useRef(null);

  useEffect(() => {
    if (!prevGameState.current || !gameState) {
      prevGameState.current = gameState;
      return;
    }

    if (gameState.gameStatus === 'playing') {
      const myId = myPlayerId;
      const opponentId = Object.keys(gameState.players).find(id => id !== myId);

      const oppNow = gameState.players[opponentId];
      const oppPrev = prevGameState.current.players[opponentId];

      // Detect any new shots fired by opponent
      if (oppNow?.gameBoard && oppPrev?.gameBoard) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (oppNow.gameBoard[r][c] !== oppPrev.gameBoard[r][c] && oppNow.gameBoard[r][c]) {
              // Play fire sound once per new shot
              fireSound.current.currentTime = 0;
              fireSound.current.play();
            }
          }
        }
      }
    }

    prevGameState.current = gameState;
  }, [gameState, myPlayerId]);

  // --- RENDER ---
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
    if (me.ships.length > 0) return <h2>Waiting for opponent to place ships...</h2>;
    return (
      <div className="placement-container">
        <h3>Place Your Fleet (Click ship to rotate)</h3>
        <GameBoard
          ships={myShips.filter(s => s.position !== null)}
          onDropShip={handleShipDrop}
          onRotateShip={handleRotateShip}
        />
        <div className="ship-palette" ref={dropPalette}>
          {myShips.filter(s => s.position === null).map(s => (
            <DraggableShip key={s.id} ship={s} onClick={handleRotateShip} />
          ))}
        </div>
        <button onClick={handleConfirmPlacement} disabled={!isPlacementValid}>
          Confirm Placement
        </button>
      </div>
    );
  }

  if (['playing', 'gameover', 'matchover'].includes(gameState.gameStatus)) {
    const opponentId = Object.keys(gameState.players).find(id => id !== myPlayerId);
    const opponent = opponentId ? gameState.players[opponentId] : null;
    const isMyTurn = gameState.currentPlayerTurn === myPlayerId;

    const myDisplayBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    if (me.ships) me.ships.forEach(part => { myDisplayBoard[part.row][part.col] = 'ship'; });
    if (me.gameBoard) me.gameBoard.forEach((row, r_idx) => {
      row.forEach((cell, c_idx) => { if (cell) myDisplayBoard[r_idx][c_idx] = cell; });
    });

    const handleFire = (row, col) => {
      if (isMyTurn && gameState.gameStatus === 'playing' && opponent && !opponent.gameBoard[row][col]) {
        socket.emit('fire-shot', { row, col });
        // play fire sound on your shot as well
        fireSound.current.currentTime = 0;
        fireSound.current.play();
      }
    };

    if (gameState.gameStatus === 'gameover') {
      const winnerName = gameState.players[gameState.winner]?.nickname;
      return (
        <div className="game-over">
          <h1>Round Over!</h1>
          <h2>Winner is: {winnerName}</h2>
          <h3>Score: {me.nickname} {me.score} - {opponent?.nickname} {opponent?.score}</h3>
          {me.readyForNextRound ? (
            <p>Waiting for opponent...</p>
          ) : (
            <button onClick={handleReadyForNextRound}>Ready for Next Round</button>
          )}
        </div>
      );
    }

    if (gameState.gameStatus === 'matchover') {
      const winnerName = gameState.players[gameState.winner]?.nickname;
      return (
        <div className="game-over">
          <h1>MATCH OVER!</h1>
          <h2>FINAL WINNER IS: {winnerName}</h2>
          <h3>Final Score: {me.nickname} {me.score} - {opponent?.nickname} {opponent?.score}</h3>
        </div>
      );
    }

    if (gameState.gameStatus === 'playing') {
      return (
        <div className="playing-container">
          <div className="turn-indicator">
            <h2 className={isMyTurn ? 'my-turn' : ''}>
              {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`}
            </h2>
            <div className="timer">Time Left: {gameState.timer}</div>
          </div>
          <div className="boards-container">
            <div className="board-area">
              <h3>Your Board (Score: {me.score})</h3>
              <GameBoard
                ships={myShips.filter(s => s.position)}
                boardData={myDisplayBoard}
              />
            </div>

            <div className="board-area">
              <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
              {opponent ? (
                <GameBoard
                  ships={[]} // hide opponent’s ships
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
  }

  return <div>Unhandled game state: {gameState.gameStatus}</div>;
}

export default Game;
