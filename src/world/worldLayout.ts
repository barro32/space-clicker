import type { RefObject } from 'react';

export interface WorldPoint {
  x: number;
  y: number;
}

export interface WorldFrame {
  top: number;
  height: number;
  width: number;
}

export interface WorldSectionRefs {
  moonRef: RefObject<HTMLElement | null>;
  orbitRef: RefObject<HTMLElement | null>;
  surfaceRef: RefObject<HTMLElement | null>;
}

export interface WorldSceneLayout {
  width: number;
  height: number;
  moonFrame: WorldFrame;
  orbitFrame: WorldFrame;
  surfaceFrame: WorldFrame;
  moonAnchor: WorldPoint;
  orbitAnchor: WorldPoint;
  surfaceAnchor: WorldPoint;
}

const FALLBACK_LAYER_INDEX = {
  moon: 0,
  orbit: 1,
  surface: 3,
} as const;

function getFallbackFrame(worldWidth: number, worldHeight: number, layer: keyof typeof FALLBACK_LAYER_INDEX): WorldFrame {
  const viewportHeight = worldHeight / 5;
  return {
    top: viewportHeight * FALLBACK_LAYER_INDEX[layer],
    height: viewportHeight,
    width: worldWidth,
  };
}

function getFrameFromSection(
  worldElement: HTMLDivElement,
  sectionElement: HTMLElement | null,
  fallbackLayer: keyof typeof FALLBACK_LAYER_INDEX,
): WorldFrame {
  if (!sectionElement) {
    return getFallbackFrame(worldElement.clientWidth, worldElement.scrollHeight, fallbackLayer);
  }

  return {
    top: sectionElement.offsetTop,
    height: sectionElement.offsetHeight,
    width: sectionElement.clientWidth || worldElement.clientWidth,
  };
}

export function getWorldSceneLayout(
  worldElement: HTMLDivElement,
  sectionRefs: WorldSectionRefs,
): WorldSceneLayout {
  const width = worldElement.clientWidth;
  const height = worldElement.scrollHeight;

  const moonFrame = getFrameFromSection(worldElement, sectionRefs.moonRef.current, 'moon');
  const orbitFrame = getFrameFromSection(worldElement, sectionRefs.orbitRef.current, 'orbit');
  const surfaceFrame = getFrameFromSection(worldElement, sectionRefs.surfaceRef.current, 'surface');

  return {
    width,
    height,
    moonFrame,
    orbitFrame,
    surfaceFrame,
    moonAnchor: {
      x: width * 0.5,
      y: moonFrame.top + moonFrame.height * 0.48,
    },
    orbitAnchor: {
      x: width * 0.5,
      y: orbitFrame.top + orbitFrame.height * 0.52,
    },
    surfaceAnchor: {
      x: width * 0.5,
      y: surfaceFrame.top + surfaceFrame.height * 0.68,
    },
  };
}
