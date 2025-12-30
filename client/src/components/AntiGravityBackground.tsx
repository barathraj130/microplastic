import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
  sway: number;
  swaySpeed: number;
}

const COLORS = [
  'rgba(255, 255, 255,', // White
  'rgba(0, 123, 255,',   // Research Blue (#007bff)
  'rgba(34, 211, 238,',   // Cyan (Secondary)
  'rgba(255, 140, 0,',   // Signal Orange (#ff8c00)
];

const PARTICLE_COUNT = 60;

export function AntiGravityBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  const createParticle = (width: number, height: number, initialY?: number): Particle => {
    const size = Math.random() * 3 + 1; // 1px to 4px
    const depth = size / 4; // normalized depth 0.25 to 1
    
    // Choose color: 70% white/blue/cyan, 10% orange
    const colorIndex = Math.random() > 0.1 ? Math.floor(Math.random() * 3) : 3;
    
    return {
      x: Math.random() * width,
      y: initialY !== undefined ? initialY : Math.random() * height,
      size,
      speedY: -(Math.random() * 0.5 + 0.2) * depth, // Upward speed proportional to size (parallax)
      speedX: (Math.random() - 0.5) * 0.2, // Base horizontal drift
      opacity: Math.random() * 0.5 + 0.2, // 0.2 to 0.7
      color: COLORS[colorIndex],
      sway: Math.random() * Math.PI * 2, // Start angle for sway
      swaySpeed: Math.random() * 0.02 + 0.01,
    };
  };

  const initParticles = (width: number, height: number) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }).map(() => 
      createParticle(width, height)
    );
  };

  const animate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    particlesRef.current.forEach(p => {
      // Logic: Move upward
      p.y += p.speedY;
      
      // Horizontal sway (water suspension effect)
      p.sway += p.swaySpeed;
      const currentSway = Math.sin(p.sway) * 0.5;
      p.x += p.speedX + currentSway;

      // Wrap around vertically (re-enter from bottom)
      if (p.y < -p.size) {
        p.y = height + p.size;
        p.x = Math.random() * width;
      }

      // Wrap around horizontally
      if (p.x < -p.size) p.x = width + p.size;
      if (p.x > width + p.size) p.x = -p.size;

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.opacity})`;
      
      // Add a soft glow to some particles
      if (p.size > 2) {
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = `${p.color}0.3)`;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
    });

    requestRef.current = requestAnimationFrame(() => animate(ctx, width, height));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Start animation
    requestRef.current = requestAnimationFrame(() => animate(ctx, canvas.width, canvas.height));

    // Handle visibility (pause when inactive)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      } else {
        // Re-sync and restart
        animate(ctx, canvas.width, canvas.height);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 bg-[#050b14]"
      style={{ pointerEvents: 'none' }}
    />
  );
}
