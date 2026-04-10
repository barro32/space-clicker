import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('App integration', () => {
  const applyBaselineState = (useGameStore: any) => {
    useGameStore.setState({
      money: 100,
      science: 0,
      fuel: 100,
      cargo: 0,
      notifications: [],
      researchedNodes: [],
      rockets: [],
      explodedRocketIds: [],
      spaceports: [{ id: 1 }],
      spaceStations: [],
      activeContracts: [],
      availableContracts: [],
      satellites: 0,
      spaceDebris: [],
      totalSuccessfulLaunches: 0,
      orbitLayerUnlocked: false,
      contractsLayerUnlocked: false,
      moonStatus: 'locked',
      moonBounties: [],
      moonBountyRefreshTimer: 120,
    } as any);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();

    Object.defineProperty(window, 'localStorage', {
      value: {
        _store: {} as Record<string, string>,
        getItem(key: string) {
          return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null;
        },
        setItem(key: string, value: string) {
          this._store[key] = String(value);
        },
        removeItem(key: string) {
          delete this._store[key];
        },
      },
      configurable: true,
    });

    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('mounts and runs several ticks without triggering a maximum update depth error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const [{ App }, { useGameStore }] = await Promise.all([
      import('./App.js'),
      import('./useGameStore.js'),
    ]);

    applyBaselineState(useGameStore);

    const result = render(<App />);

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    const maxDepthLogged = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('Maximum update depth exceeded'))
    );

    result.unmount();

    expect(maxDepthLogged).toBe(false);
  });

  it('mounts ContractsView with the real store without triggering a render loop', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const [{ ContractsView }, { useGameStore }] = await Promise.all([
      import('./ContractsView.js'),
      import('./useGameStore.js'),
    ]);

    applyBaselineState(useGameStore);

    const result = render(<ContractsView />);

    await act(async () => {
      await Promise.resolve();
    });

    const maxDepthLogged = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('Maximum update depth exceeded'))
    );

    result.unmount();

    expect(maxDepthLogged).toBe(false);
  });

  it('mounts OrbitView with the real store without triggering a render loop', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const [{ OrbitView }, { useGameStore }] = await Promise.all([
      import('./OrbitView.js'),
      import('./useGameStore.js'),
    ]);

    applyBaselineState(useGameStore);

    const result = render(<OrbitView />);

    await act(async () => {
      await Promise.resolve();
    });

    const maxDepthLogged = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('Maximum update depth exceeded'))
    );

    result.unmount();

    expect(maxDepthLogged).toBe(false);
  });

  it('mounts SpaceportView with the real store without triggering a render loop', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const [{ SpaceportView }, { useGameStore }] = await Promise.all([
      import('./SpaceportView.js'),
      import('./useGameStore.js'),
    ]);

    applyBaselineState(useGameStore);

    const result = render(<SpaceportView />);

    await act(async () => {
      await Promise.resolve();
    });

    const maxDepthLogged = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('Maximum update depth exceeded'))
    );

    result.unmount();

    expect(maxDepthLogged).toBe(false);
  });

  it('mounts ResearchTreeView with the real store without triggering a render loop', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const [{ ResearchTreeView }, { useGameStore }] = await Promise.all([
      import('./ResearchTreeView.js'),
      import('./useGameStore.js'),
    ]);

    applyBaselineState(useGameStore);

    const result = render(<ResearchTreeView />);

    await act(async () => {
      await Promise.resolve();
    });

    const maxDepthLogged = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('Maximum update depth exceeded'))
    );

    result.unmount();

    expect(maxDepthLogged).toBe(false);
  });

  it('mounts ResearchSidebar with the real store without triggering a render loop', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const [{ ResearchSidebar }, { useGameStore }] = await Promise.all([
      import('./components/ResearchSidebar.js'),
      import('./useGameStore.js'),
    ]);

    applyBaselineState(useGameStore);

    const result = render(<ResearchSidebar layer="contracts" />);

    await act(async () => {
      await Promise.resolve();
    });

    const maxDepthLogged = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('Maximum update depth exceeded'))
    );

    result.unmount();

    expect(maxDepthLogged).toBe(false);
  });

  it('mounts MoonView with the real store without triggering a render loop', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const [{ MoonView }, { useGameStore }] = await Promise.all([
      import('./MoonView.js'),
      import('./useGameStore.js'),
    ]);

    applyBaselineState(useGameStore);

    const result = render(<MoonView />);

    await act(async () => {
      await Promise.resolve();
    });

    const maxDepthLogged = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('Maximum update depth exceeded'))
    );

    result.unmount();

    expect(maxDepthLogged).toBe(false);
  });

  it('mounts App shell without child views without triggering a render loop', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.doMock('./SpaceportView.js', () => ({ SpaceportView: () => null }));
    vi.doMock('./OrbitView.js', () => ({ OrbitView: () => null }));
    vi.doMock('./ContractsView.js', () => ({ ContractsView: () => null }));
    vi.doMock('./ResearchTreeView.js', () => ({ ResearchTreeView: () => null }));
    vi.doMock('./MoonView.js', () => ({ MoonView: () => null }));
    vi.doMock('./components/ResearchSidebar.js', () => ({ ResearchSidebar: () => null }));
    vi.doMock('./components/SettingsPanel.js', () => ({ SettingsPanel: () => null }));

    const [{ App }, { useGameStore }] = await Promise.all([
      import('./App.js'),
      import('./useGameStore.js'),
    ]);

    applyBaselineState(useGameStore);

    const result = render(<App />);

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    const maxDepthLogged = errorSpy.mock.calls.some((call) =>
      call.some((arg) => String(arg).includes('Maximum update depth exceeded'))
    );

    result.unmount();

    expect(maxDepthLogged).toBe(false);
  });
});
