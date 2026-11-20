import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Play, Pause, SkipBack, SkipForward, Maximize2 } from 'lucide-react';
import { ArtworkImage } from './ArtworkImage';

interface InteractiveCoverArtProps {
  title: string;
  artist: string;
  trackId: string;
  initialSrc?: string;
  isPlaying: boolean;
  isFavorite?: boolean;
  size?: 'panel' | 'cinema';
  priority?: boolean;
  onTogglePlay?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleFavorite?: () => void;
  onExpand?: () => void;
  className?: string;
}

interface SpringState {
  tx: number;
  vtx: number;
  ty: number;
  vty: number;
  rotX: number;
  vRotX: number;
  rotY: number;
  vRotY: number;
  rotZ: number;
  vRotZ: number;
  scaleX: number;
  vScaleX: number;
  scaleY: number;
  vScaleY: number;
  skewX: number;
  vSkewX: number;
  skewY: number;
  vSkewY: number;
}

interface SpringTargets {
  tx: number;
  ty: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
}

const REST_TARGETS: SpringTargets = {
  tx: 0,
  ty: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
};

function rubberBand(delta: number, limit: number): number {
  const sign = delta < 0 ? -1 : 1;
  const abs = Math.abs(delta);
  return sign * ((abs * limit) / (abs + limit * 0.85));
}

