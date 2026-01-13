# Changelog

All notable changes to Space Evolution will be documented in this file.

## [Unreleased]

### Added
- **Afterburner System**: Toggle to boost rocket output at the cost of increased fuel consumption and explosion risk
  - 3x fuel cost (reducible via Galactic Energy perks)
  - 2x resource output (increasable via perks)
  - +5% explosion risk (negatable via Aegis Security perk)
- **New Company Perks** (9 total):
  - Titan L5 "Liquid Assets": Money scales with fuel percentage
  - Titan L6 "Monopoly": +25% global money production
  - Nova L5 "Telemetry Link": Satellites generate passive science
  - Nova L6 "Orbital Labs": Science scales with station levels
  - Zenith L6 "Express Transit": -50% Earth-to-Orbit transit time
  - Galactic L9 "Flow Control": Reduced afterburner fuel cost
  - Galactic L10 "Plasma Injectors": Increased afterburner output
  - Aegis L5 "Thermal Shields": Negates afterburner explosion risk
  - Aegis L6 "Black Box": Explosions grant science based on rocket cost
- **Fuel Capacity System**: Research nodes (f1-1 to f1-5) and display showing current/max fuel
- **Effective Output Display**: Station panel now shows actual output with all multipliers broken down
- **Dev Console**: Added "+1000 Fuel & Capacity" button for testing

### Changed
- Research tree expanded to 190 nodes (was 172)
- Efficient Engines now has 5 levels (p1-1 to p1-5)
- Market Analysis now has 5 levels (c1-1 to c1-5)  
- Advanced Refineries now has 5 levels (i2-1 to i2-5)
- Contract acceptance no longer removes other available contracts
- Rocket cost display now correctly includes all perk multipliers
- Research descriptions clarified for contract-related nodes

### Fixed
- Titan Mining "Bulk Discount" perks now properly reflected in displayed rocket cost
- Station output now correctly shows all applicable multipliers

### Removed
- Deprecated `toggleSpaceport` function (was no-op)

## [1.0.0] - Initial Release

### Features
- **Surface Layer**: Rockets, spaceports, fuel refineries, explosions, salvage
- **Orbital Layer**: Space stations (research/logistics), satellites, debris, docking mechanics
- **Contracts Layer**: Company contracts with time limits, fragility, and rewards
- **Moon Layer**: Lunar missions, extractors, refineries, mass drivers, hazards
- **Research Tree**: 170+ research nodes across 6 branches
- **Company System**: 6 companies with 10 perks each (60 total perks)
- **Persistence**: Auto-save to localStorage with state migrations
