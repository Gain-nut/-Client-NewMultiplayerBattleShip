import React from 'react';
import './HowToPlay.css';

export default function HowToPlay({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close how to play"
        >
          ×
        </button>
        <h2>How to Play Battleship</h2>
        <ol className="modal-list">
          <li>Enter your nickname and click <strong>Join Game</strong>.</li>
          <li>Place your ships on your board (no overlap, keep inside the grid).</li>
          <li>During the match, click a cell on the enemy board to fire.</li>
          <li>Hit = ❌, Miss = 🔲. Sink all enemy ships to win!</li>
          <li>Tip: Take turns wisely — plan your shots!</li>
        </ol>
      </div>
    </div>
  );
}