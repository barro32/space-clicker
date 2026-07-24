import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { TIME } from '../gameConstants.js';
import type { Rocket } from '../useGameStore.js';
import { getWorldSceneLayout, type WorldSceneLayout, type WorldSectionRefs } from '../world/worldLayout.js';

interface GlobalFlightOverlayProps extends WorldSectionRefs {
  explodedRocketIds: number[];
  recentlyLaunchedRocketIds?: number[];
  rockets: (Rocket | null)[];
  worldRef: RefObject<HTMLDivElement | null>;
}

interface Point {
  x: number;
  y: number;
}

function hashRocketOffset(id: number, spread: number) {
  const normalized = ((id * 37) % 1000) / 1000;
  return (normalized - 0.5) * spread;
}

function getQuadraticPoint(start: Point, control: Point, end: Point, t: number): Point {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function easeInCubic(t: number) {
  return t * t * t;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function getAngleBetweenPoints(start: Point, end: Point) {
  return Math.atan2(end.y - start.y, end.x - start.x);
}

function drawExhaustTrail(
  context: CanvasRenderingContext2D,
  point: Point,
  angle: number,
  color: string,
  length: number,
  width: number,
) {
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  const tailX = point.x - directionX * 8;
  const tailY = point.y - directionY * 8;
  const endX = tailX - directionX * length;
  const endY = tailY - directionY * length;

  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(tailX, tailY);
  context.lineTo(endX, endY);
  context.stroke();
  context.restore();
}

export function GlobalFlightOverlay({
  explodedRocketIds,
  moonRef,
  orbitRef,
  recentlyLaunchedRocketIds = [],
  rockets,
  surfaceRef,
  worldRef,
}: GlobalFlightOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<WorldSceneLayout | null>(null);
  const routeSnapshotsRef = useRef(new Map<number, { ticksRemaining: number; totalTicks: number; observedAt: number }>());
  const launchEchoesRef = useRef(new Map<number, number>());

  useEffect(() => {
    const worldElement = worldRef.current;
    if (!worldElement) {
      return;
    }

    const updateLayout = () => {
      setLayout(getWorldSceneLayout(worldElement, {
        moonRef,
        orbitRef,
        surfaceRef,
      }));
    };

    updateLayout();

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateLayout) : null;
    resizeObserver?.observe(worldElement);
    if (moonRef.current) resizeObserver?.observe(moonRef.current);
    if (orbitRef.current) resizeObserver?.observe(orbitRef.current);
    if (surfaceRef.current) resizeObserver?.observe(surfaceRef.current);
    window.addEventListener('resize', updateLayout);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, [moonRef, orbitRef, surfaceRef, worldRef]);

  const activeRockets = useMemo(
    () => rockets.filter((rocket): rocket is Rocket => rocket !== null && !explodedRocketIds.includes(rocket.id)),
    [rockets, explodedRocketIds],
  );

  useEffect(() => {
    const now = performance.now();
    const activeTransitIds = new Set<number>();

    activeRockets.forEach((rocket) => {
      if (rocket.locationLayer === 'transit') {
        activeTransitIds.add(rocket.id);
        const ticksRemaining = rocket.ticksRemaining ?? 0;
        const totalTicks = Math.max(1, rocket.totalTicks ?? ticksRemaining ?? 1);
        const previous = routeSnapshotsRef.current.get(rocket.id);

        if (!previous || previous.ticksRemaining !== ticksRemaining || previous.totalTicks !== totalTicks) {
          routeSnapshotsRef.current.set(rocket.id, {
            ticksRemaining,
            totalTicks,
            observedAt: now,
          });
        }
      }
    });

    for (const rocketId of Array.from(routeSnapshotsRef.current.keys())) {
      if (!activeTransitIds.has(rocketId)) {
        routeSnapshotsRef.current.delete(rocketId);
      }
    }
  }, [activeRockets]);

  useEffect(() => {
    const now = performance.now();
    recentlyLaunchedRocketIds.forEach((rocketId) => {
      if (!launchEchoesRef.current.has(rocketId)) {
        launchEchoesRef.current.set(rocketId, now);
      }
    });
  }, [recentlyLaunchedRocketIds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(layout.width * pixelRatio);
    canvas.height = Math.floor(layout.height * pixelRatio);
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const surfaceAnchor = layout.surfaceAnchor;
    const orbitAnchor = layout.orbitAnchor;
    const moonAnchor = layout.moonAnchor;

    let animationFrame = 0;
    const launchEchoDuration = TIME.TICK_INTERVAL_MS * 2;

    const getSmoothedTransitProgress = (rocket: Rocket, defaultDuration: number, now: number) => {
      const fallbackTotalTicks = Math.max(1, rocket.totalTicks ?? defaultDuration);
      const snapshot = routeSnapshotsRef.current.get(rocket.id);
      if (!snapshot) {
        const ticksRemaining = Math.max(0, rocket.ticksRemaining ?? fallbackTotalTicks);
        return Math.max(0, Math.min(1, 1 - ticksRemaining / fallbackTotalTicks));
      }

      const elapsedTicks = Math.max(0, (now - snapshot.observedAt) / TIME.TICK_INTERVAL_MS);
      const smoothedTicksRemaining = Math.max(0, snapshot.ticksRemaining - elapsedTicks);
      return Math.max(0, Math.min(1, 1 - smoothedTicksRemaining / snapshot.totalTicks));
    };

    const drawRocketGlyph = (point: Point, color: string, label: string, angle: number, glow = true) => {
      context.save();
      context.translate(point.x, point.y);
      context.rotate(angle);

      if (glow) {
        context.shadowColor = color;
        context.shadowBlur = 12;
      }

      context.fillStyle = color;
      context.beginPath();
      context.moveTo(10, 0);
      context.lineTo(-8, -5);
      context.lineTo(-4, 0);
      context.lineTo(-8, 5);
      context.closePath();
      context.fill();

      context.fillStyle = 'rgba(255,255,255,0.75)';
      context.fillRect(-6, -1, 4, 2);
      context.restore();
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, layout.width, layout.height);

      activeRockets.forEach((rocket) => {
        const label = `#${rocket.id}`;
        const surfaceOffset = hashRocketOffset(rocket.id, 120);
        const orbitOffset = hashRocketOffset(rocket.id + 11, 100);
        const moonOffset = hashRocketOffset(rocket.id + 29, 90);

        const locationLayer = rocket.locationLayer ?? 'surface';
        const pulse = 0.75 + 0.25 * Math.sin(now / 250 + rocket.id);
        const launchEchoStart = launchEchoesRef.current.get(rocket.id);
        const launchEchoProgress = launchEchoStart === undefined ? null : Math.min(1, Math.max(0, (now - launchEchoStart) / launchEchoDuration));

        if (launchEchoProgress !== null && launchEchoProgress >= 1) {
          launchEchoesRef.current.delete(rocket.id);
        }

        if (launchEchoProgress !== null && launchEchoProgress < 1) {
          const launchPad = {
            x: surfaceAnchor.x + surfaceOffset * 0.28,
            y: surfaceAnchor.y + (rocket.id % 3) * 14,
          };
          const apex = {
            x: launchPad.x + surfaceOffset * 0.38,
            y: layout.surfaceFrame.top + 36 + (rocket.id % 2) * 10,
          };
          const touchdown = {
            x: launchPad.x + surfaceOffset * 0.82,
            y: surfaceAnchor.y + (rocket.id % 3) * 10,
          };

          const ascentRatio = 0.58;
          const isAscent = launchEchoProgress < ascentRatio;
          const phaseProgress = isAscent
            ? launchEchoProgress / ascentRatio
            : (launchEchoProgress - ascentRatio) / (1 - ascentRatio);

          const point = isAscent
            ? {
                x: lerp(launchPad.x, apex.x, easeInCubic(phaseProgress)),
                y: lerp(launchPad.y, apex.y, easeInCubic(phaseProgress)),
              }
            : {
                x: lerp(
                  apex.x,
                  touchdown.x,
                  phaseProgress < 0.7
                    ? easeOutQuart(phaseProgress / 0.7)
                    : 1 - (1 - easeOutCubic((phaseProgress - 0.7) / 0.3)) * 0.08,
                ),
                y: lerp(
                  apex.y,
                  touchdown.y,
                  phaseProgress < 0.7
                    ? easeOutQuart(phaseProgress / 0.7)
                    : 1 - (1 - easeOutCubic((phaseProgress - 0.7) / 0.3)) * 0.08,
                ),
              };

          drawExhaustTrail(
            context,
            point,
            -Math.PI / 2,
            isAscent ? 'rgba(96, 165, 250, 0.55)' : 'rgba(251, 191, 36, 0.6)',
            isAscent ? 24 : 18,
            isAscent ? 3.5 : 3,
          );
          drawRocketGlyph(point, `rgba(255, 255, 255, ${0.82 + 0.12 * pulse})`, label, -Math.PI / 2);
        }

        if (locationLayer === 'surface') {
          return;
        }

        if (locationLayer === 'orbit') {
          const angle = (rocket.id % 10) * ((Math.PI * 2) / 10);
          const radius = 110 + (rocket.id % 3) * 12;
          const point = {
            x: orbitAnchor.x + Math.cos(angle) * radius,
            y: orbitAnchor.y + Math.sin(angle) * radius,
          };
          drawRocketGlyph(point, `rgba(34, 211, 238, ${0.75 + 0.2 * pulse})`, label, angle + Math.PI / 2);
          return;
        }

        if (locationLayer === 'moon') {
          const point = { x: moonAnchor.x + moonOffset, y: moonAnchor.y + 38 + (rocket.id % 2) * 12 };
          const color = rocket.moonRole === 'colony' ? `rgba(74, 222, 128, ${0.8 + 0.15 * pulse})` : `rgba(203, 213, 225, ${0.8 + 0.15 * pulse})`;
          drawRocketGlyph(point, color, label, -Math.PI / 8);
          return;
        }

        if (locationLayer === 'transit') {
          let point = { ...surfaceAnchor };
          let angle = -Math.PI / 4;

          if (rocket.transitRoute === 'surface_to_orbit') {
            const progress = getSmoothedTransitProgress(rocket, 30, now);
            const control = { x: layout.width * 0.7 + orbitOffset * 0.3, y: (surfaceAnchor.y + orbitAnchor.y) / 2 };
            const start = { x: surfaceAnchor.x + surfaceOffset * 0.2, y: surfaceAnchor.y - 16 };
            const end = { x: orbitAnchor.x + orbitOffset * 0.25, y: orbitAnchor.y };
            point = getQuadraticPoint(
              start,
              control,
              end,
              progress,
            );
            const lookAhead = getQuadraticPoint(start, control, end, Math.min(1, progress + 0.02));
            angle = getAngleBetweenPoints(point, lookAhead);
          } else if (rocket.transitRoute === 'surface_to_moon') {
            const progress = getSmoothedTransitProgress(rocket, 120, now);
            const control = { x: layout.width * 0.83 + moonOffset * 0.25, y: (surfaceAnchor.y + moonAnchor.y) / 2 };
            const start = { x: surfaceAnchor.x + surfaceOffset * 0.15, y: surfaceAnchor.y - 18 };
            const end = { x: moonAnchor.x + moonOffset * 0.25, y: moonAnchor.y + 10 };
            point = getQuadraticPoint(
              start,
              control,
              end,
              progress,
            );
            const lookAhead = getQuadraticPoint(start, control, end, Math.min(1, progress + 0.02));
            angle = getAngleBetweenPoints(point, lookAhead);
          } else if (rocket.transitRoute === 'moon_to_surface') {
            const progress = getSmoothedTransitProgress(rocket, 45, now);
            const control = { x: layout.width * 0.18 + surfaceOffset * 0.25, y: (surfaceAnchor.y + moonAnchor.y) / 2 };
            const start = { x: moonAnchor.x + moonOffset * 0.15, y: moonAnchor.y + 8 };
            const end = { x: surfaceAnchor.x + surfaceOffset * 0.15, y: surfaceAnchor.y - 20 };
            point = getQuadraticPoint(
              start,
              control,
              end,
              progress,
            );
            const lookAhead = getQuadraticPoint(start, control, end, Math.min(1, progress + 0.02));
            angle = getAngleBetweenPoints(point, lookAhead);
          }

          context.save();
          context.strokeStyle = 'rgba(251, 191, 36, 0.35)';
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(point.x - 10, point.y + 6);
          context.lineTo(point.x - 28, point.y + 16);
          context.stroke();
          context.restore();

          drawRocketGlyph(point, `rgba(250, 204, 21, ${0.88 + 0.1 * pulse})`, label, angle);
        }
      });

      animationFrame = window.requestAnimationFrame(draw);
    };

    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [activeRockets, layout, recentlyLaunchedRocketIds]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30"
    />
  );
}
