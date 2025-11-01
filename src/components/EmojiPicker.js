// src/components/EmojiPicker.js
import React from "react";

export default function EmojiPicker({ onSelect }) {
  const EMOJIS = ["😀", "😂", "😮", "😡", "❤️", "👍"];

  return (
    <div
      className="emoji-picker"
      style={{ display: "flex", gap: 8, alignItems: "center" }}
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          onFocus={(event) => event.target.blur()} // remove focus outline
          aria-label={`send ${e}`}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
