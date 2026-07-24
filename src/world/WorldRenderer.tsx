import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { TIME } from '../gameConstants.js';
import type { DockedRocket, Rocket, SpaceDebris, SpaceStation, TransitRocket } from '../useGameStore.js';
import { getWorldSceneLayout, type WorldPoint, type WorldSceneLayout, type WorldSectionRefs } from './worldLayout.js';

type PixiModule = typeof import('pixi.js');
type PixiApplication = import('pixi.js').Application;
type PixiContainer = import('pixi.js').Container;
type PixiGraphics = import('pixi.js').Graphics;
type PixiText = import('pixi.js').Text;

interface WorldRendererProps extends WorldSectionRefs {
  clearDebris: (debrisId: string) => void;
  effectiveSurfaceCapacity: number;
  explodedRocketIds: number[];
  dockedRockets: DockedRocket[];
  fuelRefineries: number;
  onSelectStation: (stationId: string | null) => void;
  onSelectSpaceport: (spaceportId: number | null) => void;
  recentlyLaunchedRocketIds?: number[];
  rockets: (Rocket | null)[];
  satellites: number;
  selectedSpaceportId: number | null;
  selectedStationId: string | null;
  spaceports: { id: number }[];
  spaceDebris: SpaceDebris[];
  spaceStations: SpaceStation[];
  transitRockets: TransitRocket[];
  worldRef: RefObject<HTMLDivElement | null>;
}

interface RocketSnapshot {
  ticksRemaining: number;
  totalTicks: number;
  observedAt: number;
}

interface WorldLayers {
  root: PixiContainer;
  staticLayer: PixiGraphics;
  routeLayer: PixiGraphics;
  orbitLayer: PixiGraphics;
  rocketLayer: PixiGraphics;
  labelLayer: PixiContainer;
  interactionLayer: PixiContainer;
}

