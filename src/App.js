import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { socket } from './socket';
import NicknameForm from './components/NicknameForm';
import Game from './components/Game';
import './App.css';

function App() {
  const [nickname, setNickname] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [gameState, setGameState] = useState(null);

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

  // ฟังก์ชันนี้จะรับชื่อจาก NicknameForm มาเก็บไว้
  const handleSetNickname = (nick) => {
    if (nick) {
      setNickname(nick);
    }
  };

  // ฟังก์ชันสำหรับปุ่ม "Start Game" ที่จะส่งข้อมูลไป server จริงๆ
  const handleStartGame = () => {
    if (nickname) {
      socket.emit('join-game', nickname);
    }
  };

  // ตรวจสอบว่าผู้เล่นเข้าร่วมเกมแล้วหรือยังจาก gameState
  const hasJoinedGame = gameState?.players && Object.values(gameState.players).some(p => p.nickname === nickname);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <header className="App-header">
          <h1>Battleship Game</h1>
          <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        </header>
        <main>
          {/* --- Logic การแสดงผล 3 ขั้นตอน --- */}

          {/* 1. ยังไม่ได้ตั้งชื่อ: แสดง NicknameForm */}
          {!nickname && <NicknameForm onJoin={handleSetNickname} />}

          {/* 2. ตั้งชื่อแล้ว แต่ยังไม่ได้เข้าร่วมเกม: แสดงหน้า Welcome */}
          {nickname && !hasJoinedGame && (
            <div className="welcome-screen">
              <h2>Welcome, {nickname}!</h2>
              <button onClick={handleStartGame} className="start-game-btn">
                Start Game
              </button>
            </div>
          )}

          {/* 3. เข้าร่วมเกมแล้ว: แสดง Game component */}
          {nickname && hasJoinedGame && <Game gameState={gameState} nickname={nickname} />}
        </main>
      </div>
    </DndProvider>
  );
}

export default App;