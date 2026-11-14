import React, { useEffect, useRef } from 'react';
import { VisualizerMode } from '../types/player';

interface AudioVisualizerProps {
  isPlaying: boolean;
  volume: number; // 0 to 100
  mode: VisualizerMode;
  className?: string;
  accentColor?: string;
  accentSecondary?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(245, 158, 11, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  volume,
  mode,
  className = '',
  accentColor = '#f59e0b',
  accentSecondary = '#fbbf24',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const smoothedEnergyRef = useRef<number>(0.2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resize();
    window.addEventListener('resize', resize);

    const barCount = 48;
    const barHeights = new Float32Array(barCount).fill(10);
    const targetHeights = new Float32Array(barCount).fill(10);

    const render = () => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Energy factor based on playback state and volume
      const targetEnergy = isPlaying ? Math.max(0.25, volume / 100) : 0.05;
      smoothedEnergyRef.current += (targetEnergy - smoothedEnergyRef.current) * 0.1;
      const energy = smoothedEnergyRef.current;

      phaseRef.current += isPlaying ? 0.04 : 0.008;
      const phase = phaseRef.current;

      if (mode === 'spectrum') {
        // Equalizer Studio Spectrum Bars
        const barWidth = Math.max(3, (width - (barCount - 1) * 3) / barCount);
        const maxHeight = height * 0.85;

        for (let i = 0; i < barCount; i++) {
          if (isPlaying) {
            const freq = i / barCount;
            const bass = Math.sin(phase * 3 + freq * 2) * 0.5 + 0.5;
            const mid = Math.cos(phase * 4 + freq * 8) * 0.5 + 0.5;
            const treble = Math.sin(phase * 6 + freq * 16) * 0.5 + 0.5;

            // Bell curve emphasis on low-mids
            const bell = Math.exp(-Math.pow((freq - 0.25) * 3, 2));
            targetHeights[i] = (bass * 0.4 + mid * 0.35 + treble * 0.25) * bell * maxHeight * energy + 6;
          } else {
            targetHeights[i] = 4;
          }

          barHeights[i] += (targetHeights[i] - barHeights[i]) * 0.18;

          const h = Math.max(3, barHeights[i]);
          const x = i * (barWidth + 3);
          const y = (height - h) / 2;

          // Studio Gradient with theme accents
          const grad = ctx.createLinearGradient(0, y, 0, y + h);
          grad.addColorStop(0, accentSecondary);
          grad.addColorStop(0.5, accentColor);
          grad.addColorStop(1, hexToRgba(accentColor, 0.7));

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, h, [2, 2, 2, 2]);
          ctx.fill();

          // Subtle reflection
          ctx.fillStyle = hexToRgba(accentColor, 0.08);
          ctx.beginPath();
          ctx.roundRect(x, y + h + 4, barWidth, h * 0.3, [1, 1, 1, 1]);
          ctx.fill();
        }
      } else if (mode === 'wave') {
        // Fluid Oscilloscope Dual Ribbon Wave
        const centerY = height / 2;
        const wavePoints = 100;
        const step = width / (wavePoints - 1);

        // Layer 1: Background Glow Wave
        ctx.beginPath();
        for (let i = 0; i < wavePoints; i++) {
          const x = i * step;
          const normalX = i / wavePoints;
          const envelope = Math.sin(normalX * Math.PI);
          const wave =
            Math.sin(normalX * 8 + phase * 2) * 0.6 +
            Math.cos(normalX * 14 - phase * 1.5) * 0.4;
          const y = centerY + wave * (height * 0.35) * energy * envelope;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = hexToRgba(accentColor, 0.35);
        ctx.lineWidth = 4;
        ctx.stroke();

        // Layer 2: Sharp Foreground Core Wave
        ctx.beginPath();
        for (let i = 0; i < wavePoints; i++) {
          const x = i * step;
          const normalX = i / wavePoints;
          const envelope = Math.sin(normalX * Math.PI);
          const wave =
            Math.sin(normalX * 10 - phase * 3) * 0.7 +
            Math.sin(normalX * 22 + phase) * 0.3;
          const y = centerY + wave * (height * 0.3) * energy * envelope;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (mode === 'aura') {
        // Concentric Sonic Ring Pulses
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.9;
        const ringCount = 5;

        for (let r = 0; r < ringCount; r++) {
          const ringProgress = (phase * 0.3 + r / ringCount) % 1;
          const radius = 20 + ringProgress * (maxRadius - 20);
          const opacity = Math.max(0, (1 - ringProgress) * energy * 0.7);

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = hexToRgba(accentColor, opacity);
          ctx.lineWidth = 1.5 + (1 - ringProgress) * 2;
          ctx.stroke();
        }

        // Center pulsing dot
        const centerPulse = 6 + Math.sin(phase * 4) * 2 * energy;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerPulse, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
      } else {
        // Mode 'minimal': Dieter Rams rhythmic level dots
        const dotCount = 32;
        const spacing = width / dotCount;
        const centerY = height / 2;

        for (let i = 0; i < dotCount; i++) {
          const x = i * spacing + spacing / 2;
          const normalized = i / dotCount;
          const distFromCenter = 1 - Math.abs(normalized - 0.5) * 2;
          const val =
            Math.sin(phase * 3 + normalized * 10) * 0.5 + 0.5;
          const dotRadius = Math.max(1.5, val * distFromCenter * 5 * energy + 1.5);

          ctx.beginPath();
          ctx.arc(x, centerY, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = isPlaying
            ? hexToRgba(accentColor, 0.3 + val * 0.7)
            : 'rgba(161, 161, 170, 0.2)';
          ctx.fill();
        }
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, volume, mode, accentColor, accentSecondary]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
      aria-label="Audio frequency visualizer"
    />
  );
};
