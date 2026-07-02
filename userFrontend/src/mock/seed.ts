// Deterministic pseudo-random helpers so the generated catalog is identical on
// every load (stable IDs, ratings, images) without committing 100 hand-written
// venue objects. A real backend would serve this data instead.

/** mulberry32 — small, fast, seeded PRNG. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return function rng(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickMany<T>(rng: () => number, arr: readonly T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function round(value: number, step: number): number {
  return Math.round(value / step) * step;
}

const W = 1200;
const Q = 80;
function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${W}&q=${Q}`;
}

// Curated Unsplash imagery grouped loosely by venue style.
export const VENUE_IMAGE_POOL: string[] = [
  '1519167758481-83f550bb49b3',
  '1464366400600-7168b8af9bc3',
  '1511795409834-ef04bbd61622',
  '1492684223066-81342ee5ff30',
  '1505236858219-8359eb29e329',
  '1540575467063-178a50c2df87',
  '1517457373958-b7bdd4587205',
  '1497366216548-37526070297c',
  '1431540015161-0bf868a2d407',
  '1519671482749-fd09be7ccebf',
  '1530103862676-de8c9debad1d',
  '1464047736614-af63643285bf',
  '1469371670807-013ccf25f16a',
  '1522413452208-996ff3f3e740',
  '1519225421980-715cb0215aed',
  '1478146059778-26028b07395a',
  '1414235077428-338989a2e8c0',
  '1533174072545-7a4b6ad7a6c3',
  '1542665952-14513db15293',
  '1505373877841-8d25f7d46678',
  '1519750783826-e2420f4d687f',
  '1551218808-94e220e084d2',
  '1533090161767-e6ffed986c88',
  '1556035511-3168381de4ef',
].map(unsplash);

export const AVATAR_POOL: string[] = [
  '1535713875002-d1d0cf377fde',
  '1494790108377-be9c29b29330',
  '1500648767791-00dcc994a43e',
  '1438761681033-6461ffad8d80',
  '1507003211169-0a1dd7228f2d',
  '1544005313-94ddf0286df2',
  '1599566150163-29194dcaad36',
  '1607746882042-944635dfe10e',
  '1573497019940-1c28c88b4f3e',
  '1580489944761-15a19d654956',
].map((id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=200&q=80`);

export function imageAt(index: number): string {
  return VENUE_IMAGE_POOL[index % VENUE_IMAGE_POOL.length];
}
