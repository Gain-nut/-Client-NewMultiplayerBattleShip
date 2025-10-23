import React, { useState } from 'react';
import HowToPlay from './HowToPlay';

// 1. รับ onJoin เข้ามาเป็น prop
function NicknameForm({ onJoin }) {
  const [name, setName] = useState('');
  const [openHowTo, setOpenHowTo] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (name.trim()) {
      // 2. เรียกใช้ onJoin ที่ได้รับมาแทนการ emit เอง
      onJoin(name.trim());
    }
  };

  return (
    <div>
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
      <button
        type="button"
        onClick={() => setOpenHowTo(true)}
        style={{ marginTop: '12px' }}
      >
        How to play
      </button>
      <HowToPlay open={openHowTo} onClose={() => setOpenHowTo(false)} />
    </div>
  );
}

export default NicknameForm;