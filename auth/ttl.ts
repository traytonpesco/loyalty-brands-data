// Very small TTL parser supporting m,h,d suffixes
export function addMs(ttl: string): number {
  const m = ttl.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const u = m[2];
  switch (u) {
    case 'ms': return n;
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}
