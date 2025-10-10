// src/App.js
import React, { useState, useEffect } from 'react';
import { socket } from './socket'; // นำเข้าตัวเชื่อมต่อที่เราสร้างไว้
import NicknameForm from './components/NicknameForm';
import Game from './components/Game'; // เราจะสร้างไฟล์นี้ต่อไป
import './App.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  // --- State Management ---
  // useState คือ "กล่องเก็บข้อมูล" ของ Component
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [nickname, setNickname] = useState('');
  const [gameState, setGameState] = useState(null);

  // --- Side Effects ---
  // useEffect คือ "กล่องสำหรับทำงานพิเศษ" ที่จะรันเมื่อ Component ถูกสร้าง
  // เราใช้มันเพื่อตั้งค่าการดักฟัง event จาก server
  useEffect(() => {
    // ดักฟัง event 'connect'
    function onConnect() {
      setIsConnected(true);
      console.log('Connected to server!');
    }

    // ดักฟัง event 'disconnect'
    function onDisconnect() {
      setIsConnected(false);
      console.log('Disconnected from server!');
    }
    
    // ดักฟัง event 'join-success' ที่ server ส่งมาหลังตั้งชื่อสำเร็จ
    function onJoinSuccess(data) {
        setNickname(data.nickname);
    }

    function onUpdateGameState(newGameState) {
      console.log('Received game state update:', newGameState);
      setGameState(newGameState);
    }
    
    // ฟังก์ชันใหม่สำหรับจัดการเมื่อเกมเริ่ม
    function onGameStart(initialGameState) {
        console.log('Game is starting!', initialGameState);
        setGameState(initialGameState); // อัปเดต state เริ่มต้น
    }
    
    // เริ่มดักฟัง
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('join-success', onJoinSuccess);
    socket.on('update-game-state', onUpdateGameState);
    socket.on('game-start', onGameStart); // <-- เพิ่มการดักฟัง 'game-start'

    // cleanup function
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('join-success', onJoinSuccess);
      socket.off('update-game-state', onUpdateGameState);
      socket.off('game-start', onGameStart); // <-- อย่าลืมเอาออกด้วย
    };
  }, []);
    

  return (
    // --- ครอบ div หลักด้วย DndProvider ---
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <header className="App-header">
          <h1>Battleship Game</h1>
          <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        </header>
        <main>
          {!nickname ? (
            <NicknameForm />
          ) : (
            <Game gameState={gameState} nickname={nickname} />
          )}
        </main>
      </div>
    </DndProvider>
  );
}

export default App;