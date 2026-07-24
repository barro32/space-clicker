import { useMemo } from "react";

import { useShallow } from 'zustand/react/shallow';
import { FaBomb, FaGasPump, FaRegBuilding, FaRocket } from "react-icons/fa";

import { useGameStore } from "./useGameStore.js";
import type { Rocket } from "./useGameStore.js";
import { AUTOMATION, COST_SCALING } from "./gameConstants.js";

interface SpaceportViewProps {
  onSelectSpaceport?: (spaceportId: number | null) => void;
  selectedSpaceportId?: number | null;
}

export function SpaceportView({ onSelectSpaceport, selectedSpaceportId: controlledSelectedSpaceportId }: SpaceportViewProps) {
  const [
    rockets,
    recentlyLaunchedRocketIds,
    spaceports,
    buildSpaceport,
    buildRocket,
    explodedRocketIds,
    clearExplosion,
    autoBuildActive,
    autoSalvageActive,
    toggleAutoBuild,
    toggleAutoSalvage,
    fuel,
    tickCount,
    buildFuelRefinery,
    fuelRefineries,
    effectiveCapacity,
    currentRocketCost,
    currentSpaceportCost,
    fuelCostPerRocket,
    spaceportsUnlocked,
    fuelRefineriesUnlocked,
    explosionClearingUnlocked,
    currentFuelRefineryCost,
    autoBuildEnabled,
    buildMultiplier,
    autoSalvageEnabled,
    clearMultiplier,
  ] = useGameStore(useShallow((state) => [
    state.rockets,
    state.recentlyLaunchedRocketIds,
    state.spaceports,
    state.buildSpaceport,
    state.buildRocket,
    state.explodedRocketIds,
    state.clearExplosion,
    state.autoBuildActive,
    state.autoSalvageActive,
    state.toggleAutoBuild,
    state.toggleAutoSalvage,
    state.fuel,
    state.tickCount,
    state.buildFuelRefinery,
    state.fuelRefineries,
    Math.max(1, state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus')),
    state.getCurrentRocketCost(),
    state.getCurrentSpaceportCost(),
    state.fuelCostPerRocket * state.getEffectMultiplier('fuelCostMultiplier'),
    state.getEffectMultiplier('unlockSpaceports') > 0,
    state.getEffectMultiplier('unlockRefineries') > 0,
    state.getEffectMultiplier('unlockExplosionClearing') > 0,
    Math.round(COST_SCALING.FUEL_REFINERY_COST_BASE * Math.pow(COST_SCALING.FUEL_REFINERY_COST_EXPONENT, state.fuelRefineries)),
    state.getEffectMultiplier('autoBuildEnabled') > 0,
    state.getEffectMultiplier('buildRocketMultiplier') || 1,
    state.getEffectMultiplier('autoSalvageEnabled') > 0,
    state.getEffectMultiplier('clearExplosionMultiplier') || 1,
  ]));

  const selectedSpaceportId = controlledSelectedSpaceportId ?? null;
  const setSelectedSpaceportId = onSelectSpaceport ?? (() => {});

  const rocketsWithFuel = Math.floor(fuel / fuelCostPerRocket);

  const activeRockets = useMemo(
    () => rockets.filter((rocket): rocket is Rocket => rocket !== null && !explodedRocketIds.includes(rocket.id)),
    [explodedRocketIds, rockets],
  );

  const surfaceReadyRocketIds = useMemo(
    () => activeRockets
      .filter((rocket) => (rocket.locationLayer ?? 'surface') === 'surface')
      .slice(0, rocketsWithFuel)
      .map((rocket) => rocket.id),
    [activeRockets, rocketsWithFuel],
  );

  const registry = useMemo(() => {
    return spaceports.map((spaceport, index) => {
      const slotStart = index * effectiveCapacity;
      const assigned = rockets.slice(slotStart, slotStart + effectiveCapacity);
      const activeAssigned = assigned.filter((rocket): rocket is Rocket => rocket !== null);
      const explodedAssigned = activeAssigned.filter((rocket) => explodedRocketIds.includes(rocket.id));
      const surfaceAssigned = activeAssigned.filter((rocket) => (rocket.locationLayer ?? 'surface') === 'surface' && !explodedRocketIds.includes(rocket.id));
      const transitAssigned = activeAssigned.filter((rocket) => rocket.locationLayer === 'transit' && !explodedRocketIds.includes(rocket.id));
      const orbitAssigned = activeAssigned.filter((rocket) => rocket.locationLayer === 'orbit' && !explodedRocketIds.includes(rocket.id));
      const moonAssigned = activeAssigned.filter((rocket) => rocket.locationLayer === 'moon' && !explodedRocketIds.includes(rocket.id));
      const readyCount = surfaceAssigned.filter((rocket) => surfaceReadyRocketIds.includes(rocket.id)).length;

      return {
        activeCount: activeAssigned.length,
        assigned,
        explodedCount: explodedAssigned.length,
        moonCount: moonAssigned.length,
        orbitCount: orbitAssigned.length,
        readyCount,
        spaceport,
        surfaceCount: surfaceAssigned.length,
        transitCount: transitAssigned.length,
      };
    });
  }, [effectiveCapacity, explodedRocketIds, rockets, spaceports, surfaceReadyRocketIds]);

  const selectedEntry = selectedSpaceportId === null
    ? null
    : registry.find((entry) => entry.spaceport.id === selectedSpaceportId) ?? null;

  const launchQueueCount = recentlyLaunchedRocketIds.length;
  const orbitalCount = activeRockets.filter((rocket) => rocket.locationLayer === 'orbit').length;
  const lunarCount = activeRockets.filter((rocket) => rocket.locationLayer === 'moon').length;
  const transitCount = activeRockets.filter((rocket) => rocket.locationLayer === 'transit').length;

  const autoBuildInterval = Math.max(1, Math.floor(AUTOMATION.BASE_INTERVAL / buildMultiplier));
  const autoBuildProgress = autoBuildEnabled && autoBuildActive
    ? ((tickCount % autoBuildInterval) / autoBuildInterval) * 100
    : 0;

  const autoSalvageInterval = Math.max(1, Math.floor(AUTOMATION.BASE_INTERVAL / clearMultiplier));
  const autoSalvageProgress = autoSalvageEnabled && autoSalvageActive && explodedRocketIds.length > 0
    ? (((tickCount + 10) % autoSalvageInterval) / autoSalvageInterval) * 100
    : 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-end gap-4 px-8 pb-8 pt-24 overflow-auto">
      <div className="grid w-full max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
          <div className="text-xs uppercase tracking-wide text-cyan-300/70">Spaceports</div>
          <div className="mt-1 text-2xl font-bold text-cyan-300">{spaceports.length}</div>
          <div className="text-xs text-cyan-200/70">{effectiveCapacity} slots each</div>
        </div>
        <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
          <div className="text-xs uppercase tracking-wide text-blue-300/70">Launch Queue</div>
          <div className="mt-1 text-2xl font-bold text-blue-300">{launchQueueCount}</div>
          <div className="text-xs text-blue-200/70">{surfaceReadyRocketIds.length} surface ready</div>
        </div>
        <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
          <div className="text-xs uppercase tracking-wide text-purple-300/70">Transit</div>
          <div className="mt-1 text-2xl font-bold text-purple-300">{transitCount}</div>
          <div className="text-xs text-purple-200/70">{orbitalCount} orbit · {lunarCount} Moon</div>
        </div>
        <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
          <div className="text-xs uppercase tracking-wide text-orange-300/70">Fuel</div>
          <div className="mt-1 text-2xl font-bold text-orange-300">{Math.floor(fuel).toLocaleString()}</div>
          <div className="text-xs text-orange-200/70">{fuelRefineries} refineries online</div>
        </div>
      </div>

      <div className="w-full max-w-5xl rounded-lg border border-slate-700/70 bg-slate-950/55 backdrop-blur-sm p-4">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Spaceport Registry</div>
        <div className="grid max-h-[24vh] gap-3 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
          {registry.map((entry) => {
            const isSelected = entry.spaceport.id === selectedSpaceportId;
            return (
              <button
                key={entry.spaceport.id}
                type="button"
                onClick={() => setSelectedSpaceportId(isSelected ? null : entry.spaceport.id)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-slate-400/70 bg-slate-900/90'
                    : 'border-slate-700/60 bg-slate-950/65 hover:border-slate-500/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-cyan-300">
                      <FaRegBuilding />
                      SPACEPORT {entry.spaceport.id}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{entry.activeCount}/{effectiveCapacity} assigned</div>
                  </div>
                  {entry.explodedCount > 0 && (
                    <div className="rounded bg-red-500/20 px-2 py-1 text-[10px] font-bold uppercase text-red-300">
                      {entry.explodedCount} exploded
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded bg-black/25 p-2">
                    <div className="text-[11px] text-slate-500">Ready</div>
                    <div className="text-blue-300">{entry.readyCount}</div>
                  </div>
                  <div className="rounded bg-black/25 p-2">
                    <div className="text-[11px] text-slate-500">Transit</div>
                    <div className="text-purple-300">{entry.transitCount}</div>
                  </div>
                  <div className="rounded bg-black/25 p-2">
                    <div className="text-[11px] text-slate-500">Orbit</div>
                    <div className="text-cyan-300">{entry.orbitCount}</div>
                  </div>
                  <div className="rounded bg-black/25 p-2">
                    <div className="text-[11px] text-slate-500">Moon</div>
                    <div className="text-green-300">{entry.moonCount}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedEntry && (
        <div className="w-full max-w-4xl rounded-lg border border-slate-700/70 bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <FaRegBuilding />
                SPACEPORT {selectedEntry.spaceport.id}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {selectedEntry.surfaceCount} on surface · {selectedEntry.transitCount} in transit · {selectedEntry.orbitCount} in orbit · {selectedEntry.moonCount} on Moon
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSpaceportId(null)}
              className="text-xs uppercase tracking-wide text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="grid max-h-[24vh] gap-2 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
            {selectedEntry.assigned.map((rocket, index) => {
              if (!rocket) {
                return (
                  <div key={`empty-${index}`} className="rounded border border-dashed border-slate-700/60 bg-black/20 p-3 text-sm text-slate-500">
                    Empty slot
                  </div>
                );
              }

              const isExploded = explodedRocketIds.includes(rocket.id);
              const locationLayer = rocket.locationLayer ?? 'surface';
              const isReady = !isExploded && locationLayer === 'surface' && surfaceReadyRocketIds.includes(rocket.id);
              const status = isExploded
                ? 'Exploded'
                : locationLayer === 'surface'
                  ? isReady ? 'Ready' : 'Waiting'
                  : locationLayer === 'transit'
                    ? rocket.transitRoute === 'surface_to_moon'
                      ? 'Moon transfer'
                      : rocket.transitRoute === 'moon_to_surface'
                        ? 'Moon return'
                        : 'Orbit transfer'
                    : locationLayer === 'orbit'
                      ? 'Docked in orbit'
                      : rocket.moonRole === 'colony'
                        ? 'Moon colony ship'
                        : 'On Moon';

              const badgeClass = isExploded
                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                : locationLayer === 'transit'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : locationLayer === 'orbit'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    : locationLayer === 'moon'
                      ? 'bg-green-500/15 text-green-300 border-green-500/30'
                      : isReady
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-slate-500/15 text-slate-300 border-slate-500/30';

              return (
                <div key={rocket.id} className="rounded border border-slate-700/60 bg-black/25 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-slate-100">
                        <FaRocket className="text-blue-300" />
                        Rocket #{rocket.id}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{rocket.type} vehicle</div>
                    </div>
                    <div className={`rounded border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                      {status}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-400">
                    {rocket.ticksRemaining !== undefined && rocket.ticksRemaining > 0 && (
                      <div>ETA / dwell: {rocket.ticksRemaining}s</div>
                    )}
                    {rocket.stationId && <div>Station: {rocket.stationId.slice(-6)}</div>}
                    {rocket.targetStationId && <div>Target: {rocket.targetStationId.slice(-6)}</div>}
                  </div>
                  {isExploded && explosionClearingUnlocked && (
                    <button
                      type="button"
                      onClick={() => clearExplosion(rocket.id)}
                      className="mt-3 flex items-center gap-2 rounded border border-red-500/40 bg-red-950/30 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/30"
                    >
                      <FaBomb />
                      Clear wreckage
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-cyan-500/50 rounded-lg p-6 shadow-lg shadow-cyan-500/20 w-full max-w-2xl backdrop-blur-sm">
        <div className="text-cyan-400 font-mono text-sm font-bold mb-4 pb-3 border-b border-cyan-500/30">
          ⚙ BUILD & CONTROL
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/30 border-2 border-blue-500/50 rounded p-4 hover:border-blue-500/80 hover:bg-blue-900/20 transition-all cursor-pointer" onClick={buildRocket} title="Build a cargo rocket">
            <div className="flex items-center justify-center mb-2">
              <FaRocket className="text-2xl text-blue-400" style={{ transform: 'rotate(-45deg)' }} />
            </div>
            <div className="text-xs text-gray-400 font-mono text-center mb-1">CARGO ROCKET</div>
            <div className="text-lg font-bold text-green-400 font-mono text-center">${currentRocketCost.toLocaleString()}</div>
            <div className="text-xs text-orange-400 font-mono text-center">Fuel: {Math.floor(fuelCostPerRocket).toLocaleString()}</div>
            {autoBuildEnabled && (
              <div className="mt-2 pt-2 border-t border-blue-500/30">
                <label className="flex items-center justify-center gap-2 cursor-pointer" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={autoBuildActive}
                    onChange={() => toggleAutoBuild()}
                    className="w-4 h-4 cursor-pointer accent-cyan-500"
                    aria-label="auto-build-toggle"
                  />
                  <span className={`text-xs font-mono ${autoBuildActive ? 'text-cyan-400' : 'text-gray-500'}`}>AUTO</span>
                </label>
                {autoBuildActive && (
                  <div className="w-full mt-1">
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 transition-all duration-200 rounded-full"
                        style={{ width: `${autoBuildProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {explosionClearingUnlocked && (
            <div className="bg-black/30 border-2 border-red-500/50 rounded p-4 hover:border-red-500/80 hover:bg-red-900/20 transition-all cursor-pointer" onClick={() => {
              if (explodedRocketIds.length > 0) {
                clearExplosion(explodedRocketIds[0]);
              }
            }} title="Clear first explosion">
              <div className="flex items-center justify-center mb-2">
                <FaBomb className="text-2xl text-red-400" />
              </div>
              <div className="text-xs text-gray-400 font-mono text-center mb-1">CLEAR EXPLOSION</div>
              <div className="text-lg font-bold text-blue-400 font-mono text-center">+1 SCI</div>
              <div className="text-xs text-gray-500 font-mono text-center">Queue: {explodedRocketIds.length}</div>
              {autoSalvageEnabled && (
                <div className="mt-2 pt-2 border-t border-red-500/30">
                  <label className="flex items-center justify-center gap-2 cursor-pointer" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={autoSalvageActive}
                      onChange={() => toggleAutoSalvage()}
                      className="w-4 h-4 cursor-pointer accent-orange-500"
                      aria-label="auto-salvage-toggle"
                    />
                    <span className={`text-xs font-mono ${autoSalvageActive ? 'text-orange-400' : 'text-gray-500'}`}>AUTO</span>
                  </label>
                  {autoSalvageActive && explodedRocketIds.length > 0 && (
                    <div className="w-full mt-1">
                      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 transition-all duration-200 rounded-full"
                          style={{ width: `${autoSalvageProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {spaceportsUnlocked && (
            <div className="bg-black/30 border-2 border-green-500/50 rounded p-4 hover:border-green-500/80 hover:bg-green-900/20 transition-all cursor-pointer" onClick={buildSpaceport} title="Build new spaceport">
              <div className="flex items-center justify-center mb-2">
                <FaRegBuilding className="text-2xl text-green-400" />
              </div>
              <div className="text-xs text-gray-400 font-mono text-center mb-1">NEW SPACEPORT</div>
              <div className="text-lg font-bold text-green-400 font-mono text-center">${currentSpaceportCost.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-mono text-center">Capacity +{effectiveCapacity}</div>
            </div>
          )}

          {fuelRefineriesUnlocked && (
            <div className="bg-black/30 border-2 border-orange-500/50 rounded p-4 hover:border-orange-500/80 hover:bg-orange-900/20 transition-all cursor-pointer" onClick={buildFuelRefinery} title="Build fuel refinery">
              <div className="flex items-center justify-center mb-2">
                <FaGasPump className="text-2xl text-orange-400" />
              </div>
              <div className="text-xs text-gray-400 font-mono text-center mb-1">FUEL REFINERY</div>
              <div className="text-lg font-bold text-orange-400 font-mono text-center">${currentFuelRefineryCost.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-mono text-center">{fuelRefineries} built · +5/tick · +500 cap</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
