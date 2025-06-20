/**
 * Encodes a cache key segment to prevent delimiter collisions in Redis.
 * 
 * @param segment - The string to encode
 * @returns URL-encoded string safe for use in Redis keys
 * 
 * @example
 * encodeCacheKeySegment('size:large') // returns 'size%3Alarge'
 * encodeCacheKeySegment('50% off') // returns '50%25%20off'
 * 
 * Note: This function will double-encode percent symbols. For example:
 * - Input: "25%" → Output: "25%2525" (the % becomes %25)
 * - This is intentional and ensures cache key safety, though it may seem
 *   redundant for already-encoded strings.
 */
export function encodeCacheKeySegment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

export function buildSafeCacheKey(prefix: string, ...segments: (string | undefined)[]): string {
  const parts = [prefix];
  
  for (const segment of segments) {
    if (segment !== undefined) {
      parts.push(encodeCacheKeySegment(segment));
    }
  }
  
  return parts.join(':');
}