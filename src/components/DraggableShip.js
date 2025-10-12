// // src/components/DraggableShip.js
// import React from 'react';
// import { useDrag } from 'react-dnd';
// import './DraggableShip.css';

// export const ItemTypes = {
//   SHIP: 'ship',
// };

// const DraggableShip = ({ ship, onRotate }) => {
//   const [{ isDragging }, drag] = useDrag(() => ({
//     type: ItemTypes.SHIP,
//     item: ship,
//     collect: (monitor) => ({
//       isDragging: !!monitor.isDragging(),
//     }),
//   }));

//   // Handle a simple left-click to rotate
//   const handleClick = () => {
//     if (onRotate) {
//       onRotate(ship.id);
//     }
//   };

//   return (
//     <div
//       ref={drag}
//       className={`draggable-ship ${ship.orientation}`}
//       style={{ opacity: isDragging ? 0.5 : 1 }}
//       onClick={handleClick}
//     >
//       {Array.from({ length: ship.length }).map((_, i) => (
//         <div key={i} className="ship-part"></div>
//       ))}
//     </div>
//   );
// };

// export default DraggableShip;
//10/8/2025 20:36
// src/components/DraggableShip.js
// import React from 'react';
// import { useDrag } from 'react-dnd';
// import './DraggableShip.css';
// import shipImage from '../assets/battleship.png'; // <-- import รูปภาพเข้ามา

// export const ItemTypes = {
//   SHIP: 'ship',
// };

// const DraggableShip = ({ ship, onClick }) => {
//   const [{ isDragging }, drag] = useDrag(() => ({
//     type: ItemTypes.SHIP,
//     item: ship,
//     collect: (monitor) => ({
//       isDragging: !!monitor.isDragging(),
//     }),
//   }));

//   const handleOnClick = () => {
//     if (onClick) {
//       onClick(ship.id);
//     }
//   };

//   return (
//     <div
//       ref={drag}
//       className="draggable-ship-container"
//       style={{ opacity: isDragging ? 0.5 : 1 }}
//       onClick={handleOnClick}
//     >
//       <img
//         src={shipImage}
//         alt="Battleship"
//         className={`ship-image ${ship.orientation}`}
//       />
//     </div>
//   );
// };

// export default DraggableShip;

// src/components/DraggableShip.js
import React from 'react';
import { useDrag } from 'react-dnd';
import './DraggableShip.css';
import shipImage from '../assets/shipRed.png'; 

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




// // src/components/DraggableShip.js
// import React, { useEffect } from 'react';
// import { useDrag } from 'react-dnd';
// import { getEmptyImage } from 'react-dnd-html5-backend';
// import './DraggableShip.css';
// import shipImage from '../assets/shipRed.png'; 

// export const ItemTypes = {
//   SHIP: 'ship',
// };

// const DraggableShip = ({ ship, onClick }) => {
//   const [{ isDragging }, drag, preview] = useDrag(() => ({
//     type: ItemTypes.SHIP,
//     item: {
//       ...ship,
//       grabOffset: { x: 0, y: 0 }, // always anchor to left-top of ship
//     },
//     collect: (monitor) => ({
//       isDragging: !!monitor.isDragging(),
//     }),
//   }));

//   // Hide the default drag preview (so your ship itself moves smoothly)
//   useEffect(() => {
//     preview(getEmptyImage(), { captureDraggingState: true });
//   }, [preview]);

//   return (
//     <>
//       <div
//         ref={drag}
//         className="draggable-ship-container"
//         style={{
//           opacity: isDragging ? 0.5 : 1,
//           cursor: 'grab',
//         }}
//         onClick={() => onClick(ship.id)}
//       >
//         <img
//           src={shipImage}
//           alt="Battleship"
//           className={`ship-image ${ship.orientation}`}
//         />
//       </div>
//     </>
//   );
// };

// export default DraggableShip;