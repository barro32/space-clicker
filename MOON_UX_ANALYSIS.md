# Moon Layer Gameplay UX Analysis
## Space Rocket Idle Game - Comprehensive Review

**Date:** January 29, 2026  
**Analyzed Files:**
- `/src/MoonView.tsx` (445 lines) - Main UI component
- `/src/useGameStore.ts` (2045 lines) - State management and logic
- `/src/gameConstants.ts` (449 lines) - Game balance and configuration
- `/src/researchTree.ts` (813 lines) - Research system
- `/src/App.tsx` (1000+ lines) - Main application layout

---

## Executive Summary

The Moon layer has an **excellent technical foundation** with clear progression paths, meaningful mechanics, and good visual hierarchy. However, the UX suffers from **critical information gaps** and **poor discoverability**, particularly around:

1. **No contextual guidance** - Players don't understand WHY they're building something
2. **Hidden mechanics** - Power system, hazards, and sector traits are mentioned but not explained
3. **Fragmented information** - Key details scattered across different UI sections
4. **No early feedback loop** - Players can build but don't see immediate impact
5. **Opaque research integration** - Moon research effects aren't clearly labeled or explained

---

## Critical UX Issues Summary

### 🔴 CRITICAL FIXES NEEDED (Impacts 50%+ of players)

1. **No Tooltips on Buildings** (MoonView.tsx lines 311-357)
   - Players don't know what buildings do
   - Need: Hover tooltips explaining production rates

2. **No Production Rate Display** (MoonView.tsx lines 369-397)
   - Players can't see if they're making progress
   - Need: "Production: +127 Regolith/tick, +12.5 He-3/tick"

3. **Sector Traits Not Explained** (MoonView.tsx lines 268-277)
   - Traits listed but multiplier values hidden
   - Need: Show actual values: "Regolith Rich (×1.5 to Extractors)"

4. **Power System Not Explained** (MoonView.tsx lines 399-417)
   - Players don't understand why production stops
   - Need: Warning when power deficit exists

5. **Bounties Are Invisible** (MoonView.tsx - NO BOUNTY UI)
   - Entire bounty system implemented but not shown
   - Need: Add bounty panel with accept/decline buttons

---

[FULL DOCUMENT CONTINUES - See file for complete analysis]

