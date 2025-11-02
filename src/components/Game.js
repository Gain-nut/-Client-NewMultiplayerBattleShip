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
  const { gameState, nickname, shipSkin, selectedShipSkin, onPlayerDisconnect} = props;
  const myId = socket.id;
  const me = gameState?.players?.[myId] || null;
  
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

  // Control how long the emoji stays and how fast users can send
const EMOJI_DURATION_MS = 2200;     // how long it stays visible 
const EMOJI_COOLDOWN_MS = 2200;     // how often user can send 
const lastEmojiAtRef = useRef(0);

const sendEmoji = (emoji) => {
  const now = Date.now();
  if (now - lastEmojiAtRef.current < EMOJI_COOLDOWN_MS) return; // ignore spam
  lastEmojiAtRef.current = now;

  const id = emojiIdRef.current++;
  setEmojis((prev) => [
    ...prev,
    { id, emoji, from: nickname, createdAt: now },
  ]);

  setTimeout(() => {
    setEmojis((prev) => prev.filter((e) => e.id !== id));
  }, EMOJI_DURATION_MS);

  socket.emit('emoji', { emoji, from: nickname });
};

  

  // normalize/resolve the skin to a usable URL string
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

  const [bgIndex, setBgIndex] = React.useState(0);
  const backgrounds = [null, bg1, bg2, bg3, bg4, bg5];
  const bgStyle = backgrounds[bgIndex]
    ? { backgroundImage: `url(${backgrounds[bgIndex]})` }
    : {};
  // initialize with resolved skin
  const [myShips, setMyShips] = useState(() => createShips(skinUrl));
  const [isPlacementValid, setIsPlacementValid] = useState(false);

  // find player data
  // const myPlayerId = gameState?.players
  //   ? Object.keys(gameState.players).find((id) => gameState.players[id].nickname === nickname)
  //   : null;
  // const me = myPlayerId ? gameState.players[myPlayerId] : null;
  // --- Audio refs ---
  const fireSound = useRef(null);
  const bgMusic = useRef(null);

  // --- Settings states ---
  const [showSettings, setShowSettings] = useState(false);
  const [fireVolume, setFireVolume] = useState(1);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [fireMuted, setFireMuted] = useState(false);
  const [bgMuted, setBgMuted] = useState(false);

  // PLayer ID
const [playerId, setPlayerId] = useState(null);

  //Player disconnect
  const [disconnectMessage, setDisconnectMessage] = useState('');
  
  // --- Surrender states ---
const [showSurrenderWarning, setShowSurrenderWarning] = useState(false);

const handleSurrenderConfirm = () => {
  socket.emit('surrender', { playerId: myId });
  setShowSurrenderWarning(false);
  setShowSettings(false);
};


const handleSurrenderCancel = () => {
  setShowSurrenderWarning(false);
};


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



  // Disconnect2
  useEffect(() => {
  const handleDisconnect = (disconnectedPlayer) => {
    if (disconnectedPlayer !== nickname) {
      onPlayerDisconnect(disconnectedPlayer);
    }
  };

  socket.on("player-disconnect", handleDisconnect);

  return () => {
    socket.off("player-disconnect", handleDisconnect);
  };
}, [nickname, onPlayerDisconnect]);



  // useEffect ตรวจสอบว่าเกมจบและเราชนะ(Player Discon)
// Game.js (แทนที่บรรทัด 88-103 เดิม)
useEffect(() => {
  if (!gameState || !myId) return;

  // ตรวจสอบว่าเกมจบ และเราเป็นผู้ชนะหรือไม่
  if (gameState.gameStatus === 'gameover' && gameState.winner === myId) {
  // ตรวจสอบ "เหตุผล" ที่เราชนะ
    if (gameState.gameOverReason === 'disconnect') {
      setDisconnectMessage('Your opponent disconnected. You win this round by default!');
    } else if (gameState.gameOverReason === 'surrender') {
      setDisconnectMessage('Your opponent surrendered. You win this round!');
    } else {
    // ถ้าชนะแบบปกติ (เช่น ยิงเรือหมด) ก็ไม่ต้องแสดงข้อความพิเศษ
      setDisconnectMessage('');
    }

  } else {
    // ถ้าเกมยังไม่จบ หรือเราไม่ได้ชนะ ก็ล้างข้อความทิ้ง
    setDisconnectMessage('');
  }
}, [gameState, myId]); // <-- dependencies เหมือนเดิม

  // apply volume and mute changes in real time
  useEffect(() => {
    if (fireSound.current) {
      const normalizedVolume = Math.max(0, Math.min(1, fireVolume / 100)); // convert 0–100 → 0–1
      fireSound.current.volume = fireMuted ? 0 : normalizedVolume;
    }
  }   , [fireVolume, fireMuted]);

  // --- Listen for server event when player successfully joins the game ---
