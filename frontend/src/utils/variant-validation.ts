/**
 * Check if variant labels have duplicates
 * @param variants Array of variants to check
 * @returns Object with duplicate information
 */
export function findDuplicateLabels(variants: Array<{ label?: string }>): {
  hasDuplicates: boolean;
  duplicateLabels: string[];
  duplicateIndices: Map<string, number[]>;
} {
  const labelIndices = new Map<string, number[]>();
  
  // Build map of labels to their indices
  variants.forEach((variant, index) => {
    if (variant.label?.trim()) {
      const normalizedLabel = variant.label.toLowerCase().trim();
      if (!labelIndices.has(normalizedLabel)) {
        labelIndices.set(normalizedLabel, []);
      }
      labelIndices.get(normalizedLabel)!.push(index);
    }
  });
  
  // Find duplicates
  const duplicateLabels: string[] = [];
  const duplicateIndices = new Map<string, number[]>();
  
  labelIndices.forEach((indices, label) => {
    if (indices.length > 1) {
      duplicateLabels.push(label);
      duplicateIndices.set(label, indices);
    }
  });
  
  return {
    hasDuplicates: duplicateLabels.length > 0,
    duplicateLabels,
    duplicateIndices,
  };
}

/**
 * Validate if a specific variant label is unique
 * @param variants Array of all variants
 * @param index Index of the variant to check
 * @param label Label to validate
 * @returns true if valid, error message if duplicate
 */
export function validateUniqueLabel(
  variants: Array<{ label?: string }>,
  index: number,
  label: string
): true | string {
  if (!label.trim()) return true; // Let required validation handle empty values
  
  const normalizedLabel = label.toLowerCase().trim();
  const isDuplicate = variants.some((variant, i) => 
    i !== index && variant.label?.toLowerCase().trim() === normalizedLabel
  );
  
  return isDuplicate ? 'Label must be unique' : true;
}