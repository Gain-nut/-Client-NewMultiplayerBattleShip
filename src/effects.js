// src/effects.js
// Custom lightweight particle engine for debris + fire effects

// Utility to spawn particles with physical motion
export function spawnParticles({ x, y, type = 'debris', count = 25 }) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.pointerEvents = 'none';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const particles = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const speed =
      type === 'fire' ? Math.random() * 2 + 1.5 : Math.random() * 4 + 2; // 🔥 tighter & slower for fire
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 60 + Math.random() * 30,
      color:
        type === 'fire'
          ? ['#ff4500', '#ffae00', '#ff8000', '#ffdc73'][Math.floor(Math.random() * 4)]
          : ['#444', '#666', '#999', '#333'][Math.floor(Math.random() * 4)],
      size: type === 'fire' ? Math.random() * 3 + 1 : Math.random() * 5 + 2,
      gravity: type === 'fire' ? 0.08 : 0.3,
      fadeRate: 0.015 + Math.random() * 0.005,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= 1;
      p.opacity = Math.max(0, p.life * p.fadeRate);

      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (type === 'fire') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.shadowBlur = 0;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });

    if (particles.some((p) => p.life > 0)) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(canvas);
    }
  }

  animate();
}

// Convert board cell → screen pixel → spawn particles
export function spawnAtCell(boardEl, row, col, cellSize, type) {
  if (!boardEl) return;
  const rect = boardEl.getBoundingClientRect();
  const x = rect.left + col * cellSize + cellSize / 2;
  const y = rect.top + row * cellSize + cellSize / 2;
  spawnParticles({ x, y, type });
}
