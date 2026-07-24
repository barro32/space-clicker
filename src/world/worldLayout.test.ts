import { getWorldSceneLayout } from './worldLayout.js';

describe('getWorldSceneLayout', () => {
  it('uses measured section frames when refs are available', () => {
    const worldElement = document.createElement('div') as HTMLDivElement;
    Object.defineProperty(worldElement, 'clientWidth', { value: 1200, configurable: true });
    Object.defineProperty(worldElement, 'scrollHeight', { value: 5000, configurable: true });

    const moonSection = document.createElement('section');
    Object.defineProperty(moonSection, 'offsetTop', { value: 0, configurable: true });
    Object.defineProperty(moonSection, 'offsetHeight', { value: 1100, configurable: true });
    Object.defineProperty(moonSection, 'clientWidth', { value: 1200, configurable: true });

    const orbitSection = document.createElement('section');
    Object.defineProperty(orbitSection, 'offsetTop', { value: 1100, configurable: true });
    Object.defineProperty(orbitSection, 'offsetHeight', { value: 1000, configurable: true });
    Object.defineProperty(orbitSection, 'clientWidth', { value: 1200, configurable: true });

    const surfaceSection = document.createElement('section');
    Object.defineProperty(surfaceSection, 'offsetTop', { value: 3100, configurable: true });
    Object.defineProperty(surfaceSection, 'offsetHeight', { value: 1000, configurable: true });
    Object.defineProperty(surfaceSection, 'clientWidth', { value: 1200, configurable: true });

    const layout = getWorldSceneLayout(worldElement, {
      moonRef: { current: moonSection },
      orbitRef: { current: orbitSection },
      surfaceRef: { current: surfaceSection },
    });

    expect(layout.width).toBe(1200);
    expect(layout.height).toBe(5000);
    expect(layout.moonFrame.top).toBe(0);
    expect(layout.orbitFrame.top).toBe(1100);
    expect(layout.surfaceFrame.top).toBe(3100);
    expect(layout.moonAnchor.y).toBeCloseTo(528);
    expect(layout.orbitAnchor.y).toBeCloseTo(1620);
    expect(layout.surfaceAnchor.y).toBeCloseTo(3780);
  });

  it('falls back to evenly spaced layer frames when section refs are missing', () => {
    const worldElement = document.createElement('div') as HTMLDivElement;
    Object.defineProperty(worldElement, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(worldElement, 'scrollHeight', { value: 5000, configurable: true });

    const layout = getWorldSceneLayout(worldElement, {
      moonRef: { current: null },
      orbitRef: { current: null },
      surfaceRef: { current: null },
    });

    expect(layout.moonFrame.top).toBe(0);
    expect(layout.orbitFrame.top).toBe(1000);
    expect(layout.surfaceFrame.top).toBe(3000);
    expect(layout.surfaceAnchor.y).toBeCloseTo(3680);
  });
});
