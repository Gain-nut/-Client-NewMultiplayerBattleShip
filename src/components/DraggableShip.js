import React, { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import './DraggableShip.css';

export const ItemTypes = {
  SHIP: 'ship',
};

const DraggableShip = ({ ship, onClick }) => {
  const ref = useRef();
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.SHIP,
      item: () => {
        // Calculate offset from mouse to top-left of ship in grid cells
        const rect = ref.current?.getBoundingClientRect();
        const event = window.__lastMouseEvent;
        let grabOffset = { row: 0, col: 0 };
        if (rect && event) {
          const offsetX = event.clientX - rect.left;
          const offsetY = event.clientY - rect.top;
          grabOffset = {
            row: Math.floor(offsetY / 42), // CELL_SIZE
            col: Math.floor(offsetX / 42),
          };
        }
        return { ...ship, grabOffset };
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [ship]
  );

  // Track last mouse event globally
  useEffect(() => {
    const handler = (e) => {
      window.__lastMouseEvent = e;
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  // Hide default drag preview image
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      ref={(node) => {
        drag(node);
        ref.current = node;
      }}
      className="draggable-ship-container"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={() => onClick(ship.id)}
    >
      {/* ✅ Use the image passed from ship prop */}
      <img
        src={ship.image}
        alt="Battleship"
        className={`ship-image ${ship.orientation}`}
      />
    </div>
  );
};

export default DraggableShip;
