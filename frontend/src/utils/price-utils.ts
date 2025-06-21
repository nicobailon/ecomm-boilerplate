/**
 * Utility functions for handling price calculations and formatting
 */

/**
 * Rounds a monetary value to 2 decimal places (cents)
 * Uses parseFloat(toFixed(2)) pattern to ensure proper decimal representation
 * 
 * @param value The monetary value to round
 * @returns The value rounded to 2 decimal places
 * 
 * @example
 * roundToCents(10.999) // 11
 * roundToCents(10.994) // 10.99
 * roundToCents(10.995) // 11
 */
export function roundToCents(value: number): number {
  return parseFloat(value.toFixed(2));
}