import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { normalizeGroup } from './normalize';
import type { Group } from './types';

// A group travels inside the link itself (no server), compressed to keep it short.

export function encodeGroup(g: Group): string {
  return compressToEncodedURIComponent(JSON.stringify({ v: 1, g }));
}

export function decodeGroup(data: string): Group | null {
  try {
    const json = decompressFromEncodedURIComponent(data);
    if (!json) return null;
    const parsed = JSON.parse(json);
    const g = parsed?.g;
    if (!g || !Array.isArray(g.members) || !Array.isArray(g.expenses)) return null;
    return normalizeGroup(g);
  } catch {
    return null;
  }
}
