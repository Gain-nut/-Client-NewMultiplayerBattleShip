// src/components/NicknameForm.js
import React, { useState } from 'react';
import { socket } from '../socket';

function NicknameForm() {
  const [name, setName] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault(); // ป้องกันไม่ให้หน้าเว็บ refresh
    if (name.trim()) {
      socket.emit('join-game', name.trim()); // ส่ง event 'join-game' ไปให้ server
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Enter Your Nickname</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />
      <button type="submit">Join Game</button>
    </form>
  );
}

export default NicknameForm;