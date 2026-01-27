// lib/normalizeShopName.ts

/**
 * Normalize shop name to create a unique identifier.
 * This function handles various variations of the same shop name:
 * - "OM sharma" → "omsharma"
 * - "OM SHARMA" → "omsharma"
 * - "Om Sharma Shop" → "omsharma"
 * - "OM SHARMA SHOP" → "omsharma"
 * - "om-sharma" → "omsharma"
 * - "Om  Sharma   Store" → "omsharma"
 * 
 * @param shopName - The original shop name
 * @returns Normalized shop name for comparison/lookup
 */
export function normalizeShopName(shopName: string): string {
  if (!shopName) return "";
  
  // Common suffix words to remove
  const suffixWords = [
    "shop",
    "store",
    "stores",
    "mart",
    "market",
    "enterprise",
    "enterprises",
    "traders",
    "trading",
    "provision",
    "provisions",
    "kirana",
    "general",
    "dairy",
    "bakery",
    "supermarket",
    "super",
  ];
  
  let normalized = shopName
    // Convert to lowercase
    .toLowerCase()
    // Remove special characters (keep only alphanumeric)
    .replace(/[^a-z0-9\s]/gi, "")
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    // Trim whitespace
    .trim();
  
  // Remove common suffix words from the end
  for (const suffix of suffixWords) {
    // Remove suffix if it's at the end (as a separate word)
    const suffixRegex = new RegExp(`\\s+${suffix}$`, "i");
    normalized = normalized.replace(suffixRegex, "");
    
    // Also check if the entire name ends with the suffix (no space)
    if (normalized.endsWith(suffix) && normalized.length > suffix.length) {
      const beforeSuffix = normalized.slice(0, -suffix.length);
      // Only remove if there's something before the suffix
      if (beforeSuffix.trim()) {
        normalized = beforeSuffix.trim();
      }
    }
  }
  
  // Remove all remaining spaces to create final normalized key
  normalized = normalized.replace(/\s+/g, "");
  
  return normalized;
}

/**
 * Check if two shop names are equivalent after normalization
 * @param shopName1 - First shop name
 * @param shopName2 - Second shop name
 * @returns true if they normalize to the same value
 */
export function areShopNamesEquivalent(shopName1: string, shopName2: string): boolean {
  return normalizeShopName(shopName1) === normalizeShopName(shopName2);
}

/**
 * Create a unique key for a shop based on normalized shop name
 * @param shopName - The shop name
 * @returns A normalized key for lookups
 */
export function createShopKey(shopName: string): string {
  return normalizeShopName(shopName);
}
