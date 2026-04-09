# Code Review: Company Perks and Research System

**Date**: 2026-01-28  
**Reviewer**: AI Code Agent  
**Files Reviewed**:
- `src/gameConstants.ts` (lines 1-394)
- `src/researchTree.ts` (full file, 400+ nodes)
- `src/useGameStore.ts` (effect calculation & application, ~1500+ lines)

---

## Executive Summary

The company perk and research system is **well-architected but has several balance concerns and type system inconsistencies**. The core systems are sound, but some late-game scaling could become problematic.

### Key Findings

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 Critical Issues | 2 | Lunar cost multiplier not applied; Thermal shielding is binary |
| 🟠 Balance Issues | 4 | Station science scale exponential growth; Global money multiplier dominance |
| 🟡 Code Quality | 2 | Confusing variable naming; Inconsistent value semantics |

---

## Detailed Findings

### 1. 🔴 CRITICAL: Lunar Resource Costs Don't Apply Multipliers

**Location**: `useGameStore.ts:1779-1782`

**Problem**:
```typescript
const effectiveScienceCost = Math.round(node.scienceCost * researchCostMultiplier);
const effectiveCargoCost = node.cargoCost ? Math.round(node.cargoCost * researchCostMultiplier) : 0;
const lunarCost = node.lunarComponentCost || 0;  // ← NOT multiplied!
const helium3Cost = node.helium3Cost || 0;        // ← NOT multiplied!
```

**Impact**:
- Late-game moon research (m7 Planetary Expansion: 500 He-3) ignores all research cost reductions
- Nova company perks (-15% science cost) don't reduce helium-3 requirements
- Creates unfair cost scaling: Science-based nodes get discounts, but resource-based nodes don't

**Fix**:
```typescript
const effectiveScienceCost = Math.round(node.scienceCost * researchCostMultiplier);
const effectiveCargoCost = node.cargoCost ? Math.round(node.cargoCost * researchCostMultiplier) : 0;
const lunarCost = node.lunarComponentCost ? Math.round(node.lunarComponentCost * researchCostMultiplier) : 0;
const helium3Cost = node.helium3Cost ? Math.round(node.helium3Cost * researchCostMultiplier) : 0;
```

**Severity**: 🔴 **Critical** - Asymmetric progression path

---

### 2. 🔴 CRITICAL: Thermal Shielding Binary Logic (Should Be Gradient)

**Location**: `gameConstants.ts:154`, `useGameStore.ts:358-361`

**Current Implementation**:
```typescript
// Perk Definition (gameConstants.ts)
{ level: 5, name: 'Thermal Shields', description: 'Negates Afterburner explosion risk', 
  effect: 'thermalShielding', value: 1 }

// Application Logic (useGameStore.ts)
const hasThermalShielding = state.getCompanyPerkValue('thermalShielding') > 0;
if (!hasThermalShielding) {
  baseExplosionChance += AFTERBURNER.EXPLOSION_RISK_BONUS;  // +5% flat
}
```

