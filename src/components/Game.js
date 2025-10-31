// src/components/Game.js
import React, { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { socket } from '../socket';
import GameBoard from './GameBoard';
import DraggableShip, { ItemTypes } from './DraggableShip';
import './Game.css';

function Game(props) {
  const { gameState, nickname, shipSkin, selectedShipSkin } = props;

  const resolveSkinUrl = (maybeModule) => {
    if (!maybeModule) return null;
    if (typeof maybeModule === 'object' && 'default' in maybeModule) return maybeModule.default;
    return maybeModule;
  };
  const skinUrl = resolveSkinUrl(shipSkin ?? selectedShipSkin);

  const createShips = (skin) => [
    { id: 1, length: 4, position: null, orientation: 'horizontal', image: skin },
    { id: 2, length: 4, position: null, orientation: 'horizontal', image: skin },
    { id: 3, length: 4, position: null, orientation: 'horizontal', image: skin },
    { id: 4, length: 4, position: null, orientation: 'horizontal', image: skin },
  ];

  const [myShips, setMyShips] = useState(() => createShips(skinUrl));
  const [isPlacementValid, setIsPlacementValid] = useState(false);

  const myPlayerId = gameState?.players
    ? Object.keys(gameState.players).find((id) => gameState.players[id].nickname === nickname)
    : null;
  const me = myPlayerId ? gameState.players[myPlayerId] : null;

  // --- Audio refs ---
  const fireSound = useRef(null);
  const bgMusic = useRef(null);

  // --- Settings states ---
  const [showSettings, setShowSettings] = useState(false);
  const [fireVolume, setFireVolume] = useState(1);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [fireMuted, setFireMuted] = useState(false);
  const [bgMuted, setBgMuted] = useState(false);

  useEffect(() => {
    fireSound.current = new Audio('/sounds/fire.mp3');
    fireSound.current.preload = 'auto';

    bgMusic.current = new Audio('/sounds/bg_music.mp3');
    bgMusic.current.loop = true;
    bgMusic.current.volume = bgVolume;
    bgMusic.current.play().catch(() => {
      console.log('Background music blocked until user interaction.');
    });

    return () => {
      if (bgMusic.current) {
        bgMusic.current.pause();
        bgMusic.current = null;
      }
    };
  }, []);

  // apply volume and mute changes in real time
  useEffect(() => {
    if (fireSound.current) {
      const normalizedVolume = Math.max(0, Math.min(1, fireVolume / 100)); // convert 0–100 → 0–1
      fireSound.current.volume = fireMuted ? 0 : normalizedVolume;
    }
  }   , [fireVolume, fireMuted]);

  useEffect(() => {
    if (bgMusic.current) {
        const normalizedVolume = Math.max(0, Math.min(1, bgVolume / 100)); // convert 0–100 → 0–1
        bgMusic.current.volume = bgMuted ? 0 : normalizedVolume;
    }
  }, [bgVolume, bgMuted]);


  useEffect(() => {
    setMyShips(createShips(skinUrl));
    if (!skinUrl) {
      console.warn('Game: ship skin URL is falsy.');
    }
  }, [skinUrl]);

  const validateBoard = (ships) => {
    const placed = ships.filter((s) => s.position);
    if (placed.length !== 4) return false;

    const occupied = new Set();
    for (const s of placed) {
      for (let i = 0; i < s.length; i++) {
        const row = s.orientation === 'horizontal' ? s.position.row : s.position.row + i;
        const col = s.orientation === 'horizontal' ? s.position.col + i : s.position.col;
        const key = `${row},${col}`;
        if (occupied.has(key) || row < 0 || row > 7 || col < 0 || col > 7) return false;
        occupied.add(key);
      }
    }
    return true;
  };

  useEffect(() => {
    setIsPlacementValid(validateBoard(myShips));
  }, [myShips]);

  useEffect(() => {
    if (
      gameState?.gameStatus === 'waiting' ||
      (gameState?.gameStatus === 'placing' && me?.ships.length === 0)
    ) {
      setMyShips(createShips(skinUrl));
    }
  }, [gameState, me, skinUrl]);

  const handleShipDrop = (droppedShip, newPosition) => {
    setMyShips((ships) =>
      ships.map((s) => (s.id === droppedShip.id ? { ...s, position: newPosition } : s))
    );
  };

  const handleRotateShip = (shipId) => {
    setMyShips((ships) =>
      ships.map((s) =>
        s.id === shipId ? { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' } : s
      )
    );
  };

  const [, dropPalette] = useDrop(() => ({
    accept: ItemTypes.SHIP,
    drop: (item) =>
      setMyShips((ships) => ships.map((s) => (s.id === item.id ? { ...s, position: null } : s))),
  }));

  const handleConfirmPlacement = () => {
    if (!isPlacementValid) {
      alert('Invalid placement! Make sure all 4 ships are on board and not overlapping.');
      return;
    }

    const parts = [];
    myShips.forEach((s) => {
      if (!s.position) return;
      for (let i = 0; i < s.length; i++) {
        parts.push({
          row: s.orientation === 'horizontal' ? s.position.row : s.position.row + i,
          col: s.orientation === 'horizontal' ? s.position.col + i : s.position.col,
        });
      }
    });
    socket.emit('place-ships', parts);
  };

  const handleReadyForNextRound = () => socket.emit('ready-for-next-round');

  const prevGameState = useRef(null);
  useEffect(() => {
    if (!prevGameState.current || !gameState) {
      prevGameState.current = gameState;
      return;
    }

    if (gameState.gameStatus === 'playing') {
      const opponentId = Object.keys(gameState.players).find((id) => id !== myPlayerId);
      const oppNow = gameState.players[opponentId];
      const oppPrev = prevGameState.current.players[opponentId];

      if (oppNow?.gameBoard && oppPrev?.gameBoard) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (oppNow.gameBoard[r][c] !== oppPrev.gameBoard[r][c] && oppNow.gameBoard[r][c]) {
              if (fireSound.current) {
                fireSound.current.currentTime = 0;
                fireSound.current.play().catch(() => {});
              }
            }
          }
        }
      }
    }

    prevGameState.current = gameState;
  }, [gameState, myPlayerId]);

  if (!gameState || !me) return <div>Loading...</div>;

  // --- SETTINGS MODAL ---