export const InteractiveCoverArt: React.FC<InteractiveCoverArtProps> = ({
  title,
  artist,
  trackId,
  initialSrc,
  isPlaying,
  isFavorite = false,
  size = 'cinema',
  priority = false,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleFavorite,
  onExpand,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glossRef = useRef<HTMLDivElement | null>(null);

  // Spring physics state kept in refs for 60-120fps zero-re-render motion
  const stateRef = useRef<SpringState>({
    tx: 0,
    vtx: 0,
    ty: 0,
    vty: 0,
    rotX: 0,
    vRotX: 0,
    rotY: 0,
    vRotY: 0,
    rotZ: 0,
    vRotZ: 0,
    scaleX: 1,
    vScaleX: 0,
    scaleY: 1,
    vScaleY: 0,
    skewX: 0,
    vSkewX: 0,
    skewY: 0,
    vSkewY: 0,
  });

  const targetRef = useRef<SpringTargets>({ ...REST_TARGETS });
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  // Pointer gesture tracking
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    vx: 0,
    vy: 0,
    movedDistance: 0,
  });

  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'prev' | 'next' | null>(null);
  const [feedbackBadge, setFeedbackBadge] = useState<'play' | 'pause' | 'like' | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((type: 'play' | 'pause' | 'like') => {
    setFeedbackBadge(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackBadge(null);
    }, 620);
  }, []);

  const stepSpring = (
    val: number,
    vel: number,
    target: number,
    stiffness: number,
    damping: number,
    dt: number
  ): [number, number] => {
    const force = (target - val) * stiffness;
    const damp = vel * damping;
    const nextVel = vel + (force - damp) * dt;
    const nextVal = val + nextVel * dt;
    return [nextVal, nextVel];
  };

  const applyTransform = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const s = stateRef.current;
    el.style.transform =
      `perspective(950px) ` +
      `translate3d(${s.tx.toFixed(2)}px, ${s.ty.toFixed(2)}px, 0) ` +
      `rotateX(${s.rotX.toFixed(2)}deg) ` +
      `rotateY(${s.rotY.toFixed(2)}deg) ` +
      `rotateZ(${s.rotZ.toFixed(2)}deg) ` +
      `skew(${s.skewX.toFixed(2)}deg, ${s.skewY.toFixed(2)}deg) ` +
      `scale3d(${s.scaleX.toFixed(4)}, ${s.scaleY.toFixed(4)}, 1)`;
  }, []);

  const ensureLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.004, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;

      const s = stateRef.current;
      const t = targetRef.current;
      const dragging = dragRef.current.active;

      // Snappier while dragging, juicy low-damping jelly wobble on release!
      const posStiff = dragging ? 340 : 210;
      const posDamp = dragging ? 24 : 13.5;
      const jellyStiff = dragging ? 290 : 250;
      const jellyDamp = dragging ? 20 : 11.2;

      [s.tx, s.vtx] = stepSpring(s.tx, s.vtx, t.tx, posStiff, posDamp, dt);
      [s.ty, s.vty] = stepSpring(s.ty, s.vty, t.ty, posStiff, posDamp, dt);
      [s.rotX, s.vRotX] = stepSpring(s.rotX, s.vRotX, t.rotX, 240, 15, dt);
      [s.rotY, s.vRotY] = stepSpring(s.rotY, s.vRotY, t.rotY, 240, 15, dt);
      [s.rotZ, s.vRotZ] = stepSpring(s.rotZ, s.vRotZ, t.rotZ, jellyStiff, jellyDamp, dt);
      [s.scaleX, s.vScaleX] = stepSpring(s.scaleX, s.vScaleX, t.scaleX, jellyStiff, jellyDamp, dt);
      [s.scaleY, s.vScaleY] = stepSpring(s.scaleY, s.vScaleY, t.scaleY, jellyStiff, jellyDamp, dt);
      [s.skewX, s.vSkewX] = stepSpring(s.skewX, s.vSkewX, t.skewX, jellyStiff, jellyDamp, dt);
      [s.skewY, s.vSkewY] = stepSpring(s.skewY, s.vSkewY, t.skewY, jellyStiff, jellyDamp, dt);

      applyTransform();

      const energy =
        Math.abs(s.tx - t.tx) +
        Math.abs(s.ty - t.ty) +
        Math.abs(s.rotX - t.rotX) +
        Math.abs(s.rotY - t.rotY) +
        Math.abs(s.rotZ - t.rotZ) +
        Math.abs(s.scaleX - t.scaleX) * 50 +
        Math.abs(s.scaleY - t.scaleY) * 50 +
        Math.abs(s.skewX - t.skewX) +
        Math.abs(s.skewY - t.skewY) +
        Math.abs(s.vtx) * 0.05 +
        Math.abs(s.vty) * 0.05 +
        Math.abs(s.vRotZ) * 0.08 +
        Math.abs(s.vScaleX) * 8 +
        Math.abs(s.vScaleY) * 8;

      if (dragging || energy > 0.06) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        s.tx = t.tx;
        s.ty = t.ty;
        s.rotX = t.rotX;
        s.rotY = t.rotY;
        s.rotZ = t.rotZ;
        s.scaleX = t.scaleX;
        s.scaleY = t.scaleY;
        s.skewX = t.skewX;
        s.skewY = t.skewY;
        s.vtx = s.vty = s.vRotX = s.vRotY = s.vRotZ = s.vScaleX = s.vScaleY = s.vSkewX = s.vSkewY = 0;
        applyTransform();
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [applyTransform]);

  // Trigger a playful jelly entrance wiggle when track changes
  const prevTrackIdRef = useRef<string>(trackId);
  useEffect(() => {
    if (prevTrackIdRef.current !== trackId) {
      prevTrackIdRef.current = trackId;
      const s = stateRef.current;
      s.scaleX = 0.94;
      s.scaleY = 1.06;
      s.vScaleX = 1.6;
      s.vScaleY = -1.4;
      s.vRotZ = (Math.random() > 0.5 ? 1 : -1) * 45;
      targetRef.current = { ...REST_TARGETS };
      ensureLoop();
    }
  }, [trackId, ensureLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const triggerJellyImpulse = useCallback(
    (intensity = 1, biasX = 0, biasY = 0) => {
      const s = stateRef.current;
      s.vScaleX += 1.9 * intensity;
      s.vScaleY -= 1.8 * intensity;
      s.vRotZ += (biasX !== 0 ? Math.sign(biasX) : 1) * 55 * intensity;
      s.vSkewX += biasX * 14 * intensity;
      s.vSkewY += biasY * 10 * intensity;
      ensureLoop();
    },
    [ensureLoop]
  );

  const updateGloss = (normX: number, normY: number, opacity: number) => {
    const g = glossRef.current;
    if (!g) return;
    const px = 50 + normX * 42;
    const py = 50 + normY * 42;
    g.style.background = `radial-gradient(circle at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(255,255,255,0.28) 0%, rgba(251,191,36,0.08) 28%, transparent 65%)`;
    g.style.opacity = opacity.toFixed(2);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const normX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));

    if (dragRef.current.active && dragRef.current.pointerId === e.pointerId) {
      const now = performance.now();
      const dt = Math.max(8, now - dragRef.current.lastTime);
      const dxFrame = e.clientX - dragRef.current.lastX;
      const dyFrame = e.clientY - dragRef.current.lastY;

      dragRef.current.vx = (dxFrame / dt) * 16;
      dragRef.current.vy = (dyFrame / dt) * 16;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      dragRef.current.lastTime = now;

      const totalDx = e.clientX - dragRef.current.startX;
      const totalDy = e.clientY - dragRef.current.startY;
      dragRef.current.movedDistance = Math.hypot(totalDx, totalDy);

      const maxTravel = size === 'cinema' ? 120 : 68;
      const elasticX = rubberBand(totalDx, maxTravel);
      const elasticY = rubberBand(totalDy, maxTravel * 0.72);

      // Volume-preserving jelly squash & stretch + velocity skew
      const stretchMag = Math.min(0.11, (Math.abs(elasticX) + Math.abs(elasticY)) / 950);
      const horizDominant = Math.abs(totalDx) >= Math.abs(totalDy);
      const scaleX = horizDominant ? 1 + stretchMag : 1 - stretchMag * 0.75;
      const scaleY = horizDominant ? 1 - stretchMag * 0.75 : 1 + stretchMag;

      const velSkewX = Math.max(-9, Math.min(9, dragRef.current.vx * 0.42));
      const velSkewY = Math.max(-6, Math.min(6, dragRef.current.vy * 0.3));

      targetRef.current = {
        tx: elasticX,
        ty: elasticY,
        rotX: Math.max(-18, Math.min(18, -elasticY * 0.24 - normY * 6)),
        rotY: Math.max(-20, Math.min(20, elasticX * 0.24 + normX * 6)),
        rotZ: Math.max(-13, Math.min(13, elasticX * 0.12 + dragRef.current.vx * 0.16)),
        scaleX,
        scaleY,
        skewX: velSkewX,
        skewY: velSkewY,
      };

      // Update swipe peek indicator if past threshold
      const swipeThreshold = size === 'cinema' ? 76 : 48;
      if (totalDx <= -swipeThreshold && onNext) {
        setSwipeDirection('next');
      } else if (totalDx >= swipeThreshold && onPrev) {
        setSwipeDirection('prev');
      } else {
        setSwipeDirection(null);
      }

      updateGloss(normX, normY, 0.9);
      ensureLoop();
      return;
    }

    // Gentle hover 3D parallax tilt
    const maxTilt = size === 'cinema' ? 11 : 10;
    targetRef.current = {
      ...REST_TARGETS,
      rotX: -normY * maxTilt,
      rotY: normX * maxTilt,
      rotZ: normX * 1.4,
      scaleX: 1.018,
      scaleY: 1.018,
    };
    updateGloss(normX, normY, 0.65);
    ensureLoop();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Do not hijack clicks on the corner Expand button
    if ((e.target as HTMLElement).closest('button[data-cover-action="true"]')) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: now,
      vx: 0,
      vy: 0,
      movedDistance: 0,
    };

    setIsDragging(true);
    setSwipeDirection(null);

    // Immediate tactile squish on press
    targetRef.current = {
      ...targetRef.current,
      scaleX: 0.96,
      scaleY: 0.94,
    };
    stateRef.current.vScaleX -= 0.7;
    stateRef.current.vScaleY -= 0.9;
    ensureLoop();
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) return;

    const totalDx = e.clientX - dragRef.current.startX;
    const vx = dragRef.current.vx;
    const moved = dragRef.current.movedDistance;

    dragRef.current.active = false;
    dragRef.current.pointerId = -1;
    setIsDragging(false);
    setSwipeDirection(null);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const swipeThreshold = size === 'cinema' ? 76 : 48;
    const fastSwipe = Math.abs(vx) > 12 && Math.abs(totalDx) > 30;

    if (!cancelled && (totalDx <= -swipeThreshold || (fastSwipe && totalDx < 0)) && onNext) {
      // Launch wiggle left -> Next track
      stateRef.current.vtx -= 900;
      stateRef.current.vRotZ -= 120;
      triggerJellyImpulse(1.25, -1, 0);
      targetRef.current = { ...REST_TARGETS };
      onNext();
      return;
    }

    if (!cancelled && (totalDx >= swipeThreshold || (fastSwipe && totalDx > 0)) && onPrev) {
      // Launch wiggle right -> Previous track
      stateRef.current.vtx += 900;
      stateRef.current.vRotZ += 120;
      triggerJellyImpulse(1.25, 1, 0);
      targetRef.current = { ...REST_TARGETS };
      onPrev();
      return;
    }

    // Was it a tap/click without dragging?
    if (!cancelled && moved < 9) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      lastTapRef.current = now;

      if (timeSinceLastTap < 290) {
        // Double-tap -> Like with big amber heart burst + jelly bounce!
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        targetRef.current = { ...REST_TARGETS };
        triggerJellyImpulse(1.5, 0, -1);
        showFeedback('like');
        onToggleFavorite?.();
        return;
      }

      // Single tap -> Jelly poke + Play/Pause toggle (slight delay so double-tap doesn't pause)
      targetRef.current = { ...REST_TARGETS };
      triggerJellyImpulse(0.95, 0.5, 0.3);
      if (onTogglePlay) {
        singleTapTimerRef.current = setTimeout(() => {
          singleTapTimerRef.current = null;
          showFeedback(isPlaying ? 'pause' : 'play');
          onTogglePlay();
        }, 220);
      }
      return;
    }

    // Elastic snap-back jelly wobble!
    const snapEnergy = Math.min(1.8, Math.max(0.7, moved / 75));
    stateRef.current.vScaleX += 2.3 * snapEnergy;
    stateRef.current.vScaleY -= 2.1 * snapEnergy;
    stateRef.current.vRotZ += (totalDx >= 0 ? -1 : 1) * 70 * snapEnergy;
    stateRef.current.vSkewX += -Math.sign(totalDx || 1) * 18 * snapEnergy;
    targetRef.current = { ...REST_TARGETS };
    ensureLoop();
  };

  const handlePointerLeave = () => {
    if (dragRef.current.active) return;
    targetRef.current = { ...REST_TARGETS };
    updateGloss(0, 0, 0);
    ensureLoop();
  };

  const isCinema = size === 'cinema';

  return (
    <div className={`relative select-none ${className}`}>
      {/* Interactive Grab / Tilt / Swipe Stage */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={(e) => finishDrag(e, false)}
        onPointerCancel={(e) => finishDrag(e, true)}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: 'none' }}
        className={`relative w-full aspect-square group ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        aria-label={`${title} by ${artist} — drag to wiggle or swipe to skip, tap to play or pause, double-tap to like`}
      >
        {/* Subtle Alive Breathing Aura While Playing */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-3 rounded-3xl transition-opacity duration-500 blur-2xl ${
            isDragging
              ? 'opacity-45 bg-amber-500/25'
              : isPlaying
              ? 'opacity-25 bg-amber-500/20'
              : 'opacity-0'
          }`}
        />

        {/* Swipe Directional Peek Indicators (Behind the Cover) */}
        {swipeDirection === 'prev' && (
          <div className="pointer-events-none absolute inset-y-0 left-2 z-0 flex items-center">
            <div className="px-2.5 py-1.5 rounded-lg bg-[#141418]/90 border border-amber-400/35 text-amber-300 text-xs font-semibold flex items-center gap-1 shadow-lg">
              <SkipBack className="w-3.5 h-3.5 fill-current" />
              <span>Prev</span>
            </div>
          </div>
        )}
        {swipeDirection === 'next' && (
          <div className="pointer-events-none absolute inset-y-0 right-2 z-0 flex items-center">
            <div className="px-2.5 py-1.5 rounded-lg bg-[#141418]/90 border border-amber-400/35 text-amber-300 text-xs font-semibold flex items-center gap-1 shadow-lg">
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        )}

        {/* Spring-Physics Transformed Cover Card */}
        <div
          ref={cardRef}
          style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}
          className={`relative z-10 w-full h-full overflow-hidden bg-[#111114] ${
            isCinema
              ? 'rounded-2xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.92)] ring-1 ring-white/[0.15]'
              : 'rounded-xl shadow-[0_18px_45px_-16px_rgba(0,0,0,0.88)] ring-1 ring-white/[0.12]'
          }`}
        >
          <ArtworkImage
            title={title}
            artist={artist}
            trackId={trackId}
            initialSrc={initialSrc}
            alt={title}
            priority={priority}
            className="w-full h-full object-cover pointer-events-none select-none"
          />

          {/* Dynamic Specular Light Sheen Following Tilt / Pointer */}
          <div
            ref={glossRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 mix-blend-screen"
          />

          {/* Subtle Inner Edge Highlight */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 border border-white/[0.12] ${
              isCinema ? 'rounded-2xl' : 'rounded-xl'
            }`}
          />

          {/* Tap / Double-Tap Gesture Feedback Glyph */}
          {feedbackBadge && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px] animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-black/75 border border-amber-400/40 flex items-center justify-center shadow-2xl">
                {feedbackBadge === 'like' ? (
                  <Heart
                    className={`w-7 h-7 text-amber-400 ${
                      !isFavorite ? 'fill-amber-400' : 'fill-amber-400/30'
                    }`}
                  />
                ) : feedbackBadge === 'play' ? (
                  <Play className="w-6 h-6 text-amber-300 fill-current ml-0.5" />
                ) : (
                  <Pause className="w-6 h-6 text-amber-300 fill-current" />
                )}
              </div>
            </div>
          )}

          {/* Optional Corner Expand Button (for Right Panel -> Cinema Mode) */}
          {onExpand && (
            <button
              type="button"
              data-cover-action="true"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="absolute bottom-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md text-zinc-100 hover:text-amber-300 flex items-center justify-center border border-white/[0.14] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              title="Open Cover Art in Cinema Mode"
              aria-label="Open Cover Art in Cinema Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
