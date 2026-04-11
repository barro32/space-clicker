import { ORBITAL } from './gameConstants.js'

interface OrbitPressureStation {
  type: 'research' | 'logistics' | 'refueling'
  level: number
  maxDocks: number
}

interface OrbitPressureDock {
  stationId: string
}

interface OrbitPressureTransit {
  targetStationId: string
}

interface OrbitPressureDebris {
  id: string
}

interface OrbitPressureInput {
  spaceStations: OrbitPressureStation[]
  dockedRockets: OrbitPressureDock[]
  transitRockets: OrbitPressureTransit[]
  satellites: number
  spaceDebris: OrbitPressureDebris[]
}

export interface OrbitPressureSummary {
  congestion: number
  dockUtilization: number
  logisticsMitigation: number
  satelliteMitigation: number
  totalDockCapacity: number
  occupiedDocks: number
}

export function calculateOrbitPressure({
  spaceStations,
  dockedRockets,
  transitRockets,
  satellites,
  spaceDebris,
}: OrbitPressureInput): OrbitPressureSummary {
  const totalDockCapacity = spaceStations.reduce((total, station) => total + station.maxDocks, 0)
  const occupiedDocks = dockedRockets.length + transitRockets.length
  const dockUtilization = totalDockCapacity > 0 ? occupiedDocks / totalDockCapacity : 0
  const logisticsLevels = spaceStations
    .filter((station) => station.type === 'logistics')
    .reduce((total, station) => total + station.level, 0)

  const logisticsMitigation = logisticsLevels * ORBITAL.LOGISTICS_CONGESTION_REDUCTION_PER_LEVEL
  const satelliteMitigation = satellites * ORBITAL.SATELLITE_TRAFFIC_CONTROL

  const rawCongestion =
    transitRockets.length * ORBITAL.CONGESTION_PER_TRANSIT_ROCKET +
    Math.max(0, dockUtilization - ORBITAL.CONGESTION_SAFE_DOCK_UTILIZATION) * ORBITAL.CONGESTION_PER_DOCK_OVERLOAD +
    spaceDebris.length * ORBITAL.CONGESTION_PER_DEBRIS -
    logisticsMitigation -
    satelliteMitigation

  return {
    congestion: Math.min(ORBITAL.MAX_CONGESTION_PENALTY, Math.max(0, rawCongestion)),
    dockUtilization,
    logisticsMitigation,
    satelliteMitigation,
    totalDockCapacity,
    occupiedDocks,
  }
}
