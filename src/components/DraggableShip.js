// src/components/DraggableShip.js
import React from 'react';
import { useDrag } from 'react-dnd';
import './DraggableShip.css';
import shipImage from '../assets/battleship.png'; // ตรวจสอบว่า path ถูกต้อง

export const ItemTypes = {
  SHIP: 'ship',
};

const DraggableShip = ({ ship, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIP,
    item: ship, // ส่ง object ship ทั้งหมดไป
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="draggable-ship-container"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={() => onClick(ship.id)}
    >
      <img
        src={shipImage}
        alt="Battleship"
        className={`ship-image ${ship.orientation}`}
      />
    </div>
  );
};

export default DraggableShip;