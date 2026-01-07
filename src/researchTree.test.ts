import { describe, it, expect } from 'vitest';
import { researchTree } from './researchTree.js';

describe('Research Tree Configuration', () => {
  it('should have nodes for all branches', () => {
    const branches = new Set(researchTree.map(n => n.branch));
    expect(branches.has('propulsion')).toBe(true);
    expect(branches.has('infrastructure')).toBe(true);
    expect(branches.has('commercial')).toBe(true);
    expect(branches.has('orbital')).toBe(true);
  });

  it('should have unique IDs for all nodes', () => {
    const ids = researchTree.map(n => n.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have valid prerequisites', () => {
    const allIds = new Set(researchTree.map(n => n.id));
    researchTree.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        expect(allIds.has(prereqId)).toBe(true);
      });
    });
  });
});
