import React, { useEffect, useRef } from 'react';

// Musical note glyphs to disperse amongst constellation points
const MUSIC_NOTES = ['♪', '♫', '♩', '♬', '𝄞', '✦', '✧'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  phase: number;
  freqBand: number; // frequency band this node resonates to (0 to 15)
  isNoteGlyph: boolean;
  glyph: string;
  glyphSize: number;
  rotation: number;
  rotSpeed: number;
}

interface NodesBackgroundProps {
  isPlaying?: boolean;
  volume?: number;
  connectionDistance?: number;
  className?: string;
}

const AETHER_COLORS = [
  'rgba(56, 189, 248, ',  // Cyan
  'rgba(236, 72, 153, ',  // Pink / Magenta
  'rgba(245, 158, 11, ',  // Amber / Gold
  'rgba(168, 85, 247, ',  // Purple / Violet
  'rgba(52, 211, 153, ',  // Mint / Green
];

export const NodesBackground: React.FC<NodesBackgroundProps> = ({
  isPlaying = false,
  volume = 80,
  connectionDistance = 150,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Responsive particle count based on screen area (45-90 nodes)
    const particleCount = Math.min(90, Math.max(40, Math.floor((width * height) / 16000)));

    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isNote = Math.random() < 0.38; // ~38% of nodes are musical notes
      const baseRadius = isNote ? Math.random() * 2 + 3 : Math.random() * 2.5 + 1.5;
      
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: baseRadius,
        baseRadius,
        color: AETHER_COLORS[Math.floor(Math.random() * AETHER_COLORS.length)],
        phase: Math.random() * Math.PI * 2,
        freqBand: Math.floor(Math.random() * 16),
        isNoteGlyph: isNote,
        glyph: MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)],
        glyphSize: Math.random() * 8 + 14,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Interactive mouse attractor
    let mouse = { x: -9999, y: -9999, radius: 200 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;

    // Simulated 16-band audio spectrum analyzer values (smoothly undulating when playing)
    const audioBands = new Float32Array(16);

    const render = () => {
      time += 0.025;
      ctx.clearRect(0, 0, width, height);

      // Synthesize realistic audio frequency bounce when isPlaying is active
      for (let b = 0; b < 16; b++) {
        if (isPlaying) {
          const bassBoost = b < 4 ? 1.6 : 1.0;
          const target = (Math.sin(time * 3 + b * 0.8) * 0.5 + 0.5) *
                         (Math.cos(time * 5 + b * 1.4) * 0.3 + 0.7) *
                         (volume / 100) * bassBoost;
          audioBands[b] += (target - audioBands[b]) * 0.15;
        } else {
          audioBands[b] += (0.05 - audioBands[b]) * 0.05;
        }
      }

      const speedMultiplier = isPlaying ? 1.4 + (volume / 100) * 0.5 : 0.6;

      // Update & Draw Particles & Musical Notes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Individual frequency resonance value (0.0 to 1.5)
        const resonance = audioBands[p.freqBand] || 0.1;

        // Move particle with gentle audio bounce
        p.x += p.vx * speedMultiplier * (1 + resonance * 0.8);
        p.y += p.vy * speedMultiplier * (1 + resonance * 0.8);

        // Soft screen bounce
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        } else if (p.x > width) {
          p.x = width;
          p.vx *= -1;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        } else if (p.y > height) {
          p.y = height;
          p.vy *= -1;
        }

        // Mouse interaction: push away or pull
        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < mouse.radius) {
          const force = (1 - distMouse / mouse.radius) * 1.8;
          p.x -= (dxMouse / distMouse) * force;
          p.y -= (dyMouse / distMouse) * force;
        }

        // Pulse scale synced with music frequency resonance
        const beatPulse = isPlaying ? resonance * 1.8 : 0.2;
        p.rotation += p.rotSpeed * (1 + resonance * 2);

        if (p.isNoteGlyph) {
          // Render Floating Musical Note (♪, ♫, ♬) with harmonic glow
          const currentSize = p.glyphSize * (1 + beatPulse * 0.5);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          ctx.font = `bold ${Math.round(currentSize)}px "Plus Jakarta Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Glow around musical notes
          ctx.shadowColor = `${p.color}0.95)`;
          ctx.shadowBlur = isPlaying ? 14 + resonance * 12 : 6;
          ctx.fillStyle = `${p.color}${Math.min(1, 0.45 + resonance * 0.55)})`;
          ctx.fillText(p.glyph, 0, 0);

          ctx.restore();
        } else {
          // Render Standard Constellation Node with rhythmic breath
          const currentRadius = p.baseRadius * (1 + beatPulse * 0.8);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, currentRadius), 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${Math.min(1, 0.6 + resonance * 0.4)})`;
          ctx.shadowColor = `${p.color}0.95)`;
          ctx.shadowBlur = isPlaying ? 10 + resonance * 12 : 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Connect nearby nodes with harmonic audio waves
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = connectionDistance * (1 + (audioBands[0] || 0) * 0.25);

          if (dist < maxDist) {
            const jointResonance = (audioBands[p.freqBand] + audioBands[p2.freqBand]) * 0.5;
            const alpha = (1 - dist / maxDist) * (isPlaying ? 0.35 + jointResonance * 0.35 : 0.18);

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);

            // If music is loud, introduce slight waveform vibration on lines
            if (isPlaying && jointResonance > 0.4 && dist > 50) {
              const midX = (p.x + p2.x) / 2 + Math.sin(time * 8 + p.phase) * (jointResonance * 6);
              const midY = (p.y + p2.y) / 2 + Math.cos(time * 8 + p.phase) * (jointResonance * 6);
              ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
            } else {
              ctx.lineTo(p2.x, p2.y);
            }

            // Create gradient line between node colors
            const grad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            grad.addColorStop(0, `${p.color}${alpha})`);
            grad.addColorStop(1, `${p2.color}${alpha})`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(0.6, (1 - dist / maxDist) * (1.2 + jointResonance * 1.5));
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, volume, connectionDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none w-full h-full ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};