useEffect(() => {
  socket.on('join-success', ({ playerId, nickname }) => {
    setPlayerId(playerId);
    console.log(`Joined as ${nickname} (ID: ${playerId})`);
  });
  return () => {
    socket.off('join-success');
  };
}, []); 


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

  // Reset ships when entering placement or waiting (keeps skin applied)
  // useEffect(() => {
  //   if (
  //     gameState?.gameStatus === 'waiting' ||
  //     (gameState?.gameStatus === 'placing' && me?.ships.length === 0)
  //   ) {
  //     setMyShips(createShips(skinUrl));
  //   }
  // }, [gameState, me, skinUrl]);
const phaseRef = useRef(null);
useEffect(() => {
  const phase = gameState?.gameStatus;
  const prev = phaseRef.current;
  const enteringPlacing = phase === 'placing' && prev !== 'placing';
  const enteringWaiting = phase === 'waiting' && prev !== 'waiting';
  if (enteringPlacing || enteringWaiting) {
    setMyShips(createShips(skinUrl));
  }  phaseRef.current = phase;
}, [gameState?.gameStatus, skinUrl]);

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
      const opponentId = Object.keys(gameState.players).find((id) => id !== myId);
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
  }, [gameState, myId]);

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

      <div className="settings-buttons">
        <button className="surrender-btn" onClick={() => setShowSurrenderWarning(true)}>
          🏳️ Surrender
        </button>
        <button className="close-btn" onClick={() => setShowSettings(false)}>
          Close Settings
        </button>
      </div>
    </div>
  </div>
);

// --- SURRENDER WARNING POPUP ---
const SurrenderWarning = () => (
  <div className="warning-page">
    <div className="warning-box">
      <h2>Are you sure you want to surrender?</h2>
      <p>You will lose this round immediately.</p>
      <div className="warning-buttons">
        <button className="cancel-btn" onClick={handleSurrenderCancel}>Cancel</button>
        <button className="confirm-btn" onClick={handleSurrenderConfirm}>Yes, Surrender</button>
      </div>
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
        {showSurrenderWarning && <SurrenderWarning />}

      </div>
    );
  }

  if (gameState.gameStatus === 'placing') {
    // if (me.ships.length > 0) return <h2>Waiting for opponent to finish placing...</h2>;
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
        <SettingsButton />
        {showSettings && <SettingsModal />}
        {showSurrenderWarning && <SurrenderWarning />}
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

        {/* Emoji picker so user can send reactions during placement */} 
          <div className="emoji-dock">
            <EmojiPicker onSelect={sendEmoji} />
          </div>

        <button onClick={handleConfirmPlacement} disabled={!isPlacementValid}>
          Confirm Placement
        </button>
      </div>
      </div>
    );
  }

  if (['playing', 'gameover', 'matchover'].includes(gameState.gameStatus)) {
    //const opponentId = Object.keys(gameState.players).find((id) => id !== myPlayerId);
    const opponentId = Object.keys(gameState.players).find((id) => id !== myId);
    const opponent = opponentId ? gameState.players[opponentId] : null;
    //const isMyTurn = gameState.currentPlayerTurn === myPlayerId;
    const isMyTurn = gameState.currentPlayerTurn === myId;

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
      {showSurrenderWarning && <SurrenderWarning />}

      <h1>Round Over!</h1>
      <h2>Winner: {winnerName}</h2>
      {disconnectMessage && (
        <p className="disconnect-message">{disconnectMessage}</p>
      )}
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
          {showSurrenderWarning && <SurrenderWarning />}


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
            <SettingsButton />
          {showSettings && <SettingsModal />}
          {showSurrenderWarning && <SurrenderWarning />}
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
                      emojis={emojis} 
                    />
                  </div>

                  <div className="board-area">
                    <h3>{opponent?.nickname}'s Board (Score: {opponent?.score || 0})</h3>
                    {opponent ? (
                      <GameBoard
                        ships={[]} // 👈 opponent ships hidden
                        onCellClick={handleFire}
                        boardData={opponent.gameBoard}
                        emojis={emojis}  
                      />
                    ) : (
                      <p>Waiting...</p>
                    )}
                  </div>
                </div>

              {/* Emoji picker so players can react during play */}
            <div className="emoji-dock">
              <EmojiPicker onSelect={sendEmoji} />
            </div>
          </div>
          </div>
        );
    }
  }

  return <div>Unhandled state: {gameState.gameStatus}</div>;
}

export default Game;