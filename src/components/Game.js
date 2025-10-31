// src/components/Game.js
import React, { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { socket } from '../socket';
import GameBoard from './GameBoard';
import DraggableShip, { ItemTypes } from './DraggableShip';
import EmojiPicker from './EmojiPicker';
import './Game.css';
import bg1 from '../assets/bg1.jpg';
import bg2 from '../assets/bg2.jpg';
import bg3 from '../assets/bg3.jpg';
import bg4 from '../assets/bg4.jpg';
import bg5 from '../assets/bg5.jpg';

function Game(props) {
  // accept either prop name to be tolerant of App.js variants
  const { gameState, nickname, shipSkin, selectedShipSkin } = props;

  // emoji reactions that appear on the board (shared)
  const [emojis, setEmojis] = useState([]); // { id, emoji, from, createdAt }
  const emojiIdRef = useRef(1);

  useEffect(() => {   
    const onEmoji = (data) => {
      // server broadcast: { emoji, from }
      const id = emojiIdRef.current++;
      setEmojis((prev) => [
        ...prev,
        { id, emoji: data.emoji, from: data.from, createdAt: Date.now() },
      ]);

      // auto-remove after 3s
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => e.id !== id));
      }, 3000);
    };

    socket.on('emoji', onEmoji);
    return () => socket.off('emoji', onEmoji);
  }, []);

  const sendEmoji = (emoji) => {
    const id = emojiIdRef.current++;
    // Optimistic local display
    setEmojis((prev) => [
      ...prev,
      { id, emoji, from: nickname, createdAt: Date.now() },
    ]);

    setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 3000);

    // Send to server
    socket.emit('emoji', { emoji, from: nickname });
  };
  

  // normalize/resolve the skin to a usable URL string
  const resolveSkinUrl = (maybeModule) => {
    if (!maybeModule) return null;
    // If bundler gave us an object like { default: '/static/media/ship...'} use that
    if (typeof maybeModule === 'object' && 'default' in maybeModule) return maybeModule.default;
    // otherwise assume it's a string URL already
    return maybeModule;
  };
  const skinUrl = resolveSkinUrl(shipSkin ?? selectedShipSkin);

  // --- Create ships using the resolved skin URL ---
  const createShips = (skin) => [
    { id: 1, length: 4, position: null, orientation: 'horizontal', image: skin },
    { id: 2, length: 4, position: null, orientation: 'horizontal', image: skin },
    { id: 3, length: 4, position: null, orientation: 'horizontal', image: skin },
    { id: 4, length: 4, position: null, orientation: 'horizontal', image: skin },
  ];

  const [bgIndex, setBgIndex] = React.useState(0);
  const backgrounds = [null, bg1, bg2, bg3, bg4, bg5];
  const bgStyle = backgrounds[bgIndex]
    ? { backgroundImage: `url(${backgrounds[bgIndex]})` }
    : {};
  // initialize with resolved skin
  const [myShips, setMyShips] = useState(() => createShips(skinUrl));
  const [isPlacementValid, setIsPlacementValid] = useState(false);

  // find player data
  const myPlayerId = gameState?.players
    ? Object.keys(gameState.players).find((id) => gameState.players[id].nickname === nickname)
    : null;
  const me = myPlayerId ? gameState.players[myPlayerId] : null;

  // --- Audio refs ---
  const fireSound = useRef(null);
  const bgMusic = useRef(null);

  useEffect(() => {
    fireSound.current = new Audio('/sounds/fire.mp3');
    fireSound.current.preload = 'auto';

    bgMusic.current = new Audio('/sounds/bg_music.mp3');
    bgMusic.current.loop = true;
    bgMusic.current.volume = 0.3;
    bgMusic.current.play().catch(() => {
      // autoplay often blocked, not an error
      console.log('Background music blocked until user interaction.');
    });

    return () => {
      if (bgMusic.current) {
        bgMusic.current.pause();
        bgMusic.current = null;
      }
    };
  }, []);

  // If skinUrl changes, recreate ships so their `image` field updates
  useEffect(() => {
    setMyShips(createShips(skinUrl));
    if (!skinUrl) {
      console.warn('Game: ship skin URL is falsy. Verify that App passes an imported image or public URL.');
    }
  }, [skinUrl]);

  // --- placement validation ---
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

  // Reset ships when entering placement or waiting (keeps skin applied)
  useEffect(() => {
    if (
      gameState?.gameStatus === 'waiting' ||
      (gameState?.gameStatus === 'placing' && me?.ships.length === 0)
    ) {
      setMyShips(createShips(skinUrl));
    }
  }, [gameState, me, skinUrl]);

  // --- drag/drop & rotate handlers ---
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

  // --- confirm placement ---
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

  // --- detect opponent fire for sound ---
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

  // --- RENDER ---
  if (!gameState || !me) return <div>Loading...</div>;

  if (gameState.gameStatus === 'waiting') {
    return (
      <div className="waiting-room">
        <h2>Welcome, {nickname}!</h2>
        <h3>Waiting for another player to join...</h3>
      </div>
    );
  }

  if (gameState.gameStatus === 'placing') {
    if (me.ships.length > 0) return <h2>Waiting for opponent to finish placing...</h2>;

    return (
      <div className="game-root" style={bgStyle}>
        <button
          className="bg-toggle-btn"
          onClick={() => setBgIndex((bgIndex + 1) % backgrounds.length)}
          title="Change background"
        >
          Change BG
        </button>
      <div className="placement-container">
        <h3>Place Your Fleet (Click ship to rotate)</h3>
        <GameBoard
          ships={myShips.filter(s => s.position !== null)}
          onDropShip={handleShipDrop}
          onRotateShip={handleRotateShip}
          emojis={emojis}
        />
        <div className="ship-palette" ref={dropPalette}>
          {myShips.filter(s => s.position === null).map(s => <DraggableShip key={s.id} ship={s} onClick={handleRotateShip} />)}
        </div>
        <button onClick={handleConfirmPlacement} disabled={!isPlacementValid}>
          Confirm Placement
        </button>
      </div>
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
          <div className="game-root" style={bgStyle}>
          <button
            className="bg-toggle-btn"
            onClick={() => setBgIndex((bgIndex + 1) % backgrounds.length)}
            title="Change background"
          >
            Change BG
          </button>
            <div className="playing-container">
                <div className="turn-indicator">
                    <h2 className={isMyTurn ? 'my-turn' : ''}> {isMyTurn ? "🔥 Your Turn!" : `Waiting for ${opponent?.nickname}'s turn...`} </h2>
                    <div className="timer">Time Left: {gameState.timer}</div>
                </div>
                <div className="boards-container">
                  <div className="board-area">
                    <h3>Your Board (Score: {me.score})</h3>
                    <GameBoard
                      ships={myShips.filter(s => s.position)} // show your ships with image
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
            </div>
        );
    }
  }

  return <div>Unhandled state: {gameState.gameStatus}</div>;
}

export default Game;