function hashRocketOffset(id: number, spread: number) {
  const normalized = ((id * 37) % 1000) / 1000;
  return (normalized - 0.5) * spread;
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

function getAngleBetweenPoints(start: WorldPoint, end: WorldPoint) {
  return Math.atan2(end.y - start.y, end.x - start.x);
}

function getQuadraticPoint(start: WorldPoint, control: WorldPoint, end: WorldPoint, t: number): WorldPoint {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

function isPixiEnvironmentSupported() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  return !/jsdom/i.test(navigator.userAgent);
}

export function WorldRenderer({
  clearDebris,
  effectiveSurfaceCapacity,
  dockedRockets,
  explodedRocketIds,
  fuelRefineries,
  moonRef,
  onSelectStation,
  onSelectSpaceport,
  orbitRef,
  recentlyLaunchedRocketIds = [],
  rockets,
  satellites,
  selectedSpaceportId,
  selectedStationId,
  spaceports,
  spaceDebris,
  spaceStations,
  surfaceRef,
  transitRockets,
  worldRef,
}: WorldRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PixiApplication | null>(null);
  const pixiRef = useRef<PixiModule | null>(null);
  const layersRef = useRef<WorldLayers | null>(null);
  const layoutRef = useRef<WorldSceneLayout | null>(null);
  const rocketsRef = useRef(rockets);
  const explodedIdsRef = useRef(explodedRocketIds);
  const effectiveSurfaceCapacityRef = useRef(effectiveSurfaceCapacity);
  const fuelRefineriesRef = useRef(fuelRefineries);
  const satellitesRef = useRef(satellites);
  const spaceportsRef = useRef(spaceports);
  const selectedSpaceportIdRef = useRef(selectedSpaceportId);
  const spaceStationsRef = useRef(spaceStations);
  const dockedRocketsRef = useRef(dockedRockets);
  const transitRocketsRef = useRef(transitRockets);
  const spaceDebrisRef = useRef(spaceDebris);
  const selectedStationIdRef = useRef(selectedStationId);
  const onSelectStationRef = useRef(onSelectStation);
  const onSelectSpaceportRef = useRef(onSelectSpaceport);
  const clearDebrisRef = useRef(clearDebris);
  const routeSnapshotsRef = useRef(new Map<number, RocketSnapshot>());
  const launchEchoesRef = useRef(new Map<number, number>());
  const labelPoolRef = useRef(new Map<number, PixiText>());

  rocketsRef.current = rockets;
  explodedIdsRef.current = explodedRocketIds;
  effectiveSurfaceCapacityRef.current = effectiveSurfaceCapacity;
  fuelRefineriesRef.current = fuelRefineries;
  satellitesRef.current = satellites;
  spaceportsRef.current = spaceports;
  selectedSpaceportIdRef.current = selectedSpaceportId;
  spaceStationsRef.current = spaceStations;
  dockedRocketsRef.current = dockedRockets;
  transitRocketsRef.current = transitRockets;
  spaceDebrisRef.current = spaceDebris;
  selectedStationIdRef.current = selectedStationId;
  onSelectStationRef.current = onSelectStation;
  onSelectSpaceportRef.current = onSelectSpaceport;
  clearDebrisRef.current = clearDebris;

  useEffect(() => {
    const now = performance.now();
    const activeTransitIds = new Set<number>();

    rockets
      .filter((rocket): rocket is Rocket => rocket !== null && !explodedRocketIds.includes(rocket.id))
      .forEach((rocket) => {
        if (rocket.locationLayer !== 'transit') {
          return;
        }

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
      });

    for (const rocketId of Array.from(routeSnapshotsRef.current.keys())) {
      if (!activeTransitIds.has(rocketId)) {
        routeSnapshotsRef.current.delete(rocketId);
      }
    }
  }, [explodedRocketIds, rockets]);

  useEffect(() => {
    const now = performance.now();
    recentlyLaunchedRocketIds.forEach((rocketId) => {
      if (!launchEchoesRef.current.has(rocketId)) {
        launchEchoesRef.current.set(rocketId, now);
      }
    });
  }, [recentlyLaunchedRocketIds]);

  useEffect(() => {
    const worldElement = worldRef.current;
    if (!worldElement) {
      return;
    }

    const updateLayout = () => {
      layoutRef.current = getWorldSceneLayout(worldElement, {
        moonRef,
        orbitRef,
        surfaceRef,
      });
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

  useEffect(() => {
    if (!isPixiEnvironmentSupported() || !containerRef.current) {
      return;
    }

    let isDisposed = false;

    const initialize = async () => {
      const pixi = await import('pixi.js');
      if (isDisposed || !containerRef.current) {
        return;
      }

      pixiRef.current = pixi;
      const app = new pixi.Application();
      await app.init({
        antialias: true,
        backgroundAlpha: 0,
        eventMode: 'static',
        preference: 'webgl',
        resizeTo: containerRef.current,
        resolution: window.devicePixelRatio || 1,
      });

      if (isDisposed || !containerRef.current) {
        app.destroy();
        return;
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      const root = new pixi.Container();
      const staticLayer = new pixi.Graphics();
      const routeLayer = new pixi.Graphics();
      const orbitLayer = new pixi.Graphics();
      const rocketLayer = new pixi.Graphics();
      const labelLayer = new pixi.Container();
      const interactionLayer = new pixi.Container();

      root.addChild(staticLayer);
      root.addChild(routeLayer);
      root.addChild(orbitLayer);
      root.addChild(rocketLayer);
      root.addChild(labelLayer);
      root.addChild(interactionLayer);
      app.stage.addChild(root);

      layersRef.current = {
        root,
        staticLayer,
        routeLayer,
        orbitLayer,
        rocketLayer,
        labelLayer,
        interactionLayer,
      };

      const renderScene = () => {
        const layout = layoutRef.current;
        const currentPixi = pixiRef.current;
        const layers = layersRef.current;
        if (!layout || !currentPixi || !layers) {
          return;
        }

        drawStaticScene(layers.staticLayer, layout);
        drawRoutes(layers.routeLayer, layout);
        layers.interactionLayer.removeChildren().forEach((child) => child.destroy());
        drawSurfaceObjects({
          effectiveSurfaceCapacity: effectiveSurfaceCapacityRef.current,
          explodedRocketIds: explodedIdsRef.current,
          fuelRefineries: fuelRefineriesRef.current,
          graphics: layers.staticLayer,
          interactionLayer: layers.interactionLayer,
          onSelectSpaceport: onSelectSpaceportRef.current,
          rockets: rocketsRef.current,
          selectedSpaceportId: selectedSpaceportIdRef.current,
          spaceports: spaceportsRef.current,
          worldLayout: layout,
        });
        drawOrbitObjects({
          clearDebris: clearDebrisRef.current,
          dockedRockets: dockedRocketsRef.current,
          graphics: layers.orbitLayer,
          interactionLayer: layers.interactionLayer,
          onSelectStation: onSelectStationRef.current,
          pixi: currentPixi,
          selectedStationId: selectedStationIdRef.current,
          satellites: satellitesRef.current,
          spaceDebris: spaceDebrisRef.current,
          spaceStations: spaceStationsRef.current,
          transitRockets: transitRocketsRef.current,
          worldLayout: layout,
        });
        drawRockets({
          labelPool: labelPoolRef.current,
          labelLayer: layers.labelLayer,
          now: performance.now(),
          pixi: currentPixi,
          layout,
          rocketGraphics: layers.rocketLayer,
          rockets: rocketsRef.current,
          explodedRocketIds: explodedIdsRef.current,
          routeSnapshots: routeSnapshotsRef.current,
          launchEchoes: launchEchoesRef.current,
        });
      };

      app.ticker.add(renderScene);
    };

    void initialize();

    return () => {
      isDisposed = true;

      labelPoolRef.current.clear();
      launchEchoesRef.current.clear();
      routeSnapshotsRef.current.clear();

      const app = appRef.current;
      if (app) {
        app.destroy(true, { children: true });
        appRef.current = null;
      }

      layersRef.current = null;
      pixiRef.current = null;

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0 z-10" />;
}

function drawStaticScene(graphics: PixiGraphics, layout: WorldSceneLayout) {
  graphics.clear();

  const earthRadius = Math.min(96, Math.max(72, layout.surfaceFrame.height * 0.1));
  const orbitRadius = Math.min(172, Math.max(130, layout.orbitFrame.height * 0.16));
  const moonRadius = Math.min(58, Math.max(40, layout.moonFrame.height * 0.06));

  graphics.circle(layout.surfaceAnchor.x, layout.surfaceAnchor.y + earthRadius * 0.15, earthRadius + 18).fill({ color: 0x0f172a, alpha: 0.22 });
  graphics.circle(layout.surfaceAnchor.x, layout.surfaceAnchor.y + earthRadius * 0.15, earthRadius).fill({ color: 0x2563eb, alpha: 0.22 });
  graphics.circle(layout.surfaceAnchor.x, layout.surfaceAnchor.y + earthRadius * 0.2, earthRadius * 0.8).fill({ color: 0x38bdf8, alpha: 0.1 });

  graphics.circle(layout.orbitAnchor.x, layout.orbitAnchor.y, orbitRadius).stroke({ width: 2, color: 0x64748b, alpha: 0.22 });
  graphics.circle(layout.orbitAnchor.x, layout.orbitAnchor.y, orbitRadius - 26).stroke({ width: 1, color: 0x0ea5e9, alpha: 0.12 });

  graphics.circle(layout.moonAnchor.x, layout.moonAnchor.y, moonRadius + 12).fill({ color: 0xf8fafc, alpha: 0.06 });
  graphics.circle(layout.moonAnchor.x, layout.moonAnchor.y, moonRadius).fill({ color: 0xe2e8f0, alpha: 0.18 });
  graphics.circle(layout.moonAnchor.x - moonRadius * 0.24, layout.moonAnchor.y - moonRadius * 0.1, moonRadius * 0.18).fill({ color: 0x94a3b8, alpha: 0.18 });
}

function drawRoutes(graphics: PixiGraphics, layout: WorldSceneLayout) {
  graphics.clear();

  graphics
    .moveTo(layout.surfaceAnchor.x, layout.surfaceAnchor.y - 16)
    .quadraticCurveTo(layout.width * 0.7, (layout.surfaceAnchor.y + layout.orbitAnchor.y) / 2, layout.orbitAnchor.x, layout.orbitAnchor.y)
    .stroke({ width: 2, color: 0x3b82f6, alpha: 0.15 });

  graphics
    .moveTo(layout.surfaceAnchor.x, layout.surfaceAnchor.y - 18)
    .quadraticCurveTo(layout.width * 0.82, (layout.surfaceAnchor.y + layout.moonAnchor.y) / 2, layout.moonAnchor.x, layout.moonAnchor.y + 8)
    .stroke({ width: 2, color: 0x38bdf8, alpha: 0.12 });
}

function drawSurfaceObjects({
  effectiveSurfaceCapacity,
  explodedRocketIds,
  fuelRefineries,
  graphics,
  interactionLayer,
  onSelectSpaceport,
  rockets,
  selectedSpaceportId,
  spaceports,
  worldLayout,
}: {
  effectiveSurfaceCapacity: number;
  explodedRocketIds: number[];
  fuelRefineries: number;
  graphics: PixiGraphics;
  interactionLayer: PixiContainer;
  onSelectSpaceport: (spaceportId: number | null) => void;
  rockets: (Rocket | null)[];
  selectedSpaceportId: number | null;
  spaceports: { id: number }[];
  worldLayout: WorldSceneLayout;
}) {
  const padBaseY = worldLayout.surfaceAnchor.y + 82;
  const padSpacing = Math.min(180, Math.max(110, worldLayout.width / Math.max(spaceports.length + 1, 3)));
  const firstPadX = worldLayout.surfaceAnchor.x - ((spaceports.length - 1) * padSpacing) / 2;

  spaceports.forEach((spaceport, index) => {
    const x = firstPadX + index * padSpacing;
    const isSelected = selectedSpaceportId === spaceport.id;
    const slotStart = index * effectiveSurfaceCapacity;
    const assignedRockets = rockets.slice(slotStart, slotStart + effectiveSurfaceCapacity);
    const activeAssignedCount = assignedRockets.filter((rocket) => rocket !== null).length;
    const explodedCount = assignedRockets.filter((rocket) => rocket !== null && explodedRocketIds.includes(rocket.id)).length;

    graphics.roundRect(x - 42, padBaseY - 18, 84, 26, 8).fill({ color: isSelected ? 0x1d4ed8 : 0x0f172a, alpha: 0.38 });
    graphics.roundRect(x - 42, padBaseY - 18, 84, 26, 8).stroke({ width: 2, color: isSelected ? 0xe2e8f0 : 0x38bdf8, alpha: isSelected ? 0.75 : 0.35 });
    graphics.rect(x - 14, padBaseY - 34, 28, 16).fill({ color: 0x1e293b, alpha: 0.75 });

    for (let slotIndex = 0; slotIndex < Math.min(6, effectiveSurfaceCapacity); slotIndex += 1) {
      const slotX = x - 26 + slotIndex * 10;
      graphics.roundRect(slotX, padBaseY - 10, 7, 7, 2).fill({
        color: slotIndex < activeAssignedCount ? 0x60a5fa : 0x334155,
        alpha: slotIndex < activeAssignedCount ? 0.75 : 0.4,
      });
    }

    if (explodedCount > 0) {
      graphics.circle(x + 30, padBaseY - 20, 8).fill({ color: 0xef4444, alpha: 0.92 });
    }

    const hitArea = new pixi.Graphics()
      .roundRect(x - 50, padBaseY - 42, 100, 52, 10)
      .fill({ color: 0xffffff, alpha: 0.001 });
    hitArea.eventMode = 'static';
    hitArea.cursor = 'pointer';
    hitArea.on('pointertap', () => onSelectSpaceport(isSelected ? null : spaceport.id));
    interactionLayer.addChild(hitArea);
  });

  const refineryBaseX = worldLayout.surfaceAnchor.x + Math.min(260, worldLayout.surfaceFrame.width * 0.28);
  const refineryBaseY = worldLayout.surfaceAnchor.y + 54;
  for (let index = 0; index < fuelRefineries; index += 1) {
    const x = refineryBaseX + (index % 4) * 28;
    const y = refineryBaseY + Math.floor(index / 4) * 24;
    graphics.rect(x, y, 16, 18).fill({ color: 0xf97316, alpha: 0.36 });
    graphics.rect(x + 4, y - 8, 8, 10).fill({ color: 0xfb923c, alpha: 0.42 });
  }
}

function drawOrbitObjects({
  clearDebris,
  dockedRockets,
  graphics,
  interactionLayer,
  onSelectStation,
  pixi,
  selectedStationId,
  satellites,
  spaceDebris,
  spaceStations,
  transitRockets,
  worldLayout,
}: {
  clearDebris: (debrisId: string) => void;
  dockedRockets: DockedRocket[];
  graphics: PixiGraphics;
  interactionLayer: PixiContainer;
  onSelectStation: (stationId: string | null) => void;
  pixi: PixiModule;
  selectedStationId: string | null;
  satellites: number;
  spaceDebris: SpaceDebris[];
  spaceStations: SpaceStation[];
  transitRockets: TransitRocket[];
  worldLayout: WorldSceneLayout;
}) {
  graphics.clear();

  const satelliteRadius = 92;
  const stationRadius = 148;

  Array.from({ length: satellites }).forEach((_, index) => {
    const angle = (index / Math.max(satellites, 1)) * Math.PI * 2;
    const point = {
      x: worldLayout.orbitAnchor.x + Math.cos(angle) * satelliteRadius,
      y: worldLayout.orbitAnchor.y + Math.sin(angle) * satelliteRadius,
    };
    graphics.circle(point.x, point.y, 3).fill({ color: 0x22d3ee, alpha: 0.78 });
  });

  spaceDebris.forEach((debris) => {
    const angleRadians = (debris.angle / 180) * Math.PI;
    const point = {
      x: worldLayout.orbitAnchor.x + Math.cos(angleRadians) * (stationRadius + 26),
      y: worldLayout.orbitAnchor.y + Math.sin(angleRadians) * (stationRadius + 26),
    };

    graphics.poly([
      point.x,
      point.y - 6,
      point.x + 6,
      point.y,
      point.x,
      point.y + 6,
      point.x - 6,
      point.y,
    ]).fill({ color: 0x9ca3af, alpha: 0.6 });

    const hitArea = new pixi.Graphics()
      .circle(point.x, point.y, 12)
      .fill({ color: 0xffffff, alpha: 0.001 });
    hitArea.eventMode = 'static';
    hitArea.cursor = 'pointer';
    hitArea.on('pointertap', () => clearDebris(debris.id));
    interactionLayer.addChild(hitArea);
  });

  spaceStations.forEach((station, index) => {
    const angle = (index / Math.max(spaceStations.length, 1)) * Math.PI * 2;
    const point = {
      x: worldLayout.orbitAnchor.x + Math.cos(angle) * stationRadius,
      y: worldLayout.orbitAnchor.y + Math.sin(angle) * stationRadius,
    };
    const isSelected = selectedStationId === station.id;
    const color = station.type === 'research' ? 0x60a5fa : 0x4ade80;
    const dockedCount = dockedRockets.filter((rocket) => rocket.stationId === station.id).length;
    const incomingCount = transitRockets.filter((rocket) => rocket.targetStationId === station.id).length;

    if (isSelected) {
      graphics.circle(point.x, point.y, 19).stroke({ width: 3, color: 0xf8fafc, alpha: 0.65 });
    }

    graphics.circle(point.x, point.y, 14).fill({ color, alpha: 0.26 });
    graphics.circle(point.x, point.y, 11).stroke({ width: 2, color, alpha: 0.95 });
    graphics.circle(point.x, point.y, 2.5).fill({ color, alpha: 1 });

    if (dockedCount > 0) {
      graphics.circle(point.x + 12, point.y - 12, 7).fill({ color: 0xfacc15, alpha: 0.95 });
    }
    if (incomingCount > 0) {
      graphics.circle(point.x - 12, point.y - 12, 7).fill({ color: 0xa855f7, alpha: 0.95 });
    }

    const hitArea = new pixi.Graphics()
      .circle(point.x, point.y, 22)
      .fill({ color: 0xffffff, alpha: 0.001 });
    hitArea.eventMode = 'static';
    hitArea.cursor = 'pointer';
    hitArea.on('pointertap', () => onSelectStation(isSelected ? null : station.id));
    interactionLayer.addChild(hitArea);
  });
}

function drawRockets({
  explodedRocketIds,
  labelLayer,
  labelPool,
  launchEchoes,
  layout,
  now,
  pixi,
  rocketGraphics,
  rockets,
  routeSnapshots,
}: {
  explodedRocketIds: number[];
  labelLayer: PixiContainer;
  labelPool: Map<number, PixiText>;
  launchEchoes: Map<number, number>;
  layout: WorldSceneLayout;
  now: number;
  pixi: PixiModule;
  rocketGraphics: PixiGraphics;
  rockets: (Rocket | null)[];
  routeSnapshots: Map<number, RocketSnapshot>;
}) {
  rocketGraphics.clear();

  const activeRocketIds = new Set<number>();
  const activeRockets = rockets.filter((rocket): rocket is Rocket => rocket !== null && !explodedRocketIds.includes(rocket.id));

  activeRockets.forEach((rocket) => {
    activeRocketIds.add(rocket.id);

    const label = syncRocketLabel({
      labelLayer,
      labelPool,
      pixi,
      rocket,
    });

    const surfaceOffset = hashRocketOffset(rocket.id, 120);
    const orbitOffset = hashRocketOffset(rocket.id + 11, 110);
    const moonOffset = hashRocketOffset(rocket.id + 29, 90);
    const pulse = 0.78 + 0.22 * Math.sin(now / 250 + rocket.id);

    const launchEchoStart = launchEchoes.get(rocket.id);
    const launchEchoDuration = TIME.TICK_INTERVAL_MS * 2;
    const launchEchoProgress = launchEchoStart === undefined
      ? null
      : Math.min(1, Math.max(0, (now - launchEchoStart) / launchEchoDuration));

    if (launchEchoProgress !== null && launchEchoProgress >= 1) {
      launchEchoes.delete(rocket.id);
    }

    const locationLayer = rocket.locationLayer ?? 'surface';

    if (launchEchoProgress !== null && launchEchoProgress < 1) {
      const point = getSurfaceEchoPoint(layout, rocket.id, surfaceOffset, launchEchoProgress);
      const isAscent = launchEchoProgress < 0.58;
      const angle = -Math.PI / 2;

      drawRocketTrail(
        rocketGraphics,
        point,
        angle,
        isAscent ? 0x60a5fa : 0xfbbf24,
        isAscent ? 0.52 : 0.56,
        isAscent ? 20 : 16,
        isAscent ? 3 : 2.5,
      );

      if (!isAscent && launchEchoProgress > 0.72) {
        const burnStrength = (launchEchoProgress - 0.72) / 0.28;
        drawRocketTrail(
          rocketGraphics,
          point,
          angle,
          0xfb923c,
          0.45 + burnStrength * 0.45,
          24 + burnStrength * 18,
          4,
        );
      }

      drawRocketGlyph(rocketGraphics, point, angle, 0x60a5fa, 0.86 + 0.1 * pulse);
      updateRocketLabel(label, point);
    }

    if (locationLayer === 'surface') {
      if (launchEchoProgress !== null && launchEchoProgress < 1) {
        return;
      }

      const point = {
        x: layout.surfaceAnchor.x + surfaceOffset,
        y: layout.surfaceAnchor.y + (rocket.id % 3) * 14,
      };
      drawRocketGlyph(rocketGraphics, point, -Math.PI / 2, 0x60a5fa, 0.9, false);
      updateRocketLabel(label, point);
      return;
    }

    if (locationLayer === 'orbit') {
      const ringAngle = (rocket.id % 10) * ((Math.PI * 2) / 10);
      const radius = 110 + (rocket.id % 3) * 12;
      const point = {
        x: layout.orbitAnchor.x + Math.cos(ringAngle) * radius,
        y: layout.orbitAnchor.y + Math.sin(ringAngle) * radius,
      };
      drawRocketGlyph(rocketGraphics, point, ringAngle + Math.PI / 2, 0x22d3ee, 0.75 + 0.2 * pulse);
      updateRocketLabel(label, point);
      return;
    }

    if (locationLayer === 'moon') {
      const point = {
        x: layout.moonAnchor.x + moonOffset,
        y: layout.moonAnchor.y + 38 + (rocket.id % 2) * 12,
      };
      const color = rocket.moonRole === 'colony' ? 0x4ade80 : 0xcbd5e1;
      drawRocketGlyph(rocketGraphics, point, -Math.PI / 8, color, 0.8 + 0.15 * pulse);
      updateRocketLabel(label, point);
      return;
    }

    if (locationLayer === 'transit') {
      const { point, angle } = getTransitPoint({
        layout,
        moonOffset,
        now,
        orbitOffset,
        rocket,
        routeSnapshots,
        surfaceOffset,
      });

      drawRocketTrail(rocketGraphics, point, angle, 0xfacc15, 0.35, 20, 2);
      drawRocketGlyph(rocketGraphics, point, angle, 0xfacc15, 0.82 + 0.12 * pulse);
      updateRocketLabel(label, point);
    }
  });

  for (const [rocketId, label] of Array.from(labelPool.entries())) {
    if (!activeRocketIds.has(rocketId)) {
      labelLayer.removeChild(label);
      label.destroy();
      labelPool.delete(rocketId);
    }
  }
}

function getSurfaceEchoPoint(layout: WorldSceneLayout, rocketId: number, surfaceOffset: number, progress: number) {
  const launchPad = {
    x: layout.surfaceAnchor.x + surfaceOffset * 0.28,
    y: layout.surfaceAnchor.y + (rocketId % 3) * 14,
  };
  const apex = {
    x: launchPad.x + surfaceOffset * 0.38,
    y: layout.surfaceFrame.top + 36 + (rocketId % 2) * 10,
  };
  const touchdown = {
    x: launchPad.x + surfaceOffset * 0.82,
    y: layout.surfaceAnchor.y + (rocketId % 3) * 10,
  };

  const ascentRatio = 0.58;
  const isAscent = progress < ascentRatio;
  const phaseProgress = isAscent
    ? progress / ascentRatio
    : (progress - ascentRatio) / (1 - ascentRatio);

  if (isAscent) {
    const eased = easeInCubic(phaseProgress);
    return {
      x: lerp(launchPad.x, apex.x, eased),
      y: lerp(launchPad.y, apex.y, eased),
    };
  }

  const burnWindow = 0.3;
  const fallingProgress = phaseProgress < (1 - burnWindow)
    ? easeOutQuart(phaseProgress / (1 - burnWindow))
    : 1 - (1 - easeOutCubic((phaseProgress - (1 - burnWindow)) / burnWindow)) * 0.08;

  return {
    x: lerp(apex.x, touchdown.x, fallingProgress),
    y: lerp(apex.y, touchdown.y, fallingProgress),
  };
}

function getSmoothedTransitProgress(
  rocket: Rocket,
  defaultDuration: number,
  now: number,
  routeSnapshots: Map<number, RocketSnapshot>,
) {
  const fallbackTotalTicks = Math.max(1, rocket.totalTicks ?? defaultDuration);
  const snapshot = routeSnapshots.get(rocket.id);
  if (!snapshot) {
    const ticksRemaining = Math.max(0, rocket.ticksRemaining ?? fallbackTotalTicks);
    return Math.max(0, Math.min(1, 1 - ticksRemaining / fallbackTotalTicks));
  }

  const elapsedTicks = Math.max(0, (now - snapshot.observedAt) / TIME.TICK_INTERVAL_MS);
  const smoothedTicksRemaining = Math.max(0, snapshot.ticksRemaining - elapsedTicks);
  return Math.max(0, Math.min(1, 1 - smoothedTicksRemaining / snapshot.totalTicks));
}

function getTransitPoint({
  layout,
  moonOffset,
  now,
  orbitOffset,
  rocket,
  routeSnapshots,
  surfaceOffset,
}: {
  layout: WorldSceneLayout;
  moonOffset: number;
  now: number;
  orbitOffset: number;
  rocket: Rocket;
  routeSnapshots: Map<number, RocketSnapshot>;
  surfaceOffset: number;
}) {
  if (rocket.transitRoute === 'surface_to_orbit') {
    const progress = getSmoothedTransitProgress(rocket, 30, now, routeSnapshots);
    const control = { x: layout.width * 0.7 + orbitOffset * 0.3, y: (layout.surfaceAnchor.y + layout.orbitAnchor.y) / 2 };
    const start = { x: layout.surfaceAnchor.x + surfaceOffset * 0.2, y: layout.surfaceAnchor.y - 16 };
    const end = { x: layout.orbitAnchor.x + orbitOffset * 0.25, y: layout.orbitAnchor.y };
    const point = getQuadraticPoint(start, control, end, progress);
    const lookAhead = getQuadraticPoint(start, control, end, Math.min(1, progress + 0.02));
    return { point, angle: getAngleBetweenPoints(point, lookAhead) };
  }

  if (rocket.transitRoute === 'surface_to_moon') {
    const progress = getSmoothedTransitProgress(rocket, 120, now, routeSnapshots);
    const control = { x: layout.width * 0.83 + moonOffset * 0.25, y: (layout.surfaceAnchor.y + layout.moonAnchor.y) / 2 };
    const start = { x: layout.surfaceAnchor.x + surfaceOffset * 0.15, y: layout.surfaceAnchor.y - 18 };
    const end = { x: layout.moonAnchor.x + moonOffset * 0.25, y: layout.moonAnchor.y + 10 };
    const point = getQuadraticPoint(start, control, end, progress);
    const lookAhead = getQuadraticPoint(start, control, end, Math.min(1, progress + 0.02));
    return { point, angle: getAngleBetweenPoints(point, lookAhead) };
  }

  const progress = getSmoothedTransitProgress(rocket, 45, now, routeSnapshots);
  const control = { x: layout.width * 0.18 + surfaceOffset * 0.25, y: (layout.surfaceAnchor.y + layout.moonAnchor.y) / 2 };
  const start = { x: layout.moonAnchor.x + moonOffset * 0.15, y: layout.moonAnchor.y + 8 };
  const end = { x: layout.surfaceAnchor.x + surfaceOffset * 0.15, y: layout.surfaceAnchor.y - 20 };
  const point = getQuadraticPoint(start, control, end, progress);
  const lookAhead = getQuadraticPoint(start, control, end, Math.min(1, progress + 0.02));
  return { point, angle: getAngleBetweenPoints(point, lookAhead) };
}

function drawRocketGlyph(
  graphics: PixiGraphics,
  point: WorldPoint,
  angle: number,
  color: number,
  alpha: number,
  glow = true,
) {
  const points = [
    { x: 10, y: 0 },
    { x: -8, y: -5 },
    { x: -4, y: 0 },
    { x: -8, y: 5 },
  ].map((vertex) => rotatePoint(vertex, angle, point));

  if (glow) {
    graphics.poly(flattenPoints(points)).fill({ color, alpha: Math.min(0.22, alpha * 0.24) });
  }

  graphics.poly(flattenPoints(points)).fill({ color, alpha });

  const windowOrigin = rotatePoint({ x: -6, y: -1 }, angle, point);
  const windowCorner = rotatePoint({ x: -2, y: 1 }, angle, point);
  const windowWidth = Math.abs(windowCorner.x - windowOrigin.x);
  const windowHeight = Math.abs(windowCorner.y - windowOrigin.y);
  graphics.rect(
    Math.min(windowOrigin.x, windowCorner.x),
    Math.min(windowOrigin.y, windowCorner.y),
    Math.max(1, windowWidth),
    Math.max(1, windowHeight),
  ).fill({ color: 0xffffff, alpha: 0.75 });
}

function drawRocketTrail(
  graphics: PixiGraphics,
  point: WorldPoint,
  angle: number,
  color: number,
  alpha: number,
  length: number,
  width: number,
) {
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  const tailX = point.x - directionX * 8;
  const tailY = point.y - directionY * 8;
  const endX = tailX - directionX * length;
  const endY = tailY - directionY * length;

  graphics
    .moveTo(tailX, tailY)
    .lineTo(endX, endY)
    .stroke({ color, alpha, width, cap: 'round' });
}

function rotatePoint(point: WorldPoint, angle: number, origin: WorldPoint): WorldPoint {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  return {
    x: origin.x + point.x * cosine - point.y * sine,
    y: origin.y + point.x * sine + point.y * cosine,
  };
}

function flattenPoints(points: WorldPoint[]) {
  return points.flatMap((point) => [point.x, point.y]);
}

function syncRocketLabel({
  labelLayer,
  labelPool,
  pixi,
  rocket,
}: {
  labelLayer: PixiContainer;
  labelPool: Map<number, PixiText>;
  pixi: PixiModule;
  rocket: Rocket;
}) {
  const existing = labelPool.get(rocket.id);
  if (existing) {
    existing.text = `#${rocket.id}`;
    return existing;
  }

  const label = new pixi.Text({
    text: `#${rocket.id}`,
    style: {
      fill: 0xe2e8f0,
      fontFamily: 'monospace',
      fontSize: 11,
    },
  });
  label.alpha = 0.72;
  labelPool.set(rocket.id, label);
  labelLayer.addChild(label);
  return label;
}

function updateRocketLabel(label: PixiText, point: WorldPoint) {
  label.x = point.x + 12;
  label.y = point.y - 14;
}
