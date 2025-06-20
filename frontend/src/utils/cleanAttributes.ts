export function cleanVariantAttributes(
  attributes?: Record<string, string | undefined>
): Record<string, string> | undefined {
  if (!attributes) return undefined;
  
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}