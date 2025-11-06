import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { socket } from './socket';
import NicknameForm from './components/NicknameForm';
import Game from './components/Game';
import { useNavigate } from 'react-router-dom';
import ServerConfig from './components/ServerConfig';

import shipRed from './assets/shipRed.png';
import shipBlue from './assets/shipBlue.png';
import shipGreen from './assets/shipGreen.png';
import shipYellow from './assets/shipYellow.png';

import './App.css';

function App() {
  const [nickname, setNickname] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [showServerConfig, setShowServerConfig] = useState(true);


  // ✅ Ship skins
  const availableShips = [shipRed, shipBlue, shipGreen, shipYellow];
  const [selectedShipIndex, setSelectedShipIndex] = useState(0);
  const selectedShipSkin = availableShips[selectedShipIndex];

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onUpdateGameState = (newState) => setGameState(newState);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('update-game-state', onUpdateGameState);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('update-game-state', onUpdateGameState);
    };
  }, []);

  // handle disconnect
const [disconnectMessage, setDisconnectMessage] = useState('');
const [showDisconnectPopup, setShowDisconnectPopup] = useState(false);

const handlePlayerDisconnect = (disconnectedPlayer) => {
  // สร้างข้อความ
  const msg = disconnectedPlayer
    ? `Opponent disconnected!`
    : "Opponent disconnected! Please fill in your previous name";

  setDisconnectMessage(msg);   // เก็บข้อความ
  setShowDisconnectPopup(true); // เปิด popup
  setGameState(null);
  setNickname("");              // กลับหน้าแรก
};




  const handleSetNickname = (nick) => {
    if (nick) setNickname(nick);
  };

  // ✅ Keep only nickname for socket emit (server expects this)
  const handleStartGame = () => {
    if (nickname) {
      socket.emit('join-game', nickname);
    }
  };

  // const hasJoinedGame =
  //   gameState?.players &&
  //   Object.values(gameState.players).some((p) => p.nickname === nickname);
  const hasJoinedGame = !!gameState?.players?.[socket.id];
  // ✅ Change ship skin
  const prevSkin = () => {
    setSelectedShipIndex((prev) =>
      prev === 0 ? availableShips.length - 1 : prev - 1
    );
  };

  const nextSkin = () => {
    setSelectedShipIndex((prev) =>
      prev === availableShips.length - 1 ? 0 : prev + 1
    );
  };

  if (showServerConfig) {
    return <ServerConfig onDone={() => setShowServerConfig(false)} />;
  }


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <header className="App-header">
          <h1>Battleship Game</h1>
          <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        </header>
        <main>
          {!nickname && <NicknameForm onJoin={handleSetNickname} />}

          {nickname && !hasJoinedGame && (
            <div className="welcome-screen">
              <h2>Welcome, {nickname}!</h2>
              <p className="choose-ship-text">Select Your Ship</p>

              <div className="ship-selector">
                <button onClick={prevSkin}>◀</button>
                <img
                  src={selectedShipSkin}
                  alt="Selected Ship"
                  className="selected-ship"
                />
                <button onClick={nextSkin}>▶</button>
              </div>

              <button onClick={handleStartGame} className="start-game-btn">
                Start Game
              </button>
            </div>
          )}

          {/* ✅ Pass selectedShipSkin into Game */}
          {nickname && hasJoinedGame && (
            <Game
              gameState={gameState}
              nickname={nickname}
              selectedShipSkin={selectedShipSkin}
              onPlayerDisconnect={handlePlayerDisconnect} 
            />
          )}
        </main>
        {showDisconnectPopup && (
        <div className="disconnect-popup">
          <div className="popup-content">
            <p>{disconnectMessage}</p>
            <button onClick={() => setShowDisconnectPopup(false)}>OK</button>
          </div>
        </div>
      )}
      </div>
    </DndProvider>
  );
}

export default App;