**Problem**:
- Binary all-or-nothing protection (0% or 100% reduction)
- No middle ground (50% mitigation doesn't exist)
- Value field (`1`) is meaningless - only used as boolean
- Inconsistent with other Aegis perks (level 1-4 provide gradual -5% to -10%)

**Impact**:
- Aegis level 5 jump is disproportionate compared to level 4 (-10% explosion)
- Late-game players with Aegis 5+ always safely use afterburner; those with level 4 cannot
- Creates hard progression cliff instead of smooth gradient

**Recommended Fix**:
```typescript
// Change Aegis Thermal Shields to gradient reduction
{ level: 5, name: 'Thermal Shields', description: 'Reduce afterburner explosion risk by 50%', 
  effect: 'thermalShieldingReduction', value: 0.5 }  // 50% of bonus is mitigated

// In tick logic:
const thermalReduction = state.getCompanyPerkValue('thermalShieldingReduction');  // Returns 0.5
const effectiveAfterburnerBonus = AFTERBURNER.EXPLOSION_RISK_BONUS * (1 - thermalReduction);
if (afterburnerActive) {
  baseExplosionChance += effectiveAfterburnerBonus;
}
```

**Severity**: 🔴 **Critical** - Balance cliff in late-game

---

### 3. 🟠 BALANCE: Station Science Scale Exponential Growth

**Location**: `useGameStore.ts:584-590`, `gameConstants.ts:101`

**Code**:
```typescript
// Nova Perk: Each station level adds +2% global science
const stationScienceScale = state.getCompanyPerkValue('stationScienceScale');  // Returns 0.02
if (stationScienceScale > 0 && totalStationLevels > 0) {
  const scienceMultiplier = 1 + (totalStationLevels * stationScienceScale);
  sciProd *= scienceMultiplier;
}
```

**Scaling Analysis**:
```
Early Game (1 station, level 1):
  totalStationLevels = 1
  Multiplier = 1 + (1 * 0.02) = 1.02x ✓ Reasonable

Mid Game (5 stations, avg level 5):
  totalStationLevels = 25
  Multiplier = 1 + (25 * 0.02) = 1.5x ✓ Good

Late Game (10 stations, avg level 10):
  totalStationLevels = 100
  Multiplier = 1 + (100 * 0.02) = 3.0x ⚠️ Strong

Very Late Game (20 stations, level 20):
  totalStationLevels = 400
  Multiplier = 1 + (400 * 0.02) = 9.0x ❌ Exponential explosion
```

**Impact**:
- Science production becomes dominated by single effect
- Player who levels stations gets 9x science bonus; player who doesn't gets baseline
- Could create runaway progression or bottleneck if player focuses on contracts instead

**Mitigation Options**:

**Option A: Add Soft Cap**
```typescript
const scienceMultiplier = 1 + Math.min(totalStationLevels * 0.02, 3.0);  // Cap at 3.0x
```

**Option B: Logarithmic Scaling**
```typescript
const scienceMultiplier = 1 + (Math.log(totalStationLevels + 1) * 0.5);  // Diminishing returns
```

**Option C: Change Perk Value**
```typescript
// Reduce from 0.02 to 0.01 (1% instead of 2%)
{ level: 6, name: 'Orbital Labs', description: 'Each station level adds +1% global science', 
  effect: 'stationScienceScale', value: 0.01 }
```

**Severity**: 🟠 **Balance** - Potential late-game dominance

---

### 4. 🟠 BALANCE: Global Money Multiplier Lacks Competition

**Location**: `gameConstants.ts:83`, `useGameStore.ts:544-548`

**Code**:
```typescript
// Titan Level 6 - Only company with global money effect
{ level: 6, name: 'Monopoly', description: '+25% global money production', 
  effect: 'globalMoneyMultiplier', value: 1.25 }

// Application (useGameStore.ts)
const globalMoneyMultiplier = state.getCompanyPerkValue('globalMoneyMultiplier');
if (globalMoneyMultiplier > 1) {
  cargoProd *= globalMoneyMultiplier;  // Applies to money production
}
```

**Issue**:
- Only Titan has money multiplier (no competing mechanic from other companies)
- Applies to ALL money sources: contracts, passive income, everything
- Late-game players with Titan level 6+ get permanent 25% bonus

**Comparison**:
```
Titan Money: 1.25x (no cap, always active)
Zenith Station Bonus: 1.40x (only for station-docked contracts)
Nova Orbital Labs: 3.0x+ (only for science)
Galactic Refinery Output: 1.25x (only for fuel)
```

**Problem**:
- Zenith must actively manage stations; Titan gets automatic bonus
- Money scales faster than science or fuel with no gameplay requirement
- Reduces incentive to use other companies

**Recommendation**:
- Consider adding competing money effect from another company (e.g., Atlas gets build batch efficiency → faster money)
- OR require Titan contracts to be active for bonus (like station docking)
- OR reduce to 15% (-5%) to lower dominance

**Severity**: 🟠 **Balance** - Lacks competitive tension

---

### 5. 🟡 CODE QUALITY: Confusing Variable Naming

**Location**: `useGameStore.ts:494-520`

**Problem**:
```typescript
let cargoProd = successfulCargoLaunches * state.profitPerRocket * profitMultiplier;
// Variable named `cargoProd` but contains MONEY, not cargo

// Later:
const passiveMoneyBonus = state.getCompanyPerkValue('passiveMoneyBonus');
cargoProd += passiveMoneyBonus;  // ← Correct logic, but name is misleading

// vs.
let cargoResourceProd = successfulCargoLaunches * ... ;  // Different variable for actual cargo
```

**Impact**:
- Developers (or future AI reviewers) get confused about what variable contains what
- Can lead to bugs if values are used in wrong context
- Makes code harder to audit for correctness

**Fix**:
```typescript
// Rename for clarity
let moneyProduction = successfulCargoLaunches * state.profitPerRocket * profitMultiplier;
moneyProduction += state.getCompanyPerkValue('passiveMoneyBonus');

let cargoProduction = successfulCargoLaunches * ... ;
```

**Severity**: 🟡 **Code Quality** - Not a bug, but maintenance risk

---

### 6. 🟡 CODE QUALITY: Inconsistent Effect Value Semantics

**Location**: `gameConstants.ts` (mixed patterns), `useGameStore.ts` (effect application)

**Problem**: Three different value semantics are used without clear distinction:

**Pattern 1: Multiplier Format** (most common)
```typescript
{ level: 1, name: 'Startup Grant', effect: 'profitMultiplier', value: 1.05 }  // +5%
{ level: 2, name: 'Profit Margins', effect: 'profitMultiplier', value: 1.10 }  // +10%
// Additive stacking: 1.05 * 1.10 = 1.155x total
```

**Pattern 2: Flat Bonus Format**
```typescript
{ level: 9, name: 'Passive Income', effect: 'passiveMoneyBonus', value: 25 }  // +25/tick
{ level: 10, name: 'Mining Empire', effect: 'passiveMoneyBonus', value: 50 }  // +50/tick
// Additive stacking: 25 + 50 = 75/tick total
```

**Pattern 3: Absolute Target Format** (confusing!)
```typescript
{ level: 9, name: 'Flow Control', effect: 'afterburnerEfficiency', value: 2.0 }  // NOT +2.0x
// This is the TARGET multiplier (fuel cost becomes 2.0x instead of 3.0x)
// Applied as: baseFuelCost *= afterburnerEfficiency;
```

**Impact**:
- New perk values are hard to calibrate (which format applies?)
- Bug risk: someone adds `afterburnerOutput` thinking it's additive but it's absolute
- Documentation mismatch: description says "reduced to 2.0x" but value is also 2.0

**Recommendation**:
Create explicit semantic documentation:
```typescript
/**
 * COMPANY PERK VALUE SEMANTICS:
 * 
 * Multiplier effects (effect name ends with 'Multiplier'):
 *   value: 1.05 means multiply by 1.05 (add 5%)
 *   Stacking: multiplicative (1.05 * 1.10 = 1.155)
 * 
 * Bonus effects (effect name ends with 'Bonus'):
 *   value: 25 means add 25 (flat increase)
 *   Stacking: additive (25 + 50 = 75)
 * 
 * Absolute effects (special cases - should avoid!):
 *   value: 2.0 means REPLACE with 2.0 (not additive/multiplicative)
 *   Used for: afterburnerEfficiency, afterburnerOutput
 *   Stacking: last-wins (only one perk per company level)
 */
```

**Severity**: 🟡 **Code Quality** - Documentation/clarity issue

---

### 7. Type System Mismatch (Design Note, Not a Bug)

**Location**: `gameConstants.ts` (CompanyPerkEffect), `researchTree.ts` (EffectType)

**Overview**:
```
CompanyPerkEffect Union: 24 types
  - profitMultiplier, rocketCostMultiplier, passiveMoneyBonus, etc.

EffectType Union: 63 types
  - All 24 above +
  - debrisImmunity, unlockMoonMissions, contractRefreshMultiplier, etc.
  - stationScienceScale, thermalShielding, etc.

Overlap: ~20 types share both systems
Unique to Research: ~43 types
Unique to Perks: ~4 types
```

**Implication**:
Some gameplay systems ONLY scale via research (e.g., `debrisImmunity`), while others ONLY scale via perks (e.g., `stationScienceScale`). This creates segregated progression paths with no cross-synergy.

**Not a bug, but consider for future design**: Would dual-path scaling (perk + research both apply) create better player agency?

**Severity**: 🟡 **Design Note** - Not actionable, but worth monitoring

---

## Summary Table

| Issue | File | Line | Severity | Recommendation |
|-------|------|------|----------|---|
| Lunar costs not multiplied | useGameStore.ts | 1782 | 🔴 Critical | Apply researchCostMultiplier |
| Thermal shielding binary | useGameStore.ts | 358-361 | 🔴 Critical | Use gradient reduction (0.5) |
| Station science exponential | useGameStore.ts | 590 | 🟠 Balance | Add cap or reduce multiplier |
| Global money dominance | gameConstants.ts | 83 | 🟠 Balance | Add competing effect or nerf |
| Confusing variable names | useGameStore.ts | 494 | 🟡 Code Quality | Rename cargoProd to moneyProduction |
| Inconsistent value semantics | gameConstants.ts | mixed | 🟡 Code Quality | Add documentation clarifying semantics |

---

## Recommendations (Priority Order)

### High Priority (Fix ASAP)
1. ✅ **Fix lunar cost multiplier** (1-line change, resolves unfair scaling)
2. ✅ **Refactor thermal shielding** (3-line change, fixes balance cliff)

### Medium Priority (Improve Design)
3. ⚠️ **Add cap to station science scaling** (prevents late-game exponential explosion)
4. ⚠️ **Review global money multiplier** (consider adding competing mechanic or soft cap)

### Low Priority (Improve Maintainability)
5. 📝 **Improve variable naming** (cargoProd → moneyProduction)
6. 📝 **Document effect value semantics** (add JSDoc comments)

---

## Test Cases to Add

```typescript
// Test 1: Verify lunar costs apply multiplier
test('researching lunar nodes applies researchCostMultiplier', () => {
  store.setState({ settings: { researchedNodes: ['nova-8'] } }); // -15% cost
  const cost = store.getState().getMoonBuildingCost('solarArray');
  expect(cost.helium3).toBeLessThan(100); // Should be reduced
});

// Test 2: Verify thermal shielding reduces (not eliminates) explosion bonus
test('thermalShielding reduces afterburner explosion (not eliminates)', () => {
  // Setup: Aegis level 5, afterburner active
  // Before: baseExplosion + 5%
  // After: baseExplosion + 2.5% (50% mitigation)
  expect(explosionChance).toBeLessThan(baseExplosion + 5%);
  expect(explosionChance).toBeGreaterThan(baseExplosion);
});

// Test 3: Verify station science multiplier caps at reasonable value
test('stationScienceScale multiplier caps at 3.0x', () => {
  store.setState({ spaceStations: [...20 stations at level 20] });
  const multiplier = store.getState().getEffectMultiplier('stationScienceScale');
  expect(multiplier).toBeLessThanOrEqual(3.0);
});
```

---

## Conclusion

The company perks and research system is fundamentally **well-designed** with strong architectural patterns:
- ✅ Clear separation of concerns
- ✅ Type-safe effect definitions
- ✅ Flexible multi-level research
- ✅ Dual progression paths (research + perks)

However, there are **two critical balance issues** that should be addressed before late-game playtesting:
1. Lunar resource costs not respecting multipliers (unfair progression)
2. Thermal shielding being binary instead of gradient (balance cliff)

And **three balance considerations** to monitor:
- Station science scale potential exponential growth
- Global money multiplier lacking competitive tension
- General late-game runaway scaling risk

With these fixes in place, the system is production-ready.

---

**End of Review**
