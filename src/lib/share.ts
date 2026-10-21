import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
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
    const g = parsed?.g as Group;
    if (!g || typeof g.id !== 'string' || !Array.isArray(g.members) || !Array.isArray(g.expenses)) return null;
    return g;
  } catch {
    return null;
  }
}