const SettingsModal = () => (
  <div className="settings-page">
    <div className="settings-box">
      <h1>⚙️ Game Sound Settings</h1>

      <div className="setting-item">
        <label>Fire Sound Volume: {fireMuted ? 'Muted' : `${fireVolume}%`}</label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={fireVolume}
          onChange={(e) => setFireVolume(Number(e.target.value))}
        />
        <button onClick={() => setFireMuted(!fireMuted)}>
          {fireMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      <div className="setting-item">
        <label>Background Music Volume: {bgMuted ? 'Muted' : `${bgVolume}%`}</label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={bgVolume}
          onChange={(e) => setBgVolume(Number(e.target.value))}
        />
        <button onClick={() => setBgMuted(!bgMuted)}>
          {bgMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      <button className="close-btn" onClick={() => setShowSettings(false)}>
        Close Settings
      </button>
    </div>
  </div>
);

  // --- SETTINGS BUTTON ---
const SettingsButton = () => (
  <button className="settings-btn" onClick={() => setShowSettings(true)}>
    ⚙️
  </button>
);

  // --- Main rendering logic below ---
  if (gameState.gameStatus === 'waiting') {
    return (
      <div className="waiting-room">
        <SettingsButton />
        <h2>Welcome, {nickname}!</h2>
        <h3>Waiting for another player to join...</h3>
        {showSettings && <SettingsModal />}
      </div>
    );
  }

  if (gameState.gameStatus === 'placing') {
    if (me.ships.length > 0) return <h2>Waiting for opponent to finish placing...</h2>;

    return (
      <div className="placement-container">
        <SettingsButton />
        {showSettings && <SettingsModal />}

        <h3>Place Your Fleet (Click to rotate)</h3>

        <GameBoard
          ships={myShips.filter((s) => s.position)}
          onDropShip={handleShipDrop}
          onRotateShip={handleRotateShip}
        />

        <div className="ship-palette" ref={dropPalette}>
          {myShips
            .filter((s) => s.position === null)
            .map((s) => (
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
    const opponentId = Object.keys(gameState.players).find((id) => id !== myPlayerId);
    const opponent = opponentId ? gameState.players[opponentId] : null;
    const isMyTurn = gameState.currentPlayerTurn === myPlayerId;

    const myDisplayBoard = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));
    if (me.ships)
      me.ships.forEach((p) => {
        myDisplayBoard[p.row][p.col] = 'ship';
      });
    if (me.gameBoard)
      me.gameBoard.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell) myDisplayBoard[r][c] = cell;
        })
      );

    const handleFire = (row, col) => {
      if (isMyTurn && gameState.gameStatus === 'playing' && opponent && !opponent.gameBoard[row][col]) {
        socket.emit('fire-shot', { row, col });
        if (fireSound.current) {
          fireSound.current.currentTime = 0;
          fireSound.current.play().catch(() => {});
        }
      }
    };

    if (gameState.gameStatus === 'gameover') {
      const winnerName = gameState.players[gameState.winner]?.nickname;
      return (
        <div className="game-over">
          <SettingsButton />
          {showSettings && <SettingsModal />}

          <h1>Round Over!</h1>
          <h2>Winner: {winnerName}</h2>
          <h3>
            Score: {me.nickname} {me.score} - {opponent?.nickname} {opponent?.score}
          </h3>
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
          <SettingsButton />
          {showSettings && <SettingsModal />}

          <h1>MATCH OVER!</h1>
          <h2>FINAL WINNER: {winnerName}</h2>
          <h3>
            Final Score: {me.nickname} {me.score} - {opponent?.nickname} {opponent?.score}
          </h3>
        </div>
      );
    }

    if (gameState.gameStatus === 'playing') {
      return (
        <div className="playing-container">
          <SettingsButton />
          {showSettings && <SettingsModal />}

          <div className="turn-indicator">
            <h2 className={isMyTurn ? 'my-turn' : ''}>
              {isMyTurn ? '🔥 Your Turn!' : `Waiting for ${opponent?.nickname}...`}
            </h2>
            <div className="timer">Time Left: {gameState.timer}</div>
          </div>

          <div className="boards-container">
            <div className="board-area">
              <h3>Your Board (Score: {me.score})</h3>
              <GameBoard ships={myShips.filter((s) => s.position)} boardData={myDisplayBoard} />
            </div>

            <div className="board-area">
              <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
              {opponent ? (
                <GameBoard ships={[]} onCellClick={handleFire} boardData={opponent.gameBoard} />
              ) : (
                <p>Waiting...</p>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  return <div>Unhandled state: {gameState.gameStatus}</div>;
}

export default Game;