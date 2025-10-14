import React, { useState } from 'react';

// 1. รับ onJoin เข้ามาเป็น prop
function NicknameForm({ onJoin }) {
  const [name, setName] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (name.trim()) {
      // 2. เรียกใช้ onJoin ที่ได้รับมาแทนการ emit เอง
      onJoin(name.trim());
    }
  };

  return (
    <form className="nickname-form" onSubmit={handleSubmit}>
      <h2>Enter Your Nickname</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoFocus
      />
      <button type="submit">Join Game</button>
    </form>
  );
}

export default NicknameForm;